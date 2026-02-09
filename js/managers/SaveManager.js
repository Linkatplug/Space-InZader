/**
 * @file SaveManager.js
 * @description Manages game save data using LocalStorage
 */

class SaveManager {
    constructor() {
        this.saveKey = 'spaceInZader_save';
        this.scoreboardKey = 'spaceInZader_scoreboard';
        this.defaultSave = this.createDefaultSave();
    }

    createDefaultSave() {
        const weapons = this.buildWeaponUnlocks();
        const passives = this.buildPassiveUnlocks();

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
            weapons,
            passives,
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.7,
                showFPS: false
            },
            achievements: []
        };
    }

    buildWeaponUnlocks() {
        if (typeof WeaponData === 'undefined' || !WeaponData.WEAPONS) {
            return {
                laser_frontal: { unlocked: true },
                mitraille: { unlocked: true },
                missiles_guides: { unlocked: true },
                orbes_orbitaux: { unlocked: true },
                rayon_vampirique: { unlocked: true },
                mines: { unlocked: false },
                arc_electrique: { unlocked: false },
                tourelle_drone: { unlocked: false },
                lame_tournoyante: { unlocked: true }
            };
        }

        const weapons = {};
        Object.values(WeaponData.WEAPONS).forEach((weapon) => {
            weapons[weapon.id] = { unlocked: true };
        });

        const lockedWeapons = ['mines', 'arc_electrique', 'tourelle_drone'];
        lockedWeapons.forEach((weaponId) => {
            if (weapons[weaponId]) {
                weapons[weaponId].unlocked = false;
            }
        });

        if (!weapons.lame_tournoyante) {
            weapons.lame_tournoyante = { unlocked: true };
        }

        return weapons;
    }

    buildPassiveUnlocks() {
        if (typeof PassiveData === 'undefined' || !PassiveData.PASSIVES) {
            return {
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
            };
        }

        const passives = {};
        Object.values(PassiveData.PASSIVES).forEach((passive) => {
            passives[passive.id] = { unlocked: true };
        });

        const lockedPassives = ['coeur_noir', 'bobines_tesla', 'focaliseur', 'mag_tractor', 'chance'];
        lockedPassives.forEach((passiveId) => {
            if (passives[passiveId]) {
                passives[passiveId].unlocked = false;
            }
        });

        return passives;
    }

    load() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const data = JSON.parse(saved);
                // Merge with defaults for new fields
                return this.mergeSaveData(this.defaultSave, data);
            }
        } catch (e) {
            console.error('Error loading save:', e);
        }
        return this.createDefaultSave();
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
