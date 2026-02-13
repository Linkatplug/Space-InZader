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
     * Chase AI - Direct pursuit of player (for melee/kamikaze enemies)
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    chaseAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // If enemy has a ranged weapon, use tactical positioning instead
        if (enemyComp.enemyWeapon) {
            return this.tacticalRangedAI(enemy, player, deltaTime);
        }

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
     * Tactical Ranged AI - Maintain optimal distance with strafing
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    tacticalRangedAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // Optimal combat distances
        const optimalDistance = 250;  // Preferred fighting range
        const minDistance = 180;      // Don't get too close
        const maxDistance = 400;      // Don't get too far
        
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Initialize strafe variables
        if (enemyComp.strafeTime === undefined) {
            enemyComp.strafeTime = 0;
            enemyComp.strafeDirection = Math.random() < 0.5 ? -1 : 1;
            enemyComp.repositionTimer = Math.random() * 2;
        }
        
        enemyComp.strafeTime += deltaTime;
        enemyComp.repositionTimer -= deltaTime;
        
        // Change strafe direction periodically
        if (enemyComp.strafeTime > 2.5) {
            enemyComp.strafeTime = 0;
            enemyComp.strafeDirection *= -1;
        }
        
        // Periodic repositioning
        if (enemyComp.repositionTimer <= 0) {
            enemyComp.repositionTimer = 3 + Math.random() * 2;
            enemyComp.repositionAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
        }

        let moveX = 0;
        let moveY = 0;

        // Distance-based behavior
        if (distance < minDistance) {
            // Too close - retreat while strafing
            const retreatAngle = angle + Math.PI; // Opposite direction
            moveX = Math.cos(retreatAngle) * enemyComp.speed * deltaTime * 1.2;
            moveY = Math.sin(retreatAngle) * enemyComp.speed * deltaTime * 1.2;
            
            // Add strafe component
            const perpAngle = angle + Math.PI / 2;
            moveX += Math.cos(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime * 0.5;
            moveY += Math.sin(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime * 0.5;
            
        } else if (distance > maxDistance) {
            // Too far - close distance
            const normalized = MathUtils.normalize(dx, dy);
            moveX = normalized.x * enemyComp.speed * deltaTime * 0.8;
            moveY = normalized.y * enemyComp.speed * deltaTime * 0.8;
            
        } else {
            // In optimal range - strafe and maintain position
            const distanceDeviation = distance - optimalDistance;
            
            // Adjust distance slowly
            if (Math.abs(distanceDeviation) > 30) {
                const normalized = MathUtils.normalize(dx, dy);
                const adjustSpeed = distanceDeviation > 0 ? -0.3 : 0.3;
                moveX = normalized.x * enemyComp.speed * deltaTime * adjustSpeed;
                moveY = normalized.y * enemyComp.speed * deltaTime * adjustSpeed;
            }
            
            // Primary strafing motion
            const perpAngle = angle + Math.PI / 2;
            moveX += Math.cos(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime * 0.7;
            moveY += Math.sin(perpAngle) * enemyComp.strafeDirection * enemyComp.speed * deltaTime * 0.7;
        }

        // Apply movement
        enemyPos.x += moveX;
        enemyPos.y += moveY;

        // Always face the player
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            renderable.rotation = angle;
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

        // If enemy has a ranged weapon, use tactical positioning instead
        if (enemyComp.enemyWeapon) {
            return this.tacticalRangedAI(enemy, player, deltaTime);
        }

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
    /**
     * Aggressive AI - Fast pursuit with prediction and ranged tactics
     * @param {Entity} enemy - Enemy entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    aggressiveAI(enemy, player, deltaTime) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        // If enemy has a ranged weapon, use enhanced tactical AI
        if (enemyComp.enemyWeapon) {
            return this.tacticalRangedAI(enemy, player, deltaTime);
        }

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
     * Boss AI - Multi-phase attack patterns with lasers and bullets
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

        // Initialize boss-specific timers if needed
        if (!boss.burstCooldown) boss.burstCooldown = 0;
        if (!boss.laserCooldown) boss.laserCooldown = 0;
        if (!boss.telegraphTimer) boss.telegraphTimer = 0;
        if (!boss.minionCooldown) boss.minionCooldown = 0;
        if (!boss.isEnraged) boss.isEnraged = false;

        // Update cooldowns
        boss.burstCooldown -= deltaTime;
        boss.laserCooldown -= deltaTime;
        boss.telegraphTimer -= deltaTime;
        boss.minionCooldown -= deltaTime;

        // Determine current phase based on health (60% threshold)
        const healthPercent = health.current / health.max;
        const wasEnraged = boss.isEnraged;
        boss.isEnraged = healthPercent <= 0.6;

        // Flash effect when entering enraged phase
        if (boss.isEnraged && !wasEnraged) {
            const renderable = enemy.getComponent('renderable');
            if (renderable) {
                renderable.flash = 1.0;
            }
            // Play warning sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playSFX('electric', 0.5, 0.8);
            }
        }

        // Phase-based cooldowns and movement behavior
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Boss maintains optimal combat range with aggressive repositioning
        const optimalDistance = 300;
        const minDistance = 200;
        const maxDistance = 500;
        
        // Initialize boss movement state
        if (!boss.circleDirection) {
            boss.circleDirection = Math.random() < 0.5 ? 1 : -1;
            boss.circleTime = 0;
        }
        boss.circleTime += deltaTime;
        
        // Change circle direction every 4 seconds
        if (boss.circleTime > 4) {
            boss.circleTime = 0;
            boss.circleDirection *= -1;
        }
        
        let moveX = 0;
        let moveY = 0;
        
        if (boss.isEnraged) {
            // Enraged: More aggressive, faster movement, tighter circles
            if (distance < minDistance) {
                // Retreat while strafing
                const retreatAngle = angle + Math.PI;
                moveX = Math.cos(retreatAngle) * enemyComp.speed * 1.5 * deltaTime;
                moveY = Math.sin(retreatAngle) * enemyComp.speed * 1.5 * deltaTime;
            } else if (distance > maxDistance) {
                // Close in fast
                const normalized = MathUtils.normalize(dx, dy);
                moveX = normalized.x * enemyComp.speed * 1.3 * deltaTime;
                moveY = normalized.y * enemyComp.speed * 1.3 * deltaTime;
            } else {
                // Aggressive circular strafing
                const circleAngle = angle + Math.PI / 2 * boss.circleDirection;
                moveX = Math.cos(circleAngle) * enemyComp.speed * 1.2 * deltaTime;
                moveY = Math.sin(circleAngle) * enemyComp.speed * 1.2 * deltaTime;
                
                // Slight pull toward optimal distance
                if (distance > optimalDistance + 50) {
                    const normalized = MathUtils.normalize(dx, dy);
                    moveX += normalized.x * enemyComp.speed * 0.3 * deltaTime;
                    moveY += normalized.y * enemyComp.speed * 0.3 * deltaTime;
                }
            }
        } else {
            // Normal phase: Methodical, maintains range
            if (distance < optimalDistance - 50) {
                // Maintain distance
                const normalized = MathUtils.normalize(-dx, -dy);
                moveX = normalized.x * enemyComp.speed * 0.8 * deltaTime;
                moveY = normalized.y * enemyComp.speed * 0.8 * deltaTime;
            } else if (distance > optimalDistance + 50) {
                // Close in slowly
                const normalized = MathUtils.normalize(dx, dy);
                moveX = normalized.x * enemyComp.speed * 0.6 * deltaTime;
                moveY = normalized.y * enemyComp.speed * 0.6 * deltaTime;
            }
            
            // Smooth circular movement
            const circleAngle = angle + Math.PI / 2 * boss.circleDirection;
            moveX += Math.cos(circleAngle) * enemyComp.speed * 0.7 * deltaTime;
            moveY += Math.sin(circleAngle) * enemyComp.speed * 0.7 * deltaTime;
        }
        
        // Apply movement
        enemyPos.x += moveX;
        enemyPos.y += moveY;
        const burstInterval = boss.isEnraged ? 1.5 : 2.5;
        const laserInterval = boss.isEnraged ? 2.5 : 4.0;
        const minionInterval = 5.0;

        // Movement behavior
        if (healthPercent > 0.6) {
            // Phase 1 - Moderate kiting
            this.kiteAI(enemy, player, deltaTime);
        } else {
            // Phase 2 - Aggressive movement
            const dx = playerPos.x - enemyPos.x;
            const dy = playerPos.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 250) {
                // Charge at player
                const normalized = MathUtils.normalize(dx, dy);
                const speedMult = 1.3;
                enemyPos.x += normalized.x * enemyComp.speed * speedMult * deltaTime;
                enemyPos.y += normalized.y * enemyComp.speed * speedMult * deltaTime;
            } else {
                // Retreat and attack
                const normalized = MathUtils.normalize(-dx, -dy);
                enemyPos.x += normalized.x * enemyComp.speed * 0.8 * deltaTime;
                enemyPos.y += normalized.y * enemyComp.speed * 0.8 * deltaTime;
            }
        }

        // Pattern A: Burst Bullets (12-projectile fan spread)
        if (boss.burstCooldown <= 0) {
            // Telegraph attack
            boss.telegraphTimer = 0.5;
            const renderable = enemy.getComponent('renderable');
            if (renderable) {
                renderable.flash = 0.8;
            }
            // Play telegraph sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playSFX('electric', 0.3, 1.2);
            }
            
            // Schedule attack after telegraph
            setTimeout(() => {
                this.bossBurstBullets(enemy, player);
            }, 500);
            
            boss.burstCooldown = burstInterval;
        }

        // Pattern B: Laser Sweep
        if (boss.laserCooldown <= 0) {
            // Telegraph attack
            boss.telegraphTimer = 0.5;
            const renderable = enemy.getComponent('renderable');
            if (renderable) {
                renderable.flash = 1.0;
            }
            // Play telegraph sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playSFX('laser', 0.4, 0.7);
            }
            
            // Schedule attack after telegraph
            setTimeout(() => {
                this.bossLaserSweep(enemy);
            }, 500);
            
            boss.laserCooldown = laserInterval;
        }

        // Phase 2 only: Spawn minions
        if (boss.isEnraged && boss.minionCooldown <= 0) {
            this.bossSpawnMinions(enemy);
            boss.minionCooldown = minionInterval;
        }

        // Update rotation to face player
        const renderable = enemy.getComponent('renderable');
        if (renderable) {
            const dx = playerPos.x - enemyPos.x;
            const dy = playerPos.y - enemyPos.y;
            renderable.rotation = Math.atan2(dy, dx);
        }
    }

    /**
     * Boss burst bullet pattern - 12 projectiles in fan
     * @param {Entity} enemy - Boss entity
     * @param {Entity} player - Player entity
     */
    bossBurstBullets(enemy, player) {
        const enemyPos = enemy.getComponent('position');
        const playerPos = player.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !playerPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern || {};
        const baseAngle = MathUtils.angle(enemyPos.x, enemyPos.y, playerPos.x, playerPos.y);
        const spreadAngle = Math.PI / 4; // 45 degrees
        const count = 12;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * (spreadAngle / (count - 1));
            const angle = baseAngle + offset;
            
            this.createEnemyProjectile(
                enemyPos.x,
                enemyPos.y,
                angle,
                attackPattern.damage || 30,
                attackPattern.projectileSpeed || 350,
                5.0,
                enemy.id,
                '#FF00FF' // Magenta
            );
        }
    }

    /**
     * Boss laser sweep pattern - rotating beam
     * @param {Entity} enemy - Boss entity
     */
    bossLaserSweep(enemy) {
        const enemyPos = enemy.getComponent('position');
        const enemyComp = enemy.getComponent('enemy');
        
        if (!enemyPos || !enemyComp) return;

        const attackPattern = enemyComp.attackPattern || {};
        const startAngle = Math.random() * Math.PI * 2; // Random starting angle

        // Create laser as a special projectile
        const laser = this.createEnemyProjectile(
            enemyPos.x,
            enemyPos.y,
            startAngle,
            10, // Damage per tick
            0, // No forward movement
            1.5, // Duration 1.5 seconds
            enemy.id,
            '#FF0000', // Red
            'laser' // Special type
        );

        // Mark as laser and set properties
        if (laser) {
            const projComp = laser.getComponent('projectile');
            if (projComp) {
                projComp.isLaser = true;
                projComp.laserLength = 600;
                projComp.laserRotationSpeed = 2.0; // radians per second
                projComp.damageTick = 0.1; // Damage every 0.1s
                projComp.lastDamageTick = 0;
                projComp.ownerPos = { x: enemyPos.x, y: enemyPos.y }; // Stay at boss position
            }

            // Make it look like a laser
            const renderable = laser.getComponent('renderable');
            if (renderable) {
                renderable.shape = 'line';
                renderable.size = 600; // Length
                renderable.shadowBlur = 20;
            }
        }
    }

    /**
     * Boss spawn minion enemies
     * @param {Entity} enemy - Boss entity
     */
    bossSpawnMinions(enemy) {
        const enemyPos = enemy.getComponent('position');
        if (!enemyPos) return;

        // Spawn 2 elite enemies
        const spawnOffsets = [
            { x: 60, y: 0 },
            { x: -60, y: 0 }
        ];

        for (const offset of spawnOffsets) {
            const spawnX = enemyPos.x + offset.x;
            const spawnY = enemyPos.y + offset.y;

            if (window.game && window.game.spawner) {
                window.game.spawner.spawnEnemyAtPosition('elite', spawnX, spawnY);
            }
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

        // Kamikaze behavior constants
        const KAMIKAZE_BOOST_DISTANCE = 300;
        const KAMIKAZE_BOOST_MULTIPLIER = 0.5;

        // Calculate direction to player
        const dx = playerPos.x - enemyPos.x;
        const dy = playerPos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Speed boost as it gets closer (more aggressive)
            const speedBoost = 1 + (1 - Math.min(distance / KAMIKAZE_BOOST_DISTANCE, 1)) * KAMIKAZE_BOOST_MULTIPLIER;
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
    createEnemyProjectile(x, y, angle, damage, speed, lifetime, owner, color, type = 'normal') {
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
