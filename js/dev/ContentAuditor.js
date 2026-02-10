/**
 * @file ContentAuditor.js
 * @description Systematic verification of all weapons and passives
 * Parses content data and verifies each item works correctly
 */

class ContentAuditor {
    constructor(game) {
        this.game = game;
        this.weapons = [];
        this.passives = [];
        this.verificationResults = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the auditor - parse all content
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('%c[ContentAuditor] Initializing...', 'color: #00ff00; font-weight: bold');
        
        this.parseWeapons();
        this.parsePassives();
        this.initialized = true;
        
        console.log(`%c[ContentAuditor] Parsed ${this.weapons.length} weapons and ${this.passives.length} passives`, 
            'color: #00ff00; font-weight: bold');
    }

    /**
     * Parse all weapons from WeaponData
     */
    parseWeapons() {
        this.weapons = [];
        
        if (typeof WeaponData === 'undefined' || !WeaponData.WEAPONS) {
            console.error('[ContentAuditor] WeaponData not available');
            return;
        }
        
        for (const [key, weapon] of Object.entries(WeaponData.WEAPONS)) {
            const parsed = {
                id: weapon.id,
                key: key,
                name: weapon.name,
                description: weapon.description,
                tags: weapon.tags || [],
                baseDamage: weapon.baseDamage,
                fireRate: weapon.fireRate,
                projectileSpeed: weapon.projectileSpeed,
                maxLevel: weapon.maxLevel,
                rarity: weapon.rarity,
                color: weapon.color,
                type: weapon.type,
                levels: weapon.levels || [],
                hasVisuals: !!weapon.color,
                hasSFX: true // Assume all weapons have sound
            };
            
            this.weapons.push(parsed);
            this.verificationResults.set(`weapon_${weapon.id}`, { status: 'PENDING', tested: false });
        }
    }

    /**
     * Parse all passives from PassiveData
     */
    parsePassives() {
        this.passives = [];
        
        if (typeof PassiveData === 'undefined' || !PassiveData.PASSIVES) {
            console.error('[ContentAuditor] PassiveData not available');
            return;
        }
        
        for (const [key, passive] of Object.entries(PassiveData.PASSIVES)) {
            const parsed = {
                id: passive.id,
                key: key,
                name: passive.name,
                description: passive.description,
                tags: passive.tags || [],
                effects: passive.effects || {},
                effectKeys: Object.keys(passive.effects || {}),
                maxStacks: passive.maxStacks || 1,
                rarity: passive.rarity,
                color: passive.color,
                icon: passive.icon,
                isMalus: this.hasMalusEffect(passive.effects)
            };
            
            this.passives.push(parsed);
            this.verificationResults.set(`passive_${passive.id}`, { status: 'PENDING', tested: false });
        }
    }

