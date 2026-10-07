import { GameState, ActiveAbility, DamageType, Modifier } from '../types';
import { emitParticles } from '../render/ParticleSystem';
import { damageEnemy } from './Combat';
import { hasMechanic } from './Synergies';
import { refreshPlayerStats } from './StatsCalculator';
import { uid } from './ids';
import { CONTROLS } from '../constants';

/**
 * Compétences actives. Chaque vaisseau en équipe deux (data/ships.ts → `abilities`),
 * sur les touches CONTROLS.ABILITY_1 (Shift) et CONTROLS.ABILITY_2 (E).
 * Pour ajouter une compétence : une entrée dans ABILITIES (id, texte, recharge, execute).
 */

export const updateAbilities = (state: GameState, deltaTime: number, keys: Set<string>) => {
  state.activeAbilities.forEach(ability => {
    if (ability.currentCooldown > 0) {
      ability.currentCooldown = Math.max(0, ability.currentCooldown - deltaTime);
    }
    if (ability.currentCooldown <= 0 && keys.has(ability.key)) {
      ability.execute(state);
      ability.currentCooldown = ability.cooldown * state.player.runtimeStats.abilityCooldownMult;
    }
  });
};

/** Bonus temporaire : modificateurs appliqués au joueur jusqu'à `until` (ms). */
export const addBuff = (state: GameState, id: string, name: string, seconds: number, modifiers: Modifier[], color: string) => {
  state.buffs = state.buffs.filter(b => b.id !== id);
  state.buffs.push({ id, name, until: state.time + seconds * 1000, modifiers, color });
  refreshPlayerStats(state); // effet immédiat, sans attendre le pas suivant
};

const aimPoint = (state: GameState, dist: number) => ({
  x: state.player.x + Math.cos(state.player.rotation) * dist,
  y: state.player.y + Math.sin(state.player.rotation) * dist,
});

type AbilityDef = Omit<ActiveAbility, 'currentCooldown' | 'key'>;

