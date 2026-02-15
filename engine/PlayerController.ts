
import { GameState, DamageType } from '../types';
import { TECH_MULTIPLIERS, CONTROLS } from '../constants';
import { playShotSound } from './SoundEngine';
import { updateAbilities } from './AbilitySystem';

export const handlePlayerControls = (
  state: GameState,
  deltaTime: number,
  time: number,
  keys: Set<string>,
  mouseWorld: { x: number, y: number }
) => {
  const { player } = state;

  // 1. Mouvement de base utilisant la config centralisée
  const isUp = CONTROLS.MOVE_UP.some(k => keys.has(k));
  const isDown = CONTROLS.MOVE_DOWN.some(k => keys.has(k));
  const isLeft = CONTROLS.MOVE_LEFT.some(k => keys.has(k));
  const isRight = CONTROLS.MOVE_RIGHT.some(k => keys.has(k));

  const moveX = (isRight ? 1 : 0) - (isLeft ? 1 : 0);
  const moveY = (isDown ? 1 : 0) - (isUp ? 1 : 0);
  
  player.vx = moveX * player.runtimeStats.speed;
  player.vy = moveY * player.runtimeStats.speed;
  player.x += player.vx;
  player.y += player.vy;
  
  // Rotation vers la souris
  player.rotation = Math.atan2(mouseWorld.y - player.y, mouseWorld.x - player.x);

  // 2. Gestion des Compétences (Abilities)
  updateAbilities(state, deltaTime, keys);

  // 3. Gestion du Tir
  const isFiring = CONTROLS.FIRE.some(k => keys.has(k));
  if (isFiring && !state.isOverheated) {
    state.activeWeapons.forEach(w => {
      const techMult = TECH_MULTIPLIERS[w.level] || 1.0;
      const cooldown = 1000 / (w.fireRate * player.runtimeStats.fireRate * techMult);
      
      if (time - w.lastFired > cooldown) {
        w.lastFired = time;
        playShotSound(w.type);
        const isCrit = Math.random() < player.runtimeStats.critChance;
        
        state.projectiles.push({
          x: player.x + Math.cos(player.rotation) * player.radius,
          y: player.y + Math.sin(player.rotation) * player.radius,
          vx: Math.cos(player.rotation) * w.bulletSpeed * player.runtimeStats.projectileSpeedMult,
          vy: Math.sin(player.rotation) * w.bulletSpeed * player.runtimeStats.projectileSpeedMult,
          packet: { 
            amount: w.damage * player.runtimeStats.damageMult * techMult * (isCrit ? player.runtimeStats.critMult : 1), 
            type: w.type, 
            penetration: 0, 
            isCrit 
          },
          color: w.bulletColor,
          ownerId: 'player',
          radius: 5,
          distanceTraveled: 0,
          maxRange: w.range * player.runtimeStats.rangeMult,
          heatGenerated: w.heatPerShot,
        });
        
        state.heat += w.heatPerShot;
        if (state.heat >= state.maxHeat) state.isOverheated = true;
      }
    });
  }
};
