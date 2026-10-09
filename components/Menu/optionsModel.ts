/**
 * Écran d'options : fonctions pures (testées dans tests/options.test.ts).
 */
import { GameSettings } from '../../engine/Meta';

/** Réglages réglés par curseur (0..1). */
export const SLIDER_KEYS = ['musicVolume', 'sfxVolume', 'screenShake'] as const;
export type SliderKey = typeof SLIDER_KEYS[number];

const SLIDER_STEP = 0.05;

/** Borne les curseurs à 0..1 et les arrondit au pas de 5 %. Les booléens passent tels quels. */
export const normalizeSettingsPatch = (patch: Partial<GameSettings>): Partial<GameSettings> => {
  const out: Partial<GameSettings> = { ...patch };
  for (const k of SLIDER_KEYS) {
    const v = patch[k];
    if (v === undefined) continue;
    const safe = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    out[k] = Math.round(safe / SLIDER_STEP) / (1 / SLIDER_STEP); // division : évite 0.35000000000000003
  }
  if (patch.viewZoom !== undefined) out.viewZoom = clampViewZoom(patch.viewZoom);
  return out;
};

/** Zoom de la zone de jeu : 70 % (voit plus loin, vaisseau plus petit) à 130 %, pas de 5 %. */
export const VIEW_ZOOM = { min: 0.7, max: 1.3, step: 0.05, default: 1 } as const;

/** Borne et arrondit le zoom (valeur invalide ou absente → défaut). */
export const clampViewZoom = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return VIEW_ZOOM.default;
  const c = Math.max(VIEW_ZOOM.min, Math.min(VIEW_ZOOM.max, v));
  return Math.round(c / VIEW_ZOOM.step) / (1 / VIEW_ZOOM.step);
};

export const percentLabel = (v: number) => `${Math.round(v * 100)}%`;

/** Libellé de l'intensité du tremblement. */
export const shakeLabel = (v: number) =>
  v <= 0 ? 'Désactivé' : v < 0.4 ? 'Léger' : v < 0.8 ? 'Moyen' : 'Fort';
