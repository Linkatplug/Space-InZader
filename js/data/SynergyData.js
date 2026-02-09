/**
 * @fileoverview Synergy system data definitions for Space InZader
 * Synergies activate when player has enough items with matching tags
 */

/**
 * @typedef {Object} SynergyBonus
 * @property {string} type - Bonus type ('stat_add', 'event', 'mechanic')
 * @property {string} [stat] - Stat to modify (for stat_add)
 * @property {number} [value] - Value of the bonus
 * @property {string} [event] - Event trigger (for event type)
 * @property {Object} [effect] - Effect details
 */

/**
 * @typedef {Object} SynergyData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Synergy description
 * @property {string[]} tagsCounted - Tags that count toward this synergy
 * @property {number[]} thresholds - Activation thresholds [tier1, tier2]
 * @property {SynergyBonus} bonus2 - Bonus at tier 1 (threshold 2)
 * @property {SynergyBonus} bonus4 - Bonus at tier 2 (threshold 4)
 * @property {string} color - Display color
 */

const SYNERGIES = {
    blood: {
        id: 'blood',
        name: 'Blood',
        description: '2: +5% Lifesteal | 4: Heal 15% on elite kill',
        tagsCounted: ['vampire', 'on_hit', 'on_kill'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'lifesteal',
            value: 0.05
        },
        bonus4: {
            type: 'event',
            event: 'on_elite_kill',
            effect: { type: 'heal_percent_max', value: 0.15 }
        },
        color: '#FF1744'
    },
    
    crit: {
        id: 'crit',
        name: 'Critical',
        description: '2: +15% Crit Damage | 4: Crits explode (40px, 35% dmg)',
        tagsCounted: ['crit'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'critDamage',
            value: 0.15
        },
        bonus4: {
            type: 'mechanic',
            mechanic: 'crit_explosion',
            effect: {
                radius: 40,
                damage: 0.35,
                cooldown: 600
            }
        },
        color: '#FFD700'
    },
    
    explosion: {
        id: 'explosion',
        name: 'Explosion',
        description: '2: +20% Explosion Radius | 4: Chain explosions (2x, 55px, 40%)',
        tagsCounted: ['explosion', 'aoe'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'explosionRadius',
            value: 0.2
        },
        bonus4: {
            type: 'mechanic',
            mechanic: 'chain_explosion',
            effect: {
                chains: 2,
                radius: 55,
                damage: 0.4
            }
        },
        color: '#FF6B00'
    },
    
    heat: {
        id: 'heat',
        name: 'Heat',
        description: '2: +25% Cooling Rate | 4: Damage ramp (35% max, 3s)',
        tagsCounted: ['heat', 'fire_rate'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'coolingRate',
            value: 0.25
        },
        bonus4: {
            type: 'mechanic',
            mechanic: 'damage_ramp',
            effect: {
                maxBonus: 0.35,
                timeToMax: 3.0
            }
        },
        color: '#FF4500'
    },
    
    dash: {
        id: 'dash',
        name: 'Dash',
        description: '2: -20% Dash Cooldown | 4: 250ms invulnerability on dash',
        tagsCounted: ['dash', 'speed'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'dashCooldown',
            value: -0.2
        },
        bonus4: {
            type: 'mechanic',
            mechanic: 'dash_invuln',
            effect: {
                durationMs: 250
            }
        },
        color: '#00E5FF'
    },
    
    summon: {
        id: 'summon',
        name: 'Summon',
        description: '2: +1 Max Summons | 4: Summons inherit 25% of stats',
        tagsCounted: ['summon', 'turret'],
        thresholds: [2, 4],
        bonus2: {
            type: 'stat_add',
            stat: 'summonCap',
            value: 1
        },
        bonus4: {
            type: 'mechanic',
            mechanic: 'summon_inherit',
            effect: {
                inheritPercent: 0.25
            }
        },
        color: '#00FF88'
    }
};

/**
 * Get synergy data by ID
 * @param {string} synergyId - Synergy identifier
 * @returns {SynergyData|null}
 */
function getSynergy(synergyId) {
    return SYNERGIES[synergyId] || null;
}

/**
 * Get all synergies
 * @returns {SynergyData[]}
 */
function getAllSynergies() {
    return Object.values(SYNERGIES);
}

/**
 * Check which synergies are active for a given tag set
 * @param {Map<string, number>} tagCounts - Map of tag to count
 * @returns {Array<{synergy: SynergyData, count: number, threshold: number}>}
 */
function getActiveSynergies(tagCounts) {
    const active = [];
    
    getAllSynergies().forEach(synergy => {
        let count = 0;
        synergy.tagsCounted.forEach(tag => {
            count += tagCounts.get(tag) || 0;
        });
        
        if (count >= synergy.thresholds[0]) {
            const threshold = count >= synergy.thresholds[1] ? 4 : 2;
            active.push({ synergy, count, threshold });
        }
    });
    
    return active;
}

// Export to global namespace
const SynergyData = {
    SYNERGIES,
    getSynergy,
    getAllSynergies,
    getActiveSynergies
};

if (typeof window !== 'undefined') {
    window.SynergyData = SynergyData;
}
