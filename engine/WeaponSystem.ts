import { GameState, Weapon, WeaponKind, WeaponBehavior, Projectile, Entity, DamageType } from '../types';
import { TECH_MULTIPLIERS } from '../constants';
import { playShotSound } from './SoundEngine';
import { damageEnemy, damagePlayer, explode, nearestEnemy, rollPacket } from './Combat';
import { emitParticles } from '../render/ParticleSystem';
import { uid } from './ids';
import { addHeat, heatThrottle, weaponHeatPerShot } from './Heat';

/**
 * Tir des armes du joueur. Chaque `behavior.kind` a sa routine.
 * Les paramètres de niveau (Tech I → III) augmentent dégâts et cadence,
 * et pour certaines armes le nombre de projectiles / drones / rebonds.
 */

export const weaponCooldown = (state: GameState, w: Weapon) => {
  const techMult = TECH_MULTIPLIERS[w.level] || 1.0;
  return 1000 / (w.fireRate * state.player.runtimeStats.fireRate * Math.sqrt(techMult));
};

const weaponDamage = (w: Weapon) => w.damage * (TECH_MULTIPLIERS[w.level] || 1.0);

/** Bonus de quantité au Tech III pour les armes multi-projectiles. */
/** Bonus de quantité au Tech III pour les armes multi-projectiles (≥3), ex. 3 → 4, 7 → 9. */
const levelCount = (w: Weapon, base: number) => base + (w.level >= 3 ? Math.floor(base / 3) : 0);

/** Comportement effectif d'une arme : base + bonus de Tech II / III. */
export const weaponBehavior = (w: Weapon): WeaponBehavior => ({
  ...w.behavior,
  ...(w.level >= 2 ? w.tech?.[2] : undefined),
  ...(w.level >= 3 ? w.tech?.[3] : undefined),
});

const makeProjectile = (state: GameState, w: Weapon, x: number, y: number, angle: number, speedMult = 1): Projectile => {
  const stats = state.player.runtimeStats;
  const b = weaponBehavior(w);
  const speed = Math.max(0, w.bulletSpeed * stats.projectileSpeedMult * speedMult);
  const packet = rollPacket(state, weaponDamage(w), w.type);
  let kind: Projectile['kind'] = 'bullet';
  if (b.homing) kind = 'missile';
  if (b.gravity) kind = 'gravity';
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    packet,
    color: w.bulletColor,
    ownerId: 'player',
    radius: b.explodeRadius ? 7 : (w.damage > 80 ? 7 : 5),
    distanceTraveled: 0,
    maxRange: w.range * stats.rangeMult,
    heatGenerated: w.heatPerShot,
    kind,
    pierce: (b.pierce ?? 0) + stats.extraPierce,
    hitIds: [],
    homing: b.homing,
    explodeRadius: b.explodeRadius,
    burn: b.burn,
    slow: b.slow,
    knockback: b.knockback,
    split: b.split,
    gravity: b.gravity,
    fireZone: b.fireZone,
  };
};

const fireProjectiles = (state: GameState, w: Weapon, aim: number) => {
  const { player } = state;
  const b = weaponBehavior(w);
  const extra = state.player.runtimeStats.extraProjectiles;
  const count = (b.count ? levelCount(w, b.count) : 1) + extra;
  const spread = b.spread ?? (count > 1 ? 0.12 * (count - 1) : 0);
  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? -spread / 2 + (spread * i) / (count - 1) : 0;
    const jitter = (Math.random() - 0.5) * (b.jitter ?? 0) * 2;
    const a = aim + offset + jitter;
    const speedVar = count > 1 && !b.homing ? 0.85 + Math.random() * 0.3 : 1;
    state.projectiles.push(makeProjectile(state, w, player.x + Math.cos(a) * player.radius, player.y + Math.sin(a) * player.radius, a, speedVar));
  }
};

