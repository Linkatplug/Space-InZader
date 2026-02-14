/**
 * @fileoverview Final stats calculator for Space InZader
 * 
 * FinalStatsCalculator provides a pure, centralized system for computing final ship
 * statistics by applying modifiers to base stats in a deterministic, predictable way.
 * 
 * This calculator ensures:
 * - Consistent modifier application order (additive first, then multiplicative)
 * - Input immutability (base stats are never modified)
 * - Deterministic output (same inputs always produce same output)
 * - Pure function behavior (no side effects or external dependencies)
 * 
 * @author Space InZader Team
 */

/**
 * Modifier type definition
 * 
 * @typedef {Object} StatModifier
 * @property {string} stat - Name of the stat field to modify (must match ShipStats field)
 * @property {"additive"|"multiplicative"} type - Type of modification
 * @property {number} value - Value to add or multiply by
 * @property {string} source - Description of where this modifier comes from (for debugging)
 * 
 * @example
 * {
 *   stat: "damageMultiplier",
 *   type: "additive",
 *   value: 0.5,
 *   source: "Weapon Module Alpha"
 * }
 * 
 * @example
 * {
 *   stat: "maxShield",
 *   type: "multiplicative",
 *   value: 1.25,
 *   source: "Shield Booster Passive"
 * }
 */

/**
 * FinalStatsCalculator - Pure function system for computing final ship stats
 * 
 * This class provides static methods for calculating final statistics by applying
 * modifiers to base stats. It implements a strict modifier application order:
 * 1. All additive modifiers are applied first
 * 2. Then all multiplicative modifiers are applied
 * 
 * This ensures predictable and consistent stat calculations across the game.
 * 
 * @class
 */
class FinalStatsCalculator {
    /**
     * Calculate final stats by applying modifiers to base stats
     * 
     * This is a pure function that:
     * - Does not modify the input base stats
     * - Applies modifiers in deterministic order (additive then multiplicative)
     * - Returns a new immutable ShipStats instance
     * - Has no side effects
     * 
     * Modifier Application Order:
     * 1. Additive modifiers: finalValue = baseValue + sum(additiveModifiers)
     * 2. Multiplicative modifiers: finalValue = value * product(multiplicativeModifiers)
     * 
     * @param {ShipStats} baseStats - Base ship statistics (will not be modified)
     * @param {StatModifier[]} modifiers - Array of modifiers to apply (optional)
     * @returns {ShipStats} New ShipStats instance with modifiers applied
     * 
     * @example
     * const base = ShipStats.createDefault();
     * const modifiers = [
     *   { stat: "damageMultiplier", type: "additive", value: 0.5, source: "Module A" },
     *   { stat: "damageMultiplier", type: "multiplicative", value: 1.2, source: "Passive B" }
     * ];
     * const final = FinalStatsCalculator.calculate(base, modifiers);
     * // base.damageMultiplier = 1.0 (unchanged)
     * // final.damageMultiplier = (1.0 + 0.5) * 1.2 = 1.8
     * 
     * @throws {Error} If baseStats is null or undefined
     * @throws {Error} If baseStats is not a ShipStats instance
     */
    static calculate(baseStats, modifiers = []) {
        // Validation
        if (!baseStats) {
            throw new Error('FinalStatsCalculator.calculate: baseStats is required');
        }
        
        if (!(baseStats instanceof ShipStats)) {
            throw new Error('FinalStatsCalculator.calculate: baseStats must be a ShipStats instance');
        }
        
        // Clone base stats to ensure immutability
        const workingStats = baseStats.clone();
        
        // If no modifiers, return the clone
        if (!modifiers || modifiers.length === 0) {
            return workingStats;
        }
        
        // Separate modifiers by type for ordered application
        const additiveModifiers = [];
        const multiplicativeModifiers = [];
        
        for (const modifier of modifiers) {
            if (!FinalStatsCalculator._isValidModifier(modifier)) {
                console.warn('[FinalStatsCalculator] Skipping invalid modifier:', modifier);
                continue;
            }
            
            if (modifier.type === 'additive') {
                additiveModifiers.push(modifier);
            } else if (modifier.type === 'multiplicative') {
                multiplicativeModifiers.push(modifier);
            } else {
                console.warn('[FinalStatsCalculator] Unknown modifier type:', modifier.type);
            }
        }
        
        // Step 1: Apply all additive modifiers
        FinalStatsCalculator._applyAdditiveModifiers(workingStats, additiveModifiers);
        
        // Step 2: Apply all multiplicative modifiers
        FinalStatsCalculator._applyMultiplicativeModifiers(workingStats, multiplicativeModifiers);
        
        return workingStats;
    }
    
