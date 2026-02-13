/**
 * @file DefenseSystem.js
 * @description Centralized damage application system for all entities
 * This is the ONLY system allowed to apply damage to entities
 */

class DefenseSystem {
    constructor(world, gameState, audioManager = null, screenEffects = null) {
        this.world = world;
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.screenEffects = screenEffects;
        
        // Event listeners for entity destruction
        this.destructionListeners = [];
    }

    /**
     * Apply damage to an entity using a DamagePacket
     * Damage is applied in order: Shield -> Armor -> Structure (Health)
     * 
     * @param {Entity} entity - The entity to damage
     * @param {DamagePacket} damagePacket - Immutable damage packet containing all damage information
     * @param {Entity} attacker - Optional attacker entity (for lifesteal, etc.)
     * @returns {Object} Result object with damage breakdown
     */
    applyDamage(entity, damagePacket, attacker = null) {
        if (!entity || !damagePacket) {
            logger.warn('DefenseSystem', 'applyDamage called with invalid parameters');
            return { totalDamage: 0, destroyed: false };
        }

        const health = entity.getComponent('health');
        if (!health) {
            logger.warn('DefenseSystem', `Entity ${entity.id} has no health component`);
            return { totalDamage: 0, destroyed: false };
        }

        // God mode check - no damage taken
        if (health.godMode) {
            return { totalDamage: 0, shieldDamage: 0, armorReduction: 0, structureDamage: 0, destroyed: false };
        }

        // Check invulnerability
        if (health.invulnerable) {
            return { totalDamage: 0, shieldDamage: 0, armorReduction: 0, structureDamage: 0, destroyed: false };
        }

        let remainingDamage = damagePacket.baseDamage;
        let shieldDamage = 0;
        let armorReduction = 0;
        let structureDamage = 0;

        // === LAYER 1: SHIELD ===
        // Shields are the first line of defense. They absorb damage but can be penetrated.
        // Shield penetration (0-1) determines how much damage bypasses the shield entirely.
        const shield = entity.getComponent('shield');
        if (shield && shield.current > 0 && remainingDamage > 0) {
            // Calculate damage that goes through the shield (penetration)
            const penetratingDamage = remainingDamage * damagePacket.shieldPenetration;
            const shieldableDamage = remainingDamage - penetratingDamage;
            
            // Shield absorbs what it can from the non-penetrating damage
            const actualShieldDamage = Math.min(shield.current, shieldableDamage);
            shield.current -= actualShieldDamage;
            shieldDamage = actualShieldDamage;
            
            // Remaining damage = penetrating damage + overflow from shield
            remainingDamage = penetratingDamage + (shieldableDamage - actualShieldDamage);
            
            // Reset shield regen delay when damaged
            shield.regenDelay = shield.regenDelayMax;
            
            // Visual feedback for shield hit
            if (this.screenEffects && actualShieldDamage > 0 && entity.type === 'player') {
                this.screenEffects.flash('#00FFFF', 0.2, 0.1);
            }
        }

        // === LAYER 2: ARMOR ===
        // Armor reduces incoming damage by a flat amount. It represents physical protection.
        // Armor penetration (0-1) determines how much damage ignores armor reduction.
        if (remainingDamage > 0) {
            const playerComp = entity.getComponent('player');
            const armorValue = playerComp ? (playerComp.stats.armor || 0) : 0;
            
            if (armorValue > 0) {
                // Calculate damage that bypasses armor (penetration)
                const penetratingDamage = remainingDamage * damagePacket.armorPenetration;
                const armorableDamage = remainingDamage - penetratingDamage;
                
                // Armor reduces the non-penetrating damage
                const armorReductionAmount = Math.min(armorValue, armorableDamage);
                armorReduction = armorReductionAmount;
                
                // Ensure at least 1 damage gets through armor (unless fully penetrated)
                const reducedDamage = Math.max(1, armorableDamage - armorReductionAmount);
                
                // Total remaining damage = penetrating + reduced damage
                remainingDamage = penetratingDamage + reducedDamage;
            }
        }

        // === LAYER 3: STRUCTURE (HEALTH) ===
        // The final layer is the entity's structural integrity (health).
        // Once this reaches zero, the entity is destroyed.
        if (remainingDamage > 0) {
            structureDamage = remainingDamage;
            health.current -= structureDamage;
            
            // Track damage statistics
            if (entity.type === 'enemy') {
                this.gameState.stats.damageDealt += structureDamage;
            } else if (entity.type === 'player') {
                this.gameState.stats.damageTaken += structureDamage;
            }
            
            // Apply lifesteal if attacker is player
            if (attacker && attacker.type === 'player' && entity.type === 'enemy') {
                this.applyLifesteal(attacker, structureDamage);
            }
            
            // Play hit sound and effects
            this.playHitEffects(entity, structureDamage);
            
            // Screen effects for player damage
            if (this.screenEffects && entity.type === 'player' && structureDamage > 0) {
                this.screenEffects.shake(5, 0.2);
                this.screenEffects.flash('#FF0000', 0.3, 0.15);
            }
        }

        // Check if entity is destroyed
        const destroyed = health.current <= 0;
        if (destroyed) {
            health.current = 0;
            this.emitEntityDestroyed(entity, attacker, damagePacket);
        }

        return {
            totalDamage: damagePacket.baseDamage,
            shieldDamage,
            armorReduction,
            structureDamage,
            destroyed
        };
    }

