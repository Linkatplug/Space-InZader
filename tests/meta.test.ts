import { describe, it, expect } from 'vitest';
import { emptySave, recordRun, isShipUnlocked, loadSave } from '../engine/Meta';
import { SHIPS } from '../data/ships';
import { makeState } from './helpers';

describe('méta-progression', () => {
  it('enregistre une partie : records, cumuls, historique', () => {
    const s = makeState();
    s.wave = 7; s.score = 1234; s.totalKills = 80; s.time = 90_000; s.bossKills = 0;
    const { save, summary } = recordRun(emptySave(), s, 1000);
    expect(save.bestWave).toBe(7);
    expect(save.bestScore).toBe(1234);
    expect(save.totalKills).toBe(80);
    expect(save.totalRuns).toBe(1);
    expect(save.totalPlaySec).toBe(90);
    expect(save.history[0]).toMatchObject({ wave: 7, score: 1234, date: 1000 });
    expect(summary.newBestScore).toBe(true);
    expect(summary.newBestWave).toBe(true);
  });

  it("une partie moins bonne n'écrase pas les records", () => {
    const s = makeState();
    s.wave = 3; s.score = 10;
    const base = { ...emptySave(), bestWave: 10, bestScore: 5000 };
    const { save, summary } = recordRun(base, s);
    expect(save.bestWave).toBe(10);
    expect(save.bestScore).toBe(5000);
    expect(summary.newBestScore).toBe(false);
  });

  it("l'historique garde les 10 dernières parties", () => {
    let save = emptySave();
    for (let i = 0; i < 15; i++) {
      const s = makeState();
      s.score = i;
      save = recordRun(save, s).save;
    }
    expect(save.history).toHaveLength(10);
    expect(save.history[0].score).toBe(14);
  });

  it('débloque les vaisseaux selon les conditions', () => {
    const locked = SHIPS.filter(s => !isShipUnlocked(s, emptySave()));
    expect(locked.length).toBeGreaterThan(0);
    const s = makeState();
    s.wave = 30; s.totalKills = 5000;
    const { save, summary } = recordRun(emptySave(), s);
    SHIPS.forEach(ship => expect(isShipUnlocked(ship, save), ship.id).toBe(true));
    expect(summary.unlockedShips.map(x => x.id).sort()).toEqual(locked.map(x => x.id).sort());
  });

  it('sans localStorage (Node), loadSave renvoie une sauvegarde vide', () => {
    expect(loadSave()).toEqual(emptySave());
  });
});
