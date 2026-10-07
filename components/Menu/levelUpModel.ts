/**
 * Menu de level-up : données du panneau de stats, des indicateurs du build et du coût thermique.
 * Fonctions pures (testées dans tests/levelup.test.ts). Les calculs viennent du moteur
 * (engine/Preview.ts, engine/Heat.ts) ; ici on choisit seulement QUOI afficher et COMMENT.
 */
import { Stats } from '../../types';
import { STAT_INFO, StatGroup, formatStat, formatStatDelta } from '../../data/statInfo';
import { HEAT } from '../../engine/Heat';
import type { LoadoutSummary, StatChange, UpgradePreview } from '../../engine/Preview';

/** Groupes affichés en premier plan ; les autres sont repliés. */
export const PRIMARY_GROUPS: StatGroup[] = ['Défense', 'Attaque', 'Chaleur'];
export const SECONDARY_GROUPS: StatGroup[] = ['Mobilité', 'Utilitaire'];

/** Stats toujours affichées (même à leur valeur neutre). */
export const CORE_STATS: (keyof Stats)[] = [
  'maxShield', 'maxArmor', 'maxHull',
  'damageMult', 'fireRate', 'critChance', 'critMult',
  'maxHeat', 'cooling', 'heatGenMult',
  'speed',
];

export interface StatRow {
  key: keyof Stats;
  label: string;
  value: string;      // valeur actuelle
  next?: string;      // nouvelle valeur (si la prévisualisation la change)
  delta?: string;     // « +20 », « −5 % »
  good?: boolean;
}

export interface StatGroupView { group: StatGroup; rows: StatRow[]; changed: number; }

/** Valeur « sans effet » d'une stat : 1 pour un multiplicateur, 0 sinon. */
const neutral = (key: keyof Stats) => (STAT_INFO[key]?.format === 'mult' ? 1 : 0);

/**
 * Lignes du panneau, groupées. On affiche les stats principales, celles qui s'écartent de leur valeur
 * neutre (ex. une résistance acquise) et celles que la prévisualisation modifie.
 */
export const statGroups = (stats: Stats, changes: StatChange[] = []): StatGroupView[] => {
  const byKey = new Map(changes.map(c => [c.key, c]));
  const groups = [...PRIMARY_GROUPS, ...SECONDARY_GROUPS];
  return groups.map(group => {
    const rows: StatRow[] = (Object.keys(STAT_INFO) as (keyof Stats)[])
      .filter(k => STAT_INFO[k]!.group === group)
      .filter(k => CORE_STATS.includes(k) || Math.abs(stats[k] - neutral(k)) > 1e-6 || byKey.has(k))
      .map(k => {
        const c = byKey.get(k);
        return {
          key: k,
          label: STAT_INFO[k]!.label,
          value: formatStat(k, stats[k]),
          ...(c && { next: formatStat(k, c.after), delta: formatStatDelta(k, c.before, c.after), good: c.good }),
        };
      });
    return { group, rows, changed: rows.filter(r => r.delta).length };
  }).filter(g => g.rows.length > 0);
};

// --- Formats -------------------------------------------------------------------------

/** Nombre à 1 décimale max, virgule française (14.5 → « 14,5 », 40 → « 40 »). */
export const fmt1 = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',');
const pct = (v: number) => `${Math.round(v * 100)} %`;
const sign = (d: number) => (d > 0 ? '+' : '−');

// --- Indicateurs du build ----------------------------------------------------------

export interface Indicator {
  id: 'dps' | 'sustain' | 'defense';
  label: string;
  hint: string;
  value: string;
  next?: string;
  delta?: string;
  good?: boolean;
  /** Ton de la valeur actuelle : 'warn' = la chaleur bride déjà la cadence. */
  tone: 'neutral' | 'ok' | 'warn';
}

/** Un état du build : stats du joueur + résumé des armes (engine/Preview). */
export interface BuildSnapshot { stats: Stats; loadout: LoadoutSummary; }

export const totalDefense = (s: Stats) => Math.round(s.maxShield + s.maxArmor + s.maxHull);

/** Chaleur nette en tir continu à froid : produite − refroidissement de base (positif = elle monte). */
export const netHeat = (l: LoadoutSummary) => l.heatPerSec - l.coolingPerSec;

const withDelta = (ind: Indicator, before: number, after: number | undefined, text: (v: number) => string, unit = '') => {
  if (after === undefined || Math.round(after) === Math.round(before)) return ind;
  const d = Math.round(after) - Math.round(before);
  return { ...ind, next: text(after), delta: `${sign(d)}${Math.abs(d)}${unit}`, good: d > 0 };
};

