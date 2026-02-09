/**
 * @fileoverview Enemy data definitions for Space InZader
 * Defines all enemy types with stats, behaviors, and spawn parameters
 */

/**
 * @typedef {Object} AttackPattern
 * @property {string} type - Attack type (none/shoot/melee/special)
 * @property {number} [damage] - Attack damage
 * @property {number} [cooldown] - Attack cooldown in seconds
 * @property {number} [range] - Attack range
 * @property {number} [projectileSpeed] - Speed of projectile attacks
 * @property {string} [projectileColor] - Color of projectiles
 */

/**
 * @typedef {Object} EnemyData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {number} health - Base health points
 * @property {number} damage - Contact damage
 * @property {number} speed - Movement speed
 * @property {number} xpValue - XP dropped on death
 * @property {string} aiType - AI behavior type
 * @property {number} size - Enemy radius/size
 * @property {string} color - Primary color (neon)
 * @property {string} secondaryColor - Secondary color
 * @property {number} spawnCost - Cost for director system
 * @property {AttackPattern} attackPattern - Attack behavior
 * @property {number} [armor] - Damage reduction
 * @property {number} [splitCount] - Number of enemies spawned on death
 * @property {string} [splitType] - Type of enemy spawned on death
 */

const ENEMIES = {
  DRONE_BASIQUE: {
    id: 'drone_basique',
    name: 'Drone Basique',
    health: 20,
    damage: 10,
    speed: 100,
    xpValue: 5,
    aiType: 'chase',
    size: 12,
    color: '#FF1493',
    secondaryColor: '#FF69B4',
    spawnCost: 1,
    attackPattern: {
      type: 'none'
    },
    armor: 0
  },

  CHASSEUR_RAPIDE: {
    id: 'chasseur_rapide',
    name: 'Chasseur Rapide',
    health: 12,
    damage: 15,
    speed: 180,
    xpValue: 8,
    aiType: 'weave',
    size: 10,
    color: '#00FF00',
    secondaryColor: '#32CD32',
    spawnCost: 2,
    attackPattern: {
      type: 'none'
    },
    armor: 0
  },

  TANK: {
    id: 'tank',
    name: 'Tank',
    health: 80,
    damage: 20,
    speed: 60,
    xpValue: 15,
    aiType: 'chase',
    size: 20,
    color: '#4169E1',
    secondaryColor: '#6495ED',
    spawnCost: 5,
    attackPattern: {
      type: 'none'
    },
    armor: 5
  },

  TIREUR: {
    id: 'tireur',
    name: 'Tireur',
    health: 25,
    damage: 8,
    speed: 80,
    xpValue: 12,
    aiType: 'kite',
    size: 11,
    color: '#FFD700',
    secondaryColor: '#FFA500',
    spawnCost: 3,
    attackPattern: {
      type: 'shoot',
      damage: 12,
      cooldown: 2.0,
      range: 300,
      projectileSpeed: 250,
      projectileColor: '#FFFF00'
    },
    armor: 0
  },

  ELITE: {
    id: 'elite',
    name: 'Élite',
    health: 150,
    damage: 25,
    speed: 120,
    xpValue: 40,
    aiType: 'aggressive',
    size: 18,
    color: '#FF4500',
    secondaryColor: '#FF6347',
    spawnCost: 12,
    attackPattern: {
      type: 'shoot',
      damage: 20,
      cooldown: 1.5,
      range: 250,
      projectileSpeed: 300,
      projectileColor: '#FF0000'
    },
    armor: 3,
    splitCount: 2,
    splitType: 'drone_basique'
  },

  BOSS: {
    id: 'boss',
    name: 'Boss',
    health: 1000,
    damage: 40,
    speed: 90,
    xpValue: 200,
    aiType: 'boss',
    size: 40,
    color: '#DC143C',
    secondaryColor: '#8B0000',
    spawnCost: 100,
    attackPattern: {
      type: 'special',
      damage: 30,
      cooldown: 0.8,
      range: 400,
      projectileSpeed: 350,
      projectileColor: '#FF00FF'
    },
    armor: 10,
    splitCount: 5,
    splitType: 'elite'
  },

  TANK_BOSS: {
    id: 'tank_boss',
    name: 'Tank Boss',
    health: 2500,
    damage: 60,
    speed: 50,
    xpValue: 300,
    aiType: 'chase',
    size: 50,
    color: '#4169E1',
    secondaryColor: '#1E3A8A',
    spawnCost: 150,
    attackPattern: {
      type: 'melee',
      damage: 80,
      cooldown: 2.0,
      range: 60
    },
    armor: 25,
    splitCount: 8,
    splitType: 'tank'
  },

  SWARM_BOSS: {
    id: 'swarm_boss',
    name: 'Swarm Boss',
    health: 800,
    damage: 25,
    speed: 120,
    xpValue: 250,
    aiType: 'weave',
    size: 35,
    color: '#00FF00',
    secondaryColor: '#008000',
    spawnCost: 120,
    attackPattern: {
      type: 'shoot',
      damage: 20,
      cooldown: 0.5,
      range: 350,
      projectileSpeed: 300,
      projectileColor: '#00FF00'
    },
    armor: 5,
    splitCount: 15,
    splitType: 'chasseur_rapide'
  },

  SNIPER_BOSS: {
    id: 'sniper_boss',
    name: 'Sniper Boss',
    health: 1200,
    damage: 30,
    speed: 80,
    xpValue: 280,
    aiType: 'kite',
    size: 38,
    color: '#FFD700',
    secondaryColor: '#B8860B',
    spawnCost: 130,
    attackPattern: {
      type: 'shoot',
      damage: 50,
      cooldown: 1.5,
      range: 600,
      projectileSpeed: 500,
      projectileColor: '#FFFF00'
    },
    armor: 8,
    splitCount: 6,
    splitType: 'tireur'
  },

  // New Enemy Variants
  EXPLOSIF: {
    id: 'explosif',
    name: 'Drone Explosif',
    health: 15,
    damage: 30, // High contact damage
    speed: 150,
    xpValue: 10,
    aiType: 'kamikaze',
    size: 14,
    color: '#FF6600',
    secondaryColor: '#FF3300',
    spawnCost: 3,
    attackPattern: {
      type: 'explode',
      damage: 40,
      explosionRadius: 80,
      explosionColor: '#FF4500'
    },
    armor: 0,
    isExplosive: true // Flag for explosion on death
  },

  TIREUR_LOURD: {
    id: 'tireur_lourd',
    name: 'Tireur Lourd',
    health: 45,
    damage: 15,
    speed: 60,
    xpValue: 18,
    aiType: 'kite',
    size: 15,
    color: '#8B4513',
    secondaryColor: '#A0522D',
    spawnCost: 5,
    attackPattern: {
      type: 'shoot',
      damage: 25,
      cooldown: 2.5,
      range: 400,
      projectileSpeed: 200,
      projectileColor: '#FF8C00'
    },
    armor: 3
  },

  DEMON_VITESSE: {
    id: 'demon_vitesse',
    name: 'Démon de Vitesse',
    health: 8,
    damage: 25,
    speed: 250,
    xpValue: 15,
    aiType: 'aggressive',
    size: 9,
    color: '#00FFFF',
    secondaryColor: '#00CED1',
    spawnCost: 4,
    attackPattern: {
      type: 'none'
    },
    armor: 0
  },

  TOURELLE: {
    id: 'tourelle',
    name: 'Tourelle',
    health: 60,
    damage: 5,
    speed: 0, // Stationary
    xpValue: 20,
    aiType: 'stationary',
    size: 18,
    color: '#696969',
    secondaryColor: '#808080',
    spawnCost: 6,
    attackPattern: {
      type: 'shoot',
      damage: 18,
      cooldown: 1.2,
      range: 500,
      projectileSpeed: 400,
      projectileColor: '#FFA500'
    },
    armor: 5
  }
};

