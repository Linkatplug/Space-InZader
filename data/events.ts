/**
 * Événements environnementaux (inspirés du WeatherSystem V1).
 * Pour ajouter un événement : une entrée ici + un comportement dans engine/EventSystem.ts → EVENT_HANDLERS.
 * `playerModifiers` s'appliquent au joueur tant que l'événement est actif (via StatsCalculator).
 */
import { EnvEventType, Modifier } from '../types';

export interface EventDef {
  type: EnvEventType;
  name: string;
  description: string;
  color: string;
  weight: number;
  duration: [number, number];   // secondes (min, max)
  warning: number;              // secondes d'alerte avant le début
  minWave: number;
  playerModifiers?: Modifier[];
}

export const EVENTS: Record<EnvEventType, EventDef> = {
  [EnvEventType.ASTEROID_BELT]: {
    type: EnvEventType.ASTEROID_BELT, name: 'Pluie de météores', color: '#a8a29e',
    description: 'Des météores traversent le secteur. Ils écrasent aussi les ennemis.',
    weight: 0.4, duration: [12, 18], warning: 2, minWave: 2,
  },
  [EnvEventType.BLACK_HOLE]: {
    type: EnvEventType.BLACK_HOLE, name: 'Trou noir', color: '#a855f7',
    description: "Une singularité attire tout. L'XP trop proche est engloutie.",
    weight: 0.3, duration: [12, 14], warning: 4, minWave: 3,
  },
  [EnvEventType.SOLAR_STORM]: {
    type: EnvEventType.SOLAR_STORM, name: 'Éruption solaire', color: '#fb923c',
    description: 'Refroidissement divisé par deux, brûlures légères.',
    weight: 0.2, duration: [10, 14], warning: 2, minWave: 4,
    playerModifiers: [{ id: 'ev-solar', property: 'cooling', value: 0.5, type: 'multiplicative' }],
  },
  [EnvEventType.MAGNETIC_STORM]: {
    type: EnvEventType.MAGNETIC_STORM, name: 'Tempête magnétique', color: '#22d3ee',
    description: 'Boucliers hors ligne, cadence de tir -40%.',
    weight: 0.2, duration: [5, 7], warning: 2, minWave: 5,
    playerModifiers: [
      { id: 'ev-mag-1', property: 'fireRate', value: 0.6, type: 'multiplicative' },
      { id: 'ev-mag-2', property: 'shieldRegen', value: 0, type: 'multiplicative' },
    ],
  },
};

/** Délai entre deux événements (secondes). */
export const EVENT_INTERVAL: [number, number] = [40, 70];
