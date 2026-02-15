
import { GameState, EnvEventType, EnvironmentalEvent, DamageType } from '../types';
import { applyDamage } from './DamageEngine';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { emitParticles } from '../render/ParticleSystem';

export const updateEnvironmentalEvents = (state: GameState, deltaTime: number, time: number) => {
  const { player, enemies, activeEvents } = state;

  // 1. Spawning aléatoire (Chance rare par frame)
  if (state.status === 'playing' && activeEvents.length === 0 && Math.random() < 0.001) {
    const types = [EnvEventType.SOLAR_STORM, EnvEventType.BLACK_HOLE, EnvEventType.MAGNETIC_STORM];
    const type = types[Math.floor(Math.random() * types.length)];
    
    activeEvents.push({
      id: Math.random().toString(),
      type,
      x: type === EnvEventType.BLACK_HOLE ? player.x + (Math.random() - 0.5) * 800 : 0,
      y: type === EnvEventType.BLACK_HOLE ? player.y + (Math.random() - 0.5) * 800 : 0,
      radius: type === EnvEventType.BLACK_HOLE ? 400 : 0,
      duration: 15,
      maxDuration: 15,
      intensity: 1.0
    });
  }

  // 2. Traitement des événements actifs
  for (let i = activeEvents.length - 1; i >= 0; i--) {
    const event = activeEvents[i];
    event.duration -= deltaTime;

    if (event.duration <= 0) {
      activeEvents.splice(i, 1);
      continue;
    }

    // Effets spécifiques
    switch (event.type) {
      case EnvEventType.SOLAR_STORM:
        // Chauffe accrue et micro-dégâts
        state.heat = Math.min(state.maxHeat, state.heat + 2 * deltaTime);
        if (Math.random() < 0.1) {
          applyDamage(player, { amount: 0.5, type: DamageType.THERMAL, penetration: 0, isCrit: false }, time);
        }
        break;

      case EnvEventType.BLACK_HOLE:
        // Attraction gravitationnelle
        const pull = (target: any) => {
          const dx = event.x - target.x;
          const dy = event.y - target.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 1000) {
            const force = (1 - dist / 1000) * 5;
            target.vx += (dx / dist) * force;
            target.vy += (dy / dist) * force;
            if (dist < 50) {
                applyDamage(target, { amount: 10 * deltaTime, type: DamageType.KINETIC, penetration: 1, isCrit: false }, time);
            }
          }
        };
        pull(player);
        enemies.forEach(pull);
        if (Math.random() < 0.3) emitParticles(state, event.x + (Math.random()-0.5)*800, event.y + (Math.random()-0.5)*800, '#1e1b4b', 1, 2);
        break;

      case EnvEventType.MAGNETIC_STORM:
        // Malus de cooldown et glitch
        break;
    }
  }
};
