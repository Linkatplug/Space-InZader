import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// @ts-expect-error pas de @types/node dans ce projet (tests exécutés sous Node par Vitest)
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
// @ts-expect-error idem
import { join } from 'node:path';
// @ts-expect-error idem
import { tmpdir } from 'node:os';
import {
  LIMITS, clean, validateFeedback, formatEntry, makeRateLimiter, tokenOk, archiveName, createFeedbackServer,
} from '../feedback/server.mjs';
import type { FeedbackPayload } from '../types';

const TOKEN = 'a'.repeat(12) + 'b'.repeat(12); // 24 car.

const payload = (over: Partial<FeedbackPayload> = {}): FeedbackPayload => ({
  kind: 'bug', message: 'Le boss traverse les murs', name: 'Testeur', website: '',
  element: { text: 'VAGUE 10', path: 'div.hud > span', world: { x: 1200.4, y: 980.6 } },
  snapshot: { status: 'playing', wave: 10, level: 12 },
  context: { status: 'playing', playtimeMin: 7, device: 'ordinateur', viewport: '1280x720', build: '163' },
  ...over,
});

describe('avis : fonctions pures', () => {
  it('clean : une ligne, sans backtick, tronqué', () => {
    expect(clean('a\nb\r\nc', 100)).toBe('a ⏎ b ⏎ c');
    expect(clean('```js\nalert(1)```', 100)).not.toContain('`');
    expect(clean('x'.repeat(50), 40)).toHaveLength(40);
    expect(clean(undefined, 10)).toBe('');
  });

  it('validation : type, message obligatoire, pseudo par défaut, piège à robots', () => {
    expect(validateFeedback(payload()).status).toBe(201);
    expect(validateFeedback(payload({ message: '   ' })).status).toBe(400);
    expect(validateFeedback(payload({ kind: 'hack' as any })).status).toBe(400);
    expect(validateFeedback(null).status).toBe(400);
    expect(validateFeedback(payload({ name: '' })).entry.name).toBe('anonyme');
    const bot = validateFeedback(payload({ website: 'http://spam' }));
    expect(bot.status).toBe(201);
    expect(bot.bot).toBe(true);
    expect(validateFeedback(payload({ snapshot: { status: 'playing', ship: 'x'.repeat(LIMITS.snapshot) } })).status).toBe(413);
    expect(validateFeedback(payload({ message: 'm'.repeat(5000) })).entry.message).toHaveLength(LIMITS.message);
  });

  it('Markdown : titre, message, élément, instantané JSON non refermable', () => {
    const v = validateFeedback(payload({ snapshot: { status: 'playing', ship: '```' } as any }));
    const md = formatEntry(v.entry, '2026-10-09T12:00:00.000Z');
    expect(md).toMatch(/^## 2026-10-09T12:00:00.000Z · bug · Testeur · ordinateur · build 163/);
    expect(md).toContain('**Message :** Le boss traverse les murs');
    expect(md).toContain('`div.hud > span` (monde 1200, 981)');
    expect(md.match(/```/g)).toHaveLength(2); // ouverture + fermeture du bloc json seulement
    const json = md.split('```json\n')[1].split('\n```')[0];
    expect(JSON.parse(json).ship).toBe('```');
  });

  it('limite par heure, remise à zéro', () => {
    let t = 0;
    const allow = makeRateLimiter(3, () => t);
    expect([allow('ip'), allow('ip'), allow('ip'), allow('ip')]).toEqual([true, true, true, false]);
    expect(allow('autre')).toBe(true);
    t += 3600_000;
    expect(allow('ip')).toBe(true);
  });

  it('jeton : exact, ≥ 24 car., sinon refusé', () => {
    expect(tokenOk(TOKEN, TOKEN)).toBe(true);
    expect(tokenOk(TOKEN + 'x', TOKEN)).toBe(false);
    expect(tokenOk('court', 'court')).toBe(false);
    expect(tokenOk('', '')).toBe(false);
    expect(tokenOk(undefined as any, TOKEN)).toBe(false);
  });

  it("nom d'archive", () => {
    expect(archiveName('2026-10-09T12:34:56.789Z')).toBe('avis-2026-10-09T12-34-56.md');
  });
});

describe('avis : serveur HTTP', () => {
  let dir: string;
  let server: any;
  let base: string;
  let clock = 0;

  const start = async (adminToken = TOKEN) => {
    server = createFeedbackServer({ dataDir: dir, adminToken, now: () => clock });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  const avis = () => readFileSync(join(dir, 'avis.md'), 'utf8') as string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'si-avis-'));
    clock = Date.parse('2026-10-09T12:00:00Z');
  });
  afterEach(async () => {
    await new Promise(r => server?.close(r));
    rmSync(dir, { recursive: true, force: true });
  });

  it("un avis valide est ajouté au fichier, sans l'IP", async () => {
    await start();
    const r = await post(payload(), { 'X-Real-IP': '203.0.113.7' });
    expect(r.status).toBe(201);
    expect(avis()).toContain('Le boss traverse les murs');
    expect(avis()).not.toContain('203.0.113.7');
    await post(payload({ message: 'Deuxième' }));
    expect(avis().match(/^## /gm)).toHaveLength(2);
  });

  it('codes : 400 JSON invalide, 413 corps trop gros, 405 mauvaise méthode, piège ignoré', async () => {
    await start();
    expect((await post('{pas du json')).status).toBe(400);
    expect((await post({ ...payload(), message: 'x'.repeat(LIMITS.body) })).status).toBe(413);
    expect((await fetch(`${base}/api/feedback`)).status).toBe(405);
    expect((await post(payload({ website: 'spam' }))).status).toBe(201);
    expect(existsSync(join(dir, 'avis.md'))).toBe(false);
  });

  it('429 au-delà de 30 avis par heure et par client', async () => {
    await start();
    for (let i = 0; i < LIMITS.perHour; i++) expect((await post(payload(), { 'X-Real-IP': '1.1.1.1' })).status).toBe(201);
    expect((await post(payload(), { 'X-Real-IP': '1.1.1.1' })).status).toBe(429);
    expect((await post(payload(), { 'X-Real-IP': '2.2.2.2' })).status).toBe(201);
    clock += 3600_000;
    expect((await post(payload(), { 'X-Real-IP': '1.1.1.1' })).status).toBe(201);
  });

  it('507 quand le fichier des avis est plein', async () => {
    await start();
    writeFileSync(join(dir, 'avis.md'), 'x'.repeat(LIMITS.file - 10));
    expect((await post(payload())).status).toBe(507);
  });

  it('page privée : bon code seulement, HTML échappé, texte brut, téléchargement', async () => {
    await start();
    await post(payload({ message: '<script>alert(1)</script>' }));
    expect((await fetch(`${base}/api/avis/mauvais-code-mauvais-code-123`)).status).toBe(404);
    const page = await fetch(`${base}/api/avis/${TOKEN}/`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('1 avis');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
    const raw = await fetch(`${base}/api/avis/${TOKEN}/raw`);
    expect(await raw.text()).toContain('<script>alert(1)</script>');
    const dl = await fetch(`${base}/api/avis/${TOKEN}/raw?download=1`);
    expect(dl.headers.get('content-disposition')).toContain('attachment');
  });

  it('page privée désactivée sans jeton (ou jeton trop court)', async () => {
    await start('');
    expect((await fetch(`${base}/api/avis//`)).status).toBe(404);
    expect((await fetch(`${base}/api/avis/x/raw`)).status).toBe(404);
  });

  it('purge = archive (aucune suppression)', async () => {
    await start();
    await post(payload());
    const r = await fetch(`${base}/api/avis/${TOKEN}/purge`, { method: 'POST', redirect: 'manual' });
    expect(r.status).toBe(303);
    expect(existsSync(join(dir, 'avis.md'))).toBe(false);
    const archived = readdirSync(join(dir, 'archive')) as string[];
    expect(archived).toEqual(['avis-2026-10-09T12-00-00.md']);
    expect(readFileSync(join(dir, 'archive', archived[0]), 'utf8')).toContain('Le boss traverse les murs');
    // Deuxième purge à la même seconde : nom différent, rien n'est écrasé
    await post(payload({ message: 'encore' }));
    await fetch(`${base}/api/avis/${TOKEN}/purge`, { method: 'POST', redirect: 'manual' });
    expect((readdirSync(join(dir, 'archive')) as string[]).length).toBe(2);
  });

  it('santé et routes inconnues', async () => {
    await start();
    expect((await fetch(`${base}/api/health`)).status).toBe(200);
    expect((await fetch(`${base}/api/autre`)).status).toBe(404);
    expect((await fetch(`${base}/`)).status).toBe(404);
  });
});
