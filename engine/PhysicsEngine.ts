
import { GameState } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export const updatePhysics = (state: GameState, deltaTime: number) => {
  const { player, projectiles } = state;

  // 1. Player World Bounds
  player.x = Math.max(player.radius, Math.min(WORLD_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(WORLD_HEIGHT - player.radius, player.y));

  // 2. Projectiles Movement
  projectiles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.distanceTraveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (p.distanceTraveled > p.maxRange) p.dead = true;
  });
};
