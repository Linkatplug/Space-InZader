/**
 * @file SaveManager.js
 * @description Manages game save data using LocalStorage
 */

class SaveManager {
    constructor() {
        this.saveKey = 'spaceInZader_save';
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
                bossesDefeated: 0
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
                defenseur: { unlocked: true },
                mitrailleur: { unlocked: true },
                equilibre: { unlocked: true },
                vampire: { unlocked: false } // Unlock with Noyaux
            },
            weapons: {
                laser_frontal: { unlocked: true },
                mitraille: { unlocked: true },
                missiles_guides: { unlocked: true },
                orbes_orbitaux: { unlocked: true },
                rayon_vampirique: { unlocked: false },
                mines: { unlocked: false },
                arc_electrique: { unlocked: false },
                tourelle_drone: { unlocked: false }
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
}
