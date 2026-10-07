import { it } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { makeState, addEnemy, run, seedRandom } from '../tests/helpers';
import { GameState } from '../types';

/**
 * Banc d'essai des armes : `npm run bench:weapons`.
 * Chaque arme seule (Tech I, puis Tech III), tir continu, mannequins sans armure ni bouclier.
 *  - mono  : 1 cible fixe dans l'axe à 400px, 30s → DPS soutenu (surchauffe comprise)
 *  - foule : 12 cibles fixes groupées à ~450px, 30s → DPS total de zone
 *  - nuée  : 25 ennemis fragiles qui foncent sur le joueur → nombre tués en 15s
 *  - uptime: part du temps passé à pouvoir tirer (pas en surchauffe)
 */

const dummy = (s: GameState, dx: number, dy: number, hull: number, speed = 0) => {
  const e = addEnemy(s, 'basic', dx, dy);
  e.defense = { shield: 0, armor: 0, hull };
  e.baseStats = { ...e.baseStats, maxHull: hull, maxArmor: 0, maxShield: 0, speed };
  e.runtimeStats = e.baseStats;
  return e;
};

const scenario = (id: string, level: number, setup: (s: GameState) => void, seconds: number) => {
  const rnd = seedRandom(77);
  const s = makeState({ noSpawn: true, weaponIds: [id] });
  s.activeWeapons[0].level = level;
  s.autoFire = true;
  s.player.isGodMode = true;
  setup(s);
  // Les cibles fixes sont ancrées (sinon le recul les sort de portée pour toujours)
  const anchors = s.enemies.filter(e => e.baseStats.speed === 0).map(e => ({ e, x: e.x, y: e.y }));
  let overheatedFrames = 0;
  const frames = seconds * 60;
  for (let i = 0; i < frames; i++) {
    run(s, 1 / 60, { mouse: { x: s.player.x + 400, y: s.player.y } });
    if (s.isOverheated) overheatedFrames++;
    for (const a of anchors) { a.e.x = a.x; a.e.y = a.y; a.e.kx = 0; a.e.ky = 0; }
  }
  rnd.mockRestore();
  return { s, uptime: 1 - overheatedFrames / frames };
};

it('banc des armes', () => {
  const rows: string[] = [];
  const p = (v: string | number, n: number) => String(v).padStart(n);
  rows.push(`${'arme'.padEnd(18)}${p('mono', 7)}${p('foule', 7)}${p('nuée', 6)}${p('uptime', 8)}${p('mono3', 7)}${p('foule3', 8)}`);
  for (const w of WEAPONS) {
    const mono = (lvl: number) => scenario(w.id, lvl, s => { dummy(s, 400, 0, 1e9); }, 30);
    const crowd = (lvl: number) => scenario(w.id, lvl, s => {
      for (let i = 0; i < 12; i++) dummy(s, 400 + (i % 4) * 45, ((i / 4) | 0) * 60 - 60, 1e9);
    }, 30);
    const swarm = scenario(w.id, 1, s => {
      for (let i = 0; i < 25; i++) {
        const a = (Math.PI * 2 * i) / 25;
        dummy(s, Math.cos(a) * (500 + (i % 3) * 120), Math.sin(a) * (500 + (i % 3) * 120), 60, 1.6);
      }
    }, 15);
    const m1 = mono(1), c1 = crowd(1), m3 = mono(3), c3 = crowd(3);
    rows.push(
      `${w.id.padEnd(18)}${p(Math.round(m1.s.damageDealt / 30), 7)}${p(Math.round(c1.s.damageDealt / 30), 7)}` +
      `${p(swarm.s.totalKills, 6)}${p(Math.round(m1.uptime * 100) + '%', 8)}${p(Math.round(m3.s.damageDealt / 30), 7)}${p(Math.round(c3.s.damageDealt / 30), 8)}`,
    );
  }
  console.log('\n' + rows.join('\n') + '\n');
});
