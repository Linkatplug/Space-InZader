/**
 * @fileoverview Tag synergy system for Space InZader
 * Defines tag-based bonuses and maluses
 */

/**
 * Tag categories for synergy calculation
 */
const TAG_CATEGORIES = {
    DAMAGE_TYPES: ['em', 'thermal', 'kinetic', 'explosive'],
    WEAPON_BEHAVIORS: ['ballistic', 'beam', 'missile', 'drone', 'orbital', 'mine'],
    EFFECTS: ['area', 'chain', 'control', 'pierce', 'burst', 'sustained', 'dot'],
    SPECIAL: ['homing', 'summon', 'adaptive', 'ring']
};

/**
 * Synergy bonus thresholds and values
 */
const SYNERGY_THRESHOLDS = {
    TIER_1: {
        count: 3,
        bonus: 0.08  // +8% to tag
    },
    TIER_2: {
        count: 5,
        bonus: 0.18  // +18% to tag
    }
};

/**
 * Malus for non-majority offensive tags
 */
const NON_MAJORITY_MALUS = -0.10; // -10%

/**
 * Count tags from equipped items
 * @param {Object[]} items - Array of weapons and modules
 * @returns {Object} Tag counts { tagName: count }
 */
function countTags(items) {
    const tagCounts = {};
    
    for (const item of items) {
        if (!item || !item.tags) continue;
        
        for (const tag of item.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
    }
    
    return tagCounts;
}

/**
 * Calculate synergy bonuses for each tag
 * @param {Object} tagCounts - Tag counts from countTags()
 * @returns {Object} Synergy bonuses { tagName: bonusMultiplier }
 */
function calculateSynergyBonuses(tagCounts) {
    const bonuses = {};
    
    for (const [tag, count] of Object.entries(tagCounts)) {
        let bonus = 0;
        
        if (count >= SYNERGY_THRESHOLDS.TIER_2.count) {
            bonus = SYNERGY_THRESHOLDS.TIER_2.bonus;
        } else if (count >= SYNERGY_THRESHOLDS.TIER_1.count) {
            bonus = SYNERGY_THRESHOLDS.TIER_1.bonus;
        }
        
        bonuses[tag] = bonus;
    }
    
    return bonuses;
}

/**
 * Find the majority offensive tag (damage type or weapon behavior)
 * @param {Object} tagCounts - Tag counts
 * @returns {string|null} Majority tag or null
 */
function findMajorityOffensiveTag(tagCounts) {
    const offensiveTags = [
        ...TAG_CATEGORIES.DAMAGE_TYPES,
        ...TAG_CATEGORIES.WEAPON_BEHAVIORS
    ];
    
    let maxCount = 0;
    let majorityTag = null;
    
    for (const tag of offensiveTags) {
        const count = tagCounts[tag] || 0;
        if (count > maxCount) {
            maxCount = count;
            majorityTag = tag;
        }
    }
    
    return majorityTag;
}

/**
 * Calculate maluses for non-majority tags
 * @param {Object} tagCounts - Tag counts
 * @param {string} majorityTag - Majority offensive tag
 * @returns {Object} Maluses { tagName: malusMultiplier }
 */
function calculateMaluses(tagCounts, majorityTag) {
    const maluses = {};
    
    if (!majorityTag) return maluses;
    
    const offensiveTags = [
        ...TAG_CATEGORIES.DAMAGE_TYPES,
        ...TAG_CATEGORIES.WEAPON_BEHAVIORS
    ];
    
    for (const tag of offensiveTags) {
        if (tag !== majorityTag && tagCounts[tag] > 0) {
            maluses[tag] = NON_MAJORITY_MALUS;
        }
    }
    
    return maluses;
}

/**
 * Calculate complete tag system effects
 * @param {Object[]} weapons - Equipped weapons
 * @param {Object[]} modules - Equipped modules
 * @returns {Object} Complete synergy data
 */
function calculateTagEffects(weapons, modules) {
    const allItems = [...weapons, ...modules];
    const tagCounts = countTags(allItems);
    const bonuses = calculateSynergyBonuses(tagCounts);
    const majorityTag = findMajorityOffensiveTag(tagCounts);
    const maluses = calculateMaluses(tagCounts, majorityTag);
    
    return {
        tagCounts,
        bonuses,
        maluses,
        majorityTag
    };
}

/**
 * Get total multiplier for a specific tag
 * @param {string} tag - Tag to check
 * @param {Object} tagEffects - Tag effects from calculateTagEffects()
 * @returns {number} Total multiplier (1 = no change, 1.08 = +8%, 0.9 = -10%)
 */
function getTagMultiplier(tag, tagEffects) {
    let multiplier = 1.0;
    
    // Add bonus if exists
    if (tagEffects.bonuses[tag]) {
        multiplier += tagEffects.bonuses[tag];
    }
    
    // Add malus if exists
    if (tagEffects.maluses[tag]) {
        multiplier += tagEffects.maluses[tag];
    }
    
    return multiplier;
}

/**
 * Apply tag multipliers to weapon damage
 * Note: Uses multiplicative stacking for multiple tags on the same weapon.
 * For example, a weapon with both a +8% bonus tag and a -10% malus tag
 * will result in: 1.08 * 0.9 = 0.972 (net -2.8% instead of -2%).
 * This creates compounding effects but allows for more nuanced interactions.
 * 
 * @param {Object} weapon - Weapon data
 * @param {Object} tagEffects - Tag effects from calculateTagEffects()
 * @returns {number} Damage multiplier for this weapon
 */
function getWeaponTagMultiplier(weapon, tagEffects) {
    if (!weapon || !weapon.tags) return 1.0;
    
    let totalMultiplier = 1.0;
    
    // For each tag on the weapon, apply its multiplier
    for (const tag of weapon.tags) {
        const tagMult = getTagMultiplier(tag, tagEffects);
        // Use multiplicative stacking for multiple tags
        totalMultiplier *= tagMult;
    }
    
    return totalMultiplier;
}

/**
 * Get UI-friendly synergy summary
 * @param {Object} tagEffects - Tag effects from calculateTagEffects()
 * @returns {Object[]} Array of synergy descriptions
 */
function getSynergySummary(tagEffects) {
    const summary = [];
    
    // Add bonuses
    for (const [tag, bonus] of Object.entries(tagEffects.bonuses)) {
        if (bonus > 0) {
            const count = tagEffects.tagCounts[tag];
            summary.push({
                tag,
                type: 'bonus',
                multiplier: bonus,
                count,
                description: `${tag.toUpperCase()}: +${Math.round(bonus * 100)}% (${count} items)`
            });
        }
    }
    
    // Add maluses
    for (const [tag, malus] of Object.entries(tagEffects.maluses)) {
        if (malus < 0) {
            const count = tagEffects.tagCounts[tag];
            summary.push({
                tag,
                type: 'malus',
                multiplier: malus,
                count,
                description: `${tag.toUpperCase()}: ${Math.round(malus * 100)}% (not majority)`
            });
        }
    }
    
    // Add majority tag info
    if (tagEffects.majorityTag) {
        summary.push({
            type: 'info',
            description: `Majority Tag: ${tagEffects.majorityTag.toUpperCase()}`
        });
    }
    
    return summary;
}

// ========== GLOBAL EXPOSURE ==========
// Expose to window for passive loading
if (typeof window !== 'undefined') {
    window.TagSynergyData = {
        TAG_CATEGORIES: TAG_CATEGORIES,
        SYNERGY_THRESHOLDS: SYNERGY_THRESHOLDS,
        NON_MAJORITY_MALUS: NON_MAJORITY_MALUS,
        countTags: countTags,
        calculateSynergyBonuses: calculateSynergyBonuses,
        findMajorityOffensiveTag: findMajorityOffensiveTag,
        calculateMaluses: calculateMaluses,
        calculateTagEffects: calculateTagEffects,
        getTagMultiplier: getTagMultiplier,
        getWeaponTagMultiplier: getWeaponTagMultiplier,
        getSynergySummary: getSynergySummary
    };
    
    // Console log confirmation
    console.log('[Content] Tag synergy rules loaded (3+ => +8%, 5+ => +18%, malus -10%)');
}
