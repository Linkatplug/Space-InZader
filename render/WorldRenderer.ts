
import { VIEW_SCALE, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export const drawHexGrid = (ctx: CanvasRenderingContext2D, camera: { x: number, y: number }, dimensions: { width: number, height: number }) => {
  const hexSize = 100;
  const hexHeight = hexSize * 2;
  const hexWidth = Math.sqrt(3) * hexSize;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;
  
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  const startX = Math.floor(camera.x / horizDist) - 1;
  const endX = startX + Math.ceil((dimensions.width / VIEW_SCALE) / horizDist) + 2;
  const startY = Math.floor(camera.y / vertDist) - 1;
  const endY = startY + Math.ceil((dimensions.height / VIEW_SCALE) / vertDist) + 2;

  for (let r = startY; r <= endY; r++) {
    for (let c = startX; c <= endX; c++) {
      const x = c * horizDist + (r % 2 === 1 ? horizDist / 2 : 0);
      const y = r * vertDist;
      
      // On vérifie si on est dans les limites du monde pour dessiner la grille
      if (x < -hexSize || x > WORLD_WIDTH + hexSize || y < -hexSize || y > WORLD_HEIGHT + hexSize) continue;

      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI / 3) * i - (Math.PI / 6);
        const px = x + hexSize * Math.cos(angle);
        const py = y + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
};

export const drawWorldBounds = (ctx: CanvasRenderingContext2D, time: number) => {
  const glow = 5 + Math.sin(time / 200) * 3;
  
  ctx.save();
  
  // 1. Ombre portée / Glow externe
  ctx.shadowBlur = glow * 2;
  ctx.shadowColor = '#22d3ee';
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 4;
  
  // 2. Tracé du rectangle principal
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  
  // 3. Ligne interne plus fine
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.lineWidth = 20;
  ctx.strokeRect(-10, -10, WORLD_WIDTH + 20, WORLD_HEIGHT + 20);

  // 4. Hazard Stripes dans les coins
  const stripeSize = 200;
  const drawCornerStripes = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < stripeSize; i += 20) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 10, 0);
      ctx.lineTo(0, i + 10);
      ctx.lineTo(0, i);
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.fill();
    ctx.restore();
  };

  drawCornerStripes(0, 0, 0);
  drawCornerStripes(WORLD_WIDTH, 0, Math.PI / 2);
  drawCornerStripes(WORLD_WIDTH, WORLD_HEIGHT, Math.PI);
  drawCornerStripes(0, WORLD_HEIGHT, -Math.PI / 2);

  // 5. Texte d'avertissement aux bords
  ctx.font = 'bold 40px Orbitron';
  ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
  ctx.textAlign = 'center';
  
  // Top
  ctx.fillText("WARNING - BOUNDARY REACHED - SECTOR ALPHA", WORLD_WIDTH / 2, -40);
  // Bottom
  ctx.fillText("WARNING - BOUNDARY REACHED - SECTOR ALPHA", WORLD_WIDTH / 2, WORLD_HEIGHT + 80);
  
  ctx.restore();
};

export const clearScreen = (ctx: CanvasRenderingContext2D, dimensions: { width: number, height: number }) => {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);
};
