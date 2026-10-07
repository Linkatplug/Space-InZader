import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { damageEnemy, explode, killEnemy, updateStatusEffects } from '../engine/Combat';
import { DamageType } from '../types';
import { ENEMIES } from '../data/enemies';
import { makeState, addEnemy, run, seedRandom } from './helpers';

const hit = (amount: number, type = DamageType.KINETIC) => ({ amount, type, penetration: 0, isCrit: false });

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(7); });
afterEach(() => rnd.mockRestore());

describe('Combat — mort et récompenses', () => {
  it('tuer un ennemi donne score, kills et XP selon sa définition', () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'basic', 300);
    damageEnemy(s, e, hit(1e6));
    expect(e.dead).toBe(true);
    expect(s.totalKills).toBe(1);
    expect(s.waveKills).toBe(1);
    expect(s.score).toBe(ENEMIES.basic.score);
    expect(s.xpDrops.length).toBe(ENEMIES.basic.drops.count);
  });

  it('un ennemi ne meurt (et ne rapporte) qu\'une fois', () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'basic', 300);
    killEnemy(s, e);
    killEnemy(s, e);
    damageEnemy(s, e, hit(1e6));
    expect(s.totalKills).toBe(1);
  });

  it("l'élite se divise en essaim à sa mort", () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'elite', 300);
    damageEnemy(s, e, hit(1e7));
    const spawned = s.enemies.filter(x => x.subtype === ENEMIES.elite.splitInto!.id);
    expect(spawned.length).toBe(ENEMIES.elite.splitInto!.count);
  });

  it('explosion : touche dans le rayon seulement', () => {
    const s = makeState({ noSpawn: true });
    const near = addEnemy(s, 'tank', 300);
    const far = addEnemy(s, 'tank', 900);
    const hpFar = far.defense.hull + far.defense.armor;
    explode(s, near.x, near.y, 100, hit(50, DamageType.EXPLOSIVE), '#fff');
    expect(near.defense.armor + near.defense.hull).toBeLessThan(ENEMIES.tank.hull + ENEMIES.tank.armor);
    expect(far.defense.hull + far.defense.armor).toBe(hpFar);
  });

  it('recul : pousse l\'ennemi à l\'opposé de la source (sauf boss)', () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'tank', 300);
    damageEnemy(s, e, hit(1), { knockback: 10, fromX: e.x - 100, fromY: e.y });
    expect(e.kx!).toBeGreaterThan(0);
    const b = addEnemy(s, 'boss', 600);
    damageEnemy(s, b, hit(1), { knockback: 10, fromX: b.x - 100, fromY: b.y });
    expect(b.kx ?? 0).toBe(0);
  });
});

describe('Combat — statuts', () => {
  it('la brûlure inflige des dégâts dans le temps puis expire', () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'tank', 500);
    e.defense.armor = 0;
    damageEnemy(s, e, hit(10, DamageType.THERMAL), { burn: 1 });
    const after = e.defense.hull;
    for (let i = 0; i < 60; i++) { s.time += 1000 / 60; updateStatusEffects(s, 1 / 60); }
    expect(e.defense.hull).toBeLessThan(after);
    s.time += 5000;
    updateStatusEffects(s, 1 / 60);
    expect(e.burn).toBeUndefined();
  });

  it('le ralentissement réduit la vitesse de déplacement', () => {
    const a = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    const free = addEnemy(a, 'basic', 800);
    const slowed = addEnemy(a, 'basic', -800);
    damageEnemy(a, slowed, hit(0.01), { slow: 0.5 });
    const d0f = Math.hypot(free.x - a.player.x, free.y - a.player.y);
    const d0s = Math.hypot(slowed.x - a.player.x, slowed.y - a.player.y);
    run(a, 1);
    const movedFree = d0f - Math.hypot(free.x - a.player.x, free.y - a.player.y);
    const movedSlow = d0s - Math.hypot(slowed.x - a.player.x, slowed.y - a.player.y);
    expect(movedSlow).toBeLessThan(movedFree * 0.7);
  });
});

describe('Joueur', () => {
  it('le kamikaze explose au contact et meurt', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    const k = addEnemy(s, 'kamikaze', 200);
    const before = s.player.defense.shield + s.player.defense.armor + s.player.defense.hull;
    run(s, 2);
    expect(k.dead).toBe(true);
    expect(s.player.defense.shield + s.player.defense.armor + s.player.defense.hull).toBeLessThan(before);
  });

  it('game over quand la coque tombe à 0', () => {
    const s = makeState({ noSpawn: true });
    s.player.defense = { shield: 0, armor: 0, hull: 0.0001 };
    addEnemy(s, 'tank', 0);
    let over = false;
    run(s, 0.5, { onGameOver: () => { over = true; } });
    expect(over).toBe(true);
  });

  it('les déplacements sont normalisés en diagonale', () => {
    const s = makeState({ noSpawn: true });
    const x0 = s.player.x, y0 = s.player.y;
    run(s, 1, { keys: ['d', 's'] });
    const dist = Math.hypot(s.player.x - x0, s.player.y - y0);
    expect(dist).toBeCloseTo(s.player.runtimeStats.speed * 60, 0);
  });
});

describe('contrôles tactiles', () => {
  it('le joystick analogique déplace le joueur', () => {
    const s = makeState({ noSpawn: true });
    s.analogMove = { x: 1, y: 0 };
    const x0 = s.player.x;
    run(s, 1);
    expect(s.player.x - x0).toBeCloseTo(s.player.runtimeStats.speed * 60, 0);
  });

  it("la visée auto oriente le vaisseau vers l'ennemi le plus proche", () => {
    const s = makeState({ noSpawn: true });
    s.autoAim = true;
    const e = addEnemy(s, 'tank', 0, 400);
    e.baseStats.speed = 0;
    run(s, 0.05, { mouse: { x: s.player.x + 1000, y: s.player.y } });
    expect(s.player.rotation).toBeCloseTo(Math.PI / 2, 1);
  });
});
