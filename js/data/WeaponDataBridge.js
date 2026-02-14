/**
 * @fileoverview WeaponDataBridge.js
 * Bridge layer that maps NEW_WEAPONS to the old WeaponData API
 * This allows the game to use the new weapon system without modifying Game.js
 * 
 * IMPORTANT: This file must be loaded AFTER NewWeaponData.js
 */

(function() {
    'use strict';

    // Check if NEW_WEAPONS is available
    if (typeof window.NEW_WEAPONS === 'undefined') {
        console.error('[Bridge] ERROR: NEW_WEAPONS not found! Make sure NewWeaponData.js is loaded first.');
        return;
    }

    // Count weapons
    const weaponCount = Object.keys(window.NEW_WEAPONS).length;
    console.log(`[Bridge] NEW_WEAPONS count: ${weaponCount}`);

    /**
     * Convert NEW_WEAPONS format to old WeaponData.WEAPONS format
     * Maps new structure to old structure while preserving new fields
     */
    function convertNewWeaponToOld(newWeapon) {
        // Base conversion - map 'damage' to 'baseDamage'
        const converted = {
            id: newWeapon.id,
            name: newWeapon.name,
            description: newWeapon.description || '',
            baseDamage: newWeapon.damage, // KEY: Map damage -> baseDamage
            fireRate: newWeapon.fireRate,
            maxLevel: newWeapon.maxLevel || 5,
            rarity: newWeapon.rarity || 'common',
            tags: newWeapon.tags || [],
            color: newWeapon.color || '#FFFFFF',
            type: newWeapon.type || 'direct',
            
            // PRESERVE new fields - these are critical for new systems
            damageType: newWeapon.damageType, // em, thermal, kinetic, explosive
            heat: newWeapon.heat,             // heat generation
            pattern: newWeapon.pattern,       // attack pattern
            role: newWeapon.role,             // weapon role description
            
            // Optional fields from NEW_WEAPONS
            projectileSpeed: newWeapon.projectileSpeed || 800,
            areaRadius: newWeapon.areaRadius,
            chainCount: newWeapon.chainCount,
            droneCount: newWeapon.droneCount,
            
            // Generate simple level progression if not present
            levels: newWeapon.levels || generateDefaultLevels(newWeapon.maxLevel || 5)
        };

        return converted;
    }

    /**
     * Generate default level progression
     * Simple damage scaling for weapons without custom levels
     */
    function generateDefaultLevels(maxLevel) {
        const levels = [];
        for (let i = 0; i < maxLevel; i++) {
            levels.push({
                damage: 1.0 + (i * 0.25), // 1.0, 1.25, 1.5, 1.75, 2.0, ...
                projectileCount: 1
            });
        }
        return levels;
    }

    /**
     * Convert all NEW_WEAPONS to old format
     * Creates a WEAPONS object compatible with old WeaponData API
     */
    const bridgedWeapons = {};
    
    for (const [key, newWeapon] of Object.entries(window.NEW_WEAPONS)) {
        bridgedWeapons[key] = convertNewWeaponToOld(newWeapon);
    }

    /**
     * Get weapon data by ID (old API compatibility)
     * @param {string} weaponId - Weapon identifier
     * @returns {Object|null}
     */
    function getWeaponData(weaponId) {
        const upperKey = weaponId.toUpperCase();
        return bridgedWeapons[upperKey] || null;
    }

    /**
     * Get weapon evolution (kept empty for now as per requirements)
     * @param {string} weaponId - Current weapon ID
     * @param {number} weaponLevel - Current weapon level
     * @param {string} passiveId - Passive ID
     * @returns {Object|null}
     */
    function getWeaponEvolution(weaponId, weaponLevel, passiveId) {
        // Empty for now - evolutions can be added later
        return null;
    }

    // Override window.WeaponData with bridged version
    window.WeaponData = {
        WEAPONS: bridgedWeapons,
        WEAPON_EVOLUTIONS: {}, // Empty as per requirements
        getWeaponData: getWeaponData,
        getWeaponEvolution: getWeaponEvolution
    };

    console.log('[Bridge] WeaponData overridden -> using NEW_WEAPONS');
    console.log(`[Bridge] Available weapons: ${Object.keys(bridgedWeapons).join(', ')}`);
    
    // Debug: Show a sample weapon to verify structure
    const sampleKey = Object.keys(bridgedWeapons)[0];
    if (sampleKey) {
        console.log(`[Bridge] Sample weapon (${sampleKey}):`, bridgedWeapons[sampleKey]);
    }

})();
