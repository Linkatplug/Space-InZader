/**
 * Rapporteur d'erreurs JavaScript : window.onerror / unhandledrejection → POST /api/errors.
 * Une seule fois par erreur distincte et par session, plafonné ; jamais d'IP ni de donnée personnelle.
 */
export const ERRORS_ENDPOINT = '/api/errors';
export const ERROR_LIMITS = { message: 300, source: 200, perSession: 10 } as const;

export interface ErrorReport { message: string; source: string; line: number; build: string; browser: string }

const cut = (s: unknown, max: number): string => String(s ?? '').slice(0, max);

/** Rapport borné à partir d'un événement d'erreur ou d'un rejet de promesse (format attendu par POST /api/errors). */
export const buildErrorReport = (
  input: { message?: unknown; file?: unknown; line?: unknown }, build: string, browser: string,
): ErrorReport => {
  const line = Number(input.line);
  return {
    message: cut(input.message, ERROR_LIMITS.message),
    source: cut(input.file, ERROR_LIMITS.source),
    line: Number.isInteger(line) && line >= 0 ? line : 0,
    build: cut(build, 30),
    browser: cut(browser, 160),
  };
};

/** Clé de dédoublonnage : même message + même source = même erreur. */
export const errorKey = (r: ErrorReport): string => `${r.message}|${r.source}|${r.line}`;

/** File de rapports : refuse les doublons et au-delà du plafond de la session. */
export const createErrorQueue = (max: number = ERROR_LIMITS.perSession) => {
  const seen = new Set<string>();
  return (r: ErrorReport): boolean => {
    if (!r.message || seen.size >= max) return false;
    const key = errorKey(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
};

/** Branche les écouteurs ; renvoie la fonction qui les retire. Échec d'envoi silencieux. */
export const installErrorReporter = (build: string, fetchImpl: typeof fetch = fetch): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const accept = createErrorQueue();
  const browser = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const send = (report: ErrorReport) => {
    if (!accept(report)) return;
    try {
      fetchImpl(ERRORS_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report), keepalive: true,
      }).catch(() => {});
    } catch { /* envoi impossible : on ignore */ }
  };
  const onError = (e: ErrorEvent) =>
    send(buildErrorReport({ message: e.message, file: e.filename, line: e.lineno }, build, browser));
  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason as { message?: unknown } | string | undefined;
    send(buildErrorReport({ message: typeof reason === 'string' ? reason : reason?.message ?? 'unhandledrejection' }, build, browser));
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
};
