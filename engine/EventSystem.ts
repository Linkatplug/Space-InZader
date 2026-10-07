import { GameState, EnvEventType, EnvironmentalEvent, DamageType, Entity } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { emitParticles } from '../render/ParticleSystem';
import { damageEnemy, damagePlayer } from './Combat';
import { EVENTS, EVENT_INTERVAL } from '../data/events';
import { uid } from './ids';

/**
 * Événements environnementaux : alerte → actif → fin.
 * Comportement par type dans EVENT_HANDLERS (appelé chaque pas pendant la phase active).
 */

type Handler = {
  start?: (s: GameState, ev: EnvironmentalEvent) => void;
  update?: (s: GameState, ev: EnvironmentalEvent, dt: number) => void;
};

const BLACK_HOLE_PULL_RADIUS = 1000;
const BLACK_HOLE_CORE = 60;
const BLACK_HOLE_XP_EAT = 160;

const pullToward = (target: Entity, x: number, y: number, strength: number) => {
  const dx = x - target.x, dy = y - target.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  if (dist > BLACK_HOLE_PULL_RADIUS) return dist;
  const force = (1 - dist / BLACK_HOLE_PULL_RADIUS) * strength * (target.type === 'boss' ? 0.2 : 1);
  target.kx = (target.kx || 0) + (dx / dist) * force;
  target.ky = (target.ky || 0) + (dy / dist) * force;
  return dist;
};

export const EVENT_HANDLERS: Record<EnvEventType, Handler> = {
  [EnvEventType.ASTEROID_BELT]: {
    update: (s, ev, dt) => {
      // ~3 météores / seconde qui traversent l'écran autour du joueur
      if (Math.random() > dt * 3) return;
      const { player } = s;
      const angle = Math.PI * 0.35 + (Math.random() - 0.5) * 0.4; // diagonale descendante
      const startX = player.x + (Math.random() - 0.5) * 1800 - Math.cos(angle) * 900;
      const startY = player.y - 900;
      const size = 20 + Math.random() * 25;
      const speed = 6 + Math.random() * 4;
      s.projectiles.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        packet: { amount: 25 + size * 0.5, type: DamageType.KINETIC, penetration: 0, isCrit: false },
        color: '#a8a29e', ownerId: 'env', radius: size,
        distanceTraveled: 0, maxRange: 2600, heatGenerated: 0, kind: 'meteor', source: 'meteor',
      });
      void ev;
    },
  },

  [EnvEventType.BLACK_HOLE]: {
    start: (s, ev) => {
      ev.x = Math.max(300, Math.min(WORLD_WIDTH - 300, s.player.x + (Math.random() - 0.5) * 900));
      ev.y = Math.max(300, Math.min(WORLD_HEIGHT - 300, s.player.y + (Math.random() - 0.5) * 900));
      ev.radius = 400;
    },
    update: (s, ev, dt) => {
      const ramp = Math.min(1, (ev.maxDuration - ev.duration) / 2); // montée en puissance sur 2s
      const strength = 0.65 * (0.3 + 0.7 * ramp);
      const core = { amount: 30 * dt, type: DamageType.KINETIC, penetration: 1, isCrit: false };
      if (pullToward(s.player, ev.x, ev.y, strength) < BLACK_HOLE_CORE) damagePlayer(s, core, false, 'black_hole');
      for (const e of [...s.enemies]) {
        if (pullToward(e, ev.x, ev.y, strength * 0.8) < BLACK_HOLE_CORE) damageEnemy(s, e, { ...core, amount: 200 * dt }, { silent: true });
      }
      // L'XP est aspirée puis détruite
      for (const d of s.xpDrops) {
        const dx = ev.x - d.x, dy = ev.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < BLACK_HOLE_PULL_RADIUS) {
          const f = (1 - dist / BLACK_HOLE_PULL_RADIUS) * 1.2 * ramp;
          d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
        }
        if (dist < BLACK_HOLE_XP_EAT && ramp >= 1) {
          d.collected = true; // retirée sans gain
          d.amount = 0;
          emitParticles(s, d.x, d.y, '#a855f7', 3, 2);
        }
      }
      if (Math.random() < 0.3) emitParticles(s, ev.x + (Math.random() - 0.5) * 800, ev.y + (Math.random() - 0.5) * 800, '#4c1d95', 1, 2);
    },
  },

  [EnvEventType.SOLAR_STORM]: {
    update: (s, _ev, dt) => {
      s.heat = Math.min(s.maxHeat, s.heat + 4 * dt);
      if (Math.random() < dt * 2) damagePlayer(s, { amount: 2, type: DamageType.THERMAL, penetration: 0, isCrit: false }, false, 'solar_storm');
    },
  },

  [EnvEventType.ION_STORM]: {
    update: (s, _ev, dt) => {
      // ~2,5 éclairs / s autour du joueur, annoncés 0,9 s à l'avance
      if (Math.random() > dt * 2.5) return;
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 650;
      s.zones.push({
        id: uid('z'), kind: 'strike', hazard: 'ion_storm',
        x: s.player.x + Math.cos(a) * d, y: s.player.y + Math.sin(a) * d, radius: 85,
        life: 0.9, maxLife: 0.9, color: '#818cf8',
        packet: { amount: 18, type: DamageType.EM, penetration: 0, isCrit: false },
      });
    },
  },

  [EnvEventType.MAGNETIC_STORM]: {
    start: s => {
      s.player.defense.shield = 0;
      emitParticles(s, s.player.x, s.player.y, '#22d3ee', 30, 8);
    },
  },
};

