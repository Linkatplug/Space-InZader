/**
 * Classes de vaisseaux (portées de la V1). Pour ajouter un vaisseau : ajouter une entrée.
 * `stats` remplace les valeurs de INITIAL_STATS (constants.ts) pour ce vaisseau.
 */
import { ShipClass, Tag } from '../types';

export const SHIPS: ShipClass[] = [
  {
    id: 'interceptor', name: 'Intercepteur', difficulty: 'facile', color: '#22d3ee',
    description: 'Polyvalent. Bouclier solide, armes à ions.',
    stats: {},
    startingWeapon: 'ion_blaster', signatureKeystone: 'overheat_protocol',
    preferredTags: [Tag.ENERGY],
    abilities: ['blink_dash', 'tactical_nova'],
  },
  {
    id: 'gunner', name: 'Mitrailleur', difficulty: 'moyen', color: '#facc15',
    description: 'Cadence de tir élevée, gestion de la surchauffe.',
    stats: { fireRate: 1.25, maxShield: 40, cooling: 30 },
    startingWeapon: 'auto_cannon', signatureKeystone: 'overclock_core',
    preferredTags: [Tag.KINETIC, Tag.BALLISTIC],
    abilities: ['blink_dash', 'overdrive'],
  },
  {
    id: 'fortress', name: 'Forteresse', difficulty: 'facile', color: '#60a5fa',
    description: 'Blindage lourd et contrôle de zone. Lent.',
    stats: { maxArmor: 180, maxHull: 140, armorHardness: 0.2, speed: 5, fireRate: 0.85 },
    startingWeapon: 'minefield_layer', signatureKeystone: 'fortress_mode',
    preferredTags: [Tag.DEFENSIVE, Tag.AREA, Tag.EXPLOSIVE],
    abilities: ['aegis_shield', 'tactical_nova'],
  },
  {
    id: 'deadeye', name: 'Œil de Lynx', difficulty: 'moyen', color: '#c084fc',
    description: 'Précision et coups critiques à longue portée.',
    stats: { critChance: 0.12, critMult: 2.3, rangeMult: 1.2, maxArmor: 90, fireRate: 1.0 },
    startingWeapon: 'gauss_repeater', signatureKeystone: 'dead_eye',
    preferredTags: [Tag.KINETIC, Tag.HOMING],
    abilities: ['blink_dash', 'time_dilation'],
  },
  {
    id: 'engineer', name: 'Ingénieur', difficulty: 'moyen', color: '#4ade80',
    description: 'Drones et frappes automatiques.',
    stats: { maxShield: 70, shieldRegen: 3 },
    startingWeapon: 'em_drone_wing', signatureKeystone: 'machine_network',
    preferredTags: [Tag.DRONE, Tag.ORBITAL, Tag.SWARM],
    abilities: ['repair_nanites', 'orbital_barrage'],
    unlock: { type: 'wave', wave: 15 },
  },
  {
    id: 'vampire', name: 'Vampire', difficulty: 'difficile', color: '#f43f5e',
    description: 'Fragile, se soigne en infligeant des dégâts.',
    stats: { maxHull: 80, maxArmor: 60, lifesteal: 0.04, speed: 6.4, critMult: 2.2 },
    startingWeapon: 'solar_flare', signatureKeystone: 'blood_frenzy',
    preferredTags: [Tag.DOT, Tag.ENERGY],
    abilities: ['blink_dash', 'gravity_well'],
    unlock: { type: 'kills', kills: 1000 },
  },
  {
    id: 'berserker', name: 'Berserker', difficulty: 'difficile', color: '#ef4444',
    description: 'Courte portée, vitesse et rage quand la coque faiblit.',
    stats: { maxShield: 30, speed: 7, damageMult: 1.15, dmgTakenMult: 1.1 },
    startingWeapon: 'plasma_stream', signatureKeystone: 'rage_engine',
    preferredTags: [Tag.DOT, Tag.AREA],
    abilities: ['blink_dash', 'emergency_vent'],
    unlock: { type: 'wave', wave: 25 },
  },
];

export const DEFAULT_SHIP_ID = 'interceptor';
export const getShip = (id: string) => SHIPS.find(s => s.id === id) ?? SHIPS[0];
