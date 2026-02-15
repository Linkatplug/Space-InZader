
import { GameState, EnvEventType } from '../types';

export const renderEnvironmentalEffects = (ctx: CanvasRenderingContext2D, state: GameState, dimensions: { width: number, height: number }, time: number) => {
  state.activeEvents.forEach(event => {
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

      case EnvEventType.BLACK_HOLE:
        // Trou noir localisé
        ctx.save();
        const pulse = 1.0 + Math.sin(time / 200) * 0.1;
        const grd = ctx.createRadialGradient(event.x, event.y, 0, event.x, event.y, event.radius * pulse);
        grd.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grd.addColorStop(0.4, 'rgba(30, 27, 75, 0.8)');
        grd.addColorStop(0.7, 'rgba(139, 92, 246, 0.3)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(event.x, event.y, event.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Anneau d'accrétion
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(event.x, event.y, event.radius * 1.5, event.radius * 0.5, time / 1000, 0, Math.PI * 2);
        ctx.stroke();
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
