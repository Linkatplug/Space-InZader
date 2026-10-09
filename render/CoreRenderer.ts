
import { GameState } from '../types';
import { clearScreen, drawHexGrid, drawWorldBounds } from './WorldRenderer';
import { drawShip } from './ShipRenderer';
import { drawParticles, drawXPDrops, drawVisualEffects } from './EffectRenderer';
import { renderEnvironmentalEffects, renderWorldEvents } from './EventRenderer';
import { drawZones, drawBeams, drawProjectiles, drawDrones, drawPlayerGauges, drawPickups, drawWarpIn } from './CombatRenderer';
import { ARENA } from '../engine/Arena';

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

  // Tout le monde du jeu est découpé au cadre de l'arène : rien n'apparaît dehors
  // (le moteur y borne déjà ennemis, XP, butin, zones… ; ceci coupe ce qui dépasse : cercles, particules, tirs)
  ctx.save();
  ctx.beginPath();
  ctx.rect(ARENA.minX, ARENA.minY, ARENA.maxX - ARENA.minX, ARENA.maxY - ARENA.minY);
  ctx.clip();

  renderWorldEvents(ctx, state, time);

  // Layered rendering
  drawParticles(ctx, state.particles);
  drawXPDrops(ctx, state.xpDrops);

  drawZones(ctx, state.zones, time);
  drawPickups(ctx, state.pickups, time);
  drawProjectiles(ctx, state.projectiles, time);

  // Entities
  state.enemies.forEach(e => {
    if (!e.warpIn) { drawShip(ctx, e, false, time); return; }
    const alpha = drawWarpIn(ctx, e); // sortie d'hypervitesse
    ctx.save();
    ctx.globalAlpha = alpha;
    drawShip(ctx, e, false, time);
    ctx.restore();
  });
  drawDrones(ctx, state.drones, state);
  drawBeams(ctx, state.beams);
  ctx.restore();

  // Le joueur (toujours dans l'arène) et ses jauges ne sont pas coupés
  drawShip(ctx, state.player, true, time);
  drawPlayerGauges(ctx, state, time);

  // Floating text
  drawVisualEffects(ctx, options.damageNumbers === false ? state.effects.filter(e => e.kind !== 'damage') : state.effects, viewScale);

  ctx.restore();
  ctx.restore();
};
