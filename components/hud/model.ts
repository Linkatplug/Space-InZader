/**
 * Modèle du HUD : fonctions pures qui transforment le GameState en données d'affichage.
 * Aucune dépendance au DOM ni à React → testable sous Node (tests/hud.test.ts).
 */
import { ConditionId, DamageType, GameState, Keystone, Passive, ScalingSource, Tag, Weapon } from '../../types';
import type { UpgradeOption } from '../../engine/Progression';
import { synergyStatus } from '../../engine/Synergies';
import { CONDITIONS, SCALING_SOURCES } from '../../engine/Conditions';
import { OVERHEAT_RECOVERY } from '../../engine/CoreEngine';
import { weaponCooldown } from '../../engine/WeaponSystem';
import { MAX_WEAPON_SLOTS, TECH_MULTIPLIERS } from '../../constants';
import { ENEMIES, BOSS_WAVE_INTERVAL } from '../../data/enemies';

// --- Mise à l'échelle -------------------------------------------------------

/** Résolution de référence du HUD bureau : tout est dessiné pour 1280×720 puis agrandi. */
export const HUD_BASE = { width: 1280, height: 720 };
/** En dessous de cette échelle, le HUD bureau deviendrait illisible → disposition compacte. */
export const COMPACT_THRESHOLD = 0.9;
/** Côté de référence de la disposition compacte (téléphone, petite fenêtre). */
export const COMPACT_BASE = 400;

export interface HudLayout {
  scale: number;    // facteur CSS appliqué au HUD
  compact: boolean; // disposition mobile / petite fenêtre
  width: number;    // taille du « viewport virtuel » du HUD (px avant mise à l'échelle)
  height: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Échelle et disposition du HUD pour une fenêtre donnée.
 * Bureau : 1280×720 → ×1, 1920×1080 → ×1.5, 2560×1440 → ×2.
 * Compact : le plus petit côté vaut ~400 px virtuels (375×812 → ×0.94).
 */
export const hudLayout = (w: number, h: number): HudLayout => {
  const s = Math.min(w / HUD_BASE.width, h / HUD_BASE.height);
  const compact = s < COMPACT_THRESHOLD;
  const scale = compact ? clamp(Math.min(w, h) / COMPACT_BASE, 0.75, 1.15) : Math.min(s, 2.5);
  return { scale, compact, width: w / scale, height: h / scale };
};

// --- Formats ----------------------------------------------------------------

export const formatClock = (ms: number) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
};

export const ratio = (value: number, max: number) => (max > 0 ? clamp(value / max, 0, 1) : 0);

// --- Chaleur ----------------------------------------------------------------

export type HeatLevel = 'ok' | 'warm' | 'critical' | 'overheated';

export interface HeatInfo {
  ratio: number;
  percent: number;
  level: HeatLevel;
  recovery: number; // seuil de reprise après surchauffe (0..1)
}

export const heatInfo = (s: GameState): HeatInfo => {
  const r = ratio(s.heat, s.maxHeat);
  const level: HeatLevel = s.isOverheated ? 'overheated' : r >= 0.85 ? 'critical' : r >= 0.6 ? 'warm' : 'ok';
  return { ratio: r, percent: Math.round(r * 100), level, recovery: OVERHEAT_RECOVERY };
};

// --- Armes ------------------------------------------------------------------

export interface WeaponSlot {
  weapon: Weapon;
  readiness: number;  // 0..1, 1 = prêt à tirer
  cooldownMs: number;
}

/** Emplacements d'armes (MAX_WEAPON_SLOTS), `null` pour un emplacement libre. */
export const weaponSlots = (s: GameState): (WeaponSlot | null)[] =>
  Array.from({ length: MAX_WEAPON_SLOTS }, (_, i) => {
    const weapon = s.activeWeapons[i];
    if (!weapon) return null;
    const cooldownMs = weaponCooldown(s, weapon);
    return { weapon, cooldownMs, readiness: ratio(s.time - weapon.lastFired, cooldownMs) };
  });

