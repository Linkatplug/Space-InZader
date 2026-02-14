/**
 * @fileoverview Unified ship statistics model for Space InZader
 * 
 * ShipStats is a pure data container representing the final, computed statistics
 * of a ship after all modifiers, upgrades, modules, and synergies have been applied.
 * 
 * This model provides a clean, consistent interface for accessing ship stats throughout
 * the game systems without coupling to specific implementation details.
 * 
 * @author Space InZader Team
 */

/**
 * ShipStats - Pure data model representing final ship statistics
 * 
 * This class is a pure data container with no game logic or system dependencies.
 * All fields represent the final, computed values after all modifiers have been applied.
 * 
 * @class
 */
class ShipStats {
    /**
     * Create a new ShipStats instance
     * 
     * @param {Object} config - Configuration object for initializing stats
     * @param {number} config.damageMultiplier - Overall damage multiplier (default: 1.0)
     * @param {number} config.fireRateMultiplier - Fire rate multiplier (default: 1.0)
     * @param {number} config.critChance - Critical hit chance as decimal 0-1 (default: 0.0)
     * @param {number} config.critMultiplier - Critical hit damage multiplier (default: 1.5)
     * @param {number} config.maxShield - Maximum shield hit points (default: 120)
     * @param {number} config.maxArmor - Maximum armor hit points (default: 150)
     * @param {number} config.maxStructure - Maximum structure hit points (default: 130)
     * @param {number} config.shieldRegen - Shield regeneration per second (default: 8.0)
     * @param {number} config.armorReduction - Flat damage reduction from armor (default: 0)
     * @param {number} config.heatGenerationMultiplier - Heat generation multiplier (default: 1.0)
     * @param {number} config.cooldownReduction - Cooldown reduction as decimal 0-1 (default: 0.0)
     */
    constructor(config = {}) {
        // === OFFENSIVE STATS ===
        
        /**
         * Overall damage multiplier
         * Applies to all damage dealt by the ship
         * @type {number}
         */
        this.damageMultiplier = config.damageMultiplier ?? 1.0;
        
        /**
         * Fire rate multiplier
         * Higher values mean faster weapon firing
         * @type {number}
         */
        this.fireRateMultiplier = config.fireRateMultiplier ?? 1.0;
        
        /**
         * Critical hit chance
         * Probability of landing a critical hit (0.0 = 0%, 1.0 = 100%)
         * @type {number}
         */
        this.critChance = config.critChance ?? 0.0;
        
        /**
         * Critical hit damage multiplier
         * Multiplier applied to damage on critical hits
         * @type {number}
         */
        this.critMultiplier = config.critMultiplier ?? 1.5;
        
        // === DEFENSIVE STATS ===
        
        /**
         * Maximum shield hit points
         * First layer of defense, regenerates over time
         * @type {number}
         */
        this.maxShield = config.maxShield ?? 120;
        
        /**
         * Maximum armor hit points
         * Second layer of defense, does not regenerate naturally
         * @type {number}
         */
        this.maxArmor = config.maxArmor ?? 150;
        
        /**
         * Maximum structure hit points
         * Final layer of defense, ship is destroyed when this reaches zero
         * @type {number}
         */
        this.maxStructure = config.maxStructure ?? 130;
        
        /**
         * Shield regeneration rate
         * Hit points regenerated per second after the regen delay
         * @type {number}
         */
        this.shieldRegen = config.shieldRegen ?? 8.0;
        
        /**
         * Armor damage reduction
         * Flat amount of damage reduced by armor (legacy system)
         * @type {number}
         */
        this.armorReduction = config.armorReduction ?? 0;
        
        // === HEAT MANAGEMENT STATS ===
        
        /**
         * Heat generation multiplier
         * Affects how quickly weapons generate heat
         * Lower is better (e.g., 0.8 = 20% less heat generation)
         * @type {number}
         */
        this.heatGenerationMultiplier = config.heatGenerationMultiplier ?? 1.0;
        
        /**
         * Cooldown reduction
         * Reduces weapon cooldowns as a percentage (0.0 = 0%, 1.0 = 100% reduction)
         * @type {number}
         */
        this.cooldownReduction = config.cooldownReduction ?? 0.0;
    }
    
