/**
 * @fileoverview Passive upgrade data definitions for Space InZader
 * Defines all passive items that modify player stats
 */

/**
 * @typedef {Object} PassiveEffects
 * @property {number} [damageMultiplier] - Multiplier for damage
 * @property {number} [fireRateMultiplier] - Multiplier for fire rate
 * @property {number} [critChance] - Critical hit chance (0-1)
 * @property {number} [critMultiplier] - Critical damage multiplier
 * @property {number} [lifesteal] - Lifesteal percentage (0-1)
 * @property {number} [maxHealthMultiplier] - Max health multiplier
 * @property {number} [electricDamageBonus] - Bonus electric damage
 * @property {number} [stunChance] - Chance to stun (0-1)
 * @property {number} [rangeMultiplier] - Range multiplier
 * @property {number} [projectileSpeedMultiplier] - Projectile speed multiplier
 * @property {number} [magnetRange] - XP/pickup magnet range
 * @property {number} [xpMultiplier] - XP gain multiplier
 * @property {number} [armor] - Flat damage reduction
 * @property {number} [speedMultiplier] - Movement speed multiplier
 * @property {number} [dashCooldownReduction] - Dash cooldown reduction (0-1)
 * @property {number} [luck] - Luck bonus (affects drops and rarities)
 * @property {number} [overheatReduction] - Reduces weapon overheat (0-1)
 */

/**
 * @typedef {Object} PassiveData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Passive description
 * @property {string} rarity - Rarity tier (common/uncommon/rare/epic)
 * @property {PassiveEffects} effects - Stat modifications
 * @property {number} maxStacks - Maximum number of times this can be taken
 * @property {string} color - Neon color for visuals
 * @property {string} icon - Icon character/emoji
 */

