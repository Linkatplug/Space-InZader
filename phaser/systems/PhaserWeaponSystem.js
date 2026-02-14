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
            case 'projectile':
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
            case 'spread':
                this.createSpreadEffect(weapon, playerPos, target, enemies);
                break;
            case 'ring':
                this.createRingEffect(weapon, playerPos);
                break;
            case 'orbital':
                this.createOrbitalEffect(weapon, playerPos);
                break;
            case 'drone':
                this.createDroneEffect(weapon, playerPos);
                break;
            case 'mine':
                this.createMineEffect(weapon, playerPos);
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

        // Update drones
        if (this.drones) {
            const playerPos = { x: this.scene.playerData.x, y: this.scene.playerData.y };
            
            this.drones = this.drones.filter(drone => {
                drone.lifetime -= deltaTime;
                
                if (drone.lifetime <= 0) {
                    drone.graphics.destroy();
                    return false;
                }
                
                // Orbit around player
                drone.angle += deltaTime * 2; // 2 radians per second
                const x = playerPos.x + Math.cos(drone.angle) * drone.radius;
                const y = playerPos.y + Math.sin(drone.angle) * drone.radius;
                
                drone.graphics.x = x;
                drone.graphics.y = y;
                drone.graphics.rotation = drone.angle + Math.PI / 2;
                
                // Fire at enemies
                drone.fireTimer -= deltaTime;
                if (drone.fireTimer <= 0) {
                    const enemies = this.scene.enemySystem ? this.scene.enemySystem.getEnemies() : [];
                    const target = this.findNearestEnemy({ x, y }, enemies);
                    
                    if (target) {
                        // Create small projectile from drone
                        this.createDirectProjectile(drone.weapon, { x, y }, target);
                    }
                    
                    drone.fireTimer = 1 / (drone.weapon.fireRate || 2);
                }
                
                return true;
            });
        }

        // Update mines
        if (this.mines) {
            const enemies = this.scene.enemySystem ? this.scene.enemySystem.getEnemies() : [];
            
            this.mines = this.mines.filter(mine => {
                mine.lifetime -= deltaTime;
                
                if (mine.lifetime <= 0) {
                    mine.graphics.destroy();
                    return false;
                }
                
                // Check if enemy is near
                if (!mine.triggered) {
                    for (const enemy of enemies) {
                        const dx = mine.x - enemy.x;
                        const dy = mine.y - enemy.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < mine.radius * 0.5) {
                            // Trigger mine
                            mine.triggered = true;
                            mine.graphics.destroy();
                            
                            // Create explosion
                            const color = parseInt(mine.weapon.color.replace('#', '0x'));
                            const explosion = this.scene.add.circle(mine.x, mine.y, 10, color, 0.8);
                            explosion.setDepth(14);
                            
                            this.scene.tweens.add({
                                targets: explosion,
                                scale: mine.radius / 10,
                                alpha: 0,
                                duration: 400,
                                ease: 'Power2',
                                onComplete: () => explosion.destroy()
                            });
                            
                            // Damage in area
                            this.createAoEDamageZone({ x: mine.x, y: mine.y }, mine.radius, mine.damage);
                            return false;
                        }
                    }
                }
                
                return !mine.triggered;
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
     * Create spread effect (shotgun-like)
     */
    createSpreadEffect(weapon, from, target, enemies) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        const spreadCount = weapon.spreadCount || 5;
        const spreadAngle = weapon.spreadAngle || (Math.PI / 4); // 45 degrees
        
        // Calculate direction to target
        const dx = target.x - from.x;
        const dy = target.y - from.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // Create multiple projectiles in a spread
        for (let i = 0; i < spreadCount; i++) {
            const offset = ((i / (spreadCount - 1)) - 0.5) * spreadAngle;
            const angle = baseAngle + offset;
            
            const speed = weapon.projectileSpeed || 600;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Create projectile
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(color, 1);
            graphics.fillCircle(0, 0, 3);
            graphics.x = from.x;
            graphics.y = from.y;
            graphics.setDepth(15);
            
            this.projectiles.push({
                graphics,
                x: from.x,
                y: from.y,
                vx,
                vy,
                weapon,
                damage: weapon.damage * 0.7, // Reduce per-pellet damage
                lifetime: 2,
                type: 'spread'
            });
        }
    }

    /**
     * Create ring effect (expanding ring of damage)
     */
    createRingEffect(weapon, from) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        const maxRadius = weapon.areaRadius || 150;
        
        // Create expanding ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 0.8);
        ring.strokeCircle(from.x, from.y, 30);
        ring.setDepth(14);
        
        // Expand the ring
        this.scene.tweens.add({
            targets: ring,
            scaleX: maxRadius / 30,
            scaleY: maxRadius / 30,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // Create damage zone that expands
        const startRadius = 30;
        const expandDuration = 0.6;
        const currentTime = 0;
        
        // Create timed AoE zones for the expanding ring
        for (let t = 0; t < expandDuration; t += 0.1) {
            const radius = startRadius + (maxRadius - startRadius) * (t / expandDuration);
            setTimeout(() => {
                this.createAoEDamageZone(from, radius, weapon.damage * 0.3, 0.05);
            }, t * 1000);
        }
    }

    /**
     * Create orbital effect (delayed strike from above)
     */
    createOrbitalEffect(weapon, from) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        
        // Create targeting reticle
        const reticle = this.scene.add.graphics();
        reticle.lineStyle(2, color, 0.6);
        reticle.strokeCircle(from.x, from.y, 40);
        reticle.lineStyle(1, color, 0.4);
        reticle.strokeCircle(from.x, from.y, 60);
        reticle.setDepth(13);
        
        // Pulse animation
        this.scene.tweens.add({
            targets: reticle,
            alpha: 0.3,
            duration: 300,
            yoyo: true,
            repeat: 3
        });
        
        // Strike after delay
        setTimeout(() => {
            reticle.destroy();
            
            // Create strike beam from top
            const beam = this.scene.add.graphics();
            beam.lineStyle(8, color, 0.9);
            beam.lineBetween(from.x, -50, from.x, from.y);
            beam.setDepth(14);
            
            // Flash effect
            this.scene.tweens.add({
                targets: beam,
                alpha: 0,
                duration: 150,
                onComplete: () => beam.destroy()
            });
            
            // Create explosion
            const explosion = this.scene.add.circle(from.x, from.y, 10, color, 0.8);
            explosion.setDepth(14);
            
            this.scene.tweens.add({
                targets: explosion,
                scale: 8,
                alpha: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => explosion.destroy()
            });
            
            // Damage in area
            this.createAoEDamageZone(from, weapon.areaRadius || 100, weapon.damage);
        }, 1000); // 1 second delay
    }

    /**
     * Create drone effect (spawns helper drones)
     */
    createDroneEffect(weapon, from) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        const droneCount = weapon.droneCount || 2;
        
        // Create drones orbiting the player
        for (let i = 0; i < droneCount; i++) {
            const angle = (Math.PI * 2 * i) / droneCount;
            const radius = 80;
            
            const drone = this.scene.add.graphics();
            drone.fillStyle(color, 0.8);
            drone.fillTriangle(0, -5, -4, 4, 4, 4);
            drone.lineStyle(1, 0xffffff, 0.5);
            drone.strokeTriangle(0, -5, -4, 4, 4, 4);
            drone.setDepth(12);
            
            // Position drone in orbit
            const x = from.x + Math.cos(angle) * radius;
            const y = from.y + Math.sin(angle) * radius;
            drone.x = x;
            drone.y = y;
            
            // Store drone info
            if (!this.drones) this.drones = [];
            
            this.drones.push({
                graphics: drone,
                angle: angle,
                radius: radius,
                weapon: weapon,
                fireTimer: Math.random() * 2, // Random start delay
                lifetime: 10 // Drones last 10 seconds
            });
        }
    }

    /**
     * Create mine effect (drops stationary mine)
     */
    createMineEffect(weapon, from) {
        const color = parseInt(weapon.color.replace('#', '0x'));
        
        // Create mine graphics
        const mine = this.scene.add.graphics();
        mine.fillStyle(color, 0.7);
        mine.fillCircle(0, 0, 8);
        mine.lineStyle(2, color, 1);
        mine.strokeCircle(0, 0, 12);
        mine.x = from.x;
        mine.y = from.y + 30; // Drop behind player
        mine.setDepth(10);
        
        // Pulsing animation
        this.scene.tweens.add({
            targets: mine,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Store mine for collision detection
        if (!this.mines) this.mines = [];
        
        this.mines.push({
            graphics: mine,
            x: from.x,
            y: from.y + 30,
            weapon: weapon,
            damage: weapon.damage,
            radius: weapon.areaRadius || 80,
            triggered: false,
            lifetime: 15 // Mines last 15 seconds
        });
    }

    /**
     * Create AoE damage zone with optional duration
     */
    createAoEDamageZone(center, radius, damage, duration = 0.1) {
        // This will be picked up by the collision system
        this.aoeZones = this.aoeZones || [];
        this.aoeZones.push({
            x: center.x,
            y: center.y,
            radius,
            damage,
            lifetime: duration
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.projectiles.forEach(proj => proj.graphics.destroy());
        this.projectiles = [];
        
        if (this.drones) {
            this.drones.forEach(drone => drone.graphics.destroy());
            this.drones = [];
        }
        
        if (this.mines) {
            this.mines.forEach(mine => mine.graphics.destroy());
            this.mines = [];
        }
        
        this.weapons = [];
    }
}
