/**
 * Synergies : bonus débloqués en accumulant des armes / passifs partageant des tags.
 * Chaque arme ou passif possédé compte une fois par tag listé dans `tags`.
 * Paliers cumulatifs : à 4 tags, on a les bonus du palier 2 ET du palier 4.
 * `mechanic` active un effet spécial codé dans engine/Combat.ts.
 */
import { Synergy, Tag } from '../types';

export const SYNERGIES: Synergy[] = [
  {
    id: 'kinetic', name: 'Balistique', color: '#e2e8f0', tags: [Tag.KINETIC, Tag.BALLISTIC],
    tiers: [
      { count: 2, description: '+6% chance de critique', modifiers: [{ id: 'syk-2', property: 'critChance', value: 0.06, type: 'additive' }] },
      { count: 4, description: '+40% dégâts critiques', modifiers: [{ id: 'syk-4', property: 'critMult', value: 0.4, type: 'additive' }] },
      { count: 6, description: 'Les critiques explosent', mechanic: 'critExplosion' },
    ],
  },
  {
    id: 'explosive', name: 'Explosif', color: '#facc15', tags: [Tag.EXPLOSIVE, Tag.AREA],
    tiers: [
      { count: 2, description: '+20% rayon des explosions', modifiers: [{ id: 'sye-2', property: 'explosionRadiusMult', value: 1.2, type: 'multiplicative' }] },
      { count: 4, description: '+15% dégâts', modifiers: [{ id: 'sye-4', property: 'damageMult', value: 1.15, type: 'multiplicative' }] },
      { count: 6, description: 'Les ennemis tués explosent', mechanic: 'chainExplosion' },
    ],
  },
  {
    id: 'energy', name: 'Énergie', color: '#22d3ee', tags: [Tag.ENERGY, Tag.BEAM],
    tiers: [
      { count: 2, description: '+20% refroidissement', modifiers: [{ id: 'syn-2', property: 'cooling', value: 1.2, type: 'multiplicative' }] },
      { count: 4, description: '+60 chaleur max', modifiers: [{ id: 'syn-4', property: 'maxHeat', value: 60, type: 'additive' }] },
      { count: 6, description: '+15% cadence, -15% chaleur générée', modifiers: [
        { id: 'syn-6a', property: 'fireRate', value: 1.15, type: 'multiplicative' },
        { id: 'syn-6b', property: 'heatGenMult', value: 0.85, type: 'multiplicative' },
      ] },
    ],
  },
  {
    id: 'thermal', name: 'Incendiaire', color: '#fb923c', tags: [Tag.DOT],
    tiers: [
      { count: 2, description: '+50% dégâts de brûlure', modifiers: [{ id: 'syt-2', property: 'burnMult', value: 1.5, type: 'multiplicative' }] },
      { count: 3, description: 'Les brûlures se propagent à la mort', mechanic: 'burnSpread' },
    ],
  },
  {
    id: 'swarm', name: 'Essaim', color: '#4ade80', tags: [Tag.DRONE, Tag.SWARM, Tag.ORBITAL],
    tiers: [
      { count: 2, description: '+1 drone', modifiers: [{ id: 'sys-2', property: 'extraDrones', value: 1, type: 'additive' }] },
      { count: 3, description: '+1 projectile par salve', modifiers: [{ id: 'sys-3', property: 'extraProjectiles', value: 1, type: 'additive' }] },
    ],
  },
  {
    id: 'arc', name: 'Conduction', color: '#7dd3fc', tags: [Tag.CHAIN, Tag.HOMING],
    tiers: [
      { count: 2, description: '+2 rebonds électriques, +15% portée', modifiers: [
        { id: 'sya-2a', property: 'extraChain', value: 2, type: 'additive' },
        { id: 'sya-2b', property: 'rangeMult', value: 1.15, type: 'multiplicative' },
      ] },
    ],
  },
  {
    id: 'defense', name: 'Bastion', color: '#60a5fa', tags: [Tag.DEFENSIVE],
    tiers: [
      { count: 2, description: '+3 régén. bouclier', modifiers: [{ id: 'syd-2', property: 'shieldRegen', value: 3, type: 'additive' }] },
      { count: 4, description: '-20% recharge des compétences, dash invulnérable', mechanic: 'dashInvuln', modifiers: [{ id: 'syd-4', property: 'abilityCooldownMult', value: 0.8, type: 'multiplicative' }] },
    ],
  },
];
