import { GameState, Entity, Pickup, PickupKind } from '../types';
import { PICKUPS, DROP_CHANCE, HEAVY_ENEMIES, WORMHOLE_CHANCE, EARLY_WAVE_FACTOR, PICKUP_LIFETIME } from '../data/pickups';
import { createEffect } from './Combat';
import { emitParticles } from '../render/ParticleSystem';
import { playCollectXPSound } from './SoundEngine';
import { uid } from './ids';

/**
 * Butin : apparition à la mort des ennemis, aimantation, ramassage et effets.
 */

const PICKUP_RADIUS = 18;

export const spawnPickup = (state: GameState, kind: PickupKind, x: number, y: number) => {
  state.pickups.push({
    id: uid('pk'), kind, x, y,
    vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
    life: PICKUP_LIFETIME,
  });
};

const pickHealKind = (rand: number): PickupKind => {
  const heals = Object.values(PICKUPS).filter(p => p.weight > 0);
  const total = heals.reduce((a, p) => a + p.weight, 0);
  let r = rand * total;
  for (const p of heals) { r -= p.weight; if (r < 0) return p.kind; }
  return heals[heals.length - 1].kind;
};

/** Tirage du butin à la mort d'un ennemi. */
export const rollEnemyLoot = (state: GameState, e: Entity) => {
  const mult = state.player.runtimeStats.pickupChance * (state.wave <= 1 ? EARLY_WAVE_FACTOR : 1);
  const isBoss = e.type === 'boss';
  const base = isBoss ? DROP_CHANCE.boss : HEAVY_ENEMIES.has(e.subtype ?? '') ? DROP_CHANCE.heavy : DROP_CHANCE.normal;
  if (isBoss) {
    // Un boss lâche un soin de chaque type + un trou de ver
    (['shield', 'hull', 'armor', 'wormhole'] as PickupKind[]).forEach(k => spawnPickup(state, k, e.x, e.y));
    return;
  }
  if (Math.random() < base * mult) spawnPickup(state, pickHealKind(Math.random()), e.x, e.y);
  if (Math.random() < WORMHOLE_CHANCE * mult) spawnPickup(state, 'wormhole', e.x, e.y);
};

/** Effet au ramassage. Pour ajouter un type : une entrée ici. */
export const PICKUP_EFFECTS: Record<PickupKind, (s: GameState, p: Pickup) => void> = {
  shield: s => {
    const pl = s.player;
    pl.defense.shield = Math.min(pl.runtimeStats.maxShield, pl.defense.shield + pl.runtimeStats.maxShield * (PICKUPS.shield.amount ?? 0));
  },
  hull: s => {
    const pl = s.player;
    pl.defense.hull = Math.min(pl.runtimeStats.maxHull, pl.defense.hull + pl.runtimeStats.maxHull * (PICKUPS.hull.amount ?? 0));
  },
  armor: s => {
    const pl = s.player;
    pl.defense.armor = Math.min(pl.runtimeStats.maxArmor, pl.defense.armor + pl.runtimeStats.maxArmor * (PICKUPS.armor.amount ?? 0));
  },
  wormhole: s => {
    // Toute l'XP de la carte est aspirée vers le vaisseau
    s.xpDrops.forEach(d => { d.vortex = true; });
    s.zones.push({ id: uid('z'), kind: 'wormhole', x: s.player.x, y: s.player.y, radius: 160, life: 1.6, maxLife: 1.6, color: PICKUPS.wormhole.color });
    s.shake = Math.max(s.shake, 8);
  },
};

export const updatePickups = (state: GameState, deltaTime: number) => {
  const { player } = state;
  const magnet = player.runtimeStats.magnetRange;
  for (const p of state.pickups) {
    p.life -= deltaTime;
    const dx = player.x - p.x, dy = player.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < magnet) {
      p.vx += (dx / dist) * 1.2;
      p.vy += (dy / dist) * 1.2;
    }
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.92; p.vy *= 0.92;

    if (dist < player.radius + PICKUP_RADIUS) {
      const def = PICKUPS[p.kind];
      PICKUP_EFFECTS[p.kind](state, p);
      createEffect(state, player.x, player.y - 50, def.name.toUpperCase(), def.color);
      emitParticles(state, p.x, p.y, def.color, 16, 5);
      playCollectXPSound();
      p.life = 0;
    }
  }
  state.pickups = state.pickups.filter(p => p.life > 0);

  // XP aspirée par un trou de ver : file vers le vaisseau quelle que soit la distance
  for (const d of state.xpDrops) {
    if (!d.vortex) continue;
    const dx = player.x - d.x, dy = player.y - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = Math.min(40, 12 + dist / 30);
    d.vx = (dx / dist) * speed;
    d.vy = (dy / dist) * speed;
  }
};
