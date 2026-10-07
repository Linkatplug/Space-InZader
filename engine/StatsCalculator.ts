import { Entity, Stats, GameState, Modifier } from '../types';
import { CONDITIONS, SCALING_SOURCES } from './Conditions';
import { synergyStatus } from './Synergies';
import { getShip } from '../data/ships';
import { INITIAL_STATS } from '../constants';
import { EVENTS } from '../data/events';

/**
 * Calcule les statistiques d'une entité :
 * 1. stats de base (pour le joueur : INITIAL_STATS + classe de vaisseau)
 * 2. passifs avec RENDEMENT DÉGRESSIF (Σ 0.8^i)
 * 3. synergies actives, keystones (conditionnels / à l'échelle)
 * 4. modificateurs directs de l'entité
 */

const applyMod = (result: Stats, mod: Modifier, gameState: GameState | undefined, weight = 1) => {
  if (mod.condition && (!gameState || !CONDITIONS[mod.condition](gameState))) return;
  if (mod.scaling) {
    if (!gameState) return;
    const n = Math.min(mod.scaling.max, SCALING_SOURCES[mod.scaling.source](gameState));
    (result[mod.property] as number) += mod.value * n;
    return;
  }
  if (mod.type === 'additive') {
    (result[mod.property] as number) += mod.value * weight;
  } else {
    // Multiplicatif : +10% (1.10) avec un poids w → ×(1 + 0.10 × w)
    (result[mod.property] as number) *= 1 + (mod.value - 1) * weight;
  }
};

/** Stats entières (nombre de projectiles, rebonds...) : pas de rendement dégressif. */
export const INTEGER_STATS = new Set<keyof Stats>(['extraChain', 'extraDrones', 'extraProjectiles', 'extraPierce']);

export const diminishingWeight = (stacks: number) => {
  let w = 0;
  for (let i = 0; i < stacks; i++) w += Math.pow(0.8, i);
  return w;
};

/** Stats de base du joueur selon sa classe de vaisseau. */
export const shipBaseStats = (shipId: string): Stats => ({ ...INITIAL_STATS, ...getShip(shipId).stats });

export const calculateRuntimeStats = (entity: Entity, gameState?: GameState): Stats => {
  const result = { ...entity.baseStats };

  if (gameState && entity.id === 'player') {
    gameState.activePassives.forEach(({ passive, stacks }) => {
      const w = diminishingWeight(stacks);
      passive.modifiers.forEach(mod => applyMod(result, mod, gameState, INTEGER_STATS.has(mod.property) ? stacks : w));
    });

    synergyStatus(gameState).forEach(st =>
      st.activeTiers.forEach(t => t.modifiers?.forEach(mod => applyMod(result, mod, gameState))),
    );

    // Événements actifs (tempête magnétique, éruption solaire...)
    gameState.activeEvents.forEach(ev => {
      if (ev.started) EVENTS[ev.type].playerModifiers?.forEach(mod => applyMod(result, mod, gameState));
    });

    // Keystones : pas de rendement dégressif (uniques)
    gameState.keystones.forEach(ks => ks.modifiers.forEach(mod => applyMod(result, mod, gameState)));
  }

  entity.modifiers.filter(m => m.type === 'additive').forEach(m => applyMod(result, m, gameState));
  entity.modifiers.filter(m => m.type === 'multiplicative').forEach(m => applyMod(result, m, gameState));

  // Garde-fous
  result.critChance = Math.max(0, Math.min(1, result.critChance));
  result.dodgeChance = Math.max(0, Math.min(0.75, result.dodgeChance));
  result.armorHardness = Math.max(0, Math.min(0.9, result.armorHardness));
  return result;
};

export const syncDefenseState = (entity: Entity) => {
  entity.defense.shield = Math.min(entity.defense.shield, entity.runtimeStats.maxShield);
  entity.defense.armor = Math.min(entity.defense.armor, entity.runtimeStats.maxArmor);
  entity.defense.hull = Math.min(entity.defense.hull, entity.runtimeStats.maxHull);
};

/** Recalcule les stats du joueur (appelé chaque frame : les conditions changent en continu). */
export const refreshPlayerStats = (state: GameState) => {
  const { player } = state;
  player.runtimeStats = calculateRuntimeStats(player, state);
  syncDefenseState(player);
  state.maxHeat = player.runtimeStats.maxHeat;
  player.statsDirty = false;
};
