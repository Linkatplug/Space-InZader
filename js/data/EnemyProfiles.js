/**
 * @fileoverview Enemy profiles for the new defense system
 * Defines enemy defense layers and weaknesses
 */

/**
 * Enemy profile structure with 3-layer defense
 * @typedef {Object} EnemyProfile
 * @property {string} id - Enemy identifier
 * @property {string} name - Display name
 * @property {Object} defense - Defense layer values
 * @property {string} weakness - Primary damage type weakness
 * @property {string} attackDamageType - Damage type of enemy attacks
 */

const ENEMY_PROFILES = {
    SCOUT_DRONE: {
        id: 'scout_drone',
        name: 'Scout Drone',
        defense: {
            shield: 100,     // Reduced from 150 for early game
            armor: 35,       // Reduced from 50
            structure: 45    // Reduced from 60
        },
        weakness: 'kinetic', // Weak armor
        attackDamageType: 'em',
        speed: 120,
        xpValue: 5,
        aiType: 'chase',
        size: 12,
        color: '#FF1493',
        secondaryColor: '#FF69B4',
        spawnCost: 1
    },
    
    ARMORED_CRUISER: {
        id: 'armored_cruiser',
        name: 'Armored Cruiser',
        defense: {
            shield: 40,
            armor: 300,
            structure: 150
        },
        weakness: 'explosive', // Weak to explosive
        attackDamageType: 'kinetic',
        speed: 70,
        xpValue: 20,
        aiType: 'chase',
        size: 20,
        color: '#4169E1',
        secondaryColor: '#6495ED',
        spawnCost: 6
    },
    
    PLASMA_ENTITY: {
        id: 'plasma_entity',
        name: 'Plasma Entity',
        defense: {
            shield: 80,
            armor: 40,
            structure: 200
        },
        weakness: 'thermal', // Weak structure to thermal
        attackDamageType: 'thermal',
        speed: 90,
        xpValue: 18,
        aiType: 'weave',
        size: 15,
        color: '#FF8C00',
        secondaryColor: '#FFA500',
        spawnCost: 5
    },
    
    SIEGE_HULK: {
        id: 'siege_hulk',
        name: 'Siege Hulk',
        defense: {
            shield: 60,
            armor: 250,
            structure: 300
        },
        weakness: 'explosive', // Weak to explosive
        attackDamageType: 'explosive',
        speed: 50,
        xpValue: 30,
        aiType: 'slow_advance',
        size: 25,
        color: '#8B0000',
        secondaryColor: '#A52A2A',
        spawnCost: 10
    },
    
    INTERCEPTOR: {
        id: 'interceptor',
        name: 'Interceptor',
        defense: {
            shield: 120,
            armor: 70,
            structure: 80
        },
        weakness: 'none', // Balanced - no specific weakness
        attackDamageType: 'em',
        speed: 180,
        xpValue: 12,
        aiType: 'strafe',
        size: 10,
        color: '#00FF00',
        secondaryColor: '#32CD32',
        spawnCost: 3
    },
    
    // Boss variants
    ELITE_DESTROYER: {
        id: 'elite_destroyer',
        name: 'Elite Destroyer',
        defense: {
            shield: 300,
            armor: 400,
            structure: 500
        },
        weakness: 'explosive',
        attackDamageType: 'kinetic',
        speed: 80,
        xpValue: 100,
        aiType: 'boss',
        size: 35,
        color: '#FFD700',
        secondaryColor: '#FFA500',
        spawnCost: 50,
        isBoss: true
    },
    
    VOID_CARRIER: {
        id: 'void_carrier',
        name: 'Void Carrier',
        defense: {
            shield: 500,
            armor: 300,
            structure: 400
        },
        weakness: 'em',
        attackDamageType: 'explosive',
        speed: 60,
        xpValue: 150,
        aiType: 'boss',
        size: 40,
        color: '#9400D3',
        secondaryColor: '#8B008B',
        spawnCost: 75,
        isBoss: true
    }
};

/**
 * Get total HP for an enemy
 * @param {Object} enemyProfile - Enemy profile data
 * @returns {number} Total HP across all layers
 */
function getEnemyTotalHP(enemyProfile) {
    return enemyProfile.defense.shield + 
           enemyProfile.defense.armor + 
           enemyProfile.defense.structure;
}

/**
 * Get enemy resistance indicator for a damage type
 * @param {Object} enemyProfile - Enemy profile
 * @param {string} damageType - Damage type to check
 * @returns {string} 'weak', 'normal', or 'resistant'
 */
function getEnemyResistanceIndicator(enemyProfile, damageType) {
    if (enemyProfile.weakness === damageType) {
        return 'weak';
    }
    
    // Check if enemy has high defense in layers that resist this damage type
    // This is a simplified heuristic
    if (enemyProfile.defense.armor > 200 && damageType === 'kinetic') {
        return 'resistant';
    }
    if (enemyProfile.defense.shield > 200 && damageType === 'em') {
        return 'resistant';
    }
    if (enemyProfile.defense.structure > 200 && damageType === 'thermal') {
        return 'resistant';
    }
    
    return 'normal';
}

/**
 * Create defense component for an enemy
 * @param {Object} enemyProfile - Enemy profile
 * @returns {Object} Defense component
 */
function createEnemyDefense(enemyProfile) {
    // Use the standard resistance tables from DefenseData
    const shieldResistances = { em: 0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 };
    const armorResistances = { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 };
    const structureResistances = { em: 0.3, thermal: 0, kinetic: 0.15, explosive: 0.2 };
    
    return {
        shield: {
            current: enemyProfile.defense.shield,
            max: enemyProfile.defense.shield,
            regen: 0,
            regenDelay: 0,
            regenDelayMax: 0,
            resistances: shieldResistances
        },
        armor: {
            current: enemyProfile.defense.armor,
            max: enemyProfile.defense.armor,
            regen: 0,
            regenDelay: 0,
            regenDelayMax: 0,
            resistances: armorResistances
        },
        structure: {
            current: enemyProfile.defense.structure,
            max: enemyProfile.defense.structure,
            regen: 0,
            regenDelay: 0,
            regenDelayMax: 0,
            resistances: structureResistances
        }
    };
}

// ========== GLOBAL EXPOSURE ==========
// Expose to window for passive loading
if (typeof window !== 'undefined') {
    window.EnemyProfiles = {
        PROFILES: ENEMY_PROFILES,
        createEnemyDefense: createEnemyDefense
    };
    
    // Console log confirmation
    const profileCount = Object.keys(ENEMY_PROFILES).length;
    console.log(`[Content] Enemy profiles loaded: ${profileCount}`);
}
