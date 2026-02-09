/**
 * @file AISystem.js
 * @description Enemy AI behaviors, movement patterns, and attack logic
 */

class AISystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
    }

    /**
     * Update all enemy AI behaviors
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        const enemies = this.world.getEntitiesByType('enemy');
        const player = this.world.getEntitiesByType('player')[0];
        
        if (!player) return;

        for (const enemy of enemies) {
            this.updateEnemyAI(enemy, player, deltaTime);
        }
    }

    /**
     * Update individual enemy AI
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    updateEnemyAI(enemy, player, deltaTime) {
        const enemyComp = enemy.getComponent('enemy');
        if (!enemyComp) return;

        const aiType = enemyComp.aiType;

        // Update attack cooldown
        if (enemyComp.attackCooldown > 0) {
            enemyComp.attackCooldown -= deltaTime;
        }

        // Execute AI behavior
        switch (aiType) {
            case 'chase':
                this.chaseAI(enemy, player, deltaTime);
                break;
            case 'weave':
                this.weaveAI(enemy, player, deltaTime);
                break;
            case 'kite':
                this.kiteAI(enemy, player, deltaTime);
                break;
            case 'aggressive':
                this.aggressiveAI(enemy, player, deltaTime);
                break;
            case 'boss':
                this.bossAI(enemy, player, deltaTime);
                break;
            case 'kamikaze':
                this.kamikazeAI(enemy, player, deltaTime);
                break;
            case 'stationary':
                this.stationaryAI(enemy, player, deltaTime);
                break;
            default:
                this.chaseAI(enemy, player, deltaTime);
        }

        // Handle attacks
        this.handleEnemyAttack(enemy, player, deltaTime);
    }

    /**
     * Chase AI - Direct pursuit of player
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    chaseAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // Calculate direction to player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const normalized = MathUtils.normalize(dx, dy);

        // Move towards player
        enemyPos.x += normalized.x * enemyComp.speed * deltaTime;
        enemyPos.y += normalized.y * enemyComp.speed * deltaTime;

        // Update rotation
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            renderable.rotation = Math.atan2(dy, dx);
        }
    }

    /**
     * Weave AI - Zigzag movement towards player
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    weaveAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // Initialize weave time if not exists
        if (enemyComp.weaveTime === undefined) {
            enemyComp.weaveTime = 0;
        }
        enemyComp.weaveTime += deltaTime;

        // Calculate direction to player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const angle = Math.atan2(dy, dx);

        // Add sine wave perpendicular to direction
        const weaveAmplitude = 50;
        const weaveFrequency = 3;
        const weaveOffset = Math.sin(enemyComp.weaveTime * weaveFrequency) * weaveAmplitude;

        // Calculate perpendicular direction
        const perpAngle = angle + Math.PI / 2;
        const weaveX = Math.cos(perpAngle) * weaveOffset * deltaTime;
        const weaveY = Math.sin(perpAngle) * weaveOffset * deltaTime;

        // Move towards player with weave
        const normalized = MathUtils.normalize(dx, dy);
        enemyPos.x += normalized.x * enemyComp.speed * deltaTime + weaveX;
        enemyPos.y += normalized.y * enemyComp.speed * deltaTime + weaveY;

        // Update rotation
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            renderable.rotation = angle;
        }
    }

    /**
     * Kite AI - Maintain distance and shoot
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    kiteAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        const minDistance = 200;
        const maxDistance = 350;
        
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let moveX = 0;
        let moveY = 0;

        if (distance < minDistance) {
            // Too close - move away
            const normalized = MathUtils.normalize(-dx, -dy);
            moveX = normalized.x * enemyComp.speed * deltaTime;
            moveY = normalized.y * enemyComp.speed * deltaTime;
        } else if (distance > maxDistance) {
            // Too far - move closer
            const normalized = MathUtils.normalize(dx, dy);
            moveX = normalized.x * enemyComp.speed * deltaTime;
            moveY = normalized.y * enemyComp.speed * deltaTime;
        } else {
            // In range - strafe
            if (enemyComp.strafeTime === undefined) {
                enemyComp.strafeTime = 0;
                enemyComp.strafeDirection = Math.random() < 0.5 ? -1 : 1;
            }
            
            enemyComp.strafeTime += deltaTime;
            if (enemyComp.strafeTime > 2.0) {
                enemyComp.strafeTime = 0;
                enemyComp.strafeDirection *= -1;
            }

            const angle = Math.atan2(dy, dx);
            const perpAngle = angle + Math.PI / 2;
            moveX = Math.cos(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime;
            moveY = Math.sin(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime;
        }

        enemyPos.x += moveX;
        enemyPos.y += moveY;

        // Always face player
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            renderable.rotation = Math.atan2(dy, dx);
        }
    }

    /**
     * Aggressive AI - Fast pursuit with prediction
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    aggressiveAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // Get player velocity for prediction
        const playerVel = player.getComponent('velocity') || { vx: 0, vy: 0 };
        
        // Predict player position
        const predictionTime = 0.5;
        const predictedX = playerPos.x + playerVel.vx * predictionTime;
        const predictedY = playerPos.y + playerVel.vy * predictionTime;

        // Calculate direction to predicted position
        const dx = predictedX - enemyPos.x;
        const dy = predictedY - enemyPos.y;
        const normalized = MathUtils.normalize(dx, dy);

        // Move aggressively
        const speedMultiplier = 1.2;
        enemyPos.x += normalized.x * enemyComp.speed * speedMultiplier * deltaTime;
        enemyPos.y += normalized.y * enemyComp.speed * speedMultiplier * deltaTime;

        // Update rotation
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            renderable.rotation = Math.atan2(dy, dx);
        }
    }

    /**
     * Boss AI - Multi-phase attack patterns
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    bossAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        const health = enemy.getComponent('health');
        const boss = enemy.getComponent('boss');
        
        if (!enemyPos || !playerPos || !enemyComp || !health || !boss) return;

        // Update phase time
        boss.phaseTime += deltaTime;

        // Determine current phase based on health
        const healthPercent = health.current / health.max;
        
        if (healthPercent > 0.66) {
            // Phase 1 - Chase and shoot
            this.aggressiveAI(enemy, player, deltaTime);
            
            if (boss.phaseTime > 0.5) {
                this.bossShootPattern(enemy, player, 'single');
                boss.phaseTime = 0;
            }
        } else if (healthPercent > 0.33) {
            // Phase 2 - Strafe and spiral shots
            this.kiteAI(enemy, player, deltaTime);
            
            if (boss.phaseTime > 0.3) {
                this.bossShootPattern(enemy, player, 'spiral');
                boss.phaseTime = 0;
            }
        } else {
            // Phase 3 - Enraged - Fast movement and spread shots
            const dx = playerPos.x - enemyPos.x;
            const dy = playerPos.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 200) {
                // Charge at player
                const normalized = MathUtils.normalize(dx, dy);
                enemyPos.x += normalized.x * enemyComp.speed * 1.5 * deltaTime;
                enemyPos.y += normalized.y * enemyComp.speed * 1.5 * deltaTime;
            } else {
                // Retreat and shoot
                const normalized = MathUtils.normalize(-dx, -dy);
                enemyPos.x += normalized.x * enemyComp.speed * deltaTime;
                enemyPos.y += normalized.y * enemyComp.speed * deltaTime;
            }
            
            if (boss.phaseTime > 0.2) {
                this.bossShootPattern(enemy, player, 'spread');
                boss.phaseTime = 0;
            }
        }

        // Update rotation
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            const dx = playerPos.x - enemyPos.x;
            const dy = playerPos.y - enemyPos.y;
            renderable.rotation = Math.atan2(dy, dx);
        }
    }

    /**
     * Boss shooting patterns
     * @param {Entity} enemy - Boss enemy entity
     * @param {Entity} player - Player entity
     * @param {string} pattern - Pattern type
     */
    bossShootPattern(enemy, player, pattern) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern || {};
        
        switch (pattern) {
            case 'single':
                this.shootAtPlayer(enemy, player);
                break;
            case 'spiral':
                this.shootSpiral(enemy, 8);
                break;
            case 'spread':
                this.shootSpread(enemy, player, 5);
                break;
        }
    }

    /**
     * Handle enemy attacks
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    handleEnemyAttack(enemy, player, deltaTime) {
        const enemyComp = enemy.getComponent('enemy');
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        
        if (!enemyComp || !enemyPos || !playerPos) return;

        const attackPattern = enemyComp.attackPattern;
        if (!attackPattern || attackPattern.type === 'none') return;

        // Check if can attack
        if (enemyComp.attackCooldown > 0) return;

        const distance = MathUtils.distance(enemyPos.x, enemyPos.y, playerPos.x, playerPos.y);
        const range = attackPattern.range || 300;

        if (distance <= range) {
            if (attackPattern.type === 'shoot') {
                this.shootAtPlayer(enemy, player);
            } else if (attackPattern.type === 'special') {
                this.shootSpread(enemy, player, 3);
            }
            
            enemyComp.attackCooldown = attackPattern.cooldown || 2.0;
        }
    }

    /**
     * Shoot projectile at player
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     */
    shootAtPlayer(enemy, player) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern;
        const angle = MathUtils.angle(enemyPos.x, enemyPos.y, playerPos.x, playerPos.y);
        
        this.createEnemyProjectile(
            enemyPos.x,
            enemyPos.y,
            angle,
            attackPattern.damage || 10,
            attackPattern.projectileSpeed || 250,
            5.0,
            enemy.id,
            attackPattern.projectileColor || '#FF0000'
        );
    }

    /**
     * Shoot spread of projectiles at player
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} count - Number of projectiles
     */
    shootSpread(enemy, player, count) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern;
        const baseAngle = MathUtils.angle(enemyPos.x, enemyPos.y, playerPos.x, playerPos.y);
        const spreadAngle = Math.PI / 4;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * (spreadAngle / count);
            const angle = baseAngle + offset;
            
            this.createEnemyProjectile(
                enemyPos.x,
                enemyPos.y,
                angle,
                attackPattern.damage || 10,
                attackPattern.projectileSpeed || 250,
                5.0,
                enemy.id,
                attackPattern.projectileColor || '#FF0000'
            );
        }
    }

    /**
     * Kamikaze AI - Rush directly at player for suicide attack
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    kamikazeAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyVel = enemy.getComponent('velocity');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyVel || !enemyComp) return;

        // Calculate direction to player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Speed boost as it gets closer (more aggressive)
            const speedBoost = 1 + (1 - Math.min(distance / 300, 1)) * 0.5;
            const speed = enemyComp.speed * speedBoost;
            
            // Direct charge at player
            enemyVel.vx = (dx / distance) * speed;
            enemyVel.vy = (dy / distance) * speed;
        }
    }

    /**
     * Stationary AI - Stays in place and shoots
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    stationaryAI(enemy, player, deltaTime) {
        const enemyVel = enemy.getComponent('velocity');
        
        if (!enemyVel) return;
        
        // Don't move
        enemyVel.vx = 0;
        enemyVel.vy = 0;
        
        // Face towards player (rotation handled by attack system)
    }

    /**
     * Shoot spiral pattern
     * @param {Entity} enemy - Enemy entity
     * @param {number} count - Number of projectiles
     */
    shootSpiral(enemy, count) {
        const enemyPos = enemy.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern;
        
        // Initialize spiral rotation if not exists
        if (enemyComp.spiralRotation === undefined) {
            enemyComp.spiralRotation = 0;
        }
        enemyComp.spiralRotation += 0.5;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + enemyComp.spiralRotation;
            
            this.createEnemyProjectile(
                enemyPos.x,
                enemyPos.y,
                angle,
                attackPattern.damage || 10,
                attackPattern.projectileSpeed || 250,
                5.0,
                enemy.id,
                attackPattern.projectileColor || '#FF00FF'
            );
        }
    }

    /**
     * Create enemy projectile
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Direction angle
     * @param {number} damage - Damage value
     * @param {number} speed - Projectile speed
     * @param {number} lifetime - Lifetime in seconds
     * @param {number} owner - Owner entity ID
     * @param {string} color - Projectile color
     * @returns {Entity} Created projectile
     */
    createEnemyProjectile(x, y, angle, damage, speed, lifetime, owner, color) {
        const projectile = this.world.createEntity('projectile');
        
        projectile.addComponent('position', Components.Position(x, y));
        projectile.addComponent('velocity', Components.Velocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        ));
        projectile.addComponent('collision', Components.Collision(6));
        projectile.addComponent('renderable', Components.Renderable(color, 6, 'circle'));
        projectile.addComponent('projectile', Components.Projectile(
            damage,
            speed,
            lifetime,
            owner,
            'enemy_shot'
        ));
        
        return projectile;
    }
}
