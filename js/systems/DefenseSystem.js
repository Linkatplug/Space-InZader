/**
 * @file DefenseSystem.js
 * @description Manages the 3-layer defense system and regeneration
 */

class DefenseSystem {
    constructor(world) {
        this.world = world;
    }

    /**
     * Update all defense layers
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        // Update player defense
        const players = this.world.getEntitiesByType('player');
        for (const player of players) {
            this.updateDefense(player, deltaTime);
        }

        // Update enemy defense
        const enemies = this.world.getEntitiesByType('enemy');
        for (const enemy of enemies) {
            this.updateDefense(enemy, deltaTime);
        }
    }

    /**
     * Update defense component for an entity
     * @param {Entity} entity - Entity to update
     * @param {number} deltaTime - Time elapsed
     */
    updateDefense(entity, deltaTime) {
        const defense = entity.getComponent('defense');
        if (!defense) return;

        // Update each layer
        this.updateLayer(defense.shield, deltaTime);
        this.updateLayer(defense.armor, deltaTime);
        this.updateLayer(defense.structure, deltaTime);
    }

    /**
     * Update a single defense layer
     * @param {Object} layer - Defense layer component
     * @param {number} deltaTime - Time elapsed
     */
    updateLayer(layer, deltaTime) {
        // Update regen delay
        if (layer.regenDelay > 0) {
            layer.regenDelay -= deltaTime;
        }

        // Apply regeneration if delay is over
        if (layer.regenDelay <= 0 && layer.regen > 0) {
            layer.current = Math.min(layer.max, layer.current + layer.regen * deltaTime);
        }

        // Ensure current doesn't go below 0 or above max
        layer.current = Math.max(0, Math.min(layer.max, layer.current));
    }

    /**
     * Apply damage to an entity's defense layers
     * @param {Entity} entity - Target entity
     * @param {number} rawDamage - Raw damage before resistance
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @returns {Object} Damage result { totalDamage, layersDamaged, destroyed }
     */
    applyDamage(entity, rawDamage, damageType = 'kinetic') {
        const defense = entity.getComponent('defense');
        if (!defense) {
            // Fallback to old health system if no defense component
            const health = entity.getComponent('health');
            if (health) {
                health.current -= rawDamage;
                return {
                    totalDamage: rawDamage,
                    layersDamaged: ['health'],
                    destroyed: health.current <= 0
                };
            }
            return { totalDamage: 0, layersDamaged: [], destroyed: false };
        }

        let remainingDamage = rawDamage;
        const layersDamaged = [];

        // Layer order: shield -> armor -> structure
        const layers = [
            { name: 'shield', data: defense.shield },
            { name: 'armor', data: defense.armor },
            { name: 'structure', data: defense.structure }
        ];

        for (const layer of layers) {
            if (remainingDamage <= 0) break;
            if (layer.data.current <= 0) continue;

            // Apply resistance
            const resistance = layer.data.resistances[damageType] || 0;
            const damageAfterResist = this.applyResistance(remainingDamage, resistance);

            // Apply damage to layer
            const damageDealt = Math.min(layer.data.current, damageAfterResist);
            layer.data.current -= damageDealt;
            layersDamaged.push(layer.name);

            // Reset regen delay for this layer
            if (layer.data.regenDelayMax > 0) {
                layer.data.regenDelay = layer.data.regenDelayMax;
            }

            // Calculate overflow
            const overflow = damageAfterResist - damageDealt;
            if (overflow > 0) {
                // Overflow needs to be recalculated for next layer's resistance
                // We need to find the raw damage that would cause this overflow
                remainingDamage = this.calculateOverflow(overflow, resistance);
            } else {
                remainingDamage = 0;
            }
        }

        // Check if entity is destroyed (structure depleted)
        const destroyed = defense.structure.current <= 0;

        return {
            totalDamage: rawDamage - remainingDamage,
            layersDamaged,
            destroyed,
            damageType
        };
    }

