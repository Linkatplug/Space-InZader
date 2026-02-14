/**
 * @fileoverview Defense layer and resistance data for Space InZader
 * Defines the 3-layer defense system (Shield → Armor → Structure)
 */

/**
 * Damage types in the game
 */
const DAMAGE_TYPES = {
    EM: 'em',
    THERMAL: 'thermal',
    KINETIC: 'kinetic',
    EXPLOSIVE: 'explosive'
};

/**
 * Defense layer types
 */
const DEFENSE_LAYERS = {
    SHIELD: 'shield',
    ARMOR: 'armor',
    STRUCTURE: 'structure'
};

/**
 * Base defense values for each layer
 * These are starting values that can be modified by ship and upgrades
 */
const BASE_DEFENSE_VALUES = {
    shield: {
        hp: 120,
        regen: 8.0,      // HP per second
        regenDelay: 3.0  // Seconds without damage before regen starts
    },
    armor: {
        hp: 150,
        regen: 0.0,
        regenDelay: 0
    },
    structure: {
        hp: 130,
        regen: 0.5,      // HP per second
        regenDelay: 0    // Always regenerating
    }
};

/**
 * Resistance cap
 * Maximum resistance for any damage type on any layer
 * Prevents invulnerability through stacking
 */
const RESISTANCE_CAP = 0.75; // 75% maximum

/**
 * Resistance tables for each defense layer
 * Format: { [damageType]: resistancePercentage }
 * Resistance reduces incoming damage: actualDamage = rawDamage * (1 - resistance)
 * Resistance bonuses from modules/synergies are ADDITIVE and capped at RESISTANCE_CAP
 */
const LAYER_RESISTANCES = {
    shield: {
        em: 0.0,         // 0% resistance - weak to EM
        thermal: 0.20,   // 20% resistance
        kinetic: 0.40,   // 40% resistance
        explosive: 0.50  // 50% resistance
    },
    armor: {
        em: 0.50,        // 50% resistance
        thermal: 0.35,   // 35% resistance
        kinetic: 0.25,   // 25% resistance
        explosive: 0.10  // 10% resistance
    },
    structure: {
        em: 0.30,        // 30% resistance
        thermal: 0.0,    // 0% resistance - weak to thermal
        kinetic: 0.15,   // 15% resistance
        explosive: 0.20  // 20% resistance
    }
};

/**
 * UI colors for each defense layer
 */
const LAYER_COLORS = {
    shield: '#00BFFF',      // Cyan/blue
    armor: '#8B4513',       // Brown
    structure: '#DC143C'    // Crimson red
};

/**
 * UI colors for each damage type (for floating text)
 */
const DAMAGE_TYPE_COLORS = {
    em: '#00FFFF',         // Cyan
    thermal: '#FF8C00',    // Orange
    kinetic: '#FFFFFF',    // White
    explosive: '#FF0000'   // Red
};

/**
 * UI symbols for damage types (for floating text)
 */
const DAMAGE_TYPE_SYMBOLS = {
    em: '✧',
    thermal: '✹',
    kinetic: '⦿',
    explosive: '💥'
};

/**
 * Create a defense layer component
 * @param {number} currentHp - Current HP
 * @param {number} maxHp - Maximum HP
 * @param {number} regen - HP regeneration per second
 * @param {number} regenDelay - Current regen delay timer
 * @param {number} regenDelayMax - Max delay before regen starts
 * @param {Object} resistances - Resistance table { em, thermal, kinetic, explosive }
 * @returns {Object} Defense layer component
 */
function createDefenseLayer(currentHp, maxHp, regen, regenDelay, regenDelayMax, resistances) {
    return {
        current: currentHp,
        max: maxHp,
        regen: regen,
        regenDelay: regenDelay,
        regenDelayMax: regenDelayMax,
        resistances: { ...resistances }
    };
}

/**
 * Create a complete defense component with all 3 layers
 * Uses base values that can be modified by ship and upgrades
 * @returns {Object} Complete defense component
 */