/** Rayon instantané : touche tout ce qui est sur la ligne (ou le premier si pas de perforation). */
const fireBeam = (state: GameState, w: Weapon, aim: number) => {
  const { player } = state;
  const b = weaponBehavior(w);
  const range = w.range * player.runtimeStats.rangeMult;
  const sx = player.x + Math.cos(aim) * player.radius;
  const sy = player.y + Math.sin(aim) * player.radius;
  const dx = Math.cos(aim), dy = Math.sin(aim);

  const hits: { e: Entity; t: number }[] = [];
  for (const e of state.enemies) {
    if (e.dead) continue;
    const ex = e.x - sx, ey = e.y - sy;
    const t = ex * dx + ey * dy;
    if (t < 0 || t > range) continue;
    const px = ex - dx * t, py = ey - dy * t;
    const width = e.radius + 6;
    if (px * px + py * py < width * width) hits.push({ e, t });
  }
  hits.sort((a, b2) => a.t - b2.t);
  const maxHits = (b.pierce ?? 0) + 1;
  const hitList = hits.slice(0, maxHits);
  const endT = hitList.length >= maxHits && hitList.length > 0 ? hitList[hitList.length - 1].t : range;

  const isHeavy = w.damage > 60;
  state.beams.push({
    x1: sx, y1: sy, x2: sx + dx * endT, y2: sy + dy * endT,
    color: w.bulletColor, width: isHeavy ? 8 : 3,
    life: isHeavy ? 0.25 : 0.08, maxLife: isHeavy ? 0.25 : 0.08,
  });
  for (const { e } of hitList) {
    damageEnemy(state, e, rollPacket(state, weaponDamage(w), w.type), {
      direct: true, slow: b.slow, burn: b.burn, knockback: b.knockback, silent: !isHeavy && Math.random() < 0.6,
    });
    emitParticles(state, e.x, e.y, w.bulletColor, 3, 4);
  }
};

/** Arc électrique : frappe la cible la plus proche du curseur puis rebondit. */
const fireChain = (state: GameState, w: Weapon, aimX: number, aimY: number) => {
  const { player } = state;
  const b = weaponBehavior(w);
  const range = w.range * player.runtimeStats.rangeMult;
  const first = nearestEnemy(state, aimX, aimY, 300) || nearestEnemy(state, player.x, player.y, range);
  if (!first) return false;
  const pdx = first.x - player.x, pdy = first.y - player.y;
  if (pdx * pdx + pdy * pdy > range * range) return false;

  const bounces = (b.chainTargets ?? 3) + (w.level - 1) + player.runtimeStats.extraChain;
  const hit = new Set<string>();
  let fromX = player.x, fromY = player.y;
  let target: Entity | null = first;
  let dmg = weaponDamage(w);
  for (let i = 0; i <= bounces && target; i++) {
    hit.add(target.id);
    state.beams.push({ x1: fromX, y1: fromY, x2: target.x, y2: target.y, color: w.bulletColor, width: 2, life: 0.15, maxLife: 0.15, jagged: true });
    damageEnemy(state, target, rollPacket(state, dmg, w.type), { direct: true, slow: b.slow });
    fromX = target.x; fromY = target.y;
    dmg *= 0.85;
    target = nearestEnemy(state, fromX, fromY, 280, hit);
  }
  return true;
};

const firePulse = (state: GameState, w: Weapon) => {
  const { player } = state;
  const b = weaponBehavior(w);
  const radius = w.range * player.runtimeStats.rangeMult * (1 + (w.level - 1) * 0.15);
  state.zones.push({ id: uid('z'), kind: 'pulse', x: player.x, y: player.y, radius, life: 0.4, maxLife: 0.4, color: w.bulletColor });
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dx = e.x - player.x, dy = e.y - player.y;
    const reach = radius + e.radius;
    if (dx * dx + dy * dy < reach * reach) {
      damageEnemy(state, e, rollPacket(state, weaponDamage(w), w.type), { direct: true, knockback: b.knockback, slow: b.slow });
    }
  }
  state.shake = Math.max(state.shake, 6);
};

