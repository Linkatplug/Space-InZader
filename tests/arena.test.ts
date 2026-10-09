import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { EVENTS, } from '../data/events';
import { WARP_IN, ENEMIES } from '../data/enemies';
import { EnvEventType, GameState } from '../types';
import { ARENA, ARENA_RADIUS, insideArena, clampToArena, spawnPointInArena } from '../engine/Arena';
import { spawnEnemy } from '../engine/EnemyFactory';
import { updateGameState } from '../engine/CoreEngine';
import { botThink, botPickUpgrade } from '../engine/Bot';
import { applyUpgrade, rollUpgradeOptions } from '../engine/Progression';
import { triggerEvent } from '../engine/EventSystem';
import { makeState, seedRandom, STEP, run, totalHp } from './helpers';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(77); });
afterEach(() => rnd.mockRestore());

/** Première chose hors du cadre, ou null. */
const outside = (s: GameState): string | null => {
  if (!insideArena(s.player, s.player.radius)) return 'joueur';
  for (const e of s.enemies) if (!insideArena(e, e.radius)) return `ennemi ${e.subtype} (${Math.round(e.x)}, ${Math.round(e.y)})`;
  for (const d of s.xpDrops) if (!insideArena(d, ARENA_RADIUS.xp)) return 'XP';
  for (const p of s.pickups) if (!insideArena(p, ARENA_RADIUS.pickup)) return `butin ${p.kind}`;
  for (const d of s.drones) if (!insideArena(d, ARENA_RADIUS.drone)) return 'drone';
  for (const z of s.zones) if (!insideArena(z)) return `zone ${z.kind}`;
  for (const p of s.projectiles) if (p.kind === 'mine' && !insideArena(p, ARENA_RADIUS.mine)) return 'mine';
  for (const ev of s.activeEvents) if (ev.started && (ev.x || ev.y) && !insideArena(ev)) return `événement ${ev.type}`;
  return null;
};

describe('arène : rien hors du cadre du joueur', () => {
  it('bornage : cercle ramené dedans, vitesse vers l\'extérieur annulée', () => {
    const p = { x: -50, y: ARENA.maxY + 10, vx: -3, vy: 4, kx: -1, ky: 1 };
    expect(clampToArena(p, 20)).toBe(true);
    expect(p).toEqual({ x: 20, y: ARENA.maxY - 20, vx: 0, vy: 0, kx: 0, ky: 0 });
    expect(clampToArena(p, 20)).toBe(false);
  });

  it('point d\'apparition : toujours dedans, même joueur collé dans un coin', () => {
    for (const origin of [{ x: 40, y: 40 }, { x: ARENA.maxX - 40, y: 40 }, { x: 2000, y: ARENA.maxY - 40 }, { x: 2000, y: 2000 }]) {
      for (let i = 0; i < 50; i++) {
        const p = spawnPointInArena(origin, 1100, 90);
        expect(insideArena(p, 90)).toBe(true);
        expect(Math.hypot(p.x - origin.x, p.y - origin.y)).toBeGreaterThan(900);
      }
    }
  });

  it('simulation (bot) : les 24 armes, tous les événements, rien ne sort du cadre à aucun pas', () => {
    const groups = [0, 6, 12, 18].map(i => WEAPONS.slice(i, i + 6).map(w => w.id));
    const events = Object.keys(EVENTS) as EnvEventType[];
    groups.forEach((weaponIds, g) => {
      const s = makeState({ weaponIds });
      s.player.isGodMode = true;
      s.autoFire = true; s.autoAim = true;
      // Départ près d'un coin : le cas le plus exposé
      s.player.x = g % 2 ? 120 : ARENA.maxX - 120;
      s.player.y = g < 2 ? 120 : ARENA.maxY - 120;
      const steps = Math.round(75 / STEP);
      for (let i = 0; i < steps; i++) {
        if (i % Math.round(15 / STEP) === 0) triggerEvent(s, events[(i / Math.round(15 / STEP) + g) % events.length]);
        const { move, keys } = botThink(s);
        s.analogMove = move;
        updateGameState(s, STEP, keys, { x: s.player.x + 1, y: s.player.y },
          () => { const o = botPickUpgrade(rollUpgradeOptions(s)); if (o) applyUpgrade(s, o); else s.experience = 0; },
          () => {});
        const out = outside(s);
        if (out) throw new Error(`groupe ${g}, t=${(i * STEP).toFixed(1)}s : ${out} hors du cadre`);
      }
      expect(s.totalKills).toBeGreaterThan(20);
    });
  }, 60_000);
});

describe('arrivée en sortie d\'hypervitesse', () => {
  it('les renforts arrivent dans le cadre, à distance du joueur, avec l\'effet ; pas les divisions', () => {
    const s = makeState({ noSpawn: true });
    s.player.x = 60; s.player.y = 60;
    for (let i = 0; i < 40; i++) {
      const e = spawnEnemy(5, s.player, undefined, undefined, true);
      expect(insideArena(e, e.radius)).toBe(true);
      expect(Math.hypot(e.x - s.player.x, e.y - s.player.y)).toBeGreaterThanOrEqual(WARP_IN.minDist);
      expect(e.warpIn?.total).toBe(e.type === 'boss' ? WARP_IN.bossDuration : WARP_IN.duration);
    }
    expect(spawnEnemy(5, s.player, 'swarmer', 20).warpIn).toBeUndefined();
    const close = spawnEnemy(5, { x: 2000, y: 2000 }, 'basic', 50, true);
    expect(Math.hypot(close.x - 2000, close.y - 2000)).toBeGreaterThanOrEqual(WARP_IN.minDist - 1);
    expect(ENEMIES.boss.isBoss).toBe(true);
    expect(spawnEnemy(10, s.player, 'boss', undefined, true).warpIn?.boss).toBe(true);
  });

  it('pendant la matérialisation : immobile, ni tir ni dégâts de contact ; ensuite il agit', () => {
    const s = makeState({ noSpawn: true });
    const e = spawnEnemy(5, s.player, 'gunner', 400, true);
    e.x = s.player.x; e.y = s.player.y; // posé sur le joueur
    s.enemies.push(e);
    const hp0 = totalHp(s.player);
    const x0 = e.x;
    run(s, WARP_IN.duration * 0.8);
    expect(totalHp(s.player)).toBe(hp0);
    expect(s.projectiles.filter(p => p.ownerId !== 'player')).toHaveLength(0);
    expect(e.x).toBe(x0);
    run(s, WARP_IN.duration);
    expect(e.warpIn).toBeUndefined();
    run(s, 1);
    expect(totalHp(s.player)).toBeLessThan(hp0);
  });
});
