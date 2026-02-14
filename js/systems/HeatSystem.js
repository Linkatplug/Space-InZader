/**
 * @file HeatSystem.js
 * @description Manages heat generation, cooling, and overheat mechanics
 */

class HeatSystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
    }

    /**
     * Update heat for all entities with heat components
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        const players = this.world.getEntitiesByType('player');
        
        for (const player of players) {
            this.updateHeat(player, deltaTime);
        }
    }

    /**
     * Update heat component for an entity
     * @param {Entity} entity - Entity to update
     * @param {number} deltaTime - Time elapsed
     */
    updateHeat(entity, deltaTime) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        // Handle overheat timer - FIX: Initialize timer if undefined
        if (heat.overheated) {
            // Safety check: initialize timer if somehow undefined
            if (typeof heat.overheatTimer !== 'number') {
                console.warn('[HeatSystem] overheatTimer was undefined! Initializing to 1.0s');
                heat.overheatTimer = 1.0;
            }
            
            heat.overheatTimer -= deltaTime;
            
            if (heat.overheatTimer <= 0) {
                // Recovery from overheat with hysteresis (60% recovery point)
                const recoveryValue = typeof HEAT_SYSTEM !== 'undefined' 
                    ? HEAT_SYSTEM.OVERHEAT_RECOVERY_VALUE 
                    : heat.max * 0.6; // 60% hysteresis
                
                heat.overheated = false;
                heat.current = recoveryValue;
                
                console.log(`✅ [HeatSystem] OVERHEAT RECOVERED - Heat at ${recoveryValue.toFixed(1)}/${heat.max}`);
                    
                // Re-enable weapons if this is a player
                if (entity.type === 'player' && this.gameState) {
                    this.gameState.weaponDisabled = false;
                }
            }
            
            // Don't add passive heat while overheated
            return;
        }

        // Apply passive heat generation (guard against undefined)
        const passiveHeat = heat.passiveHeat ?? 0;
        heat.current += passiveHeat * deltaTime;

        // Apply cooling with cap enforcement (guard against undefined)
        const maxCoolingBonus = typeof HEAT_SYSTEM !== 'undefined' 
            ? HEAT_SYSTEM.MAX_COOLING_BONUS 
            : 2.0;
        const cooling = heat.cooling ?? 1;
        const cappedCoolingBonus = Math.min(heat.coolingBonus || 0, maxCoolingBonus);
        const effectiveCooling = cooling * (1 + cappedCoolingBonus);
        const coolingAmount = effectiveCooling * deltaTime;
        heat.current = Math.max(0, heat.current - coolingAmount);

        // Check for overheat
        if (heat.current >= heat.max) {
            this.triggerOverheat(entity);
        }
        
        // Sync heat to playerComp for tactical UI (if this is a player)
        if (entity.type === 'player') {
            const playerComp = entity.getComponent('player');
            if (playerComp) {
                playerComp.heat = heat;
            }
        }
    }

    /**
     * Add heat to an entity
     * @param {Entity} entity - Entity to add heat to
     * @param {number} amount - Heat amount to add
     * @returns {boolean} True if overheat was triggered
     */
    addHeat(entity, amount) {
        const heat = entity.getComponent('heat');
        if (!heat || heat.overheated) return false;

        heat.current += amount;

        // Check for overheat
        if (heat.current >= heat.max) {
            this.triggerOverheat(entity);
            return true;
        }

        return false;
    }

    /**
     * Trigger overheat condition
     * @param {Entity} entity - Entity to overheat
     */
    triggerOverheat(entity) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        // FIX: Always initialize overheatTimer properly
        const disableDuration = typeof HEAT_SYSTEM !== 'undefined'
            ? HEAT_SYSTEM.OVERHEAT_DISABLE_DURATION
            : 1.5; // Default 1.5 seconds
            
        heat.overheated = true;
        heat.overheatTimer = disableDuration; // CRITICAL: Always set this!
        heat.current = heat.max; // Keep at max during overheat

        // Visual/audio feedback
        console.log(`🔥 [HeatSystem] OVERHEAT START - Weapons disabled for ${disableDuration.toFixed(1)}s`);
        
        // Store overheat state in gameState if it's a player
        if (entity.type === 'player' && this.gameState) {
            this.gameState.weaponDisabled = true;
        }
    }

    /**
     * Check if entity is overheated
     * @param {Entity} entity - Entity to check
     * @returns {boolean} True if overheated
     */
    isOverheated(entity) {
        const heat = entity.getComponent('heat');
        return heat ? heat.overheated : false;
    }

    /**
     * Get heat percentage
     * @param {Entity} entity - Entity to check
     * @returns {number} Heat percentage (0-1)
     */
    getHeatPercent(entity) {
        const heat = entity.getComponent('heat');
        if (!heat) return 0;
        
        return heat.max > 0 ? Math.min(1, heat.current / heat.max) : 0;
    }

    /**
     * Check if heat is in warning zone
     * @param {Entity} entity - Entity to check
     * @returns {boolean} True if heat is high
     */
    isHeatWarning(entity) {
        const heatPercent = this.getHeatPercent(entity);
        const warningThreshold = typeof HEAT_SYSTEM !== 'undefined'
            ? HEAT_SYSTEM.WARNING_THRESHOLD
            : 0.8;
        
        return heatPercent >= warningThreshold;
    }

    /**
     * Modify cooling rate (with cap enforcement)
     * @param {Entity} entity - Entity to modify
     * @param {number} bonusPercent - Bonus percentage to add (e.g., 0.5 = +50%)
     */
    modifyCooling(entity, bonusPercent) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        // Update cooling bonus (will be capped in update loop)
        heat.coolingBonus = (heat.coolingBonus || 0) + bonusPercent;
    }
    
    /**
     * Get effective cooling rate with bonuses applied
     * @param {Entity} entity - Entity to check
     * @returns {number} Effective cooling rate
     */
    getEffectiveCooling(entity) {
        const heat = entity.getComponent('heat');
        if (!heat) return 0;
        
        const maxCoolingBonus = typeof HEAT_SYSTEM !== 'undefined' 
            ? HEAT_SYSTEM.MAX_COOLING_BONUS 
            : 2.0;
        const cappedBonus = Math.min(heat.coolingBonus || 0, maxCoolingBonus);
        return heat.cooling * (1 + cappedBonus);
    }

    /**
     * Modify passive heat generation
     * @param {Entity} entity - Entity to modify
     * @param {number} amount - Amount to add to passive heat
     */
    modifyPassiveHeat(entity, amount) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        heat.passiveHeat = Math.max(0, heat.passiveHeat + amount);
    }

    /**
     * Modify max heat capacity
     * @param {Entity} entity - Entity to modify
     * @param {number} amount - Amount to add to max heat
     */
    modifyMaxHeat(entity, amount) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        heat.max = Math.max(1, heat.max + amount);
    }

    /**
     * Force cool down (set heat to 0)
     * @param {Entity} entity - Entity to cool
     */
    forceCooldown(entity) {
        const heat = entity.getComponent('heat');
        if (!heat) return;

        heat.current = 0;
        heat.overheated = false;
        heat.overheatTimer = 0;
        
        if (entity.type === 'player' && this.gameState) {
            this.gameState.weaponDisabled = false;
        }
    }

    /**
     * Calculate heat per second from weapons
     * @param {Object[]} weapons - Array of equipped weapons
     * @returns {number} Total heat per second
     */
    calculateWeaponHeat(weapons) {
        let totalHeatPerSecond = 0;

        for (const weapon of weapons) {
            if (!weapon || !weapon.data) continue;

            const heat = weapon.data.heat || 0;
            const fireRate = weapon.data.fireRate || 1;
            totalHeatPerSecond += heat * fireRate;
        }

        return totalHeatPerSecond;
    }

    /**
     * Get visual heat level (for UI)
     * @param {Entity} entity - Entity to check
     * @returns {string} Heat level description
     */
    getHeatLevel(entity) {
        const percent = this.getHeatPercent(entity);

        if (percent >= 1.0) return 'OVERHEAT';
        if (percent >= 0.8) return 'CRITICAL';
        if (percent >= 0.6) return 'HIGH';
        if (percent >= 0.4) return 'MEDIUM';
        if (percent >= 0.2) return 'LOW';
        return 'COOL';
    }

    /**
     * Get heat color for UI
     * @param {Entity} entity - Entity to check
     * @returns {string} Color hex code
     */
    getHeatColor(entity) {
        const percent = this.getHeatPercent(entity);

        if (percent >= 1.0) return '#FF0000'; // Red - overheat
        if (percent >= 0.8) return '#FF6600'; // Orange-red - critical
        if (percent >= 0.6) return '#FF9900'; // Orange - high
        if (percent >= 0.4) return '#FFCC00'; // Yellow - medium
        if (percent >= 0.2) return '#99FF00'; // Yellow-green - low
        return '#00FF00'; // Green - cool
    }
}
