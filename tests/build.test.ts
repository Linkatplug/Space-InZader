import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KEYSTONES } from '../data/keystones';
import { SHIPS, getShip } from '../data/ships';
import { SYNERGIES } from '../data/synergies';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { INITIAL_STATS } from '../constants';
import { createInitialState } from '../engine/GameFactory';
import { refreshPlayerStats } from '../engine/StatsCalculator';
import { synergyStatus, activeMechanics } from '../engine/Synergies';
import { rollUpgradeOptions, KEYSTONE_LEVEL_INTERVAL } from '../engine/Progression';
import { damageEnemy } from '../engine/Combat';
import { DamageType } from '../types';
import { makeState, addEnemy, run, seedRandom } from './helpers';

const ks = (id: string) => KEYSTONES.find(k => k.id === id)!;
const hit = (amount: number) => ({ amount, type: DamageType.KINETIC, penetration: 0, isCrit: false });

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(99); });
afterEach(() => rnd.mockRestore());

describe('vaisseaux', () => {
  it('données valides : arme de départ et keystone signature existent', () => {
    for (const s of SHIPS) {
      expect(WEAPONS.some(w => w.id === s.startingWeapon), s.id).toBe(true);
      expect(KEYSTONES.some(k => k.id === s.signatureKeystone), s.id).toBe(true);
      Object.keys(s.stats).forEach(k => expect(Object.keys(INITIAL_STATS)).toContain(k));
    }
  });

  it.each(SHIPS.map(s => [s.id]))('%s : stats et arme de départ appliquées', (id) => {
    const s = createInitialState(id);
    const ship = getShip(id);
    expect(s.shipId).toBe(id);
    expect(s.activeWeapons[0].id).toBe(ship.startingWeapon);
    for (const [k, v] of Object.entries(ship.stats)) expect((s.player.baseStats as any)[k]).toBe(v);
    expect(s.player.defense.hull).toBe(s.player.baseStats.maxHull);
  });

  it('la keystone signature est proposée en premier au palier', () => {
    for (const ship of SHIPS) {
      const s = createInitialState(ship.id);
      s.level = KEYSTONE_LEVEL_INTERVAL - 1;
      expect(rollUpgradeOptions(s)[0].item.id).toBe(ship.signatureKeystone);
    }
  });
});

describe('keystones conditionnelles', () => {
  it('Protocole Surchauffe : actif seulement au-dessus de 80% de chaleur', () => {
    const s = makeState();
    s.keystones.push(ks('overheat_protocol'));
    s.heat = 0;
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(1);
    s.heat = s.maxHeat * 0.9;
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(1.5);
  });

  it('Moteur de Rage : ×2 dégâts sous 30% de coque', () => {
    const s = makeState();
    s.keystones.push(ks('rage_engine'));
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(1);
    s.player.defense.hull = s.player.runtimeStats.maxHull * 0.2;
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(2);
    expect(s.player.runtimeStats.speed).toBeCloseTo(INITIAL_STATS.speed * 1.3);
  });

  it('Mode Forteresse : réduction des dégâts une fois immobile', () => {
    const s = makeState({ noSpawn: true });
    s.keystones.push(ks('fortress_mode'));
    run(s, 0.2);
    expect(s.player.runtimeStats.dmgTakenMult).toBeCloseTo(1);
    run(s, 1);
    expect(s.player.runtimeStats.dmgTakenMult).toBeCloseTo(0.5);
    run(s, 0.1, { keys: ['d'] });
    expect(s.player.runtimeStats.dmgTakenMult).toBeCloseTo(1);
  });

  it('Œil Mort : +15% par impact consécutif (max 8), remis à zéro', () => {
    const s = makeState({ noSpawn: true });
    s.keystones.push(ks('dead_eye'));
    const e = addEnemy(s, 'tank', 500);
    e.defense.hull = 1e9;
    for (let i = 0; i < 12; i++) damageEnemy(s, e, hit(1), { direct: true });
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(1 + 0.15 * 8);
    s.hitStreak = 0;
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.damageMult).toBeCloseTo(1);
  });

  it('Frénésie Sanguine : vol de vie qui soigne la coque', () => {
    const s = makeState({ noSpawn: true });
    s.keystones.push(ks('blood_frenzy'));
    s.player.defense.hull = 50;
    const e = addEnemy(s, 'tank', 500);
    e.defense.hull = 1e9; e.defense.armor = 0;
    for (let i = 0; i < 40; i++) { damageEnemy(s, e, hit(10), { direct: true }); refreshPlayerStats(s); }
    expect(s.player.defense.hull).toBeGreaterThan(50);
  });

  it('Frénésie Sanguine : les cumuls retombent après 3s sans toucher', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    s.onHitStacks = 20;
    s.lastHitTime = 0;
    run(s, 3.5);
    expect(s.onHitStacks).toBe(0);
  });
});

describe('synergies', () => {
  it('données : paliers triés, ids uniques', () => {
    expect(new Set(SYNERGIES.map(s => s.id)).size).toBe(SYNERGIES.length);
    SYNERGIES.forEach(s => s.tiers.forEach((t, i) => i > 0 && expect(t.count).toBeGreaterThan(s.tiers[i - 1].count)));
  });

  it('chaque synergie est atteignable avec le contenu existant', () => {
    for (const syn of SYNERGIES) {
      const items = [...WEAPONS, ...PASSIVES].filter(i => i.tags.some(t => syn.tags.includes(t)));
      expect(items.length, syn.id).toBeGreaterThanOrEqual(syn.tiers[0].count);
    }
  });

  it('Balistique : 2 armes cinétiques → +6% critique ; 6 → les critiques explosent', () => {
    const kinetic = WEAPONS.filter(w => w.tags.includes('Kinetic' as any)).map(w => w.id);
    const s2 = makeState({ weaponIds: kinetic.slice(0, 2) });
    refreshPlayerStats(s2);
    expect(s2.player.runtimeStats.critChance).toBeCloseTo(INITIAL_STATS.critChance + 0.06);
    const s6 = makeState({ weaponIds: kinetic.slice(0, 6) });
    expect(synergyStatus(s6).find(x => x.synergy.id === 'kinetic')!.count).toBe(6);
    expect(activeMechanics(s6)).toContain('critExplosion');
  });

  it('Explosif niveau 6 : un ennemi tué explose et blesse ses voisins', () => {
    const s = makeState({ noSpawn: true });
    s.mechanics = ['chainExplosion'];
    const a = addEnemy(s, 'basic', 400);
    const b = addEnemy(s, 'tank', 440);
    const hpB = b.defense.armor + b.defense.hull;
    damageEnemy(s, a, hit(1e6));
    expect(b.defense.armor + b.defense.hull).toBeLessThan(hpB);
  });

  it('Essaim : +1 drone', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['em_drone_wing', 'drone_swarm'] });
    run(s, 0.1);
    expect(s.player.runtimeStats.extraDrones).toBe(1);
    expect(s.drones.length).toBe(3);
  });
});