/**
 * AI behavior configurations
 */
const AI_BEHAVIORS = {
  chase: {
    description: 'Direct pursuit of player',
    updateInterval: 0.1,
    predictionFactor: 0.0
  },
  weave: {
    description: 'Zigzag movement towards player',
    updateInterval: 0.15,
    weaveAmplitude: 50,
    weaveFrequency: 3
  },
  kite: {
    description: 'Maintain distance and shoot',
    updateInterval: 0.2,
    minDistance: 200,
    maxDistance: 350
  },
  aggressive: {
    description: 'Fast pursuit with prediction',
    updateInterval: 0.08,
    predictionFactor: 0.5
  },
  boss: {
    description: 'Complex multi-phase behavior',
    updateInterval: 0.05,
    phases: [
      { healthThreshold: 1.0, pattern: 'chase' },
      { healthThreshold: 0.66, pattern: 'shoot_spiral' },
      { healthThreshold: 0.33, pattern: 'enrage' }
    ]
  },
  kamikaze: {
    description: 'Rush directly at player for suicide attack',
    updateInterval: 0.05,
    predictionFactor: 0.3,
    speedBoost: 1.2 // Gets faster as it approaches
  },
  stationary: {
    description: 'Stays in place and shoots',
    updateInterval: 0.3,
    rotationSpeed: 2.0
  }
};

/**
 * Spawn wave configurations for director system
 */
