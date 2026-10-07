import { GameState, Synergy, SynergyTier, Tag, MechanicId } from '../types';
import { SYNERGIES } from '../data/synergies';

/** Nombre de tags possédés (chaque arme / passif compte une fois par tag). */
export const countTags = (state: GameState): Map<Tag, number> => {
  const counts = new Map<Tag, number>();
  const add = (tags: Tag[]) => new Set(tags).forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1));
  state.activeWeapons.forEach(w => add(w.tags));
  state.activePassives.forEach(p => add(p.passive.tags));
  return counts;
};

export interface SynergyStatus {
  synergy: Synergy;
  count: number;
  activeTiers: SynergyTier[];
  nextTier?: SynergyTier;
}

/** État de chaque synergie : nombre d'objets concernés et paliers atteints. */
export const synergyStatus = (state: GameState): SynergyStatus[] => {
  const items = [...state.activeWeapons.map(w => w.tags), ...state.activePassives.map(p => p.passive.tags)];
  return SYNERGIES.map(synergy => {
    // Un objet compte une fois par synergie même s'il porte plusieurs de ses tags
    const count = items.filter(t => t.some(tag => synergy.tags.includes(tag))).length;
    const activeTiers = synergy.tiers.filter(t => count >= t.count);
    const nextTier = synergy.tiers.find(t => count < t.count);
    return { synergy, count, activeTiers, nextTier };
  });
};

export const activeMechanics = (state: GameState): MechanicId[] =>
  synergyStatus(state).flatMap(s => s.activeTiers.map(t => t.mechanic).filter((m): m is MechanicId => !!m));

export const hasMechanic = (state: GameState, m: MechanicId) => state.mechanics.includes(m);