/** Frappe orbitale : marque une zone, l'explosion arrive après un délai. */
const fireStrike = (state: GameState, w: Weapon, aimX: number, aimY: number) => {
  const { player } = state;
  const b = weaponBehavior(w);
  const count = levelCount(w, b.count ?? 1);
  const range = w.range * player.runtimeStats.rangeMult;
  const used = new Set<string>();
  let fired = false;
  for (let i = 0; i < count; i++) {
    let tx: number, ty: number;
    const target = b.autoTarget
      ? nearestEnemy(state, player.x, player.y, range, used)
      : (nearestEnemy(state, aimX, aimY, 250, used) || null);
    if (target) {
      used.add(target.id);
      tx = target.x; ty = target.y;
    } else if (!b.autoTarget) {
      tx = aimX; ty = aimY;
    } else {
      continue;
    }
    const delay = 0.6 + i * 0.12;
    state.zones.push({
      id: uid('z'), kind: 'strike', x: tx, y: ty, radius: b.explodeRadius ?? 100,
      life: delay, maxLife: delay, color: w.bulletColor,
      packet: rollPacket(state, weaponDamage(w), w.type), knockback: b.knockback, burn: b.burn,
    });
    fired = true;
  }
  return fired;
};

/** Lance-flammes : nuage de petites flammes courte portée qui brûlent. */
const fireFlame = (state: GameState, w: Weapon, aim: number) => {
  const { player } = state;
  for (let i = 0; i < 3; i++) {
    const a = aim + (Math.random() - 0.5) * 0.45;
    const p = makeProjectile(state, w, player.x + Math.cos(aim) * player.radius, player.y + Math.sin(aim) * player.radius, a, 0.7 + Math.random() * 0.5);
    p.kind = 'flame';
    p.radius = 12;
    p.pierce = 99;
    p.life = 0.55;
    p.packet.amount /= 3;
    state.projectiles.push(p);
  }
};

/** Durée de vie d'une mine posée (secondes). */
export const MINE_LIFETIME = 8;

const fireMine = (state: GameState, w: Weapon) => {
  const { player } = state;
  const mb = weaponBehavior(w);
  const count = mb.count ? levelCount(w, mb.count) : 1;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = count > 1 ? 30 + Math.random() * 80 : 0;
    const p = makeProjectile(state, w, player.x - Math.cos(player.rotation) * player.radius + Math.cos(a) * d, player.y - Math.sin(player.rotation) * player.radius + Math.sin(a) * d, 0, 0);
    p.kind = 'mine';
    p.radius = 12;
    p.life = MINE_LIFETIME;
    p.armTime = 0.5;
    p.maxRange = Infinity;
    state.projectiles.push(p);
  }
};

/** Synchronise les drones avec les armes de type 'drone' (nombre selon le niveau). */
const syncDrones = (state: GameState) => {
  const wanted = new Map<string, number>();
  state.activeWeapons.forEach(w => {
    if (w.behavior.kind === 'drone') wanted.set(w.id, (weaponBehavior(w).count ?? 1) + (w.level - 1) + state.player.runtimeStats.extraDrones);
  });
  state.drones = state.drones.filter(d => (wanted.get(d.weaponId) ?? 0) > 0);
  wanted.forEach((n, weaponId) => {
    const current = state.drones.filter(d => d.weaponId === weaponId);
    for (let i = current.length; i < n; i++) {
      state.drones.push({ id: uid('z'), weaponId, angle: 0, x: state.player.x, y: state.player.y, lastFired: 0 });
    }
    while (state.drones.filter(d => d.weaponId === weaponId).length > n) {
      const idx = state.drones.findIndex(d => d.weaponId === weaponId);
      state.drones.splice(idx, 1);
    }
  });
};

