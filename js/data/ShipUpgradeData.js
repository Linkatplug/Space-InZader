/**
 * @fileoverview Ship upgrade trees for Space InZader
 * 4 ships with specialized upgrade paths (10-12 upgrades each)
 */

/**
 * Ship upgrade structure
 * @typedef {Object} ShipUpgrade
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Upgrade description
 * @property {number} maxLevel - Maximum level (typically 5)
 * @property {string[]} tags - Tags for synergies
 * @property {Object} perLevel - Effects per level
 * @property {Object} tradeoff - Trade-offs (costs)
 */

const SHIP_UPGRADES = {
    // ========== ION FRIGATE (EM/Shield specialist) ==========
    ION_FRIGATE: {
        id: 'ion_frigate',
        name: 'Aegis Ion Frigate',
        description: 'EM damage and shield specialist. Fast shield regeneration.',
        upgrades: [
            {
                id: 'EM_OVERCHARGE',
                name: 'EM Overcharge',
                description: 'Increase EM damage output, slightly more heat.',
                maxLevel: 5,
                tags: ['em', 'heat'],
                perLevel: {
                    emDamageMult: 0.08,      // +8% per level
                    emHeatMult: 0.05         // +5% heat per level
                },
                tradeoff: {}
            },
            {
                id: 'SHIELD_HARMONIZER',
                name: 'Shield Harmonizer',
                description: 'Boost shield capacity and regeneration.',
                maxLevel: 5,
                tags: ['shield', 'defense'],
                perLevel: {
                    shieldMaxAdd: 15,        // +15 per level
                    shieldRegenAdd: 1.0      // +1/s per level
                },
                tradeoff: {}
            },
            {
                id: 'ION_CAPACITOR',
                name: 'Ion Capacitor',
                description: 'Store energy for faster EM weapon fire rate.',
                maxLevel: 5,
                tags: ['em', 'firerate'],
                perLevel: {
                    emFireRateMult: 0.06,    // +6% per level
                },
                tradeoff: {
                    heatGenMult: 0.03        // +3% heat generation per level
                }
            },
            {
                id: 'REACTIVE_SHIELDING',
                name: 'Reactive Shielding',
                description: 'Shields adapt to recent damage types.',
                maxLevel: 3,
                tags: ['shield', 'adaptive'],
                perLevel: {
                    shieldResistAdd: 0.05,   // +5% all resistances per level
                },
                tradeoff: {}
            },
            {
                id: 'DISRUPTOR_ARRAY',
                name: 'Disruptor Array',
                description: 'EM weapons chain to nearby enemies.',
                maxLevel: 3,
                tags: ['em', 'area'],
                perLevel: {
                    emChainChance: 0.15,     // +15% chain chance per level
                    emChainRange: 50         // +50 range per level
                },
                tradeoff: {
                    emDamageMult: -0.05      // -5% EM damage per level (area tradeoff)
                }
            },
            {
                id: 'ENERGY_EFFICIENCY',
                name: 'Energy Efficiency',
                description: 'Reduce heat generation from EM weapons.',
                maxLevel: 5,
                tags: ['em', 'cooling'],
                perLevel: {
                    emHeatMult: -0.08,       // -8% heat per level
                },
                tradeoff: {}
            },
            {
                id: 'SHIELD_BURST',
                name: 'Shield Burst',
                description: 'Convert excess shield into EM damage burst.',
                maxLevel: 3,
                tags: ['shield', 'em', 'burst'],
                perLevel: {
                    shieldBurstDamage: 0.15, // +15% shield to damage conversion
                    shieldBurstCooldown: -1  // -1s cooldown per level
                },
                tradeoff: {
                    shieldMax: -10           // -10 max shield per level
                }
            },
            {
                id: 'ION_FOCUS',
                name: 'Ion Focus',
                description: 'Concentrate EM damage on single targets.',
                maxLevel: 5,
                tags: ['em', 'single'],
                perLevel: {
                    emSingleTargetMult: 0.10 // +10% single target damage
                },
                tradeoff: {
                    emAreaMult: -0.08        // -8% area damage
                }
            },
            {
                id: 'SHIELD_RECHARGER_CORE',
                name: 'Shield Recharger Core',
                description: 'Reduce shield regeneration delay.',
                maxLevel: 5,
                tags: ['shield', 'regen'],
                perLevel: {
                    shieldRegenDelayReduction: 0.2  // -0.2s delay per level
                },
                tradeoff: {}
            },
            {
                id: 'PLASMA_STABILIZER',
                name: 'Plasma Stabilizer',
                description: 'Increase critical hit chance with EM weapons.',
                maxLevel: 5,
                tags: ['em', 'crit'],
                perLevel: {
                    emCritChance: 0.04       // +4% crit chance per level
                },
                tradeoff: {}
            }
        ]
    },

    // ========== BALLISTIC DESTROYER (Kinetic/Armor specialist) ==========
    BALLISTIC_DESTROYER: {
        id: 'ballistic_destroyer',
        name: 'Bulwark Ballistic Destroyer',
        description: 'Kinetic damage and armor specialist. Heavy sustained fire.',
        upgrades: [
            {
                id: 'KINETIC_PIERCING',
                name: 'Kinetic Piercing',
                description: 'Increase armor penetration with kinetic weapons.',
                maxLevel: 5,
                tags: ['kinetic', 'penetration'],
                perLevel: {
                    kineticPenetration: 0.10, // +10% penetration per level
                },
                tradeoff: {}
            },
            {
                id: 'ARMOR_PLATING',
                name: 'Reinforced Armor Plating',
                description: 'Increase armor capacity and resistances.',
                maxLevel: 5,
                tags: ['armor', 'defense'],
                perLevel: {
                    armorMaxAdd: 20,         // +20 per level
                    armorResistAdd: 0.03     // +3% all resistances per level
                },
                tradeoff: {
                    speedMult: -0.02         // -2% speed per level
                }
            },
            {
                id: 'AUTO_LOADER',
                name: 'Auto Loader',
                description: 'Increase kinetic weapon fire rate.',
                maxLevel: 5,
                tags: ['kinetic', 'firerate'],
                perLevel: {
                    kineticFireRateMult: 0.08, // +8% fire rate per level
                },
                tradeoff: {
                    heatGenMult: 0.04        // +4% heat per level
                }
            },
            {
                id: 'REACTIVE_ARMOR',
                name: 'Reactive Armor',
                description: 'Armor adapts to recent damage types.',
                maxLevel: 3,
                tags: ['armor', 'adaptive'],
                perLevel: {
                    armorReactiveBonus: 0.10, // +10% resist to last type hit
                },
                tradeoff: {}
            },
            {
                id: 'SIEGE_MODE',
                name: 'Siege Mode',
                description: 'Massively boost kinetic damage at cost of mobility.',
                maxLevel: 3,
                tags: ['kinetic', 'siege'],
                perLevel: {
                    kineticDamageMult: 0.20, // +20% kinetic damage per level
                },
                tradeoff: {
                    speedMult: -0.15         // -15% speed per level
                }
            },
            {
                id: 'AMMO_FABRICATOR',
                name: 'Ammo Fabricator',
                description: 'Reduce kinetic weapon heat generation.',
                maxLevel: 5,
                tags: ['kinetic', 'cooling'],
                perLevel: {
                    kineticHeatMult: -0.10,  // -10% heat per level
                },
                tradeoff: {}
            },
            {
                id: 'BURST_LOADER',
                name: 'Burst Loader',
                description: 'Kinetic weapons fire in powerful bursts.',
                maxLevel: 3,
                tags: ['kinetic', 'burst'],
                perLevel: {
                    kineticBurstDamage: 0.25, // +25% burst damage
                    kineticBurstCount: 1      // +1 shot per burst
                },
                tradeoff: {
                    kineticFireRateMult: -0.15 // -15% fire rate
                }
            },
            {
                id: 'ARMOR_REGENERATION',
                name: 'Nano Repair',
                description: 'Slowly regenerate armor over time.',
                maxLevel: 5,
                tags: ['armor', 'regen'],
                perLevel: {
                    armorRegenAdd: 0.5       // +0.5/s per level
                },
                tradeoff: {}
            },
            {
                id: 'RAILGUN_ACCELERATOR',
                name: 'Railgun Accelerator',
                description: 'Increase kinetic projectile speed and damage.',
                maxLevel: 5,
                tags: ['kinetic', 'damage'],
                perLevel: {
                    kineticDamageMult: 0.10, // +10% damage per level
                    kineticProjectileSpeed: 100 // +100 speed per level
                },
                tradeoff: {}
            },
            {
                id: 'SHRAPNEL_BURST',
                name: 'Shrapnel Burst',
                description: 'Kinetic hits create area damage.',
                maxLevel: 3,
                tags: ['kinetic', 'area'],
                perLevel: {
                    kineticSplashDamage: 0.20, // +20% splash per level
                    kineticSplashRadius: 30    // +30 radius per level
                },
                tradeoff: {
                    kineticSingleTargetMult: -0.05 // -5% single target
                }
            },
            {
                id: 'KINETIC_STABILIZER',
                name: 'Kinetic Stabilizer',
                description: 'Increase critical damage with kinetic weapons.',
                maxLevel: 5,
                tags: ['kinetic', 'crit'],
                perLevel: {
                    kineticCritDamage: 0.15  // +15% crit damage per level
                },
                tradeoff: {}
            }
        ]
    },

    // ========== CATACLYSM CRUISER (Explosive/AoE specialist) ==========
    CATACLYSM_CRUISER: {
        id: 'cataclysm_cruiser',
        name: 'Cataclysm Explosive Cruiser',
        description: 'Explosive damage and AoE specialist. Zone control.',
        upgrades: [
            {
                id: 'WARHEAD_EXPANSION',
                name: 'Warhead Expansion',
                description: 'Increase explosive area of effect.',
                maxLevel: 5,
                tags: ['explosive', 'area'],
                perLevel: {
                    explosiveRadiusMult: 0.12, // +12% radius per level
                },
                tradeoff: {
                    explosiveDamageMult: -0.03 // -3% damage per level
                }
            },
            {
                id: 'EXPLOSIVE_PAYLOAD',
                name: 'Explosive Payload',
                description: 'Increase explosive damage output.',
                maxLevel: 5,
                tags: ['explosive', 'damage'],
                perLevel: {
                    explosiveDamageMult: 0.10, // +10% damage per level
                },
                tradeoff: {}
            },
            {
                id: 'CLUSTER_MUNITIONS',
                name: 'Cluster Munitions',
                description: 'Explosives split into multiple smaller bombs.',
                maxLevel: 3,
                tags: ['explosive', 'cluster'],
                perLevel: {
                    explosiveClusterCount: 2,  // +2 clusters per level
                    explosiveClusterDamage: 0.15 // +15% total damage per level
                },
                tradeoff: {
                    heatGenMult: 0.10        // +10% heat per level
                }
            },
            {
                id: 'STRUCTURE_REINFORCEMENT',
                name: 'Structure Reinforcement',
                description: 'Increase structure integrity.',
                maxLevel: 5,
                tags: ['structure', 'defense'],
                perLevel: {
                    structureMaxAdd: 15,     // +15 per level
                    structureRegenAdd: 0.2   // +0.2/s per level
                },
                tradeoff: {}
            },
            {
                id: 'MINEFIELD_DEPLOYER',
                name: 'Minefield Deployer',
                description: 'Deploy mines that last longer and deal more damage.',
                maxLevel: 5,
                tags: ['explosive', 'mine'],
                perLevel: {
                    mineDuration: 2,         // +2s duration per level
                    mineDamage: 0.15         // +15% damage per level
                },
                tradeoff: {}
            },
            {
                id: 'GRAVITY_WELL',
                name: 'Gravity Well',
                description: 'Explosives pull enemies toward impact point.',
                maxLevel: 3,
                tags: ['explosive', 'control'],
                perLevel: {
                    explosivePullStrength: 50, // +50 pull per level
                    explosivePullRadius: 30    // +30 pull radius per level
                },
                tradeoff: {}
            },
            {
                id: 'CHAIN_REACTION',
                name: 'Chain Reaction',
                description: 'Explosives can trigger nearby explosives.',
                maxLevel: 3,
                tags: ['explosive', 'chain'],
                perLevel: {
                    explosiveChainChance: 0.20, // +20% chain chance per level
                    explosiveChainRange: 60     // +60 chain range per level
                },
                tradeoff: {}
            },
            {
                id: 'MISSILE_GUIDANCE',
                name: 'Missile Guidance',
                description: 'Improve explosive weapon tracking.',
                maxLevel: 5,
                tags: ['explosive', 'tracking'],
                perLevel: {
                    explosiveTrackingMult: 0.15, // +15% tracking per level
                },
                tradeoff: {}
            },
            {
                id: 'ORBITAL_STRIKE_CORE',
                name: 'Orbital Strike Core',
                description: 'Reduce cooldown on orbital abilities.',
                maxLevel: 5,
                tags: ['explosive', 'orbital'],
                perLevel: {
                    orbitalCooldownReduction: 0.10, // -10% cooldown per level
                    orbitalDamageMult: 0.08         // +8% damage per level
                },
                tradeoff: {}
            },
            {
                id: 'DEMOLITION_EXPERT',
                name: 'Demolition Expert',
                description: 'Increase critical hit chance with explosives.',
                maxLevel: 5,
                tags: ['explosive', 'crit'],
                perLevel: {
                    explosiveCritChance: 0.05 // +5% crit chance per level
                },
                tradeoff: {}
            },
            {
                id: 'AREA_DENIAL',
                name: 'Area Denial',
                description: 'Explosives leave lingering damage zones.',
                maxLevel: 3,
                tags: ['explosive', 'dot'],
                perLevel: {
                    explosiveDotDuration: 2,  // +2s DOT per level
                    explosiveDotDamage: 0.10  // +10% DOT damage per level
                },
                tradeoff: {}
            }
        ]
    },

    // ========== TECH NEXUS (Thermal/Tech specialist) ==========
    TECH_NEXUS: {
        id: 'tech_nexus',
        name: 'Inferno Tech Nexus',
        description: 'Thermal damage and tech specialist. Heat management and DOT.',
        upgrades: [
            {
                id: 'THERMAL_AMPLIFIER',
                name: 'Thermal Amplifier',
                description: 'Increase thermal damage output.',
                maxLevel: 5,
                tags: ['thermal', 'damage'],
                perLevel: {
                    thermalDamageMult: 0.10,  // +10% damage per level
                },
                tradeoff: {}
            },
            {
                id: 'COOLING_SYSTEM',
                name: 'Advanced Cooling System',
                description: 'Increase heat dissipation rate.',
                maxLevel: 5,
                tags: ['cooling', 'heat'],
                perLevel: {
                    coolingAdd: 3,           // +3/s cooling per level
                },
                tradeoff: {}
            },
            {
                id: 'HEAT_RECYCLER',
                name: 'Heat Recycler',
                description: 'Convert excess heat into damage.',
                maxLevel: 3,
                tags: ['heat', 'damage'],
                perLevel: {
                    heatToDamageMult: 0.005,  // +0.5% damage per 1% heat per level
                },
                tradeoff: {}
            },
            {
                id: 'THERMAL_DOT',
                name: 'Thermal Burn',
                description: 'Thermal weapons apply damage over time.',
                maxLevel: 5,
                tags: ['thermal', 'dot'],
                perLevel: {
                    thermalDotDuration: 1,    // +1s DOT per level
                    thermalDotDamage: 0.08    // +8% DOT damage per level
                },
                tradeoff: {}
            },
            {
                id: 'BEAM_FOCUS',
                name: 'Beam Focus',
                description: 'Increase thermal beam weapon damage.',
                maxLevel: 5,
                tags: ['thermal', 'beam'],
                perLevel: {
                    thermalBeamDamageMult: 0.12, // +12% beam damage per level
                },
                tradeoff: {
                    thermalBeamHeatMult: 0.08    // +8% beam heat per level
                }
            },
            {
                id: 'OVERHEAT_CORE',
                name: 'Overheat Core',
                description: 'Gain massive damage boost at high heat.',
                maxLevel: 3,
                tags: ['heat', 'damage'],
                perLevel: {
                    overheatDamageBonus: 0.15,   // +15% damage per level above 75% heat
                },
                tradeoff: {
                    overheatThreshold: -0.05     // Overheat at -5% lower heat per level
                }
            },
            {
                id: 'PLASMA_GENERATOR',
                name: 'Plasma Generator',
                description: 'Reduce thermal weapon heat generation.',
                maxLevel: 5,
                tags: ['thermal', 'cooling'],
                perLevel: {
                    thermalHeatMult: -0.10,   // -10% heat per level
                },
                tradeoff: {}
            },
            {
                id: 'THERMAL_LANCE_CORE',
                name: 'Thermal Lance Core',
                description: 'Increase thermal penetration against structures.',
                maxLevel: 5,
                tags: ['thermal', 'penetration'],
                perLevel: {
                    thermalStructureMult: 0.15, // +15% damage to structure per level
                },
                tradeoff: {}
            },
            {
                id: 'HEAT_SINK',
                name: 'Emergency Heat Sink',
                description: 'Reduce overheat recovery time.',
                maxLevel: 5,
                tags: ['heat', 'recovery'],
                perLevel: {
                    overheatRecoveryReduction: 0.15, // -15% recovery time per level
                },
                tradeoff: {}
            },
            {
                id: 'THERMAL_FEEDBACK',
                name: 'Thermal Feedback',
                description: 'Thermal damage increases with consecutive hits.',
                maxLevel: 3,
                tags: ['thermal', 'stack'],
                perLevel: {
                    thermalStackDamage: 0.08,  // +8% per stack per level
                    thermalMaxStacks: 1        // +1 max stack per level
                },
                tradeoff: {}
            },
            {
                id: 'INCENDIARY_ROUNDS',
                name: 'Incendiary Rounds',
                description: 'Thermal weapons spread fire to nearby enemies.',
                maxLevel: 3,
                tags: ['thermal', 'spread'],
                perLevel: {
                    thermalSpreadChance: 0.15, // +15% spread chance per level
                    thermalSpreadRange: 40     // +40 spread range per level
                },
                tradeoff: {}
            },
            {
                id: 'THERMAL_CRIT',
                name: 'Thermal Precision',
                description: 'Increase critical damage with thermal weapons.',
                maxLevel: 5,
                tags: ['thermal', 'crit'],
                perLevel: {
                    thermalCritDamage: 0.12    // +12% crit damage per level
                },
                tradeoff: {}
            }
        ]
    }
};

