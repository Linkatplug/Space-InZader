import { describe, it, expect } from 'vitest';
import { applyDamage } from '../engine/DamageEngine';
import { calculateRuntimeStats } from '../engine/StatsCalculator';
import { DamageType, Entity } from '../types';
import { INITIAL_STATS } from '../constants';
import { makeState } from './helpers';
import { PASSIVES } from '../data/passives';

const target = (shield: number, armor: number, hull: number, over: Partial<typeof INITIAL_STATS> = {}): Entity => {
  const stats = { ...INITIAL_STATS, maxShield: shield, maxArmor: armor, maxHull: hull, armorHardness: 0, ...over };
  return {
    id: 't', x: 0, y: 0, rotation: 0, vx: 0, vy: 0, radius: 10, type: 'enemy',
    baseStats: stats, runtimeStats: stats, modifiers: [], statsDirty: false,
    defense: { shield, armor, hull },
  };
};
const hit = (amount: number, type = DamageType.KINETIC) => ({ amount, type, penetration: 0, isCrit: false });

describe('DamageEngine — couches de défense', () => {
  it('le bouclier absorbe en premier (EM ×1.5, autres ×0.8)', () => {
    const a = target(100, 100, 100);
    applyDamage(a, hit(10, DamageType.EM));
    expect(a.defense.shield).toBeCloseTo(85);
    const b = target(100, 100, 100);
    applyDamage(b, hit(10, DamageType.KINETIC));
    expect(b.defense.shield).toBeCloseTo(92);
    expect(b.defense.armor).toBe(100);
  });

  it("le surplus traverse le bouclier vers l'armure puis la coque", () => {
    const e = target(10, 10, 100);
    applyDamage(e, hit(100, DamageType.THERMAL));
    expect(e.defense.shield).toBe(0);
    expect(e.defense.armor).toBe(0);
    expect(e.defense.hull).toBeLessThan(100);
    expect(e.defense.hull).toBeGreaterThanOrEqual(0);
  });

  it('les résistances réduisent les dégâts (plafond 90 %)', () => {
    const e = target(0, 0, 100, { res_Kinetic: 0.5 });
    applyDamage(e, hit(20));
    expect(e.defense.hull).toBeCloseTo(90);
    const f = target(0, 0, 100, { res_Kinetic: 5 });
    applyDamage(f, hit(100));
    expect(f.defense.hull).toBeCloseTo(90);
  });

  it('la coque ne descend jamais sous 0', () => {
    const e = target(0, 0, 10);
    applyDamage(e, hit(1e6));
    expect(e.defense.hull).toBe(0);
  });

  it('god mode ignore les dégâts', () => {
    const e = target(0, 0, 10);
    e.isGodMode = true;
    applyDamage(e, hit(100));
    expect(e.defense.hull).toBe(10);
  });

  it("le temps n'est enregistré que s'il est fourni (pas de flash sur dégâts continus)", () => {
    const e = target(0, 0, 100);
    applyDamage(e, hit(1));
    expect(e.lastDamageTime).toBeUndefined();
    applyDamage(e, hit(1), 1234);
    expect(e.lastDamageTime).toBe(1234);
  });
});

describe('StatsCalculator — rendement dégressif', () => {
  it('additif : Σ 0.8^i', () => {
    const s = makeState();
    const hull = PASSIVES.find(p => p.id === 'hardened_hull')!; // +20 coque
    s.activePassives.push({ passive: hull, stacks: 3 });
    const stats = calculateRuntimeStats(s.player, s);
    expect(stats.maxHull).toBeCloseTo(INITIAL_STATS.maxHull + 20 * (1 + 0.8 + 0.64));
  });

  it('multiplicatif : 1 + bonus × Σ 0.8^i', () => {
    const s = makeState();
    const p = PASSIVES.find(x => x.id === 'warhead_optimizer')!; // ×1.10 dégâts
    s.activePassives.push({ passive: p, stacks: 2 });
    const stats = calculateRuntimeStats(s.player, s);
    expect(stats.damageMult).toBeCloseTo(1 + 0.1 * 1.8);
  });
});
