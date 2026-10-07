import { Entity, GameState } from '../types';
import { ENEMIES, EnemyDef, AIBehavior } from '../data/enemies';

/**
 * Pilotage des ennemis. Chaque comportement renvoie la vitesse voulue (vx, vy).
 * Pour ajouter un comportement : ajouter une entrée dans AI_BEHAVIORS
 * et l'ajouter au type AIBehavior (data/enemies.ts).
 */
type AIContext = { e: Entity; def: EnemyDef; player: Entity; dist: number; angle: number; time: number };
type AIFn = (ctx: AIContext) => { vx: number; vy: number };

const toward = (angle: number, speed: number) => ({ vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });

export const AI_BEHAVIORS: Record<AIBehavior, AIFn> = {
  // Poursuite directe
  chase: ({ e, angle }) => toward(angle, e.baseStats.speed),

  // Maintien de distance + orbite latérale
  kite: ({ e, def, dist, angle }) => {
    const [min, max] = def.kiteRange ?? [400, 600];
    if (dist > max) return toward(angle, e.baseStats.speed);
    if (dist < min) return toward(angle + Math.PI, e.baseStats.speed);
    // Sens d'orbite stable par ennemi (dérivé de l'id)
    const dir = e.id.charCodeAt(e.id.length - 1) % 2 === 0 ? 1 : -1;
    return toward(angle + dir * Math.PI / 2, e.baseStats.speed * 0.8);
  },

  // Charge avec accélération en approche finale
  charge: ({ e, dist, angle }) => toward(angle, e.baseStats.speed * (dist < 300 ? 1.5 : 1.0)),

  // Approche en zigzag
  weave: ({ e, angle, time }) => {
    const phase = (e.id.charCodeAt(2) || 0) * 0.37;
    return toward(angle + Math.sin(time / 300 + phase) * 0.9, e.baseStats.speed);
  },

  // Quasi immobile, se rapproche lentement s'il est loin
  turret: ({ e, dist, angle }) => (dist > 700 ? toward(angle, e.baseStats.speed) : { vx: 0, vy: 0 }),
};

export const updateEnemyAI = (e: Entity, player: Entity, state: GameState, _deltaTime: number, time: number) => {
  const def = ENEMIES[e.subtype ?? 'basic'] ?? ENEMIES.basic;
  const dx = player.x - e.x, dy = player.y - e.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  e.rotation = angle;
  const v = AI_BEHAVIORS[def.ai]({ e, def, player, dist, angle, time });
  e.vx = v.vx;
  e.vy = v.vy;

  // Ralentissement (statut)
  if (e.slow && e.slow.until > state.time) {
    e.vx *= 1 - e.slow.amount;
    e.vy *= 1 - e.slow.amount;
  }

  // Forces externes (recul, gravité), amorties
  e.kx = (e.kx || 0) * 0.88;
  e.ky = (e.ky || 0) * 0.88;

  e.x += e.vx + e.kx;
  e.y += e.vy + e.ky;
};
