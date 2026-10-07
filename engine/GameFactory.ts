import { GameState } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { WEAPONS } from '../data/weapons';
import { BLINK_DASH, TACTICAL_NOVA } from './AbilitySystem';
import { DEFAULT_SHIP_ID, getShip } from '../data/ships';
import { shipBaseStats } from './StatsCalculator';

export const STARTING_WEAPON_ID = 'ion_blaster';

/** État de départ d'une partie. Pur : utilisable dans les tests. */
export const createInitialState = (shipId: string = DEFAULT_SHIP_ID): GameState => {
  const ship = getShip(shipId);
  const startWeapon = WEAPONS.find(w => w.id === ship.startingWeapon) ?? WEAPONS.find(w => w.id === STARTING_WEAPON_ID) ?? WEAPONS[0];
  const base = shipBaseStats(ship.id);
  return {
    player: {
      id: 'player', x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, rotation: -Math.PI / 2, vx: 0, vy: 0, radius: 40, type: 'player',
      baseStats: base, runtimeStats: { ...base }, modifiers: [], statsDirty: true,
      defense: { shield: base.maxShield, armor: base.maxArmor, hull: base.maxHull },
      isGodMode: false,
    },
    shipId: ship.id, hitStreak: 0, onHitStacks: 0, lastHitTime: 0, stationaryTime: 0, mechanics: [],
    bossKills: 0, damageDealt: 0, damageTaken: 0, damageBySource: {}, nextEventTime: 0,
    heat: 0, maxHeat: base.maxHeat, isOverheated: false, score: 0, level: 1, experience: 0,
    expToNextLevel: 60,
    wave: 1, waveTimer: 35,
    waveKills: 0,
    waveQuota: 15,
    totalKills: 0,
    startTime: Date.now(),
    enemies: [], projectiles: [], xpDrops: [], effects: [], particles: [],
    activeWeapons: [{ ...startWeapon, level: 1 }],
    zones: [], beams: [], drones: [],
    time: 0, shake: 0, autoFire: false, spawnEnabled: true, autoAim: false, analogMove: { x: 0, y: 0 },
    activeAbilities: [{ ...BLINK_DASH }, { ...TACTICAL_NOVA }],
    activeEvents: [],
    keystones: [], activePassives: [], status: 'menu', comboCount: 0, comboTimer: 0, currentMisses: 0, bossSpawned: false,
    isDebugMode: false,
  };
};
