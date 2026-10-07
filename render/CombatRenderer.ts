import { GameState, Projectile, Zone, Beam, Drone, Pickup } from '../types';
import { PICKUPS } from '../data/pickups';

/** Rendu des éléments de combat : projectiles, zones, rayons, drones. */

export const drawZones = (ctx: CanvasRenderingContext2D, zones: Zone[], time: number) => {
  for (const z of zones) {
    const t = 1 - z.life / z.maxLife; // 0 → 1
    ctx.save();
    switch (z.kind) {
      case 'explosion': {
        const r = z.radius * (0.4 + 0.6 * t);
        ctx.globalAlpha = 1 - t;
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, z.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(z.x, z.y, r, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'pulse': {
        if (z.emphasis) {
          // Compétence : flash plein au départ + anneau épais lumineux
          const flash = Math.max(0, 1 - t * 2.5);
          if (flash > 0) {
            const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius * Math.max(0.2, t));
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.4, z.color);
            g.addColorStop(1, 'transparent');
            ctx.globalAlpha = flash * 0.55;
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * Math.max(0.2, t), 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = z.color;
          ctx.shadowColor = z.color;
          ctx.shadowBlur = 20;
          ctx.lineWidth = 14 * (1 - t) + 3;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * t, 0, Math.PI * 2); ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * t, 0, Math.PI * 2); ctx.stroke();
          break;
        }
        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 6 * (1 - t) + 1;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * t, 0, Math.PI * 2); ctx.stroke();
        break;
      }
      case 'strike': {
        // Cible au sol qui se resserre jusqu'à l'impact
        ctx.strokeStyle = z.color;
        ctx.globalAlpha = 0.4 + 0.5 * t;
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * (1 - t), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.15 + 0.2 * t;
        ctx.fillStyle = z.color;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'fire': {
        ctx.globalAlpha = Math.min(1, z.life) * (0.25 + Math.sin(time / 90) * 0.05);
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
        g.addColorStop(0, '#facc15');
        g.addColorStop(0.5, z.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'wormhole': {
        // Vortex violet qui se résorbe
        const t2 = z.life / z.maxLife;
        ctx.globalAlpha = t2;
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = i % 2 ? '#c084fc' : z.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.radius * (0.3 + i * 0.2) * (1.2 - t2 * 0.4), time / 120 + i * 1.6, time / 120 + i * 1.6 + Math.PI * 1.1);
          ctx.stroke();
        }
        break;
      }
      case 'gravity': {
        ctx.globalAlpha = Math.min(1, z.life * 2) * 0.7;
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
        g.addColorStop(0, '#000000');
        g.addColorStop(0.25, '#3b0764');
        g.addColorStop(0.6, 'rgba(168,85,247,0.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.radius * (0.3 + i * 0.2), time / 200 + i, time / 200 + i + Math.PI * 0.8);
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }
};

export const drawBeams = (ctx: CanvasRenderingContext2D, beams: Beam[]) => {
  ctx.save();
  ctx.lineCap = 'round';
  for (const b of beams) {
    const a = b.life / b.maxLife;
    ctx.globalAlpha = a;
    ctx.strokeStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = b.width * (0.5 + a * 0.5);
    ctx.beginPath();
    if (b.jagged) {
      // Arc électrique : segments brisés
      const segs = 7;
      ctx.moveTo(b.x1, b.y1);
      const dx = b.x2 - b.x1, dy = b.y2 - b.y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const off = (Math.random() - 0.5) * 30;
        ctx.lineTo(b.x1 + dx * t + nx * off, b.y1 + dy * t + ny * off);
      }
      ctx.lineTo(b.x2, b.y2);
    } else {
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
    }
    ctx.stroke();
    // Cœur blanc
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, b.width * 0.3);
    ctx.stroke();
  }
  ctx.restore();
};

