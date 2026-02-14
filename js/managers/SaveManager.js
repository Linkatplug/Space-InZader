/**
 * @file SaveManager.js
 * @description Manages game save data using LocalStorage
 */

/**
 * Legacy weapon ID migration map
 * Maps old weapon IDs to new weapon IDs in the 24-weapon system
 * null values indicate weapons that should be removed (no equivalent)
 */
const LEGACY_TO_NEW_WEAPON_MAP = {
    'laser_frontal': 'ion_blaster',
    'mitraille': 'auto_cannon',
    'missiles_guides': 'overload_missile',
    'orbes_orbitaux': 'orbital_strike',
    'rayon_vampirique': null,  // No direct equivalent - remove
    'mines': 'incinerator_mine',
    'arc_electrique': 'arc_disruptor',
    'tourelle_drone': 'em_drone_wing',
    'lame_tournoyante': null  // Passive ability, not a weapon - remove
};

class SaveManager {
    constructor() {
        this.saveKey = 'spaceInZader_save';
        this.scoreboardKey = 'spaceInZader_scoreboard';
        this.defaultSave = this.createDefaultSave();
    }

    createDefaultSave() {
        return {
            version: '1.0.0',
            meta: {
                noyaux: 0,
                totalKills: 0,
                totalPlaytime: 0,
                runsCompleted: 0,
                highestLevel: 1,
                bossesDefeated: 0,
                maxWave: 0,
                bloodCritCount: 0
            },
            upgrades: {
                maxHealth: 0,        // +10 HP per level
                baseDamage: 0,       // +5% damage per level
                xpBonus: 0,          // +10% XP per level
                startingWeapons: 0,  // Unlock additional starting slots
                rerollUnlock: false, // Unlock reroll in level-up
                banishUnlock: false  // Unlock banish in level-up
            },
            ships: {
                vampire: { unlocked: true },
                mitrailleur: { unlocked: true },
                tank: { unlocked: true },
                sniper: { unlocked: true },
                engineer: { unlocked: false },
                berserker: { unlocked: false }
            },
            weapons: {
                laser_frontal: { unlocked: true },
                mitraille: { unlocked: true },
                missiles_guides: { unlocked: true },
                orbes_orbitaux: { unlocked: true },
                rayon_vampirique: { unlocked: true },
                mines: { unlocked: false },
                arc_electrique: { unlocked: false },
                tourelle_drone: { unlocked: false },
                lame_tournoyante: { unlocked: true }
            },
            passives: {
                surchauffe: { unlocked: true },
                radiateur: { unlocked: true },
                sang_froid: { unlocked: true },
                coeur_noir: { unlocked: false },
                bobines_tesla: { unlocked: false },
                focaliseur: { unlocked: false },
                mag_tractor: { unlocked: false },
                plating: { unlocked: true },
                reacteur: { unlocked: true },
                chance: { unlocked: false }
            },
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.7,
                showFPS: false
            },
            achievements: []
        };
    }

    load() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const data = JSON.parse(saved);
                // Merge with defaults for new fields
                const merged = this.mergeSaveData(this.defaultSave, data);
                // Migrate legacy weapon IDs to new weapon system
                this.migrateLegacyWeapons(merged);
                // Auto-add missing weapons and passives from data files
                this.ensureAllContentExists(merged);
                return merged;
            }
        } catch (e) {
            console.error('Error loading save:', e);
        }
        const defaultSave = this.createDefaultSave();
        this.ensureAllContentExists(defaultSave);
        return defaultSave;
    }
    
    /**
     * Migrate legacy weapon IDs to new weapon system
     * 
     * This method handles the transition from the old weapon system to the new 24-weapon system.
     * It safely converts legacy weapon IDs to their new equivalents without breaking existing saves.
     * 
     * Migration rules:
     * 1. Check each legacy weapon ID in the save data
     * 2. If a mapping exists and the new weapon isn't already unlocked, transfer the unlock state
     * 3. If mapping is null (no equivalent), simply remove the legacy entry
     * 4. Always remove the legacy weapon entry after processing to prevent duplicates
     * 
     * Defensive approach: Never overwrite an existing unlock for the new weapon ID.
     * This ensures that if a player already has the new weapon unlocked, we don't reset it.
     * 
     * @param {Object} saveData - The save data object to migrate
     */
    migrateLegacyWeapons(saveData) {
        // Ensure weapons object exists
        if (!saveData.weapons) {
            saveData.weapons = {};
            return;
        }
        
        let migratedCount = 0;
        let removedCount = 0;
        
        // Process each legacy weapon ID
        for (const legacyId in LEGACY_TO_NEW_WEAPON_MAP) {
            // Check if this legacy weapon exists in the save data
            if (saveData.weapons[legacyId]) {
                const newId = LEGACY_TO_NEW_WEAPON_MAP[legacyId];
                const legacyUnlockState = saveData.weapons[legacyId];
                
                if (newId !== null) {
                    // Mapping exists: transfer unlock state to new weapon ID
                    // Only transfer if the new weapon doesn't already exist (defensive)
                    if (!saveData.weapons[newId]) {
                        saveData.weapons[newId] = { ...legacyUnlockState };
                        migratedCount++;
                        console.log(`SaveManager: Migrated ${legacyId} -> ${newId} (unlocked: ${legacyUnlockState.unlocked})`);
                    } else {
                        console.log(`SaveManager: Skipped migration ${legacyId} -> ${newId} (new weapon already exists)`);
                    }
                } else {
                    // No mapping (null): weapon has no equivalent in new system
                    removedCount++;
                    console.log(`SaveManager: Removed legacy weapon ${legacyId} (no equivalent in new system)`);
                }
                
                // Remove the legacy entry to prevent duplicates
                delete saveData.weapons[legacyId];
            }
        }
        
        // Log summary if any migrations occurred
        if (migratedCount > 0 || removedCount > 0) {
            console.log(`SaveManager: Migration complete - ${migratedCount} weapons migrated, ${removedCount} removed`);
        }
    }
    
    /**
     * Ensure all weapons and passives from data files exist in save
     * Auto-unlocks based on rarity to make all content accessible
     */
    ensureAllContentExists(saveData) {
        // Ensure weapons object exists
        if (!saveData.weapons) {
            saveData.weapons = {};
        }
        
        // Add any missing weapons from WeaponData
        if (typeof WeaponData !== 'undefined' && WeaponData.WEAPONS) {
            for (const weaponKey in WeaponData.WEAPONS) {
                const weapon = WeaponData.WEAPONS[weaponKey];
                if (!saveData.weapons[weapon.id]) {
                    // Auto-unlock all content for dev-friendly experience
                    // Common/Uncommon always unlocked, Rare/Epic/Legendary also unlocked for testing
                    saveData.weapons[weapon.id] = { unlocked: true };
                    console.log(`SaveManager: Auto-added weapon ${weapon.id}`);
                }
            }
        }
        
        // Ensure passives object exists
        if (!saveData.passives) {
            saveData.passives = {};
        }
        
        // Add any missing passives from PassiveData
        if (typeof PassiveData !== 'undefined' && PassiveData.PASSIVES) {
            for (const passiveKey in PassiveData.PASSIVES) {
                const passive = PassiveData.PASSIVES[passiveKey];
                if (!saveData.passives[passive.id]) {
                    // Auto-unlock all content for dev-friendly experience
                    saveData.passives[passive.id] = { unlocked: true };
                    console.log(`SaveManager: Auto-added passive ${passive.id}`);
                }
            }
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving:', e);
            return false;
        }
    }

    mergeSaveData(defaults, saved) {
        const merged = { ...defaults };
        
        for (const key in saved) {
            if (typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
                merged[key] = { ...defaults[key], ...saved[key] };
            } else {
                merged[key] = saved[key];
            }
        }
        
        return merged;
    }

    addNoyaux(amount, saveData) {
        saveData.meta.noyaux += amount;
        this.save(saveData);
    }

    purchaseUpgrade(upgradeType, upgradeName, cost, saveData) {
        if (saveData.meta.noyaux < cost) {
            return false;
        }

        saveData.meta.noyaux -= cost;
        
        if (upgradeType === 'upgrades') {
            if (typeof saveData.upgrades[upgradeName] === 'number') {
                saveData.upgrades[upgradeName]++;
            } else {
                saveData.upgrades[upgradeName] = true;
            }
        } else if (upgradeType === 'ships' || upgradeType === 'weapons' || upgradeType === 'passives') {
            saveData[upgradeType][upgradeName].unlocked = true;
        }

        this.save(saveData);
        return true;
    }

    updateStats(gameStats, saveData) {
        saveData.meta.totalKills += gameStats.kills;
        saveData.meta.totalPlaytime += gameStats.time;
        saveData.meta.runsCompleted++;
        saveData.meta.highestLevel = Math.max(saveData.meta.highestLevel, gameStats.highestLevel);
        saveData.meta.maxWave = Math.max(saveData.meta.maxWave || 0, gameStats.wave || 0);
        saveData.meta.bossesDefeated += gameStats.bossKills || 0;
        saveData.meta.bloodCritCount = Math.max(saveData.meta.bloodCritCount || 0, gameStats.bloodCritCount || 0);
        
        this.save(saveData);
    }

    reset() {
        const confirmed = confirm('Are you sure you want to reset all progress? This cannot be undone.');
        if (confirmed) {
            localStorage.removeItem(this.saveKey);
            return this.createDefaultSave();
        }
        return null;
    }

    export() {
        const data = this.load();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spaceInZader_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    import(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.save(data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    /**
     * Add a score entry to the scoreboard
     * @param {Object} entry - Score entry
     * @param {number} entry.kills - Number of kills
     * @param {number} entry.time - Survival time in seconds
     * @param {number} entry.wave - Wave reached
     * @param {string} entry.class - Ship class used
     * @param {number} entry.bossKills - Number of bosses killed
     * @param {Array} entry.weapons - Weapons used
     * @param {Array} entry.passives - Passives acquired
     */
    addScoreEntry(entry) {
        try {
            const score = this.calculateScore(entry);
            const scoreEntry = {
                score,
                kills: entry.kills,
                time: entry.time,
                wave: entry.wave,
                class: entry.class,
                date: new Date().toISOString(),
                bossKills: entry.bossKills || 0,
                weapons: entry.weapons || [],
                passives: entry.passives || []
            };

            const scoreboard = this.getTopScores(100); // Keep top 100
            scoreboard.push(scoreEntry);
            scoreboard.sort((a, b) => b.score - a.score);
            
            // Keep only top 100
            const top100 = scoreboard.slice(0, 100);
            localStorage.setItem(this.scoreboardKey, JSON.stringify(top100));
            
            return scoreboard.indexOf(scoreEntry) + 1; // Return rank (1-based)
        } catch (e) {
            console.error('Error adding score entry:', e);
            return -1;
        }
    }

    /**
     * Calculate score from run stats
     * @param {Object} stats - Run statistics
     * @returns {number} Calculated score
     */
    calculateScore(stats) {
        return Math.floor(
            stats.kills * 10 +
            stats.wave * 500 +
            Math.floor(stats.time) +
            (stats.bossKills || 0) * 2000
        );
    }

    /**
     * Get top scores
     * @param {number} limit - Number of scores to return
     * @returns {Array} Array of score entries
     */
    getTopScores(limit = 10) {
        try {
            const saved = localStorage.getItem(this.scoreboardKey);
            if (saved) {
                const scores = JSON.parse(saved);
                return scores.slice(0, limit);
            }
        } catch (e) {
            console.error('Error loading scoreboard:', e);
        }
        return [];
    }

    /**
     * Clear all scores from scoreboard
     */
    clearScoreboard() {
        try {
            localStorage.removeItem(this.scoreboardKey);
            return true;
        } catch (e) {
            console.error('Error clearing scoreboard:', e);
            return false;
        }
    }
}
