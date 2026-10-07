import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ABILITIES, makeAbility } from '../engine/AbilitySystem';
import { SHIPS } from '../data/ships';
import { ENEMIES } from '../data/enemies';
import { createInitialState } from '../engine/GameFactory';
import { CONTROLS, INITIAL_STATS } from '../constants';
import { makeState, addEnemy, run, seedRandom, totalHp, hasNaN } from './helpers';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(17); });
afterEach(() => rnd.mockRestore());

const withAbility = (id: string) => {
  const s = makeState({ noSpawn: true });
  s.activeAbilities = [makeAbility(id, 0)];
  return s;
};
const cast = (s: ReturnType<typeof makeState>) => run(s, 1 / 60, { keys: [CONTROLS.ABILITY_1] });

describe('compétences', () => {
  it('chaque vaisseau équipe deux compétences existantes (Shift, E)', () => {
    for (const ship of SHIPS) {
      ship.abilities.forEach(id => expect(ABILITIES[id], `${ship.id} → ${id}`).toBeDefined());
      const s = createInitialState(ship.id);
      expect(s.activeAbilities.map(a => a.key)).toEqual([CONTROLS.ABILITY_1, CONTROLS.ABILITY_2]);
    }
  });

  it.each(Object.keys(ABILITIES).map(id => [id]))('%s : se lance, passe en recharge, sans NaN', (id) => {
    const s = withAbility(id);
    s.player.isGodMode = true;
    for (let i = 0; i < 6; i++) addEnemy(s, 'tank', 200 + i * 60, (i - 3) * 50);
    cast(s);
    expect(s.activeAbilities[0].currentCooldown).toBeGreaterThan(0);
    run(s, 6);
    expect(hasNaN(s)).toBeNull();
  });

  it('Nova et Purge infligent des dégâts autour du vaisseau', () => {
    for (const id of ['tactical_nova', 'emergency_vent']) {
      const s = withAbility(id);
      const e = addEnemy(s, 'tank', 200);
      const hp = totalHp(e);
      cast(s);
      expect(totalHp(e), id).toBeLessThan(hp);
    }
  });

  it('Purge Thermique vide la chaleur', () => {
    const s = withAbility('emergency_vent');
    s.heat = s.maxHeat; s.isOverheated = true;
    cast(s);
    expect(s.heat).toBe(0);
    expect(s.isOverheated).toBe(false);
  });

  it('Surcadençage : cadence accrue et zéro chaleur pendant 5 s, puis expire', () => {
    const s = withAbility('overdrive');
    cast(s);
    expect(s.player.runtimeStats.fireRate).toBeCloseTo(INITIAL_STATS.fireRate * 1.6);
    expect(s.player.runtimeStats.heatGenMult).toBe(0);
    run(s, 5.5);
    expect(s.buffs).toHaveLength(0);
    expect(s.player.runtimeStats.fireRate).toBeCloseTo(INITIAL_STATS.fireRate);
  });

  it('Égide : bouclier plein et invulnérabilité', () => {
    const s = withAbility('aegis_shield');
    s.player.defense.shield = 0;
    cast(s);
    expect(s.player.defense.shield).toBe(s.player.runtimeStats.maxShield);
    const hull = s.player.defense.hull;
    addEnemy(s, 'kamikaze', 0);
    run(s, 0.5);
    expect(s.player.defense.hull).toBe(hull);
  });

  it('Nanites : la coque remonte', () => {
    const s = withAbility('repair_nanites');
    s.player.defense.hull = 40;
    cast(s);
    run(s, 3);
    expect(s.player.defense.hull).toBeGreaterThan(50);
  });

  it('Distorsion : ralentit les ennemis et leurs projectiles', () => {
    const s = withAbility('time_dilation');
    s.player.isGodMode = true;
    const sniper = addEnemy(s, 'sniper', 500);
    cast(s);
    expect(sniper.slow?.amount).toBe(0.6);
    expect(s.enemySlowUntil).toBeGreaterThan(s.time);
  });

  it('la recharge suit abilityCooldownMult', () => {
    const s = withAbility('blink_dash');
    s.player.baseStats.abilityCooldownMult = 0.5;
    cast(s);
    expect(s.activeAbilities[0].currentCooldown).toBeCloseTo(ABILITIES.blink_dash.cooldown * 0.5, 1);
  });
});

describe('boss', () => {
  it('chaque boss a une phase d\'enragement', () => {
    Object.values(ENEMIES).filter(d => d.isBoss).forEach(d => expect(d.enrage, d.id).toBeDefined());
  });

  it('un boss passe en enragement sous son seuil et tire plus souvent', () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    const b = addEnemy(s, 'devastator', 500);
    run(s, 2);
    const shotsCalm = s.projectiles.filter(p => p.ownerId === b.id).length;
    s.projectiles = [];
    b.defense.shield = 0;
    b.defense.hull = b.runtimeStats.maxHull * 0.3;
    run(s, 2);
    expect(b.enraged).toBe(true);
    expect(s.projectiles.filter(p => p.ownerId === b.id).length).toBeGreaterThan(shotsCalm);
  });

  it('Dévastateur : la spirale tourne', () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    const b = addEnemy(s, 'devastator', 500);
    run(s, 0.5);
    const a1 = b.spiralAngle ?? 0;
    run(s, 0.5);
    expect(b.spiralAngle).not.toBe(a1);
  });

  it('Porte-Nef : envoie des kamikazes', () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    addEnemy(s, 'carrier', 700);
    run(s, 6);
    expect(s.enemies.some(e => e.subtype === 'kamikaze')).toBe(true);
  });
});