export const drawProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Projectile[], time: number) => {
  for (const p of projectiles) {
    ctx.save();
    switch (p.kind) {
      case 'missile': {
        const a = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(a);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.radius * 2, 0);
        ctx.lineTo(-p.radius, -p.radius);
        ctx.lineTo(-p.radius, p.radius);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fb923c';
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.beginPath(); ctx.arc(-p.radius * 1.5, 0, p.radius * 0.7, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'mine': {
        const armed = (p.armTime ?? 0) <= 0;
        const blink = armed && Math.floor(time / 250) % 2 === 0;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = blink ? '#ef4444' : p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2); ctx.fill();
        if (armed) {
          ctx.globalAlpha = 0.15;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + (p.explodeRadius ?? 80) * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      }
      case 'flame': {
        const a = Math.max(0, (p.life ?? 0) / 0.55);
        ctx.globalAlpha = a * 0.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        g.addColorStop(0, '#fef08a');
        g.addColorStop(0.5, p.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'meteor': {
        const a = Math.atan2(p.vy, p.vx);
        // Traînée de feu
        const g = ctx.createLinearGradient(p.x, p.y, p.x - Math.cos(a) * p.radius * 4, p.y - Math.sin(a) * p.radius * 4);
        g.addColorStop(0, 'rgba(251,146,60,0.6)');
        g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g;
        ctx.lineWidth = p.radius * 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.cos(a) * p.radius * 4, p.y - Math.sin(a) * p.radius * 4); ctx.stroke();
        // Rocher irrégulier
        ctx.translate(p.x, p.y);
        ctx.rotate(p.distanceTraveled / 80);
        ctx.fillStyle = '#44403c';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8;
          const rr = p.radius * (0.8 + ((i * 37) % 10) / 40);
          if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr); else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Fissures lumineuses quand le météore est endommagé
        if (p.hp !== undefined && p.maxHp && p.hp < p.maxHp) {
          const dmg = 1 - p.hp / p.maxHp;
          ctx.strokeStyle = `rgba(251, 146, 60, ${0.4 + dmg * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-p.radius * 0.5, -p.radius * 0.2); ctx.lineTo(0, 0); ctx.lineTo(p.radius * 0.4, -p.radius * 0.5);
          if (dmg > 0.5) { ctx.moveTo(0, 0); ctx.lineTo(p.radius * 0.1, p.radius * 0.6); }
          ctx.stroke();
        }
        break;
      }
      case 'gravity': {
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        break;
      }
      default: {
        // Balle avec traînée
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 12) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = p.radius * 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
};

export const drawDrones = (ctx: CanvasRenderingContext2D, drones: Drone[], state: GameState) => {
  for (const d of drones) {
    const w = state.activeWeapons.find(aw => aw.id === d.weaponId);
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.angle);
    ctx.fillStyle = '#0b0f1a';
    ctx.strokeStyle = w?.bulletColor ?? '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
};

/**
 * Jauges collées au vaisseau : arc de bouclier (haut) et de chaleur (bas),
 * pour lire l'essentiel sans quitter l'action des yeux.
 */
export const drawPlayerGauges = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  const p = state.player;
  const r = p.radius + 18;
  const span = Math.PI * 0.7; // ouverture de chaque arc
  const arc = (center: number, frac: number, color: string, alpha: number) => {
    ctx.globalAlpha = 0.25 * alpha;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, center - span / 2, center + span / 2); ctx.stroke();
    if (frac <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, center + span / 2 - span * Math.min(1, frac), center + span / 2); ctx.stroke();
  };
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const maxShield = p.runtimeStats.maxShield;
  if (maxShield > 0) arc(-Math.PI / 2, p.defense.shield / maxShield, '#22d3ee', 0.85);
  const heat = state.maxHeat > 0 ? state.heat / state.maxHeat : 0;
  if (heat > 0.02 || state.isOverheated) {
    const blink = state.isOverheated ? 0.5 + 0.5 * Math.sin(time / 80) : 1;
    const color = state.isOverheated ? '#ef4444' : heat > 0.8 ? '#f97316' : '#fbbf24';
    arc(Math.PI / 2, heat, color, 0.85 * blink);
  }
  ctx.restore();
};

/** Butin au sol : pastille colorée pulsante avec son icône ; clignote avant de disparaître. */
export const drawPickups = (ctx: CanvasRenderingContext2D, pickups: Pickup[], time: number) => {
  for (const p of pickups) {
    if (p.life < 5 && Math.floor(time / 150) % 2 === 0) continue;
    const def = PICKUPS[p.kind];
    const pulse = 1 + Math.sin(time / 180 + p.x) * 0.12;
    const r = (p.kind === 'wormhole' ? 16 : 13) * pulse;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#0b0f1a';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (p.kind === 'wormhole') {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
      // Losange (capsule)
      ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (p.kind === 'wormhole') {
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, time / 100, time / 100 + Math.PI * 1.3); ctx.stroke();
    } else {
      ctx.fillStyle = def.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, 0, 1);
    }
    ctx.restore();
  }
};
