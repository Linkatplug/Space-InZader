import { describe, it, expect } from 'vitest';
import type { LeaderboardResponse, ScoreRow } from '../types';
import { buildSubmission, formatDuration, formatScore, meOutsideTop, ordinal, rankMessage } from '../components/leaderboard/logic';
import { createInitialState } from '../engine/GameFactory';
import { buildRunSubmission, fetchLeaderboard, messageForStatus, parseLeaderboard, submitScore } from '../components/leaderboard/api';
import { LEADERBOARD_TEXT } from '../components/leaderboard/text';

const row = (rank: number, extra: Partial<ScoreRow> = {}): ScoreRow =>
  ({ rank, name: `P${rank}`, score: 1000 - rank, wave: 5, timeSec: 120, ship: 'interceptor', date: '2026-10-09', ...extra });
const resp = (over: Partial<LeaderboardResponse> = {}): LeaderboardResponse =>
  ({ top: Array.from({ length: 10 }, (_, i) => row(i + 1)), total: 120, ...over });
const fakeFetch = (status: number, body?: unknown) =>
  (async () => ({ status, json: async () => body })) as unknown as typeof fetch;

describe('classement : affichage', () => {
  it('rangs en français', () => {
    expect(ordinal(1)).toBe('1er');
    expect(ordinal(2)).toBe('2e');
    expect(ordinal(37)).toBe('37e');
  });
  it('« Tu es 37e sur 120 »', () => {
    expect(rankMessage(row(37), 120)).toBe('Tu es 37e sur 120');
    expect(rankMessage(row(1), 1)).toBe('Tu es 1er sur 1');
    expect(rankMessage(null, 10)).toBeNull();
    expect(rankMessage(undefined, 10)).toBeNull();
  });
  it('durée et score', () => {
    expect(formatDuration(75)).toBe('01:15');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(-3)).toBe('00:00');
    expect(formatScore(1234567)).toBe('1 234 567');
  });
  it('ligne du joueur à part seulement hors top 10', () => {
    expect(meOutsideTop(resp({ me: row(37, { me: true }) }))?.rank).toBe(37);
    const inTop = resp({ me: row(3) });
    inTop.top[2] = row(3, { me: true });
    expect(meOutsideTop(inTop)).toBeNull();
    expect(meOutsideTop(resp({ me: null }))).toBeNull();
  });
});

describe('classement : envoi', () => {
  it('construit la soumission : entiers ≥ 0, temps en secondes', () => {
    const sub = buildSubmission({ id: 'abc-123', name: 'Neo' },
      { score: 1234.6, wave: 7, level: 12, time: 185_400, totalKills: -2, shipId: 'gunner' }, '162');
    expect(sub).toEqual({
      playerId: 'abc-123', name: 'Neo', score: 1235, wave: 7, level: 12, timeSec: 185, kills: 0,
      ship: 'gunner', build: '162', website: '',
    });
    expect(buildSubmission({ id: 'a', name: 'b' }, { score: NaN, wave: 1, level: 1, time: NaN, totalKills: 0, shipId: 's' }, 'x').score).toBe(0);
  });
  it('messages par code', () => {
    expect(messageForStatus(400)).toBe(LEADERBOARD_TEXT.messages.invalid);
    expect(messageForStatus(413)).toBe(LEADERBOARD_TEXT.messages.tooBig);
    expect(messageForStatus(429)).toBe(LEADERBOARD_TEXT.messages.tooMany);
    for (const c of [0, 404, 502]) expect(messageForStatus(c)).toBe(LEADERBOARD_TEXT.messages.unavailable);
    expect(messageForStatus(418)).toBe(LEADERBOARD_TEXT.messages.unknown);
  });
  it('POST 201 → classement ; erreurs et réseau → message', async () => {
    const sub = buildSubmission({ id: 'abcdefgh', name: 'Neo' }, { score: 1, wave: 1, level: 1, time: 0, totalKills: 0, shipId: 'x' }, 'b');
    const ok = await submitScore(sub, fakeFetch(201, resp()));
    expect(ok.ok && ok.data.total).toBe(120);
    expect(await submitScore(sub, fakeFetch(429))).toEqual({ ok: false, message: LEADERBOARD_TEXT.messages.tooMany });
    expect(await submitScore(sub, fakeFetch(400))).toEqual({ ok: false, message: LEADERBOARD_TEXT.messages.invalid });
    const down = await submitScore(sub, (async () => { throw new TypeError('réseau'); }) as unknown as typeof fetch);
    expect(down).toEqual({ ok: false, message: LEADERBOARD_TEXT.messages.unavailable });
  });
  it('réponse invalide (HTML d’un serveur de dev) → indisponible', async () => {
    const bad = (async () => ({ status: 200, json: async () => { throw new SyntaxError('html'); } })) as unknown as typeof fetch;
    expect(await fetchLeaderboard('abcdefgh', 10, bad)).toEqual({ ok: false, message: LEADERBOARD_TEXT.messages.unavailable });
    expect(parseLeaderboard({ nope: 1 })).toBeNull();
    expect(parseLeaderboard(resp())).not.toBeNull();
  });
  it('GET : limite et playerId dans l’URL', async () => {
    let url = '';
    const spy = (async (u: string) => { url = u; return { status: 200, json: async () => resp() }; }) as unknown as typeof fetch;
    await fetchLeaderboard('abc def', 10, spy);
    expect(url).toBe('/api/scores?limit=10&playerId=abc+def');
  });
});

describe('classement : soumission complète depuis l’état', () => {
  it('score + statistiques, listes bornées', () => {
    const s = createInitialState('gunner');
    s.status = 'gameover'; s.score = 4321; s.wave = 6; s.level = 9; s.time = 200_000; s.totalKills = 77;
    s.lastHitBy = 'tank'; s.damageBySource = { tank: 50, sniper: 20, a: 1, b: 2, c: 3, d: 4, e: 5 };
    const sub = buildRunSubmission(s, { id: 'abcdefgh', name: 'Neo' }, {
      device: 'telephone', input: 'tactile', end: 'abandon', build: '162', levelTimes: [10.4, 25, NaN, 40],
    });
    expect(sub).toMatchObject({ playerId: 'abcdefgh', name: 'Neo', score: 4321, wave: 6, level: 9, timeSec: 200, kills: 77,
      ship: 'gunner', build: '162', website: '', device: 'telephone', input: 'tactile', end: 'abandon', lastHitBy: 'tank' });
    expect(sub.weapons!.length).toBeGreaterThan(0);
    expect(sub.topDamage!.length).toBeLessThanOrEqual(5);
    expect(sub.topDamage![0]).toEqual({ source: 'tank', dmg: 50 });
    expect(sub.levelTimes).toEqual([10, 25, 40]);
    expect(JSON.stringify(sub).length).toBeLessThan(8000);
  });
  it('sans cause de mort ni temps de niveaux', () => {
    const st = createInitialState(); st.status = 'gameover';
    const sub = buildRunSubmission(st, { id: 'abcdefgh', name: 'Neo' },
      { device: 'ordinateur', input: 'clavier', end: 'mort', build: 'x' });
    expect(sub.lastHitBy).toBeNull();
    expect('levelTimes' in sub).toBe(false);
  });
});
