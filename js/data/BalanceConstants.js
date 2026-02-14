/**
 * @fileoverview Balance constants and caps for Space InZader
 * Defines all system caps, limits, and balance values to prevent exploits
 */

/**
 * RESISTANCE CAPS
 * All resistance values are capped to prevent invulnerability
 */
const RESISTANCE_CAPS = {
    // Maximum resistance for any single damage type on any layer
    MAX_SINGLE_RESIST: 0.75, // 75% - hard cap
    
    // Maximum total resistance bonus from all sources (modules + synergies)
    MAX_RESIST_BONUS: 0.75, // Additive bonuses cap at 75%
    
    // Resistance stacking is ADDITIVE not multiplicative
    // Formula: effectiveResist = min(MAX_SINGLE_RESIST, baseResist + bonusAdditive)
    STACKING_TYPE: 'ADDITIVE'
};

/**
 * HEAT SYSTEM CAPS
 * Prevents infinite sustained DPS builds
 */
const HEAT_CAPS = {
    // Maximum cooling bonus from all sources
    MAX_COOLING_BONUS: 2.0, // 200% bonus = 3x base cooling
    
    // Effective formula: coolingEffective = baseCooling * (1 + min(coolingBonus, MAX_COOLING_BONUS))
    // With base cooling 10/s and max bonus 200%: max 30/s cooling
    
    // Maximum fire rate multiplier
    MAX_FIRE_RATE_MULT: 2.5, // 250% of base
    
    // Maximum damage multiplier
    MAX_DAMAGE_MULT: 3.0, // 300% of base
    
    // Heat sustainability threshold (for validation)
    SUSTAINABLE_HEAT_PERCENT: 0.95, // 95% - if a build can sustain this, it's meta-breaking
    
    // Minimum heat generation per weapon (prevents 0-heat builds)
    MIN_WEAPON_HEAT: 1
};

/**
 * CRITICAL HIT CAPS
 * Already defined in HeatData.js but documented here for completeness
 */
const CRIT_BALANCE = {
    MAX_CRIT_CHANCE: 0.60, // 60%
    MAX_CRIT_DAMAGE: 3.0,  // 300%
    
    // Expected crit factor at max: 1 + 0.6 * (3 - 1) = 2.2x
    MAX_EXPECTED_CRIT_FACTOR: 2.2,
    
    // Beam weapons: Crit should be per CYCLE not per TICK
    BEAM_CRIT_MODE: 'PER_CYCLE'
};

/**
 * TAG SYNERGY BALANCE
 */
const TAG_SYNERGY_BALANCE = {
    // Bonus thresholds
    TIER_1_COUNT: 3,
    TIER_1_BONUS: 0.08, // +8%
    
    TIER_2_COUNT: 5,
    TIER_2_BONUS: 0.18, // +18%
    
    // Malus for non-majority offensive tags
    NON_MAJORITY_MALUS: -0.10, // -10% MULTIPLICATIVE
    
    // Stacking type: MULTIPLICATIVE for nuanced interactions
    // Example: weapon with +8% bonus tag and -10% malus tag
    // Result: 1.08 * 0.9 = 0.972 (net -2.8%)
    STACKING_TYPE: 'MULTIPLICATIVE'
};

/**
 * DRONE BALANCE
 * Prevents drone meta from being too safe/dominant
 */
const DRONE_BALANCE = {
    // Drones generate INDIRECT heat through their spawner weapon
    HEAT_MODEL: 'INDIRECT', // Heat on drone spawn, not per drone shot
    
    // Maximum active drones per type
    MAX_DRONES_PER_WEAPON: 4,
    
    // Maximum total drones
    MAX_TOTAL_DRONES: 8,
    
    // Drone damage scaling
    DAMAGE_MULT_SCALING: true, // Drones benefit from player damage mult
    SYNERGY_SCALING: true, // Drones benefit from tag synergies
    
    // Heat per drone spawn
    HEAT_PER_DRONE_SPAWN: 8, // Defined in weapon data
    
    // Drone lifetime (seconds)
    DEFAULT_LIFETIME: 10
};