    /**
     * Apply lifesteal healing to the attacker
     * @private
     */
    applyLifesteal(attacker, damage) {
        const playerComp = attacker.getComponent('player');
        const playerHealth = attacker.getComponent('health');
        
        if (playerComp && playerHealth && playerComp.stats.lifesteal > 0) {
            const healAmount = damage * playerComp.stats.lifesteal;
            const newHealth = Math.min(playerHealth.max, playerHealth.current + healAmount);
            
            if (newHealth > playerHealth.current) {
                playerHealth.current = newHealth;
                logger.debug('DefenseSystem', `Lifesteal healed ${healAmount.toFixed(1)} HP`);
                
                // Lifesteal sound
                if (this.audioManager && this.audioManager.initialized) {
                    this.audioManager.playLifesteal();
                }
            }
        }
    }

    /**
     * Play hit effects (audio and visual)
     * @private
     */
    playHitEffects(entity, damage) {
        if (!this.audioManager || !this.audioManager.initialized) return;
        
        const renderable = entity.getComponent('renderable');
        const isBoss = renderable && renderable.size >= BOSS_SIZE_THRESHOLD;
        
        if (entity.type === 'enemy') {
            if (isBoss) {
                this.audioManager.playBossHit();
                
                // Boss hit screen shake
                if (this.screenEffects) {
                    this.screenEffects.shake(3, 0.1);
                    this.screenEffects.flash('#FFFFFF', 0.15, 0.08);
                }
            } else {
                this.audioManager.playSFX('hit', MathUtils.randomFloat(0.9, 1.1));
            }
        } else if (entity.type === 'player') {
            this.audioManager.playSFX('hit', 1.2);
        }
    }

    /**
     * Emit an entity destroyed event
     * @private
     */
    emitEntityDestroyed(entity, attacker, damagePacket) {
        const event = new CustomEvent('entityDestroyed', {
            detail: {
                entity: entity,
                entityId: entity.id,
                entityType: entity.type,
                attacker: attacker,
                attackerId: attacker ? attacker.id : null,
                damagePacket: damagePacket,
                timestamp: Date.now()
            }
        });
        
        // Dispatch to window for global listening
        window.dispatchEvent(event);
        
        // Call registered listeners
        for (const listener of this.destructionListeners) {
            listener(entity, attacker, damagePacket);
        }
        
        logger.debug('DefenseSystem', `Entity ${entity.id} (${entity.type}) destroyed`);
    }

    /**
     * Register a listener for entity destruction events
     * @param {Function} callback - Called when an entity is destroyed
     */
    onEntityDestroyed(callback) {
        this.destructionListeners.push(callback);
    }

    /**
     * Remove a destruction listener
     * @param {Function} callback - The listener to remove
     */
    offEntityDestroyed(callback) {
        const index = this.destructionListeners.indexOf(callback);
        if (index > -1) {
            this.destructionListeners.splice(index, 1);
        }
    }
}
