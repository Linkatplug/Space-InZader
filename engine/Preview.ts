import { GameState, Stats, Weapon } from '../types';
import { applyUpgrade, UpgradeOption } from './Progression';
import { calculateRuntimeStats } from './StatsCalculator';
import { weaponCooldown, weaponBehavior } from './WeaponSystem';
import { STAT_INFO } from '../data/statInfo';
import { TECH_MULTIPLIERS } from '../constants';
import { HEAT } from './Heat';

/**
 * Prévisualisation d'une amélioration et résumé du build.
 * Fonctions pures : l'état réel n'est jamais modifié (on travaille sur une copie).
 */

/** Résumé chiffré d'une arme équipée (avec les stats du joueur). */
export interface WeaponSummary {
  id: string;
  name: string;
  level: number;
  dps: number;          // dégâts par seconde estimés sur une cible (crit moyen compris)
  heatPerSec: number;   // chaleur générée par seconde en tir continu
}

/** Résumé du build : puissance et équilibre thermique. */
export interface LoadoutSummary {
  weapons: WeaponSummary[];
  dps: number;
  heatPerSec: number;
  coolingPerSec: number;
  /** Secondes de tir continu avant surchauffe (Infinity si la chaleur est soutenable). */
  secondsToOverheat: number;
  /** Cadence soutenable à long terme (1 = pleine cadence, < 1 = bridée par la chaleur). */
  throttledRate: number;
  /** DPS en tir continu prolongé, bridage thermique compris (drones non bridés). */
  sustainedDps: number;
}

/** Cadence d'équilibre : on cherche le niveau de chaleur où production bridée = refroidissement. */
const sustainedRate = (heatPerSec: number, cooling: number) => {
  if (heatPerSec <= 0) return 1;
  for (let r = 0; r <= 1.0001; r += 0.01) {
    const throttle = r <= HEAT.THROTTLE_START ? 1 : 1 - ((r - HEAT.THROTTLE_START) / (1 - HEAT.THROTTLE_START)) * (1 - HEAT.THROTTLE_MIN_RATE);
    if (heatPerSec * throttle <= cooling * (1 + HEAT.COOLING_BOOST * r)) return Math.round(throttle * 100) / 100;
  }
  return HEAT.THROTTLE_MIN_RATE;
};

const critFactor = (s: Stats) => 1 + s.critChance * (s.critMult - 1);

export const weaponSummary = (state: GameState, w: Weapon, stats: Stats = state.player.runtimeStats): WeaponSummary => {
  const fakeState = { ...state, player: { ...state.player, runtimeStats: stats } };
  const shotsPerSec = 1000 / weaponCooldown(fakeState, w);
  const b = weaponBehavior(w);
  // Projectiles multiples : on compte la moitié comme touchant une même cible (dispersion)
  const count = (b.count ?? 1) + stats.extraProjectiles;
  const perTarget = b.kind === 'drone' ? count : 1 + (count - 1) * 0.5;
  const dmg = w.damage * (TECH_MULTIPLIERS[w.level] ?? 1) * stats.damageMult * critFactor(stats);
  const isDrone = b.kind === 'drone';
  return {
    id: w.id,
    name: w.name,
    level: w.level,
    dps: Math.round(dmg * shotsPerSec * perTarget),
    heatPerSec: isDrone ? 0 : Math.round((w.heatPerShot * stats.heatGenMult / Math.sqrt(TECH_MULTIPLIERS[w.level] ?? 1)) * shotsPerSec * 10) / 10,
  };
};

export const loadoutSummary = (state: GameState, stats: Stats = state.player.runtimeStats, weapons = state.activeWeapons): LoadoutSummary => {
  const list = weapons.map(w => weaponSummary(state, w, stats));
  const heat = list.reduce((a, w) => a + w.heatPerSec, 0);
  // Refroidissement dynamique : jusqu'à ×(1 + COOLING_BOOST) à chaleur max
  const net = heat - stats.cooling * (1 + HEAT.COOLING_BOOST);
  return {
    weapons: list,
    dps: list.reduce((a, w) => a + w.dps, 0),
    heatPerSec: Math.round(heat * 10) / 10,
    coolingPerSec: Math.round(stats.cooling * 10) / 10,
    secondsToOverheat: net <= 0 ? Infinity : Math.round((stats.maxHeat / net) * 10) / 10,
    throttledRate: sustainedRate(heat, stats.cooling),
    sustainedDps: Math.round(list.reduce((a, w) => a + (w.heatPerSec > 0 ? w.dps * sustainedRate(heat, stats.cooling) : w.dps), 0)),
  };
};

export interface StatChange {
  key: keyof Stats;
  before: number;
  after: number;
  /** true si le changement est favorable au joueur. */
  good: boolean;
}

export interface UpgradePreview {
  before: Stats;
  after: Stats;
  /** Uniquement les stats affichables (STAT_INFO) qui changent. */
  changes: StatChange[];
  loadoutBefore: LoadoutSummary;
  loadoutAfter: LoadoutSummary;
}

/** Copie suffisante de l'état pour simuler une amélioration sans effet de bord. */
const cloneForPreview = (state: GameState): GameState => ({
  ...state,
  player: { ...state.player, defense: { ...state.player.defense }, baseStats: { ...state.player.baseStats }, modifiers: [...state.player.modifiers] },
  activeWeapons: state.activeWeapons.map(w => ({ ...w })),
  activePassives: state.activePassives.map(p => ({ ...p })),
  keystones: [...state.keystones],
  buffs: [], // la prévisualisation ignore les bonus temporaires
});

/**
 * Stats du joueur avant / après l'amélioration proposée.
 * Les keystones conditionnelles sont évaluées dans la situation actuelle (chaleur, coque…).
 */
export const previewUpgrade = (state: GameState, opt: UpgradeOption): UpgradePreview => {
  const base = cloneForPreview(state);
  const before = calculateRuntimeStats(base.player, base);
  const next = cloneForPreview(state);
  applyUpgrade(next, opt, false);
  const after = calculateRuntimeStats(next.player, next);

  const changes: StatChange[] = (Object.keys(STAT_INFO) as (keyof Stats)[])
    .filter(k => Math.abs(after[k] - before[k]) > 1e-6)
    .map(k => {
      const up = after[k] > before[k];
      return { key: k, before: before[k], after: after[k], good: STAT_INFO[k]!.better === 'up' ? up : !up };
    });

  return {
    before,
    after,
    changes,
    loadoutBefore: loadoutSummary(base, before),
    loadoutAfter: loadoutSummary(next, after, next.activeWeapons),
  };
};
