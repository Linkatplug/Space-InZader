import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// @ts-expect-error pas de @types/node dans ce projet (tests exécutés sous Node par Vitest)
import { mkdtempSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
// @ts-expect-error idem
import { join } from 'node:path';
// @ts-expect-error idem
import { tmpdir } from 'node:os';
import {
  SCORE_LIMITS, cleanName, validateScore, validateError, emptyBoard, addScore, leaderboard, removePlayer,
} from '../feedback/scores.mjs';
import { createFeedbackServer } from '../feedback/server.mjs';
import type { ScoreSubmission, LeaderboardResponse } from '../types';

const TOKEN = 'c'.repeat(24);
const PID = (n: number) => `joueur-${String(n).padStart(4, '0')}-abcd`;

const sub = (over: Partial<ScoreSubmission> = {}): ScoreSubmission => ({
  playerId: PID(1), name: 'Linka', score: 12000, wave: 8, level: 11, timeSec: 300, kills: 400,
  ship: 'interceptor', build: '170', website: '',
  device: 'ordinateur', input: 'clavier', end: 'mort', lastHitBy: 'gunner',
  weapons: [{ id: 'ion_blaster', level: 3 }], keystones: ['glass_cannon'], levelTimes: [12, 25], topDamage: [{ source: 'gunner', dmg: 300 }],
  ...over,
});

describe('classement : validation', () => {
  it('pseudo nettoyé (2–16 car.), sinon « Pilote »', () => {
    expect(cleanName('  Linka  ')).toBe('Linka');
    expect(cleanName('a')).toBe('Pilote');
    expect(cleanName('')).toBe('Pilote');
    expect(cleanName('x'.repeat(40))).toHaveLength(16);
    expect(cleanName('Li\u0000nk‮a')).toBe('Linka');
  });

  it('score valide accepté, champs de statistiques conservés et bornés', () => {
    const v = validateScore(sub());
    expect(v.status).toBe(201);
    expect(v.sub).toMatchObject({ playerId: PID(1), name: 'Linka', ship: 'interceptor', end: 'mort', input: 'clavier' });
    expect(v.sub.website).toBeUndefined();
    expect(validateScore(sub({ weapons: Array.from({ length: 30 }, () => ({ id: 'x', level: 1 })) })).sub.weapons.length).toBeLessThanOrEqual(8);
  });

  it('refuse : valeurs non entières, négatives, hors bornes, incohérentes, joueur ou vaisseau invalides', () => {
    expect(validateScore(sub({ score: 1.5 })).status).toBe(400);
    expect(validateScore(sub({ score: -1 })).status).toBe(400);
    expect(validateScore(sub({ score: SCORE_LIMITS.score + 1 })).status).toBe(400);
    expect(validateScore(sub({ wave: 0 })).status).toBe(400);
    expect(validateScore(sub({ timeSec: SCORE_LIMITS.timeSec + 1 })).status).toBe(400);
    expect(validateScore(sub({ kills: 100_000, timeSec: 10 })).status).toBe(400);
    expect(validateScore(sub({ playerId: 'x' })).status).toBe(400);
    expect(validateScore(sub({ ship: '<script>' })).status).toBe(400);
    expect(validateScore(null).status).toBe(400);
  });

  it('piège à robots : accepté en silence, rien enregistré', () => {
    const v = validateScore(sub({ website: 'spam' }));
    expect(v).toEqual({ status: 201, bot: true });
  });

  it('erreurs JS : message obligatoire, texte borné', () => {
    expect(validateError({ message: '' }).status).toBe(400);
    const v = validateError({ message: 'TypeError: x is undefined', source: 'index.js', line: 12, build: '170', browser: 'Firefox' });
    expect(v.status).toBe(201);
    expect(v.err.line).toBe(12);
  });
});

describe('classement : calcul', () => {
  it('meilleur score par joueur, pseudo = dernier utilisé, record perso', () => {
    let b = emptyBoard();
    let r = addScore(b, validateScore(sub({ score: 1000 })).sub, '2026-10-09T10:00:00Z'); b = r.board;
    expect(r.personalBest).toBe(true);
    r = addScore(b, validateScore(sub({ score: 500, name: 'Nouveau' })).sub, '2026-10-09T11:00:00Z'); b = r.board;
    expect(r.personalBest).toBe(false);
    expect(b.players[PID(1)]).toMatchObject({ score: 1000, name: 'Nouveau', date: '2026-10-09T10:00:00Z' });
    r = addScore(b, validateScore(sub({ score: 2000 })).sub, '2026-10-09T12:00:00Z'); b = r.board;
    expect(r.personalBest).toBe(true);
    expect(Object.keys(b.players)).toHaveLength(1);
  });

  it('rang, top N, ligne du joueur hors top, total', () => {
    let b = emptyBoard();
    for (let i = 1; i <= 25; i++) b = addScore(b, validateScore(sub({ playerId: PID(i), score: i * 100, name: `P${i}` })).sub, `2026-10-09T10:${String(i).padStart(2, '0')}:00Z`).board;
    const lb = leaderboard(b, PID(3), 10);
    expect(lb.total).toBe(25);
    expect(lb.top).toHaveLength(10);
    expect(lb.top[0]).toMatchObject({ rank: 1, name: 'P25', score: 2500 });
    expect(lb.top.some(r => r.me)).toBe(false);
    expect(lb.me).toMatchObject({ rank: 23, name: 'P3', me: true });
    expect(leaderboard(b, PID(25), 10).top[0].me).toBe(true);
    expect(leaderboard(b, '', 999).top.length).toBeLessThanOrEqual(SCORE_LIMITS.topMax);
  });

  it('au-delà du maximum de joueurs : on garde les meilleurs', () => {
    let b = emptyBoard();
    for (let i = 1; i <= 6; i++) b = addScore(b, validateScore(sub({ playerId: PID(i), score: i })).sub, '2026-10-09T10:00:00Z', 4).board;
    expect(Object.keys(b.players).sort()).toEqual([PID(3), PID(4), PID(5), PID(6)]);
  });

  it('retirer un joueur', () => {
    const b = addScore(emptyBoard(), validateScore(sub()).sub, '2026-10-09T10:00:00Z').board;
    expect(removePlayer(b, PID(1)).removed).toMatchObject({ name: 'Linka' });
    expect(removePlayer(b, PID(1)).board.players).toEqual({});
    expect(removePlayer(b, PID(9)).removed).toBeNull();
  });
});

describe('classement : serveur HTTP', () => {
  let dir: string;
  let server: any;
  let base: string;
  let clock = 0;
  const start = async () => {
    server = createFeedbackServer({ dataDir: dir, adminToken: TOKEN, now: () => clock });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const postScore = (body: unknown, ip = '9.9.9.9') => fetch(`${base}/api/scores`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Real-IP': ip }, body: JSON.stringify(body),
  });

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'si-scores-'));
    clock = Date.parse('2026-10-09T12:00:00Z');
    await start();
  });
  afterEach(async () => {
    await new Promise(r => server?.close(r));
    rmSync(dir, { recursive: true, force: true });
  });

  it('POST → 201 avec classement et record perso ; GET renvoie le même ; journal des parties sans IP', async () => {
    const r = await postScore(sub(), '203.0.113.9');
    expect(r.status).toBe(201);
    const lb = await r.json() as LeaderboardResponse;
    expect(lb.personalBest).toBe(true);
    expect(lb.total).toBe(1);
    expect(lb.me).toMatchObject({ rank: 1, name: 'Linka', me: true });
    const g = await (await fetch(`${base}/api/scores?limit=5&playerId=${PID(1)}`)).json() as LeaderboardResponse;
    expect(g.top[0]).toMatchObject({ rank: 1, score: 12000, me: true });
    // 2e partie moins bonne : journalisée quand même, classement inchangé
    const r2 = await (await postScore(sub({ score: 10 }))).json() as LeaderboardResponse;
    expect(r2.personalBest).toBe(false);
    const runs = readFileSync(join(dir, 'runs.jsonl'), 'utf8').trim().split('\n');
    expect(runs).toHaveLength(2);
    expect(JSON.parse(runs[0])).toMatchObject({ playerId: PID(1), end: 'mort', levelTimes: [12, 25] });
    expect(readFileSync(join(dir, 'runs.jsonl'), 'utf8')).not.toContain('203.0.113.9');
    expect(readFileSync(join(dir, 'scores.json'), 'utf8')).not.toContain('203.0.113.9');
  });

  it('codes : 400 invalide, 413 trop gros, 429 trop d\'envois, 405, piège ignoré', async () => {
    expect((await postScore(sub({ score: -5 }))).status).toBe(400);
    expect((await postScore({ ...sub(), name: 'x'.repeat(SCORE_LIMITS.body) })).status).toBe(413);
    expect((await fetch(`${base}/api/scores`, { method: 'DELETE' })).status).toBe(405);
    expect((await postScore(sub({ website: 'bot' }))).status).toBe(201);
    expect(existsSync(join(dir, 'scores.json'))).toBe(false);
    for (let i = 0; i < SCORE_LIMITS.perHour - 2; i++) expect((await postScore(sub())).status).toBe(201);
    expect((await postScore(sub())).status).toBe(429);
  });

  it('envois simultanés : aucun perdu (écritures en file)', async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => postScore(sub({ playerId: PID(i + 1), score: i }), `10.0.0.${i}`)));
    const g = await (await fetch(`${base}/api/scores`)).json() as LeaderboardResponse;
    expect(g.total).toBe(20);
    expect(readFileSync(join(dir, 'runs.jsonl'), 'utf8').trim().split('\n')).toHaveLength(20);
  });

  it('erreurs JS journalisées', async () => {
    const r = await fetch(`${base}/api/errors`, { method: 'POST', body: JSON.stringify({ message: 'Boom', source: 'a.js', line: 3, build: '170' }) });
    expect(r.status).toBe(201);
    expect(readFileSync(join(dir, 'errors.jsonl'), 'utf8')).toContain('Boom');
  });

  it('page privée : classement + retrait archivé (jamais supprimé), statistiques ; mauvais code → 404', async () => {
    await postScore(sub({ name: 'Tricheur', score: 49_000_000, kills: 9000, timeSec: 400 }));
    await postScore(sub({ playerId: PID(2), name: 'Honnete', score: 5000 }));
    expect((await fetch(`${base}/api/avis/mauvais${'x'.repeat(20)}/scores`)).status).toBe(404);
    const page = await (await fetch(`${base}/api/avis/${TOKEN}/scores`)).text();
    expect(page).toContain('Tricheur');
    const rm = await fetch(`${base}/api/avis/${TOKEN}/scores/remove`, {
      method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `playerId=${PID(1)}`,
    });
    expect(rm.status).toBe(303);
    expect(rm.headers.get('location')).toBe('../scores?removed=1');
    const g = await (await fetch(`${base}/api/scores`)).json() as LeaderboardResponse;
    expect(g.top.map(r => r.name)).toEqual(['Honnete']);
    expect(readdirSync(join(dir, 'archive'))).toContain('scores-retires.jsonl');
    expect(readFileSync(join(dir, 'archive', 'scores-retires.jsonl'), 'utf8')).toContain('Tricheur');
    const stats = await fetch(`${base}/api/avis/${TOKEN}/stats?period=all`);
    expect(stats.status).toBe(200);
    const html = await stats.text();
    expect(html).toContain('Statistiques');
    expect(html).toContain('interceptor');
    expect(html).toContain('éliminations/s'); // la partie du tricheur est signalée en anomalie
  });
});
