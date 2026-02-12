/**
 * @fileoverview Heat system data for Space InZader
 * Defines heat management mechanics
 */

/**
 * Heat system constants
 */
const HEAT_SYSTEM = {
    // Maximum heat capacity
    MAX_HEAT: 100,
    
    // Base cooling rate per second
    BASE_COOLING: 10,
    
    // Passive heat generation per second (from reactor, etc)
    BASE_PASSIVE_HEAT: 0,
    
    // Overheat threshold (percentage of max heat)
    OVERHEAT_THRESHOLD: 1.0, // 100% of max heat
    
    // Weapon disable duration when overheated (seconds)
    OVERHEAT_DISABLE_DURATION: 2.0,
    
    // Heat value after overheat recovery
    OVERHEAT_RECOVERY_VALUE: 50,
    
    // Visual warning threshold (percentage)
    WARNING_THRESHOLD: 0.8 // Show warning at 80%
};

/**
 * Crit system caps
 */
const CRIT_CAPS = {
    // Maximum critical hit chance
    MAX_CRIT_CHANCE: 0.60, // 60%
    
    // Maximum critical damage multiplier
    MAX_CRIT_DAMAGE: 3.0   // 300%
};

/**
 * Calculate actual damage with critical hits
 * Formula: actualDamage = baseDamage * (1 + critChance * (critDamage - 1))
 * @param {number} baseDamage - Base damage before crit
 * @param {number} critChance - Critical hit chance (0-0.6)
 * @param {number} critDamage - Critical damage multiplier (1-3)
 * @returns {number} Expected damage including crit
 */
function calculateCritDamage(baseDamage, critChance, critDamage) {
    // Apply caps
    const cappedCritChance = Math.min(critChance, CRIT_CAPS.MAX_CRIT_CHANCE);
    const cappedCritDamage = Math.min(critDamage, CRIT_CAPS.MAX_CRIT_DAMAGE);
    
    // Calculate expected damage
    return baseDamage * (1 + cappedCritChance * (cappedCritDamage - 1));
}

/**
 * Roll for a critical hit
 * @param {number} critChance - Critical hit chance (0-1)
 * @returns {boolean} True if crit occurs
 */
function rollCrit(critChance) {
    const cappedChance = Math.min(critChance, CRIT_CAPS.MAX_CRIT_CHANCE);
    return Math.random() < cappedChance;
}

/**
 * Create heat component for an entity
 * @param {number} maxHeat - Maximum heat capacity
 * @param {number} cooling - Cooling rate per second
 * @param {number} passiveHeat - Passive heat generation per second
 * @returns {Object} Heat component
 */
function createHeatComponent(maxHeat = HEAT_SYSTEM.MAX_HEAT, 
                            cooling = HEAT_SYSTEM.BASE_COOLING, 
                            passiveHeat = HEAT_SYSTEM.BASE_PASSIVE_HEAT) {
    return {
        current: 0,
        max: maxHeat,
        cooling: cooling,
        passiveHeat: passiveHeat,
        overheated: false,
        overheatTimer: 0
    };
}
