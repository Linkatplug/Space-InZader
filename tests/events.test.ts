import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvEventType } from '../types';
import { EVENTS } from '../data/events';
import { EVENT_HANDLERS, triggerEvent } from '../engine/EventSystem';
import { INITIAL_STATS } from '../constants';
import { makeState, addEnemy, run, seedRandom, hasNaN, totalHp } from './helpers';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(31); });
afterEach(() => rnd.mockRestore());

const ALL = Object.values(EnvEventType);

describe('événements', () => {
  it('chaque type a une définition et un comportement', () => {
    ALL.forEach(t => { expect(EVENTS[t]).toBeDefined(); expect(EVENT_HANDLERS[t]).toBeDefined(); });
  });

  it.each(ALL.map(t => [t]))('%s : alerte puis actif puis fin, sans NaN', (type) => {
    const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster'] });
    s.player.isGodMode = true;
    for (let i = 0; i < 5; i++) addEnemy(s, 'basic', 300 + i * 100, (i - 2) * 150);
    const ev = triggerEvent(s, type);
    expect(ev.started).toBe(false);
    run(s, EVENTS[type].warning + 0.1);
    expect(ev.started).toBe(true);
    run(s, EVENTS[type].duration[1] + 1);
    expect(s.activeEvents).toHaveLength(0);
    expect(hasNaN(s)).toBeNull();
  });

  it('tempête magnétique : bouclier coupé et cadence réduite, puis rétablie', () => {
    const s = makeState({ noSpawn: true });
    triggerEvent(s, EnvEventType.MAGNETIC_STORM);
    run(s, EVENTS[EnvEventType.MAGNETIC_STORM].warning + 0.1);
    expect(s.player.defense.shield).toBe(0);
    expect(s.player.runtimeStats.fireRate).toBeCloseTo(INITIAL_STATS.fireRate * 0.6);
    run(s, 10);
    expect(s.player.runtimeStats.fireRate).toBeCloseTo(INITIAL_STATS.fireRate);
  });

  it('trou noir : attire le joueur immobile', () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    const ev = triggerEvent(s, EnvEventType.BLACK_HOLE);
    run(s, EVENTS[EnvEventType.BLACK_HOLE].warning + 0.05);
    const d0 = Math.hypot(ev.x - s.player.x, ev.y - s.player.y);
    run(s, 3);
    expect(Math.hypot(ev.x - s.player.x, ev.y - s.player.y)).toBeLessThan(d0);
  });

  it("trou noir : l'XP proche du centre est détruite sans être gagnée", () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    const ev = triggerEvent(s, EnvEventType.BLACK_HOLE);
    run(s, EVENTS[EnvEventType.BLACK_HOLE].warning + 2.5);
    s.player.x = ev.x + 900; s.player.y = ev.y; // loin
    s.xpDrops.push({ id: 'x', x: ev.x + 20, y: ev.y, amount: 50, vx: 0, vy: 0, collected: false });
    const xp = s.experience;
    run(s, 0.1);
    expect(s.xpDrops.find(d => d.id === 'x')).toBeUndefined();
    expect(s.experience).toBe(xp);
  });

  it('météores : blessent aussi les ennemis', () => {
    const s = makeState({ noSpawn: true });
    s.player.isGodMode = true;
    const foes = Array.from({ length: 12 }, (_, i) => addEnemy(s, 'tank', -600 + i * 100, -300));
    foes.forEach(e => { e.defense.hull *= 20; e.baseStats.speed = 0; });
    const before = foes.map(totalHp);
    triggerEvent(s, EnvEventType.ASTEROID_BELT);
    run(s, 18);
    expect(foes.some((e, i) => totalHp(e) < before[i])).toBe(true);
  });

  it('planification automatique : un événement arrive en moins de 80s (vague 5)', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    s.player.isGodMode = true;
    s.wave = 5;
    s.waveQuota = 1e9;
    let seen = false;
    for (let t = 0; t < 80 && !seen; t++) { run(s, 1); seen = s.activeEvents.length > 0; }
    expect(seen).toBe(true);
  });

  it('pas d\'événement en vague 1', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    s.player.isGodMode = true;
    s.waveQuota = 1e9;
    run(s, 90);
    expect(s.activeEvents).toHaveLength(0);
  });
});
