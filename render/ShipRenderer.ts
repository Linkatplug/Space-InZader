
import { Entity } from '../types';

export const drawShip = (ctx: CanvasRenderingContext2D, entity: Entity, isPlayer: boolean, time: number) => {
  const { radius, rotation, vx, vy, defense, runtimeStats, subtype, lastDamageTime } = entity;
  const isMoving = Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1;

  // Déterminer si on doit flasher en blanc (80ms pour un effet percutant et rapide)
  const flashDuration = 80;
  const isFlashing = lastDamageTime && (time - lastDamageTime < flashDuration);

  ctx.save();
  ctx.translate(entity.x, entity.y);

  // 1. Barres de Santé & Shields (On ne les dessine pas si on flash pour plus de clarté)
  if (!isPlayer && !isFlashing) {
    const barWidth = radius * (subtype === 'boss' ? 2.5 : 2.0);
    const barHeight = subtype === 'boss' ? 10 : 4;
    const startY = radius + (subtype === 'boss' ? 30 : 15);
    const drawHealthBar = (val: number, max: number, color: string, offset: number) => {
      if (max <= 0) return;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-barWidth/2, startY + offset, barWidth, barHeight);
      ctx.fillStyle = color;
      const w = Math.max(0, (val / max) * barWidth);
      ctx.fillRect(-barWidth/2, startY + offset, w, barHeight);
    };
    drawHealthBar(defense.hull, runtimeStats.maxHull, '#ef4444', 8);
    drawHealthBar(defense.armor, runtimeStats.maxArmor, '#f97316', 4);
    if (runtimeStats.maxShield > 0) drawHealthBar(defense.shield, runtimeStats.maxShield, '#22d3ee', 0);
  }

  // 2. Propulsion (Engine Trails)
  if (isMoving && !isFlashing) {
    ctx.save();
    ctx.rotate(rotation);
    const flicker = Math.random() * 0.5 + 0.5;
    const grd = ctx.createLinearGradient(-radius, 0, -radius - 30, 0);
    grd.addColorStop(0, isPlayer ? 'rgba(34, 211, 238, 0.8)' : 'rgba(239, 68, 68, 0.8)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -radius * 0.3);
    ctx.lineTo(-radius * 0.8 - (20 * flicker), 0);
    ctx.lineTo(-radius * 0.8, radius * 0.3);
    ctx.fill();
    ctx.restore();
  }

  ctx.rotate(rotation);
  
  // 3. Dessin de la géométrie du vaisseau
  const drawGeometry = () => {
    if (subtype === 'boss') {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
    } else if (subtype === 'sniper') {
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(-radius * 0.4, -radius * 0.8);
      ctx.lineTo(-radius * 0.4, radius * 0.8);
      ctx.closePath();
    } else if (subtype === 'kamikaze') {
      const s = 1.0 + Math.sin(time / 60) * 0.1;
      ctx.beginPath();
      ctx.moveTo(radius * s, 0);
      ctx.lineTo(0, -radius * 0.6 * s);
      ctx.lineTo(-radius * s, 0);
      ctx.lineTo(0, radius * 0.6 * s);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(0, -radius * 0.7);
      ctx.lineTo(-radius * 0.8, -radius * 0.6);
      ctx.lineTo(-radius * 0.8, radius * 0.6);
      ctx.lineTo(0, radius * 0.7);
      ctx.closePath();
    }
  };

  // Rendu principal ou Flash
  if (isFlashing) {
    ctx.fillStyle = 'white';
    drawGeometry();
    ctx.fill();
    // On ajoute un petit glow blanc pour l'impact
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'white';
    ctx.stroke();
  } else {
    const primaryColor = isPlayer ? '#1e293b' : '#450a0a';
    ctx.fillStyle = primaryColor;
    drawGeometry();
    ctx.fill();
    ctx.strokeStyle = isPlayer ? '#22d3ee' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Effet spécial Boss (Cœur d'énergie)
    if (subtype === 'boss') {
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      grd.addColorStop(0, '#facc15');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.globalAlpha = 0.4 + Math.sin(time/200)*0.2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  ctx.restore();

  // 4. Boucliers Globaux (Si pas en train de flasher pour éviter le bruit visuel)
  if (defense.shield > 0 && !isFlashing) {
    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.strokeStyle = isPlayer ? 'rgba(34, 211, 238, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};