export const ABILITIES: Record<string, AbilityDef> = {
  blink_dash: {
    id: 'blink_dash', name: 'Blink Dash', icon: '⚡', cooldown: 4,
    description: 'Téléportation courte (direction du mouvement, sinon visée).',
    execute: (state) => {
      const { player } = state;
      const moving = Math.abs(player.vx) + Math.abs(player.vy) > 0.1;
      const dir = moving ? Math.atan2(player.vy, player.vx) : player.rotation;
      emitParticles(state, player.x, player.y, '#22d3ee', 20, 15);
      player.x += Math.cos(dir) * 300;
      player.y += Math.sin(dir) * 300;
      emitParticles(state, player.x, player.y, '#f8fafc', 20, 10);
      // Synergie Bastion : le dash rend brièvement invulnérable
      if (hasMechanic(state, 'dashInvuln')) player.invulnUntil = state.time + 400;
    },
  },

  tactical_nova: {
    id: 'tactical_nova', name: 'Nova Tactique', icon: '🌀', cooldown: 12,
    description: 'Onde de choc EM autour du vaisseau (150 dégâts, repousse).',
    execute: (state) => {
      const { player } = state;
      const range = 400;
      emitParticles(state, player.x, player.y, '#22d3ee', 50, 20);
      state.zones.push({ id: uid('z'), kind: 'pulse', x: player.x, y: player.y, radius: range, life: 0.5, maxLife: 0.5, color: '#22d3ee' });
      state.shake = Math.max(state.shake, 12);
      [...state.enemies].forEach(e => {
        const dist = Math.hypot(e.x - player.x, e.y - player.y) || 1;
        if (dist < range + e.radius) {
          damageEnemy(state, e, { amount: 150 * player.runtimeStats.damageMult, type: DamageType.EM, penetration: 0.5, isCrit: false },
            { knockback: (1 - Math.min(1, dist / range)) * 25 + 5 });
        }
      });
    },
  },

  overdrive: {
    id: 'overdrive', name: 'Surcadençage', icon: '🔥', cooldown: 18,
    description: '5 s : cadence +60 %, aucune chaleur générée.',
    execute: (state) => {
      addBuff(state, 'overdrive', 'Surcadençage', 5, [
        { id: 'od-1', property: 'fireRate', value: 1.6, type: 'multiplicative' },
        { id: 'od-2', property: 'heatGenMult', value: 0, type: 'multiplicative' },
      ], '#facc15');
      state.isOverheated = false;
      emitParticles(state, state.player.x, state.player.y, '#facc15', 30, 10);
    },
  },

  aegis_shield: {
    id: 'aegis_shield', name: 'Égide', icon: '🛡️', cooldown: 20,
    description: 'Recharge le bouclier et rend invulnérable 1,5 s.',
    execute: (state) => {
      const { player } = state;
      player.defense.shield = player.runtimeStats.maxShield;
      player.invulnUntil = state.time + 1500;
      state.zones.push({ id: uid('z'), kind: 'pulse', x: player.x, y: player.y, radius: 140, life: 0.4, maxLife: 0.4, color: '#60a5fa' });
      emitParticles(state, player.x, player.y, '#60a5fa', 30, 8);
    },
  },

  repair_nanites: {
    id: 'repair_nanites', name: 'Nanites', icon: '🔧', cooldown: 30,
    description: 'Répare la coque : +6 coque/s pendant 5 s.',
    execute: (state) => {
      addBuff(state, 'repair_nanites', 'Nanites', 5, [{ id: 'rn-1', property: 'hullRegen', value: 6, type: 'additive' }], '#4ade80');
      emitParticles(state, state.player.x, state.player.y, '#4ade80', 25, 6);
    },
  },

  emergency_vent: {
    id: 'emergency_vent', name: 'Purge Thermique', icon: '♨️', cooldown: 15,
    description: 'Vide la chaleur et la libère en onde brûlante (dégâts selon la chaleur).',
    execute: (state) => {
      const { player } = state;
      const heatFrac = state.maxHeat > 0 ? state.heat / state.maxHeat : 0;
      const dmg = (40 + 200 * heatFrac) * player.runtimeStats.damageMult;
      const range = 320;
      state.heat = 0;
      state.isOverheated = false;
      state.zones.push({ id: uid('z'), kind: 'pulse', x: player.x, y: player.y, radius: range, life: 0.45, maxLife: 0.45, color: '#fb923c' });
      emitParticles(state, player.x, player.y, '#fb923c', 40, 14);
      state.shake = Math.max(state.shake, 10);
      [...state.enemies].forEach(e => {
        if (Math.hypot(e.x - player.x, e.y - player.y) < range + e.radius) {
          damageEnemy(state, e, { amount: dmg, type: DamageType.THERMAL, penetration: 0, isCrit: false }, { burn: 0.4, knockback: 8 });
        }
      });
    },
  },

  orbital_barrage: {
    id: 'orbital_barrage', name: 'Barrage Orbital', icon: '☄️', cooldown: 26,
    description: '8 frappes orbitales autour du vaisseau.',
    execute: (state) => {
      const { player } = state;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        const d = 180 + Math.random() * 220;
        const delay = 0.5 + i * 0.1;
        state.zones.push({
          id: uid('z'), kind: 'strike', x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, radius: 110,
          life: delay, maxLife: delay, color: '#facc15',
          packet: { amount: 70 * player.runtimeStats.damageMult, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, knockback: 8,
        });
      }
    },
  },

  time_dilation: {
    id: 'time_dilation', name: 'Distorsion', icon: '⏳', cooldown: 20,
    description: '4 s : ennemis et projectiles ennemis ralentis de 60 %.',
    execute: (state) => {
      state.enemySlowUntil = state.time + 4000;
      state.enemies.forEach(e => { e.slow = { amount: 0.6, until: state.time + 4000 }; });
      state.zones.push({ id: uid('z'), kind: 'pulse', x: state.player.x, y: state.player.y, radius: 900, life: 0.6, maxLife: 0.6, color: '#c084fc' });
    },
  },

  gravity_well: {
    id: 'gravity_well', name: 'Puits Gravitationnel', icon: '🕳️', cooldown: 16,
    description: 'Crée un puits devant le vaisseau qui aspire et broie les ennemis (3 s).',
    execute: (state) => {
      const p = aimPoint(state, 350);
      state.zones.push({
        id: uid('z'), kind: 'gravity', x: p.x, y: p.y, radius: 300, life: 3, maxLife: 3, color: '#a855f7',
        packet: { amount: 40 * state.player.runtimeStats.damageMult, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false },
      });
    },
  },
};

/** Instancie une compétence pour un emplacement (0 → Shift, 1 → E). */
export const makeAbility = (id: string, slot: 0 | 1): ActiveAbility => {
  const def = ABILITIES[id] ?? ABILITIES.blink_dash;
  return { ...def, currentCooldown: 0, key: slot === 0 ? CONTROLS.ABILITY_1 : CONTROLS.ABILITY_2 };
};

export const DEFAULT_ABILITIES: [string, string] = ['blink_dash', 'tactical_nova'];

// Compatibilité (menu dev, anciens imports)
export const BLINK_DASH = makeAbility('blink_dash', 0);
export const TACTICAL_NOVA = makeAbility('tactical_nova', 1);
export const ALL_ABILITIES: ActiveAbility[] = Object.keys(ABILITIES).map(id => makeAbility(id, 0));