/**
 * TIER PROGRESSION BALANCE
 * Scaling must be moderate to preserve skill-based gameplay
 */
const TIER_PROGRESSION_BALANCE = {
    // Recommended tier bonuses (NOT exponential)
    T1: 0,    // 0% - baseline
    T2: 12,   // +12% global power
    T3: 24,   // +24% total (not +12% more)
    T4: 40,   // +40% total
    T5: 60,   // +60% total - MAXIMUM
    
    // Current implementation matches these values
    // Bonuses are ADDITIVE to base stats, not multiplicative layers
    APPLICATION: 'ADDITIVE_TO_BASE',
    
    // Example: 100 base damage, T5 = 100 * (1 + 0.60) = 160 damage
    // NOT: 100 * 1.12 * 1.12 * 1.16 * 1.22 * 1.20 (exponential)
};

/**
 * REACTIVE ARMOR BALANCE
 * Prevents permanent 75% resist cap
 */
const REACTIVE_ARMOR_BALANCE = {
    // Adaptive resist bonus per hit of that type
    ADAPTIVE_RESIST_BONUS: 0.10, // +10% to last damage type
    
    // Decay rate (resets over time if not hit by that type)
    DECAY_TIME: 5.0, // seconds
    
    // Can only adapt to ONE damage type at a time
    SINGLE_TYPE_ONLY: true,
    
    // Combined with Damage Control (+8% all) and cap (75%)
    // Maximum achievable: base + 10% adaptive + 8% damage_control
    // Example: Shield EM (0% base) -> 18% max
    // Example: Armor EM (50% base) -> 68% max (under cap)
};

/**
 * DPS FORMULA VALIDATION
 * Expected DPS = BaseDamage * DamageMult * FireRate * FireRateMult * CritFactor * SynergyFactor
 */
const DPS_FORMULA = {
    // All multipliers
    components: [
        'baseDamage',
        'damageMultiplier (capped at 3.0)',
        'fireRate',
        'fireRateMultiplier (capped at 2.5)',
        'expectedCritFactor (max 2.2)',
        'synergyFactor (tag bonuses/maluses)'
    ],
    
    // Theoretical max DPS multiplier (all caps)
    // 1.0 * 3.0 * 1.0 * 2.5 * 2.2 * 1.18 = 19.47x
    THEORETICAL_MAX_MULTIPLIER: 19.47,
    
    // Practical max (realistic build)
    // 1.0 * 2.0 * 1.0 * 1.8 * 1.8 * 1.08 = 6.99x
    PRACTICAL_MAX_MULTIPLIER: 7.0
};

/**
 * META BUILD VALIDATION THRESHOLDS
 * If any build exceeds these, it's meta-breaking
 */
const META_THRESHOLDS = {
    // Heat sustainability
    // If heatGenPerSec < coolingPerSec at 95% heat, build can run indefinitely
    MAX_SUSTAINABLE_HEAT_RATIO: 0.95, // heat/maxHeat
    
    // DPS threshold
    // If sustained DPS > 15x base weapon damage, too strong
    MAX_SUSTAINED_DPS_MULT: 15.0,
    
    // Resistance threshold
    // If average resistance across all types > 60%, too tanky
    MAX_AVERAGE_RESISTANCE: 0.60,
    
    // Specialization check
    // Each damage type build should have clear strengths/weaknesses
    SPECIALIZATION_RULES: {
        em_build: {
            strength: 'delete_shield',
            weakness: 'struggle_armor'
        },
        thermal_build: {
            strength: 'boss_finisher',
            weakness: 'weak_early'
        },
        kinetic_build: {
            strength: 'anti_tank',
            weakness: 'poor_swarm'
        },
        explosive_build: {
            strength: 'swarm_clear',
            weakness: 'weak_shield'
        }
    }
};

/**
 * Calculate if a build is heat-sustainable
 * @param {number} heatGenPerSec - Heat generated per second
 * @param {number} coolingPerSec - Cooling per second (with bonuses applied)
 * @param {number} maxHeat - Maximum heat capacity
 * @returns {Object} Sustainability analysis
 */
