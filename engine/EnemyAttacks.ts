import { Entity, GameState, Projectile } from '../types';
import { ENEMIES, EnemyAttack, AttackPatternId } from '../data/enemies';
import { spawnEnemy } from './EnemyFactory';

/**
 * Tirs ennemis. Chaque attaque d'un ennemi (data/enemies.ts → attacks) a son propre minuteur.
 * Pour ajouter un motif : ajouter une entrée dans ATTACK_PATTERNS et dans AttackPatternId.
 */
type PatternFn = (state: GameState, e: Entity, atk: EnemyAttack, angleToPlayer: number) => void;

const shoot = (state: GameState, e: Entity, atk: EnemyAttack, angle: number) => {
  const p: Projectile = {
    x: e.x + Math.cos(angle) * e.radius * 0.8,
    y: e.y + Math.sin(angle) * e.radius * 0.8,
    vx: Math.cos(angle) * atk.speed,
    vy: Math.sin(angle) * atk.speed,
    packet: { amount: atk.damage, type: atk.type, penetration: atk.penetration ?? 0, isCrit: false },
    color: atk.color,
    ownerId: e.id,
    radius: atk.radius ?? 6,
    distanceTraveled: 0,
    maxRange: Math.max(atk.range * 1.5, 1200),
    heatGenerated: 0,
    source: e.subtype,
  };
  state.projectiles.push(p);
};

export const ATTACK_PATTERNS: Record<AttackPatternId, PatternFn> = {
  aimed: (state, e, atk, a) => shoot(state, e, atk, a),

  spread: (state, e, atk, a) => {
    const n = atk.count ?? 3;
    const arc = atk.arc ?? 0.5;
    for (let i = 0; i < n; i++) shoot(state, e, atk, a - arc / 2 + (n > 1 ? (arc * i) / (n - 1) : 0));
  },

  radial: (state, e, atk, a) => {
    const n = atk.count ?? 8;
    for (let i = 0; i < n; i++) shoot(state, e, atk, a + (Math.PI * 2 * i) / n);
  },

  summon: (state, e, atk) => {
    if (!atk.summonId) return;
    // Plafond de population pour éviter l'emballement
    if (state.enemies.length > 60) return;
    for (let i = 0; i < (atk.count ?? 2); i++) {
      const minion = spawnEnemy(state.wave, e, atk.summonId, e.radius + 30);
      state.enemies.push(minion);
    }
  },
};

export const updateEnemyAttacks = (state: GameState, e: Entity, time: number) => {
  const def = ENEMIES[e.subtype ?? 'basic'];
  if (!def?.attacks) return;
  const { player } = state;
  const dx = player.x - e.x, dy = player.y - e.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  if (!e.attackTimers) e.attackTimers = def.attacks.map(() => time - Math.random() * 1000);

  def.attacks.forEach((atk, i) => {
    if (dist > atk.range) return;
    if (time - e.attackTimers![i] < atk.cooldown) return;
    e.attackTimers![i] = time;
    ATTACK_PATTERNS[atk.pattern](state, e, atk, angle);
  });
};
