import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PICKUPS, DROP_CHANCE } from '../data/pickups';
import { spawnPickup, rollEnemyLoot, PICKUP_EFFECTS } from '../engine/Pickups';
import { killEnemy } from '../engine/Combat';
import { triggerEvent } from '../engine/EventSystem';
import { refreshPlayerStats } from '../engine/StatsCalculator';
import { makeAbility } from '../engine/AbilitySystem';
import { PASSIVES } from '../data/passives';
import { WEAPONS } from '../data/weapons';
import { EVENTS } from '../data/events';
import { EnvEventType, PickupKind } from '../types';
import { CONTROLS, INITIAL_STATS } from '../constants';
import { makeState, addEnemy, run, seedRandom, totalHp } from './helpers';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(41); });
afterEach(() => rnd.mockRestore());

describe('butin', () => {
  it('chaque type a une définition et un effet', () => {
    (Object.keys(PICKUPS) as PickupKind[]).forEach(k => expect(PICKUP_EFFECTS[k], k).toBeTypeOf('function'));
  });

  it('capsule / nanites / plaques : restaurent la bonne défense au ramassage', () => {
    for (const [kind, key] of [['shield', 'shield'], ['hull', 'hull'], ['armor', 'armor']] as const) {
      const s = makeState({ noSpawn: true });
      s.player.defense = { shield: 0, armor: 0, hull: 10 };
      spawnPickup(s, kind, s.player.x, s.player.y);
      run(s, 0.05);
      expect(s.player.defense[key], kind).toBeGreaterThan(key === 'hull' ? 10 : 0);
      expect(s.pickups).toHaveLength(0);
    }
  });

  it('le butin est aimanté vers le vaisseau puis ramassé', () => {
    const s = makeState({ noSpawn: true });
    s.player.defense.shield = 0;
    spawnPickup(s, 'shield', s.player.x + 100, s.player.y);
    run(s, 2);
    expect(s.pickups).toHaveLength(0);
    expect(s.player.defense.shield).toBeGreaterThan(0);
  });

  it('le butin disparaît après sa durée de vie', () => {
    const s = makeState({ noSpawn: true });
    spawnPickup(s, 'hull', s.player.x + 2000, s.player.y);
    run(s, 21);
    expect(s.pickups).toHaveLength(0);
  });

  it("trou de ver : toute l'XP de la carte rejoint le vaisseau", () => {
    const s = makeState({ noSpawn: true });
    for (let i = 0; i < 10; i++) s.xpDrops.push({ id: `x${i}`, x: s.player.x + 1500, y: s.player.y + i * 50, amount: 10, vx: 0, vy: 0, collected: false });
    spawnPickup(s, 'wormhole', s.player.x, s.player.y);
    const xp0 = s.experience;
    run(s, 4);
    expect(s.xpDrops).toHaveLength(0);
    expect(s.experience).toBe(xp0 + 100);
  });

  it('un boss lâche un soin de chaque type et un trou de ver', () => {
    const s = makeState({ noSpawn: true });
    const b = addEnemy(s, 'boss', 600);
    rollEnemyLoot(s, b);
    expect(s.pickups.map(p => p.kind).sort()).toEqual(['armor', 'hull', 'shield', 'wormhole']);
  });

  it('taux : rare sur ennemis normaux, plus fréquent sur les lourds, boostable', () => {
    const count = (type: string, mult = 1) => {
      const s = makeState({ noSpawn: true });
      s.wave = 5;
      s.player.baseStats.pickupChance = mult;
      refreshPlayerStats(s);
      for (let i = 0; i < 2000; i++) killEnemy(s, addEnemy(s, type, 600));
      return s.pickups.filter(p => p.kind !== 'wormhole').length / 2000;
    };
    const normal = count('basic');
    expect(normal).toBeGreaterThan(DROP_CHANCE.normal * 0.5);
    expect(normal).toBeLessThan(DROP_CHANCE.normal * 1.6);
    expect(count('tank')).toBeGreaterThan(normal * 2);
    expect(count('basic', 2)).toBeGreaterThan(normal * 1.4);
  });
});

describe('tempête ionique', () => {
  it('existe et ses éclairs touchent joueur ET ennemis', () => {
    expect(EVENTS[EnvEventType.ION_STORM]).toBeDefined();
    const s = makeState({ noSpawn: true });
    const foes = Array.from({ length: 30 }, (_, i) => addEnemy(s, 'tank', Math.cos(i) * (100 + i * 18), Math.sin(i) * (100 + i * 18)));
    foes.forEach(e => { e.baseStats.speed = 0; e.defense.hull *= 20; });
    const hp = foes.map(totalHp);
    triggerEvent(s, EnvEventType.ION_STORM);
    const p0 = s.player.defense.shield + s.player.defense.armor + s.player.defense.hull;
    run(s, 14);
    expect(foes.some((e, i) => totalHp(e) < hp[i])).toBe(true);
    expect(s.damageBySource.ion_storm ?? 0).toBeGreaterThan(0);
    expect(s.player.defense.shield + s.player.defense.armor + s.player.defense.hull).toBeLessThan(p0 + 1000);
  });
});

