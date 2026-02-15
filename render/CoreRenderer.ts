
import { GameState } from '../types';
import { VIEW_SCALE } from '../constants';
import { clearScreen, drawHexGrid, drawWorldBounds } from './WorldRenderer';
import { drawShip } from './ShipRenderer';
import { drawParticles, drawXPDrops, drawVisualEffects } from './EffectRenderer';
import { renderEnvironmentalEffects } from './EventRenderer';

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: { width: number, height: number },
  camera: { x: number, y: number },
  screenShake: number,
  time: number
) => {
  clearScreen(ctx, dimensions);

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // 1. Rendu des effets plein écran (Tempêtes) avant la caméra
  renderEnvironmentalEffects(ctx, state, dimensions, time);

  ctx.save();
  ctx.scale(VIEW_SCALE, VIEW_SCALE);
  ctx.translate(-camera.x, -camera.y);

  // Fond de carte
  drawHexGrid(ctx, camera, dimensions);
  drawWorldBounds(ctx, time); // Ajout de la barrière ici

  // Layered rendering
  drawParticles(ctx, state.particles);
  drawXPDrops(ctx, state.xpDrops);
  
  // Projectiles
  state.projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Entities
  state.enemies.forEach(e => drawShip(ctx, e, false, time));
  drawShip(ctx, state.player, true, time);

  // Floating text
  drawVisualEffects(ctx, state.effects);

  ctx.restore();
  ctx.restore();
};
