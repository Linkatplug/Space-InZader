
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

export const drawVisualEffects = (ctx: CanvasRenderingContext2D, effects: VisualEffect[]) => {
  effects.forEach(ef => {
    ctx.save();
    
    // Animation de "Pop" : Le texte apparaît gros puis se stabilise
    const age = 1.2 - ef.life; // ef.life part de 1.2 vers 0
    const popScale = age < 0.1 ? 0.5 + (age / 0.1) * 1.0 : Math.max(1, 1.5 - (age - 0.1) * 2);
    
    ctx.globalAlpha = Math.min(1.0, ef.life * 2);
    ctx.translate(ef.x, ef.y);
    ctx.scale(popScale, popScale);
    
    const isSpecial = ef.text.includes('!') || ef.text.includes('GOD') || ef.text.includes('SYSTEM') || ef.text.includes('CRIT');
    const fontSize = isSpecial ? 26 : 18;
    
    ctx.font = `900 ${fontSize}px Orbitron`;
    ctx.textAlign = 'center';
    
    // Ombre portée profonde pour détacher du fond
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Outline pour lisibilité maximale
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(ef.text, 0, 0);
    
    // Texte principal avec un léger gradient ou couleur pure
    ctx.fillStyle = ef.color;
    ctx.fillText(ef.text, 0, 0);
    
    // Si c'est un crit, on rajoute un petit éclat blanc interne
    if (ef.text.includes('CRIT')) {
        ctx.fillStyle = 'white';
        ctx.font = `900 ${fontSize * 0.8}px Orbitron`;
        ctx.fillText(ef.text, 0, 0);
    }
    
    ctx.restore();
  });
};