/**
 * Get all upgrades for a specific ship
 * @param {string} shipId - Ship identifier
 * @returns {Object} Ship upgrade data
 */
function getShipUpgrades(shipId) {
    return SHIP_UPGRADES[shipId.toUpperCase()];
}

/**
 * Get upgrade by ID from any ship
 * @param {string} upgradeId - Upgrade identifier
 * @returns {Object|null} Upgrade data or null if not found
 */
function getUpgradeById(upgradeId) {
    for (const ship of Object.values(SHIP_UPGRADES)) {
        const upgrade = ship.upgrades.find(u => u.id === upgradeId);
        if (upgrade) return upgrade;
    }
    return null;
}

/**
 * Calculate total stats from upgrades
 * @param {Array} upgrades - Array of {id, level} objects
 * @returns {Object} Total stats from all upgrades
 */
function calculateUpgradeStats(upgrades) {
    const stats = {};
    
    for (const {id, level} of upgrades) {
        const upgrade = getUpgradeById(id);
        if (!upgrade) continue;
        
        // Apply per-level effects
        for (const [stat, valuePerLevel] of Object.entries(upgrade.perLevel)) {
            if (!stats[stat]) stats[stat] = 0;
            stats[stat] += valuePerLevel * level;
        }
        
        // Apply tradeoffs
        for (const [stat, valuePerLevel] of Object.entries(upgrade.tradeoff)) {
            if (!stats[stat]) stats[stat] = 0;
            stats[stat] += valuePerLevel * level;
        }
    }
    
    return stats;
}

// ========== GLOBAL EXPOSURE ==========
// Expose to window for passive loading
if (typeof window !== 'undefined') {
    window.ShipUpgradeData = {
        SHIPS: SHIP_UPGRADES,
        getShipUpgrades: getShipUpgrades,
        getUpgradeById: getUpgradeById,
        calculateUpgradeStats: calculateUpgradeStats
    };
    
    // Console log confirmation
    const shipCount = Object.keys(SHIP_UPGRADES).length;
    const upgradeDetails = Object.entries(SHIP_UPGRADES).map(([id, ship]) => {
        return `${id}=${ship.upgrades.length} upgrades`;
    }).join(', ');
    
    console.log(`[Content] Ship upgrades loaded: ${shipCount} ships (${upgradeDetails})`);
}
