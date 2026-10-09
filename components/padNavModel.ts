/**
 * Navigation spatiale à la manette : logique pure (testée dans tests/padnav.test.ts).
 * Choisit, parmi des rectangles à l'écran, l'élément à focaliser en appuyant sur une direction.
 */
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Box { left: number; top: number; width: number; height: number }

const center = (b: Box) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });

/** Poids de l'écart perpendiculaire : on préfère l'élément bien aligné à un élément plus proche mais décalé. */
const PERP_WEIGHT = 2;

/** Indice de l'élément à focaliser dans la direction `dir` depuis `from`, ou -1 s'il n'y en a pas. */
export const pickNext = (boxes: readonly Box[], from: number, dir: Dir): number => {
  if (from < 0 || from >= boxes.length) return boxes.length ? 0 : -1;
  const c = center(boxes[from]);
  let best = -1;
  let bestScore = Infinity;
  boxes.forEach((b, i) => {
    if (i === from) return;
    const p = center(b);
    const dx = p.x - c.x, dy = p.y - c.y;
    const along = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy;
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 1) return; // pas dans la direction demandée
    const score = along + across * PERP_WEIGHT;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
};

/** Répétition automatique d'une direction maintenue : première répétition après `delay` ms, puis toutes les `every` ms. */
export const shouldRepeat = (heldMs: number, sinceLastMs: number, delay = 380, every = 130) =>
  heldMs >= delay && sinceLastMs >= every;
