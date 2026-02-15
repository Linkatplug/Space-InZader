
import { GameState, XPDrop, Entity } from '../types';

export const updateLootMagnetism = (state: GameState, deltaTime: number) => {
  const { player, xpDrops } = state;
  const magnetRangeSq = player.runtimeStats.magnetRange ** 2;

  xpDrops.forEach(drop => {
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < magnetRangeSq) {
      const dist = Math.sqrt(distSq);
      const pullStrength = 1.2; // Force d'attraction
      drop.vx += (dx / dist) * pullStrength;
      drop.vy += (dy / dist) * pullStrength;
    }

    // Physique de base du loot
    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.vx *= 0.92; // Friction spatiale plus forte pour les items
    drop.vy *= 0.92;
  });
};
