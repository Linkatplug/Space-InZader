import { GameState, Weapon } from '../types';
import { TECH_MULTIPLIERS } from '../constants';

/**
 * Gestion de la chaleur.
 *
 * - Chaque arme produit de la chaleur à chaque tir (`heatPerShot` × `heatGenMult`).
 *   Les données sont réglées pour ~14 chaleur/s par arme en tir continu ; monter une arme
 *   en Tech augmente sa cadence mais PAS sa chaleur par seconde (chaleur par tir réduite d'autant).
 * - Refroidissement dynamique : plus le vaisseau est chaud, plus il refroidit vite
 *   (×1 à froid → ×1.6 à chaleur max).
 * - Bridage : au-delà de THROTTLE_START, la cadence de tir baisse progressivement
 *   jusqu'à THROTTLE_MIN_RATE à 100 %. Le tir n'est coupé (surchauffe) qu'en atteignant 100 %,
 *   et reprend sous OVERHEAT_RECOVERY.
 */
export const HEAT = {
  COOLING_BOOST: 0.6,
  THROTTLE_START: 0.75,
  THROTTLE_MIN_RATE: 0.4,
  OVERHEAT_RECOVERY: 0.5,
};

export const heatRatio = (s: GameState) => (s.maxHeat > 0 ? Math.min(1, s.heat / s.maxHeat) : 0);

/** Multiplicateur de cadence dû à la chaleur (1 = pleine cadence). */
export const heatThrottle = (s: GameState) => {
  const r = heatRatio(s);
  if (r <= HEAT.THROTTLE_START) return 1;
  const t = (r - HEAT.THROTTLE_START) / (1 - HEAT.THROTTLE_START);
  return 1 - t * (1 - HEAT.THROTTLE_MIN_RATE);
};

/** Refroidissement effectif (chaleur / s) dans l'état actuel. */
export const effectiveCooling = (s: GameState) =>
  s.player.runtimeStats.cooling * (1 + HEAT.COOLING_BOOST * heatRatio(s));

/** Chaleur produite par un tir de cette arme (la Tech ne change pas la chaleur par seconde). */
export const weaponHeatPerShot = (s: GameState, w: Weapon) =>
  (w.heatPerShot * s.player.runtimeStats.heatGenMult) / Math.sqrt(TECH_MULTIPLIERS[w.level] ?? 1);

/** Ajoute la chaleur d'un tir ; déclenche la surchauffe à 100 %. */
export const addHeat = (s: GameState, amount: number) => {
  s.heat = Math.min(s.maxHeat, s.heat + amount);
  if (s.heat >= s.maxHeat) s.isOverheated = true;
};

/** Refroidissement d'un pas de simulation. */
export const updateHeat = (s: GameState, deltaTime: number) => {
  if (s.heat > 0) s.heat = Math.max(0, s.heat - effectiveCooling(s) * deltaTime);
  if (s.isOverheated && s.heat <= s.maxHeat * HEAT.OVERHEAT_RECOVERY) s.isOverheated = false;
};
