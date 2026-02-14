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
        
        // Sync defense to playerComp for tactical UI (if this is a player)
        if (entity.type === 'player') {
            const playerComp = entity.getComponent('player');
            if (playerComp) {
                playerComp.defenseLayers = defense;
            }
        }
    }

    /**
     * Update a single defense layer
     * @param {Object} layer - Defense layer component
     * @param {number} deltaTime - Time elapsed
     * @param {string} layerName - Name of the layer (shield, armor, structure)
     */
    updateLayer(layer, deltaTime, layerName) {
        // Defensive guards to prevent crashes
        if (!layer || typeof layer !== 'object') {
            console.warn('[DefenseSystem] Invalid layer object received');
            return;
        }
        if (!layerName || typeof layerName !== 'string') {
            console.warn('[DefenseSystem] Invalid layerName received');
            return;
        }

        // Debug log for testing stability (temporary)
        console.debug('[DefenseSystem] Updating layer:', layerName);

        // Update regen delay
        if (layer.regenDelay > 0) {
            layer.regenDelay -= deltaTime;
        }

        // Apply regeneration if delay is over
        // IMPORTANT: Don't regenerate structure if it's at 0 (player is destroyed)
        if (layer.regenDelay <= 0 && layer.regen > 0) {
            // For structure layer, don't regenerate if completely destroyed
            if (layerName === 'structure' && layer.current <= 0) {
                // Player is destroyed, no regeneration
            } else {
                layer.current = Math.min(layer.max, layer.current + layer.regen * deltaTime);
            }
        }

        // Ensure current doesn't go below 0 or above max
        layer.current = Math.max(0, Math.min(layer.max, layer.current));
    }

    /**
     * Apply damage to an entity's defense layers
     * @param {Entity} entity - Target entity
     * @param {number} rawDamage - Raw damage before resistance
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @returns {Object} Damage result { incoming, dealt, layers, layer, destroyed }
     */
    applyDamage(entity, rawDamage, damageType = 'kinetic') {
        // P0 FIX: Don't process damage if game is not running
        if (this.game && this.game.state.currentState !== 'RUNNING') {
            return {
                incoming: rawDamage,
                dealt: 0,
                layers: {},
                layer: '',
                destroyed: false,
                totalDamage: 0,
                layersDamaged: []
            };
        }

        const defense = entity.getComponent('defense');
        if (!defense) {
            // Fallback to old health system if no defense component
            const health = entity.getComponent('health');
            if (health) {
                health.current -= rawDamage;
                logger.debug('DefenseSystem', `Applied ${rawDamage} damage to ${entity.type} health (${health.current}/${health.max})`);
                return {
                    incoming: rawDamage,
                    dealt: rawDamage,
                    layers: { health: rawDamage },
                    layer: 'health',
                    destroyed: health.current <= 0,
                    // Legacy compatibility
                    totalDamage: rawDamage,
                    layersDamaged: ['health']
                };
            }
            return { 
                incoming: rawDamage,
                dealt: 0,
                layers: {},
                layer: '',
                destroyed: false,
                // Legacy compatibility
                totalDamage: 0,
                layersDamaged: []
            };
        }

        // Log damage calculation start
        logger.debug('DefenseSystem', `Applying ${rawDamage} ${damageType} damage to ${entity.type}`, {
            shield: `${defense.shield.current}/${defense.shield.max}`,
            armor: `${defense.armor.current}/${defense.armor.max}`,
            structure: `${defense.structure.current}/${defense.structure.max}`
        });

        let remainingDamage = rawDamage;
        const layersDamaged = [];
        const damageLog = [];
        const layersDamageDealt = {}; // Track damage dealt per layer
        let lastLayerHit = '';

        // Layer order: shield -> armor -> structure
        const layers = [
            { name: 'shield', data: defense.shield },
            { name: 'armor', data: defense.armor },
            { name: 'structure', data: defense.structure }
        ];

        for (const layer of layers) {
            if (remainingDamage <= 0) break;
            if (layer.data.current <= 0) continue;

            // Apply resistance from top-level resistances object
            const resistance = (defense.resistances && defense.resistances[layer.name] && defense.resistances[layer.name][damageType]) || 0;
            const damageAfterResist = this.applyResistance(remainingDamage, resistance);

            // Apply damage to layer
            const damageDealt = Math.min(layer.data.current, damageAfterResist);
            const beforeCurrent = layer.data.current;
            layer.data.current -= damageDealt;
            layersDamaged.push(layer.name);
            
            // Track damage dealt to this layer
            layersDamageDealt[layer.name] = damageDealt;
            lastLayerHit = layer.name;

            // Log damage to this layer
            damageLog.push({
                layer: layer.name,
                rawDamage: remainingDamage.toFixed(1),
                resistance: (resistance * 100).toFixed(0) + '%',
                damageAfterResist: damageAfterResist.toFixed(1),
                damageDealt: damageDealt.toFixed(1),
                before: beforeCurrent.toFixed(1),
                after: layer.data.current.toFixed(1)
            });

            // Emit damage event for UI
            if (this.world.events) {
                const pos = entity.getComponent('position');
                this.world.events.emit('damageApplied', {
                    targetId: entity.id,
                    layerHit: layer.name,
                    finalDamage: damageDealt,
                    damageType: damageType,
                    resistUsed: resistance,
                    x: pos ? pos.x : 0,
                    y: pos ? pos.y : 0
                });
            }

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
        
        // Calculate total damage dealt
        const totalDealt = rawDamage - remainingDamage;

        // Log damage summary
        if (damageLog.length > 0) {
            const summary = damageLog.map(d => 
                `${d.layer}[${d.before}→${d.after}]: ${d.rawDamage}dmg * (1-${d.resistance}) = ${d.damageAfterResist} → dealt ${d.damageDealt}`
            ).join(' | ');
            logger.info('DefenseSystem', `${entity.type} took ${damageType} damage: ${summary}${destroyed ? ' → DESTROYED' : ''}`);
        }

        return {
            // New format
            incoming: rawDamage,
            dealt: totalDealt,
            layers: layersDamageDealt,
            layer: lastLayerHit,
            destroyed,
            // Legacy compatibility (keep for backward compat)
            totalDamage: totalDealt,
            layersDamaged,
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
     * IMPORTANT: This is the ONLY safe way to modify resistances
     * All resistance changes MUST go through this method
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer to modify (shield, armor, structure)
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
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
    
    /**
     * Modify multiple resistances at once (utility method)
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer to modify
     * @param {Object} resistChanges - Object mapping damage types to changes
     */
    modifyMultipleResistances(entity, layerName, resistChanges) {
        for (const [damageType, amount] of Object.entries(resistChanges)) {
            this.modifyLayerResistance(entity, layerName, damageType, amount);
        }
    }
    
    /**
     * Apply resistance bonus to all layers and all types
     * Used for modules like Damage Control
     * @param {Entity} entity - Entity to modify
     * @param {number} bonusAmount - Amount to add to all resistances
     */
    modifyAllResistances(entity, bonusAmount) {
        const layers = ['shield', 'armor', 'structure'];
        const damageTypes = ['em', 'thermal', 'kinetic', 'explosive'];
        
        for (const layer of layers) {
            for (const damageType of damageTypes) {
                this.modifyLayerResistance(entity, layer, damageType, bonusAmount);
            }
        }
    }
}
