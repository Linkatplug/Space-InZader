/**
 * Version du jeu (affichée dans le menu, servira aussi au contexte des avis F8).
 * __BUILD__ / __BUILD_DATE__ sont injectés par vite.config.ts ; absents sous Vitest → « dev ».
 */
export const BUILD: string = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
export const BUILD_DATE: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

/** Pur : « v142 · mis à jour le 09/10/2026 », ou « v1.0.0-dev » sans date. */
export const formatBuild = (build: string, date: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  const v = `v${build}`;
  return m ? `${v} · mis à jour le ${m[3]}/${m[2]}/${m[1]}` : v;
};

export const BUILD_LABEL = formatBuild(BUILD, BUILD_DATE);
