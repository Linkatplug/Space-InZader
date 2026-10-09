// Space InZader — serveur des avis de testeurs (F8 / bouton « Avis »).
// Node `http` pur, aucune dépendance. Chaque avis est ajouté en Markdown à data/avis.md.
//
//   POST /api/feedback              → 201 envoyé | 400 invalide | 413 trop gros | 429 trop d'avis | 507 fichier plein
//   GET  /api/avis/<code>           → page privée (HTML)       ┐ code = env FEEDBACK_ADMIN_TOKEN (≥ 24 car.)
//   GET  /api/avis/<code>/raw       → texte brut (?download=1) │ absent ou trop court → 404 partout
//   POST /api/avis/<code>/purge     → archive data/archive/avis-<date>.md (jamais de suppression)
//   GET  /api/health                → 200 ok
//
// Vie privée : l'IP (X-Real-IP posée par nginx) ne sert qu'à un compteur en mémoire vidé chaque heure,
// elle n'est jamais écrite. Lancer : `node feedback/server.mjs` (PORT=3000, DATA_DIR=./feedback/data).

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const LIMITS = {
  body: 32 * 1024,       // octets
  message: 3000,
  name: 40,
  element: 300,
  snapshot: 12000,       // caractères JSON
  file: 5 * 1024 * 1024, // taille max de avis.md
  perHour: 30,           // avis par heure et par client
  tokenMin: 24,
};

export const KINDS = ['texte', 'visuel', 'bug', 'equilibrage', 'idee', 'jaime', 'autre'];

// ---------------------------------------------------------------------------
// Fonctions pures
// ---------------------------------------------------------------------------