const updateDrones = (state: GameState, deltaTime: number, time: number) => {
  syncDrones(state);
  const { player } = state;
  const n = state.drones.length;
  state.drones.forEach((d, i) => {
    const w = state.activeWeapons.find(aw => aw.id === d.weaponId);
    if (!w) return;
    const orbit = 90;
    const targetAngle = time / 900 + (Math.PI * 2 * i) / n;
    const tx = player.x + Math.cos(targetAngle) * orbit;
    const ty = player.y + Math.sin(targetAngle) * orbit;
    d.x += (tx - d.x) * 0.2;
    d.y += (ty - d.y) * 0.2;

    const target = nearestEnemy(state, d.x, d.y, w.range * player.runtimeStats.rangeMult);
    if (target) d.angle = Math.atan2(target.y - d.y, target.x - d.x);
    else d.angle = targetAngle + Math.PI / 2;

    // Les drones tirent seuls, sans générer de chaleur
    if (target && time - d.lastFired > weaponCooldown(state, w)) {
      d.lastFired = time;
      const p = makeProjectile(state, w, d.x, d.y, d.angle);
      p.heatGenerated = 0;
      p.radius = 4;
      state.projectiles.push(p);
    }
  });
};

/**
 * Routine de tir par type d'arme. Pour ajouter un type : ajouter une entrée ici
 * et la valeur dans WeaponKind (types.ts). Retourner `false` = pas de cible, tir annulé
 * (pas de chaleur ni de recharge consommées).
 */
type FireHandler = (state: GameState, w: Weapon, aim: number, mouseWorld: { x: number; y: number }) => boolean | void;

export const FIRE_HANDLERS: Record<WeaponKind, FireHandler> = {
  projectile: (s, w, aim) => fireProjectiles(s, w, aim),
  beam: (s, w, aim) => fireBeam(s, w, aim),
  chain: (s, w, _aim, m) => fireChain(s, w, m.x, m.y),
  pulse: (s, w) => firePulse(s, w),
  strike: (s, w, _aim, m) => fireStrike(s, w, m.x, m.y),
  flame: (s, w, aim) => fireFlame(s, w, aim),
  mine: (s, w) => fireMine(s, w),
  drone: () => false, // les drones tirent seuls (updateDrones)
};

export const updateWeapons = (
  state: GameState,
  deltaTime: number,
  time: number,
  isFiring: boolean,
  mouseWorld: { x: number; y: number }
) => {
  const { player } = state;
  updateDrones(state, deltaTime, time);

  if (!isFiring || state.isOverheated) return;

  const aim = player.rotation;
  const throttle = heatThrottle(state);
  let playedSound = false;

  for (const w of state.activeWeapons) {
    if (w.behavior.kind === 'drone') continue;
    // Bridage thermique : au-delà de 75 % de chaleur, la cadence baisse progressivement
    if (time - w.lastFired < weaponCooldown(state, w) / throttle) continue;

    let aimAngle = aim;
    if (weaponBehavior(w).autoTarget) {
      const t = nearestEnemy(state, player.x, player.y, w.range * player.runtimeStats.rangeMult);
      if (!t) continue;
      aimAngle = Math.atan2(t.y - player.y, t.x - player.x);
    }

    const fired = FIRE_HANDLERS[w.behavior.kind](state, w, aimAngle, mouseWorld) !== false;
    if (!fired) continue;

    w.lastFired = time;
    if (!playedSound) { playShotSound(w.type); playedSound = true; }
    addHeat(state, weaponHeatPerShot(state, w));
    if (state.isOverheated) break;
  }
};

/** Comportement en vol des projectiles joueur : guidage, mines, flammes. */
export const updatePlayerProjectile = (state: GameState, p: Projectile, deltaTime: number) => {
  if (p.homing) {
    const target = nearestEnemy(state, p.x, p.y, 600);
    if (target) {
      const speed = Math.hypot(p.vx, p.vy);
      const cur = Math.atan2(p.vy, p.vx);
      const want = Math.atan2(target.y - p.y, target.x - p.x);
      let diff = want - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const a = cur + Math.max(-p.homing, Math.min(p.homing, diff));
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
    }
    if (Math.random() < 0.5) emitParticles(state, p.x, p.y, '#94a3b8', 1, 0.5);
  }
  if (p.life !== undefined) {
    p.life -= deltaTime;
    if (p.armTime !== undefined) p.armTime -= deltaTime;
    if (p.life <= 0) {
      if (p.kind === 'mine') detonate(state, p);
      p.dead = true;
    }
  }
  if (p.kind === 'flame') {
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.radius += 0.6;
  }
};

