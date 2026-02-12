/**
 * @fileoverview Loot system for Space InZader
 * Defines rarity system and ship-specific loot pools
 */

/**
 * Rarity weights for loot drops
 */
const RARITY_WEIGHTS = {
    common: 0.50,      // 50%
    uncommon: 0.30,    // 30%
    rare: 0.15,        // 15%
    epic: 0.05         // 5% (only after minute 8)
};

/**
 * Time-based progression tiers
 */
const PROGRESSION_TIERS = {
    T1: { minTime: 0, maxTime: 180, bonusPercent: 0 },      // 0-3 minutes, +0%
    T2: { minTime: 180, maxTime: 360, bonusPercent: 12 },   // 3-6 minutes, +12%
    T3: { minTime: 360, maxTime: 600, bonusPercent: 24 },   // 6-10 minutes, +24%
    T4: { minTime: 600, maxTime: 900, bonusPercent: 40 },   // 10-15 minutes, +40%
    T5: { minTime: 900, maxTime: Infinity, bonusPercent: 60 } // 15+ minutes, +60%
};

/**
 * Get current tier based on game time
 * @param {number} gameTime - Current game time in seconds
 * @returns {Object} Current tier data
 */
function getCurrentTier(gameTime) {
    if (gameTime < 180) return PROGRESSION_TIERS.T1;
    if (gameTime < 360) return PROGRESSION_TIERS.T2;
    if (gameTime < 600) return PROGRESSION_TIERS.T3;
    if (gameTime < 900) return PROGRESSION_TIERS.T4;
    return PROGRESSION_TIERS.T5;
}

/**
 * Ship-specific loot pools
 * Each ship has preferred weapons, modules, and exclusions
 */
const SHIP_LOOT_POOLS = {
    AEGIS_FRIGATE: {
        id: 'aegis_frigate',
        name: 'Aegis Frigate',
        description: 'EM-focused shield specialist',
        preferredWeapons: [
            'ion_blaster',
            'emp_pulse',
            'arc_disruptor',
            'disruptor_beam',
            'em_drone_wing',
            'overload_missile'
        ],
        preferredModules: [
            'em_amplifier',
            'shield_booster',
            'shield_recharger',
            'targeting_ai'
        ],
        excludedModules: [
            'armor_plating',
            'structure_reinforcement'
        ],
        startingWeapon: 'ion_blaster',
        baseDefense: {
            shield: 180,  // Higher shield
            armor: 100,   // Lower armor
            structure: 120
        }
    },
    
    BULWARK_DESTROYER: {
        id: 'bulwark_destroyer',
        name: 'Bulwark Destroyer',
        description: 'Kinetic tank with heavy armor',
        preferredWeapons: [
            'railgun_mk2',
            'auto_cannon',
            'gauss_repeater',
            'mass_driver',
            'shrapnel_burst',
            'siege_slug'
        ],
        preferredModules: [
            'kinetic_stabilizer',
            'armor_plating',
            'reactive_armor',
            'damage_control'
        ],
        excludedModules: [
            'shield_booster',
            'shield_recharger'
        ],
        excludedWeaponTags: ['beam', 'em'],
        startingWeapon: 'auto_cannon',
        baseDefense: {
            shield: 80,
            armor: 220,   // Higher armor
            structure: 150
        }
    },
    
    INFERNO_SKIMMER: {
        id: 'inferno_skimmer',
        name: 'Inferno Skimmer',
        description: 'Thermal specialist with heat management',
        preferredWeapons: [
            'solar_flare',
            'plasma_stream',
            'thermal_lance',
            'incinerator_mine',
            'fusion_rocket',
            'starfire_array'
        ],
        preferredModules: [
            'thermal_catalyst',
            'damage_control',
            'shield_recharger'
        ],
        excludedModules: [
            'overheat_core'
        ],
        excludedWeaponTags: ['mine', 'explosive'],
        startingWeapon: 'plasma_stream',
        baseDefense: {
            shield: 120,
            armor: 130,
            structure: 150  // Higher structure
        }
    },
    
    CATACLYSM_CRUISER: {
        id: 'cataclysm_cruiser',
        name: 'Cataclysm Cruiser',
        description: 'Explosive AoE control specialist',
        preferredWeapons: [
            'cluster_missile',
            'gravity_bomb',
            'drone_swarm',
            'orbital_strike',
            'shockwave_emitter',
            'minefield_layer'
        ],
        preferredModules: [
            'explosive_payload',
            'targeting_ai',
            'armor_plating',
            'structure_reinforcement'
        ],
        excludedModules: [
            'shield_recharger'
        ],
        startingWeapon: 'cluster_missile',
        baseDefense: {
            shield: 100,
            armor: 150,
            structure: 150
        }
    }
};

/**
 * Roll for rarity based on weights and game time
 * @param {number} gameTime - Current game time in seconds
 * @returns {string} Rolled rarity
 */
function rollRarity(gameTime) {
    // Epic only available after 8 minutes (480 seconds)
    const epicAvailable = gameTime >= 480;
    
    const weights = { ...RARITY_WEIGHTS };
    if (!epicAvailable) {
        // Redistribute epic chance to rare
        weights.rare += weights.epic;
        weights.epic = 0;
    }
    
    const roll = Math.random();
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (roll < cumulative) {
            return rarity;
        }
    }
    
    return 'common';
}

/**
 * Get weighted loot pool for a ship
 * @param {string} shipId - Ship identifier
 * @param {string} lootType - 'weapon' or 'module'
 * @returns {Object[]} Weighted loot items
 */
function getShipLootPool(shipId, lootType = 'weapon') {
    const shipPool = SHIP_LOOT_POOLS[shipId.toUpperCase()];
    if (!shipPool) {
        return [];
    }
    
    if (lootType === 'weapon') {
        return shipPool.preferredWeapons;
    } else if (lootType === 'module') {
        return shipPool.preferredModules;
    }
    
    return [];
}

/**
 * Check if item is excluded for a ship
 * @param {string} shipId - Ship identifier
 * @param {Object} item - Item to check (weapon or module)
 * @returns {boolean} True if excluded
 */
function isItemExcluded(shipId, item) {
    const shipPool = SHIP_LOOT_POOLS[shipId.toUpperCase()];
    if (!shipPool) {
        return false;
    }
    
    // Check excluded modules
    if (shipPool.excludedModules && shipPool.excludedModules.includes(item.id)) {
        return true;
    }
    
    // Check excluded weapon tags
    if (shipPool.excludedWeaponTags && item.tags) {
        for (const tag of item.tags) {
            if (shipPool.excludedWeaponTags.includes(tag)) {
                return true;
            }
        }
    }
    
    return false;
}
