/**
 * @file CollisionSystem.js
 * @description Handles collision detection between entities
 */

class CollisionSystem {
    constructor(world, gameState, audioManager, particleSystem = null) {
        this.world = world;
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.particleSystem = particleSystem;
    }

    update(deltaTime) {
        // Update orbital projectile hit cooldowns
        const projectiles = this.world.getEntitiesByType('projectile');
        for (const projectile of projectiles) {
            const projComp = projectile.getComponent('projectile');
            if (projComp && projComp.orbital && projComp.hitCooldown) {
                for (const enemyId in projComp.hitCooldown) {
                    projComp.hitCooldown[enemyId] -= deltaTime;
                    if (projComp.hitCooldown[enemyId] <= 0) {
                        delete projComp.hitCooldown[enemyId];
                    }
                }
            }
        }
        
        // Check projectile-enemy collisions
        this.checkProjectileEnemyCollisions();
        
        // Check player-enemy collisions
        this.checkPlayerEnemyCollisions();
        
        // Check player-pickup collisions
        this.checkPlayerPickupCollisions();
        
        // Check player-enemy projectile collisions
        this.checkPlayerProjectileCollisions();
        
        // Check weather hazard collisions
        this.checkWeatherHazardCollisions(deltaTime);
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

                // Skip if orbital projectile is on cooldown for this enemy
                if (projComp.orbital && projComp.hitCooldown && projComp.hitCooldown[enemy.id] > 0) {
                    continue;
                }

                if (MathUtils.circleCollision(
                    projPos.x, projPos.y, projCol.radius,
                    enemyPos.x, enemyPos.y, enemyCol.radius
                )) {
                    // Deal damage to enemy (pass owner entity for lifesteal)
                    this.damageEnemy(enemy, projComp.damage, ownerEntity);
                    
                    // Don't remove orbital projectiles - they persist and keep damaging
                    if (projComp.orbital) {
                        // Orbital projectiles keep rotating but add a brief hit cooldown
                        if (!projComp.hitCooldown) projComp.hitCooldown = {};
                        projComp.hitCooldown[enemy.id] = 0.15; // 150ms cooldown per enemy
                        continue; // Check other enemies
                    }
                    
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
            if (playerHealth.invulnerable || playerHealth.godMode) continue;

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
            if (playerHealth.invulnerable || playerHealth.godMode) continue;

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
        const shield = player.getComponent('shield');
        const playerComp = player.getComponent('player');
        
        if (!health || !playerComp) return;
        
        // God mode check - no damage taken
        if (health.godMode) return;

        let remainingDamage = damage;
        
        // Shield absorbs damage first
        if (shield && shield.current > 0) {
            const shieldDamage = Math.min(shield.current, remainingDamage);
            shield.current -= shieldDamage;
            remainingDamage -= shieldDamage;
            
            // Reset shield regen delay when damaged
            shield.regenDelay = shield.regenDelayMax;
            
            // Visual feedback for shield hit
            if (this.screenEffects && shieldDamage > 0) {
                this.screenEffects.flash('#00FFFF', 0.2, 0.1);
            }
        }
        
        // Remaining damage goes to health (with armor reduction)
        if (remainingDamage > 0) {
            const actualDamage = Math.max(1, remainingDamage - playerComp.stats.armor);
            health.current -= actualDamage;
            this.gameState.stats.damageTaken += actualDamage;
            
            // Play hit sound
            if (this.audioManager && this.audioManager.initialized) {
                this.audioManager.playSFX('hit', 1.2);
            }
            
            // Screen shake and flash on health hit
            if (this.screenEffects) {
                this.screenEffects.shake(5, 0.2);
                this.screenEffects.flash('#FF0000', 0.3, 0.15);
            }
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
        
        // Explosion system constants
        const EXPLOSION_FRIENDLY_FIRE_MULTIPLIER = 0.5;
        const EXPLOSION_VISUAL_SCALE = 0.6;
        const EXPLOSION_PARTICLE_COUNT = 40;
        const EXPLOSION_SHAKE_INTENSITY = 8;
        const EXPLOSION_SHAKE_DURATION = 0.3;
        
        if (enemyComp && pos) {
            // Handle explosive enemies - deal area damage
            if (enemyComp.isExplosive && enemyComp.attackPattern?.type === 'explode') {
                const explosionRadius = enemyComp.attackPattern.explosionRadius || 80;
                const explosionDamage = enemyComp.attackPattern.damage || 40;
                
                // Find all entities near the explosion
                const player = this.world.getEntitiesByType('player')[0];
                const allEnemies = this.world.getEntitiesByType('enemy');
                
                // Damage player if in range
                if (player) {
                    const playerPos = player.getComponent('position');
                    if (playerPos) {
                        const dx = playerPos.x - pos.x;
                        const dy = playerPos.y - pos.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < explosionRadius) {
                            const damageFalloff = Math.max(0, Math.min(1, 1 - (distance / explosionRadius)));
                            this.damagePlayer(player, explosionDamage * damageFalloff);
                        }
                    }
                }
                
                // Damage nearby enemies
                for (const nearbyEnemy of allEnemies) {
                    if (nearbyEnemy.id === enemy.id) continue;
                    
                    const nearbyPos = nearbyEnemy.getComponent('position');
                    if (nearbyPos) {
                        const dx = nearbyPos.x - pos.x;
                        const dy = nearbyPos.y - pos.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < explosionRadius) {
                            const damageFalloff = Math.max(0, Math.min(1, 1 - (distance / explosionRadius)));
                            // Reduced friendly fire
                            this.damageEnemy(nearbyEnemy, explosionDamage * damageFalloff * EXPLOSION_FRIENDLY_FIRE_MULTIPLIER);
                        }
                    }
                }
                
                // Enhanced visual effect for explosion
                if (this.particleSystem) {
                    const explosionColor = enemyComp.attackPattern.explosionColor || '#FF4500';
                    this.particleSystem.createExplosion(
                        pos.x, 
                        pos.y, 
                        explosionRadius * EXPLOSION_VISUAL_SCALE, 
                        explosionColor, 
                        EXPLOSION_PARTICLE_COUNT
                    );
                }
                
                // Screen shake for explosion
                if (this.screenEffects) {
                    this.screenEffects.shake(EXPLOSION_SHAKE_INTENSITY, EXPLOSION_SHAKE_DURATION);
                    this.screenEffects.flash(enemyComp.attackPattern.explosionColor || '#FF4500', 0.4, 0.2);
                }
            }
            
            // Play explosion sound
            if (this.audioManager && this.audioManager.initialized) {
                const pitch = enemyComp.isExplosive ? 0.6 : MathUtils.randomFloat(0.8, 1.2);
                this.audioManager.playSFX('explosion', pitch);
            }
            
            // Create explosion particle effect
            if (this.particleSystem && !enemyComp.isExplosive) {
                const color = renderable ? renderable.color : '#ff6600';
                const size = renderable ? renderable.size : 20;
                const particleCount = Math.min(30, 15 + size);
                this.particleSystem.createExplosion(pos.x, pos.y, size, color, particleCount);
            }
            
            // Drop XP
            this.spawnPickup(pos.x, pos.y, 'xp', enemyComp.xpValue);
            
            // Random chance to drop health pack (5-15 HP)
            const isBoss = renderable && renderable.size >= BOSS_SIZE_THRESHOLD;
            // Reduce health drop rate by 75% (multiply by 0.25)
            const healthDropChance = isBoss ? 0.125 : 0.0625; // Was 50% for bosses, 25% for regular - now 12.5% and 6.25%
            
            if (Math.random() < healthDropChance) {
                const healAmount = 5 + Math.floor(Math.random() * 11); // 5-15 HP
                this.spawnPickup(pos.x + (Math.random() - 0.5) * 30, pos.y + (Math.random() - 0.5) * 30, 'health', healAmount);
            }
            
            // Chain Lightning/Chain Reaction
            // Get player to check for chain lightning stat
            const player = this.world.getEntitiesByType('player')[0];
            if (player) {
                const playerComp = player.getComponent('player');
                if (playerComp && playerComp.stats.chainLightning > 0) {
                    // Find nearby enemies for chain reaction
                    const chainRange = 150; // Range for chain lightning
                    const chainDamage = enemyComp.maxHealth * 0.3; // 30% of killed enemy's max HP
                    const maxChains = Math.floor(playerComp.stats.chainLightning); // Number of chains
                    
                    const allEnemies = this.world.getEntitiesByType('enemy');
                    const nearbyEnemies = [];
                    
                    // Find nearby enemies
                    for (const nearbyEnemy of allEnemies) {
                        if (nearbyEnemy.id === enemy.id) continue;
                        
                        const nearbyPos = nearbyEnemy.getComponent('position');
                        if (nearbyPos) {
                            const dx = nearbyPos.x - pos.x;
                            const dy = nearbyPos.y - pos.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < chainRange) {
                                nearbyEnemies.push({ enemy: nearbyEnemy, distance: distance, pos: nearbyPos });
                            }
                        }
                    }
                    
                    // Sort by distance and chain to closest enemies
                    nearbyEnemies.sort((a, b) => a.distance - b.distance);
                    const chainsToApply = Math.min(maxChains, nearbyEnemies.length);
                    
                    for (let i = 0; i < chainsToApply; i++) {
                        const target = nearbyEnemies[i];
                        
                        // Create lightning visual effect
                        if (this.particleSystem) {
                            this.particleSystem.createLightning(pos.x, pos.y, target.pos.x, target.pos.y, '#00ffff');
                        }
                        
                        // Deal chain damage
                        this.damageEnemy(target.enemy, chainDamage, player);
                    }
                    
                    // Play chain lightning sound
                    if (chainsToApply > 0 && this.audioManager && this.audioManager.initialized) {
                        this.audioManager.playSFX('electric', 1.0);
                    }
                }
                
                // Chain Explosions (Réaction en Chaîne)
                // Check if player has explosionOnKill stat AND enemy wasn't killed by explosion (prevent infinite cascade)
                if (playerComp && playerComp.stats.explosionOnKill && !enemyComp.killedByExplosion) {
                    // Get explosion parameters from player stats
                    const explosionRadius = playerComp.stats.explosionRadius || 80;
                    const explosionDamage = (playerComp.stats.explosionDamage || 30) * playerComp.stats.damageMultiplier;
                    
                    // Create explosion visual effect
                    if (this.particleSystem) {
                        const color = renderable ? renderable.color : '#ff6600';
                        const particleCount = 20;
                        this.particleSystem.createExplosion(pos.x, pos.y, explosionRadius * 0.5, color, particleCount);
                    }
                    
                    // Play explosion sound
                    if (this.audioManager && this.audioManager.initialized) {
                        this.audioManager.playSFX('explosion', 0.8);
                    }
                    
                    // Deal AOE damage to nearby enemies
                    const allEnemies = this.world.getEntitiesByType('enemy');
                    for (const nearbyEnemy of allEnemies) {
                        if (nearbyEnemy.id === enemy.id) continue; // Skip the killed enemy
                        
                        const nearbyPos = nearbyEnemy.getComponent('position');
                        if (nearbyPos) {
                            const dx = nearbyPos.x - pos.x;
                            const dy = nearbyPos.y - pos.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < explosionRadius) {
                                // Damage falls off with distance
                                const falloff = 1 - (distance / explosionRadius) * 0.5; // 50-100% damage based on distance
                                const finalDamage = explosionDamage * falloff;
                                
                                // Mark enemy as killed by explosion to prevent infinite chain
                                const nearbyEnemyComp = nearbyEnemy.getComponent('enemy');
                                if (nearbyEnemyComp) {
                                    nearbyEnemyComp.killedByExplosion = true;
                                }
                                
                                this.damageEnemy(nearbyEnemy, finalDamage, player);
                            }
                        }
                    }
                }
            }
            
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
    
