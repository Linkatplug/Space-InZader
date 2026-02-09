/**
 * @fileoverview Synergy system for Space InZader
 * Tracks and applies synergy bonuses based on player's equipped items
 */

class SynergySystem {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.activeSynergies = new Map(); // synergyId -> {count, threshold}
        this.tagCounts = new Map();
        
        // Event tracking for synergy effects
        this.critExplosionCooldown = 0;
        this.chainExplosionTargets = new Set();
    }
    
    /**
     * Update synergy system
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        // Update cooldowns
        if (this.critExplosionCooldown > 0) {
            this.critExplosionCooldown -= deltaTime;
        }
        
        // Recalculate synergies (done less frequently or on item change)
        this.recalculateSynergies();
        
        // Apply active synergy effects
        this.applyActiveSynergies();
    }
    
    /**
     * Recalculate which synergies are active
     */
    recalculateSynergies() {
        if (!this.player) return;
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return;
        
        // Clear tag counts
        this.tagCounts.clear();
        
        // Count tags from weapons
        if (playerComp.weapons) {
            playerComp.weapons.forEach(weapon => {
                if (!weapon || !weapon.type) return;
                const weaponData = WeaponData.getWeaponData(weapon.type);
                if (weaponData && weaponData.tags) {
                    weaponData.tags.forEach(tag => {
                        this.tagCounts.set(tag, (this.tagCounts.get(tag) || 0) + 1);
                    });
                }
            });
        }
        
        // Count tags from passives
        if (playerComp.passives) {
            playerComp.passives.forEach(passive => {
                if (!passive || !passive.id) return;
                const passiveData = PassiveData.getPassiveData(passive.id);
                if (passiveData && passiveData.tags) {
                    passiveData.tags.forEach(tag => {
                        this.tagCounts.set(tag, (this.tagCounts.get(tag) || 0) + 1);
                    });
                }
            });
        }
        
        // Check each synergy
        this.activeSynergies.clear();
        SynergyData.getAllSynergies().forEach(synergy => {
            let count = 0;
            synergy.tagsCounted.forEach(tag => {
                count += this.tagCounts.get(tag) || 0;
            });
            
            if (count >= synergy.thresholds[0]) {
                // Determine threshold: 6, 4, or 2
                let threshold = 2;
                if (synergy.thresholds.length >= 3 && count >= synergy.thresholds[2]) {
                    threshold = 6;
                } else if (synergy.thresholds.length >= 2 && count >= synergy.thresholds[1]) {
                    threshold = 4;
                }
                this.activeSynergies.set(synergy.id, { count, threshold });
            }
        });
    }
    
    /**
     * Apply active synergy bonuses to player
     */
    applyActiveSynergies() {
        if (!this.player) return;
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return;
        
        // Initialize synergy bonuses object if not exists
        if (!playerComp.synergyBonuses) {
            playerComp.synergyBonuses = {};
        }
        
        // Reset synergy bonuses
        playerComp.synergyBonuses = {
            lifesteal: 0,
            critDamage: 0,
            explosionRadius: 0,
            coolingRate: 0,
            dashCooldown: 0,
            summonCap: 0,
            damageMultiplier: 0,
            damageTakenMultiplier: 0,
            rangeMultiplier: 0,
            magnetRange: 0,
            maxHealthMultiplier: 0,
            speedMultiplier: 0,
            heatGenerationMultiplier: 0,
            selfExplosionDamage: 0,
            critChance: 0,
            // Mechanic flags
            onEliteKillHeal: 0,
            critExplosion: null,
            chainExplosion: null,
            damageRamp: null,
            dashInvuln: null,
            summonInherit: null
        };
        
        // Apply active synergies
        this.activeSynergies.forEach((data, synergyId) => {
            const synergy = SynergyData.getSynergy(synergyId);
            if (!synergy) return;
            
            // Select appropriate bonus based on threshold
            let bonus;
            if (data.threshold === 6 && synergy.bonus6) {
                bonus = synergy.bonus6;
            } else if (data.threshold === 4 && synergy.bonus4) {
                bonus = synergy.bonus4;
            } else {
                bonus = synergy.bonus2;
            }
            
            if (bonus.type === 'stat_add') {
                if (typeof playerComp.synergyBonuses[bonus.stat] === 'number') {
                    playerComp.synergyBonuses[bonus.stat] += bonus.value;
                } else {
                    playerComp.synergyBonuses[bonus.stat] = bonus.value;
                }
            } else if (bonus.type === 'stat_add_multi') {
                // Apply multiple stats at once
                Object.entries(bonus.stats).forEach(([stat, value]) => {
                    if (typeof playerComp.synergyBonuses[stat] === 'number') {
                        playerComp.synergyBonuses[stat] += value;
                    } else {
                        playerComp.synergyBonuses[stat] = value;
                    }
                });
            } else if (bonus.type === 'event') {
                // Store event-based bonuses for combat system to use
                if (bonus.event === 'on_elite_kill') {
                    playerComp.synergyBonuses.onEliteKillHeal = bonus.effect.value;
                }
            } else if (bonus.type === 'mechanic') {
                // Store mechanic details for combat system
                playerComp.synergyBonuses[bonus.mechanic] = bonus.effect;
            }
        });
    }
    
    /**
     * Get list of currently active synergies
     * @returns {Array<{synergy: Object, count: number, threshold: number}>}
     */
    getActiveSynergies() {
        return Array.from(this.activeSynergies.entries()).map(([id, data]) => ({
            synergy: SynergyData.getSynergy(id),
            count: data.count,
            threshold: data.threshold
        }));
    }
    
    /**
     * Trigger synergy event (called by combat system)
     * @param {string} event - Event type (e.g., 'on_elite_kill', 'on_crit')
     * @param {Object} context - Event context data
     */
    triggerEvent(event, context = {}) {
        if (!this.player) return;
        const playerComp = this.player.getComponent('player');
        if (!playerComp || !playerComp.synergyBonuses) return;
        
        switch (event) {
            case 'on_elite_kill':
                if (playerComp.synergyBonuses.onEliteKillHeal > 0) {
                    const healAmount = playerComp.maxHealth * playerComp.synergyBonuses.onEliteKillHeal;
                    playerComp.health = Math.min(
                        playerComp.maxHealth,
                        playerComp.health + healAmount
                    );
                }
                break;
                
            case 'on_crit':
                if (playerComp.synergyBonuses.critExplosion && this.critExplosionCooldown <= 0) {
                    this.critExplosionCooldown = playerComp.synergyBonuses.critExplosion.cooldown;
                    // Create explosion at target position
                    if (context.position && context.damage && this.world.particleSystem) {
                        const effect = playerComp.synergyBonuses.critExplosion;
                        this.createSynergyExplosion(
                            context.position.x,
                            context.position.y,
                            effect.radius,
                            context.damage * effect.damage
                        );
                    }
                }
                break;
        }
    }
    
    /**
     * Create synergy explosion effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Explosion radius
     * @param {number} damage - Explosion damage
     */
    createSynergyExplosion(x, y, radius, damage) {
        if (!this.world.particleSystem) return;
        
        // Create visual explosion
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.world.particleSystem.createParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                lifetime: 300,
                color: '#FFD700',
                size: 3
            });
        }
        
        // Damage enemies in radius
        const enemies = this.world.getEntitiesWithComponent('enemy');
        enemies.forEach(enemy => {
            const enemyPos = enemy.getComponent('position');
            if (!enemyPos) return;
            
            const dx = enemyPos.x - x;
            const dy = enemyPos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= radius) {
                const enemyHealth = enemy.getComponent('health');
                if (enemyHealth) {
                    enemyHealth.current -= damage;
                }
            }
        });
    }
    
    /**
     * Force synergy recalculation (call when items change)
     */
    forceRecalculate() {
        this.recalculateSynergies();
    }
}

// Export to global namespace
if (typeof window !== 'undefined') {
    window.SynergySystem = SynergySystem;
}
