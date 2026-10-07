import { it } from 'vitest';
import { SHIPS } from '../data/ships';
import { playBotGame, BotResult } from '../tests/bot';
import { seedRandom } from '../tests/helpers';

/**
 * Rapport d'équilibrage : `npm run balance` (non lancé par `npm test`).
 * Chaque vaisseau joue N parties de bot (10 min max), on affiche les moyennes.
 * Variables : BALANCE_RUNS (défaut 4), BALANCE_SECONDS (défaut 600).
 */
declare const process: { env: Record<string, string | undefined> };

const RUNS = Number(process.env.BALANCE_RUNS ?? 4);
const SECONDS = Number(process.env.BALANCE_SECONDS ?? 600);

it('rapport d\'équilibrage', () => {
  const rows: string[] = [];
  const pad = (v: string | number, n: number) => String(v).padStart(n);
  rows.push(`${'vaisseau'.padEnd(12)}${pad('survie', 8)}${pad('morts', 7)}${pad('vague', 7)}${pad('niv', 5)}${pad('kills', 7)}${pad('dégâts', 10)}${pad('subis', 8)}`);
  const bySource: Record<string, number> = {};
  for (const ship of SHIPS) {
    const results: BotResult[] = [];
    for (let r = 0; r < RUNS; r++) {
      const rnd = seedRandom(1000 + r);
      const res = playBotGame(ship.id, SECONDS);
      results.push(res);
      for (const [k, v] of Object.entries(res.damageBySource)) bySource[k] = (bySource[k] ?? 0) + v;
      rnd.mockRestore();
    }
    const avg = (f: (x: BotResult) => number) => Math.round(results.reduce((a, x) => a + f(x), 0) / results.length);
    rows.push(
      `${ship.id.padEnd(12)}${pad(avg(x => x.survivedSec) + 's', 8)}${pad(results.filter(x => x.died).length + '/' + RUNS, 7)}` +
      `${pad(avg(x => x.wave), 7)}${pad(avg(x => x.level), 5)}${pad(avg(x => x.kills), 7)}${pad(avg(x => x.damageDealt), 10)}${pad(avg(x => x.damageTaken), 8)}`,
    );
  }
  console.log('\n' + rows.join('\n') + '\n');
  console.log('Dégâts subis par source (toutes parties) :');
  console.log(Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(14)}${Math.round(v)}`).join('\n'));
}, 600_000);
