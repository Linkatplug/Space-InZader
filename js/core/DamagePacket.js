/**
 * @file DamagePacket.js
 * @description Immutable damage packet for ECS combat system
 */

/**
 * Represents an immutable damage packet used in combat calculations.
 * Contains all information needed to calculate and apply damage to entities.
 * 
 * @class DamagePacket
 * @property {number} baseDamage - Base damage value before modifiers
 * @property {string} damageType - Type of damage: 'energy', 'kinetic', or 'explosive'
 * @property {number} armorPenetration - Armor penetration ratio (0-1, where 0 = no penetration, 1 = full penetration)
 * @property {number} shieldPenetration - Shield penetration ratio (0-1, where 0 = no penetration, 1 = full penetration)
 * @property {number} critChance - Critical hit chance (0-1, where 0 = 0%, 1 = 100%)
 * @property {number} critMultiplier - Critical hit damage multiplier
 */
class DamagePacket {
    /**
     * Creates a new immutable DamagePacket instance.
     * 
     * @param {Object} config - Configuration object for the damage packet
     * @param {number} config.baseDamage - Base damage value before modifiers
     * @param {string} config.damageType - Type of damage: 'energy', 'kinetic', or 'explosive'
     * @param {number} [config.armorPenetration=0] - Armor penetration ratio (0-1)
     * @param {number} [config.shieldPenetration=0] - Shield penetration ratio (0-1)
     * @param {number} [config.critChance=0] - Critical hit chance (0-1)
     * @param {number} [config.critMultiplier=1.5] - Critical hit damage multiplier
     * @throws {Error} If required parameters are missing or invalid
     */
    constructor(config) {
        // Validate required parameters
        if (typeof config.baseDamage !== 'number' || config.baseDamage < 0) {
            throw new Error('baseDamage must be a non-negative number');
        }
        
        const validDamageTypes = ['energy', 'kinetic', 'explosive'];
        if (!validDamageTypes.includes(config.damageType)) {
            throw new Error(`damageType must be one of: ${validDamageTypes.join(', ')}`);
        }

        // Set properties with defaults for optional parameters
        this.baseDamage = config.baseDamage;
        this.damageType = config.damageType;
        this.armorPenetration = this._validateRatio(config.armorPenetration, 0, 'armorPenetration');
        this.shieldPenetration = this._validateRatio(config.shieldPenetration, 0, 'shieldPenetration');
        this.critChance = this._validateRatio(config.critChance, 0, 'critChance');
        this.critMultiplier = typeof config.critMultiplier === 'number' && config.critMultiplier > 0 
            ? config.critMultiplier 
            : 1.5;

        // Make the object immutable
        Object.freeze(this);
    }

    /**
     * Validates that a value is a valid ratio (0-1).
     * 
     * @private
     * @param {*} value - Value to validate
     * @param {number} defaultValue - Default value if validation fails or value is undefined
     * @param {string} paramName - Parameter name for error messages
     * @returns {number} Validated ratio value
     */
    _validateRatio(value, defaultValue, paramName) {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        if (typeof value !== 'number' || value < 0 || value > 1) {
            throw new Error(`${paramName} must be a number between 0 and 1`);
        }
        return value;
    }

    /**
     * Creates a copy of this damage packet with modified properties.
     * Useful for applying modifiers while maintaining immutability.
     * 
     * @param {Object} modifications - Properties to modify
     * @returns {DamagePacket} New DamagePacket instance with modifications applied
     */
    withModifications(modifications) {
        return new DamagePacket({
            baseDamage: modifications.baseDamage !== undefined ? modifications.baseDamage : this.baseDamage,
            damageType: modifications.damageType !== undefined ? modifications.damageType : this.damageType,
            armorPenetration: modifications.armorPenetration !== undefined ? modifications.armorPenetration : this.armorPenetration,
            shieldPenetration: modifications.shieldPenetration !== undefined ? modifications.shieldPenetration : this.shieldPenetration,
            critChance: modifications.critChance !== undefined ? modifications.critChance : this.critChance,
            critMultiplier: modifications.critMultiplier !== undefined ? modifications.critMultiplier : this.critMultiplier
        });
    }

    /**
     * Returns a string representation of this damage packet.
     * 
     * @returns {string} String representation
     */
    toString() {
        return `DamagePacket(${this.baseDamage} ${this.damageType}, AP:${this.armorPenetration}, SP:${this.shieldPenetration}, Crit:${this.critChance}x${this.critMultiplier})`;
    }
}
