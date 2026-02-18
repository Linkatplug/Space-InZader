// === DEFENSE DEBUG MODE ===
// Set window.DEBUG_DEFENSE = true in browser console to enable detailed logging
// Set window.DEBUG_DEFENSE = false to disable (default)
window.DEBUG_DEFENSE = window.DEBUG_DEFENSE || false;

/**
 * @file DefenseSystem.js
 * @description Manages the 3-layer defense system and regeneration
 */

class DefenseSystem {
    /**
     * Valid defense layer names
     * @static
     * @constant {string[]}
     */
    static VALID_LAYERS = ['shield', 'armor', 'structure'];

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

        // Only log layer updates in debug mode (to avoid console spam every frame)
        if (window.DEBUG_DEFENSE) {
            console.debug('[DefenseSystem] Updating layer:', layerName);
        }

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
                const oldValue = layer.current;
                layer.current = Math.min(layer.max, layer.current + layer.regen * deltaTime);
                const regenAmount = layer.current - oldValue;
                
                // === DEBUG: Log regeneration tick ===
                if (window.DEBUG_DEFENSE && regenAmount > 0) {
                    console.log(`[DefenseSystem DEBUG] Regen tick: ${layerName}`);
                    console.log(`  Before: ${oldValue.toFixed(1)}/${layer.max}`);
                    console.log(`  After: ${layer.current.toFixed(1)}/${layer.max}`);
                    console.log(`  Regenerated: +${regenAmount.toFixed(1)}`);
                    if (layer.current >= layer.max) {
                        console.log(`  ✅ ${layerName} FULLY RESTORED`);
                    }
                }
            }
        }

        // Ensure current doesn't go below 0 or above max
        layer.current = Math.max(0, Math.min(layer.max, layer.current));
    }

    /**
     * Create damage context from packet and entity defense
     * @private
     * @param {DamagePacket} damagePacket - Damage packet
     * @param {Object} defense - Entity defense component
     * @returns {Object} Damage context
     */
    createDamageContext(damagePacket, defense) {
        return {
            damagePacket,
            defense,
            rawDamage: damagePacket.getFinalDamage(),
            remainingDamage: damagePacket.getFinalDamage(),
            layersDamaged: [],
            damageLog: [],
            layersDamageDealt: {},
            lastLayerHit: '',
            layers: [
                { name: 'shield', data: defense.shield, penetration: damagePacket.shieldPenetration },
                { name: 'armor', data: defense.armor, penetration: damagePacket.armorPenetration },
                { name: 'structure', data: defense.structure, penetration: 0 }
            ]
        };
    }

    /**
     * Compute effective resistance for a layer
     * @private
     * @param {Object} layer - Layer data
     * @param {string} damageType - Damage type
     * @returns {Object} Resistance calculation { baseResistance, bonusResistance, totalResistance, effectiveResistance }
     */
    computeLayerResistance(layer, damageType) {
        // Get base resistance from layer
        const baseResistance = (layer.data.baseResistances && layer.data.baseResistances[damageType]) || 0;
        
        // Get bonus resistance (defaults to 0 if not set)
        const bonusResistance = (layer.data.bonusResistances && layer.data.bonusResistances[damageType]) || 0;
        
        // Compute total resistance (base + bonus)
        const totalResistance = baseResistance + bonusResistance;
        
        // Clamp total resistance between RESISTANCE_MIN and RESISTANCE_CAP
        const resistCap = typeof RESISTANCE_CAP !== 'undefined' ? RESISTANCE_CAP : 0.75;
        const resistMin = typeof RESISTANCE_MIN !== 'undefined' ? RESISTANCE_MIN : -1.0;
        const clampedResistance = Math.max(resistMin, Math.min(resistCap, totalResistance));
        
        // Apply penetration to the total resistance
        const effectiveResistance = Math.max(0, clampedResistance * (1 - layer.penetration));
        
        return { 
            baseResistance, 
            bonusResistance,
            totalResistance: clampedResistance,
            effectiveResistance 
        };
    }

    /**
     * Apply damage to a single layer
     * @private
     * @param {Object} context - Damage context
     * @param {Object} layer - Layer to damage
     * @param {number} effectiveResistance - Effective resistance
     * @returns {Object} Layer damage result
     */
    applyDamageToLayer(context, layer, effectiveResistance) {
        const damageAfterResist = this.applyResistance(context.remainingDamage, effectiveResistance);
        const damageDealt = Math.min(layer.data.current, damageAfterResist);
        const beforeCurrent = layer.data.current;
        
        layer.data.current -= damageDealt;
        
        return {
            damageAfterResist,
            damageDealt,
            beforeCurrent
        };
    }

    /**
     * Check if layer is broken and calculate overflow
     * @private
     * @param {number} damageAfterResist - Damage after resistance
     * @param {number} damageDealt - Actual damage dealt
     * @param {number} effectiveResistance - Effective resistance
     * @returns {number} Overflow damage for next layer
     */
    checkLayerBreak(damageAfterResist, damageDealt, effectiveResistance) {
        const overflow = damageAfterResist - damageDealt;
        if (overflow > 0) {
            return this.calculateOverflow(overflow, effectiveResistance);
        }
        return 0;
    }

    /**
     * Check if entity is destroyed
     * @private
     * @param {Object} defense - Defense component
     * @returns {boolean} True if entity is destroyed
     */
    checkEntityDestroyed(defense) {
        return defense.structure.current <= 0;
    }

    /**
     * Finalize damage result
     * @private
     * @param {Object} context - Damage context
     * @param {boolean} destroyed - Whether entity is destroyed
     * @returns {Object} Damage result
     */
    finalizeDamageResult(context, destroyed) {
        const totalDealt = context.rawDamage - context.remainingDamage;
        
        return {
            incoming: context.rawDamage,
            dealt: totalDealt,
            layers: context.layersDamageDealt,
            layer: context.lastLayerHit,
            destroyed,
            totalDamage: totalDealt,
            layersDamaged: context.layersDamaged,
            damageType: context.damagePacket.damageType
        };
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

        // Create damage context
        const context = this.createDamageContext(damagePacket, defense);

        // Log damage calculation start
        logger.debug('DefenseSystem', `Applying ${context.rawDamage.toFixed(1)} ${damagePacket.damageType} damage to ${entity.type}${damagePacket.critMultiplier > 1 ? ' (CRIT x' + damagePacket.critMultiplier + ')' : ''}`, {
            shield: `${defense.shield.current.toFixed(1)}/${defense.shield.max}`,
            armor: `${defense.armor.current.toFixed(1)}/${defense.armor.max}`,
            structure: `${defense.structure.current.toFixed(1)}/${defense.structure.max}`,
            shieldPen: damagePacket.shieldPenetration > 0 ? `${(damagePacket.shieldPenetration * 100).toFixed(0)}%` : 'none',
            armorPen: damagePacket.armorPenetration > 0 ? `${(damagePacket.armorPenetration * 100).toFixed(0)}%` : 'none'
        });

        // Process damage through layers
        for (const layer of context.layers) {
            if (context.remainingDamage <= 0) break;
            if (layer.data.current <= 0) continue;

            // Compute effective resistance with penetration
            const resistances = this.computeLayerResistance(layer, damagePacket.damageType);
            
            // Apply damage to this layer
            const layerResult = this.applyDamageToLayer(context, layer, resistances.effectiveResistance);
            
            // Track damage to this layer
            context.layersDamaged.push(layer.name);
            context.layersDamageDealt[layer.name] = layerResult.damageDealt;
            context.lastLayerHit = layer.name;

            // Log damage to this layer
            context.damageLog.push({
                layer: layer.name,
                rawDamage: context.remainingDamage.toFixed(1),
                baseResistance: (resistances.baseResistance * 100).toFixed(0) + '%',
                penetration: layer.penetration > 0 ? (layer.penetration * 100).toFixed(0) + '%' : 'none',
                effectiveResistance: (resistances.effectiveResistance * 100).toFixed(0) + '%',
                damageAfterResist: layerResult.damageAfterResist.toFixed(1),
                damageDealt: layerResult.damageDealt.toFixed(1),
                before: layerResult.beforeCurrent.toFixed(1),
                after: layer.data.current.toFixed(1)
            });

            // Emit damage event for UI
            if (this.world.events) {
                const pos = entity.getComponent('position');
                this.world.events.emit('damageApplied', {
                    targetId: entity.id,
                    layerHit: layer.name,
                    finalDamage: layerResult.damageDealt,
                    damageType: damagePacket.damageType,
                    resistUsed: resistances.effectiveResistance,
                    isCrit: damagePacket.critMultiplier > 1,
                    x: pos ? pos.x : 0,
                    y: pos ? pos.y : 0
                });
            }

            // Reset regen delay for this layer
            if (layer.data.regenDelayMax > 0) {
                layer.data.regenDelay = layer.data.regenDelayMax;
            }

            // Check for layer break and calculate overflow
            context.remainingDamage = this.checkLayerBreak(
                layerResult.damageAfterResist,
                layerResult.damageDealt,
                resistances.effectiveResistance
            );
        }

        // Check if entity is destroyed
        const destroyed = this.checkEntityDestroyed(defense);
        
        // Emit entityDestroyed event if structure <= 0
        if (destroyed && this.world.events) {
            logger.warn('DefenseSystem', `Entity ${entity.type} destroyed by ${damagePacket.damageType} damage`);
            this.world.events.emit('entityDestroyed', {
                entityId: entity.id,
                entityType: entity.type,
                killedBy: damagePacket.damageType
            });
        }

        // Log damage summary
        if (context.damageLog.length > 0) {
            const summary = context.damageLog.map(d => {
                const penetrationInfo = d.penetration !== 'none' ? ` pen:${d.penetration}` : '';
                return `${d.layer}[${d.before}→${d.after}]: ${d.rawDamage}dmg * (1-${d.effectiveResistance}${penetrationInfo}) = ${d.damageAfterResist} → dealt ${d.damageDealt}`;
            }).join(' | ');
            logger.info('DefenseSystem', `${entity.type} took ${damagePacket.damageType} damage: ${summary}${destroyed ? ' → DESTROYED' : ''}`);
        }
        
        // === DEBUG: Log damage results ===
        if (window.DEBUG_DEFENSE) {
            const totalDealt = context.rawDamage - context.remainingDamage;
            console.log(`[DefenseSystem DEBUG] Entity ${entity.id} after damage:`);
            console.log(`  Shield: ${defense.shield.current.toFixed(1)}/${defense.shield.max}`);
            console.log(`  Armor: ${defense.armor.current.toFixed(1)}/${defense.armor.max}`);
            console.log(`  Structure: ${defense.structure.current.toFixed(1)}/${defense.structure.max}`);
            console.log(`  Total dealt: ${totalDealt.toFixed(1)}, Remaining: ${context.remainingDamage.toFixed(1)}`);
            if (destroyed) {
                console.log(`  ⚠️ ENTITY DESTROYED`);
            }
        }

        // Finalize and return damage result
        return this.finalizeDamageResult(context, destroyed);
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
     * @param {number} amount - Amount to ADD to bonus resistance (can be negative)
     */
    modifyLayerResistance(entity, layerName, damageType, amount) {
        const defense = entity.getComponent('defense');
        if (!defense || !defense[layerName]) return;

        const layer = defense[layerName];
        
        // Initialize bonusResistances if it doesn't exist (backward compatibility)
        if (!layer.bonusResistances) {
            layer.bonusResistances = {};
        }
        
        // Get current bonus (default to 0)
        const currentBonus = layer.bonusResistances[damageType] || 0;
        
        // Set new bonus value (no clamping here - clamping happens in computeLayerResistance)
        layer.bonusResistances[damageType] = currentBonus + amount;
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

    /**
     * Add a resistance modifier to a specific layer
     * PUBLIC API: Use this to add temporary or permanent resistance bonuses
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer name (shield, armor, structure)
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @param {number} value - Resistance value to add (can be negative for debuffs)
     * @returns {boolean} True if modifier was added, false if validation failed
     */
    addResistanceModifier(entity, layerName, damageType, value) {
        // Validate entity has defense component
        const defense = entity.getComponent('defense');
        if (!defense) {
            console.warn('[DefenseSystem] addResistanceModifier: Entity has no defense component');
            return false;
        }

        // Validate layer exists
        if (!DefenseSystem.VALID_LAYERS.includes(layerName)) {
            console.warn(`[DefenseSystem] addResistanceModifier: Invalid layer name "${layerName}". Must be one of: ${DefenseSystem.VALID_LAYERS.join(', ')}`);
            return false;
        }

        const layer = defense[layerName];
        if (!layer) {
            console.warn(`[DefenseSystem] addResistanceModifier: Layer "${layerName}" not found on entity`);
            return false;
        }

        // Initialize bonusResistances if it doesn't exist
        if (!layer.bonusResistances) {
            layer.bonusResistances = {};
        }

        // Get current bonus (default to 0)
        const currentBonus = layer.bonusResistances[damageType] || 0;

        // Add the new value to existing bonus
        layer.bonusResistances[damageType] = currentBonus + value;

        // Mark entity stats as dirty after modifying resistances
        this.markStatsDirty(entity);

        return true;
    }

    /**
     * Remove a resistance modifier from a specific layer
     * PUBLIC API: Use this to remove temporary resistance bonuses/debuffs
     * Automatically cleans up the key if the value reaches exactly 0
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer name (shield, armor, structure)
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @param {number} value - Resistance value to remove (subtracts from current)
     * @returns {boolean} True if modifier was removed, false if validation failed
     */
    removeResistanceModifier(entity, layerName, damageType, value) {
        // Validate entity has defense component
        const defense = entity.getComponent('defense');
        if (!defense) {
            console.warn('[DefenseSystem] removeResistanceModifier: Entity has no defense component');
            return false;
        }

        // Validate layer exists
        if (!DefenseSystem.VALID_LAYERS.includes(layerName)) {
            console.warn(`[DefenseSystem] removeResistanceModifier: Invalid layer name "${layerName}". Must be one of: ${DefenseSystem.VALID_LAYERS.join(', ')}`);
            return false;
        }

        const layer = defense[layerName];
        if (!layer) {
            console.warn(`[DefenseSystem] removeResistanceModifier: Layer "${layerName}" not found on entity`);
            return false;
        }

        // Initialize bonusResistances if it doesn't exist
        if (!layer.bonusResistances) {
            layer.bonusResistances = {};
        }

        // Get current bonus (default to 0)
        const currentBonus = layer.bonusResistances[damageType] || 0;

        // Subtract the value
        const newBonus = currentBonus - value;

        // If the new bonus is very close to 0 (within floating point precision), remove the key
        // Using epsilon of 1e-10 to handle floating point precision issues
        if (Math.abs(newBonus) < 1e-10) {
            delete layer.bonusResistances[damageType];
        } else {
            layer.bonusResistances[damageType] = newBonus;
        }

        // Mark entity stats as dirty after modifying resistances
        this.markStatsDirty(entity);

        return true;
    }

    /**
     * Clear all resistance modifiers from a specific layer
     * PUBLIC API: Use this to reset all temporary resistance bonuses/debuffs on a layer
     * @param {Entity} entity - Entity to modify
     * @param {string} layerName - Layer name (shield, armor, structure)
     * @returns {boolean} True if modifiers were cleared, false if validation failed
     */
    clearResistanceModifiers(entity, layerName) {
        // Validate entity has defense component
        const defense = entity.getComponent('defense');
        if (!defense) {
            console.warn('[DefenseSystem] clearResistanceModifiers: Entity has no defense component');
            return false;
        }

        // Validate layer exists
        if (!DefenseSystem.VALID_LAYERS.includes(layerName)) {
            console.warn(`[DefenseSystem] clearResistanceModifiers: Invalid layer name "${layerName}". Must be one of: ${DefenseSystem.VALID_LAYERS.join(', ')}`);
            return false;
        }

        const layer = defense[layerName];
        if (!layer) {
            console.warn(`[DefenseSystem] clearResistanceModifiers: Layer "${layerName}" not found on entity`);
            return false;
        }

        // Clear all bonus resistances by resetting to empty object
        layer.bonusResistances = {};

        // Mark entity stats as dirty after clearing resistances
        this.markStatsDirty(entity);

        return true;
    }

    /**
     * Mark entity stats as dirty for recalculation
     * PUBLIC API: Use this to mark an entity's stats as needing recalculation
     * @param {Entity} entity - Entity to mark as dirty
     */
    markStatsDirty(entity) {
        if (entity) {
            entity.statsDirty = true;
        }
    }

    /**
     * Check if entity stats are dirty
     * PUBLIC API: Use this to check if an entity's stats need recalculation
     * @param {Entity} entity - Entity to check
     * @returns {boolean} True if entity stats are dirty
     */
    isStatsDirty(entity) {
        return !!entity.statsDirty;
    }
}