    /**
     * Check collisions between player and weather hazards (meteors, black holes)
     * @param {number} deltaTime - Time elapsed since last frame
     */
    checkWeatherHazardCollisions(deltaTime) {
        const player = this.world.getEntitiesByType('player')[0];
        const enemies = this.world.getEntitiesByType('enemy');
        
        // Check meteor collisions
        const meteors = this.world.getEntitiesByType('meteor');
        for (const meteor of meteors) {
            const meteorPos = meteor.getComponent('position');
            const meteorCol = meteor.getComponent('collision');
            const meteorComp = meteor.getComponent('meteor');
            
            if (!meteorPos || !meteorCol || !meteorComp) continue;
            
            // Check if meteor hit bottom of screen
            if (meteorPos.y > this.world.canvas?.height + 50) {
                this.world.removeEntity(meteor.id);
                continue;
            }
            
            let meteorHit = false;
            
            // Check collision with player
            if (player) {
                const playerPos = player.getComponent('position');
                const playerCol = player.getComponent('collision');
                
                if (playerPos && playerCol && MathUtils.circleCollision(
                    playerPos.x, playerPos.y, playerCol.radius,
                    meteorPos.x, meteorPos.y, meteorCol.radius
                )) {
                    // Damage player
                    this.damagePlayer(player, meteorComp.damage, 'meteor');
                    meteorHit = true;
                }
            }
            
            // Check collision with enemies
            if (!meteorHit) {
                for (const enemy of enemies) {
                    const enemyPos = enemy.getComponent('position');
                    const enemyCol = enemy.getComponent('collision');
                    
                    if (!enemyPos || !enemyCol) continue;
                    
                    if (MathUtils.circleCollision(
                        enemyPos.x, enemyPos.y, enemyCol.radius,
                        meteorPos.x, meteorPos.y, meteorCol.radius
                    )) {
                        // Damage enemy (reduced damage to balance)
                        this.damageEnemy(enemy, meteorComp.damage * 0.7);
                        meteorHit = true;
                        break;
                    }
                }
            }
            
            // If meteor hit something, create explosion and remove it
            if (meteorHit) {
                // Create explosion effect
                if (this.particleSystem) {
                    this.particleSystem.createExplosion(
                        meteorPos.x,
                        meteorPos.y,
                        meteorComp.size,
                        '#8B4513',
                        25
                    );
                }
                
                // Play impact sound
                if (this.audioManager && this.audioManager.initialized) {
                    this.audioManager.playSFX('explosion', 1.2);
                }
                
                // Screen shake (less intense for enemy hits)
                if (this.screenEffects && player) {
                    const playerPos = player.getComponent('position');
                    if (playerPos) {
                        const dx = meteorPos.x - playerPos.x;
                        const dy = meteorPos.y - playerPos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        // Shake intensity decreases with distance
                        const intensity = Math.max(2, 6 - dist / 100);
                        this.screenEffects.shake(intensity, 0.2);
                    }
                }
                
                // Remove meteor
                this.world.removeEntity(meteor.id);
            }
        }
        
        // Check black hole collisions
        const blackHoles = this.world.getEntitiesByType('black_hole');
        for (const blackHole of blackHoles) {
            const blackHolePos = blackHole.getComponent('position');
            const blackHoleCol = blackHole.getComponent('collision');
            const blackHoleComp = blackHole.getComponent('black_hole');
            
            if (!blackHolePos || !blackHoleCol || !blackHoleComp) continue;
            
            // Check if grace period has passed
            const isActive = blackHoleComp.age > blackHoleComp.gracePeriod;
            if (!isActive) continue; // Don't damage during grace period
            
            // Damage player if within damage radius (throttled to 0.5s intervals)
            if (player) {
                const playerPos = player.getComponent('position');
                if (playerPos) {
                    const distance = MathUtils.distance(
                        playerPos.x, playerPos.y,
                        blackHolePos.x, blackHolePos.y
                    );
                    
                    if (distance < blackHoleComp.damageRadius) {
                        // Update damage timer only when in damage radius
                        blackHoleComp.lastPlayerDamageTime += deltaTime;
                        
                        // Apply damage every 0.5 seconds
                        if (blackHoleComp.lastPlayerDamageTime >= 0.5) {
                            // Scale damage based on distance - closer to center = more damage
                            // At center (distance=0): 3x damage, at edge (distance=damageRadius): 1x damage
                            const distanceFactor = Math.max(0, Math.min(1, 1 - (distance / blackHoleComp.damageRadius)));
                            const damageMultiplier = 1 + (distanceFactor * 2); // 1x to 3x multiplier
                            const scaledDamage = blackHoleComp.damage * damageMultiplier;
                            
                            this.damagePlayer(player, scaledDamage, 'black_hole');
                            blackHoleComp.lastPlayerDamageTime = 0;
                            
                            // Visual feedback - more intense closer to center
                            if (this.screenEffects) {
                                const flashIntensity = 0.1 + (distanceFactor * 0.2); // 0.1 to 0.3
                                this.screenEffects.flash('#9400D3', 0.2, flashIntensity);
                            }
                        }
                    } else {
                        // Reset timer when player exits damage radius
                        blackHoleComp.lastPlayerDamageTime = 0;
                    }
                }
            }
            
            // Damage enemies within damage radius (throttled to 0.5s intervals per enemy)
            for (const enemy of enemies) {
                const enemyPos = enemy.getComponent('position');
                if (!enemyPos) continue;
                
                const distance = MathUtils.distance(
                    enemyPos.x, enemyPos.y,
                    blackHolePos.x, blackHolePos.y
                );
                
                if (distance < blackHoleComp.damageRadius) {
                    // Initialize timer for this enemy if not exists
                    if (!blackHoleComp.lastEnemyDamageTime[enemy.id]) {
                        blackHoleComp.lastEnemyDamageTime[enemy.id] = 0; // Start at 0 for consistent timing
                    }
                    
                    // Update timer
                    blackHoleComp.lastEnemyDamageTime[enemy.id] += deltaTime;
                    
                    // Apply damage every 0.5 seconds
                    if (blackHoleComp.lastEnemyDamageTime[enemy.id] >= 0.5) {
                        // Scale damage based on distance - closer to center = more damage
                        const distanceFactor = Math.max(0, Math.min(1, 1 - (distance / blackHoleComp.damageRadius)));
                        const damageMultiplier = 1 + (distanceFactor * 2); // 1x to 3x multiplier
                        const scaledDamage = blackHoleComp.damage * 0.5 * damageMultiplier;
                        
                        this.damageEnemy(enemy, scaledDamage);
                        blackHoleComp.lastEnemyDamageTime[enemy.id] = 0;
                    }
                } else {
                    // Reset timer when enemy exits damage radius to prevent memory accumulation
                    if (blackHoleComp.lastEnemyDamageTime[enemy.id]) {
                        delete blackHoleComp.lastEnemyDamageTime[enemy.id];
                    }
                }
            }
        }
    }
}