const PASSIVES = {
  SURCHAUFFE: {
    id: 'surchauffe',
    name: 'Surchauffe',
    description: 'Augmente les dégâts laser. Plus de puissance, plus de chaleur.',
    rarity: 'common',
    effects: {
      damageMultiplier: 0.15,
      overheatReduction: -0.1
    },
    maxStacks: 5,
    color: '#FF4500',
    icon: '🔥'
  },

  RADIATEUR: {
    id: 'radiateur',
    name: 'Radiateur',
    description: 'Refroidissement amélioré. Tire plus vite sans surchauffe.',
    rarity: 'uncommon',
    effects: {
      fireRateMultiplier: 0.12,
      overheatReduction: 0.15
    },
    maxStacks: 5,
    color: '#00BFFF',
    icon: '❄️'
  },

  SANG_FROID: {
    id: 'sang_froid',
    name: 'Sang Froid',
    description: 'Augmente les chances de coup critique et le vol de vie.',
    rarity: 'rare',
    effects: {
      critChance: 0.08,
      critMultiplier: 0.2,
      lifesteal: 0.05
    },
    maxStacks: 4,
    color: '#4169E1',
    icon: '💎'
  },

  COEUR_NOIR: {
    id: 'coeur_noir',
    name: 'Cœur Noir',
    description: 'Énergie vampirique puissante au prix de ta vitalité.',
    rarity: 'rare',
    effects: {
      lifesteal: 0.15,
      maxHealthMultiplier: -0.1,
      damageMultiplier: 0.08
    },
    maxStacks: 3,
    color: '#8B0000',
    icon: '🖤'
  },

  BOBINES_TESLA: {
    id: 'bobines_tesla',
    name: 'Bobines Tesla',
    description: 'Amplifie les dégâts électriques et ajoute une chance d\'étourdissement.',
    rarity: 'uncommon',
    effects: {
      electricDamageBonus: 0.25,
      stunChance: 0.05,
      damageMultiplier: 0.1
    },
    maxStacks: 4,
    color: '#00FFFF',
    icon: '⚡'
  },

  FOCALISEUR: {
    id: 'focaliseur',
    name: 'Focaliseur',
    description: 'Augmente la portée et la vitesse des projectiles.',
    rarity: 'uncommon',
    effects: {
      rangeMultiplier: 0.15,
      projectileSpeedMultiplier: 0.20
    },
    maxStacks: 5,
    color: '#FF00FF',
    icon: '🔍'
  },

  MAG_TRACTOR: {
    id: 'mag_tractor',
    name: 'Mag-Tractor',
    description: 'Attire l\'XP et les bonus de plus loin. Gain d\'XP amélioré.',
    rarity: 'common',
    effects: {
      magnetRange: 50,
      xpMultiplier: 0.10
    },
    maxStacks: 6,
    color: '#FFD700',
    icon: '🧲'
  },

  PLATING: {
    id: 'plating',
    name: 'Plating',
    description: 'Blindage renforcé qui réduit les dégâts reçus.',
    rarity: 'common',
    effects: {
      armor: 2,
      maxHealthMultiplier: 0.05
    },
    maxStacks: 8,
    color: '#C0C0C0',
    icon: '🛡️'
  },

  REACTEUR: {
    id: 'reacteur',
    name: 'Réacteur',
    description: 'Moteurs surpuissants. Plus rapide, dash rechargé plus vite.',
    rarity: 'uncommon',
    effects: {
      speedMultiplier: 0.10,
      dashCooldownReduction: 0.12
    },
    maxStacks: 5,
    color: '#FF6347',
    icon: '🚀'
  },

  CHANCE: {
    id: 'chance',
    name: 'Chance',
    description: 'Améliore la chance. Objets rares plus fréquents.',
    rarity: 'rare',
    effects: {
      luck: 0.15,
      critChance: 0.03
    },
    maxStacks: 5,
    color: '#FFD700',
    icon: '🍀'
  },

  // ===== NEW PASSIVES (30+) =====

  // Common (simple stat boosts)
  MUNITIONS_LOURDES: {
    id: 'munitions_lourdes',
    name: 'Munitions Lourdes',
    description: '+Dégâts bruts. Frappe plus fort.',
    rarity: 'common',
    effects: {
      damageMultiplier: 0.12
    },
    maxStacks: 8,
    color: '#FF8C00',
    icon: '💥'
  },

  CADENCE_RAPIDE: {
    id: 'cadence_rapide',
    name: 'Cadence Rapide',
    description: 'Tire plus vite. Plus de projectiles par seconde.',
    rarity: 'common',
    effects: {
      fireRateMultiplier: 0.10
    },
    maxStacks: 8,
    color: '#00FF00',
    icon: '⚡'
  },

  VITALITE: {
    id: 'vitalite',
    name: 'Vitalité',
    description: '+Santé maximale. Survie améliorée.',
    rarity: 'common',
    effects: {
      maxHealthMultiplier: 0.10
    },
    maxStacks: 6,
    color: '#32CD32',
    icon: '❤️'
  },

  REGENERATION: {
    id: 'regeneration',
    name: 'Régénération',
    description: 'Récupère de la santé avec le temps.',
    rarity: 'common',
    effects: {
      healthRegen: 0.5
    },
    maxStacks: 6,
    color: '#00FA9A',
    icon: '💚'
  },

  MOBILITE: {
    id: 'mobilite',
    name: 'Mobilité',
    description: 'Déplacement plus rapide. Esquive facilitée.',
    rarity: 'common',
    effects: {
      speedMultiplier: 0.08
    },
    maxStacks: 7,
    color: '#00CED1',
    icon: '💨'
  },

  COLLECTEUR: {
    id: 'collecteur',
    name: 'Collecteur',
    description: 'Augmente le rayon magnétique pour ramasser l\'XP.',
    rarity: 'common',
    effects: {
      magnetRange: 40
    },
    maxStacks: 6,
    color: '#DAA520',
    icon: '🔰'
  },

  // Uncommon (combo effects)
  PERFORANT: {
    id: 'perforant',
    name: 'Perforant',
    description: 'Les projectiles traversent un ennemi supplémentaire.',
    rarity: 'uncommon',
    effects: {
      piercing: 1,
      damageMultiplier: 0.08
    },
    maxStacks: 3,
    color: '#9370DB',
    icon: '🎯'
  },

  RICOCHET: {
    id: 'ricochet',
    name: 'Ricochet',
    description: 'Chance de faire rebondir les projectiles sur les ennemis.',
    rarity: 'uncommon',
    effects: {
      ricochetChance: 0.15,
      bounceCount: 1
    },
    maxStacks: 4,
    color: '#FF1493',
    icon: '🔄'
  },

  EXPLOSION_IMPACT: {
    id: 'explosion_impact',
    name: 'Explosion d\'Impact',
    description: 'Les tirs ont une chance d\'exploser en zone.',
    rarity: 'uncommon',
    effects: {
      explosionChance: 0.12,
      explosionRadius: 30,
      explosionDamage: 0.5
    },
    maxStacks: 3,
    color: '#FF4500',
    icon: '💣'
  },

  MULTI_TIR: {
    id: 'multi_tir',
    name: 'Multi-Tir',
    description: '+1 projectile par salve. Couverture améliorée.',
    rarity: 'uncommon',
    effects: {
      projectileCount: 1,
      damageMultiplier: -0.05
    },
    maxStacks: 4,
    color: '#FF6347',
    icon: '🌟'
  },

  PRECISION: {
    id: 'precision',
    name: 'Précision',
    description: 'Augmente les critiques et la vitesse des projectiles.',
    rarity: 'uncommon',
    effects: {
      critChance: 0.06,
      projectileSpeedMultiplier: 0.15
    },
    maxStacks: 5,
    color: '#4682B4',
    icon: '🎲'
  },

  BOUCLIER_ENERGIE: {
    id: 'bouclier_energie',
    name: 'Bouclier d\'Énergie',
    description: 'Absorbe des dégâts périodiquement.',
    rarity: 'uncommon',
    effects: {
      shield: 20,
      shieldRegen: 2
    },
    maxStacks: 4,
    color: '#00BFFF',
    icon: '🛡️'
  },

  VAMPIRISME: {
    id: 'vampirisme',
    name: 'Vampirisme',
    description: 'Convertit les dégâts en santé.',
    rarity: 'uncommon',
    effects: {
      lifesteal: 0.08
    },
    maxStacks: 5,
    color: '#DC143C',
    icon: '🧛'
  },

  PORTEE_ETENDUE: {
    id: 'portee_etendue',
    name: 'Portée Étendue',
    description: 'Armes plus efficaces à longue distance.',
    rarity: 'uncommon',
    effects: {
      rangeMultiplier: 0.20,
      damageMultiplier: 0.05
    },
    maxStacks: 4,
    color: '#6A5ACD',
    icon: '📡'
  },

  ECONOMIE_ENERGIE: {
    id: 'economie_energie',
    name: 'Économie d\'Énergie',
    description: 'Réduit surchauffe et améliore cadence.',
    rarity: 'uncommon',
    effects: {
      overheatReduction: 0.20,
      fireRateMultiplier: 0.08
    },
    maxStacks: 4,
    color: '#20B2AA',
    icon: '⚙️'
  },

  // Rare (powerful combos)
  EXECUTION: {
    id: 'execution',
    name: 'Exécution',
    description: '+Dégâts sur ennemis à faible santé.',
    rarity: 'rare',
    effects: {
      executeThreshold: 0.25,
      executeDamageBonus: 0.50,
      damageMultiplier: 0.10
    },
    maxStacks: 3,
    color: '#8B0000',
    icon: '⚔️'
  },

  FUREUR_COMBAT: {
    id: 'fureur_combat',
    name: 'Fureur de Combat',
    description: 'Stack de dégâts qui augmente avec les kills.',
    rarity: 'rare',
    effects: {
      furyPerKill: 0.02,
      furyMax: 0.50,
      furyDecay: 0.01
    },
    maxStacks: 3,
    color: '#FF0000',
    icon: '🔥'
  },

  PREDATEUR: {
    id: 'predateur',
    name: 'Prédateur',
    description: 'Bonus XP et santé sur kill.',
    rarity: 'rare',
    effects: {
      xpMultiplier: 0.20,
      healOnKill: 2,
      damageMultiplier: 0.12
    },
    maxStacks: 3,
    color: '#FFD700',
    icon: '👑'
  },

  CHAINE_FOUDRE: {
    id: 'chaine_foudre',
    name: 'Chaîne de Foudre',
    description: 'Les attaques électriques sautent entre ennemis.',
    rarity: 'rare',
    effects: {
      chainLightning: 1,
      electricDamageBonus: 0.30,
      chainRange: 150
    },
    maxStacks: 4,
    color: '#00FFFF',
    icon: '⚡'
  },

  TEMPS_RALENTI: {
    id: 'temps_ralenti',
    name: 'Temps Ralenti',
    description: 'Chance de ralentir les ennemis touchés.',
    rarity: 'rare',
    effects: {
      slowChance: 0.20,
      slowAmount: 0.40,
      slowDuration: 2.0
    },
    maxStacks: 3,
    color: '#4169E1',
    icon: '⏰'
  },

  LAME_TOURNOYANTE: {
    id: 'lame_tournoyante',
    name: 'Lame Tournoyante',
    description: 'Dégâts de zone autour du vaisseau.',
    rarity: 'rare',
    effects: {
      orbitDamage: 5,
      orbitRadius: 80,
      orbitSpeed: 2.0
    },
    maxStacks: 4,
    color: '#FF00FF',
    icon: '🌀'
  },

  CRITIQUE_MORTEL: {
    id: 'critique_mortel',
    name: 'Critique Mortel',
    description: 'Critiques dévastateurs mais moins fréquents.',
    rarity: 'rare',
    effects: {
      critChance: -0.02,
      critMultiplier: 0.80
    },
    maxStacks: 3,
    color: '#DC143C',
    icon: '💀'
  },

  SURVIVANT: {
    id: 'survivant',
    name: 'Survivant',
    description: 'Bouclier et régénération quand blessé.',
    rarity: 'rare',
    effects: {
      lowHealthShield: 30,
      lowHealthRegen: 2.0,
      lowHealthThreshold: 0.30
    },
    maxStacks: 2,
    color: '#32CD32',
    icon: '🩹'
  },

  DOUBLE_TIR: {
    id: 'double_tir',
    name: 'Double Tir',
    description: 'Chance de tirer deux fois simultanément.',
    rarity: 'rare',
    effects: {
      doubleShotChance: 0.18,
      fireRateMultiplier: 0.10
    },
    maxStacks: 3,
    color: '#FF69B4',
    icon: '🎆'
  },

  // Epic (game-changing)
  ARSENAL_ORBITAL: {
    id: 'arsenal_orbital',
    name: 'Arsenal Orbital',
    description: 'Satellites armés tournent autour du vaisseau.',
    rarity: 'epic',
    effects: {
      orbitCount: 2,
      orbitDamage: 15,
      orbitRadius: 120,
      fireRateMultiplier: 0.15
    },
    maxStacks: 2,
    color: '#9400D3',
    icon: '🛸'
  },

  PHOENIX: {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Reviens à la vie une fois par vague.',
    rarity: 'epic',
    effects: {
      revive: 1,
      reviveHealth: 0.50,
      damageMultiplier: 0.20
    },
    maxStacks: 1,
    color: '#FF4500',
    icon: '🔥'
  },

  TEMPETE_PROJECTILES: {
    id: 'tempete_projectiles',
    name: 'Tempête de Projectiles',
    description: '+3 projectiles, cadence folle, dégâts réduits.',
    rarity: 'epic',
    effects: {
      projectileCount: 3,
      fireRateMultiplier: 0.40,
      damageMultiplier: -0.20
    },
    maxStacks: 2,
    color: '#FFD700',
    icon: '🌪️'
  },

  NEXUS_ENERGIE: {
    id: 'nexus_energie',
    name: 'Nexus d\'Énergie',
    description: 'Toutes les stats augmentent légèrement.',
    rarity: 'epic',
    effects: {
      damageMultiplier: 0.15,
      fireRateMultiplier: 0.15,
      speedMultiplier: 0.15,
      maxHealthMultiplier: 0.15,
      critChance: 0.05
    },
    maxStacks: 2,
    color: '#00FFFF',
    icon: '⭐'
  },

  DEVASTATION: {
    id: 'devastation',
    name: 'Dévastation',
    description: 'Énormes dégâts, pénétration, zone d\'effet.',
    rarity: 'epic',
    effects: {
      damageMultiplier: 0.50,
      piercing: 2,
      explosionChance: 0.25,
      explosionRadius: 60,
      fireRateMultiplier: -0.15
    },
    maxStacks: 1,
    color: '#8B0000',
    icon: '☄️'
  },

  GARDIEN: {
    id: 'gardien',
    name: 'Gardien',
    description: 'Bouclier massif et armure renforcée.',
    rarity: 'epic',
    effects: {
      shield: 100,
      shieldRegen: 5,
      armor: 5,
      maxHealthMultiplier: 0.30
    },
    maxStacks: 2,
    color: '#4169E1',
    icon: '🏰'
  },

  INSTINCT_TUEUR: {
    id: 'instinct_tueur',
    name: 'Instinct Tueur',
    description: 'Bonus massif sur kill: vitesse, dégâts, heal.',
    rarity: 'epic',
    effects: {
      killSpeedBoost: 0.20,
      killDamageBoost: 0.15,
      healOnKill: 5,
      killBoostDuration: 3.0
    },
    maxStacks: 2,
    color: '#FF1493',
    icon: '🗡️'
  },

  SURCHARGE_ARCANIQUE: {
    id: 'surcharge_arcanique',
    name: 'Surcharge Arcanique',
    description: 'Projectiles géants, lents mais dévastateurs.',
    rarity: 'epic',
    effects: {
      projectileSizeMultiplier: 2.0,
      damageMultiplier: 0.80,
      projectileSpeedMultiplier: -0.30,
      piercing: 3
    },
    maxStacks: 1,
    color: '#9400D3',
    icon: '🔮'
  },

  SIPHON_VITAL: {
    id: 'siphon_vital',
    name: 'Siphon Vital',
    description: 'Lifesteal extrême et régénération.',
    rarity: 'epic',
    effects: {
      lifesteal: 0.25,
      healthRegen: 2.0,
      maxHealthMultiplier: 0.20,
      damageMultiplier: 0.10
    },
    maxStacks: 2,
    color: '#DC143C',
    icon: '🩸'
  },

  MAITRE_TEMPS: {
    id: 'maitre_temps',
    name: 'Maître du Temps',
    description: 'Ralentit tous les ennemis proches.',
    rarity: 'epic',
    effects: {
      auraSlowAmount: 0.30,
      auraRadius: 200,
      dashCooldownReduction: 0.30,
      speedMultiplier: 0.20
    },
    maxStacks: 1,
    color: '#4682B4',
    icon: '⌛'
  },

  EXPLOSION_CHAIN: {
    id: 'explosion_chain',
    name: 'Réaction en Chaîne',
    description: 'Les ennemis explosent en mourant, infligeant des dégâts de zone.',
    rarity: 'rare',
    effects: {
      explosionOnKill: true,
      explosionRadius: 80,
      explosionDamage: 30
    },
    maxStacks: 3,
    color: '#FF4500',
    icon: '💥'
  },

  AIM_ASSIST: {
    id: 'aim_assist',
    name: 'Guidage Automatique',
    description: 'Vos projectiles suivent légèrement les ennemis.',
    rarity: 'rare',
    effects: {
      homingStrength: 0.3,
      rangeMultiplier: 0.15
    },
    maxStacks: 2,
    color: '#00CED1',
    icon: '🎯'
  },

  DASH_MASTERY: {
    id: 'dash_mastery',
    name: 'Maîtrise du Dash',
    description: 'Dash amélioré avec invincibilité.',
    rarity: 'rare',
    effects: {
      dashCooldownReduction: 0.25,
      dashDistance: 0.30,
      dashInvincibility: 0.5
    },
    maxStacks: 2,
    color: '#9370DB',
    icon: '⚡'
  },

  THORNS: {
    id: 'thorns',
    name: 'Épines',
    description: 'Renvoie des dégâts aux ennemis qui vous touchent.',
    rarity: 'uncommon',
    effects: {
      reflectDamage: 0.25,
      armor: 2
    },
    maxStacks: 4,
    color: '#8B4513',
    icon: '🌵'
  },

  SPEED_BURST: {
    id: 'speed_burst',
    name: 'Rafale de Vitesse',
    description: 'Gain de vitesse temporaire après un kill.',
    rarity: 'uncommon',
    effects: {
      speedBurstOnKill: 0.40,
      speedBurstDuration: 2.0
    },
    maxStacks: 3,
    color: '#32CD32',
    icon: '💨'
  },

  XP_MAGNET: {
    id: 'xp_magnet',
    name: 'Aimant d\'XP',
    description: 'Augmente considérablement la portée de collecte.',
    rarity: 'common',
    effects: {
      magnetRange: 150,
      xpMultiplier: 0.10
    },
    maxStacks: 3,
    color: '#FFD700',
    icon: '🧲'
  },

  BERSERKER: {
    id: 'berserker',
    name: 'Berserker',
    description: 'Plus de dégâts à faible santé.',
    rarity: 'rare',
    effects: {
      lowHealthDamageBonus: 0.50,
      lowHealthThreshold: 0.30
    },
    maxStacks: 2,
    color: '#8B0000',
    icon: '😡'
  },

  GLASS_CANNON: {
    id: 'glass_cannon',
    name: 'Canon de Verre',
    description: 'Énormes dégâts mais santé réduite.',
    rarity: 'epic',
    effects: {
      damageMultiplier: 0.60,
      fireRateMultiplier: 0.30,
      maxHealthMultiplier: -0.30
    },
    maxStacks: 1,
    color: '#FF1493',
    icon: '💎'
  },

  VAMPIRE_LORD: {
    id: 'vampire_lord',
    name: 'Seigneur Vampire',
    description: 'Lifesteal massif mais vitesse réduite.',
    rarity: 'epic',
    effects: {
      lifesteal: 0.35,
      maxHealthMultiplier: 0.40,
      speedMultiplier: -0.20,
      damageMultiplier: 0.15
    },
    maxStacks: 1,
    color: '#8B0000',
    icon: '🧛'
  },

  CRIT_MASTER: {
    id: 'crit_master',
    name: 'Maître Critique',
    description: 'Critique chance et dégâts augmentés.',
    rarity: 'rare',
    effects: {
      critChance: 0.15,
      critMultiplier: 0.50
    },
    maxStacks: 3,
    color: '#FFD700',
    icon: '⭐'
  },

  RAPID_FIRE: {
    id: 'rapid_fire',
    name: 'Tir Rapide',
    description: 'Cadence de tir drastiquement augmentée.',
    rarity: 'uncommon',
    effects: {
      fireRateMultiplier: 0.35,
      overheatReduction: -0.15
    },
    maxStacks: 4,
    color: '#FF6347',
    icon: '🔫'
  },

  PENETRATING_SHOTS: {
    id: 'penetrating_shots',
    name: 'Tirs Pénétrants',
    description: 'Vos projectiles traversent les ennemis.',
    rarity: 'rare',
    effects: {
      piercing: 2,
      damageMultiplier: 0.20
    },
    maxStacks: 2,
    color: '#4169E1',
    icon: '➡️'
  },

  SHIELD_GENERATOR: {
    id: 'shield_generator',
    name: 'Générateur de Bouclier',
    description: 'Régénère un bouclier périodique.',
    rarity: 'rare',
    effects: {
      shieldAmount: 25,
      shieldRegenTime: 10.0,
      maxHealthMultiplier: 0.15
    },
    maxStacks: 2,
    color: '#00BFFF',
    icon: '🛡️'
  },

  MULTISHOT: {
    id: 'multishot',
    name: 'Tir Multiple',
    description: 'Tire plusieurs projectiles à la fois.',
    rarity: 'epic',
    effects: {
      extraProjectiles: 2,
      damageMultiplier: -0.15,
      fireRateMultiplier: -0.10
    },
    maxStacks: 2,
    color: '#FF69B4',
    icon: '🔷'
  },

  SLOW_AURA: {
    id: 'slow_aura',
    name: 'Aura Ralentissante',
    description: 'Les ennemis proches sont ralentis.',
    rarity: 'uncommon',
    effects: {
      auraSlowAmount: 0.20,
      auraRadius: 150
    },
    maxStacks: 3,
    color: '#4682B4',
    icon: '❄️'
  },

  LUCKY_CLOVER: {
    id: 'lucky_clover',
    name: 'Trèfle Porte-Bonheur',
    description: 'Augmente votre chance pour les drops et critiques.',
    rarity: 'uncommon',
    effects: {
      luck: 15,
      critChance: 0.05,
      xpMultiplier: 0.15
    },
    maxStacks: 4,
    color: '#00FF00',
    icon: '🍀'
  },

  ENERGY_SHIELD: {
    id: 'energy_shield',
    name: 'Bouclier Énergétique',
    description: 'Absorbe les dégâts périodiquement.',
    rarity: 'rare',
    effects: {
      damageAbsorption: 0.15,
      armor: 5
    },
    maxStacks: 2,
    color: '#00FFFF',
    icon: '🔵'
  },

  RAGE_MODE: {
    id: 'rage_mode',
    name: 'Mode Rage',
    description: 'Les kills augmentent temporairement les dégâts.',
    rarity: 'rare',
    effects: {
      rageStackDamage: 0.08,
      rageMaxStacks: 10,
      rageDuration: 5.0
    },
    maxStacks: 2,
    color: '#DC143C',
    icon: '😤'
  },

  DODGE_MASTER: {
    id: 'dodge_master',
    name: 'Maître de l\'Esquive',
    description: 'Chance d\'esquiver complètement les dégâts.',
    rarity: 'epic',
    effects: {
      dodgeChance: 0.15,
      speedMultiplier: 0.20
    },
    maxStacks: 2,
    color: '#9370DB',
    icon: '👻'
  },

  OVERCHARGE: {
    id: 'overcharge',
    name: 'Surcharge',
    description: 'Les dégâts augmentent avec la surchauffe.',
    rarity: 'rare',
    effects: {
      overheatDamageBonus: 0.50,
      overheatReduction: 0.20
    },
    maxStacks: 2,
    color: '#FF8C00',
    icon: '🔥'
  }
};