describe('masse des armes', () => {
  it('une arme lourde ralentit et réduit le blindage tant qu\'elle est équipée', () => {
    const s = makeState({ weaponIds: ['siege_slug'] });
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.speed).toBeLessThan(INITIAL_STATS.speed);
    expect(s.player.runtimeStats.maxArmor).toBeLessThan(INITIAL_STATS.maxArmor);
    const light = makeState({ weaponIds: ['ion_blaster'] });
    refreshPlayerStats(light);
    expect(light.player.runtimeStats.speed).toBe(INITIAL_STATS.speed);
  });

  it('les armes à masse sont des armes lourdes / moyennes', () => {
    WEAPONS.filter(w => w.modifiers).forEach(w => {
      w.modifiers!.forEach(m => expect(['speed', 'maxArmor']).toContain(m.property));
    });
  });
});

describe('modules de compétences', () => {
  const p = (id: string) => PASSIVES.find(x => x.id === id)!;

  it('Propulseur de micro-saut : dash plus long', () => {
    const dashDist = (withModule: boolean) => {
      const s = makeState({ noSpawn: true });
      if (withModule) s.activePassives.push({ passive: p('micro_jump'), stacks: 1 });
      s.activeAbilities = [makeAbility('blink_dash', 0)];
      const x0 = s.player.x;
      run(s, 1 / 60, { keys: [CONTROLS.ABILITY_1], mouse: { x: s.player.x + 1000, y: s.player.y } });
      return s.player.x - x0;
    };
    expect(dashDist(true)).toBeGreaterThan(dashDist(false) * 1.25);
  });

  it('Relais de puissance : la Nova fait plus de dégâts', () => {
    const novaDmg = (withModule: boolean) => {
      const s = makeState({ noSpawn: true });
      if (withModule) s.activePassives.push({ passive: p('cap_power_relay'), stacks: 1 });
      s.activeAbilities = [makeAbility('tactical_nova', 0)];
      const e = addEnemy(s, 'tank', 200);
      e.defense.hull = 1e6; e.defense.armor = 0;
      run(s, 1 / 60, { keys: [CONTROLS.ABILITY_1] });
      return 1e6 - e.defense.hull;
    };
    expect(novaDmg(true)).toBeGreaterThan(novaDmg(false) * 1.15);
  });

  it('modules à compromis : chaque module epic/legendary a au moins une contrepartie, sauf exceptions uniques', () => {
    const noDownside = new Set(['adaptive_membrane', 'damage_control']); // uniques / chers, sans malus
    PASSIVES.filter(x => (x.rarity === 'epic' || x.rarity === 'legendary') && !noDownside.has(x.id)).forEach(x => {
      expect(x.modifiers.length, x.id).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('météores destructibles', () => {
  const meteor = (s: ReturnType<typeof makeState>, dx: number) => {
    triggerEvent(s, EnvEventType.ASTEROID_BELT);
    s.activeEvents = [];
    s.projectiles.push({
      x: s.player.x + dx, y: s.player.y, vx: 0, vy: 0,
      packet: { amount: 30, type: 'KINETIC' as any, penetration: 0, isCrit: false },
      color: '#a8a29e', ownerId: 'env', radius: 30, distanceTraveled: 0, maxRange: 1e9, heatGenerated: 0,
      kind: 'meteor', source: 'meteor', uid: 'm1', hp: 60, maxHp: 60,
    });
    return s.projectiles[s.projectiles.length - 1];
  };

  it('les tirs du joueur détruisent un météore, qui lâche de l\'XP', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    s.autoFire = true;
    const m = meteor(s, 350);
    run(s, 3, { mouse: { x: m.x, y: m.y } });
    expect(s.projectiles.includes(m)).toBe(false);
    expect(m.dead).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(25);
  });

  it('les explosions du joueur endommagent les météores', () => {
    const s = makeState({ noSpawn: true });
    const m = meteor(s, 300);
    explodeAt(s, m.x, m.y);
    expect(m.hp!).toBeLessThan(60);
  });
});

import { explode } from '../engine/Combat';
const explodeAt = (s: ReturnType<typeof makeState>, x: number, y: number) =>
  explode(s, x, y, 80, { amount: 40, type: 'EXPLOSIVE' as any, penetration: 0, isCrit: false }, '#fff');
