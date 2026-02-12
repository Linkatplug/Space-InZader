/**
 * @fileoverview Module Application System for Space InZader
 * Applies module benefits and costs to player stats at runtime
 */

/**
 * Apply all equipped modules to player stats
 * This is called when modules change or on game start
 * @param {Object} playerComponent - Player component with modules array
 * @param {Object} baseStats - Base stats before module bonuses
 * @returns {Object} Modified stats with module effects applied
 */
function applyModulesToStats(playerComponent, baseStats) {
    if (!playerComponent || !playerComponent.modules) {
        return baseStats;
    }
    
    // Clone base stats
    const modifiedStats = { ...baseStats };
    
    // Initialize module effect accumulators
    const accumulators = {
        shieldMax: 0,
        shieldRegen: 0,
        armorMax: 0,
        structureMax: 0,
        allResistances: 0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        heatGeneration: 1.0,
        coolingBonus: 0,
        passiveHeat: 0,
        emDamage: 1.0,
        thermalDamage: 1.0,
        kineticDamage: 1.0,
        explosiveDamage: 1.0,
        aoeRadius: 1.0,
        speed: 1.0,
        magnetRange: 1.0
    };
    
    // Apply each module's benefits and costs
    for (const module of playerComponent.modules) {
        if (!module) continue;
        
        const moduleData = typeof MODULES !== 'undefined' ? MODULES[module.id?.toUpperCase()] : null;
        if (!moduleData) continue;
        
        // Apply benefits
        if (moduleData.benefits) {
            for (const [key, value] of Object.entries(moduleData.benefits)) {
                if (key in accumulators) {
                    if (key.includes('Multiplier') || key.includes('Damage') || key.includes('radius') || key === 'speed' || key === 'magnetRange') {
                        accumulators[key] *= (1 + value);
                    } else {
                        accumulators[key] += value;
                    }
                }
            }
        }
        
        // Apply costs (negative effects)
        if (moduleData.costs) {
            for (const [key, value] of Object.entries(moduleData.costs)) {
                if (key in accumulators) {
                    if (key.includes('Multiplier') || key.includes('Damage') || key.includes('radius') || key === 'speed' || key === 'magnetRange') {
                        accumulators[key] *= (1 + value);
                    } else {
                        accumulators[key] += value;
                    }
                }
            }
        }
    }
    
    // Apply accumulators to stats
    if (modifiedStats.damage !== undefined) {
        modifiedStats.damage *= accumulators.damageMultiplier;
    }
    if (modifiedStats.fireRate !== undefined) {
        modifiedStats.fireRate *= accumulators.fireRateMultiplier;
    }
    if (modifiedStats.speed !== undefined) {
        modifiedStats.speed *= accumulators.speed;
    }
    if (modifiedStats.magnetRange !== undefined) {
        modifiedStats.magnetRange *= accumulators.magnetRange;
    }
    
    // Store additional module effects for other systems
    modifiedStats.moduleEffects = {
        shieldMaxBonus: accumulators.shieldMax,
        shieldRegenBonus: accumulators.shieldRegen,
        armorMaxBonus: accumulators.armorMax,
        structureMaxBonus: accumulators.structureMax,
        allResistancesBonus: accumulators.allResistances,
        heatGenerationMult: accumulators.heatGeneration,
        coolingBonus: accumulators.coolingBonus,
        passiveHeat: accumulators.passiveHeat,
        emDamageMult: accumulators.emDamage,
        thermalDamageMult: accumulators.thermalDamage,
        kineticDamageMult: accumulators.kineticDamage,
        explosiveDamageMult: accumulators.explosiveDamage,
        aoeRadiusMult: accumulators.aoeRadius
    };
    
    return modifiedStats;
}

/**
 * Apply module resistance bonuses to a defense component
 * Must be called when modules change
 * @param {Object} defense - Defense component with layers
 * @param {Object} moduleEffects - Module effects from applyModulesToStats
 */
function applyModuleResistances(defense, moduleEffects) {
    if (!defense || !moduleEffects) return;
    
    const allResistBonus = moduleEffects.allResistancesBonus || 0;
    
    if (allResistBonus === 0) return;
    
    // Apply to all layers and all damage types
    const layers = ['shield', 'armor', 'structure'];
    const damageTypes = ['em', 'thermal', 'kinetic', 'explosive'];
    
    for (const layerName of layers) {
        const layer = defense[layerName];
        if (!layer || !layer.resistances) continue;
        
        for (const damageType of damageTypes) {
            if (layer.resistances[damageType] !== undefined) {
                // Use additive stacking with cap
                const baseResist = layer.resistances[damageType];
                const resistCap = typeof RESISTANCE_CAP !== 'undefined' ? RESISTANCE_CAP : 0.75;
                layer.resistances[damageType] = Math.min(resistCap, baseResist + allResistBonus);
            }
        }
    }
}

