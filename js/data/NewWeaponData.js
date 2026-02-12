/**
 * @fileoverview New weapon data for Space InZader
 * 24 weapons divided into 4 damage types: EM, Thermal, Kinetic, Explosive
 */

/**
 * Weapon data structure for new system
 * @typedef {Object} NewWeaponData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Weapon description
 * @property {number} damage - Base damage per shot
 * @property {number} fireRate - Shots per second
 * @property {number} heat - Heat generated per shot
 * @property {string} damageType - Damage type: em, thermal, kinetic, explosive
 * @property {string[]} tags - Weapon tags for synergies
 * @property {string} role - Role description
 * @property {string} rarity - Rarity level
 * @property {string} color - Visual color
 * @property {string} type - Weapon behavior type
 */

const NEW_WEAPONS = {
    // ========== EM WEAPONS (6) ==========
    ION_BLASTER: {
        id: 'ion_blaster',
        name: 'Ion Blaster',
        description: 'Rapid-fire anti-shield weapon. Excellent against shields.',
        damage: 22,
        fireRate: 3.0,
        heat: 4,
        damageType: 'em',
        tags: ['em', 'ballistic', 'rapid'],
        role: 'Anti-Shield DPS',
        rarity: 'common',
        color: '#00FFFF',
        type: 'direct',
        projectileSpeed: 800,
        maxLevel: 5
    },
    
    EMP_PULSE: {
        id: 'emp_pulse',
        name: 'EMP Pulse',
        description: 'High-damage electromagnetic pulse with area effect.',
        damage: 60,
        fireRate: 0.8,
        heat: 15,
        damageType: 'em',
        tags: ['em', 'area', 'burst'],
        role: 'Shield Burst',
        rarity: 'uncommon',
        color: '#0099FF',
        type: 'pulse',
        areaRadius: 100,
        maxLevel: 5
    },
    
    ARC_DISRUPTOR: {
        id: 'arc_disruptor',
        name: 'Arc Disruptor',
        description: 'Lightning that chains between enemies.',
        damage: 18,
        fireRate: 2.2,
        heat: 6,
        damageType: 'em',
        tags: ['em', 'chain', 'control'],
        role: 'Shield Chaining',
        rarity: 'uncommon',
        color: '#66CCFF',
        type: 'chain',
        chainCount: 3,
        maxLevel: 5
    },
    
    DISRUPTOR_BEAM: {
        id: 'disruptor_beam',
        name: 'Disruptor Beam',
        description: 'Continuous EM beam that drains shields.',
        damage: 12,
        fireRate: 12.0,
        heat: 10,
        damageType: 'em',
        tags: ['em', 'beam', 'continuous'],
        role: 'Continuous Shield Drain',
        rarity: 'rare',
        color: '#33DDFF',
        type: 'beam',
        maxLevel: 5
    },
    
    EM_DRONE_WING: {
        id: 'em_drone_wing',
        name: 'EM Drone Wing',
        description: 'Deploys drones that fire EM bolts.',
        damage: 30,
        fireRate: 1.2,
        heat: 8,
        damageType: 'em',
        tags: ['em', 'drone', 'summon'],
        role: 'Shield Pressure',
        rarity: 'rare',
        color: '#00CCEE',
        type: 'drone',
        droneCount: 2,
        maxLevel: 5
    },
    
    OVERLOAD_MISSILE: {
        id: 'overload_missile',
        name: 'Overload Missile',
        description: 'Heavy EM missile with AoE burst.',
        damage: 80,
        fireRate: 0.6,
        heat: 18,
        damageType: 'em',
        tags: ['em', 'missile', 'area', 'burst'],
        role: 'Shield Burst AoE',
        rarity: 'epic',
        color: '#0088FF',
        type: 'homing',
        areaRadius: 120,
        maxLevel: 5
    },
    
    // ========== THERMAL WEAPONS (6) ==========
    SOLAR_FLARE: {
        id: 'solar_flare',
        name: 'Solar Flare',
        description: 'Fire projectile that leaves burning area.',
        damage: 14,
        fireRate: 2.5,
        heat: 6,
        damageType: 'thermal',
        tags: ['thermal', 'area', 'dot'],
        role: 'Burn DoT',
        rarity: 'common',
        color: '#FF8C00',
        type: 'projectile',
        areaRadius: 80,
        dotDuration: 2,
        maxLevel: 5
    },
    
    PLASMA_STREAM: {
        id: 'plasma_stream',
        name: 'Plasma Stream',
        description: 'Close-range continuous plasma beam.',
        damage: 6,
        fireRate: 10.0,
        heat: 12,
        damageType: 'thermal',
        tags: ['thermal', 'beam', 'close_range'],
        role: 'Structure Melter',
        rarity: 'common',
        color: '#FF6600',
        type: 'beam',
        range: 0.6,
        maxLevel: 5
    },
    
    THERMAL_LANCE: {
        id: 'thermal_lance',
        name: 'Thermal Lance',
        description: 'Devastating thermal beam finisher.',
        damage: 120,
        fireRate: 0.4,
        heat: 22,
        damageType: 'thermal',
        tags: ['thermal', 'beam', 'heavy'],
        role: 'Structure Finisher',
        rarity: 'rare',
        color: '#FF4500',
        type: 'beam',
        piercing: 3,
        maxLevel: 5
    },
    
    INCINERATOR_MINE: {
        id: 'incinerator_mine',
        name: 'Incinerator Mine',
        description: 'Deployable mine that explodes in flames.',
        damage: 75,
        fireRate: 0.5,
        heat: 14,
        damageType: 'thermal',
        tags: ['thermal', 'mine', 'control'],
        role: 'Area Control',
        rarity: 'uncommon',
        color: '#FF5500',
        type: 'mine',
        areaRadius: 150,
        maxLevel: 5
    },
    
    FUSION_ROCKET: {
        id: 'fusion_rocket',
        name: 'Fusion Rocket',
        description: 'Homing rocket with thermal explosion.',
        damage: 95,
        fireRate: 0.7,
        heat: 18,
        damageType: 'thermal',
        tags: ['thermal', 'missile', 'homing'],
        role: 'Mid Burst',
        rarity: 'rare',
        color: '#FF7700',
        type: 'homing',
        areaRadius: 90,
        maxLevel: 5
    },
    
    STARFIRE_ARRAY: {
        id: 'starfire_array',
        name: 'Starfire Array',
        description: 'Orbital thermal bombardment array.',
        damage: 20,
        fireRate: 2.0,
        heat: 8,
        damageType: 'thermal',
        tags: ['thermal', 'orbital', 'area'],
        role: 'Thermal DPS',
        rarity: 'epic',
        color: '#FFAA00',
        type: 'orbital',
        areaRadius: 100,
        maxLevel: 5
    },
    
    // ========== KINETIC WEAPONS (6) ==========
    RAILGUN_MK2: {
        id: 'railgun_mk2',
        name: 'Railgun Mk2',
        description: 'High-velocity armor-piercing shot.',
        damage: 140,
        fireRate: 0.3,
        heat: 28,
        damageType: 'kinetic',
        tags: ['kinetic', 'ballistic', 'pierce'],
        role: 'Armor Pierce',
        rarity: 'rare',
        color: '#FFFFFF',
        type: 'direct',
        piercing: 5,
        projectileSpeed: 1600,
        maxLevel: 5
    },
    
    AUTO_CANNON: {
        id: 'auto_cannon',
        name: 'Auto Cannon',
        description: 'Sustained kinetic fire.',
        damage: 16,
        fireRate: 4.0,
        heat: 5,
        damageType: 'kinetic',
        tags: ['kinetic', 'ballistic', 'sustained'],
        role: 'Sustained Armor Damage',
        rarity: 'common',
        color: '#CCCCCC',
        type: 'direct',
        projectileSpeed: 900,
        maxLevel: 5
    },
    
    GAUSS_REPEATER: {
        id: 'gauss_repeater',
        name: 'Gauss Repeater',
        description: 'Magnetic accelerator with good fire rate.',
        damage: 45,
        fireRate: 1.5,
        heat: 10,
        damageType: 'kinetic',
        tags: ['kinetic', 'ballistic', 'balanced'],
        role: 'Mid Burst',
        rarity: 'uncommon',
        color: '#EEEEEE',
        type: 'direct',
        projectileSpeed: 1000,
        maxLevel: 5
    },
    
    MASS_DRIVER: {
        id: 'mass_driver',
        name: 'Mass Driver',
        description: 'Heavy kinetic impact weapon.',
        damage: 90,
        fireRate: 0.6,
        heat: 20,
        damageType: 'kinetic',
        tags: ['kinetic', 'ballistic', 'heavy'],
        role: 'Heavy Armor Hit',
        rarity: 'uncommon',
        color: '#DDDDDD',
        type: 'direct',
        projectileSpeed: 700,
        maxLevel: 5
    },
    
    SHRAPNEL_BURST: {
        id: 'shrapnel_burst',
        name: 'Shrapnel Burst',
        description: 'Shotgun-like spread of kinetic fragments.',
        damage: 10,
        fireRate: 1.8,
        heat: 12,
        damageType: 'kinetic',
        tags: ['kinetic', 'area', 'spread'],
        role: 'Area Clear',
        rarity: 'common',
        color: '#BBBBBB',
        type: 'spread',
        projectileCount: 6,
        projectileSpeed: 600,
        maxLevel: 5
    },
    
    SIEGE_SLUG: {
        id: 'siege_slug',
        name: 'Siege Slug',
        description: 'Devastating single-shot kinetic round.',
        damage: 200,
        fireRate: 0.2,
        heat: 35,
        damageType: 'kinetic',
        tags: ['kinetic', 'ballistic', 'ultra_heavy'],
        role: 'Ultra Burst',
        rarity: 'epic',
        color: '#FFFFFF',
        type: 'direct',
        piercing: 10,
        projectileSpeed: 500,
        maxLevel: 5
    },
    
    // ========== EXPLOSIVE WEAPONS (6) ==========
    CLUSTER_MISSILE: {
        id: 'cluster_missile',
        name: 'Cluster Missile',
        description: 'Missile that splits into multiple explosions.',
        damage: 50,
        fireRate: 1.2,
        heat: 12,
        damageType: 'explosive',
        tags: ['explosive', 'missile', 'area'],
        role: 'AoE Spread',
        rarity: 'uncommon',
        color: '#FF0000',
        type: 'homing',
        areaRadius: 100,
        clusterCount: 3,
        maxLevel: 5
    },
    
    GRAVITY_BOMB: {
        id: 'gravity_bomb',
        name: 'Gravity Bomb',
        description: 'Pulls enemies then explodes.',
        damage: 85,
        fireRate: 0.7,
        heat: 18,
        damageType: 'explosive',
        tags: ['explosive', 'control', 'area'],
        role: 'Pull + Blast',
        rarity: 'rare',
        color: '#AA0044',
        type: 'projectile',
        areaRadius: 180,
        pullStrength: 200,
        maxLevel: 5
    },
    
    DRONE_SWARM: {
        id: 'drone_swarm',
        name: 'Drone Swarm',
        description: 'Multiple explosive drones.',
        damage: 30,
        fireRate: 1.0,
        heat: 15,
        damageType: 'explosive',
        tags: ['explosive', 'drone', 'summon'],
        role: 'Field Control',
        rarity: 'rare',
        color: '#DD0000',
        type: 'drone',
        droneCount: 4,
        maxLevel: 5
    },
    
    ORBITAL_STRIKE: {
        id: 'orbital_strike',
        name: 'Orbital Strike',
        description: 'Massive explosive bombardment from orbit.',
        damage: 110,
        fireRate: 0.5,
        heat: 25,
        damageType: 'explosive',
        tags: ['explosive', 'orbital', 'burst'],
        role: 'Zone Burst',
        rarity: 'epic',
        color: '#FF4400',
        type: 'orbital',
        areaRadius: 200,
        maxLevel: 5
    },
    
    SHOCKWAVE_EMITTER: {
        id: 'shockwave_emitter',
        name: 'Shockwave Emitter',
        description: 'Ring-shaped explosive wave.',
        damage: 40,
        fireRate: 1.4,
        heat: 10,
        damageType: 'explosive',
        tags: ['explosive', 'area', 'ring'],
        role: 'Ring AoE',
        rarity: 'common',
        color: '#FF6600',
        type: 'ring',
        minRadius: 50,
        maxRadius: 150,
        maxLevel: 5
    },
    
    MINEFIELD_LAYER: {
        id: 'minefield_layer',
        name: 'Minefield Layer',
        description: 'Deploys explosive mines.',
        damage: 60,
        fireRate: 0.8,
        heat: 13,
        damageType: 'explosive',
        tags: ['explosive', 'mine', 'control'],
        role: 'Stable Control',
        rarity: 'uncommon',
        color: '#CC3300',
        type: 'mine',
        areaRadius: 120,
        mineLifetime: 8,
        maxLevel: 5
    }
};

/**
 * Get weapons by damage type
 * @param {string} damageType - em, thermal, kinetic, or explosive
 * @returns {Object[]} Array of weapons with that damage type
 */
function getWeaponsByDamageType(damageType) {
    return Object.values(NEW_WEAPONS).filter(w => w.damageType === damageType);
}

/**
 * Get weapons by tag
 * @param {string} tag - Tag to filter by
 * @returns {Object[]} Array of weapons with that tag
 */
function getWeaponsByTag(tag) {
    return Object.values(NEW_WEAPONS).filter(w => w.tags.includes(tag));
}
