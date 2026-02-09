/**
 * @file CollisionSystem.js
 * @description Handles collision detection between entities
 */

const BOSS_SIZE_THRESHOLD = 35;

class CollisionSystem {
    constructor(world, gameState, audioManager, particleSystem = null) {
        this.world = world;
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.particleSystem = particleSystem;
    }

    update(deltaTime) {
        // Check projectile-enemy collisions
        this.checkProjectileEnemyCollisions();
        
        // Check player-enemy collisions
        this.checkPlayerEnemyCollisions();
        
        // Check player-pickup collisions
        this.checkPlayerPickupCollisions();
        
        // Check player-enemy projectile collisions
        this.checkPlayerProjectileCollisions();
    }

    checkProjectileEnemyCollisions() {
        const projectiles = this.world.getEntitiesByType('projectile');
        const enemies = this.world.getEntitiesByType('enemy');

        for (const projectile of projectiles) {
            const projPos = projectile.getComponent('position');
            const projCol = projectile.getComponent('collision');
            const projComp = projectile.getComponent('projectile');
            
            if (!projPos || !projCol || !projComp) continue;
            
            // Check if projectile is from player (owner is a player entity)
            const ownerEntity = this.world.getEntity(projComp.owner);
            if (!ownerEntity || ownerEntity.type !== 'player') continue;

            for (const enemy of enemies) {
                const enemyPos = enemy.getComponent('position');
                const enemyCol = enemy.getComponent('collision');
                const enemyHealth = enemy.getComponent('health');
                
                if (!enemyPos || !enemyCol || !enemyHealth) continue;

                if (MathUtils.circleCollision(
                    projPos.x, projPos.y, projCol.radius,
                    enemyPos.x, enemyPos.y, enemyCol.radius
                )) {
                    // Deal damage to enemy (pass owner entity for lifesteal)
                    this.damageEnemy(enemy, projComp.damage, ownerEntity);
                    
                    // Remove projectile if not piercing
                    if (projComp.piercing <= 0) {
                        this.world.removeEntity(projectile.id);
                    } else {
                        projComp.piercing--;
                    }
                    
                    break;
                }
            }
        }
    }

    checkPlayerEnemyCollisions() {
        const players = this.world.getEntitiesByType('player');
        const enemies = this.world.getEntitiesByType('enemy');

        for (const player of players) {
            const playerPos = player.getComponent('position');
            const playerCol = player.getComponent('collision');
            const playerHealth = player.getComponent('health');
            
            if (!playerPos || !playerCol || !playerHealth) continue;
            if (playerHealth.invulnerable) continue;

            for (const enemy of enemies) {
                const enemyPos = enemy.getComponent('position');
                const enemyCol = enemy.getComponent('collision');
                const enemyComp = enemy.getComponent('enemy');
                
                if (!enemyPos || !enemyCol || !enemyComp) continue;

                if (MathUtils.circleCollision(
                    playerPos.x, playerPos.y, playerCol.radius,
                    enemyPos.x, enemyPos.y, enemyCol.radius
                )) {
                    // Deal damage to player
                    this.damagePlayer(player, enemyComp.damage);
                    
                    // Add invulnerability frames
                    playerHealth.invulnerable = true;
                    playerHealth.invulnerableTime = 0.5; // 0.5 seconds
                }
            }
        }
    }