/** Les 3 gros indicateurs du build (DPS, cadence soutenable, défense totale), avec écart si aperçu. */
export const buildIndicators = (base: BuildSnapshot, next?: BuildSnapshot): Indicator[] => {
  const dps = withDelta(
    { id: 'dps', label: 'DPS soutenu', hint: 'toutes armes, une cible, chaleur comprise', value: String(base.loadout.sustainedDps), tone: 'neutral' },
    base.loadout.sustainedDps, next?.loadout.sustainedDps, v => String(Math.round(v)),
  );
  // LE chiffre pour choisir : la cadence que la chaleur laisse tenir sur la durée
  const rate = (l: LoadoutSummary) => l.throttledRate * 100;
  const sustain = withDelta(
    { id: 'sustain', label: 'Cadence soutenable', hint: 'limite thermique en tir continu', value: pct(base.loadout.throttledRate),
      tone: base.loadout.throttledRate < 0.995 ? 'warn' : 'ok' },
    rate(base.loadout), next && rate(next.loadout), v => `${Math.round(v)} %`, ' %',
  );
  const defense = withDelta(
    { id: 'defense', label: 'Défense totale', hint: 'bouclier + armure + coque', value: String(totalDefense(base.stats)), tone: 'neutral' },
    totalDefense(base.stats), next && totalDefense(next.stats), v => String(Math.round(v)),
  );
  return [dps, sustain, defense];
};

// --- Bloc thermique ------------------------------------------------------------------

export interface ThermalView {
  produced: number;      // chaleur produite / s (tir continu)
  cooled: number;        // refroidissement de base / s
  cooledMax: number;     // refroidissement à chaleur max / s
  scale: number;         // échelle commune des jauges
  producedBefore?: number;
  cooledBefore?: number;
  rate: string;          // cadence soutenable actuelle
  rateNext?: string;
  good?: boolean;
  net: number;           // produite − refroidissement de base
}

/** Données du bloc chaleur : production vs refroidissement, et cadence soutenable avant → après. */
export const thermalView = (before: LoadoutSummary, after?: LoadoutSummary): ThermalView => {
  const l = after ?? before;
  const coolMax = (x: LoadoutSummary) => x.coolingPerSec * (1 + HEAT.COOLING_BOOST);
  const scale = Math.max(1, l.heatPerSec, coolMax(l), before.heatPerSec, coolMax(before)) * 1.1;
  const view: ThermalView = {
    produced: l.heatPerSec,
    cooled: l.coolingPerSec,
    cooledMax: coolMax(l),
    scale,
    rate: pct(before.throttledRate),
    net: netHeat(l),
  };
  if (after) {
    if (Math.abs(after.heatPerSec - before.heatPerSec) > 0.05) view.producedBefore = before.heatPerSec;
    if (Math.abs(after.coolingPerSec - before.coolingPerSec) > 0.05) view.cooledBefore = before.coolingPerSec;
    if (Math.round(after.throttledRate * 100) !== Math.round(before.throttledRate * 100)) {
      view.rateNext = pct(after.throttledRate);
      view.good = after.throttledRate > before.throttledRate;
    }
  }
  return view;
};

// --- Coût thermique d'une carte -------------------------------------------------------

export interface CardHeat {
  /** Arme : chaleur/s de l'arme après le choix, et avant (si déjà possédée). */
  weapon?: { after: number; before?: number; unchanged: boolean };
  /** Cadence soutenable avant → après, si le choix la modifie. */
  sustain?: { before: string; after: string; good: boolean };
}

export const cardHeat = (preview: UpgradePreview, weaponId?: string): CardHeat => {
  const out: CardHeat = {};
  if (weaponId) {
    const a = preview.loadoutAfter.weapons.find(w => w.id === weaponId);
    const b = preview.loadoutBefore.weapons.find(w => w.id === weaponId);
    if (a) out.weapon = { after: a.heatPerSec, before: b?.heatPerSec, unchanged: !!b && Math.abs(a.heatPerSec - b.heatPerSec) < 0.05 };
  }
  const r0 = Math.round(preview.loadoutBefore.throttledRate * 100);
  const r1 = Math.round(preview.loadoutAfter.throttledRate * 100);
  if (r0 !== r1) out.sustain = { before: `${r0} %`, after: `${r1} %`, good: r1 > r0 };
  return out;
};
