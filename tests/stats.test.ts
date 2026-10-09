import { describe, it, expect } from 'vitest';
import { computeStats, filterRuns, findAnomalies, heavySubmitters, feedbackKinds, renderStatsPage, ANOMALY } from '../feedback/stats.mjs';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const run = (over: Record<string, unknown> = {}) => ({
  date: '2026-10-19T10:00:00Z', playerId: 'p-000001', name: 'A', score: 1000, wave: 5, level: 8, timeSec: 200, kills: 150,
  ship: 'interceptor', build: '170', device: 'ordinateur', input: 'clavier', end: 'mort', lastHitBy: 'gunner',
  weapons: [{ id: 'ion_blaster', level: 2 }], keystones: [], levelTimes: [12, 25, 40, 55],
  ...over,
});

describe('statistiques (agrégations pures)', () => {
  it('filtres période et version', () => {
    const runs = [run(), run({ date: '2026-09-01T10:00:00Z' }), run({ build: '160' })];
    expect(filterRuns(runs, { period: '7', now: NOW })).toHaveLength(2);
    expect(filterRuns(runs, { period: 'all', now: NOW })).toHaveLength(3);
    expect(filterRuns(runs, { period: 'all', build: '160', now: NOW })).toHaveLength(1);
  });

  it('totaux, par vaisseau, causes de mort, armes, rythme, fins, appareils', () => {
    const runs = [
      run(),
      run({ playerId: 'p-000002', timeSec: 40, wave: 1, ship: 'fortress', end: 'abandon', lastHitBy: null, device: 'telephone', input: 'tactile', weapons: [], levelTimes: [14] }),
      run({ playerId: 'p-000002', timeSec: 600, wave: 12, score: 9000, lastHitBy: 'boss' }),
    ];
    const st = computeStats(runs, { period: 'all', now: NOW });
    expect(st.totals).toMatchObject({ runs: 3, players: 2, playtimeSec: 840, short: 1, medianSec: 200 });
    expect(st.perShip.find((s: any) => s.ship === 'interceptor')).toMatchObject({ runs: 2, best: 9000, avgWave: 8.5 });
    expect(st.deaths.map((d: any) => d.key).sort()).toEqual(['boss', 'gunner']); // l'abandon ne compte pas
    expect(st.weapons[0]).toMatchObject({ id: 'ion_blaster', runs: 2, pickRate: 66.7 });
    expect(st.pacing.lvl2).toEqual({ avg: 13, n: 3 });
    expect(st.pacing.lvl10).toBeNull();
    expect(st.endings).toEqual([{ key: 'mort', count: 2 }, { key: 'abandon', count: 1 }]);
    expect(st.devices.map((d: any) => d.key)).toEqual(['ordinateur', 'telephone']);
    expect(st.perDay).toEqual([{ day: '2026-10-19', count: 3 }]);
  });

  it('anomalies : éliminations/s, niveau trop haut pour la durée, score/s hors norme', () => {
    const normal = Array.from({ length: 12 }, (_, i) => run({ playerId: `p-${i}`, score: 1000 + i }));
    const cheat = [
      run({ playerId: 'x-1', kills: 5000, timeSec: 100 }),
      run({ playerId: 'x-2', level: 60, timeSec: 100 }),
      run({ playerId: 'x-3', score: 1000 * ANOMALY.scoreRateFactor * 2 }),
    ];
    const a = findAnomalies([...normal, ...cheat]);
    expect(a.map((x: any) => x.playerId)).toEqual(['x-1', 'x-2', 'x-3']);
    expect(a[0].reasons[0]).toContain('éliminations/s');
  });

  it('beaucoup d\'envois sur une journée', () => {
    const many = Array.from({ length: ANOMALY.manyRunsPerDay }, () => run({ playerId: 'spam-001' }));
    expect(heavySubmitters([...many, run()])).toEqual([{ playerId: 'spam-001', name: 'A', day: '2026-10-19', count: ANOMALY.manyRunsPerDay }]);
  });

  it('avis par type (titres de avis.md) et page HTML échappée', () => {
    const md = '## 2026-10-19T10:00:00Z · bug · A · ordinateur · build 170\n\nx\n## 2026-10-19T11:00:00Z · bug · B · telephone · build 170\n## 2026-10-19T12:00:00Z · idee · C · ordinateur · build 170\n';
    expect(feedbackKinds(md)).toEqual([{ key: 'bug', count: 2 }, { key: 'idee', count: 1 }]);
    const html = renderStatsPage(computeStats([run({ ship: '<b>x</b>' })], { period: 'all', now: NOW, avis: md, errors: [{ message: '<img>', source: 'a.js', line: 1 }] }));
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<img>');
    expect(html).not.toContain('<script');
  });
});
