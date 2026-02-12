/**
 * @fileoverview Module and passive data for Space InZader
 * Defines defensive and offensive modules with trade-offs
 */

/**
 * Module data structure
 * @typedef {Object} ModuleData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Module description
 * @property {string} category - defensive or offensive
 * @property {Object} benefits - Stat bonuses
 * @property {Object} costs - Stat penalties/trade-offs
 * @property {string} rarity - Rarity level
 */

const MODULES = {
    // ========== DEFENSIVE MODULES (6) ==========
    SHIELD_BOOSTER: {
        id: 'shield_booster',
        name: 'Shield Booster',
        description: 'Increases shield capacity at the cost of damage.',
        category: 'defensive',
        benefits: {
            shieldMax: 40
        },
        costs: {
            damageMultiplier: -0.05 // -5% overall damage
        },
        rarity: 'common',
        tags: ['shield', 'defense']
    },
    
    SHIELD_RECHARGER: {
        id: 'shield_recharger',
        name: 'Shield Recharger',
        description: 'Faster shield regeneration but generates more heat.',
        category: 'defensive',
        benefits: {
            shieldRegen: 3
        },
        costs: {
            heatGeneration: 0.10 // +10% heat generation
        },
        rarity: 'common',
        tags: ['shield', 'regen']
    },
    
    ARMOR_PLATING: {
        id: 'armor_plating',
        name: 'Armor Plating',
        description: 'Heavy armor reduces speed.',
        category: 'defensive',
        benefits: {
            armorMax: 50
        },
        costs: {
            speed: -0.10 // -10% speed
        },
        rarity: 'common',
        tags: ['armor', 'defense']
    },
    
    REACTIVE_ARMOR: {
        id: 'reactive_armor',
        name: 'Reactive Armor',
        description: 'Adapts to resist the last damage type received.',
        category: 'defensive',
        benefits: {
            adaptiveResist: 0.10 // +10% resist to last damage type
        },
        costs: {
            shieldRegen: -0.10 // -10% shield regen
        },
        rarity: 'uncommon',
        tags: ['armor', 'adaptive']
    },
    
    STRUCTURE_REINFORCEMENT: {
        id: 'structure_reinforcement',
        name: 'Structure Reinforcement',
        description: 'Reinforced hull reduces pickup range.',
        category: 'defensive',
        benefits: {
            structureMax: 40
        },
        costs: {
            magnetRange: -0.10 // -10% pickup range
        },
        rarity: 'uncommon',
        tags: ['structure', 'defense']
    },
    
    DAMAGE_CONTROL: {
        id: 'damage_control',
        name: 'Damage Control',
        description: 'Increases all resistances but caps them.',
        category: 'defensive',
        benefits: {
            allResistances: 0.08 // +8% to all resistances
        },
        costs: {
            resistCap: 0.75 // Caps resistances at 75%
        },
        rarity: 'rare',
        tags: ['resist', 'balanced']
    },
    
    // ========== OFFENSIVE MODULES (6) ==========
    EM_AMPLIFIER: {
        id: 'em_amplifier',
        name: 'EM Amplifier',
        description: 'Boosts EM damage but increases heat.',
        category: 'offensive',
        benefits: {
            emDamage: 0.20 // +20% EM damage
        },
        costs: {
            emWeaponHeat: 0.10 // +10% heat for EM weapons
        },
        rarity: 'common',
        tags: ['em', 'damage']
    },
    
    THERMAL_CATALYST: {
        id: 'thermal_catalyst',
        name: 'Thermal Catalyst',
        description: 'Increases thermal damage, generates passive heat.',
        category: 'offensive',
        benefits: {
            thermalDamage: 0.20 // +20% thermal damage
        },
        costs: {
            passiveHeat: 0.05 // +5% passive heat generation
        },
        rarity: 'common',
        tags: ['thermal', 'damage']
    },
    
    KINETIC_STABILIZER: {
        id: 'kinetic_stabilizer',
        name: 'Kinetic Stabilizer',
        description: 'Better kinetic penetration, reduced fire rate.',
        category: 'offensive',
        benefits: {
            kineticPenetration: 0.15 // +15% kinetic armor penetration
        },
        costs: {
            fireRate: -0.08 // -8% fire rate
        },
        rarity: 'uncommon',
        tags: ['kinetic', 'penetration']
    },
    
    EXPLOSIVE_PAYLOAD: {
        id: 'explosive_payload',
        name: 'Explosive Payload',
        description: 'Larger AoE radius, less single-target damage.',
        category: 'offensive',
        benefits: {
            aoeRadius: 0.20 // +20% AoE radius
        },
        costs: {
            singleTargetDamage: -0.10 // -10% single-target damage
        },
        rarity: 'uncommon',
        tags: ['explosive', 'area']
    },
    
    TARGETING_AI: {
        id: 'targeting_ai',
        name: 'Targeting AI',
        description: 'Faster targeting increases fire rate but heat.',
        category: 'offensive',
        benefits: {
            fireRate: 0.15 // +15% fire rate
        },
        costs: {
            heatGeneration: 0.15 // +15% heat generation
        },
        rarity: 'rare',
        tags: ['fire_rate', 'heat']
    },
    
    OVERHEAT_CORE: {
        id: 'overheat_core',
        name: 'Overheat Core',
        description: 'Massive damage boost, massive heat generation.',
        category: 'offensive',
        benefits: {
            damageMultiplier: 0.30 // +30% damage
        },
        costs: {
            heatGeneration: 0.40 // +40% heat generation
        },
        rarity: 'epic',
        tags: ['damage', 'heat', 'risk']
    }
};

/**
 * Get modules by category
 * @param {string} category - defensive or offensive
 * @returns {Object[]} Array of modules in that category
 */
function getModulesByCategory(category) {
    return Object.values(MODULES).filter(m => m.category === category);
}

/**
 * Get modules by tag
 * @param {string} tag - Tag to filter by
 * @returns {Object[]} Array of modules with that tag
 */
function getModulesByTag(tag) {
    return Object.values(MODULES).filter(m => m.tags.includes(tag));
}

/**
 * Apply module effects to stats
 * @param {Object} stats - Current player stats
 * @param {Object} module - Module to apply
 * @returns {Object} Modified stats
 */
function applyModuleEffects(stats, module) {
    const newStats = { ...stats };
    
    // Apply benefits
    for (const [stat, value] of Object.entries(module.benefits)) {
        if (newStats[stat] !== undefined) {
            if (stat.includes('Multiplier') || stat.includes('Rate') || stat.includes('Damage')) {
                newStats[stat] *= (1 + value);
            } else {
                newStats[stat] += value;
            }
        }
    }
    
    // Apply costs
    for (const [stat, value] of Object.entries(module.costs)) {
        if (newStats[stat] !== undefined) {
            if (stat.includes('Multiplier') || stat.includes('Rate') || stat.includes('Damage')) {
                newStats[stat] *= (1 + value);
            } else {
                newStats[stat] += value;
            }
        }
    }
    
    return newStats;
}
