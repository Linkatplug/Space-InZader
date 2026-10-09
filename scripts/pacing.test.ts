import { it } from 'vitest';
import { SHIPS } from '../data/ships';
import { playBotGame } from '../tests/bot';
import { seedRandom } from '../tests/helpers';

/**
 * Rythme de progression : `npm run pacing`.
 * Affiche l'instant moyen (s) de chaque montée de niveau (bot, tous vaisseaux).
 */
declare const process: { env: Record<string, string | undefined> };
const RUNS = Number(process.env.BALANCE_RUNS ?? 3);
const SECONDS = Number(process.env.BALANCE_SECONDS ?? 600);

it('rythme des niveaux', () => {
  const all: number[][] = [];
  for (const ship of SHIPS) for (let r = 0; r < RUNS; r++) {
    const rnd = seedRandom(2000 + r);
    all.push(playBotGame(ship.id, SECONDS).levelTimes);
    rnd.mockRestore();
  }
  const rows: string[] = ['niv   instant   écart'];
  let prev = 0;
  for (let lv = 0; lv < 40; lv++) {
    const ts = all.map(t => t[lv]).filter((x): x is number => x !== undefined);
    if (ts.length < all.length / 2) break;
    const t = ts.reduce((a, b) => a + b, 0) / ts.length;
    rows.push(`${String(lv + 2).padStart(3)} ${t.toFixed(1).padStart(8)}s ${(t - prev).toFixed(1).padStart(6)}s`);
    prev = t;
  }
  console.log('\n' + rows.join('\n') + '\n');
}, 600_000);