    /**
     * Check if a passive has any negative effects (malus)
     */
    hasMalusEffect(effects) {
        if (!effects) return false;
        
        for (const [key, value] of Object.entries(effects)) {
            // Negative values for most stats are malus
            if (typeof value === 'number' && value < 0) {
                // Exception: some reductions are intended (like cooldown reduction)
                if (!key.includes('Reduction') && !key.includes('Cost')) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Verify a weapon works correctly
     * @param {string} weaponId - Weapon ID to verify
     * @returns {Object} Verification result
     */
    verifyWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (!weapon) {
            return { status: 'FAIL', error: 'Weapon not found', tested: true };
        }

        const result = {
            status: 'OK',
            tested: true,
            checks: [],
            warnings: []
        };

        // Check 1: Has basic properties
        if (!weapon.name) {
            result.checks.push('❌ Missing name');
            result.status = 'FAIL';
        } else {
            result.checks.push('✓ Has name');
        }

        if (!weapon.baseDamage || weapon.baseDamage <= 0) {
            result.checks.push('❌ Invalid base damage');
            result.status = 'FAIL';
        } else {
            result.checks.push('✓ Has valid base damage');
        }

        if (!weapon.fireRate || weapon.fireRate <= 0) {
            result.checks.push('❌ Invalid fire rate');
            result.status = 'FAIL';
        } else {
            result.checks.push('✓ Has valid fire rate');
        }

        // Check 2: Has levels
        if (!weapon.levels || weapon.levels.length === 0) {
            result.checks.push('❌ No upgrade levels defined');
            result.status = 'FAIL';
        } else {
            result.checks.push(`✓ Has ${weapon.levels.length} upgrade levels`);
        }

        // Check 3: Verify levels are progressive
        if (weapon.levels && weapon.levels.length > 1) {
            let allProgressive = true;
            for (let i = 1; i < weapon.levels.length; i++) {
                if (weapon.levels[i].damage <= weapon.levels[i-1].damage) {
                    allProgressive = false;
                    break;
                }
            }
            if (!allProgressive) {
                result.warnings.push('⚠️ Some levels may not be progressive');
            }
        }

        // Check 4: Has visual/audio feedback
        if (!weapon.color) {
            result.warnings.push('⚠️ No color defined');
        }

        this.verificationResults.set(`weapon_${weaponId}`, result);
        return result;
    }

    /**
     * Verify a passive works correctly
     * @param {string} passiveId - Passive ID to verify
     * @returns {Object} Verification result
     */
    verifyPassive(passiveId) {
        const passive = this.passives.find(p => p.id === passiveId);
        if (!passive) {
            return { status: 'FAIL', error: 'Passive not found', tested: true };
        }

        const result = {
            status: 'OK',
            tested: true,
            checks: [],
            warnings: []
        };

        // Check 1: Has basic properties
        if (!passive.name) {
            result.checks.push('❌ Missing name');
            result.status = 'FAIL';
        } else {
            result.checks.push('✓ Has name');
        }

        // Check 2: Has effects
        if (!passive.effects || Object.keys(passive.effects).length === 0) {
            result.checks.push('❌ No effects defined');
            result.status = 'FAIL';
        } else {
            result.checks.push(`✓ Has ${passive.effectKeys.length} effect(s)`);
        }

        // Check 3: Verify effect keys are valid
        const validEffectKeys = [
            'damageMultiplier', 'fireRateMultiplier', 'critChance', 'critMultiplier',
            'lifesteal', 'maxHealthMultiplier', 'armor', 'speedMultiplier',
            'projectileSpeedMultiplier', 'rangeMultiplier', 'magnetRange', 'xpMultiplier',
            'luck', 'shield', 'shieldRegen', 'healthRegen', 'dashCooldownReduction',
            'overheatReduction', 'electricDamageBonus', 'stunChance', 'piercing',
            'projectileCount', 'chainCount', 'explosionRadius', 'slowAmount'
        ];

        for (const key of passive.effectKeys) {
            if (!validEffectKeys.includes(key)) {
                result.warnings.push(`⚠️ Unknown effect key: ${key}`);
            }
        }

        // Check 4: Verify effect values are reasonable
        for (const [key, value] of Object.entries(passive.effects)) {
            if (typeof value !== 'number') {
                result.checks.push(`❌ Effect ${key} has non-numeric value`);
                result.status = 'FAIL';
            } else if (Math.abs(value) > 100) {
                result.warnings.push(`⚠️ Effect ${key} has very large value: ${value}`);
            }
        }

        // Check 5: Has valid rarity
        const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        if (!validRarities.includes(passive.rarity)) {
            result.warnings.push(`⚠️ Invalid rarity: ${passive.rarity}`);
        }

        // Check 6: Has reasonable max stacks
        if (passive.maxStacks > 10) {
            result.warnings.push(`⚠️ Very high max stacks: ${passive.maxStacks}`);
        }

        this.verificationResults.set(`passive_${passiveId}`, result);
        return result;
    }

    /**
     * Test applying a passive to player and verify stats change
     * @param {string} passiveId - Passive ID to test
     * @returns {Object} Test result with before/after stats
     */
    testPassiveApplication(passiveId) {
        const passive = this.passives.find(p => p.id === passiveId);
        if (!passive) {
            return { success: false, error: 'Passive not found' };
        }

        // Get player
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) {
            return { success: false, error: 'No player found' };
        }

        const playerComp = player.getComponent('player');
        if (!playerComp) {
            return { success: false, error: 'Player component not found' };
        }

        // Capture stats before
        const statsBefore = JSON.parse(JSON.stringify(playerComp.stats));

        // Apply passive
        try {
            PassiveData.applyPassiveEffects(passive.id, playerComp.stats);
        } catch (error) {
            return { success: false, error: `Application failed: ${error.message}` };
        }

        // Capture stats after
        const statsAfter = JSON.parse(JSON.stringify(playerComp.stats));

        // Check if any stat changed
        let hasChanges = false;
        const changes = {};

        for (const key of Object.keys(statsAfter)) {
            if (statsBefore[key] !== statsAfter[key]) {
                hasChanges = true;
                changes[key] = {
                    before: statsBefore[key],
                    after: statsAfter[key],
                    delta: statsAfter[key] - statsBefore[key]
                };
            }
        }

        if (!hasChanges) {
            return { 
                success: false, 
                error: 'NO EFFECT DETECTED - Stats unchanged',
                statsBefore,
                statsAfter
            };
        }

        return {
            success: true,
            changes,
            statsBefore,
            statsAfter
        };
    }

    /**
     * Run full verification of all content
     * @returns {Object} Complete report
     */
    runFullAudit() {
        console.log('%c[ContentAuditor] Running full audit...', 'color: #ffaa00; font-weight: bold');
        
        const report = {
            weapons: { total: 0, ok: 0, fail: 0, pending: 0 },
            passives: { total: 0, ok: 0, fail: 0, pending: 0 },
            details: []
        };

        // Verify all weapons
        for (const weapon of this.weapons) {
            const result = this.verifyWeapon(weapon.id);
            report.weapons.total++;
            if (result.status === 'OK') report.weapons.ok++;
            else if (result.status === 'FAIL') report.weapons.fail++;
            else report.weapons.pending++;
            
            if (result.status === 'FAIL' || result.warnings.length > 0) {
                report.details.push({
                    type: 'weapon',
                    id: weapon.id,
                    name: weapon.name,
                    status: result.status,
                    checks: result.checks,
                    warnings: result.warnings
                });
            }
        }

        // Verify all passives
        for (const passive of this.passives) {
            const result = this.verifyPassive(passive.id);
            report.passives.total++;
            if (result.status === 'OK') report.passives.ok++;
            else if (result.status === 'FAIL') report.passives.fail++;
            else report.passives.pending++;
            
            if (result.status === 'FAIL' || result.warnings.length > 0) {
                report.details.push({
                    type: 'passive',
                    id: passive.id,
                    name: passive.name,
                    status: result.status,
                    checks: result.checks,
                    warnings: result.warnings
                });
            }
        }

        return report;
    }

    /**
     * Print audit report to console
     */
    printReport() {
        const report = this.runFullAudit();
        
        console.log('%c═══════════════════════════════════════', 'color: #00ffff');
        console.log('%c   CONTENT AUDIT REPORT', 'color: #00ffff; font-weight: bold; font-size: 16px');
        console.log('%c═══════════════════════════════════════', 'color: #00ffff');
        console.log('');
        
        console.log('%cWeapons:', 'color: #ffaa00; font-weight: bold');
        console.log(`  Total: ${report.weapons.total}`);
        console.log(`  %cOK: ${report.weapons.ok}`, 'color: #00ff00');
        console.log(`  %cFAIL: ${report.weapons.fail}`, 'color: #ff0000');
        console.log(`  PENDING: ${report.weapons.pending}`);
        console.log('');
        
        console.log('%cPassives:', 'color: #ffaa00; font-weight: bold');
        console.log(`  Total: ${report.passives.total}`);
        console.log(`  %cOK: ${report.passives.ok}`, 'color: #00ff00');
        console.log(`  %cFAIL: ${report.passives.fail}`, 'color: #ff0000');
        console.log(`  PENDING: ${report.passives.pending}`);
        console.log('');
        
        if (report.details.length > 0) {
            console.log('%c⚠️  Issues Found:', 'color: #ff8800; font-weight: bold');
            for (const detail of report.details) {
                console.log(`\n  [${detail.type.toUpperCase()}] ${detail.name} (${detail.id})`);
                console.log(`  Status: %c${detail.status}`, detail.status === 'FAIL' ? 'color: #ff0000' : 'color: #ffaa00');
                
                for (const check of detail.checks) {
                    console.log(`    ${check}`);
                }
                
                for (const warning of detail.warnings) {
                    console.log(`    ${warning}`);
                }
            }
        }
        
        console.log('');
        console.log('%c═══════════════════════════════════════', 'color: #00ffff');
        
        return report;
    }
}
