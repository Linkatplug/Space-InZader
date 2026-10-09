// Space InZader — tableau de bord statistiques (page privée /api/avis/<jeton>/stats).
// Agrégations PURES (entrée : lignes de runs.jsonl / errors.jsonl / titres d'avis → sortie : chiffres),
// puis rendu HTML léger (barres en CSS, aucune dépendance, aucun script).

const DAY = 86_400_000;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round1 = (v) => Math.round(v * 10) / 10;
const countBy = (items, key) => {
  const m = new Map();
  for (const it of items) { const k = key(it); if (k == null) continue; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([k, n]) => ({ key: k, count: n })).sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
};

/** Filtre période ('7' | '30' | 'all') et version ('all' | build). */
export const filterRuns = (runs, { period = 'all', build = 'all', now = Date.now() } = {}) => {
  const since = period === '7' ? now - 7 * DAY : period === '30' ? now - 30 * DAY : -Infinity;
  return runs.filter(r => Date.parse(r.date) >= since && (build === 'all' || r.build === build));
};

/** Seuils des anomalies (scores improbables). */
export const ANOMALY = {
  killsPerSec: 12,          // éliminations / seconde
  levelSlack: 4,            // niveau max plausible = slack + timeSec / secPerLevel
  secPerLevel: 8,
  scoreRateFactor: 6,       // score/s > facteur × médiane (si assez de parties)
  minRunsForMedian: 10,
  manyRunsPerDay: 60,       // joueur avec beaucoup d'envois en 24 h
};

/** Parties suspectes : raisons lisibles. */
export const findAnomalies = (runs) => {
  const rates = runs.filter(r => r.timeSec > 0).map(r => r.score / r.timeSec);
  const med = rates.length >= ANOMALY.minRunsForMedian ? median(rates) : 0;
  const out = [];
  for (const r of runs) {
    const reasons = [];
    const t = Math.max(1, r.timeSec);
    if (r.kills / t > ANOMALY.killsPerSec) reasons.push(`${round1(r.kills / t)} éliminations/s`);
    if (r.level > ANOMALY.levelSlack + t / ANOMALY.secPerLevel) reasons.push(`niveau ${r.level} en ${r.timeSec} s`);
    if (med > 0 && r.score / t > med * ANOMALY.scoreRateFactor) reasons.push(`score/s ×${round1(r.score / t / med)} la médiane`);
    if (reasons.length) out.push({ date: r.date, playerId: r.playerId, name: r.name, score: r.score, reasons });
  }
  return out;
};

/** Joueurs avec beaucoup d'envois sur une même journée. */
export const heavySubmitters = (runs) => {
  const m = new Map();
  for (const r of runs) {
    const k = `${r.playerId}|${String(r.date).slice(0, 10)}`;
    m.set(k, { playerId: r.playerId, name: r.name, day: String(r.date).slice(0, 10), count: (m.get(k)?.count ?? 0) + 1 });
  }
  return [...m.values()].filter(x => x.count >= ANOMALY.manyRunsPerDay).sort((a, b) => b.count - a.count);
};

/** Temps moyen (s) pour atteindre un niveau (levelTimes[0] = niveau 2). */
const timeToLevel = (runs, level) => {
  const ts = runs.map(r => r.levelTimes?.[level - 2]).filter(t => typeof t === 'number');
  return ts.length ? { avg: Math.round(avg(ts)), n: ts.length } : null;
};