    /**
     * Create a ShipStats instance with default values
     * 
     * This factory method provides a convenient way to create a ShipStats object
     * with all default values, suitable for a baseline ship configuration.
     * 
     * Default values represent a standard ship with:
     * - 1.0x damage and fire rate (no bonuses)
     * - No critical hits (0% chance)
     * - Standard defense layers (120 shield, 150 armor, 130 structure)
     * - 8.0 HP/s shield regeneration
     * - Standard heat generation and no cooldown reduction
     * 
     * @static
     * @returns {ShipStats} A new ShipStats instance with default values
     * 
     * @example
     * const defaultStats = ShipStats.createDefault();
     * console.log(defaultStats.damageMultiplier); // 1.0
     * console.log(defaultStats.maxShield); // 120
     */
    static createDefault() {
        return new ShipStats({
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            critChance: 0.0,
            critMultiplier: 1.5,
            maxShield: 120,
            maxArmor: 150,
            maxStructure: 130,
            shieldRegen: 8.0,
            armorReduction: 0,
            heatGenerationMultiplier: 1.0,
            cooldownReduction: 0.0
        });
    }
    
    /**
     * Create a copy of this ShipStats instance
     * 
     * Returns a new ShipStats object with the same values as this instance.
     * Useful for creating modified copies without affecting the original.
     * 
     * @returns {ShipStats} A new ShipStats instance with copied values
     * 
     * @example
     * const original = ShipStats.createDefault();
     * const copy = original.clone();
     * copy.damageMultiplier = 2.0;
     * console.log(original.damageMultiplier); // Still 1.0
     */
    clone() {
        return new ShipStats({
            damageMultiplier: this.damageMultiplier,
            fireRateMultiplier: this.fireRateMultiplier,
            critChance: this.critChance,
            critMultiplier: this.critMultiplier,
            maxShield: this.maxShield,
            maxArmor: this.maxArmor,
            maxStructure: this.maxStructure,
            shieldRegen: this.shieldRegen,
            armorReduction: this.armorReduction,
            heatGenerationMultiplier: this.heatGenerationMultiplier,
            cooldownReduction: this.cooldownReduction
        });
    }
    
    /**
     * Convert this ShipStats to a plain JavaScript object
     * 
     * Useful for serialization, debugging, or passing to APIs that expect
     * plain objects rather than class instances.
     * 
     * @returns {Object} Plain object with all stat values
     * 
     * @example
     * const stats = ShipStats.createDefault();
     * const obj = stats.toObject();
     * console.log(JSON.stringify(obj, null, 2));
     */
    toObject() {
        return {
            damageMultiplier: this.damageMultiplier,
            fireRateMultiplier: this.fireRateMultiplier,
            critChance: this.critChance,
            critMultiplier: this.critMultiplier,
            maxShield: this.maxShield,
            maxArmor: this.maxArmor,
            maxStructure: this.maxStructure,
            shieldRegen: this.shieldRegen,
            armorReduction: this.armorReduction,
            heatGenerationMultiplier: this.heatGenerationMultiplier,
            cooldownReduction: this.cooldownReduction
        };
    }
    
    /**
     * Create a ShipStats instance from a plain object
     * 
     * Inverse of toObject(), allows recreation of ShipStats from serialized data.
     * 
     * @static
     * @param {Object} obj - Plain object with stat values
     * @returns {ShipStats} New ShipStats instance
     * 
     * @example
     * const data = { damageMultiplier: 2.0, maxShield: 200 };
     * const stats = ShipStats.fromObject(data);
     */
    static fromObject(obj) {
        return new ShipStats(obj);
    }
}
