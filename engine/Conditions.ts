import { GameState, ConditionId, ScalingSource } from '../types';

/**
 * Conditions et sources de mise à l'échelle des modificateurs dynamiques
 * (keystones, synergies). Pour en ajouter : une entrée ici + le type dans types.ts.
 */

export const STATIONARY_DELAY = 0.7; // secondes

export const CONDITIONS: Record<ConditionId, (s: GameState) => boolean> = {
  highHeat: s => s.heat >= s.maxHeat * 0.8,
  overheated: s => s.isOverheated,
  lowHull: s => s.player.defense.hull <= s.player.runtimeStats.maxHull * 0.3,
  shieldDown: s => s.player.defense.shield <= 0,
  stationary: s => s.stationaryTime >= STATIONARY_DELAY,
};

export const SCALING_SOURCES: Record<ScalingSource, (s: GameState) => number> = {
  hitStreak: s => s.hitStreak,
  droneCount: s => s.drones.length,
  comboCount: s => s.comboCount,
  onHitStacks: s => s.onHitStacks,
};