const pickEvent = (wave: number): EnvEventType | null => {
  const pool = Object.values(EVENTS).filter(e => wave >= e.minWave);
  if (pool.length === 0) return null;
  const total = pool.reduce((a, e) => a + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.weight; if (r < 0) return e.type; }
  return pool[pool.length - 1].type;
};

const randRange = ([a, b]: [number, number]) => a + Math.random() * (b - a);

/** Déclenche un événement (alerte d'abord). Exporté pour le menu dev et les tests. */
export const triggerEvent = (state: GameState, type: EnvEventType) => {
  const def = EVENTS[type];
  const duration = randRange(def.duration);
  const ev: EnvironmentalEvent = {
    id: uid('ev'), type, x: 0, y: 0, radius: 0,
    duration, maxDuration: duration, intensity: 1,
    warning: def.warning, started: false,
  };
  state.activeEvents.push(ev);
  // L'annonce est affichée par le HUD (bannière d'événement), pas au centre du terrain
  return ev;
};

export const updateEnvironmentalEvents = (state: GameState, deltaTime: number, _time: number) => {
  // 1. Planification
  if (state.status === 'playing' && state.spawnEnabled && state.activeEvents.length === 0) {
    if (state.nextEventTime === 0) state.nextEventTime = state.time + randRange(EVENT_INTERVAL) * 1000;
    if (state.time >= state.nextEventTime) {
      const type = pickEvent(state.wave);
      if (type) triggerEvent(state, type);
      state.nextEventTime = 0;
    }
  }

  // 2. Alerte → actif → fin
  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    const ev = state.activeEvents[i];
    const handler = EVENT_HANDLERS[ev.type];
    if (!ev.started) {
      ev.warning -= deltaTime;
      if (ev.warning <= 0) {
        ev.started = true;
        handler.start?.(state, ev);
      }
      continue;
    }
    ev.duration -= deltaTime;
    if (ev.duration <= 0) {
      state.activeEvents.splice(i, 1);
      continue;
    }
    handler.update?.(state, ev, deltaTime);
  }
};

/** Événements actifs (hors alerte). */
export const runningEvents = (state: GameState) => state.activeEvents.filter(e => e.started);