    checkPlayerPickupCollisions() {
        const players = this.world.getEntitiesByType('player');
        const pickups = this.world.getEntitiesByType('pickup');

        for (const player of players) {
            const playerPos = player.getComponent('position');
            const playerComp = player.getComponent('player');
            
            if (!playerPos || !playerComp) continue;

            for (const pickup of pickups) {
                const pickupPos = pickup.getComponent('position');
                const pickupComp = pickup.getComponent('pickup');
                
                if (!pickupPos || !pickupComp || pickupComp.collected) continue;

                // Check if in magnet range
                const dist = MathUtils.distance(
                    playerPos.x, playerPos.y,
                    pickupPos.x, pickupPos.y
                );

                if (dist < pickupComp.magnetRange) {
                    // Move pickup towards player
                    const angle = MathUtils.angle(pickupPos.x, pickupPos.y, playerPos.x, playerPos.y);
                    const speed = 400;
                    const vel = pickup.getComponent('velocity');
                    if (vel) {
                        vel.vx = Math.cos(angle) * speed;
                        vel.vy = Math.sin(angle) * speed;
                    }
                }

                // Check if pickup is collected
                if (dist < 30) {
                    this.collectPickup(player, pickup);
                }
            }
        }
    }

    checkPlayerProjectileCollisions() {
        const players = this.world.getEntitiesByType('player');
        const projectiles = this.world.getEntitiesByType('projectile');

        for (const player of players) {
            const playerPos = player.getComponent('position');
            const playerCol = player.getComponent('collision');
            const playerHealth = player.getComponent('health');
            
            if (!playerPos || !playerCol || !playerHealth) continue;
            if (playerHealth.invulnerable) continue;

            for (const projectile of projectiles) {
                const projPos = projectile.getComponent('position');
                const projCol = projectile.getComponent('collision');
                const projComp = projectile.getComponent('projectile');
                
                if (!projPos || !projCol || !projComp) continue;
                
                // Check if projectile is from enemy (owner is an enemy entity)
                const ownerEntity = this.world.getEntity(projComp.owner);
                if (!ownerEntity || ownerEntity.type !== 'enemy') continue;

                if (MathUtils.circleCollision(
                    playerPos.x, playerPos.y, playerCol.radius,
                    projPos.x, projPos.y, projCol.radius
                )) {
                    // Deal damage to player
                    this.damagePlayer(player, projComp.damage);
                    
                    // Remove projectile
                    this.world.removeEntity(projectile.id);
                    
                    // Add invulnerability frames
                    playerHealth.invulnerable = true;
                    playerHealth.invulnerableTime = 0.3;
                }
            }
        }
    }

    damageEnemy(enemy, damage, attacker = null) {
        const health = enemy.getComponent('health');
        const renderable = enemy.getComponent('renderable');
        if (!health) return;

        health.current -= damage;
        this.gameState.stats.damageDealt += damage;
        
        // Check if this is a boss (large size)
        const isBoss = renderable && renderable.size >= BOSS_SIZE_THRESHOLD;
        
        // Apply lifesteal if attacker is player
        if (attacker && attacker.type === 'player') {
            const playerComp = attacker.getComponent('player');
            const playerHealth = attacker.getComponent('health');
            
            if (playerComp && playerHealth && playerComp.stats.lifesteal > 0) {
                const healAmount = damage * playerComp.stats.lifesteal;
                const newHealth = Math.min(playerHealth.max, playerHealth.current + healAmount);
                if (newHealth > playerHealth.current) {
                    playerHealth.current = newHealth;
                    logger.debug('Combat', `Lifesteal healed ${healAmount.toFixed(1)} HP`);
                    
                    // Lifesteal sound
                    if (this.audioManager && this.audioManager.initialized) {
                        this.audioManager.playLifesteal();
                    }
                }
            }
        }
        
        // Play hit sound
        if (this.audioManager && this.audioManager.initialized) {
            if (isBoss) {
                this.audioManager.playBossHit();
                
                // Boss hit screen shake
                if (this.screenEffects) {
                    this.screenEffects.shake(3, 0.1);
                    this.screenEffects.flash('#FFFFFF', 0.15, 0.08);
                }
            } else {
                this.audioManager.playSFX('hit', MathUtils.randomFloat(0.9, 1.1));
            }
        }

        if (health.current <= 0) {
            this.killEnemy(enemy);
        }
    }

