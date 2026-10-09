import { GameState, Weapon, Passive, Keystone } from '../types';
import { MAX_WEAPON_SLOTS, xpForLevel } from '../constants';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { KEYSTONES } from '../data/keystones';
import { refreshPlayerStats } from './StatsCalculator';
import { getShip } from '../data/ships';

/** Poids de tirage : les améliorations portant un tag préféré du vaisseau sortent ×2.5 plus souvent. */
export const PREFERRED_TAG_WEIGHT = 2.5;

/** Poids de base par rareté. La chance (stat `luck`, en points) rapproche les raretés de 1. */
export const RARITY_WEIGHT = { common: 1, rare: 0.6, epic: 0.3, legendary: 0.12 } as const;
export const rarityWeight = (rarity: keyof typeof RARITY_WEIGHT, luck: number) => {
  const base = RARITY_WEIGHT[rarity];
  const t = Math.min(1, Math.max(0, luck) / 100); // 100 de chance = toutes les raretés à égalité
  return base + (1 - base) * t;
};

/**
 * Montée de niveau : génération des choix proposés et application du choix.
 * Aucune dépendance UI → testable.
 */

export const MAX_WEAPON_LEVEL = 3;
export const KEYSTONE_LEVEL_INTERVAL = 5;

export type UpgradeOption =
  | { type: 'weapon'; item: Weapon }
  | { type: 'passive'; item: Passive }
  | { type: 'keystone'; item: Keystone };

const shuffle = <T,>(arr: T[], rand: () => number) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Tirage pondéré sans remise. */
const weightedPick = <T,>(items: T[], weight: (t: T) => number, n: number, rand: () => number): T[] => {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const total = pool.reduce((a, t) => a + weight(t), 0);
    let r = rand() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= weight(pool[i]);
      if (r < 0) { idx = i; break; }
    }
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
};

/** Pool d'améliorations encore possibles pour cet état. */
export const availableUpgrades = (state: GameState): UpgradeOption[] => {
  const slotsFull = state.activeWeapons.length >= MAX_WEAPON_SLOTS;
  const weapons = WEAPONS.filter(w => {
    const owned = state.activeWeapons.find(aw => aw.id === w.id);
    if (owned) return owned.level < MAX_WEAPON_LEVEL;
    return !slotsFull;
  });
  const passives = PASSIVES.filter(p => {
    const owned = state.activePassives.find(ap => ap.passive.id === p.id);
    return !owned || owned.stacks < p.maxStacks;
  });
  return [
    ...weapons.map(item => ({ type: 'weapon' as const, item })),
    ...passives.map(item => ({ type: 'passive' as const, item })),
  ];
};

/**
 * Tire `count` choix. Tous les KEYSTONE_LEVEL_INTERVAL niveaux, les choix sont des keystones
 * (s'il en reste). On garantit au moins une amélioration d'arme possédée quand c'est possible,
 * pour que les armes montent en Tech.
 */
export const rollUpgradeOptions = (state: GameState, count = 3, rand: () => number = Math.random): UpgradeOption[] => {
  const nextLevel = state.level + 1;
  const ship = getShip(state.shipId);
  if (nextLevel % KEYSTONE_LEVEL_INTERVAL === 0) {
    const ks = KEYSTONES.filter(k => !state.keystones.some(o => o.id === k.id));
    if (ks.length > 0) {
      // Keystone signature du vaisseau garantie au premier palier
      const signature = state.keystones.length === 0 ? ks.find(k => k.id === ship.signatureKeystone) : undefined;
      const rest = shuffle(ks.filter(k => k !== signature), rand);
      return [...(signature ? [signature] : []), ...rest].slice(0, count).map(item => ({ type: 'keystone' as const, item }));
    }
  }

  const preferred = new Set(ship.preferredTags);
  const luck = state.player.runtimeStats.luck;
  const weight = (o: UpgradeOption) => {
    if (o.type === 'keystone') return 1;
    const tagW = o.item.tags.some(t => preferred.has(t)) ? PREFERRED_TAG_WEIGHT : 1;
    const rarW = o.type === 'passive' ? rarityWeight(o.item.rarity, luck) : 1;
    return tagW * rarW;
  };

  const pool = availableUpgrades(state);
  const picks: UpgradeOption[] = [];
  // On garantit souvent une montée en Tech d'une arme possédée
  const owned = pool.filter(o => o.type === 'weapon' && state.activeWeapons.some(w => w.id === o.item.id));
  if (owned.length > 0 && rand() < 0.6) picks.push(...weightedPick(owned, weight, 1, rand));
  picks.push(...weightedPick(pool.filter(o => !picks.includes(o)), weight, count - picks.length, rand));
  return picks;
};

/** Applique un choix et passe au niveau suivant. */
export const applyUpgrade = (state: GameState, opt: UpgradeOption, consumeLevel = true) => {
  const { player } = state;
  if (opt.type === 'weapon') {
    const owned = state.activeWeapons.find(w => w.id === opt.item.id);
    if (owned) owned.level = Math.min(MAX_WEAPON_LEVEL, owned.level + 1);
    else if (state.activeWeapons.length < MAX_WEAPON_SLOTS) state.activeWeapons.push({ ...opt.item, level: 1, lastFired: 0 });
  } else if (opt.type === 'passive') {
    const owned = state.activePassives.find(p => p.passive.id === opt.item.id);
    if (owned) owned.stacks = Math.min(opt.item.maxStacks, owned.stacks + 1);
    else state.activePassives.push({ passive: opt.item, stacks: 1 });
  } else if (opt.type === 'keystone') {
    if (!state.keystones.some(k => k.id === opt.item.id)) state.keystones.push(opt.item);
  }

  refreshPlayerStats(state);

  if (consumeLevel) {
    state.experience = Math.max(0, state.experience - state.expToNextLevel);
    state.level++;
    state.expToNextLevel = xpForLevel(state.level);
  }
};