// --- Synergies --------------------------------------------------------------

export interface SynergyRow {
  id: string;
  name: string;
  color: string;
  count: number;
  maxCount: number;              // palier le plus haut
  tiers: { count: number; description: string; active: boolean }[];
  current?: string;              // effet du palier actif le plus haut
  next?: { count: number; description: string };
}

/** Synergies entamées (au moins un objet), actives d'abord. */
export const synergyRows = (s: GameState): SynergyRow[] =>
  synergyStatus(s)
    .filter(st => st.count > 0)
    .map(({ synergy, count, activeTiers, nextTier }) => ({
      id: synergy.id,
      name: synergy.name,
      color: synergy.color,
      count,
      maxCount: synergy.tiers[synergy.tiers.length - 1].count,
      tiers: synergy.tiers.map(t => ({ count: t.count, description: t.description, active: count >= t.count })),
      current: activeTiers[activeTiers.length - 1]?.description,
      next: nextTier && { count: nextTier.count, description: nextTier.description },
    }))
    .sort((a, b) => Number(!!b.current) - Number(!!a.current) || b.count - a.count);

// --- Keystones --------------------------------------------------------------

export const CONDITION_LABELS: Record<ConditionId, string> = {
  highHeat: 'chaleur ≥ 80%',
  overheated: 'en surchauffe',
  lowHull: 'coque ≤ 30%',
  shieldDown: 'bouclier à zéro',
  stationary: 'immobile',
};

export const SCALING_LABELS: Record<ScalingSource, string> = {
  hitStreak: 'série d\'impacts',
  droneCount: 'drones',
  comboCount: 'série',
  onHitStacks: 'cumul',
};

export type KeystoneInfo =
  | { kind: 'permanent'; active: true }
  | { kind: 'conditional'; active: boolean; label: string }
  | { kind: 'scaling'; active: boolean; value: number; max: number; label: string };

/** État dynamique d'une keystone : permanente, conditionnelle (active ?) ou à l'échelle (x / max). */
export const keystoneInfo = (s: GameState, k: Keystone): KeystoneInfo => {
  const scaled = k.modifiers.find(m => m.scaling);
  if (scaled?.scaling) {
    const { source, max } = scaled.scaling;
    const value = Math.min(SCALING_SOURCES[source](s), max);
    return { kind: 'scaling', active: value > 0, value, max, label: SCALING_LABELS[source] };
  }
  const conds = [...new Set(k.modifiers.map(m => m.condition).filter((c): c is ConditionId => !!c))];
  if (conds.length) {
    return { kind: 'conditional', active: conds.every(c => CONDITIONS[c](s)), label: conds.map(c => CONDITION_LABELS[c]).join(' + ') };
  }
  return { kind: 'permanent', active: true };
};

// --- Vague / boss -----------------------------------------------------------

/** Les boss apparaissent quand la vague atteint un multiple de BOSS_WAVE_INTERVAL (data/enemies.ts). */
export { BOSS_WAVE_INTERVAL };
export const bossIncoming = (s: GameState) => (s.wave + 1) % BOSS_WAVE_INTERVAL === 0;

export interface BossInfo { name: string; color: string; ratio: number; }

export const bossInfo = (s: GameState): BossInfo | null => {
  const boss = s.enemies.find(e => e.type === 'boss' && !e.dead);
  if (!boss) return null;
  const def = boss.subtype ? ENEMIES[boss.subtype] : undefined;
  const { maxShield, maxArmor, maxHull } = boss.runtimeStats;
  const { shield, armor, hull } = boss.defense;
  return {
    name: def?.name ?? 'Boss',
    color: def?.color ?? '#facc15',
    ratio: ratio(shield + armor + hull, maxShield + maxArmor + maxHull),
  };
};