    damagePlayer(player, damage) {
        const health = player.getComponent('health');
        const playerComp = player.getComponent('player');
        
        if (!health || !playerComp) return;

        // Apply armor reduction
        const actualDamage = Math.max(1, damage - playerComp.stats.armor);
        health.current -= actualDamage;
        this.gameState.stats.damageTaken += actualDamage;
        
        // Play hit sound
        if (this.audioManager && this.audioManager.initialized) {
            this.audioManager.playSFX('hit', 1.2);
        }
        
        // Screen shake and flash on hit
        if (this.screenEffects) {
            this.screenEffects.shake(5, 0.2);
            this.screenEffects.flash('#FF0000', 0.3, 0.15);
        }

        if (health.current <= 0) {
            health.current = 0;
            // Game over handled by game loop
        }
    }

    killEnemy(enemy) {
        const enemyComp = enemy.getComponent('enemy');
        const pos = enemy.getComponent('position');
        const renderable = enemy.getComponent('renderable');
        
        if (enemyComp && pos) {
            // Play explosion sound
            if (this.audioManager && this.audioManager.initialized) {
                this.audioManager.playSFX('explosion', MathUtils.randomFloat(0.8, 1.2));
            }
            
            // Create explosion particle effect
            if (this.particleSystem) {
                const color = renderable ? renderable.color : '#ff6600';
                const size = renderable ? renderable.size : 20;
                const particleCount = Math.min(30, 15 + size);
                this.particleSystem.createExplosion(pos.x, pos.y, size, color, particleCount);
            }
            
            // Drop XP
            this.spawnPickup(pos.x, pos.y, 'xp', enemyComp.xpValue);
            
            // Update stats
            this.gameState.addKill(enemyComp.xpValue);
        }

        this.world.removeEntity(enemy.id);
    }

    spawnPickup(x, y, type, value) {
        const pickup = this.world.createEntity('pickup');
        pickup.addComponent('position', Components.Position(x, y));
        pickup.addComponent('velocity', Components.Velocity(0, 0));
        pickup.addComponent('pickup', Components.Pickup(type, value));
        
        const colors = {
            xp: '#00ff00',
            health: '#ff0000',
            noyaux: '#ffaa00'
        };
        
        pickup.addComponent('renderable', Components.Renderable(
            colors[type] || '#ffffff',
            type === 'xp' ? 8 : 12,
            'circle'
        ));
        pickup.addComponent('collision', Components.Collision(8));
    }

    collectPickup(player, pickup) {
        const pickupComp = pickup.getComponent('pickup');
        const playerComp = player.getComponent('player');
        const health = player.getComponent('health');
        
        if (!pickupComp || pickupComp.collected) return;
        
        pickupComp.collected = true;
        
        // Play pickup sound
        if (this.audioManager && this.audioManager.initialized) {
            this.audioManager.playSFX('pickup', MathUtils.randomFloat(0.9, 1.1));
        }

        switch (pickupComp.type) {
            case 'xp':
                if (playerComp) {
                    const xpGained = pickupComp.value * playerComp.stats.xpBonus;
                    playerComp.xp += xpGained;
                    
                    // Check for level up
                    if (playerComp.xp >= playerComp.xpRequired) {
                        this.levelUp(player);
                    }
                }
                break;
                
            case 'health':
                if (health) {
                    health.current = Math.min(health.max, health.current + pickupComp.value);
                }
                break;
                
            case 'noyaux':
                this.gameState.stats.noyauxEarned += pickupComp.value;
                break;
        }

        this.world.removeEntity(pickup.id);
    }

    levelUp(player) {
        const playerComp = player.getComponent('player');
        if (!playerComp) return;

        playerComp.level++;
        playerComp.xp -= playerComp.xpRequired;
        playerComp.xpRequired = Math.floor(playerComp.xpRequired * 1.2);
        
        this.gameState.stats.highestLevel = Math.max(
            this.gameState.stats.highestLevel,
            playerComp.level
        );

        // Trigger level up screen
        if (window.game) {
            window.game.triggerLevelUp();
        }
    }
}
