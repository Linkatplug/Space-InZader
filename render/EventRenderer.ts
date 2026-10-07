
import { GameState, EnvEventType } from '../types';

export const renderEnvironmentalEffects = (ctx: CanvasRenderingContext2D, state: GameState, dimensions: { width: number, height: number }, time: number) => {
  state.activeEvents.forEach(event => {
    if (!event.started) return;
    switch (event.type) {
      case EnvEventType.SOLAR_STORM:
        // Teinte orange pulsante sur tout l'écran
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const alpha = 0.1 + Math.sin(time / 500) * 0.05;
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.restore();
        break;

      case EnvEventType.MAGNETIC_STORM:
        // Glitch visuel aléatoire
        if (Math.random() < 0.1) {
          ctx.save();
          ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
          const h = Math.random() * 50;
          ctx.fillRect(0, Math.random() * dimensions.height, dimensions.width, h);
          ctx.restore();
        }
        break;
    }
  });
};

/** Effets d'événement placés dans le monde (à dessiner APRÈS la transformation de caméra). */
export const renderWorldEvents = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  state.activeEvents.forEach(event => {
    if (!event.started || event.type !== EnvEventType.BLACK_HOLE) return;
    const { x, y } = event;
    const r = event.radius;
    const pulse = 1 + Math.sin(time / 200) * 0.06;
    ctx.save();

    // Rayon d'attraction (zone d'influence) : cercle pointillé discret
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.lineDashOffset = -time / 40;
    ctx.beginPath(); ctx.arc(x, y, 1000, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Halo violet
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6 * pulse);
    grd.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grd.addColorStop(0.2, 'rgba(10, 5, 30, 0.98)');
    grd.addColorStop(0.45, 'rgba(76, 29, 149, 0.55)');
    grd.addColorStop(0.75, 'rgba(168, 85, 247, 0.18)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, r * 1.6 * pulse, 0, Math.PI * 2); ctx.fill();

    // Disque d'accrétion qui tourne
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 1 ? 'rgba(236, 72, 153, 0.55)' : 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 3 - i * 0.6;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (0.75 + i * 0.25), r * (0.25 + i * 0.08), time / (900 + i * 300) + i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Horizon : cœur noir net + anneau lumineux (zone mortelle)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e879f9';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 25;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 62, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  });
};
