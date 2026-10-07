/**
 * Modules (passifs) : empilables, rendement dégressif Σ 0.8^i (voir StatsCalculator).
 * Nomenclature inspirée des modules de vaisseau classiques de la SF spatiale
 * (relais, membranes, durcisseurs, injecteurs…), cohérente avec les 4 types de dégâts
 * EM / thermique / cinétique / explosif.
 *
 * Règles d'équilibrage :
 * - common : petit bonus pur ; rare : bonus moyen ou ciblé ; epic : gros bonus AVEC contrepartie ;
 *   legendary : effet fort avec contrepartie marquée, peu de cumuls.
 * - Les malus utilisent les mêmes stats que les bonus (la prévisualisation les montre en rouge).
 * - Les stats entières (projectiles, perforation, drones, rebonds) ne subissent pas le rendement dégressif.
 */
import { Passive, Tag } from '../types';

export const PASSIVES: Passive[] = [
  // ─────────────── DÉFENSE : BOUCLIER ───────────────
  { id: 'pds_module', name: 'Relais de bouclier', description: '+5 bouclier max, +0,5 régénération du bouclier.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'pd-1', property: 'maxShield', value: 5, type: 'additive' },
    { id: 'pd-2', property: 'shieldRegen', value: 0.5, type: 'additive' },
  ] },
  { id: 'shield_extender', name: 'Extenseur de bouclier', description: '+30 bouclier max, mais −3 % vitesse (signature accrue).', rarity: 'common', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'se-1', property: 'maxShield', value: 30, type: 'additive' },
    { id: 'se-2', property: 'speed', value: 0.97, type: 'multiplicative' },
  ] },
  { id: 'shield_boost_amp', name: 'Amplificateur de régénération', description: '+40 % régénération du bouclier.', rarity: 'rare', maxStacks: 4, tags: [Tag.DEFENSIVE, Tag.ENERGY], modifiers: [
    { id: 'sba-1', property: 'shieldRegen', value: 1.4, type: 'multiplicative' },
  ] },
  { id: 'quantum_buffer', name: 'Champ de protection EM', description: '+15 % résistance EM.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY, Tag.DEFENSIVE], modifiers: [
    { id: 'qb-1', property: 'res_EM', value: 0.15, type: 'additive' },
  ] },
  { id: 'thermal_ward', name: 'Champ de protection thermique', description: '+15 % résistance thermique.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'tw-1', property: 'res_Thermal', value: 0.15, type: 'additive' },
  ] },

  // ─────────────── DÉFENSE : BLINDAGE & COQUE ───────────────
  { id: 'reactive_plating', name: 'Durcisseur de blindage réactif', description: '+5 % dureté du blindage.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'rp-1', property: 'armorHardness', value: 0.05, type: 'additive' },
  ] },
  { id: 'armor_plates', name: 'Plaques de blindage 1600 mm', description: '+80 blindage max, mais −8 % vitesse.', rarity: 'rare', maxStacks: 3, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'ap-1', property: 'maxArmor', value: 80, type: 'additive' },
    { id: 'ap-2', property: 'speed', value: 0.92, type: 'multiplicative' },
  ] },
  { id: 'kinetic_membrane', name: 'Membrane cinétique', description: '+15 % résistance cinétique.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE, Tag.KINETIC], modifiers: [
    { id: 'km-1', property: 'res_Kinetic', value: 0.15, type: 'additive' },
  ] },
  { id: 'explosive_membrane', name: 'Membrane anti-explosion', description: '+15 % résistance explosive.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'xm-1', property: 'res_Explosive', value: 0.15, type: 'additive' },
  ] },
  { id: 'adaptive_membrane', name: 'Membrane nano-adaptative', description: '+7 % à toutes les résistances.', rarity: 'epic', maxStacks: 3, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'am-1', property: 'res_EM', value: 0.07, type: 'additive' },
    { id: 'am-2', property: 'res_Thermal', value: 0.07, type: 'additive' },
    { id: 'am-3', property: 'res_Kinetic', value: 0.07, type: 'additive' },
    { id: 'am-4', property: 'res_Explosive', value: 0.07, type: 'additive' },
  ] },
  { id: 'damage_control', name: "Contrôle d'avaries", description: '+12 % résistance de la coque et −8 % dégâts subis. Unique.', rarity: 'epic', maxStacks: 1, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'dc-1', property: 'res_Hull', value: 0.12, type: 'additive' },
    { id: 'dc-2', property: 'dmgTakenMult', value: 0.92, type: 'multiplicative' },
  ] },
  { id: 'hardened_hull', name: 'Cloisons renforcées', description: '+20 coque max.', rarity: 'common', maxStacks: 10, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'hh-1', property: 'maxHull', value: 20, type: 'additive' },
  ] },
  { id: 'regeneration', name: 'Réparateur de coque', description: 'Nanites de réparation : +0,8 coque/s.', rarity: 'common', maxStacks: 6, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'rg-1', property: 'hullRegen', value: 0.8, type: 'additive' },
  ] },
  { id: 'vampirism', name: 'Siphon Nosferatu', description: 'Convertit 2 % des dégâts infligés en coque.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'va-1', property: 'lifesteal', value: 0.02, type: 'additive' },
  ] },
  { id: 'evasion_matrix', name: 'Brouilleur de poursuite', description: '+4 % de chance d\'esquiver un tir.', rarity: 'rare', maxStacks: 5, tags: [Tag.DEFENSIVE], modifiers: [
    { id: 'em-1', property: 'dodgeChance', value: 0.04, type: 'additive' },
  ] },

  // ─────────────── ATTAQUE ───────────────
  { id: 'co_processor', name: 'Co-processeur', description: '+3 % cadence, +5 % vitesse des projectiles.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cp-1', property: 'fireRate', value: 1.03, type: 'multiplicative' },
    { id: 'cp-2', property: 'projectileSpeedMult', value: 1.05, type: 'multiplicative' },
  ] },
  { id: 'targeting_computer', name: 'Ordinateur de poursuite', description: '+5 % chance de critique.', rarity: 'rare', maxStacks: 10, tags: [Tag.KINETIC], modifiers: [
    { id: 'tc-1', property: 'critChance', value: 0.05, type: 'additive' },
  ] },
  { id: 'warhead_optimizer', name: 'Système de contrôle balistique', description: '+10 % dégâts.', rarity: 'rare', maxStacks: 10, tags: [Tag.EXPLOSIVE], modifiers: [
    { id: 'wo-1', property: 'damageMult', value: 1.10, type: 'multiplicative' },
  ] },
  { id: 'heavy_caliber', name: 'Gyrostabilisateur surchargé', description: '+15 % dégâts, mais −5 % cadence.', rarity: 'epic', maxStacks: 5, tags: [Tag.KINETIC], modifiers: [
    { id: 'hc-1', property: 'damageMult', value: 1.15, type: 'multiplicative' },
    { id: 'hc-2', property: 'fireRate', value: 0.95, type: 'multiplicative' },
  ] },
  { id: 'magnetic_stabilizer', name: 'Stabilisateur de champ magnétique', description: '+8 % dégâts, +6 % cadence, mais +12 % chaleur générée.', rarity: 'epic', maxStacks: 4, tags: [Tag.ENERGY, Tag.KINETIC], modifiers: [
    { id: 'mst-1', property: 'damageMult', value: 1.08, type: 'multiplicative' },
    { id: 'mst-2', property: 'fireRate', value: 1.06, type: 'multiplicative' },
    { id: 'mst-3', property: 'heatGenMult', value: 1.12, type: 'multiplicative' },
  ] },
  { id: 'focusing_lens', name: 'Améliorateur de poursuite', description: '+10 % portée et +10 % vitesse des projectiles.', rarity: 'common', maxStacks: 5, tags: [Tag.BEAM], modifiers: [
    { id: 'fl-1', property: 'rangeMult', value: 1.1, type: 'multiplicative' },
    { id: 'fl-2', property: 'projectileSpeedMult', value: 1.1, type: 'multiplicative' },
  ] },
  { id: 'piercing_rounds', name: 'Obus à sabot de tungstène', description: 'Les projectiles traversent un ennemi de plus.', rarity: 'rare', maxStacks: 3, tags: [Tag.KINETIC, Tag.BALLISTIC], modifiers: [
    { id: 'pr-1', property: 'extraPierce', value: 1, type: 'additive' },
  ] },
  { id: 'multi_shot', name: 'Tourelles jumelées', description: '+1 projectile par salve, mais +15 % chaleur générée.', rarity: 'epic', maxStacks: 3, tags: [Tag.BALLISTIC], modifiers: [
    { id: 'ms-1', property: 'extraProjectiles', value: 1, type: 'additive' },
    { id: 'ms-2', property: 'heatGenMult', value: 1.15, type: 'multiplicative' },
  ] },
  { id: 'execution', name: 'Analyseur de signature', description: '+25 % dégâts contre les cibles sous 30 % de coque.', rarity: 'rare', maxStacks: 3, tags: [Tag.KINETIC], modifiers: [
    { id: 'ex-1', property: 'executeBonus', value: 0.25, type: 'additive' },
  ] },
  { id: 'cryo_rounds', name: 'Webifieur de stase', description: '8 % de chance de ralentir la cible à l\'impact.', rarity: 'rare', maxStacks: 3, tags: [Tag.ENERGY], modifiers: [
    { id: 'cr-1', property: 'slowOnHit', value: 0.08, type: 'additive' },
  ] },
  { id: 'arc_coils', name: 'Relais de décharge', description: 'Les arcs électriques rebondissent une fois de plus.', rarity: 'rare', maxStacks: 4, tags: [Tag.CHAIN, Tag.ENERGY], modifiers: [
    { id: 'ac-1', property: 'extraChain', value: 1, type: 'additive' },
  ] },
  { id: 'blast_amplifier', name: "Catalyseur de charge d'ogive", description: '+12 % rayon des explosions.', rarity: 'common', maxStacks: 5, tags: [Tag.EXPLOSIVE, Tag.AREA], modifiers: [
    { id: 'bam-1', property: 'explosionRadiusMult', value: 1.12, type: 'multiplicative' },
  ] },
  { id: 'napalm_core', name: 'Charges incendiaires', description: '+25 % dégâts de brûlure.', rarity: 'common', maxStacks: 5, tags: [Tag.DOT], modifiers: [
    { id: 'nc-1', property: 'burnMult', value: 1.25, type: 'multiplicative' },
  ] },
  { id: 'drone_bay', name: 'Amplificateur de liaison drone', description: '+1 drone par escadrille, mais −10 bouclier max.', rarity: 'epic', maxStacks: 2, tags: [Tag.DRONE, Tag.SWARM], modifiers: [
    { id: 'db-1', property: 'extraDrones', value: 1, type: 'additive' },
    { id: 'db-2', property: 'maxShield', value: -10, type: 'additive' },
  ] },
  { id: 'black_heart', name: 'Implant Cœur Noir', description: '+30 % dégâts, −20 coque max.', rarity: 'legendary', maxStacks: 2, tags: [], modifiers: [
    { id: 'bh-1', property: 'damageMult', value: 1.3, type: 'multiplicative' },
    { id: 'bh-2', property: 'maxHull', value: -20, type: 'additive' },
  ] },

  // ─────────────── CHALEUR ───────────────
  { id: 'cap_battery', name: 'Relais de refroidissement', description: '+10 % refroidissement.', rarity: 'common', maxStacks: 10, tags: [Tag.ENERGY], modifiers: [
    { id: 'cb-1', property: 'cooling', value: 1.10, type: 'multiplicative' },
  ] },
  { id: 'radiator', name: 'Radiateur de dissipation', description: '+12 % refroidissement, −5 % chaleur générée.', rarity: 'common', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'ra-1', property: 'cooling', value: 1.12, type: 'multiplicative' },
    { id: 'ra-2', property: 'heatGenMult', value: 0.95, type: 'multiplicative' },
  ] },
  { id: 'thermal_sink', name: 'Dissipateur thermique', description: '+40 chaleur max.', rarity: 'common', maxStacks: 5, tags: [Tag.ENERGY, Tag.DOT], modifiers: [
    { id: 'ts-1', property: 'maxHeat', value: 40, type: 'additive' },
  ] },
  { id: 'coolant_injector', name: 'Injecteur de liquide cryogénique', description: '−15 % chaleur générée, mais −4 % cadence.', rarity: 'rare', maxStacks: 4, tags: [Tag.ENERGY], modifiers: [
    { id: 'ci-1', property: 'heatGenMult', value: 0.85, type: 'multiplicative' },
    { id: 'ci-2', property: 'fireRate', value: 0.96, type: 'multiplicative' },
  ] },
  { id: 'overheat_rig', name: 'Gréement de surchauffe', description: '+15 % cadence, mais +25 % chaleur générée.', rarity: 'epic', maxStacks: 3, tags: [Tag.ENERGY, Tag.DOT], modifiers: [
    { id: 'or-1', property: 'fireRate', value: 1.15, type: 'multiplicative' },
    { id: 'or-2', property: 'heatGenMult', value: 1.25, type: 'multiplicative' },
  ] },

  // ─────────────── PROPULSION ───────────────
  { id: 'thruster_overclock', name: 'Injecteur de surmultiplication', description: '+10 % vitesse.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'to-1', property: 'speed', value: 1.10, type: 'multiplicative' },
    { id: 'to-2', property: 'rotationSpeed', value: 1.10, type: 'multiplicative' },
  ] },
  { id: 'nanofiber', name: 'Structure interne en nanofibres', description: '+12 % vitesse, mais −15 coque max.', rarity: 'common', maxStacks: 3, tags: [], modifiers: [
    { id: 'nf-1', property: 'speed', value: 1.12, type: 'multiplicative' },
    { id: 'nf-2', property: 'maxHull', value: -15, type: 'additive' },
  ] },
  { id: 'microwarpdrive', name: 'Microwarpdrive', description: '+25 % vitesse, mais −25 % bouclier max. Unique.', rarity: 'epic', maxStacks: 1, tags: [Tag.ENERGY], modifiers: [
    { id: 'mwd-1', property: 'speed', value: 1.25, type: 'multiplicative' },
    { id: 'mwd-2', property: 'maxShield', value: 0.75, type: 'multiplicative' },
  ] },

  // ─────────────── COMPÉTENCES (dash, nova, etc.) ───────────────
  { id: 'tactical_ai', name: 'Booster de capaciteur', description: '−10 % temps de recharge des compétences.', rarity: 'rare', maxStacks: 4, tags: [Tag.ENERGY], modifiers: [
    { id: 'ta-1', property: 'abilityCooldownMult', value: 0.9, type: 'multiplicative' },
  ] },
  { id: 'cap_power_relay', name: 'Relais de puissance du capaciteur', description: '+20 % puissance des compétences (dégâts, rayon, durée).', rarity: 'rare', maxStacks: 4, tags: [Tag.ENERGY, Tag.AREA], modifiers: [
    { id: 'cpr-1', property: 'abilityPowerMult', value: 1.2, type: 'multiplicative' },
  ] },
  { id: 'micro_jump', name: 'Propulseur de micro-saut', description: '+30 % distance du dash, −10 % recharge des compétences.', rarity: 'rare', maxStacks: 3, tags: [], modifiers: [
    { id: 'mj-1', property: 'dashDistanceMult', value: 1.3, type: 'multiplicative' },
    { id: 'mj-2', property: 'abilityCooldownMult', value: 0.9, type: 'multiplicative' },
  ] },
  { id: 'cap_overcharge', name: 'Surcharge de capaciteur', description: '+45 % puissance des compétences, mais +30 % temps de recharge.', rarity: 'epic', maxStacks: 2, tags: [Tag.ENERGY], modifiers: [
    { id: 'coc-1', property: 'abilityPowerMult', value: 1.45, type: 'multiplicative' },
    { id: 'coc-2', property: 'abilityCooldownMult', value: 1.3, type: 'multiplicative' },
  ] },
  { id: 'cap_injector', name: 'Injecteur de capaciteur', description: '−25 % recharge des compétences, mais −10 % dégâts des armes.', rarity: 'epic', maxStacks: 2, tags: [Tag.ENERGY], modifiers: [
    { id: 'cin-1', property: 'abilityCooldownMult', value: 0.75, type: 'multiplicative' },
    { id: 'cin-2', property: 'damageMult', value: 0.9, type: 'multiplicative' },
  ] },

  // ─────────────── UTILITAIRE ───────────────
  { id: 'salvager_1', name: 'Rayon tracteur', description: '+30 portée de ramassage de l\'XP et du butin.', rarity: 'common', maxStacks: 10, tags: [Tag.MINING], modifiers: [
    { id: 's1-1', property: 'magnetRange', value: 30, type: 'additive' },
  ] },
  { id: 'learning_algorithm', name: 'Analyseur de données', description: '+15 % gain d\'XP.', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'la-1', property: 'xpMult', value: 1.15, type: 'multiplicative' },
  ] },
  { id: 'luck_enhancer', name: 'Analyseur de reliques', description: '+10 chance (améliorations rares plus fréquentes).', rarity: 'rare', maxStacks: 5, tags: [Tag.ENERGY], modifiers: [
    { id: 'le-1', property: 'luck', value: 10, type: 'additive' },
  ] },
  { id: 'predator', name: "Récupérateur d'épaves", description: 'Chaque élimination répare 2 de coque. +5 % XP.', rarity: 'rare', maxStacks: 3, tags: [Tag.MINING], modifiers: [
    { id: 'pd-k', property: 'healOnKill', value: 2, type: 'additive' },
    { id: 'pd-x', property: 'xpMult', value: 1.05, type: 'multiplicative' },
  ] },
  { id: 'cargo_scanner', name: 'Scanner de cargaison', description: '+35 % chance de butin (capsules, nanites, plaques, trous de ver).', rarity: 'rare', maxStacks: 4, tags: [Tag.MINING], modifiers: [
    { id: 'cs-1', property: 'pickupChance', value: 1.35, type: 'multiplicative' },
  ] },
];
