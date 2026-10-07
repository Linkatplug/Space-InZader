import { GameState } from '../types';
import { createEffect, updateStatusEffects } from './Combat';
import { updateZones } from './WeaponSystem';
import { spawnEnemy } from './EnemyFactory';
import { updateEnemyAttacks } from './EnemyAttacks';
import { bossForWave, isBossWave } from '../data/enemies';
import { refreshPlayerStats } from './StatsCalculator';
import { activeMechanics } from './Synergies';
import { HEAT, updateHeat } from './Heat';
import { updateParticles, emitParticles } from '../render/ParticleSystem';
import { updatePhysics } from './PhysicsEngine';
import { checkCollisions } from './CollisionSystem';
import { updateEnemyAI } from '../ai/EnemyAI';
import { updateLootMagnetism } from './LootSystem';
import { handlePlayerControls } from './PlayerController';
import { updateEnvironmentalEvents } from './EventSystem';

const ON_HIT_RESET_MS = 3000;
/** Après surchauffe, le tir reprend sous ce seuil (fraction du max). Réglages dans engine/Heat.ts. */
export const OVERHEAT_RECOVERY = HEAT.OVERHEAT_RECOVERY;

export { createEffect, spawnEnemy };

export const updateGameState = (
  state: GameState,
  deltaTime: number,
  keys: Set<string>,
  mouseWorld: { x: number, y: number },
  onLevelUp: () => void,
  onGameOver: () => void,
) => {
  const { player } = state;
  state.time += deltaTime * 1000;
  const time = state.time;

  if (state.buffs.length) state.buffs = state.buffs.filter(b => b.until > time);

  // Stats recalculées chaque pas : keystones conditionnels et cumuls évoluent en continu
  state.mechanics = activeMechanics(state);
  refreshPlayerStats(state);
  if (time - state.lastHitTime > ON_HIT_RESET_MS) state.onHitStacks = 0;

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

      if (isBossWave(state.wave)) {
        state.enemies.push(spawnEnemy(state.wave, player, bossForWave(state.wave)));
        state.bossSpawned = true;
        createEffect(state, player.x, player.y - 160, 'ALERTE : BOSS', '#facc15');
      }

      state.shake = Math.max(state.shake, 15);
      createEffect(state, player.x, player.y - 120, `VAGUE ${state.wave} ACTIVE`, "#22d3ee");
    }
  }

  updateEnvironmentalEvents(state, deltaTime, time);
  handlePlayerControls(state, deltaTime, time, keys, mouseWorld);
  state.stationaryTime = (player.vx === 0 && player.vy === 0) ? state.stationaryTime + deltaTime : 0;

  state.enemies.forEach(e => {
    updateEnemyAI(e, player, state, deltaTime, time);

    updateEnemyAttacks(state, e, time);
  });

  separateEnemies(state);
  updatePhysics(state, deltaTime);
  updateLootMagnetism(state, deltaTime);
  updateZones(state, deltaTime);
  updateStatusEffects(state, deltaTime);
  checkCollisions(state);

  updateHeat(state, deltaTime);

  if (player.runtimeStats.hullRegen > 0) {
    player.defense.hull = Math.min(player.runtimeStats.maxHull, player.defense.hull + player.runtimeStats.hullRegen * deltaTime);
  }

  const SHIELD_RECHARGE_DELAY = 3000;
  if (player.defense.shield < player.runtimeStats.maxShield) {
    const timeSinceDamage = time - (player.lastDamageTime || 0);
    if (timeSinceDamage > SHIELD_RECHARGE_DELAY) {
      player.defense.shield = Math.min(player.runtimeStats.maxShield, player.defense.shield + player.runtimeStats.shieldRegen * deltaTime);
    }
  }

  const maxPop = Math.min(45, 8 + Math.round(state.wave * 2.5));
  const currentEnemies = state.enemies.length;

  if (state.status === 'playing' && state.spawnEnabled && currentEnemies < maxPop && (currentEnemies + state.waveKills) < state.waveQuota) {
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

  if (player.defense.hull <= 0) {
    emitParticles(state, player.x, player.y, '#22d3ee', 80, 12);
    onGameOver();
  } else if (state.experience >= state.expToNextLevel && state.status === 'playing') {
    onLevelUp();
  }
};

/** Empêche les ennemis de s'empiler (répulsion douce entre voisins). */
const separateEnemies = (state: GameState) => {
  const list = state.enemies;
  const n = list.length;
  for (let i = 0; i < n; i++) {
    const a = list[i];
    for (let j = i + 1; j < n; j++) {
      const b = list[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const min = (a.radius + b.radius) * 0.9;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) * 0.25;
      const ux = dx / d, uy = dy / d;
      const wa = a.type === 'boss' ? 0.1 : 1, wb = b.type === 'boss' ? 0.1 : 1;
      a.x -= ux * push * wa; a.y -= uy * push * wa;
      b.x += ux * push * wb; b.y += uy * push * wb;
    }
  }
};
