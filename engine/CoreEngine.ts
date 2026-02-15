
import { GameState, Entity, DamageType } from '../types';
import { INITIAL_STATS } from '../constants';
import { calculateRuntimeStats, syncDefenseState } from './StatsCalculator';
import { updateParticles } from '../render/ParticleSystem';
import { updatePhysics } from './PhysicsEngine';
import { checkCollisions } from './CollisionSystem';
import { updateEnemyAI } from '../ai/EnemyAI';
import { updateLootMagnetism } from './LootSystem';
import { handlePlayerControls } from './PlayerController';
import { updateEnvironmentalEvents } from './EventSystem';

export const createEffect = (state: GameState, x: number, y: number, text: string, color: string) => {
  state.effects.push({
    id: Math.random().toString(),
    x, y, text, color,
    life: 1.0, // Un peu plus court pour éviter l'encombrement
    vx: (Math.random() - 0.5) * 1.5,
    vy: -1.0 - Math.random() * 1.5, // Remontée plus douce
  });
};

export const spawnEnemy = (wave: number, player: Entity, forcedSubtype?: any, customDist?: number): Entity => {
  const angle = Math.random() * Math.PI * 2;
  const distance = customDist || (1000 + Math.random() * 200);
  let x = player.x + Math.cos(angle) * distance;
  let y = player.y + Math.sin(angle) * distance;
  
  const difficulty = 1 + (wave - 1) * 0.15;
  const rand = Math.random();
  let subtype: any = 'basic';
  
  if (forcedSubtype) {
    subtype = forcedSubtype;
  } else {
    if (wave >= 6) {
      const pSniper = Math.min(0.25, 0.05 + (wave - 6) * 0.02);
      const pKamikaze = Math.min(0.20, 0.10 + (wave - 4) * 0.02);
      const pSwarmer = 0.25;

      if (rand < pSniper) subtype = 'sniper';
      else if (rand < pSniper + pKamikaze) subtype = 'kamikaze';
      else if (rand < pSniper + pKamikaze + pSwarmer) subtype = 'swarmer';
      else subtype = 'basic';
    } else if (wave >= 4) {
      if (rand < 0.15) subtype = 'kamikaze';
      else if (rand < 0.40) subtype = 'swarmer';
      else subtype = 'basic';
    } else if (wave >= 2) {
      if (rand < 0.30) subtype = 'swarmer';
      else subtype = 'basic';
    } else {
      subtype = 'basic';
    }
  }

  const base = { ...INITIAL_STATS };
  let radius = 32;

  if (subtype === 'boss') { 
    base.maxHull = 6000 * difficulty; 
    base.speed = 1.4; 
    radius = 110; 
  } else if (subtype === 'sniper') { 
    base.maxHull = 60 * difficulty; 
    base.speed = 2.6; 
    radius = 28; 
  } else if (subtype === 'kamikaze') { 
    base.maxHull = 35 * difficulty; 
    base.speed = 7.8; 
    radius = 24; 
  } else if (subtype === 'swarmer') { 
    base.maxHull = 20 * difficulty; 
    base.speed = 5.2; 
    radius = 16; 
  } else { 
    const hpFactor = wave <= 2 ? 0.45 : 1.0;
    base.maxHull = 85 * difficulty * hpFactor; 
    base.speed = 2.4; 
    radius = 32; 
  }
  
  return {
    id: Math.random().toString(),
    x, y, vx: 0, vy: 0, rotation: 0, radius,
    type: subtype === 'boss' ? 'boss' : 'enemy',
    subtype,
    baseStats: base,
    runtimeStats: base,
    modifiers: [],
    statsDirty: false,
    defense: { shield: base.maxShield, armor: base.maxArmor, hull: base.maxHull },
    lastFired: 0,
    marks: { type: 'resonance', count: 0 }
  };
};

