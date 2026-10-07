/** Passifs : modules empilables (rendement dégressif, voir StatsCalculator). */
import { Passive, Tag } from '../types';

export const PASSIVES: Passive[] = [
  // --- UTILITAIRES ---
  { id: 'salvager_1', name: 'Récupérateur', description: 'Aimant à épaves. +30 portée de ramassage de l\'XP.', rarity: 'common', maxStacks: 10, tags: [Tag.MINING], modifiers: [
    { id: 's1-1', property: 'magnetRange', value: 30, type: 'additive' }
  ] },
  { id: 'learning_algorithm', name: 'Algorithme d\'Apprentissage', description: 'Optimise l\'acquisition de données. +15% Gain XP.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'la-1', property: 'xpMult', value: 1.15, type: 'multiplicative' }
  ] },
  { id: 'luck_enhancer', name: 'Injecteur de Probabilités', description: 'Manipule les flux quantiques. +10 Chance.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'le-1', property: 'luck', value: 10, type: 'additive' }
  ] },

  // --- DÉFENSE ---
  { id: 'cap_battery', name: 'Batterie de Condensateurs', description: '+10% Refroidissement.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cb-1', property: 'cooling', value: 1.10, type: 'multiplicative' }
  ] },
  { id: 'pds_module', name: 'Système de Diagnostic', description: 'Couteau suisse : +5 bouclier max, +0.5 régén. bouclier.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'pd-1', property: 'maxShield', value: 5, type: 'additive' },
    { id: 'pd-2', property: 'shieldRegen', value: 0.5, type: 'additive' }
  ] },
  { id: 'hardened_hull', name: 'Châssis Renforcé', description: 'Nanocomposites haute densité. +20 Coque Max.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'hh-1', property: 'maxHull', value: 20, type: 'additive' }
  ] },
  { id: 'reactive_plating', name: 'Placage Réactif', description: 'Dissipe l\'énergie d\'impact. +5% Dureté Armure.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'rp-1', property: 'armorHardness', value: 0.05, type: 'additive' }
  ] },

  // --- ATTAQUE ---
  { id: 'co_processor', name: 'Co-Processeur', description: 'Optimisation CPU : +3% Cadence, +5% Vitesse Projectile.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cp-1', property: 'fireRate', value: 1.03, type: 'multiplicative' },
    { id: 'cp-2', property: 'projectileSpeedMult', value: 1.05, type: 'multiplicative' }
  ] },
  { id: 'targeting_computer', name: 'Calculateur de Tir', description: 'Analyse balistique avancée. +5% Chance de Critique.', rarity: 'rare', maxStacks: 10, tags: [Tag.KINETIC], modifiers: [
    { id: 'tc-1', property: 'critChance', value: 0.05, type: 'additive' }
  ] },
  { id: 'warhead_optimizer', name: 'Optimiseur d\'Ogives', description: 'Augmente la puissance explosive. +10% Dégâts Globaux.', rarity: 'rare', maxStacks: 10, tags: [Tag.EXPLOSIVE], modifiers: [
    { id: 'wo-1', property: 'damageMult', value: 1.10, type: 'multiplicative' }
  ] },

  // --- SPÉCIALISATION ---
  { id: 'thermal_sink', name: 'Dissipateur Thermique', description: 'Gestion de la chaleur extrême. +40 Capacité Heat Max.', rarity: 'common', maxStacks: 5, tags: [Tag.ENERGY, Tag.DOT], modifiers: [
    { id: 'ts-1', property: 'maxHeat', value: 40, type: 'additive' }
  ] },
  { id: 'thruster_overclock', name: 'Overclock Propulseurs', description: 'Surcharge les moteurs. +10% Vitesse et Rotation.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'to-1', property: 'speed', value: 1.10, type: 'multiplicative' },
    { id: 'to-2', property: 'rotationSpeed', value: 1.10, type: 'multiplicative' }
  ] },
  { id: 'quantum_buffer', name: 'Buffer Quantique', description: 'Stabilisation EM. +15% Résistance EM.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY, Tag.DEFENSIVE], modifiers: [
    { id: 'qb-1', property: 'res_EM', value: 0.15, type: 'additive' }
  ] },
  { id: 'heavy_caliber', name: 'Calibre Lourd', description: 'Munitions massives. +15% Dégâts mais -5% Cadence.', rarity: 'epic', maxStacks: 5, tags: [Tag.KINETIC], modifiers: [
    { id: 'hc-1', property: 'damageMult', value: 1.15, type: 'multiplicative' },
    { id: 'hc-2', property: 'fireRate', value: 0.95, type: 'multiplicative' }
  ] },
  // --- Portés de la V1 ---
  { id: 'regeneration', name: 'Nanites de Réparation', description: 'Répare la coque en continu. +0.8 coque/s.', rarity: 'common', maxStacks: 6, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'rg-1', property: 'hullRegen', value: 0.8, type: 'additive' }
  ] },
  { id: 'radiator', name: 'Radiateur', description: 'Refroidissement amélioré. +12% refroidissement, -5% chaleur générée.', rarity: 'common', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'ra-1', property: 'cooling', value: 1.12, type: 'multiplicative' },
    { id: 'ra-2', property: 'heatGenMult', value: 0.95, type: 'multiplicative' }
  ] },
  { id: 'piercing_rounds', name: 'Munitions Perforantes', description: 'Les projectiles traversent un ennemi de plus.', rarity: 'rare', maxStacks: 3, tags: [Tag.KINETIC, Tag.BALLISTIC], modifiers: [
    { id: 'pr-1', property: 'extraPierce', value: 1, type: 'additive' }
  ] },
  { id: 'multi_shot', name: 'Multi-Tir', description: '+1 projectile par salve.', rarity: 'epic', maxStacks: 3, tags: [Tag.BALLISTIC], modifiers: [
    { id: 'ms-1', property: 'extraProjectiles', value: 1, type: 'additive' }
  ] },
  { id: 'vampirism', name: 'Vampirisme', description: 'Convertit 2% des dégâts infligés en coque.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'va-1', property: 'lifesteal', value: 0.02, type: 'additive' }
  ] },
  { id: 'execution', name: 'Exécution', description: '+25% dégâts contre les ennemis sous 30% de coque.', rarity: 'rare', maxStacks: 3, tags: [Tag.KINETIC], modifiers: [
    { id: 'ex-1', property: 'executeBonus', value: 0.25, type: 'additive' }
  ] },
  { id: 'predator', name: 'Prédateur', description: 'Chaque élimination répare 2 de coque. +5% XP.', rarity: 'rare', maxStacks: 3, tags: [Tag.MINING], modifiers: [
    { id: 'pd-k', property: 'healOnKill', value: 2, type: 'additive' },
    { id: 'pd-x', property: 'xpMult', value: 1.05, type: 'multiplicative' }
  ] },
  { id: 'cryo_rounds', name: 'Munitions Cryo', description: '8% de chance de ralentir la cible à l\'impact.', rarity: 'rare', maxStacks: 3, tags: [Tag.ENERGY], modifiers: [
    { id: 'cr-1', property: 'slowOnHit', value: 0.08, type: 'additive' }
  ] },
  { id: 'arc_coils', name: 'Bobines Tesla', description: 'Les arcs électriques rebondissent une fois de plus.', rarity: 'rare', maxStacks: 4, tags: [Tag.CHAIN, Tag.ENERGY], modifiers: [
    { id: 'ac-1', property: 'extraChain', value: 1, type: 'additive' }
  ] },
  { id: 'blast_amplifier', name: 'Amplificateur de Souffle', description: '+12% rayon des explosions.', rarity: 'common', maxStacks: 5, tags: [Tag.EXPLOSIVE, Tag.AREA], modifiers: [
    { id: 'bam-1', property: 'explosionRadiusMult', value: 1.12, type: 'multiplicative' }
  ] },
  { id: 'napalm_core', name: 'Noyau Napalm', description: '+25% dégâts de brûlure.', rarity: 'common', maxStacks: 5, tags: [Tag.DOT], modifiers: [
    { id: 'nc-1', property: 'burnMult', value: 1.25, type: 'multiplicative' }
  ] },
  { id: 'drone_bay', name: 'Hangar à Drones', description: '+1 drone pour chaque escadrille.', rarity: 'epic', maxStacks: 2, tags: [Tag.DRONE, Tag.SWARM], modifiers: [
    { id: 'db-1', property: 'extraDrones', value: 1, type: 'additive' }
  ] },
  { id: 'tactical_ai', name: 'IA Tactique', description: '-10% temps de recharge des compétences.', rarity: 'rare', maxStacks: 4, tags: [Tag.ENERGY], modifiers: [
    { id: 'ta-1', property: 'abilityCooldownMult', value: 0.9, type: 'multiplicative' }
  ] },
  { id: 'evasion_matrix', name: 'Matrice d\'Esquive', description: '+4% de chance d\'esquiver un tir.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'em-1', property: 'dodgeChance', value: 0.04, type: 'additive' }
  ] },
  { id: 'focusing_lens', name: 'Focaliseur', description: '+10% portée et +10% vitesse des projectiles.', rarity: 'common', maxStacks: 5, tags: [Tag.BEAM], modifiers: [
    { id: 'fl-1', property: 'rangeMult', value: 1.1, type: 'multiplicative' },
    { id: 'fl-2', property: 'projectileSpeedMult', value: 1.1, type: 'multiplicative' }
  ] },
  { id: 'black_heart', name: 'Cœur Noir', description: '+30% dégâts, -20 coque max.', rarity: 'legendary', maxStacks: 2, tags: [], modifiers: [
    { id: 'bh-1', property: 'damageMult', value: 1.3, type: 'multiplicative' },
    { id: 'bh-2', property: 'maxHull', value: -20, type: 'additive' }
  ] },
];