/** Texte sur une ligne, sans backtick (pas d'injection Markdown), tronqué à `max`. */
export const clean = (value, max) => String(value ?? '')
  .replace(/\r\n|\r|\n/g, ' ⏎ ')
  .replace(/`/g, 'ʼ')
  .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
  .trim()
  .slice(0, max);

const num = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);

/**
 * Valide et nettoie un avis reçu.
 * → { status: 201, entry } | { status: 201, bot: true } (piège rempli : ignoré en silence) | { status: 400|413, error }
 */
export const validateFeedback = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 400, error: 'invalide' };
  if (typeof body.website === 'string' && body.website.trim() !== '') return { status: 201, bot: true };
  if (!KINDS.includes(body.kind)) return { status: 400, error: 'type inconnu' };
  const message = clean(body.message, LIMITS.message);
  if (!message) return { status: 400, error: 'message vide' };
  const name = clean(body.name, LIMITS.name) || 'anonyme';

  let element = null;
  if (body.element && typeof body.element === 'object') {
    const e = body.element;
    element = { text: clean(e.text, LIMITS.element), path: clean(e.path, LIMITS.element) };
    if (e.world && typeof e.world === 'object') element.world = { x: num(e.world.x), y: num(e.world.y) };
  }

  const snapshotJson = JSON.stringify(body.snapshot ?? {});
  if (snapshotJson.length > LIMITS.snapshot) return { status: 413, error: 'instantané trop gros' };

  const c = body.context && typeof body.context === 'object' ? body.context : {};
  const context = {
    status: clean(c.status, 20),
    playtimeMin: num(c.playtimeMin),
    device: c.device === 'telephone' ? 'telephone' : 'ordinateur',
    viewport: clean(c.viewport, 20),
    build: clean(c.build, 30),
  };
  return { status: 201, entry: { kind: body.kind, message, name, element, snapshotJson, context } };
};

/** Bloc Markdown d'un avis (ajouté à avis.md). */
export const formatEntry = (entry, isoDate) => {
  const { kind, message, name, element, snapshotJson, context: c } = entry;
  const lines = [
    `## ${isoDate} · ${kind} · ${name} · ${c.device} · build ${c.build || '?'}`,
    '',
    `**Message :** ${message}`,
    '',
  ];
  if (element) {
    const world = element.world ? ` (monde ${element.world.x}, ${element.world.y})` : '';
    lines.push(`**Élément :** \`${element.path || '?'}\`${world}${element.text ? ` — « ${element.text} »` : ''}`, '');
  }
  lines.push(`**Contexte :** ${c.status || '?'} · ${c.playtimeMin} min de jeu · écran ${c.viewport || '?'}`, '');
  // Backticks échappés en ` (JSON valide) : le bloc de code ne peut pas être refermé par le contenu
  lines.push('```json', snapshotJson.replace(/`/g, '\\u0060'), '```', '', '---', '', '');
  return lines.join('\n');
};

/** Compteur d'avis par client, remis à zéro chaque heure. Rien n'est écrit sur disque. */
export const makeRateLimiter = (perHour = LIMITS.perHour, now = () => Date.now()) => {
  let windowStart = now();
  let counts = new Map();
  return (client) => {
    if (now() - windowStart >= 3600_000) { counts = new Map(); windowStart = now(); }
    const n = (counts.get(client) ?? 0) + 1;
    counts.set(client, n);
    return n <= perHour;
  };
};

/** Jeton d'accès à la page privée : comparaison en temps constant ; jeton absent/trop court → toujours faux. */
export const tokenOk = (given, expected) => {
  if (!expected || expected.length < LIMITS.tokenMin || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const escapeHtml = s => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Page privée : contenu de avis.md échappé, liens texte brut / téléchargement, bouton d'archivage. */
export const renderAdminPage = (markdown, count) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Avis Space InZader</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 16px; }
  h1 { font-size: 20px; } a, button { color: #22d3ee; }
  nav { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
  button { background: #1e293b; border: 1px solid #334155; padding: 6px 12px; cursor: pointer; }
  pre { white-space: pre-wrap; word-break: break-word; background: #020617; padding: 12px; border: 1px solid #1e293b; }
</style></head><body>
<h1>Avis des testeurs — ${count} avis</h1>
<nav><a href="./raw">texte brut</a><a href="./raw?download=1">télécharger</a>
<form method="post" action="./purge" onsubmit="return confirm('Archiver tous les avis ? (déplacés dans data/archive)')"><button>Archiver et vider</button></form></nav>
<pre>${escapeHtml(markdown || 'Aucun avis pour le moment.')}</pre>
</body></html>`;

/** Nom d'archive : avis-AAAA-MM-JJTHH-MM-SS.md */
export const archiveName = (isoDate) => `avis-${isoDate.slice(0, 19).replace(/:/g, '-')}.md`;

// ---------------------------------------------------------------------------
// Serveur
// ---------------------------------------------------------------------------

const readBody = (req, max) => new Promise((resolve) => {
  const chunks = [];
  let size = 0, tooBig = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > max) { tooBig = true; return; }
    chunks.push(c);
  });
  req.on('end', () => resolve(tooBig ? null : Buffer.concat(chunks).toString('utf8')));
  req.on('error', () => resolve(null));
});

const fileSize = async (f) => { try { return (await fs.stat(f)).size; } catch { return 0; } };
const readText = async (f) => { try { return await fs.readFile(f, 'utf8'); } catch { return ''; } };

/**
 * Crée le serveur (non démarré). Options : dataDir, adminToken, now (horloge, pour les tests).
 * @param {{ dataDir: string, adminToken?: string, now?: () => number }} options
 */
export const createFeedbackServer = ({ dataDir, adminToken = '', now = () => Date.now() }) => {
  const avisFile = path.join(dataDir, 'avis.md');
  const allow = makeRateLimiter(LIMITS.perHour, now);
  const iso = () => new Date(now()).toISOString();

  const send = (res, status, body, type = 'application/json; charset=utf-8', extra = {}) => {
    res.writeHead(status, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...extra,
    });
    res.end(body);
  };
  const json = (res, status, obj) => send(res, status, JSON.stringify(obj));

  const handleFeedback = async (req, res) => {
    const raw = await readBody(req, LIMITS.body);
    if (raw === null) return json(res, 413, { error: 'trop gros' });
    let body;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'JSON invalide' }); }
    const client = String(req.headers['x-real-ip'] || req.socket.remoteAddress || '?');
    if (!allow(client)) return json(res, 429, { error: "trop d'avis, réessaie plus tard" });
    const v = validateFeedback(body);
    if (v.status !== 201) return json(res, v.status, { error: v.error });
    if (v.bot) return json(res, 201, { ok: true });
    const block = formatEntry(v.entry, iso());
    if ((await fileSize(avisFile)) + Buffer.byteLength(block) > LIMITS.file) return json(res, 507, { error: 'fichier des avis plein' });
    await fs.mkdir(dataDir, { recursive: true });
    await fs.appendFile(avisFile, block, 'utf8');
    return json(res, 201, { ok: true });
  };

  const handleAdmin = async (req, res, url, rest) => {
    const [code, action = ''] = rest;
    if (!tokenOk(code, adminToken)) return send(res, 404, 'introuvable', 'text/plain; charset=utf-8');
    const html = { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'", 'X-Robots-Tag': 'noindex' };
    if (req.method === 'GET' && action === '') {
      // URL sans « / » final : les liens relatifs (raw, purge) doivent rester sous /api/avis/<code>/
      if (!url.pathname.endsWith('/')) return send(res, 301, '', 'text/plain', { Location: `${url.pathname}/` });
      const md = await readText(avisFile);
      const count = (md.match(/^## /gm) ?? []).length;
      return send(res, 200, renderAdminPage(md, count), 'text/html; charset=utf-8', html);
    }
    if (req.method === 'GET' && action === 'raw') {
      const extra = url.searchParams.get('download') === '1' ? { 'Content-Disposition': `attachment; filename="avis-space-inzader.md"` } : {};
      return send(res, 200, await readText(avisFile), 'text/markdown; charset=utf-8', { ...extra, 'X-Robots-Tag': 'noindex' });
    }
    if (req.method === 'POST' && action === 'purge') {
      if (await fileSize(avisFile) > 0) {
        const archiveDir = path.join(dataDir, 'archive');
        await fs.mkdir(archiveDir, { recursive: true });
        let target = path.join(archiveDir, archiveName(iso()));
        for (let i = 2; await fileSize(target) > 0; i++) target = path.join(archiveDir, archiveName(iso()).replace('.md', `-${i}.md`));
        await fs.rename(avisFile, target);
      }
      return send(res, 303, '', 'text/plain', { Location: './' });
    }
    return send(res, 404, 'introuvable', 'text/plain; charset=utf-8');
  };

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
      if (parts[0] !== 'api') return send(res, 404, 'introuvable', 'text/plain; charset=utf-8');
      if (parts[1] === 'health' && req.method === 'GET') return send(res, 200, 'ok', 'text/plain; charset=utf-8');
      if (parts[1] === 'feedback' && parts.length === 2) {
        if (req.method !== 'POST') return send(res, 405, '', 'text/plain', { Allow: 'POST' });
        return await handleFeedback(req, res);
      }
      if (parts[1] === 'avis' && parts.length >= 3 && parts.length <= 4) return await handleAdmin(req, res, url, parts.slice(2));
      return send(res, 404, 'introuvable', 'text/plain; charset=utf-8');
    } catch (err) {
      console.error('[feedback]', err);
      if (!res.headersSent) send(res, 500, JSON.stringify({ error: 'erreur serveur' }));
    }
  });
};

// Lancement direct : node feedback/server.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  const dataDir = path.resolve(process.env.DATA_DIR ?? 'feedback/data'); // jamais ./data (contenu du jeu)
  const adminToken = process.env.FEEDBACK_ADMIN_TOKEN ?? '';
  createFeedbackServer({ dataDir, adminToken }).listen(port, () => {
    const admin = adminToken.length >= LIMITS.tokenMin ? 'page privée active' : 'page privée désactivée (FEEDBACK_ADMIN_TOKEN absent ou < 24 car.)';
    console.log(`[feedback] port ${port}, données ${dataDir}, ${admin}`);
  });
}
