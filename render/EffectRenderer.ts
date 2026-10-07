
import { GameState, XPDrop, VisualEffect, Particle } from '../types';

export const drawXPDrops = (ctx: CanvasRenderingContext2D, drops: XPDrop[]) => {
  ctx.fillStyle = '#38bdf8';
  drops.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
};

/**
 * Textes flottants (dégâts, butin, messages). Taille exprimée en pixels d'écran :
 * on compense le zoom de caméra (`viewScale`) pour rester lisible sur petit écran.
 */
export const drawVisualEffects = (ctx: CanvasRenderingContext2D, effects: VisualEffect[], viewScale = 1) => {
  const k = 1 / Math.max(0.4, viewScale);
  effects.forEach(ef => {
    ctx.save();

    // Apparition « pop » : grossit puis se stabilise
    const start = ef.maxLife ?? 1;
    const age = start - ef.life;
    const popScale = age < 0.08 ? 0.6 + (age / 0.08) * 0.7 : Math.max(1, 1.3 - (age - 0.08) * 1.5);

    ctx.globalAlpha = Math.min(1, ef.life * 2.5);
    ctx.translate(ef.x, ef.y);
    ctx.scale(popScale * k, popScale * k);

    const isCrit = ef.text.includes('CRIT');
    const isSpecial = isCrit || ef.text.includes('!') || ef.text.includes('GOD') || ef.text.includes('SYSTEM');
    const fontSize = ef.kind === 'message' ? (isSpecial ? 30 : 26) : (isCrit ? 30 : 24);

    ctx.font = `900 ${fontSize}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    // Contour noir épais pour détacher le texte de n'importe quel fond
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 6;
    ctx.strokeText(ef.text, 0, 0);

    ctx.shadowColor = isCrit ? '#ffffff' : ef.color;
    ctx.shadowBlur = isCrit ? 10 : 6;
    ctx.fillStyle = isCrit ? '#ffffff' : ef.color;
    ctx.fillText(ef.text, 0, 0);

    ctx.restore();
  });
};

