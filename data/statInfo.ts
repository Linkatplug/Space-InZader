/**
 * Description des statistiques du joueur pour l'affichage (écran de level-up, pause, labo).
 * - `format` : 'pct' = valeur 0..1 affichée en % ; 'mult' = multiplicateur affiché en % d'écart (1.15 → +15 %) ;
 *   'flat' = nombre ; 'int' = entier.
 * - `better` : 'up' si une hausse est favorable, 'down' si une baisse est favorable.
 * - `group` : regroupement pour l'affichage. Les stats sans entrée ici ne sont pas affichées.
 */
import { Stats } from '../types';

export type StatFormat = 'pct' | 'mult' | 'flat' | 'int';
export type StatGroup = 'Défense' | 'Attaque' | 'Chaleur' | 'Mobilité' | 'Utilitaire';

export interface StatInfo {
  label: string;
  format: StatFormat;
  better: 'up' | 'down';
  group: StatGroup;
  unit?: string;
}

export const STAT_INFO: Partial<Record<keyof Stats, StatInfo>> = {
  maxShield:          { label: 'Bouclier max', format: 'flat', better: 'up', group: 'Défense' },
  shieldRegen:        { label: 'Régén. bouclier', format: 'flat', better: 'up', group: 'Défense', unit: '/s' },
  maxArmor:           { label: 'Armure max', format: 'flat', better: 'up', group: 'Défense' },
  armorHardness:      { label: "Dureté d'armure", format: 'pct', better: 'up', group: 'Défense' },
  maxHull:            { label: 'Coque max', format: 'flat', better: 'up', group: 'Défense' },
  hullRegen:          { label: 'Régén. coque', format: 'flat', better: 'up', group: 'Défense', unit: '/s' },
  dmgTakenMult:       { label: 'Dégâts subis', format: 'mult', better: 'down', group: 'Défense' },
  dodgeChance:        { label: 'Esquive', format: 'pct', better: 'up', group: 'Défense' },
  res_EM:             { label: 'Résist. EM', format: 'pct', better: 'up', group: 'Défense' },
  res_Kinetic:        { label: 'Résist. cinétique', format: 'pct', better: 'up', group: 'Défense' },
  res_Thermal:        { label: 'Résist. thermique', format: 'pct', better: 'up', group: 'Défense' },
  res_Explosive:      { label: 'Résist. explosive', format: 'pct', better: 'up', group: 'Défense' },
  lifesteal:          { label: 'Vol de vie', format: 'pct', better: 'up', group: 'Défense' },
  healOnKill:         { label: 'Soin par élimination', format: 'flat', better: 'up', group: 'Défense' },

  damageMult:         { label: 'Dégâts', format: 'mult', better: 'up', group: 'Attaque' },
  fireRate:           { label: 'Cadence', format: 'mult', better: 'up', group: 'Attaque' },
  critChance:         { label: 'Chance de critique', format: 'pct', better: 'up', group: 'Attaque' },
  critMult:           { label: 'Dégâts critiques', format: 'mult', better: 'up', group: 'Attaque' },
  rangeMult:          { label: 'Portée', format: 'mult', better: 'up', group: 'Attaque' },
  projectileSpeedMult:{ label: 'Vitesse des projectiles', format: 'mult', better: 'up', group: 'Attaque' },
  explosionRadiusMult:{ label: 'Rayon des explosions', format: 'mult', better: 'up', group: 'Attaque' },
  burnMult:           { label: 'Brûlure', format: 'mult', better: 'up', group: 'Attaque' },
  executeBonus:       { label: 'Exécution (<30 %)', format: 'pct', better: 'up', group: 'Attaque' },
  slowOnHit:          { label: 'Ralentir à l\'impact', format: 'pct', better: 'up', group: 'Attaque' },
  extraProjectiles:   { label: 'Projectiles en plus', format: 'int', better: 'up', group: 'Attaque' },
  extraPierce:        { label: 'Perforation', format: 'int', better: 'up', group: 'Attaque' },
  extraChain:         { label: 'Rebonds électriques', format: 'int', better: 'up', group: 'Attaque' },
  extraDrones:        { label: 'Drones en plus', format: 'int', better: 'up', group: 'Attaque' },

  maxHeat:            { label: 'Chaleur max', format: 'flat', better: 'up', group: 'Chaleur' },
  cooling:            { label: 'Refroidissement', format: 'flat', better: 'up', group: 'Chaleur', unit: '/s' },
  heatGenMult:        { label: 'Chaleur générée', format: 'mult', better: 'down', group: 'Chaleur' },

  speed:              { label: 'Vitesse', format: 'flat', better: 'up', group: 'Mobilité' },
  abilityCooldownMult:{ label: 'Recharge compétences', format: 'mult', better: 'down', group: 'Mobilité' },
  abilityPowerMult:   { label: 'Puissance compétences', format: 'mult', better: 'up', group: 'Mobilité' },
  dashDistanceMult:   { label: 'Distance du dash', format: 'mult', better: 'up', group: 'Mobilité' },

  magnetRange:        { label: 'Aimant à XP', format: 'flat', better: 'up', group: 'Utilitaire' },
  xpMult:             { label: 'Gain d\'XP', format: 'mult', better: 'up', group: 'Utilitaire' },
  luck:               { label: 'Chance', format: 'flat', better: 'up', group: 'Utilitaire' },
  pickupChance:       { label: 'Chance de butin', format: 'mult', better: 'up', group: 'Utilitaire' },
};

/** Texte d'une valeur selon son format (ex. 0.12 pct → « 12 % », 1.15 mult → « +15 % »). */
export const formatStat = (key: keyof Stats, value: number): string => {
  const info = STAT_INFO[key];
  if (!info) return String(value);
  switch (info.format) {
    case 'pct': return `${Math.round(value * 100)} %`;
    case 'mult': { const d = Math.round((value - 1) * 100); return d === 0 ? '±0 %' : `${d > 0 ? '+' : ''}${d} %`; }
    case 'int': return String(Math.round(value));
    default: return `${Math.round(value * 10) / 10}${info.unit ?? ''}`;
  }
};

/** Texte d'un écart entre deux valeurs (ex. « +20 », « −5 % »). */
export const formatStatDelta = (key: keyof Stats, before: number, after: number): string => {
  const info = STAT_INFO[key];
  const d = after - before;
  const sign = d > 0 ? '+' : '−';
  const abs = Math.abs(d);
  if (!info) return `${sign}${abs}`;
  switch (info.format) {
    case 'pct':
    case 'mult': return `${sign}${Math.round(abs * 1000) / 10} %`;
    case 'int': return `${sign}${Math.round(abs)}`;
    default: return `${sign}${Math.round(abs * 10) / 10}${info.unit ?? ''}`;
  }
};