/**
 * Get passive data by ID
 * @param {string} passiveId - Passive identifier
 * @returns {PassiveData|null}
 */
function getPassiveData(passiveId) {
  return PASSIVES[passiveId.toUpperCase()] || null;
}

/**
 * Calculate total effects from multiple passive stacks
 * @param {Array<{id: string, stacks: number}>} passives - Array of passive IDs with stack counts
 * @returns {PassiveEffects}
 */
function calculateTotalEffects(passives) {
  const totalEffects = {};

  for (const passive of passives) {
    const data = getPassiveData(passive.id);
    if (!data) continue;

    const stacks = Math.min(passive.stacks, data.maxStacks);
    
    for (const [effect, value] of Object.entries(data.effects)) {
      if (!totalEffects[effect]) {
        totalEffects[effect] = 0;
      }
      totalEffects[effect] += value * stacks;
    }
  }

  return totalEffects;
}

/**
 * Get rarity weight for passive selection
 * @param {string} rarity - Rarity tier
 * @param {number} luck - Player luck stat
 * @returns {number}
 */
function getRarityWeight(rarity, luck = 0) {
  const baseWeights = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 5
  };

  const weight = baseWeights[rarity] || 0;
  
  // Luck shifts weights towards rarer items
  if (rarity === 'common') {
    return Math.max(10, weight - luck * 20);
  } else if (rarity === 'uncommon') {
    return weight + luck * 10;
  } else if (rarity === 'rare') {
    return weight + luck * 15;
  } else if (rarity === 'epic') {
    return weight + luck * 25;
  }
  
  return weight;
}

/**
 * Get random passive based on rarity weights and luck
 * @param {number} luck - Player luck stat
 * @param {Array<string>} exclude - Passive IDs to exclude
 * @returns {PassiveData|null}
 */
function getRandomPassive(luck = 0, exclude = []) {
  const available = Object.values(PASSIVES).filter(
    p => !exclude.includes(p.id)
  );

  if (available.length === 0) return null;

  const weights = available.map(p => getRarityWeight(p.rarity, luck));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < available.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return available[i];
    }
  }

  return available[available.length - 1];
}

// Export to global namespace
const PassiveData = {
  PASSIVES,
  getPassiveData,
  calculateTotalEffects,
  getRarityWeight,
  getRandomPassive
};

if (typeof window !== 'undefined') {
  window.PassiveData = PassiveData;
}
