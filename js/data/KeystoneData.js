/**
 * @fileoverview Keystone passive data definitions for Space InZader
 * Keystones are unique, powerful passives tied to specific ship classes
 */

/**
 * @typedef {Object} KeystoneEffect
 * @property {string} type - Effect type (e.g., 'stacking_on_hit', 'fire_rate_damage_link')
 * @property {number} [stackValue] - Value per stack
 * @property {number} [maxStacks] - Maximum stacks
 * @property {number} [resetDelayMs] - Delay before stacks reset
 * @property {number} [damageBonus] - Damage bonus multiplier
 * @property {number} [overheatMultiplier] - Overheat penalty multiplier
 * @property {number} [damageReduction] - Damage reduction when active
 * @property {number} [explosionBonus] - Explosion radius bonus
 * @property {number} [stationaryDelayMs] - Delay to activate when stationary
 * @property {number} [damagePerHit] - Damage increase per consecutive hit
 * @property {number} [maxHits] - Maximum consecutive hits
 * @property {number} [damagePerSummon] - Damage per summon
 * @property {number} [rangePerSummon] - Range per summon
 * @property {number} [maxSummons] - Max summons to count
 * @property {number} [hpThreshold] - HP threshold to activate
 * @property {number} [damageMultiplier] - Damage multiplier when active
 * @property {number} [speedMultiplier] - Speed multiplier when active
 */

/**
 * @typedef {Object} KeystoneData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Effect description
 * @property {string} rarity - Always 'epic' for keystones
 * @property {string[]} tags - Category tags
 * @property {boolean} uniquePerRun - Can only be obtained once per run
 * @property {string[]} classOnly - Ship classes that can obtain this
 * @property {KeystoneEffect} effect - Keystone effect definition
 * @property {string} color - Display color
 * @property {string} icon - Icon character
 */

const KEYSTONES = {
    blood_frenzy: {
        id: 'blood_frenzy',
        name: 'Blood Frenzy',
        description: 'Each hit grants +0.5% lifesteal (max 40 stacks). Resets after 3s without hitting.',
        rarity: 'epic',
        tags: ['vampire', 'on_hit'],
        uniquePerRun: true,
        classOnly: ['vampire'],
        effect: {
            type: 'stacking_on_hit',
            stackValue: 0.005,
            maxStacks: 40,
            resetDelayMs: 3000
        },
        color: '#DC143C',
        icon: '🩸'
    },
    
    overclock_core: {
        id: 'overclock_core',
        name: 'Overclock Core',
        description: '+35% damage per fire rate bonus. 35% more overheat.',
        rarity: 'epic',
        tags: ['fire_rate', 'heat', 'glass_cannon'],
        uniquePerRun: true,
        classOnly: ['mitrailleur'],
        effect: {
            type: 'fire_rate_damage_link',
            damageBonus: 0.35,
            overheatMultiplier: 1.35
        },
        color: '#FFD700',
        icon: '⚡'
    },
    
    fortress_mode: {
        id: 'fortress_mode',
        name: 'Fortress Mode',
        description: 'When stationary for 700ms: -50% damage taken, +25% explosion radius.',
        rarity: 'epic',
        tags: ['armor', 'aoe', 'utility'],
        uniquePerRun: true,
        classOnly: ['tank'],
        effect: {
            type: 'stationary_buff',
            damageReduction: 0.5,
            explosionBonus: 0.25,
            stationaryDelayMs: 700
        },
        color: '#00BFFF',
        icon: '🛡️'
    },
    
    dead_eye: {
        id: 'dead_eye',
        name: 'Dead Eye',
        description: '+15% damage per consecutive hit (max 8). Reset on miss.',
        rarity: 'epic',
        tags: ['crit', 'range', 'precision'],
        uniquePerRun: true,
        classOnly: ['sniper'],
        effect: {
            type: 'streak_no_miss',
            damagePerHit: 0.15,
            maxHits: 8
        },
        color: '#9370DB',
        icon: '🎯'
    },
    
    machine_network: {
        id: 'machine_network',
        name: 'Machine Network',
        description: '+6% damage and +5% range per summon (max 10).',
        rarity: 'epic',
        tags: ['summon', 'turret', 'utility'],
        uniquePerRun: true,
        classOnly: ['engineer'],
        effect: {
            type: 'summon_network',
            damagePerSummon: 0.06,
            rangePerSummon: 0.05,
            maxSummons: 10
        },
        color: '#00FF88',
        icon: '🤖'
    },
    
    rage_engine: {
        id: 'rage_engine',
        name: 'Rage Engine',
        description: 'When HP < 30%: 2x damage, 1.3x speed.',
        rarity: 'epic',
        tags: ['berserk', 'glass_cannon', 'speed'],
        uniquePerRun: true,
        classOnly: ['berserker'],
        effect: {
            type: 'hp_threshold',
            hpThreshold: 0.3,
            damageMultiplier: 2.0,
            speedMultiplier: 1.3
        },
        color: '#FF4444',
        icon: '💢'
    }
};

/**
 * Get keystone data by ID
 * @param {string} keystoneId - Keystone identifier
 * @returns {KeystoneData|null}
 */
function getKeystone(keystoneId) {
    return KEYSTONES[keystoneId] || null;
}

/**
 * Get all keystones
 * @returns {KeystoneData[]}
 */
function getAllKeystones() {
    return Object.values(KEYSTONES);
}

/**
 * Get keystone for a specific ship class
 * @param {string} classId - Ship class identifier
 * @returns {KeystoneData|null}
 */
function getKeystoneForClass(classId) {
    return getAllKeystones().find(k => 
        k.classOnly && k.classOnly.includes(classId)
    ) || null;
}

/**
 * Check if keystone is available for class
 * @param {string} keystoneId - Keystone identifier
 * @param {string} classId - Ship class identifier
 * @returns {boolean}
 */
function isKeystoneAvailableForClass(keystoneId, classId) {
    const keystone = getKeystone(keystoneId);
    if (!keystone) return false;
    return keystone.classOnly.includes(classId);
}

// Export to global namespace
const KeystoneData = {
    KEYSTONES,
    getKeystone,
    getAllKeystones,
    getKeystoneForClass,
    isKeystoneAvailableForClass
};

if (typeof window !== 'undefined') {
    window.KeystoneData = KeystoneData;
}
