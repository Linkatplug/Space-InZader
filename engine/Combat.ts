import { GameState, Entity, DamagePacket, DamageType } from '../types';
import { applyDamage } from './DamageEngine';
import { emitParticles } from '../render/ParticleSystem';
import { DAMAGE_COLORS } from '../constants';
import { playExplosionSound } from './SoundEngine';
import { ENEMIES } from '../data/enemies';
import { spawnEnemy } from './EnemyFactory';
import { uid } from './ids';
import { hasMechanic } from './Synergies';

/**
 * Point d'entrée unique pour tous les dégâts infligés aux ennemis
 * (projectiles, rayons, zones, compétences, événements...).
 * Gère le texte flottant, les statuts et la mort.
 */

export const createEffect = (state: GameState, x: number, y: number, text: string, color: string, kind: 'damage' | 'message' = 'message') => {
  // Limite anti-spam : au-delà, on remplace le plus ancien texte
  if (state.effects.length > 120) state.effects.shift();
  state.effects.push({
    id: uid('fx'),
    x, y, text, color, kind,
    life: 1.0,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -1.0 - Math.random() * 1.5,
  });
};

export interface HitOptions {
  silent?: boolean;      // pas de texte flottant (dégâts continus)
  knockback?: number;
  fromX?: number;        // origine du recul
  fromY?: number;
  burn?: number;         // fraction des dégâts par seconde
  slow?: number;
  direct?: boolean;      // impact direct : active les marques de résonance
}

const BURN_DURATION = 3000;
const SLOW_DURATION = 2000;

export const rollPacket = (state: GameState, amount: number, type: DamageType, penetration = 0): DamagePacket => {
  const stats = state.player.runtimeStats;
  const isCrit = Math.random() < stats.critChance;
  return {
    amount: amount * stats.damageMult * (isCrit ? stats.critMult : 1),
    type,
    penetration,
    isCrit,
  };
};

export const damageEnemy = (state: GameState, e: Entity, packet: DamagePacket, opts: HitOptions = {}) => {
  if (e.dead) return;
  let finalPacket = packet;

  // Synergies de résonance (impacts directs seulement)
  if (opts.direct && e.marks) {
    if (packet.type === DamageType.KINETIC) {
      e.marks.count = Math.min(5, e.marks.count + 1);
    } else if (packet.type === DamageType.EM && e.marks.count > 0) {
      finalPacket = { ...packet, amount: packet.amount * (1 + e.marks.count * 0.4), isSynergy: true };
      e.marks.count = 0;
      emitParticles(state, e.x, e.y, '#22d3ee', 15, 10);
      createEffect(state, e.x, e.y - 30, 'RÉSONANCE!', '#22d3ee');
    } else if (packet.type === DamageType.THERMAL && e.marks.count >= 3) {
      e.marks.count = 0;
      createEffect(state, e.x, e.y - 30, 'SURCHARGE!', '#fb923c');
      explode(state, e.x, e.y, 200, { amount: 50 * state.player.runtimeStats.damageMult, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, '#fb923c');
    }
  }

  // Exécution : bonus contre les ennemis affaiblis
  const execute = state.player.runtimeStats.executeBonus;
  if (execute > 0 && e.defense.hull < e.runtimeStats.maxHull * 0.3) {
    finalPacket = { ...finalPacket, amount: finalPacket.amount * (1 + execute) };
  }
  // Ralentissement à l'impact (passif)
  const slowChance = state.player.runtimeStats.slowOnHit;
  if (opts.direct && slowChance > 0 && Math.random() < slowChance) opts = { ...opts, slow: Math.max(opts.slow ?? 0, 0.35) };

  const hpBefore = e.defense.shield + e.defense.armor + e.defense.hull;
  applyDamage(e, finalPacket, state.time);
  const dealt = hpBefore - (e.defense.shield + e.defense.armor + e.defense.hull);
  state.damageDealt += dealt;

  // Vol de vie
  const ls = state.player.runtimeStats.lifesteal;
  if (ls > 0 && dealt > 0) {
    const p = state.player;
    p.defense.hull = Math.min(p.runtimeStats.maxHull, p.defense.hull + dealt * ls);
  }

  if (opts.direct) {
    state.hitStreak++;
    state.onHitStacks++;
    state.lastHitTime = state.time;
    // Synergie balistique : les critiques explosent
    if (finalPacket.isCrit && hasMechanic(state, 'critExplosion')) {
      explode(state, e.x, e.y, 70, { ...finalPacket, amount: finalPacket.amount * 0.35, isCrit: false }, '#f8fafc');
    }
  }

  if (!opts.silent) {
    const txt = Math.floor(finalPacket.amount).toString();
    const color = finalPacket.isCrit ? '#ffffff' : DAMAGE_COLORS[finalPacket.type];
    createEffect(state, e.x + (Math.random() - 0.5) * 20, e.y, finalPacket.isCrit ? `CRIT! ${txt}` : txt, color, 'damage');
  }

  if (opts.knockback && e.type !== 'boss') {
    const fx = opts.fromX ?? state.player.x;
    const fy = opts.fromY ?? state.player.y;
    const a = Math.atan2(e.y - fy, e.x - fx);
    const resist = e.radius > 40 ? 0.4 : 1;
    e.kx = (e.kx || 0) + Math.cos(a) * opts.knockback * resist;
    e.ky = (e.ky || 0) + Math.sin(a) * opts.knockback * resist;
  }
  if (opts.burn) {
    const dps = finalPacket.amount * opts.burn * state.player.runtimeStats.burnMult;
    // On garde la brûlure la plus forte
    if (!e.burn || e.burn.until < state.time || e.burn.dps < dps) {
      e.burn = { dps, until: state.time + BURN_DURATION, type: DamageType.THERMAL };
    } else {
      e.burn.until = state.time + BURN_DURATION;
    }
  }
  if (opts.slow) {
    e.slow = { amount: Math.max(opts.slow, e.slow && e.slow.until > state.time ? e.slow.amount : 0), until: state.time + SLOW_DURATION };
  }

  // Combo (les dégâts continus ne comptent pas)
  if (!opts.silent || opts.direct) {
    state.comboCount++;
    state.comboTimer = state.player.runtimeStats.comboWindow;
  }

  if (e.defense.hull <= 0) killEnemy(state, e);
};

export const killEnemy = (state: GameState, e: Entity) => {
  if (e.dead) return;
  e.dead = true;
  const { player } = state;
  const def = ENEMIES[e.subtype ?? 'basic'] ?? ENEMIES.basic;
  const isBoss = e.type === 'boss';

  state.totalKills++;
  state.waveKills++;
  state.score += def.score * (1 + Math.floor(state.comboCount / 25));
  emitParticles(state, e.x, e.y, isBoss ? def.color : '#f87171', isBoss ? 100 : 15, 8);
  if (isBoss) {
    state.bossKills++;
    state.bossSpawned = false;
    state.shake = Math.max(state.shake, 40);
    createEffect(state, e.x, e.y - 80, `${def.name.toUpperCase()} ÉLIMINÉ`, '#facc15');
  }

  if (player.runtimeStats.healOnKill > 0) {
    player.defense.hull = Math.min(player.runtimeStats.maxHull, player.defense.hull + player.runtimeStats.healOnKill);
  }

  for (let i = 0; i < def.drops.count; i++) {
    state.xpDrops.push({
      id: uid('xp'),
      x: e.x, y: e.y,
      amount: def.drops.xp * player.runtimeStats.xpMult,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 14,
      collected: false
    });
  }

  // Synergie explosive : réaction en chaîne
  if (hasMechanic(state, 'chainExplosion')) {
    explode(state, e.x, e.y, 90, { amount: 25 * player.runtimeStats.damageMult, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, '#facc15');
  }
  // Synergie incendiaire : la brûlure se propage
  if (e.burn && e.burn.until > state.time && hasMechanic(state, 'burnSpread')) {
    for (const o of state.enemies) {
      if (o.dead || o === e) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 180 * 180) {
        o.burn = { dps: e.burn.dps, until: state.time + 3000, type: DamageType.THERMAL };
      }
    }
    emitParticles(state, e.x, e.y, '#fb923c', 12, 6);
  }

  // Division à la mort (ex : l'élite libère un essaim)
  if (def.splitInto) {
    for (let i = 0; i < def.splitInto.count; i++) {
      state.enemies.push(spawnEnemy(state.wave, e, def.splitInto.id, 10 + Math.random() * 30));
    }
  }
};

/** Explosion de zone : dégâts à tous les ennemis dans le rayon + effet visuel. */
export const explode = (
  state: GameState, x: number, y: number, baseRadius: number, packet: DamagePacket, color: string,
  opts: HitOptions = {}
) => {
  const radius = baseRadius * state.player.runtimeStats.explosionRadiusMult;
  state.zones.push({
    id: uid('fx'), kind: 'explosion', x, y, radius,
    life: 0.35, maxLife: 0.35, color,
  });
  emitParticles(state, x, y, color, Math.min(30, 8 + radius / 8), radius / 15);
  playExplosionSound(radius);
  const r2 = radius * radius;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy < r2 + e.radius * e.radius) {
      damageEnemy(state, e, packet, { ...opts, fromX: x, fromY: y });
    }
  }
  state.shake = Math.max(state.shake, Math.min(12, radius / 15));
};

