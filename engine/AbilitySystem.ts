
import { GameState, ActiveAbility, DamageType } from '../types';
import { emitParticles } from '../render/ParticleSystem';
import { applyDamage } from './DamageEngine';
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
      ability.currentCooldown = ability.cooldown;
    }
  });
};

// --- Catalogue des Compétences ---

export const BLINK_DASH: ActiveAbility = {
  id: 'blink_dash',
  name: 'Blink Dash',
  description: 'Téléportation courte distance vers le curseur.',
  cooldown: 4.0,
  currentCooldown: 0,
  icon: '⚡',
  key: CONTROLS.ABILITY_1,
  execute: (state) => {
    const { player } = state;
    const dashDist = 300;
    const targetX = player.x + Math.cos(player.rotation) * dashDist;
    const targetY = player.y + Math.sin(player.rotation) * dashDist;
    
    emitParticles(state, player.x, player.y, '#22d3ee', 20, 15);
    player.x = targetX;
    player.y = targetY;
    emitParticles(state, player.x, player.y, '#f8fafc', 20, 10);
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
    
    enemies.forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < novaRange) {
        applyDamage(e, {
          amount: 150,
          type: DamageType.EM,
          penetration: 0.5,
          isCrit: false
        });
        
        const force = (1 - dist / novaRange) * 15;
        e.vx += (dx / dist) * force;
        e.vy += (dy / dist) * force;
      }
    });
  }
};

// Pool automatique pour le DevMode
export const ALL_ABILITIES: ActiveAbility[] = [
  BLINK_DASH,
  TACTICAL_NOVA
];
