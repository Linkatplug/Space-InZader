import { GameState } from '../types';
import { clampToArena } from './Arena';
import { updatePlayerProjectile, detonate } from './WeaponSystem';

export const updatePhysics = (state: GameState, deltaTime: number) => {
  const { player, projectiles } = state;

  // 1. Limites du monde
  clampToArena(player, player.radius);

  // 2. Projectiles
  projectiles.forEach(p => {
    if (p.dead) return;
    if (p.ownerId === 'player') updatePlayerProjectile(state, p, deltaTime);
    if (p.dead) return;
    // Distorsion : les projectiles ennemis avancent à 40 %
    const k = p.ownerId !== 'player' && p.ownerId !== 'env' && state.enemySlowUntil > state.time ? 0.4 : 1;
    p.x += p.vx * k;
    p.y += p.vy * k;
    p.distanceTraveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * k;
    if (p.distanceTraveled > p.maxRange) {
      // Les explosifs détonent en bout de course
      if (p.ownerId === 'player' && (p.explodeRadius || p.gravity)) detonate(state, p);
      // Tir manqué : la série d'impacts retombe
      if (p.ownerId === 'player' && (!p.hitIds || p.hitIds.length === 0) && p.kind !== 'mine') state.hitStreak = 0;
      p.dead = true;
    }
  });
};
