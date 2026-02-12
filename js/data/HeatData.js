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
    
    // Maximum cooling bonus (prevents meta-breaking infinite sustain)
    // Formula: coolingEffective = baseCooling * (1 + min(coolingBonus, MAX_COOLING_BONUS))
    // With max bonus: 10 * (1 + 2.0) = 30/s max cooling
    MAX_COOLING_BONUS: 2.0, // 200% bonus maximum
    
    // Passive heat generation per second (from reactor, etc)
    BASE_PASSIVE_HEAT: 0,
    
    // Overheat threshold (percentage of max heat)
    OVERHEAT_THRESHOLD: 1.0, // 100% of max heat
    
    // Weapon disable duration when overheated (seconds)
    OVERHEAT_DISABLE_DURATION: 2.0,
    
    // Heat value after overheat recovery
    OVERHEAT_RECOVERY_VALUE: 50,
    
    // Visual warning threshold (percentage)
    WARNING_THRESHOLD: 0.8, // Show warning at 80%
    
    // Heat sustainability threshold for meta validation
    // If a build can sustain > 95% heat, it's meta-breaking
    SUSTAINABLE_HEAT_THRESHOLD: 0.95
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
        coolingBonus: 0, // Bonus from modules (capped at MAX_COOLING_BONUS)
        passiveHeat: passiveHeat,
        overheated: false,
        overheatTimer: 0
    };
}

/**
 * Calculate effective cooling with bonuses and caps
 * @param {number} baseCooling - Base cooling rate
 * @param {number} coolingBonus - Bonus from modules (percentage, e.g., 0.5 = +50%)
 * @returns {number} Effective cooling rate
 */
function calculateEffectiveCooling(baseCooling, coolingBonus) {
    const cappedBonus = Math.min(coolingBonus, HEAT_SYSTEM.MAX_COOLING_BONUS);
    return baseCooling * (1 + cappedBonus);
}

/**
 * Validate if a build's heat is sustainable
 * @param {number} heatGenPerSec - Heat generated per second from weapons
 * @param {number} effectiveCooling - Effective cooling per second
 * @param {number} maxHeat - Maximum heat capacity
 * @returns {Object} Sustainability analysis
 */
function validateHeatSustainability(heatGenPerSec, effectiveCooling, maxHeat = HEAT_SYSTEM.MAX_HEAT) {
    const netHeatRate = heatGenPerSec - effectiveCooling;
    const canSustainMax = netHeatRate <= 0;
    
    // Calculate equilibrium heat level
    let equilibriumPercent = 0;
    if (heatGenPerSec > 0 && effectiveCooling > 0) {
        equilibriumPercent = Math.min(1.0, heatGenPerSec / effectiveCooling);
    }
    
    const isMetaBreaking = equilibriumPercent >= HEAT_SYSTEM.SUSTAINABLE_HEAT_THRESHOLD;
    
    return {
        heatGenPerSec,
        effectiveCooling,
        netHeatRate,
        equilibriumPercent,
        canSustainMax,
        isMetaBreaking,
        warning: isMetaBreaking 
            ? 'META-BREAKING: Build can sustain 95%+ heat indefinitely'
            : 'Balanced: Build will overheat with sustained fire'
    };
}
