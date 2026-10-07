
import { GameState } from '../types';
import { clearScreen, drawHexGrid, drawWorldBounds } from './WorldRenderer';
import { drawShip } from './ShipRenderer';
import { drawParticles, drawXPDrops, drawVisualEffects } from './EffectRenderer';
import { renderEnvironmentalEffects } from './EventRenderer';
import { drawZones, drawBeams, drawProjectiles, drawDrones, drawPlayerGauges } from './CombatRenderer';

export interface RenderOptions {
  damageNumbers?: boolean; // false = masque les chiffres de dégâts
}

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: { width: number, height: number },
  camera: { x: number, y: number },
  screenShake: number,
  time: number,
  viewScale = 1,
  options: RenderOptions = {}
) => {
  clearScreen(ctx, dimensions);

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // 1. Rendu des effets plein écran (Tempêtes) avant la caméra
  renderEnvironmentalEffects(ctx, state, dimensions, time);

  ctx.save();
  ctx.scale(viewScale, viewScale);
  ctx.translate(-camera.x, -camera.y);

  // Fond de carte
  drawHexGrid(ctx, camera, dimensions, viewScale);
  drawWorldBounds(ctx, time); // Ajout de la barrière ici

  // Layered rendering
  drawParticles(ctx, state.particles);
  drawXPDrops(ctx, state.xpDrops);
  
  drawZones(ctx, state.zones, time);
  drawProjectiles(ctx, state.projectiles, time);

  // Entities
  state.enemies.forEach(e => drawShip(ctx, e, false, time));
  drawShip(ctx, state.player, true, time);
  drawPlayerGauges(ctx, state, time);
  drawDrones(ctx, state.drones, state);
  drawBeams(ctx, state.beams);

  // Floating text
  drawVisualEffects(ctx, options.damageNumbers === false ? state.effects.filter(e => e.kind !== 'damage') : state.effects);

  ctx.restore();
  ctx.restore();
};
