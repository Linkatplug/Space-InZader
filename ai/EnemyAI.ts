
import { Entity, GameState } from '../types';

export const updateEnemyAI = (e: Entity, player: Entity, state: GameState, deltaTime: number, time: number) => {
  const dist = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
  
  // Vitesse de rotation (Lissage de la rotation)
  e.rotation = angleToPlayer;

  switch (e.subtype) {
    case 'boss':
      // Approche lente et constante
      e.vx = Math.cos(angleToPlayer) * e.baseStats.speed;
      e.vy = Math.sin(angleToPlayer) * e.baseStats.speed;
      break;

    case 'sniper':
      // Comportement de maintien de distance (Kiting)
      if (dist > 600) {
        e.vx = Math.cos(angleToPlayer) * e.baseStats.speed;
        e.vy = Math.sin(angleToPlayer) * e.baseStats.speed;
      } else if (dist < 450) {
        e.vx = -Math.cos(angleToPlayer) * e.baseStats.speed;
        e.vy = -Math.sin(angleToPlayer) * e.baseStats.speed;
      } else {
        // Orbitation latérale
        e.vx = Math.cos(angleToPlayer + Math.PI/2) * e.baseStats.speed;
        e.vy = Math.sin(angleToPlayer + Math.PI/2) * e.baseStats.speed;
      }
      break;

    case 'kamikaze':
      // Charge pure (Beeline) avec accélération
      const boost = dist < 300 ? 1.5 : 1.0;
      e.vx = Math.cos(angleToPlayer) * e.baseStats.speed * boost;
      e.vy = Math.sin(angleToPlayer) * e.baseStats.speed * boost;
      break;

    case 'swarmer':
    case 'basic':
    default:
      // Poursuite simple
      e.vx = Math.cos(angleToPlayer) * e.baseStats.speed;
      e.vy = Math.sin(angleToPlayer) * e.baseStats.speed;
      break;
  }

  // Application du mouvement
  e.x += e.vx;
  e.y += e.vy;
};