const SPAWN_WAVES = {
  early: {
    timeRange: [0, 300], // 0-5 minutes
    budgetPerSecond: 3, // Increased from 2
    enemyPool: ['drone_basique', 'chasseur_rapide', 'explosif', 'demon_vitesse'],
    spawnInterval: 1.5 // Reduced from 2.0 for more frequent spawns
  },
  mid: {
    timeRange: [300, 600], // 5-10 minutes
    budgetPerSecond: 5, // Increased from 4
    enemyPool: ['drone_basique', 'chasseur_rapide', 'tireur', 'tank', 'explosif', 'tireur_lourd', 'demon_vitesse'],
    spawnInterval: 1.2 // Reduced from 1.5
  },
  late: {
    timeRange: [600, 1200], // 10-20 minutes
    budgetPerSecond: 10, // Increased from 8
    enemyPool: ['chasseur_rapide', 'tireur', 'tank', 'elite', 'tireur_lourd', 'tourelle', 'demon_vitesse'],
    spawnInterval: 0.9 // Reduced from 1.0
  },
  endgame: {
    timeRange: [1200, 9999], // 20+ minutes
    budgetPerSecond: 18, // Increased from 15
    enemyPool: ['tank', 'elite', 'boss', 'tireur_lourd', 'tourelle'],
    spawnInterval: 0.7 // Reduced from 0.8
  }
};

/**
 * Get enemy data by ID
 * @param {string} enemyId - Enemy identifier
 * @returns {EnemyData|null}
 */
function getEnemyData(enemyId) {
  return ENEMIES[enemyId.toUpperCase()] || null;
}

/**
 * Scale enemy stats based on time/difficulty
 * @param {EnemyData} enemyData - Base enemy data
 * @param {number} gameTime - Current game time in seconds
 * @param {number} difficultyMultiplier - Additional difficulty scaling
 * @returns {EnemyData}
 */
function scaleEnemyStats(enemyData, gameTime, difficultyMultiplier = 1.0) {
  const timeFactor = 1 + (gameTime / 300) * 0.3; // +30% every 5 minutes
  const scaling = timeFactor * difficultyMultiplier;

  return {
    ...enemyData,
    health: Math.floor(enemyData.health * scaling),
    damage: Math.floor(enemyData.damage * scaling),
    xpValue: Math.floor(enemyData.xpValue * timeFactor), // XP scales with time only
    attackPattern: enemyData.attackPattern.damage ? {
      ...enemyData.attackPattern,
      damage: Math.floor(enemyData.attackPattern.damage * scaling)
    } : enemyData.attackPattern
  };
}

/**
 * Get current wave configuration based on game time
 * @param {number} gameTime - Current game time in seconds
 * @returns {Object}
 */
function getCurrentWave(gameTime) {
  for (const [key, wave] of Object.entries(SPAWN_WAVES)) {
    if (gameTime >= wave.timeRange[0] && gameTime < wave.timeRange[1]) {
      return { key, ...wave };
    }
  }
  return SPAWN_WAVES.endgame;
}

/**
 * Select enemies to spawn based on available budget
 * @param {number} budget - Available spawn budget
 * @param {Array<string>} enemyPool - Available enemy types
 * @param {number} gameTime - Current game time
 * @returns {Array<string>}
 */
function selectEnemySpawn(budget, enemyPool, gameTime) {
  const enemies = [];
  let remainingBudget = budget;

  // Sort pool by spawn cost (descending) for efficient budget use
  const sortedPool = enemyPool
    .map(id => ({ id, cost: getEnemyData(id).spawnCost }))
    .sort((a, b) => b.cost - a.cost);

  while (remainingBudget > 0) {
    // Find affordable enemies
    const affordable = sortedPool.filter(e => e.cost <= remainingBudget);
    
    if (affordable.length === 0) break;

    // Weighted random selection (prefer cheaper enemies)
    const weights = affordable.map((e, i) => affordable.length - i);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    let selected = null;
    
    for (let i = 0; i < affordable.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selected = affordable[i];
        break;
      }
    }

    if (selected) {
      enemies.push(selected.id);
      remainingBudget -= selected.cost;
    } else {
      break;
    }
  }

  return enemies;
}

/**
 * Calculate spawn position on screen edge
 * @param {number} playerX - Player X position
 * @param {number} playerY - Player Y position
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {{x: number, y: number}}
 */
function getSpawnPosition(playerX, playerY, screenWidth, screenHeight) {
  const margin = 50;
  const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left

  switch (edge) {
    case 0: // Top
      return {
        x: playerX + (Math.random() - 0.5) * screenWidth,
        y: playerY - screenHeight / 2 - margin
      };
    case 1: // Right
      return {
        x: playerX + screenWidth / 2 + margin,
        y: playerY + (Math.random() - 0.5) * screenHeight
      };
    case 2: // Bottom
      return {
        x: playerX + (Math.random() - 0.5) * screenWidth,
        y: playerY + screenHeight / 2 + margin
      };
    case 3: // Left
      return {
        x: playerX - screenWidth / 2 - margin,
        y: playerY + (Math.random() - 0.5) * screenHeight
      };
    default:
      return { x: playerX, y: playerY };
  }
}

// Export to global namespace
const EnemyData = {
  ENEMIES,
  AI_BEHAVIORS,
  SPAWN_WAVES,
  getEnemyData,
  scaleEnemyStats,
  getCurrentWave,
  selectEnemySpawn,
  getSpawnPosition
};

if (typeof window !== 'undefined') {
  window.EnemyData = EnemyData;
}
