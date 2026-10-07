
import { Entity } from '../types';
import { ENEMIES, ShipShape } from '../data/enemies';

export const drawShip = (ctx: CanvasRenderingContext2D, entity: Entity, isPlayer: boolean, time: number) => {
  const { radius, rotation, vx, vy, defense, runtimeStats, lastDamageTime } = entity;
  const def = isPlayer ? undefined : ENEMIES[entity.subtype ?? 'basic'];
  const isBoss = entity.type === 'boss';
  const shape: ShipShape = def?.shape ?? 'fighter';
  const accent = isPlayer ? '#22d3ee' : (def?.color ?? '#ef4444');
  const isMoving = Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1;

  // Déterminer si on doit flasher en blanc (80ms pour un effet percutant et rapide)
  const flashDuration = 80;
  const isFlashing = lastDamageTime && (time - lastDamageTime < flashDuration);

  ctx.save();
  ctx.translate(entity.x, entity.y);

  // 1. Barres de Santé & Shields (On ne les dessine pas si on flash pour plus de clarté)
  if (!isPlayer && !isFlashing) {
    const barWidth = radius * (isBoss ? 2.5 : 2.0);
    const barHeight = isBoss ? 10 : 4;
    const startY = radius + (isBoss ? 30 : 15);
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
  const drawGeometry = () => drawShape(ctx, shape, radius, time);

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
    ctx.fillStyle = isPlayer ? '#1e293b' : '#0b0f1a';
    drawGeometry();
    ctx.fill();
    // Teinte de statut : brûlure (orange) / ralenti (bleu)
    if (entity.burn) { ctx.fillStyle = 'rgba(251,146,60,0.35)'; ctx.fill(); }
    else if (entity.slow) { ctx.fillStyle = 'rgba(56,189,248,0.3)'; ctx.fill(); }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Effet spécial Boss (Cœur d'énergie)
    if (isBoss) {
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      grd.addColorStop(0, accent);
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
    ctx.strokeStyle = isPlayer ? 'rgba(34, 211, 238, 0.4)' : 'rgba(165, 243, 252, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

/** Formes de coque. Pour ajouter une forme : ajouter un cas ici et dans ShipShape (data/enemies.ts). */
const drawShape = (ctx: CanvasRenderingContext2D, shape: ShipShape, r: number, time: number) => {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case 'dart':
      ctx.moveTo(r, 0);
      ctx.lineTo(-r * 0.4, -r * 0.8);
      ctx.lineTo(-r * 0.1, 0);
      ctx.lineTo(-r * 0.4, r * 0.8);
      ctx.closePath();
      break;
    case 'diamond': {
      const s = 1.0 + Math.sin(time / 60) * 0.1;
      ctx.moveTo(r * s, 0);
      ctx.lineTo(0, -r * 0.6 * s);
      ctx.lineTo(-r * s, 0);
      ctx.lineTo(0, r * 0.6 * s);
      ctx.closePath();
      break;
    }
    case 'hex':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      break;
    case 'square':
      ctx.moveTo(r, -r * 0.5);
      ctx.lineTo(r * 0.5, -r * 0.85);
      ctx.lineTo(-r * 0.85, -r * 0.85);
      ctx.lineTo(-r * 0.85, r * 0.85);
      ctx.lineTo(r * 0.5, r * 0.85);
      ctx.lineTo(r, r * 0.5);
      ctx.closePath();
      break;
    case 'star': {
      const spikes = 8;
      for (let i = 0; i < spikes * 2; i++) {
        const a = (Math.PI * i) / spikes + time / 2000;
        const rr = i % 2 === 0 ? r : r * 0.55;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      break;
    }
    case 'fighter':
    default:
      ctx.moveTo(r, 0);
      ctx.lineTo(0, -r * 0.7);
      ctx.lineTo(-r * 0.8, -r * 0.6);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.lineTo(0, r * 0.7);
      ctx.closePath();
      break;
  }
};
