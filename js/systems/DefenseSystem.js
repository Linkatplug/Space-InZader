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

        // Update each layer (must pass layerName to avoid validation warnings)
        this.updateLayer(defense.shield, deltaTime, 'shield');
        this.updateLayer(defense.armor, deltaTime, 'armor');
        this.updateLayer(defense.structure, deltaTime, 'structure');
        
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
     * Apply damage to an entity's defense layers using DamagePacket
     * This is the ONLY method that should modify shield, armor, and structure
     * 
     * REQUIRED PACKET STRUCTURE:
     * {
     *   baseDamage: number,       // Base damage amount
     *   damageType: string,        // 'em', 'thermal', 'kinetic', or 'explosive'
     *   shieldPenetration?: number, // Optional: 0-1 (reduces shield resistance)
     *   armorPenetration?: number,  // Optional: 0-1 (reduces armor resistance)
     *   critChance?: number,        // Optional: 0-1 (not used here, for weapon calc)
     *   critMultiplier?: number     // Optional: multiplier applied to baseDamage
     * }
     * 
     * @param {Entity} entity - Target entity
     * @param {DamagePacket|number} damagePacketOrAmount - DamagePacket (preferred) or raw damage (legacy support)
     * @param {string} damageType - Damage type (only used for legacy raw number calls)
     * @returns {Object} Damage result { incoming, dealt, layers, layer, destroyed }
     */
    applyDamage(entity, damagePacketOrAmount, damageType = 'kinetic') {
        // P0 FIX: Don't process damage if game is not running
        if (this.game && this.game.state.currentState !== 'RUNNING') {
            const incomingDamage = typeof damagePacketOrAmount === 'number' ? damagePacketOrAmount : damagePacketOrAmount.getFinalDamage();
            return {
                incoming: incomingDamage,
                dealt: 0,
                layers: {},
                layer: '',
                destroyed: false,
                totalDamage: 0,
                layersDamaged: []
            };
        }

        // Support both DamagePacket and legacy (number, damageType) signatures
        // LEGACY SUPPORT: Convert raw number to DamagePacket for backward compatibility
        let damagePacket;
        if (typeof damagePacketOrAmount === 'number') {
            // Legacy call: applyDamage(entity, damage, damageType)
            logger.warn('DefenseSystem', `Legacy applyDamage call detected with raw number. Please use DamagePacket instead.`);
            damagePacket = new DamagePacket(damagePacketOrAmount, damageType);
        } else if (damagePacketOrAmount && typeof damagePacketOrAmount === 'object') {
            // New call: applyDamage(entity, damagePacket)
            // Validate it has the required structure
            if (!damagePacketOrAmount.baseDamage && !damagePacketOrAmount.damage) {
                logger.error('DefenseSystem', 'Invalid damage packet: missing baseDamage field', damagePacketOrAmount);
                return { 
                    incoming: 0,
                    dealt: 0,
                    layers: {},
                    layer: '',
                    destroyed: false,
                    totalDamage: 0,
                    layersDamaged: []
                };
            }
            damagePacket = damagePacketOrAmount;
        } else {
            // Invalid call
            logger.error('DefenseSystem', 'Invalid applyDamage call: must pass DamagePacket or number', damagePacketOrAmount);
            return { 
                incoming: 0,
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
            // No defense component found - entity cannot take damage
            logger.warn('DefenseSystem', `Entity ${entity.type} has no defense component and cannot take damage. Ensure createDefenseComponent() was called during entity creation.`);
            return { 
                incoming: damagePacket.getFinalDamage(),
                dealt: 0,
                layers: {},
                layer: '',
                destroyed: false,
                totalDamage: 0,
                layersDamaged: []
            };
        }

        // Apply crit multiplier to get final damage
        const rawDamage = damagePacket.getFinalDamage();

        // Log damage calculation start
        logger.debug('DefenseSystem', `Applying ${rawDamage.toFixed(1)} ${damagePacket.damageType} damage to ${entity.type}${damagePacket.critMultiplier > 1 ? ' (CRIT x' + damagePacket.critMultiplier + ')' : ''}`, {
            shield: `${defense.shield.current.toFixed(1)}/${defense.shield.max}`,
            armor: `${defense.armor.current.toFixed(1)}/${defense.armor.max}`,
            structure: `${defense.structure.current.toFixed(1)}/${defense.structure.max}`,
            shieldPen: damagePacket.shieldPenetration > 0 ? `${(damagePacket.shieldPenetration * 100).toFixed(0)}%` : 'none',
            armorPen: damagePacket.armorPenetration > 0 ? `${(damagePacket.armorPenetration * 100).toFixed(0)}%` : 'none'
        });

        let remainingDamage = rawDamage;
        const layersDamaged = [];
        const damageLog = [];
        const layersDamageDealt = {}; // Track damage dealt per layer
        let lastLayerHit = '';

        // Layer order: shield -> armor -> structure
        const layers = [
            { name: 'shield', data: defense.shield, penetration: damagePacket.shieldPenetration },
            { name: 'armor', data: defense.armor, penetration: damagePacket.armorPenetration },
            { name: 'structure', data: defense.structure, penetration: 0 } // Structure cannot be penetrated
        ];

        for (const layer of layers) {
            if (remainingDamage <= 0) break;
            if (layer.data.current <= 0) continue;

            // Get base resistance from layer
            const baseResistance = (layer.data.resistances && layer.data.resistances[damagePacket.damageType]) || 0;
            
            // Apply penetration: reduces effective resistance
            // Formula: effectiveResistance = baseResistance * (1 - penetration)
            // Example: 50% penetration on 40% base resistance = 40% * (1 - 0.5) = 20% effective resistance
            const effectiveResistance = Math.max(0, baseResistance * (1 - layer.penetration));
            
            // Apply resistance to calculate damage after resist
            const damageAfterResist = this.applyResistance(remainingDamage, effectiveResistance);

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
                baseResistance: (baseResistance * 100).toFixed(0) + '%',
                penetration: layer.penetration > 0 ? (layer.penetration * 100).toFixed(0) + '%' : 'none',
                effectiveResistance: (effectiveResistance * 100).toFixed(0) + '%',
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
                    damageType: damagePacket.damageType,
                    resistUsed: effectiveResistance,
                    isCrit: damagePacket.critMultiplier > 1,
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
                remainingDamage = this.calculateOverflow(overflow, effectiveResistance);
            } else {
                remainingDamage = 0;
            }
        }

        // Check if entity is destroyed (structure depleted)
        const destroyed = defense.structure.current <= 0;
        
        // Emit entityDestroyed event if structure <= 0
        if (destroyed && this.world.events) {
            logger.warn('DefenseSystem', `Entity ${entity.type} destroyed by ${damagePacket.damageType} damage`);
            this.world.events.emit('entityDestroyed', {
                entityId: entity.id,
                entityType: entity.type,
                killedBy: damagePacket.damageType
            });
        }
        
        // Calculate total damage dealt
        const totalDealt = rawDamage - remainingDamage;

        // Log damage summary
        if (damageLog.length > 0) {
            const summary = damageLog.map(d => {
                const penetrationInfo = d.penetration !== 'none' ? ` pen:${d.penetration}` : '';
                return `${d.layer}[${d.before}→${d.after}]: ${d.rawDamage}dmg * (1-${d.effectiveResistance}${penetrationInfo}) = ${d.damageAfterResist} → dealt ${d.damageDealt}`;
            }).join(' | ');
            logger.info('DefenseSystem', `${entity.type} took ${damagePacket.damageType} damage: ${summary}${destroyed ? ' → DESTROYED' : ''}`);
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
            damageType: damagePacket.damageType
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