export const updateGameState = (
  state: GameState,
  deltaTime: number,
  time: number,
  keys: Set<string>,
  mouseWorld: { x: number, y: number },
  onLevelUp: () => void,
  onGameOver: () => void,
  onShake: (amount: number) => void
) => {
  const { player } = state;

  if (player.statsDirty) {
    player.runtimeStats = calculateRuntimeStats(player, state);
    syncDefenseState(player);
    state.maxHeat = player.runtimeStats.maxHeat; 
    player.statsDirty = false;
  }

  if (state.comboCount > 0) {
    state.comboTimer -= deltaTime;
    if (state.comboTimer <= 0) { 
      state.comboCount = 0; 
      state.currentMisses = 0; 
    }
  }

  if (state.status === 'playing') {
    if (state.waveKills >= state.waveQuota) {
      state.wave++;
      state.waveKills = 0;
      state.waveQuota = Math.floor(10 + (state.wave * 6));
      
      if (state.wave % 10 === 0) {
        state.enemies.push(spawnEnemy(state.wave, player, 'boss'));
        state.bossSpawned = true;
      }
      
      onShake(15);
      createEffect(state, player.x, player.y - 120, `VAGUE ${state.wave} ACTIVE`, "#22d3ee");
    }
  }

  updateEnvironmentalEvents(state, deltaTime, time);
  handlePlayerControls(state, deltaTime, time, keys, mouseWorld);

  state.enemies.forEach(e => {
    updateEnemyAI(e, player, state, deltaTime, time);

    if (e.subtype === 'boss' && time - (e.lastFired || 0) > 1100) {
      e.lastFired = time;
      for(let i=0; i<12; i++) {
        const a = Math.atan2(player.y - e.y, player.x - e.x) + (Math.PI*2/12)*i;
        state.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*7.5, vy: Math.sin(a)*7.5, packet: { amount: 15, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, color: '#facc15', ownerId: e.id, radius: 10, distanceTraveled: 0, maxRange: 2000, heatGenerated: 0 });
      }
    }
    if (e.subtype === 'sniper' && time - (e.lastFired || 0) > 2800) {
      e.lastFired = time;
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      state.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a)*20, vy: Math.sin(a)*20, packet: { amount: 20, type: DamageType.KINETIC, penetration: 0.2, isCrit: false }, color: '#ffffff', ownerId: e.id, radius: 4, distanceTraveled: 0, maxRange: 1800, heatGenerated: 0 });
    }
  });

  updatePhysics(state, deltaTime);
  updateLootMagnetism(state, deltaTime);
  checkCollisions(state, time, onLevelUp, onGameOver, onShake, (x, y, txt, col) => createEffect(state, x, y, txt, col));

  if (state.heat > 0) state.heat = Math.max(0, state.heat - player.runtimeStats.cooling * deltaTime);
  if (state.isOverheated && state.heat <= state.maxHeat * 0.9) state.isOverheated = false;

  const SHIELD_RECHARGE_DELAY = 3000;
  if (player.defense.shield < player.runtimeStats.maxShield) {
    const timeSinceDamage = time - (player.lastDamageTime || 0);
    if (timeSinceDamage > SHIELD_RECHARGE_DELAY) {
      player.defense.shield = Math.min(player.runtimeStats.maxShield, player.defense.shield + player.runtimeStats.shieldRegen * deltaTime);
    }
  }

  const maxPop = Math.min(35, 8 + (state.wave * 2));
  const currentEnemies = state.enemies.length;
  
  if (state.status === 'playing' && currentEnemies < maxPop && (currentEnemies + state.waveKills) < state.waveQuota) {
    const spawnProb = 0.03 + (state.wave * 0.005);
    if (Math.random() < spawnProb) {
      state.enemies.push(spawnEnemy(state.wave, player));
    }
  }

  updateParticles(state, deltaTime);
  state.effects.forEach(ef => { 
    ef.x += ef.vx; ef.y += ef.vy; 
    ef.life -= deltaTime * 1.2; 
  });
  state.effects = state.effects.filter(ef => ef.life > 0);
};
