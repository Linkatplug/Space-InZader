import { GameState, DamageType, Entity } from '../types';
import { emitParticles } from '../render/ParticleSystem';
import { playCollectXPSound } from './SoundEngine';
import { QuadTree } from './QuadTree';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { damageEnemy, damagePlayer, killEnemy } from './Combat';
import { detonate } from './WeaponSystem';
import { ENEMIES } from '../data/enemies';

export const checkCollisions = (state: GameState) => {
  const { player, enemies, projectiles, xpDrops } = state;

  const enemyTree = new QuadTree<Entity>({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    w: WORLD_WIDTH,
    h: WORLD_HEIGHT
  }, 10);

  enemies.forEach(e => {
    if (!e.dead) enemyTree.insert(e);
  });

  projectiles.forEach(p => {
    if (p.dead) return;

    if (p.ownerId === 'player') {
      // Mines : inactives pendant l'armement
      if (p.kind === 'mine' && (p.armTime ?? 0) > 0) return;

      // Les mines se déclenchent par proximité (la moitié de leur rayon d'explosion)
      const reach = p.kind === 'mine' ? p.radius + (p.explodeRadius ?? 80) * 0.5 : p.radius;
      const candidates = enemyTree.query({ x: p.x, y: p.y, w: reach + 120, h: reach + 120 });

      for (const e of candidates) {
        if (e.dead || p.dead) continue;
        if (p.hitIds && p.hitIds.includes(e.id)) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const radiusSum = reach + e.radius;
        if (dx * dx + dy * dy >= radiusSum * radiusSum) continue;

        if (p.kind === 'mine' || (p.explodeRadius && !p.pierce)) {
          // Les explosifs détonent au contact : l'explosion inflige les dégâts
          detonate(state, p);
          p.dead = true;
          break;
        }

        damageEnemy(state, e, p.packet, {
          direct: true,
          knockback: p.knockback,
          fromX: p.x - p.vx * 3, fromY: p.y - p.vy * 3,
          burn: p.burn,
          slow: p.slow,
          silent: p.kind === 'flame' && Math.random() < 0.7,
        });
        if (p.kind !== 'flame') emitParticles(state, p.x, p.y, p.color, 4, 4);

        state.heat = Math.max(0, state.heat - p.heatGenerated * 0.3);

        p.hitIds?.push(e.id);
        if ((p.pierce ?? 0) <= 0) {
          if (p.explodeRadius || p.gravity) detonate(state, p);
          p.dead = true;
        } else {
          p.pierce = (p.pierce ?? 0) - 1;
        }
      }
    } else if (p.ownerId === 'env') {
      // Danger environnemental : touche le joueur ET les ennemis
      const dx = p.x - player.x, dy = p.y - player.y;
      const rs = p.radius + player.radius;
      if (dx * dx + dy * dy < rs * rs) {
        damagePlayer(state, p.packet, true, p.source);
        state.shake = Math.max(state.shake, 20);
        emitParticles(state, p.x, p.y, p.color, 20, 8);
        p.dead = true;
        return;
      }
      for (const e of enemyTree.query({ x: p.x, y: p.y, w: p.radius + 120, h: p.radius + 120 })) {
        if (e.dead) continue;
        const ex = p.x - e.x, ey = p.y - e.y;
        const r = p.radius + e.radius;
        if (ex * ex + ey * ey < r * r) {
          damageEnemy(state, e, { ...p.packet, amount: p.packet.amount * 3 }, { knockback: 8, fromX: p.x, fromY: p.y });
          emitParticles(state, p.x, p.y, p.color, 20, 8);
          p.dead = true;
          break;
        }
      }
    } else {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const radiusSum = p.radius + player.radius;

      if (dx * dx + dy * dy < radiusSum * radiusSum) {
        damagePlayer(state, p.packet, true, p.source);
        state.shake = Math.max(state.shake, 15);
        p.dead = true;
      }
    }
  });

  xpDrops.forEach(drop => {
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const radiusSum = player.radius + 15;

    if (dx * dx + dy * dy < radiusSum * radiusSum) {
      drop.collected = true;
      state.experience += drop.amount;
      playCollectXPSound();
      emitParticles(state, drop.x, drop.y, '#38bdf8', 4, 2);
    }
  });

  const nearbyEnemies = enemyTree.query({ x: player.x, y: player.y, w: 250, h: 250 });
  nearbyEnemies.forEach(e => {
    if (e.dead) return;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const radiusSum = player.radius + e.radius;

    if (dx * dx + dy * dy < radiusSum * radiusSum) {
      const def = ENEMIES[e.subtype ?? 'basic'] ?? ENEMIES.basic;
      if (def.kamikaze) {
        damagePlayer(state, { amount: def.kamikaze, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, true, def.id);
        emitParticles(state, e.x, e.y, def.color, 30, 15);
        state.shake = Math.max(state.shake, 30);
        killEnemy(state, e);
      } else if (def.contactDps > 0) {
        damagePlayer(state, { amount: def.contactDps / 60, type: DamageType.KINETIC, penetration: 0, isCrit: false }, false, def.id);
        state.shake = Math.max(state.shake, 2);
      }
    }
  });

  state.projectiles = state.projectiles.filter(p => !p.dead);
  state.enemies = state.enemies.filter(e => !e.dead);
  state.xpDrops = state.xpDrops.filter(d => !d.collected);
};
