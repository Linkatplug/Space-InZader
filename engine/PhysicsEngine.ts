import { GameState } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { updatePlayerProjectile, detonate } from './WeaponSystem';

export const updatePhysics = (state: GameState, deltaTime: number) => {
  const { player, projectiles } = state;

  // 1. Limites du monde
  player.x = Math.max(player.radius, Math.min(WORLD_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(WORLD_HEIGHT - player.radius, player.y));

  // 2. Projectiles
  projectiles.forEach(p => {
    if (p.dead) return;
    if (p.ownerId === 'player') updatePlayerProjectile(state, p, deltaTime);
    if (p.dead) return;
    p.x += p.vx;
    p.y += p.vy;
    p.distanceTraveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (p.distanceTraveled > p.maxRange) {
      // Les explosifs détonent en bout de course
      if (p.ownerId === 'player' && (p.explodeRadius || p.gravity)) detonate(state, p);
      // Tir manqué : la série d'impacts retombe
      if (p.ownerId === 'player' && (!p.hitIds || p.hitIds.length === 0) && p.kind !== 'mine') state.hitStreak = 0;
      p.dead = true;
    }
  });
};