function createDefenseComponent() {
    return {
        shield: createDefenseLayer(
            BASE_DEFENSE_VALUES.shield.hp,
            BASE_DEFENSE_VALUES.shield.hp,
            BASE_DEFENSE_VALUES.shield.regen,
            0,
            BASE_DEFENSE_VALUES.shield.regenDelay,
            LAYER_RESISTANCES.shield
        ),
        armor: createDefenseLayer(
            BASE_DEFENSE_VALUES.armor.hp,
            BASE_DEFENSE_VALUES.armor.hp,
            BASE_DEFENSE_VALUES.armor.regen,
            0,
            BASE_DEFENSE_VALUES.armor.regenDelay,
            LAYER_RESISTANCES.armor
        ),
        structure: createDefenseLayer(
            BASE_DEFENSE_VALUES.structure.hp,
            BASE_DEFENSE_VALUES.structure.hp,
            BASE_DEFENSE_VALUES.structure.regen,
            0,
            BASE_DEFENSE_VALUES.structure.regenDelay,
            LAYER_RESISTANCES.structure
        )
    };
}

/**
 * Calculate damage after applying resistance
 * @param {number} rawDamage - Raw damage before resistance
 * @param {number} resistance - Resistance value (0-1)
 * @returns {number} Damage after resistance
 */
function applyResistance(rawDamage, resistance) {
    // Enforce cap
    const cappedResistance = Math.min(resistance, RESISTANCE_CAP);
    return rawDamage * (1 - cappedResistance);
}

/**
 * Calculate effective resistance with additive bonuses
 * Formula: effectiveResist = min(RESISTANCE_CAP, baseResist + bonusAdditive)
 * This prevents multiplicative stacking exploits
 * @param {number} baseResist - Base resistance from layer (0-1)
 * @param {number} bonusResist - Bonus from modules/synergies (additive)
 * @returns {number} Effective resistance (capped at RESISTANCE_CAP)
 */
function calculateEffectiveResistance(baseResist, bonusResist) {
    return Math.min(RESISTANCE_CAP, baseResist + bonusResist);
}

/**
 * Calculate overflow damage for next layer
 * When damage exceeds current layer HP, calculate how much damage
 * carries over to the next layer, accounting for that layer's resistance
 * @param {number} overflow - Excess damage from current layer
 * @param {number} nextLayerResistance - Next layer's resistance to this damage type
 * @returns {number} Actual damage to apply to next layer
 */
function calculateOverflow(overflow, nextLayerResistance) {
    // Overflow is the raw damage that passes through
    // It needs to be adjusted for the next layer's resistance
    return overflow / (1 - nextLayerResistance);
}

/**
 * DamagePacket class
 * Encapsulates all damage-related information for applying damage to entities
 * This is the ONLY way damage should flow through the DefenseSystem
 */
class DamagePacket {
    /**
     * Create a damage packet
     * @param {number} damage - Base damage amount
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @param {number} critMultiplier - Critical hit multiplier (default: 1.0)
     * @param {number} shieldPenetration - Shield penetration percentage (0-1, default: 0)
     * @param {number} armorPenetration - Armor penetration percentage (0-1, default: 0)
     */
    constructor(damage, damageType = 'kinetic', critMultiplier = 1.0, shieldPenetration = 0, armorPenetration = 0) {
        this.damage = damage;
        this.damageType = damageType;
        this.critMultiplier = critMultiplier;
        this.shieldPenetration = Math.max(0, Math.min(1, shieldPenetration)); // Clamp 0-1
        this.armorPenetration = Math.max(0, Math.min(1, armorPenetration)); // Clamp 0-1
    }

    /**
     * Get the final damage after applying crit multiplier
     * @returns {number} Final damage
     */
    getFinalDamage() {
        return this.damage * this.critMultiplier;
    }

    /**
     * Static factory method for simple damage (most common case)
     * @param {number} damage - Damage amount
     * @param {string} damageType - Damage type
     * @returns {DamagePacket} New damage packet
     */
    static simple(damage, damageType = 'kinetic') {
        return new DamagePacket(damage, damageType);
    }

    /**
     * Static factory method for critical hit damage
     * @param {number} damage - Base damage amount
     * @param {string} damageType - Damage type
     * @param {number} critMultiplier - Critical multiplier
     * @returns {DamagePacket} New damage packet with crit
     */
    static crit(damage, damageType, critMultiplier) {
        return new DamagePacket(damage, damageType, critMultiplier);
    }
}