/**
 * Apply module defense bonuses to a defense component
 * Must be called when modules change
 * @param {Object} defense - Defense component with layers
 * @param {Object} moduleEffects - Module effects from applyModulesToStats
 */
function applyModuleDefenseBonuses(defense, moduleEffects) {
    if (!defense || !moduleEffects) return;
    
    // Apply shield bonus
    if (moduleEffects.shieldMaxBonus && defense.shield) {
        defense.shield.max += moduleEffects.shieldMaxBonus;
        defense.shield.current = Math.min(defense.shield.max, defense.shield.current + moduleEffects.shieldMaxBonus);
    }
    
    // Apply shield regen bonus
    if (moduleEffects.shieldRegenBonus && defense.shield) {
        defense.shield.regen += moduleEffects.shieldRegenBonus;
    }
    
    // Apply armor bonus
    if (moduleEffects.armorMaxBonus && defense.armor) {
        defense.armor.max += moduleEffects.armorMaxBonus;
        defense.armor.current = Math.min(defense.armor.max, defense.armor.current + moduleEffects.armorMaxBonus);
    }
    
    // Apply structure bonus
    if (moduleEffects.structureMaxBonus && defense.structure) {
        defense.structure.max += moduleEffects.structureMaxBonus;
        defense.structure.current = Math.min(defense.structure.max, defense.structure.current + moduleEffects.structureMaxBonus);
    }
}

/**
 * Get damage multiplier for a specific damage type from modules
 * @param {Object} moduleEffects - Module effects from applyModulesToStats
 * @param {string} damageType - em, thermal, kinetic, or explosive
 * @returns {number} Damage multiplier for that type
 */
function getModuleDamageMultiplier(moduleEffects, damageType) {
    if (!moduleEffects) return 1.0;
    
    switch (damageType) {
        case 'em':
            return moduleEffects.emDamageMult || 1.0;
        case 'thermal':
            return moduleEffects.thermalDamageMult || 1.0;
        case 'kinetic':
            return moduleEffects.kineticDamageMult || 1.0;
        case 'explosive':
            return moduleEffects.explosiveDamageMult || 1.0;
        default:
            return 1.0;
    }
}

/**
 * Apply module effects to heat component
 * @param {Object} heat - Heat component
 * @param {Object} moduleEffects - Module effects from applyModulesToStats
 */
function applyModuleHeatEffects(heat, moduleEffects) {
    if (!heat || !moduleEffects) return;
    
    // Apply cooling bonus (will be capped by HeatSystem)
    if (moduleEffects.coolingBonus !== undefined) {
        heat.coolingBonus = (heat.coolingBonus || 0) + moduleEffects.coolingBonus;
    }
    
    // Apply passive heat
    if (moduleEffects.passiveHeat !== undefined) {
        heat.passiveHeat = (heat.passiveHeat || 0) + moduleEffects.passiveHeat;
    }
}

/**
 * Initialize or update player with modules
 * Call this when player is created or when modules change
 * @param {Entity} player - Player entity
 * @param {Array} modules - Array of module objects
 */
function updatePlayerModules(player, modules) {
    if (!player) return;
    
    const playerComp = player.getComponent('player');
    if (!playerComp) return;
    
    // Store modules
    playerComp.modules = modules || [];
    
    // Get base stats (before module application)
    const baseStats = { ...playerComp.stats };
    
    // Apply modules to stats
    playerComp.stats = applyModulesToStats(playerComp, baseStats);
    
    // Apply to defense component if it exists
    const defense = player.getComponent('defense');
    if (defense && playerComp.stats.moduleEffects) {
        applyModuleDefenseBonuses(defense, playerComp.stats.moduleEffects);
        applyModuleResistances(defense, playerComp.stats.moduleEffects);
    }
    
    // Apply to heat component if it exists
    const heat = player.getComponent('heat');
    if (heat && playerComp.stats.moduleEffects) {
        applyModuleHeatEffects(heat, playerComp.stats.moduleEffects);
    }
}
