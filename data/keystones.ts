/**
 * Keystones : modificateurs uniques et puissants, proposés tous les 5 niveaux.
 * Modificateurs dynamiques possibles (voir engine/Conditions.ts) :
 *  - `condition` : actif seulement si la condition est vraie (chaleur haute, coque basse, immobile...)
 *  - `scaling`   : additif, vaut value × min(source, max) (série d'impacts, nombre de drones...)
 */
import { Keystone } from '../types';

export const KEYSTONES: Keystone[] = [
  {
    id: 'overheat_protocol', name: 'Protocole Surchauffe', icon: '🔥', color: '#fb923c',
    description: '+50% dégâts au-dessus de 80% de chaleur.',
    modifiers: [{ id: 'oh-1', property: 'damageMult', value: 1.5, type: 'multiplicative', condition: 'highHeat' }],
  },
  {
    id: 'blood_frenzy', name: 'Frénésie Sanguine', icon: '🩸', color: '#f43f5e',
    description: "Chaque impact donne +0.25% de vol de vie (max 40). Retombe après 3s sans toucher.",
    modifiers: [{ id: 'bf-1', property: 'lifesteal', value: 0.0025, type: 'additive', scaling: { source: 'onHitStacks', max: 40 } }],
  },
  {
    id: 'overclock_core', name: 'Cœur Surcadencé', icon: '⚡', color: '#facc15',
    description: '+35% dégâts et +20% cadence, mais +35% de chaleur générée.',
    modifiers: [
      { id: 'oc-1', property: 'damageMult', value: 1.35, type: 'multiplicative' },
      { id: 'oc-2', property: 'fireRate', value: 1.2, type: 'multiplicative' },
      { id: 'oc-3', property: 'heatGenMult', value: 1.35, type: 'multiplicative' },
    ],
  },
  {
    id: 'fortress_mode', name: 'Mode Forteresse', icon: '🛡️', color: '#60a5fa',
    description: 'Immobile depuis 0.7s : -50% dégâts subis et +25% rayon des explosions.',
    modifiers: [
      { id: 'fm-1', property: 'dmgTakenMult', value: 0.5, type: 'multiplicative', condition: 'stationary' },
      { id: 'fm-2', property: 'explosionRadiusMult', value: 1.25, type: 'multiplicative', condition: 'stationary' },
    ],
  },
  {
    id: 'dead_eye', name: 'Œil Mort', icon: '🎯', color: '#c084fc',
    description: '+15% dégâts par impact consécutif (max 8). Un tir manqué remet à zéro.',
    modifiers: [{ id: 'de-1', property: 'damageMult', value: 0.15, type: 'additive', scaling: { source: 'hitStreak', max: 8 } }],
  },
  {
    id: 'machine_network', name: 'Réseau de Machines', icon: '🤖', color: '#4ade80',
    description: '+1 drone. +6% dégâts et +5% portée par drone (max 10).',
    modifiers: [
      { id: 'mn-0', property: 'extraDrones', value: 1, type: 'additive' },
      { id: 'mn-1', property: 'damageMult', value: 0.06, type: 'additive', scaling: { source: 'droneCount', max: 10 } },
      { id: 'mn-2', property: 'rangeMult', value: 0.05, type: 'additive', scaling: { source: 'droneCount', max: 10 } },
    ],
  },
  {
    id: 'rage_engine', name: 'Moteur de Rage', icon: '💢', color: '#ef4444',
    description: 'Coque sous 30% : dégâts ×2 et vitesse ×1.3.',
    modifiers: [
      { id: 're-1', property: 'damageMult', value: 2, type: 'multiplicative', condition: 'lowHull' },
      { id: 're-2', property: 'speed', value: 1.3, type: 'multiplicative', condition: 'lowHull' },
    ],
  },
  {
    id: 'glass_reactor', name: 'Réacteur de Verre', icon: '💎', color: '#a5f3fc',
    description: '+40% dégâts, mais bouclier maximum réduit de moitié.',
    modifiers: [
      { id: 'gr-1', property: 'damageMult', value: 1.4, type: 'multiplicative' },
      { id: 'gr-2', property: 'maxShield', value: 0.5, type: 'multiplicative' },
    ],
  },
  {
    id: 'blood_armor', name: 'Blindage Réactif', icon: '⛓️', color: '#f97316',
    description: 'Bouclier tombé : +30% dureté d\'armure et +3 coque/s.',
    modifiers: [
      { id: 'ba-1', property: 'armorHardness', value: 0.3, type: 'additive', condition: 'shieldDown' },
      { id: 'ba-2', property: 'hullRegen', value: 3, type: 'additive', condition: 'shieldDown' },
    ],
  },
];