/** Ligne de titre d'un avis dans avis.md : « ## date · type · pseudo · appareil · build x ». */
export const feedbackKinds = (avisMarkdown = '') =>
  countBy((avisMarkdown.match(/^## .+$/gm) ?? []).map(l => l.split(' · ')[1]?.trim()), k => k || null);

/**
 * Toutes les statistiques du tableau de bord.
 * @param {object[]} allRuns lignes de runs.jsonl
 * @param {{ period?: string, build?: string, now?: number, errors?: object[], avis?: string }} opts
 */
export const computeStats = (allRuns, opts = {}) => {
  const now = opts.now ?? Date.now();
  const runs = filterRuns(allRuns, { period: opts.period, build: opts.build, now });
  const times = runs.map(r => r.timeSec);

  // Parties par jour (sur la période ; 30 derniers jours au plus pour « tout »)
  const days = new Map();
  for (const r of runs) { const d = String(r.date).slice(0, 10); days.set(d, (days.get(d) ?? 0) + 1); }
  const perDay = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([day, count]) => ({ day, count }));

  const group = (key) => {
    const m = new Map();
    for (const r of runs) for (const k of key(r)) { if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
    return m;
  };

  const perShip = [...group(r => [r.ship]).entries()].map(([ship, rs]) => ({
    ship, runs: rs.length, avgWave: round1(avg(rs.map(r => r.wave))), avgTime: Math.round(avg(rs.map(r => r.timeSec))), best: Math.max(...rs.map(r => r.score)),
  })).sort((a, b) => b.runs - a.runs);

  const itemStats = (key) => [...group(key).entries()].map(([id, rs]) => ({
    id, runs: rs.length, pickRate: runs.length ? round1((rs.length / runs.length) * 100) : 0, avgWave: round1(avg(rs.map(r => r.wave))),
  })).sort((a, b) => b.runs - a.runs);

  const perBuild = [...group(r => [r.build ?? '?']).entries()].map(([build, rs]) => ({
    build, runs: rs.length, avgWave: round1(avg(rs.map(r => r.wave))), avgTime: Math.round(avg(rs.map(r => r.timeSec))),
  })).sort((a, b) => String(b.build).localeCompare(String(a.build), undefined, { numeric: true }));

  // Vague atteinte selon la durée de la partie
  const buckets = [[0, 60], [60, 180], [180, 300], [300, 600], [600, Infinity]];
  const waveByTime = buckets.map(([a, b]) => {
    const rs = runs.filter(r => r.timeSec >= a && r.timeSec < b);
    return { label: b === Infinity ? `${a / 60}+ min` : `${a / 60}–${b / 60} min`, runs: rs.length, avgWave: round1(avg(rs.map(r => r.wave))) };
  });

  const errors = opts.errors ?? [];
  return {
    filters: { period: opts.period ?? 'all', build: opts.build ?? 'all' },
    builds: [...new Set(allRuns.map(r => r.build ?? '?'))].sort((a, b) => String(b).localeCompare(String(a), undefined, { numeric: true })),
    totals: {
      runs: runs.length,
      players: new Set(runs.map(r => r.playerId)).size,
      playtimeSec: times.reduce((a, b) => a + b, 0),
      avgSec: Math.round(avg(times)),
      medianSec: Math.round(median(times)),
      short: runs.filter(r => r.timeSec < 60).length,
    },
    perDay,
    perShip,
    deaths: countBy(runs.filter(r => r.end !== 'abandon'), r => r.lastHitBy ?? null).slice(0, 15),
    weapons: itemStats(r => (r.weapons ?? []).map(w => w.id)),
    keystones: itemStats(r => r.keystones ?? []),
    pacing: { lvl2: timeToLevel(runs, 2), lvl5: timeToLevel(runs, 5), lvl10: timeToLevel(runs, 10) },
    waveByTime,
    endings: countBy(runs, r => r.end ?? 'inconnu'),
    devices: countBy(runs, r => r.device ?? 'inconnu'),
    inputs: countBy(runs, r => r.input ?? 'inconnu'),
    perBuild,
    anomalies: findAnomalies(runs).slice(-50).reverse(),
    heavy: heavySubmitters(runs).slice(0, 20),
    errorsTop: countBy(errors, e => `${e.message} — ${e.source ?? ''}${e.line != null ? `:${e.line}` : ''}`).slice(0, 15),
    feedback: feedbackKinds(opts.avis),
  };
};

// ---------------------------------------------------------------------------
// Rendu HTML (léger, sans script)
// ---------------------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const dur = (sec) => {
  const s = Math.round(sec);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
};
const bars = (rows, label, value, fmt = (v) => v) => {
  if (!rows.length) return '<p class="muted">Aucune donnée.</p>';
  const max = Math.max(...rows.map(value), 1);
  return `<div class="bars">${rows.map(r => `<div class="bar"><span class="l">${esc(label(r))}</span><span class="t"><i style="width:${(value(r) / max) * 100}%"></i></span><span class="v">${esc(fmt(value(r)))}</span></div>`).join('')}</div>`;
};
const table = (head, rows) => rows.length
  ? `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  : '<p class="muted">Aucune donnée.</p>';

export const renderStatsPage = (st) => {
  const t = st.totals;
  const link = (period, build) => `?period=${period}&build=${encodeURIComponent(build)}`;
  const periodLinks = [['7', '7 jours'], ['30', '30 jours'], ['all', 'tout']]
    .map(([p, l]) => p === st.filters.period ? `<b>${l}</b>` : `<a href="${link(p, st.filters.build)}">${l}</a>`).join(' · ');
  const buildLinks = ['all', ...st.builds]
    .map(b => b === st.filters.build ? `<b>${b === 'all' ? 'toutes' : `v${esc(b)}`}</b>` : `<a href="${link(st.filters.period, b)}">${b === 'all' ? 'toutes' : `v${esc(b)}`}</a>`).join(' · ');
  const p = st.pacing;
  const lv = (x) => (x ? `${dur(x.avg)} (${x.n})` : '—');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Statistiques Space InZader</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 16px; max-width: 1100px; }
  a { color: #22d3ee; } h1 { font-size: 22px; } h2 { font-size: 16px; color: #67e8f9; margin-top: 28px; border-bottom: 1px solid #1e293b; padding-bottom: 4px; }
  .muted { color: #64748b; } .filters { margin: 8px 0; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
  .card { background: #020617; border: 1px solid #1e293b; padding: 10px; } .card b { display: block; font-size: 22px; color: #fff; }
  .bars { display: grid; gap: 3px; } .bar { display: grid; grid-template-columns: minmax(90px, 220px) 1fr 70px; gap: 8px; align-items: center; font-size: 13px; }
  .bar .l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .bar .t { background: #1e293b; height: 12px; } .bar i { display: block; height: 100%; background: #22d3ee; }
  .bar .v { text-align: right; font-variant-numeric: tabular-nums; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; } th, td { border-bottom: 1px solid #1e293b; padding: 4px 6px; text-align: left; } th { color: #94a3b8; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .warn { color: #fbbf24; }
</style></head><body>
<p><a href="./">← avis</a> · <a href="./scores">classement</a></p>
<h1>Statistiques</h1>
<div class="filters">Période : ${periodLinks}</div>
<div class="filters">Version : ${buildLinks}</div>

<div class="cards">
  <div class="card"><b>${t.runs}</b>parties</div>
  <div class="card"><b>${t.players}</b>joueurs uniques</div>
  <div class="card"><b>${dur(t.playtimeSec)}</b>temps de jeu cumulé</div>
  <div class="card"><b>${dur(t.avgSec)}</b>durée moyenne (médiane ${dur(t.medianSec)})</div>
  <div class="card"><b>${t.short}</b>parties &lt; 60 s (frustration ?)</div>
</div>

<h2>Parties par jour</h2>${bars(st.perDay, r => r.day, r => r.count)}

<h2>Par vaisseau</h2>${table(['Vaisseau', 'Parties', 'Vague moy.', 'Survie moy.', 'Meilleur score'], st.perShip.map(s => [s.ship, s.runs, s.avgWave, dur(s.avgTime), s.best]))}

<div class="grid2">
<div><h2>Causes de mort</h2>${bars(st.deaths, r => r.key, r => r.count)}</div>
<div><h2>Fins de partie / appareils / commandes</h2>${bars([...st.endings, ...st.devices, ...st.inputs], r => r.key, r => r.count)}</div>
</div>

<h2>Armes : taux de choix et vague moyenne atteinte</h2>${table(['Arme', 'Parties', '% des parties', 'Vague moy.'], st.weapons.map(w => [w.id, w.runs, `${w.pickRate} %`, w.avgWave]))}
<h2>Keystones</h2>${table(['Keystone', 'Parties', '% des parties', 'Vague moy.'], st.keystones.map(w => [w.id, w.runs, `${w.pickRate} %`, w.avgWave]))}

<div class="grid2">
<div><h2>Rythme</h2>${table(['Niveau', 'Temps moyen (parties)'], [['2', lv(p.lvl2)], ['5', lv(p.lvl5)], ['10', lv(p.lvl10)]])}</div>
<div><h2>Vague selon la durée</h2>${table(['Durée', 'Parties', 'Vague moy.'], st.waveByTime.map(w => [w.label, w.runs, w.avgWave]))}</div>
</div>

<h2>Comparaison des versions</h2>${table(['Version', 'Parties', 'Vague moy.', 'Survie moy.'], st.perBuild.map(b => [`v${b.build}`, b.runs, b.avgWave, dur(b.avgTime)]))}

<h2 class="warn">Anomalies à vérifier</h2>
${table(['Date', 'Pseudo', 'Joueur', 'Score', 'Pourquoi'], st.anomalies.map(a => [String(a.date).slice(0, 16).replace('T', ' '), a.name, String(a.playerId).slice(0, 8), a.score, a.reasons.join(', ')]))}
<h2>Beaucoup d'envois sur une journée</h2>${table(['Jour', 'Pseudo', 'Joueur', 'Parties'], st.heavy.map(h => [h.day, h.name, String(h.playerId).slice(0, 8), h.count]))}
<h2>Erreurs JavaScript les plus fréquentes</h2>${bars(st.errorsTop, r => r.key, r => r.count)}
<h2>Avis reçus (fichier en cours)</h2>${bars(st.feedback, r => r.key, r => r.count)}
<p class="muted">Aucune adresse IP n'est enregistrée. Données : runs.jsonl, errors.jsonl, avis.md.</p>
</body></html>`;
};

/** Page privée du classement : tous les joueurs, bouton « Retirer » (archivé, jamais supprimé). */
export const renderScoresAdminPage = (board, removedNotice = '') => {
  const rows = Object.entries(board.players).sort(([, a], [, b]) => b.score - a.score || a.date.localeCompare(b.date)).slice(0, 500);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Classement Space InZader</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 16px; } a { color: #22d3ee; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; } th, td { border-bottom: 1px solid #1e293b; padding: 4px 6px; text-align: left; }
  button { background: #7f1d1d; color: #fff; border: 0; padding: 3px 8px; cursor: pointer; } .ok { color: #4ade80; }
</style></head><body>
<p><a href="./">← avis</a> · <a href="./stats">statistiques</a></p>
<h1>Classement — ${rows.length} joueur(s)</h1>
${removedNotice ? `<p class="ok">${esc(removedNotice)}</p>` : ''}
<table><thead><tr><th>#</th><th>Pseudo</th><th>Score</th><th>Vague</th><th>Niveau</th><th>Durée</th><th>Vaisseau</th><th>Version</th><th>Date</th><th>Joueur</th><th></th></tr></thead><tbody>
${rows.map(([id, e], i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.score}</td><td>${e.wave}</td><td>${e.level ?? ''}</td><td>${dur(e.timeSec)}</td><td>${esc(e.ship)}</td><td>${esc(e.build)}</td><td>${esc(String(e.date).slice(0, 16).replace('T', ' '))}</td><td>${esc(id.slice(0, 8))}</td>
<td><form method="post" action="./scores/remove" onsubmit="return confirm('Retirer ${esc(e.name).replace(/'/g, '')} du classement ? (archivé)')"><input type="hidden" name="playerId" value="${esc(id)}"><button>Retirer</button></form></td></tr>`).join('\n')}
</tbody></table>
</body></html>`;
};
