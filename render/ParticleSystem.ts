
import { Particle, GameState } from '../types';

export const emitParticles = (
  state: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number = 5
) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const s = Math.random() * speed;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      color,
      size: 2 + Math.random() * 3
    });
  }
};

export const updateParticles = (state: GameState, deltaTime: number) => {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= deltaTime / p.maxLife;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
};