    /**
     * Apply additive modifiers to stats
     * 
     * Additive modifiers increase the base value by a fixed amount.
     * Multiple additive modifiers for the same stat are summed together.
     * 
     * @private
     * @param {ShipStats} stats - Stats object to modify
     * @param {StatModifier[]} modifiers - Additive modifiers to apply
     */
    static _applyAdditiveModifiers(stats, modifiers) {
        for (const modifier of modifiers) {
            const { stat, value } = modifier;
            
            if (!(stat in stats)) {
                console.warn(`[FinalStatsCalculator] Stat "${stat}" does not exist in ShipStats`);
                continue;
            }
            
            const currentValue = stats[stat];
            if (typeof currentValue !== 'number') {
                console.warn(`[FinalStatsCalculator] Stat "${stat}" is not a number`);
                continue;
            }
            
            stats[stat] = currentValue + value;
        }
    }
    
    /**
     * Apply multiplicative modifiers to stats
     * 
     * Multiplicative modifiers scale the current value by a multiplier.
     * Multiple multiplicative modifiers for the same stat are multiplied together.
     * 
     * @private
     * @param {ShipStats} stats - Stats object to modify
     * @param {StatModifier[]} modifiers - Multiplicative modifiers to apply
     */
    static _applyMultiplicativeModifiers(stats, modifiers) {
        for (const modifier of modifiers) {
            const { stat, value } = modifier;
            
            if (!(stat in stats)) {
                console.warn(`[FinalStatsCalculator] Stat "${stat}" does not exist in ShipStats`);
                continue;
            }
            
            const currentValue = stats[stat];
            if (typeof currentValue !== 'number') {
                console.warn(`[FinalStatsCalculator] Stat "${stat}" is not a number`);
                continue;
            }
            
            stats[stat] = currentValue * value;
        }
    }
    
    /**
     * Validate a modifier object
     * 
     * Checks that the modifier has all required fields and valid values.
     * 
     * @private
     * @param {*} modifier - Modifier to validate
     * @returns {boolean} True if modifier is valid
     */
    static _isValidModifier(modifier) {
        if (!modifier || typeof modifier !== 'object') {
            return false;
        }
        
        // Check required fields
        if (typeof modifier.stat !== 'string' || !modifier.stat) {
            return false;
        }
        
        if (modifier.type !== 'additive' && modifier.type !== 'multiplicative') {
            return false;
        }
        
        if (typeof modifier.value !== 'number' || !isFinite(modifier.value)) {
            return false;
        }
        
        // source is optional but should be string if present
        if ('source' in modifier && typeof modifier.source !== 'string') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate total modifiers for a specific stat
     * 
     * Utility method to sum all modifiers for a given stat, useful for debugging
     * or displaying modifier breakdowns to the player.
     * 
     * @static
     * @param {StatModifier[]} modifiers - Array of modifiers to analyze
     * @param {string} statName - Name of the stat to calculate total for
     * @returns {Object} Object with additive and multiplicative totals
     * @returns {number} return.additive - Sum of all additive modifiers
     * @returns {number} return.multiplicative - Product of all multiplicative modifiers
     * 
     * @example
     * const modifiers = [
     *   { stat: "damageMultiplier", type: "additive", value: 0.3, source: "A" },
     *   { stat: "damageMultiplier", type: "additive", value: 0.2, source: "B" },
     *   { stat: "damageMultiplier", type: "multiplicative", value: 1.5, source: "C" }
     * ];
     * const totals = FinalStatsCalculator.getTotalModifiers(modifiers, "damageMultiplier");
     * // totals.additive = 0.5
     * // totals.multiplicative = 1.5
     */
    static getTotalModifiers(modifiers, statName) {
        let additiveTotal = 0;
        let multiplicativeTotal = 1.0;
        
        for (const modifier of modifiers) {
            if (!FinalStatsCalculator._isValidModifier(modifier)) {
                continue;
            }
            
            if (modifier.stat !== statName) {
                continue;
            }
            
            if (modifier.type === 'additive') {
                additiveTotal += modifier.value;
            } else if (modifier.type === 'multiplicative') {
                multiplicativeTotal *= modifier.value;
            }
        }
        
        return {
            additive: additiveTotal,
            multiplicative: multiplicativeTotal
        };
    }
    
    /**
     * Get all modifiers grouped by stat name
     * 
     * Utility method for debugging or displaying a breakdown of all active modifiers.
     * 
     * @static
     * @param {StatModifier[]} modifiers - Array of modifiers to group
     * @returns {Object} Object mapping stat names to arrays of modifiers
     * 
     * @example
     * const modifiers = [
     *   { stat: "damageMultiplier", type: "additive", value: 0.5, source: "Module" },
     *   { stat: "maxShield", type: "multiplicative", value: 1.2, source: "Passive" }
     * ];
     * const grouped = FinalStatsCalculator.groupModifiersByStat(modifiers);
     * // {
     * //   damageMultiplier: [{ stat: "damageMultiplier", ... }],
     * //   maxShield: [{ stat: "maxShield", ... }]
     * // }
     */
    static groupModifiersByStat(modifiers) {
        const grouped = {};
        
        for (const modifier of modifiers) {
            if (!FinalStatsCalculator._isValidModifier(modifier)) {
                continue;
            }
            
            if (!grouped[modifier.stat]) {
                grouped[modifier.stat] = [];
            }
            
            grouped[modifier.stat].push(modifier);
        }
        
        return grouped;
    }
}