export const damagePlayer = (state: GameState, packet: DamagePacket, showText = true, source = 'inconnu') => {
  const { player } = state;
  if (player.isGodMode) return;
  if (player.invulnUntil && player.invulnUntil > state.time) return;
  if (player.runtimeStats.dodgeChance > 0 && Math.random() < player.runtimeStats.dodgeChance) {
    if (showText) createEffect(state, player.x, player.y - 40, 'ESQUIVE', '#a5f3fc');
    return;
  }
  const before = player.defense.shield + player.defense.armor + player.defense.hull;
  applyDamage(player, packet, state.time);
  const taken = before - (player.defense.shield + player.defense.armor + player.defense.hull);
  state.damageTaken += taken;
  if (taken > 0) {
    state.damageBySource[source] = (state.damageBySource[source] ?? 0) + taken;
    state.lastHitBy = source;
  }
  if (showText) createEffect(state, player.x, player.y, Math.floor(packet.amount).toString(), '#ef4444', 'damage');
};

/** Applique brûlures et expiration des ralentissements. */
export const updateStatusEffects = (state: GameState, deltaTime: number) => {
  for (const e of state.enemies) {
    if (e.dead) continue;
    if (e.burn) {
      if (e.burn.until < state.time) { e.burn = undefined; continue; }
      applyDamage(e, { amount: e.burn.dps * deltaTime, type: DamageType.THERMAL, penetration: 0, isCrit: false }, e.lastDamageTime);
      if (Math.random() < 0.15) emitParticles(state, e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#fb923c', 1, 1.5);
      if (e.defense.hull <= 0) killEnemy(state, e);
    }
    if (e.slow && e.slow.until < state.time) e.slow = undefined;
  }
};

export const nearestEnemy = (state: GameState, x: number, y: number, maxDist = Infinity, exclude?: Set<string>): Entity | null => {
  let best: Entity | null = null;
  let bestD = maxDist * maxDist;
  for (const e of state.enemies) {
    if (e.dead || (exclude && exclude.has(e.id))) continue;
    const dx = e.x - x, dy = e.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
};