function validateHeatSustainability(heatGenPerSec, coolingPerSec, maxHeat = 100) {
    const netHeatRate = heatGenPerSec - coolingPerSec;
    const sustainableAtMax = netHeatRate <= 0;
    
    // Calculate equilibrium heat level
    let equilibriumHeat = 0;
    if (coolingPerSec > 0 && heatGenPerSec > 0) {
        equilibriumHeat = (heatGenPerSec / coolingPerSec) * maxHeat;
    }
    
    const equilibriumPercent = equilibriumHeat / maxHeat;
    const isMetaBreaking = equilibriumPercent >= META_THRESHOLDS.MAX_SUSTAINABLE_HEAT_RATIO;
    
    return {
        heatGenPerSec,
        coolingPerSec,
        netHeatRate,
        equilibriumHeat,
        equilibriumPercent,
        sustainableAtMax,
        isMetaBreaking,
        recommendation: isMetaBreaking 
            ? 'META-BREAKING: Build can sustain near-max heat indefinitely'
            : 'Balanced: Build will overheat with sustained fire'
    };
}

/**
 * Calculate total DPS with all multipliers
 * @param {Object} stats - Build stats
 * @returns {number} Total DPS
 */
function calculateTotalDPS(stats) {
    const {
        baseDamage = 10,
        damageMultiplier = 1.0,
        fireRate = 1.0,
        fireRateMultiplier = 1.0,
        critChance = 0.0,
        critDamage = 1.5,
        synergyFactor = 1.0
    } = stats;
    
    // Apply caps
    const cappedDamageMult = Math.min(damageMultiplier, HEAT_CAPS.MAX_DAMAGE_MULT);
    const cappedFireRateMult = Math.min(fireRateMultiplier, HEAT_CAPS.MAX_FIRE_RATE_MULT);
    const cappedCritChance = Math.min(critChance, CRIT_BALANCE.MAX_CRIT_CHANCE);
    const cappedCritDamage = Math.min(critDamage, CRIT_BALANCE.MAX_CRIT_DAMAGE);
    
    // Calculate expected crit factor
    const critFactor = 1 + cappedCritChance * (cappedCritDamage - 1);
    
    // Total DPS
    return baseDamage * cappedDamageMult * fireRate * cappedFireRateMult * critFactor * synergyFactor;
}

/**
 * Validate resistance stacking
 * @param {number} baseResist - Base resistance (0-1)
 * @param {number} bonusResist - Bonus resistance from modules/synergies (additive)
 * @returns {number} Effective resistance (capped)
 */
function calculateEffectiveResistance(baseResist, bonusResist) {
    // ADDITIVE stacking with cap
    return Math.min(RESISTANCE_CAPS.MAX_SINGLE_RESIST, baseResist + bonusResist);
}

// ========== GLOBAL EXPOSURE ==========
// Expose to window for passive loading
if (typeof window !== 'undefined') {
    window.BalanceConstants = {
        RESISTANCE_CAPS: RESISTANCE_CAPS,
        HEAT_CAPS: HEAT_CAPS,
        CRIT_BALANCE: CRIT_BALANCE,
        TAG_SYNERGY_BALANCE: TAG_SYNERGY_BALANCE,
        DRONE_BALANCE: DRONE_BALANCE,
        TIER_PROGRESSION_BALANCE: TIER_PROGRESSION_BALANCE,
        REACTIVE_ARMOR_BALANCE: REACTIVE_ARMOR_BALANCE,
        DPS_FORMULA: DPS_FORMULA,
        META_THRESHOLDS: META_THRESHOLDS,
        validateHeatSustainability: validateHeatSustainability,
        calculateTotalDPS: calculateTotalDPS,
        calculateEffectiveResistance: calculateEffectiveResistance
    };
    
    // Console log confirmation
    console.log('[Content] Balance constants loaded (RESIST_CAP: 0.75, MAX_COOLING: 2.0, CRIT_CAP: 0.6/3.0)');
}
