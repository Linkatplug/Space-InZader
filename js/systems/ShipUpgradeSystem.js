/**
 * @fileoverview Ship Upgrade System for Space InZader
 * Handles application of ship-specific upgrades (Vampire Survivors style)
 */

class ShipUpgradeSystem {
    constructor(world) {
        this.world = world;
    }

    /**
     * Apply upgrade effects to player stats
     * @param {Entity} player - Player entity
     * @param {string} upgradeId - Upgrade identifier
     * @param {number} level - Current upgrade level (1-based)
     */
    applyUpgradeEffects(player, upgradeId, level) {
        const playerComp = player.getComponent('player');
        if (!playerComp) {
            console.error('ShipUpgradeSystem: Player component not found');
            return;
        }

        // Get ship upgrades
        const shipId = playerComp.shipId || 'ION_FRIGATE';
        const shipData = window.ShipUpgradeData?.SHIPS?.[shipId];
        
        if (!shipData) {
            console.error(`ShipUpgradeSystem: Ship data not found for ${shipId}`);
            return;
        }

        // Find the upgrade
        const upgrade = shipData.upgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error(`ShipUpgradeSystem: Upgrade ${upgradeId} not found in ${shipId}`);
            return;
        }

        console.log(`ShipUpgradeSystem: Applying ${upgrade.name} level ${level}`);

        // Apply perLevel benefits
        if (upgrade.perLevel) {
            this.applyEffectsDelta(playerComp.stats, upgrade.perLevel, 1);
        }

        // Apply tradeoffs (costs)
        if (upgrade.tradeoff) {
            this.applyEffectsDelta(playerComp.stats, upgrade.tradeoff, 1);
        }
    }

    /**
     * Apply effect deltas to stats
     * @param {Object} stats - Player stats object
     * @param {Object} effects - Effects to apply
     * @param {number} multiplier - Effect multiplier (typically 1)
     */
    applyEffectsDelta(stats, effects, multiplier = 1) {
        for (const [key, value] of Object.entries(effects)) {
            const delta = value * multiplier;

            // Handle different stat types
            if (key.endsWith('Mult') || key.includes('Multiplier')) {
                // Multiplicative stat (add to existing multiplier)
                if (!stats[key]) stats[key] = 1;
                stats[key] += delta;
            } else if (key.endsWith('Add') || key.includes('Bonus')) {
                // Additive stat
                if (!stats[key]) stats[key] = 0;
                stats[key] += delta;
            } else if (key.endsWith('Chance')) {
                // Chance stat (0-1 range)
                if (!stats[key]) stats[key] = 0;
                stats[key] = Math.min(1, stats[key] + delta);
            } else {
                // Default: additive
                if (!stats[key]) stats[key] = 0;
                stats[key] += delta;
            }
        }
    }

    /**
     * Calculate total upgrade effects for all player upgrades
     * Used when recalculating all stats from scratch
     * @param {Entity} player - Player entity
     * @returns {Object} Combined effects object
     */
    calculateTotalUpgradeEffects(player) {
        const playerComp = player.getComponent('player');
        if (!playerComp || !playerComp.upgrades) {
            return {};
        }

        const shipId = playerComp.shipId || 'ION_FRIGATE';
        const shipData = window.ShipUpgradeData?.SHIPS?.[shipId];
        
        if (!shipData) {
            console.error(`ShipUpgradeSystem: Ship data not found for ${shipId}`);
            return {};
        }

        const totalEffects = {};

        // Iterate through all player upgrades
        for (const [upgradeId, level] of playerComp.upgrades.entries()) {
            const upgrade = shipData.upgrades.find(u => u.id === upgradeId);
            if (!upgrade) continue;

            // Apply perLevel effects * level
            if (upgrade.perLevel) {
                for (const [key, value] of Object.entries(upgrade.perLevel)) {
                    if (!totalEffects[key]) totalEffects[key] = 0;
                    totalEffects[key] += value * level;
                }
            }

            // Apply tradeoffs * level
            if (upgrade.tradeoff) {
                for (const [key, value] of Object.entries(upgrade.tradeoff)) {
                    if (!totalEffects[key]) totalEffects[key] = 0;
                    totalEffects[key] += value * level;
                }
            }
        }

        return totalEffects;
    }

    /**
     * Get available upgrades for player (not maxed)
     * @param {Entity} player - Player entity
     * @returns {Array} Available upgrade objects with current level info
     */
    getAvailableUpgrades(player) {
        const playerComp = player.getComponent('player');
        if (!playerComp) return [];

        const shipId = playerComp.shipId || 'ION_FRIGATE';
        const shipData = window.ShipUpgradeData?.SHIPS?.[shipId];
        
        if (!shipData) {
            console.error(`ShipUpgradeSystem: Ship data not found for ${shipId}`);
            return [];
        }

        const available = [];

        for (const upgrade of shipData.upgrades) {
            const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
            
            if (currentLevel < upgrade.maxLevel) {
                available.push({
                    ...upgrade,
                    currentLevel,
                    nextLevel: currentLevel + 1
                });
            }
        }

        return available;
    }

    /**
     * Increment upgrade level and apply effects
     * @param {Entity} player - Player entity
     * @param {string} upgradeId - Upgrade identifier
     */
    incrementUpgrade(player, upgradeId) {
        const playerComp = player.getComponent('player');
        if (!playerComp) return;

        // Initialize upgrades Map if not exists
        if (!playerComp.upgrades) {
            playerComp.upgrades = new Map();
        }

        // Get current level
        const currentLevel = playerComp.upgrades.get(upgradeId) || 0;
        
        // Increment level
        const newLevel = currentLevel + 1;
        playerComp.upgrades.set(upgradeId, newLevel);

        console.log(`ShipUpgradeSystem: ${upgradeId} upgraded to level ${newLevel}`);

        // Apply the effects for this level
        this.applyUpgradeEffects(player, upgradeId, newLevel);
    }
}

// Expose to window
if (typeof window !== 'undefined') {
    window.ShipUpgradeSystem = ShipUpgradeSystem;
}
