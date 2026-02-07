/**
 * @file CollisionSystem.js
 * @description Handles collision detection between entities
 */

class CollisionSystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
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
                    // Deal damage to enemy
                    this.damageEnemy(enemy, projComp.damage);
                    
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

    damageEnemy(enemy, damage) {
        const health = enemy.getComponent('health');
        if (!health) return;

        health.current -= damage;
        this.gameState.stats.damageDealt += damage;

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

        if (health.current <= 0) {
            health.current = 0;
            // Game over handled by game loop
        }
    }

    killEnemy(enemy) {
        const enemyComp = enemy.getComponent('enemy');
        const pos = enemy.getComponent('position');
        
        if (enemyComp && pos) {
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
