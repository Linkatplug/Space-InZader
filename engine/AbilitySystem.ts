
import { GameState, ActiveAbility, DamageType } from '../types';
import { emitParticles } from '../render/ParticleSystem';
import { damageEnemy } from './Combat';
import { hasMechanic } from './Synergies';
import { uid } from './ids';
import { CONTROLS } from '../constants';

export const updateAbilities = (state: GameState, deltaTime: number, keys: Set<string>) => {
  state.activeAbilities.forEach(ability => {
    // Réduction du cooldown
    if (ability.currentCooldown > 0) {
      ability.currentCooldown = Math.max(0, ability.currentCooldown - deltaTime);
    }

    // Déclenchement
    if (ability.currentCooldown <= 0 && keys.has(ability.key)) {
      ability.execute(state);
      ability.currentCooldown = ability.cooldown * state.player.runtimeStats.abilityCooldownMult;
    }
  });
};

// --- Catalogue des Compétences ---

export const BLINK_DASH: ActiveAbility = {
  id: 'blink_dash',
  name: 'Blink Dash',
  description: 'Téléportation courte distance (direction du mouvement, sinon curseur).',
  cooldown: 4.0,
  currentCooldown: 0,
  icon: '⚡',
  key: CONTROLS.ABILITY_1,
  execute: (state) => {
    const { player } = state;
    const dashDist = 300;
    // Dash dans la direction du mouvement, sinon vers le curseur
    const moving = Math.abs(player.vx) + Math.abs(player.vy) > 0.1;
    const dir = moving ? Math.atan2(player.vy, player.vx) : player.rotation;
    const targetX = player.x + Math.cos(dir) * dashDist;
    const targetY = player.y + Math.sin(dir) * dashDist;
    
    emitParticles(state, player.x, player.y, '#22d3ee', 20, 15);
    player.x = targetX;
    player.y = targetY;
    emitParticles(state, player.x, player.y, '#f8fafc', 20, 10);
    // Synergie Bastion : le dash rend brièvement invulnérable
    if (hasMechanic(state, 'dashInvuln')) player.invulnUntil = state.time + 400;
  }
};

export const TACTICAL_NOVA: ActiveAbility = {
  id: 'tactical_nova',
  name: 'Nova Tactique',
  description: 'Onde de choc EM déchargeant les boucliers ennemis.',
  cooldown: 12.0,
  currentCooldown: 0,
  icon: '🌀',
  key: CONTROLS.ABILITY_2,
  execute: (state) => {
    const { player, enemies } = state;
    const novaRange = 400;
    
    emitParticles(state, player.x, player.y, '#22d3ee', 50, 20);
    state.zones.push({ id: uid('z'), kind: 'pulse', x: player.x, y: player.y, radius: novaRange, life: 0.5, maxLife: 0.5, color: '#22d3ee' });
    state.shake = Math.max(state.shake, 12);

    [...enemies].forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist < novaRange) {
        damageEnemy(state, e, {
          amount: 150 * player.runtimeStats.damageMult,
          type: DamageType.EM,
          penetration: 0.5,
          isCrit: false
        }, { knockback: (1 - dist / novaRange) * 25 + 5 });
      }
    });
  }
};

// Pool automatique pour le DevMode
export const ALL_ABILITIES: ActiveAbility[] = [
  BLINK_DASH,
  TACTICAL_NOVA
];