/** Fin de vie explosive d'un projectile (impact ou portée max). */
export const detonate = (state: GameState, p: Projectile) => {
  if (p.explodeRadius) {
    explode(state, p.x, p.y, p.explodeRadius, p.packet, p.color, { knockback: p.knockback, burn: p.burn, slow: p.slow });
  }
  if (p.gravity) {
    state.zones.push({
      id: uid('z'), kind: 'gravity', x: p.x, y: p.y, radius: 260,
      life: 2.5, maxLife: 2.5, color: '#a855f7',
      packet: { ...p.packet, amount: p.packet.amount * 0.25, type: DamageType.EXPLOSIVE },
    });
  }
  if (p.fireZone) {
    state.zones.push({
      id: uid('z'), kind: 'fire', x: p.x, y: p.y, radius: (p.explodeRadius ?? 100) * 0.9,
      life: 4, maxLife: 4, color: '#fb923c',
      packet: { ...p.packet, amount: p.packet.amount * 0.5 },
    });
  }
  if (p.split) {
    for (let i = 0; i < p.split; i++) {
      const a = (Math.PI * 2 * i) / p.split + Math.random() * 0.3;
      state.projectiles.push({
        ...p,
        vx: Math.cos(a) * 9, vy: Math.sin(a) * 9,
        packet: { ...p.packet, amount: p.packet.amount * 0.4 },
        radius: 4, split: 0, homing: 0.12, kind: 'missile',
        explodeRadius: (p.explodeRadius ?? 60) * 0.5,
        distanceTraveled: 0, maxRange: 350, hitIds: [], pierce: 0, dead: false,
      });
    }
  }
};

/** Mise à jour des zones (explosions, feu, gravité, frappes). */
export const updateZones = (state: GameState, deltaTime: number) => {
  for (const z of state.zones) {
    z.life -= deltaTime;
    if (z.kind === 'strike' && z.life <= 0 && z.packet) {
      if (z.hazard) {
        // Danger environnemental : le joueur est touché aussi (les ennemis via l'explosion)
        const d = Math.hypot(state.player.x - z.x, state.player.y - z.y);
        if (d < z.radius + state.player.radius) damagePlayer(state, z.packet, true, z.hazard);
      }
      explode(state, z.x, z.y, z.radius, z.packet, z.color, { knockback: z.knockback, burn: z.burn, raw: !!z.hazard });
      state.shake = Math.max(state.shake, 10);
    }
    if ((z.kind === 'fire' || z.kind === 'gravity') && z.packet) {
      const r2 = z.radius * z.radius;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const dx = z.x - e.x, dy = z.y - e.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        if (z.kind === 'gravity' && e.type !== 'boss') {
          const d = Math.sqrt(d2) || 1;
          e.kx = (e.kx || 0) + (dx / d) * 0.9;
          e.ky = (e.ky || 0) + (dy / d) * 0.9;
        }
        damageEnemy(state, e, { ...z.packet, amount: z.packet.amount * deltaTime, isCrit: false }, { silent: true });
      }
      if (z.kind === 'fire' && Math.random() < 0.5) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * z.radius;
        emitParticles(state, z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, Math.random() < 0.5 ? '#fb923c' : '#facc15', 1, 1);
      }
    }
  }
  state.zones = state.zones.filter(z => z.life > 0);

  for (const b of state.beams) b.life -= deltaTime;
  state.beams = state.beams.filter(b => b.life > 0);
};
