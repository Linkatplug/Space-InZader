import { describe, it, expect } from 'vitest';
import { buildFeedbackSnapshot } from '../engine/FeedbackSnapshot';
import { triggerEvent } from '../engine/EventSystem';
import { EnvEventType } from '../types';
import { makeState, addEnemy, run } from './helpers';

describe('instantané joint aux avis (F8)', () => {
  it('au menu : statut et vaisseau seulement', () => {
    const s = makeState();
    s.status = 'menu';
    expect(buildFeedbackSnapshot(s)).toEqual({ status: 'menu', ship: s.shipId });
  });

  it('en partie : état arrondi et compact, sérialisable', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    s.time = 61_499;
    s.player.defense.hull = 73.6;
    s.heat = 33.3; s.maxHeat = 100;
    s.score = 1234.7;
    s.damageBySource = { a: 1.4, b: 50.6, c: 10, d: 3, e: 7, f: 2 };
    s.lastHitBy = 'gunner';
    addEnemy(s, 'boss', 600);
    const snap = buildFeedbackSnapshot(s);
    expect(snap.status).toBe('playing');
    expect(snap.timeSec).toBe(61);
    expect(snap.hull![0]).toBe(74);
    expect(snap.heat).toBe(33);
    expect(snap.score).toBe(1235);
    expect(snap.weapons).toEqual([{ id: 'ion_blaster', level: 1 }]);
    expect(snap.bossAlive).toBe(true);
    expect(snap.enemies).toBe(1);
    expect(snap.lastHitBy).toBe('gunner');
    expect(snap.topDamage).toEqual([
      { source: 'b', dmg: 51 }, { source: 'c', dmg: 10 }, { source: 'e', dmg: 7 }, { source: 'd', dmg: 3 }, { source: 'f', dmg: 2 },
    ]);
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
    // Tient largement dans la limite serveur de l'instantané
    expect(JSON.stringify(snap).length).toBeLessThan(12000);
  });

  it('événement en cours et pas de boss', () => {
    const s = makeState({ noSpawn: true });
    triggerEvent(s, EnvEventType.SOLAR_STORM);
    expect(buildFeedbackSnapshot(s).event).toBeNull(); // encore en alerte
    run(s, 8);
    const snap = buildFeedbackSnapshot(s);
    expect(snap.event).toBe(EnvEventType.SOLAR_STORM);
    expect(snap.bossAlive).toBe(false);
    expect(snap.lastHitBy ?? null).toBeDefined();
  });
});
