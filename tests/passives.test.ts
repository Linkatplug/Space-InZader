import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PASSIVES } from '../data/passives';
import { refreshPlayerStats } from '../engine/StatsCalculator';
import { damageEnemy, killEnemy } from '../engine/Combat';
import { rarityWeight } from '../engine/Progression';
import { DamageType } from '../types';
import { makeState, addEnemy, run, seedRandom, totalHp } from './helpers';

const passive = (id: string) => {
  const p = PASSIVES.find(x => x.id === id);
  if (!p) throw new Error(id);
  return p;
};
const hit = (amount: number) => ({ amount, type: DamageType.KINETIC, penetration: 0, isCrit: false });

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(5); });
afterEach(() => rnd.mockRestore());

describe('passifs — mécaniques', () => {
  it('stats entières : pas de rendement dégressif (2 stacks = +2)', () => {
    const s = makeState();
    s.activePassives.push({ passive: passive('piercing_rounds'), stacks: 2 });
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.extraPierce).toBe(2);
  });

  it('Munitions Perforantes : le blaster traverse un ennemi', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    s.activePassives.push({ passive: passive('piercing_rounds'), stacks: 1 });
    s.autoFire = true;
    const a = addEnemy(s, 'tank', 300); const b = addEnemy(s, 'tank', 450);
    [a, b].forEach(e => { e.defense.hull *= 50; e.baseStats.speed = 0; });
    const hb = totalHp(b);
    run(s, 1, { mouse: { x: s.player.x + 1000, y: s.player.y } });
    expect(totalHp(b)).toBeLessThan(hb);
  });

  it('Exécution : plus de dégâts sous 30% de coque', () => {
    const s = makeState({ noSpawn: true });
    s.activePassives.push({ passive: passive('execution'), stacks: 1 });
    refreshPlayerStats(s);
    const e = addEnemy(s, 'basic', 400);
    e.defense.hull = e.runtimeStats.maxHull; // pleine vie
    const full = e.defense.hull;
    damageEnemy(s, e, hit(5));
    const dmgHealthy = full - e.defense.hull;
    e.defense.hull = e.runtimeStats.maxHull * 0.2;
    const low = e.defense.hull;
    damageEnemy(s, e, hit(5));
    expect(low - e.defense.hull).toBeCloseTo(dmgHealthy * 1.25);
  });

  it('Prédateur : une élimination répare la coque', () => {
    const s = makeState({ noSpawn: true });
    s.activePassives.push({ passive: passive('predator'), stacks: 1 });
    refreshPlayerStats(s);
    s.player.defense.hull = 50;
    killEnemy(s, addEnemy(s, 'basic', 400));
    expect(s.player.defense.hull).toBe(52);
  });

  it('Cœur Noir : réduit la coque max', () => {
    const s = makeState();
    s.activePassives.push({ passive: passive('black_heart'), stacks: 1 });
    refreshPlayerStats(s);
    expect(s.player.runtimeStats.maxHull).toBe(80);
    expect(s.player.defense.hull).toBeLessThanOrEqual(80);
  });

  it('la chance rapproche les raretés', () => {
    expect(rarityWeight('legendary', 0)).toBeLessThan(rarityWeight('legendary', 50));
    expect(rarityWeight('legendary', 100)).toBe(1);
    expect(rarityWeight('common', 0)).toBe(1);
  });
});