// --- Libellés ---------------------------------------------------------------

export const TAG_LABELS: Record<Tag, string> = {
  [Tag.ENERGY]: 'Énergie',
  [Tag.DRONE]: 'Drone',
  [Tag.EXPLOSIVE]: 'Explosif',
  [Tag.BEAM]: 'Rayon',
  [Tag.KINETIC]: 'Cinétique',
  [Tag.MINING]: 'Minage',
  [Tag.SWARM]: 'Essaim',
  [Tag.DEFENSIVE]: 'Défensif',
  [Tag.AREA]: 'Zone',
  [Tag.DOT]: 'Brûlure',
  [Tag.CHAIN]: 'Chaîne',
  [Tag.HOMING]: 'Guidé',
  [Tag.ORBITAL]: 'Orbital',
  [Tag.BALLISTIC]: 'Balistique',
};

export const DAMAGE_LABELS: Record<DamageType, string> = {
  [DamageType.EM]: 'EM',
  [DamageType.KINETIC]: 'Cinétique',
  [DamageType.EXPLOSIVE]: 'Explosif',
  [DamageType.THERMAL]: 'Thermique',
};

export const RARITY_LABELS: Record<Passive['rarity'], string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

// --- Choix d'amélioration -----------------------------------------------------

export interface SynergyGain {
  id: string;
  name: string;
  color: string;
  from: number;
  to: number;
  unlocks?: string;                               // palier débloqué par ce choix
  next?: { count: number; description: string };  // palier suivant après ce choix
}

/** Progression de synergie qu'apporterait un choix (un objet déjà possédé ne compte pas deux fois). */
export const synergyGains = (s: GameState, opt: UpgradeOption): SynergyGain[] => {
  if (opt.type === 'keystone') return [];
  const isNew = opt.type === 'weapon'
    ? !s.activeWeapons.some(w => w.id === opt.item.id)
    : !s.activePassives.some(p => p.passive.id === opt.item.id);
  const tags = opt.item.tags;
  return synergyStatus(s)
    .filter(st => st.synergy.tags.some(t => tags.includes(t)))
    .map(({ synergy, count }) => {
      const to = count + (isNew ? 1 : 0);
      return {
        id: synergy.id,
        name: synergy.name,
        color: synergy.color,
        from: count,
        to,
        unlocks: isNew ? synergy.tiers.find(t => t.count === to)?.description : undefined,
        next: synergy.tiers.find(t => t.count > to),
      };
    });
};

/** Description courte d'un choix : nouvelle arme, Tech n → n+1, module (cumul), keystone. */
export const upgradeKind = (s: GameState, opt: UpgradeOption): string => {
  if (opt.type === 'keystone') return 'Keystone — unique';
  if (opt.type === 'weapon') {
    const owned = s.activeWeapons.find(w => w.id === opt.item.id);
    return owned ? `Amélioration Tech ${owned.level} → ${owned.level + 1}` : 'Nouvelle arme';
  }
  const owned = s.activePassives.find(p => p.passive.id === opt.item.id);
  const stacks = owned?.stacks ?? 0;
  return `Module ${RARITY_LABELS[opt.item.rarity].toLowerCase()} · ${stacks} → ${stacks + 1} / ${opt.item.maxStacks}`;
};

/** Caractéristiques affichées d'une arme au niveau Tech donné. */
export const weaponStats = (w: Weapon, level = w.level) => {
  const mult = TECH_MULTIPLIERS[level] || 1;
  return {
    damage: Math.round(w.damage * mult),
    fireRate: Math.round(w.fireRate * Math.sqrt(mult) * 10) / 10,
    heat: w.heatPerShot,
    range: w.range,
  };
};

/** Bonus apporté par le passage au niveau Tech `level` (2 ou 3), depuis `Weapon.techNotes`. */
export const techNote = (w: Weapon, level: number): string | undefined => w.techNotes?.[level - 2];
