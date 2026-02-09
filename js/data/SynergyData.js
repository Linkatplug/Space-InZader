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
 * @property {number[]} thresholds - Activation thresholds [tier1, tier2, tier3]
 * @property {SynergyBonus} bonus2 - Bonus at tier 1 (2 stacks)
 * @property {SynergyBonus} bonus4 - Bonus at tier 2 (4 stacks)
 * @property {SynergyBonus} bonus6 - Bonus at tier 3 (6 stacks - powerful but with drawback)
 * @property {string} color - Display color
 */

const SYNERGIES = {
    blood: {
        id: 'blood',
        name: 'Vampirique',
        description: '2: +5% Lifesteal | 4: Soigne 15% PV max sur élite | 6: +15% Lifesteal MAIS -25% PV max',
        tagsCounted: ['vampire', 'on_hit', 'on_kill'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                lifesteal: 0.15,
                maxHealthMultiplier: -0.25
            }
        },
        color: '#FF1744'
    },
    
    crit: {
        id: 'crit',
        name: 'Critique',
        description: '2: +15% Dégâts Crit | 4: Crits explosent (40px, 35% dégâts) | 6: +30% Dégâts Crit MAIS -10% chance Crit',
        tagsCounted: ['crit'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                critDamage: 0.30,
                critChance: -0.10
            }
        },
        color: '#FFD700'
    },
    
    explosion: {
        id: 'explosion',
        name: 'Explosif',
        description: '2: +20% Rayon Explosion | 4: Explosions en chaîne (2x, 55px, 40%) | 6: +40% Rayon MAIS 15% auto-dégâts',
        tagsCounted: ['explosive', 'aoe'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                explosionRadius: 0.40,
                selfExplosionDamage: 0.15
            }
        },
        color: '#FF6B00'
    },
    
    heat: {
        id: 'heat',
        name: 'Chaleur',
        description: '2: +25% Refroidissement | 4: Montée dégâts (35% max, 3s) | 6: +50% Refroidissement MAIS surchauffe permanente',
        tagsCounted: ['heat', 'fire_rate'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                coolingRate: 0.50,
                heatGenerationMultiplier: 0.30
            }
        },
        color: '#FF4500'
    },
    
    dash: {
        id: 'dash',
        name: 'Mobilité',
        description: '2: -20% Cooldown Dash | 4: 250ms invulnérabilité sur dash | 6: -40% Cooldown MAIS -15% vitesse',
        tagsCounted: ['dash', 'speed'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                dashCooldown: -0.40,
                speedMultiplier: -0.15
            }
        },
        color: '#00E5FF'
    },
    
    summon: {
        id: 'summon',
        name: 'Invocation',
        description: '2: +1 Invocation Max | 4: Invocations héritent 25% stats | 6: +2 Invocations MAIS -20% dégâts',
        tagsCounted: ['summon', 'turret'],
        thresholds: [2, 4, 6],
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
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                summonCap: 2,
                damageMultiplier: -0.20
            }
        },
        color: '#00FF88'
    },
    
    glass_cannon: {
        id: 'glass_cannon',
        name: 'Canon de Verre',
        description: '2: +15% Dégâts | 4: +30% Dégâts MAIS +20% dégâts reçus | 6: +50% Dégâts MAIS +40% dégâts reçus',
        tagsCounted: ['glass_cannon', 'risk'],
        thresholds: [2, 4, 6],
        bonus2: {
            type: 'stat_add',
            stat: 'damageMultiplier',
            value: 0.15
        },
        bonus4: {
            type: 'stat_add_multi',
            stats: {
                damageMultiplier: 0.30,
                damageTakenMultiplier: 0.20
            }
        },
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                damageMultiplier: 0.50,
                damageTakenMultiplier: 0.40
            }
        },
        color: '#DC143C'
    },
    
    utility: {
        id: 'utility',
        name: 'Utilitaire',
        description: '2: +15% Portée | 4: +25% Rayon ramassage | 6: +30% Portée MAIS -10% dégâts',
        tagsCounted: ['utility', 'control', 'support'],
        thresholds: [2, 4, 6],
        bonus2: {
            type: 'stat_add',
            stat: 'rangeMultiplier',
            value: 0.15
        },
        bonus4: {
            type: 'stat_add',
            stat: 'magnetRange',
            value: 0.25
        },
        bonus6: {
            type: 'stat_add_multi',
            stats: {
                rangeMultiplier: 0.30,
                damageMultiplier: -0.10
            }
        },
        color: '#9370DB'
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
