/**
 * @file phaser/systems/PhaserWeaponSystem.js
 * @description Weapon system integration for Phaser
 * Manages weapon firing, projectiles, and visual effects
 */

export class PhaserWeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.weapons = [];
        this.projectiles = [];
    }

    /**
     * Initialize player weapons
     * @param {Array} weaponIds - Array of weapon IDs to equip
     */
    initializePlayerWeapons(weaponIds) {
        if (!window.NEW_WEAPONS) {
            console.error('Weapon data not loaded');
            return;
        }

        this.weapons = weaponIds.map(id => {
            const weaponData = this.getWeaponByStringId(id);
            if (!weaponData) {
                console.warn('Weapon not found:', id);
                return null;
            }

            return {
                ...weaponData,
                cooldown: 0,
                level: 1
            };
        }).filter(w => w !== null);

        console.log('Initialized weapons:', this.weapons.map(w => w.name));
    }

    /**
     * Get weapon data by string ID
     */
    getWeaponByStringId(id) {
        return Object.values(window.NEW_WEAPONS).find(w => w.id === id);
    }

    /**
     * Update weapon cooldowns and fire when ready
     * @param {number} deltaTime - Time in seconds
     * @param {object} playerPos - Player position {x, y}
     * @param {Array} enemies - Array of enemy objects with position
     */
    update(deltaTime, playerPos, enemies) {
        // Update cooldowns
        this.weapons.forEach(weapon => {
            if (weapon.cooldown > 0) {
                weapon.cooldown -= deltaTime;
            }
        });

        // Fire weapons that are ready
        this.weapons.forEach(weapon => {
            if (weapon.cooldown <= 0) {
                this.fireWeapon(weapon, playerPos, enemies);
                weapon.cooldown = 1 / weapon.fireRate;
            }
        });

        // Update projectiles
        this.updateProjectiles(deltaTime);
    }

    /**
     * Fire a weapon
     * @param {object} weapon - Weapon data
     * @param {object} playerPos - Player position
     * @param {Array} enemies - Array of enemies
     */
    fireWeapon(weapon, playerPos, enemies) {
        // Find nearest enemy for auto-targeting
        const target = this.findNearestEnemy(playerPos, enemies);
        
        if (!target) return; // No enemies to shoot at

        // Create projectile based on weapon type
        switch (weapon.type) {
            case 'direct':
            case 'homing':
                this.createDirectProjectile(weapon, playerPos, target);
                break;
            case 'beam':
                this.createBeamEffect(weapon, playerPos, target);
                break;
            case 'pulse':
                this.createPulseEffect(weapon, playerPos);
                break;
            case 'chain':
                this.createChainEffect(weapon, playerPos, target, enemies);
                break;
            default:
                this.createDirectProjectile(weapon, playerPos, target);
        }
    }

    /**
     * Find nearest enemy to player
     */
    findNearestEnemy(playerPos, enemies) {
        if (!enemies || enemies.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        enemies.forEach(enemy => {
            const dx = enemy.x - playerPos.x;
            const dy = enemy.y - playerPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    /**
     * Create a direct projectile (bullet, missile)
     */
    createDirectProjectile(weapon, from, target) {
        const dx = target.x - from.x;
        const dy = target.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = weapon.projectileSpeed || 600;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        // Create visual
        const graphics = this.scene.add.graphics();
        const color = parseInt(weapon.color.replace('#', '0x'));
        
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, 4);
        graphics.x = from.x;
        graphics.y = from.y;
        graphics.setDepth(15);

        // Add glow
        graphics.lineStyle(2, color, 0.5);
        graphics.strokeCircle(0, 0, 6);

        const projectile = {
            graphics,
            x: from.x,
            y: from.y,
            vx,
            vy,
            weapon,
            damage: weapon.damage,
            lifetime: 3, // 3 seconds max lifetime
            type: weapon.type,
            target: weapon.type === 'homing' ? target : null
        };

        this.projectiles.push(projectile);
    }

    /**
     * Create beam effect
     */
    createBeamEffect(weapon, from, target) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        
        // Create beam line
        const beam = this.scene.add.graphics();
        beam.lineStyle(3, color, 0.8);
        beam.lineBetween(from.x, from.y, target.x, target.y);
        beam.setDepth(14);

        // Add glow
        beam.lineStyle(6, color, 0.3);
        beam.lineBetween(from.x, from.y, target.x, target.y);

        // Fade out quickly
        this.scene.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 100,
            onComplete: () => beam.destroy()
        });

        // Apply damage directly
        if (target.takeDamage) {
            target.takeDamage(weapon.damage);
        }
    }

    /**
     * Create pulse effect (AoE)
     */
    createPulseEffect(weapon, from) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        const radius = weapon.areaRadius || 100;

        // Create expanding circle
        const pulse = this.scene.add.circle(from.x, from.y, 10, color, 0.6);
        pulse.setDepth(14);

        this.scene.tweens.add({
            targets: pulse,
            scale: radius / 10,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => pulse.destroy()
        });

        // Damage enemies in radius (handled by collision system)
        this.createAoEDamageZone(from, radius, weapon.damage);
    }

    /**
     * Create chain lightning effect
     */
    createChainEffect(weapon, from, firstTarget, allEnemies) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        const chainCount = weapon.chainCount || 3;
        
        let current = from;
        let chained = [firstTarget];
        let remaining = allEnemies.filter(e => e !== firstTarget);

        // Chain to nearby enemies
        for (let i = 0; i < chainCount && remaining.length > 0; i++) {
            const next = this.findNearestEnemy(current, remaining);
            if (!next) break;

            // Draw lightning bolt
            const bolt = this.scene.add.graphics();
            bolt.lineStyle(2, color, 0.9);
            
            // Zigzag effect
            const steps = 5;
            bolt.moveTo(current.x, current.y);
            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                const x = current.x + (next.x - current.x) * t + (Math.random() - 0.5) * 20;
                const y = current.y + (next.y - current.y) * t + (Math.random() - 0.5) * 20;
                bolt.lineTo(x, y);
            }
            bolt.lineTo(next.x, next.y);
            bolt.setDepth(14);

            // Fade out
            this.scene.tweens.add({
                targets: bolt,
                alpha: 0,
                duration: 150,
                onComplete: () => bolt.destroy()
            });

            // Apply damage (reduced per chain)
            const chainDamage = weapon.damage * Math.pow(0.7, i);
            if (next.takeDamage) {
                next.takeDamage(chainDamage);
            }

            chained.push(next);
            remaining = remaining.filter(e => e !== next);
            current = next;
        }
    }

    /**
     * Create AoE damage zone
     */
    createAoEDamageZone(center, radius, damage) {
        // This will be picked up by the collision system
        this.aoeZones = this.aoeZones || [];
        this.aoeZones.push({
            x: center.x,
            y: center.y,
            radius,
            damage,
            lifetime: 0.1 // Very short lived
        });
    }

    /**
     * Update all projectiles
     */
    updateProjectiles(deltaTime) {
        this.projectiles.forEach((proj, index) => {
            // Update lifetime
            proj.lifetime -= deltaTime;
            if (proj.lifetime <= 0) {
                proj.graphics.destroy();
                this.projectiles.splice(index, 1);
                return;
            }

            // Homing behavior
            if (proj.type === 'homing' && proj.target && !proj.target.destroyed) {
                const dx = proj.target.x - proj.x;
                const dy = proj.target.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const turnSpeed = 400; // degrees per second
                    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                    
                    // Gradually turn towards target
                    const targetVx = (dx / dist) * speed;
                    const targetVy = (dy / dist) * speed;
                    
                    proj.vx += (targetVx - proj.vx) * deltaTime * 2;
                    proj.vy += (targetVy - proj.vy) * deltaTime * 2;
                }
            }

            // Update position
            proj.x += proj.vx * deltaTime;
            proj.y += proj.vy * deltaTime;
            
            proj.graphics.x = proj.x;
            proj.graphics.y = proj.y;

            // Rotate to face direction
            const angle = Math.atan2(proj.vy, proj.vx);
            proj.graphics.rotation = angle;

            // Remove if off screen
            if (proj.x < -50 || proj.x > this.scene.cameras.main.width + 50 ||
                proj.y < -50 || proj.y > this.scene.cameras.main.height + 50) {
                proj.graphics.destroy();
                this.projectiles.splice(index, 1);
            }
        });

        // Update AoE zones
        if (this.aoeZones) {
            this.aoeZones = this.aoeZones.filter(zone => {
                zone.lifetime -= deltaTime;
                return zone.lifetime > 0;
            });
        }
    }

    /**
     * Check projectile collision with enemy
     */
    checkProjectileCollision(enemy) {
        const hits = [];
        
        this.projectiles.forEach((proj, index) => {
            const dx = proj.x - enemy.x;
            const dy = proj.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const hitRadius = 20; // Generous hit detection
            
            if (dist < hitRadius) {
                hits.push({
                    damage: proj.damage,
                    damageType: proj.weapon.damageType
                });
                
                // Create hit effect
                this.createHitEffect(proj.x, proj.y, proj.weapon.color);
                
                // Remove projectile
                proj.graphics.destroy();
                this.projectiles.splice(index, 1);
            }
        });

        return hits;
    }

    /**
     * Check AoE collision with enemy
     */
    checkAoECollision(enemy) {
        const hits = [];
        
        if (this.aoeZones) {
            this.aoeZones.forEach(zone => {
                const dx = zone.x - enemy.x;
                const dy = zone.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < zone.radius) {
                    hits.push({
                        damage: zone.damage,
                        damageType: 'em' // Default to EM for pulses
                    });
                }
            });
        }

        return hits;
    }

    /**
     * Create hit effect
     */
    createHitEffect(x, y, color) {
        const hexColor = parseInt(color.replace('#', '0x'));
        
        // Create small explosion
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(x, y, 2, hexColor, 1);
            particle.setDepth(16);
            
            const speed = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + vx,
                y: y + vy,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.projectiles.forEach(proj => proj.graphics.destroy());
        this.projectiles = [];
        this.weapons = [];
    }
}
