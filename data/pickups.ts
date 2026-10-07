/**
 * Butin lâché par les ennemis. Pour ajouter un type : une entrée ici + l'effet dans
 * engine/Pickups.ts → PICKUP_EFFECTS, et la valeur dans PickupKind (types.ts).
 *
 * Chance de lâcher un butin à la mort d'un ennemi :
 *   chance = DROP_CHANCE[catégorie] × stat `pickupChance` × (vague 1 : ×EARLY_WAVE_FACTOR)
 * puis le type est tiré selon `weight`. Le trou de ver a sa propre chance (plus rare).
 */
import { PickupKind } from '../types';

export interface PickupDef {
  kind: PickupKind;
  name: string;
  description: string;
  color: string;
  icon: string;
  weight: number;       // poids de tirage parmi les soins
  amount?: number;      // fraction de la valeur max rendue (soins)
}

export const PICKUPS: Record<PickupKind, PickupDef> = {
  shield: {
    kind: 'shield', name: "Capsule d'énergie", description: 'Recharge 40 % du bouclier.',
    color: '#22d3ee', icon: '◆', weight: 40, amount: 0.4,
  },
  hull: {
    kind: 'hull', name: 'Pack de nanites', description: 'Répare 25 % de la coque.',
    color: '#4ade80', icon: '✚', weight: 30, amount: 0.25,
  },
  armor: {
    kind: 'armor', name: 'Plaques de blindage', description: 'Restaure 35 % du blindage.',
    color: '#f97316', icon: '▣', weight: 30, amount: 0.35,
  },
  wormhole: {
    kind: 'wormhole', name: 'Mini trou de ver', description: "Aspire toute l'XP de la carte vers le vaisseau.",
    color: '#a855f7', icon: '◎', weight: 0,
  },
};

/** Chance de butin de soin à la mort, par catégorie d'ennemi. */
export const DROP_CHANCE = { normal: 0.025, heavy: 0.12, boss: 1 };
/** Ennemis « lourds » (meilleure chance de butin). */
export const HEAVY_ENEMIES = new Set(['tank', 'elite', 'turret']);
/** Chance qu'un ennemi lâche un mini trou de ver. */
export const WORMHOLE_CHANCE = 0.006;
/** En vague 1, le butin est plus rare (on démarre sans soin). */
export const EARLY_WAVE_FACTOR = 0.3;
/** Durée de vie d'un butin au sol (secondes). */
export const PICKUP_LIFETIME = 20;