    /**
     * Calculate damage after applying resistance
     * @param {number} rawDamage - Raw damage before resistance
     * @param {number} resistance - Resistance value (0-1)
     * @returns {number} Damage after resistance
     */
    applyResistance(rawDamage, resistance) {
        // Enforce 75% cap to prevent invulnerability
        const resistCap = typeof RESISTANCE_CAP !== 'undefined' ? RESISTANCE_CAP : 0.75;
        const cappedResistance = Math.min(resistance, resistCap);
        return rawDamage * (1 - cappedResistance);
    }

    /**
     * Calculate overflow damage for next layer
     * @param {number} overflow - Excess damage from current layer
     * @param {number} currentResistance - Current layer's resistance
     * @returns {number} Raw damage to apply to next layer
     */
    calculateOverflow(overflow, currentResistance) {
        // The overflow is the amount that went through after resistance
        // To get the raw damage equivalent, divide by the damage multiplier
        return overflow / (1 - Math.min(0.99, currentResistance));
    }

    /**
     * Get total HP remaining across all layers
     * @param {Entity} entity - Entity to check
     * @returns {number} Total HP
     */
    getTotalHP(entity) {
        const defense = entity.getComponent('defense');
        if (!defense) {
            const health = entity.getComponent('health');
            return health ? health.current : 0;
        }

        return defense.shield.current + defense.armor.current + defense.structure.current;
    }

    /**
     * Get max total HP across all layers
     * @param {Entity} entity - Entity to check
     * @returns {number} Max total HP
     */
    getMaxTotalHP(entity) {
        const defense = entity.getComponent('defense');
        if (!defense) {
            const health = entity.getComponent('health');
            return health ? health.max : 0;
        }

        return defense.shield.max + defense.armor.max + defense.structure.max;
    }

    /**
     * Get HP percentage for a specific layer
     * @param {Entity} entity - Entity to check
     * @param {string} layerName - Layer name (shield, armor, structure)
     * @returns {number} HP percentage (0-1)
     */
    getLayerPercent(entity, layerName) {
        const defense = entity.getComponent('defense');
        if (!defense || !defense[layerName]) return 0;

        const layer = defense[layerName];
        return layer.max > 0 ? layer.current / layer.max : 0;
    }

    /**
     * Check if entity has any defense remaining
     * @param {Entity} entity - Entity to check
     * @returns {boolean} True if entity has defense remaining
     */
    isAlive(entity) {
        const defense = entity.getComponent('defense');
        if (!defense) {
            const health = entity.getComponent('health');
            return health ? health.current > 0 : false;
        }

        return defense.structure.current > 0;
    }

    /**
     * Heal a specific layer
     * @param {Entity} entity - Entity to heal
     * @param {string} layerName - Layer to heal (shield, armor, structure)
     * @param {number} amount - Amount to heal
     */
    healLayer(entity, layerName, amount) {
        const defense = entity.getComponent('defense');
        if (!defense || !defense[layerName]) return;

        const layer = defense[layerName];
        layer.current = Math.min(layer.max, layer.current + amount);
    }

    /**
     * Modify layer max HP
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer to modify
     * @param {number} amount - Amount to add to max HP
     */
    modifyLayerMax(entity, layerName, amount) {
        const defense = entity.getComponent('defense');
        if (!defense || !defense[layerName]) return;

        const layer = defense[layerName];
        layer.max += amount;
        layer.current = Math.min(layer.max, layer.current);
    }

    /**
     * Modify layer resistance (ADDITIVE stacking with cap)
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer to modify
     * @param {string} damageType - Damage type
     * @param {number} amount - Amount to ADD to resistance (can be negative)
     */
    modifyLayerResistance(entity, layerName, damageType, amount) {
        const defense = entity.getComponent('defense');
        if (!defense || !defense[layerName]) return;

        const layer = defense[layerName];
        if (layer.resistances[damageType] !== undefined) {
            // ADDITIVE stacking with 75% hard cap
            const resistCap = typeof RESISTANCE_CAP !== 'undefined' ? RESISTANCE_CAP : 0.75;
            layer.resistances[damageType] = Math.max(0, Math.min(resistCap, layer.resistances[damageType] + amount));
        }
    }
}
