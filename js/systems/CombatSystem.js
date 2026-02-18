/**
 * @file CombatSystem.js
 * @description Handles weapon firing, combat mechanics, and projectile creation
 * 
 * SEPARATION OF RESPONSIBILITIES:
 * - CombatSystem: Detects hits, calculates damage multipliers, creates DamagePackets
 * - DefenseSystem: Applies damage to entities (shield/armor/structure), the ONLY authority for defense modification
 * 
 * CombatSystem MUST NOT:
 * - Directly modify health, shield, armor, or structure
 * - Apply damage to entities
 * - Destroy entities based on health
 * 
 * CombatSystem SHOULD:
 * - Detect weapon hits
 * - Calculate final damage (multipliers, crits, synergies)
 * - Call DefenseSystem.applyDamage() to delegate damage application
 * - Create and manage projectiles
 */

// Sound probability constants for weapons
const BEAM_SOUND_PROBABILITY = 0.15; // Beam weapons fire rapidly, reduce sound frequency

class CombatSystem {
    constructor(world, gameState, audioManager) {
        this.world = world;
        this.gameState = gameState;
        this.audioManager = audioManager;
    }

    /**
     * Update all weapon cooldowns and fire when ready
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        const players = this.world.getEntitiesByType('player');
        
        for (const player of players) {
            const playerComp = player.getComponent('player');
            if (!playerComp) continue;

            // Update and fire each weapon
            for (const weaponData of playerComp.weapons) {
                this.updateWeapon(player, weaponData, deltaTime);
            }
            
            // Update blade halo if active
            this.updateBladeHalo(player, playerComp, deltaTime);
        }
        
        // Update enemy firing
        this.updateEnemyFiring(deltaTime);
    }
    
    /**
     * Update enemy firing at player
     * @param {number} deltaTime - Time elapsed since last frame
     */
    updateEnemyFiring(deltaTime) {
        const enemies = this.world.getEntitiesByType('enemy');
        const player = this.world.getEntitiesByType('player')[0];
        
        if (!player) return;
        
        const playerPos = player.getComponent('position');
        if (!playerPos) return;
        
        // P1 FIX: Fire Distance Limit
        const MAX_FIRE_DISTANCE = 700;
        
        for (const enemy of enemies) {
            const enemyComp = enemy.getComponent('enemy');
            const enemyPos = enemy.getComponent('position');
            
            if (!enemyComp || !enemyPos || !enemyComp.enemyWeapon) continue;
            
            const weapon = enemyComp.enemyWeapon;
            
            // Update cooldown
            weapon.cooldown -= deltaTime;
            
            // Fire when ready
            if (weapon.cooldown <= 0) {
                weapon.cooldown = 1 / weapon.fireRate;
                
                // Calculate angle toward player
                const dx = playerPos.x - enemyPos.x;
                const dy = playerPos.y - enemyPos.y;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // P1 FIX: Don't fire if too far away
                if (distance > MAX_FIRE_DISTANCE) {
                    logger.debug('Combat', `${enemy.type} too far to fire (${Math.round(distance)}px > ${MAX_FIRE_DISTANCE}px)`);
                    continue;
                }
                
                logger.debug('Combat', `${enemy.type} firing at player`, {
                    distance: Math.round(distance),
                    damage: weapon.baseDamage,
                    damageType: weapon.damageType
                });
                
                // Create projectile
                console.log("[FIX VERIFY] Enemy projectile owner set to:", enemy.id);
                this.createProjectile(
                    enemyPos.x,
                    enemyPos.y,
                    angle,
                    weapon.baseDamage,
                    weapon.projectileSpeed,
                    5, // lifetime
                    enemy.id, // owner - USE NUMERIC ENTITY ID
                    'direct', // weaponType
                    0, // piercing
                    weapon.color,
                    weapon.damageType
                );
            }
        }
    }

    /**
     * Update weapon cooldown and fire if ready
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon object from playerComp.weapons
     * @param {number} deltaTime - Time elapsed
     */
    updateWeapon(player, weapon, deltaTime) {
        if (!weapon || !weapon.data) return;

        // Update cooldown
        weapon.cooldown -= deltaTime;

        // Check if weapons are disabled by weather event (magnetic storm)
        if (this.gameState && this.gameState.weaponDisabled) {
            return; // Don't fire weapons during magnetic storm
        }

        // Fire when cooldown is ready
        if (weapon.cooldown <= 0) {
            const playerComp = player.getComponent('player');
            const playerStats = playerComp.stats;
            const baseFireRate = weapon.data.fireRate || 1;
            const fireRate = baseFireRate * playerStats.fireRate;
            weapon.cooldown = fireRate > 0 ? 1 / fireRate : 999;
            
            // Set currentWeapon for UI
            playerComp.currentWeapon = weapon.data;
            
            this.fireWeaponWithHeat(player, weapon);
        }
    }

    /**
     * Fire weapon based on its type
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireWeapon(player, weapon) {
        const type = weapon.data.type;
        
        // Play appropriate sound effect with pitch variation
        if (this.audioManager && this.audioManager.initialized) {
            switch (type) {
                case 'direct':
                case 'continuous_beam':
                    this.audioManager.playSFX('laser', MathUtils.randomFloat(0.9, 1.1));
                    break;
                case 'spread':
                case 'flamethrower':
                    // Minigun/flamethrower needs more variety - vary between 0.6 and 1.2
                    this.audioManager.playSFX('laser', MathUtils.randomFloat(0.6, 1.2));
                    break;
                case 'homing':
                case 'mega_homing':
                    this.audioManager.playSFX('missile', MathUtils.randomFloat(0.85, 1.15));
                    break;
                case 'chain':
                case 'storm':
                    this.audioManager.playSFX('electric', MathUtils.randomFloat(0.9, 1.1));
                    break;
                case 'beam':
                    // Beam weapons fire rapidly (20 times/sec) - play sound only occasionally to avoid repetitive noise
                    // Vampire ray weapon especially benefits from reduced sound frequency
                    if (Math.random() < BEAM_SOUND_PROBABILITY) {
                        // Use a softer, lower pitch for a subtle energy drain effect
                        this.audioManager.playSFX('laser', MathUtils.randomFloat(0.3, 0.5));
                    }
                    break;
                case 'railgun':
                    // Railgun fires slowly (0.4 times/sec) - always play sound but keep it soft
                    this.audioManager.playSFX('laser', MathUtils.randomFloat(0.4, 0.6));
                    break;
                case 'mine':
                case 'turret':
                    this.audioManager.playSFX('laser', MathUtils.randomFloat(1.0, 1.2));
                    break;
                case 'orbital':
                    // Orbitals are passive, only play sound occasionally
                    if (Math.random() < 0.1) {
                        this.audioManager.playSFX('laser', MathUtils.randomFloat(0.8, 1.0));
                    }
                    break;
                case 'gravity_field':
                    // Gravitational hum - low pitch
                    if (Math.random() < 0.2) {
                        this.audioManager.playSFX('laser', MathUtils.randomFloat(0.5, 0.7));
                    }
                    break;
                default:
                    // Default fallback sound
                    this.audioManager.playSFX('laser', 1.0);
                    break;
            }
        }
        
        switch (type) {
            case 'direct':
                this.fireDirect(player, weapon);
                break;
            case 'spread':
                this.fireSpread(player, weapon);
                break;
            case 'homing':
                this.fireHoming(player, weapon);
                break;
            case 'orbital':
                this.updateOrbitals(player, weapon);
                break;
            case 'beam':
                this.fireBeam(player, weapon);
                break;
            case 'mine':
                this.fireMine(player, weapon);
                break;
            case 'chain':
                this.fireChain(player, weapon);
                break;
            case 'turret':
                this.fireTurret(player, weapon);
                break;
            case 'continuous_beam':
                this.fireContinuousBeam(player, weapon);
                break;
            case 'mega_homing':
                this.fireMegaHoming(player, weapon);
                break;
            case 'gravity_field':
                this.updateGravityField(player, weapon);
                break;
            case 'storm':
                this.fireStorm(player, weapon);
                break;
            case 'railgun':
                this.fireRailgun(player, weapon);
                break;
            case 'flamethrower':
                this.fireFlamethrower(player, weapon);
                break;
        }
    }

    /**
     * Fire direct projectiles towards nearest enemy
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireDirect(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        const projectileCount = levelData.projectileCount || 1;
        const spread = projectileCount > 1 ? 0.2 : 0;

        for (let i = 0; i < projectileCount; i++) {
            const offset = (i - (projectileCount - 1) / 2) * spread;
            const finalAngle = angle + offset;
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            this.createProjectile(
                pos.x, pos.y,
                finalAngle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                3.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
        }
    }

    /**
     * Fire spread projectiles in a cone
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireSpread(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const baseAngle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        const projectileCount = levelData.projectileCount || 3;
        const spreadAngle = (levelData.area || 20) * (Math.PI / 180);

        for (let i = 0; i < projectileCount; i++) {
            const offset = (i - (projectileCount - 1) / 2) * (spreadAngle / projectileCount);
            const angle = baseAngle + offset;
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                2.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
        }
    }

    /**
     * Fire homing missiles
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireHoming(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const enemies = this.world.getEntitiesByType('enemy');
        if (enemies.length === 0) return;

        const projectileCount = levelData.projectileCount || 1;
        const targets = this.findNearestEnemies(pos.x, pos.y, projectileCount);

        for (const target of targets) {
            const targetPos = target.getComponent('position');
            const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                5.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
            
            // Make it homing
            const projComp = projectile.getComponent('projectile');
            projComp.homing = true;
            projComp.homingStrength = 0.1;
            projComp.explosionRadius = levelData.area || 60;
        }
    }

    /**
     * Update orbital projectiles
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    updateOrbitals(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        // Remove old orbitals for this weapon
        const orbitals = this.world.getEntitiesByType('projectile').filter(p => {
            const proj = p.getComponent('projectile');
            return proj && proj.weaponType === weapon.type && proj.owner === player.id;
        });

        const count = levelData.projectileCount || 2;
        if (orbitals.length < count) {
            // Create missing orbitals
            for (let i = orbitals.length; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const radius = levelData.area || 100;
                
                const orbital = this.world.createEntity('projectile');
                orbital.addComponent('position', Components.Position(
                    pos.x + Math.cos(angle) * radius,
                    pos.y + Math.sin(angle) * radius
                ));
                orbital.addComponent('collision', Components.Collision(15));
                orbital.addComponent('renderable', Components.Renderable(weapon.data.color, 15, 'circle'));
                orbital.addComponent('projectile', Components.Projectile(
                    weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                    0,
                    999,
                    player.id,
                    weapon.type
                ));
                
                const projComp = orbital.getComponent('projectile');
                projComp.orbital = true;
                projComp.orbitalIndex = i;
                projComp.orbitalCount = count;
                projComp.orbitalRadius = radius;
                projComp.orbitalSpeed = 2.0;
            }
        }
    }

    /**
     * Fire beam weapon
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireBeam(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y, levelData.area || 200);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        // Create beam projectile
        const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
        this.createProjectile(
            pos.x, pos.y,
            angle,
            weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
            5000,
            0.05,
            player.id,
            weapon.type,
            piercing,
            weapon.data.color,
            (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
        );
    }

    /**
     * Fire mines
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireMine(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const projectileCount = levelData.projectileCount || 1;
        
        for (let i = 0; i < projectileCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = weapon.data.projectileSpeed * 0.5;
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            const mine = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                speed,
                levelData.duration || 10,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
            
            const mineComp = mine.getComponent('projectile');
            mineComp.mine = true;
            mineComp.explosionRadius = levelData.area || 80;
        }
    }

    /**
     * Fire chain lightning
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireChain(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
        const projectile = this.createProjectile(
            pos.x, pos.y,
            angle,
            weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
            weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
            1.0 * playerComp.stats.range,
            player.id,
            weapon.type,
            piercing,
            weapon.data.color,
            (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
        );
        
        const projComp = projectile.getComponent('projectile');
        projComp.chain = true;
        projComp.chainCount = levelData.chainCount || 3;
        projComp.chainRange = levelData.area || 150;
        projComp.chained = [target.id];
    }

    /**
     * Fire turret (not implemented - would spawn ally entity)
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireTurret(player, weapon) {
        // Turret system would require separate entity type
        // Placeholder for future implementation
    }

    /**
     * Fire continuous beam (evolved laser)
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireContinuousBeam(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const stats = weapon.data.stats;
        
        const target = this.findNearestEnemy(pos.x, pos.y, stats.area);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        this.createProjectile(
            pos.x, pos.y,
            angle,
            weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
            8000,
            0.1,
            player.id,
            weapon.type,
            stats.piercing,
            weapon.data.color,
            (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
        );
    }

    /**
     * Fire mega homing missiles (evolved)
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireMegaHoming(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const stats = weapon.data.stats;
        
        const targets = this.findNearestEnemies(pos.x, pos.y, stats.projectileCount);

        for (const target of targets) {
            const targetPos = target.getComponent('position');
            const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                8.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
            
            const projComp = projectile.getComponent('projectile');
            projComp.homing = true;
            projComp.homingStrength = 0.15;
            projComp.explosionRadius = stats.area;
        }
    }

    /**
     * Update gravity field (evolved orbitals)
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    updateGravityField(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const stats = weapon.data.stats;
        
        const orbitals = this.world.getEntitiesByType('projectile').filter(p => {
            const proj = p.getComponent('projectile');
            return proj && proj.weaponType === weapon.type && proj.owner === player.id;
        });

        const count = stats.projectileCount;
        if (orbitals.length < count) {
            for (let i = orbitals.length; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const radius = stats.area;
                
                const orbital = this.world.createEntity('projectile');
                orbital.addComponent('position', Components.Position(
                    pos.x + Math.cos(angle) * radius,
                    pos.y + Math.sin(angle) * radius
                ));
                orbital.addComponent('collision', Components.Collision(20));
                orbital.addComponent('renderable', Components.Renderable(weapon.data.color, 20, 'circle'));
                orbital.addComponent('projectile', Components.Projectile(
                    weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
                    0,
                    999,
                    player.id,
                    weapon.type
                ));
                
                const projComp = orbital.getComponent('projectile');
                projComp.orbital = true;
                projComp.orbitalIndex = i;
                projComp.orbitalCount = count;
                projComp.orbitalRadius = radius;
                projComp.orbitalSpeed = 1.5;
                projComp.gravity = true;
                projComp.gravityStrength = 50;
            }
        }
    }

    /**
     * Fire storm lightning (evolved chain)
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireStorm(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const stats = weapon.data.stats;
        
        const targets = this.findNearestEnemies(pos.x, pos.y, 5);
        
        for (const target of targets) {
            const targetPos = target.getComponent('position');
            const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                2.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
            
            const projComp = projectile.getComponent('projectile');
            projComp.chain = true;
            projComp.chainCount = stats.chainCount;
            projComp.chainRange = stats.area;
            projComp.chained = [target.id];
        }
    }

    /**
     * Fire railgun - piercing beam weapon
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireRailgun(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const angle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        const projectileCount = levelData.projectileCount || 1;
        
        for (let i = 0; i < projectileCount; i++) {
            const offset = (i - (projectileCount - 1) / 2) * 0.1;
            const finalAngle = angle + offset;
            
            // Create long, fast piercing projectile (beam-like)
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            const projectile = this.createProjectile(
                pos.x, pos.y,
                finalAngle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                1.5 * playerComp.stats.range, // Shorter lifetime but very fast
                player.id,
                weapon.type,
                levelData.piercing || 999,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
            
            // Make it look like a beam - elongated projectile
            const renderable = projectile.getComponent('renderable');
            if (renderable) {
                renderable.shape = 'line';
                renderable.size = 30; // Length of the beam visual
            }
        }
    }

    /**
     * Fire flamethrower - cone of fire projectiles
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireFlamethrower(player, weapon) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        const levelData = weapon.data.levels[weapon.level - 1];
        
        const target = this.findNearestEnemy(pos.x, pos.y);
        if (!target) return;

        const targetPos = target.getComponent('position');
        const baseAngle = MathUtils.angle(pos.x, pos.y, targetPos.x, targetPos.y);
        
        const projectileCount = levelData.projectileCount || 5;
        const spreadAngle = (levelData.area || 30) * (Math.PI / 180);

        for (let i = 0; i < projectileCount; i++) {
            const offset = (i - (projectileCount - 1) / 2) * (spreadAngle / projectileCount);
            const angle = baseAngle + offset;
            
            // Shorter range due to malus
            const range = 2.0 * playerComp.stats.range * (weapon.data.malus?.rangeMultiplier || 1);
            
            const piercing = Math.max(levelData.piercing || 0, playerComp.stats.piercing || 0);
            this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                range,
                player.id,
                weapon.type,
                piercing,
                weapon.data.color,
                (weapon && weapon.data && weapon.data.damageType) ? weapon.data.damageType : 'kinetic'
            );
        }
    }

    /**
     * Create a projectile entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Direction angle
     * @param {number} damage - Damage value
     * @param {number} speed - Projectile speed
     * @param {number} lifetime - Lifetime in seconds
     * @param {number} owner - Owner entity ID
     * @param {string} weaponType - Weapon type
     * @param {number} piercing - Piercing count
     * @param {string} color - Projectile color
     * @returns {Entity} Created projectile
     */
    createProjectile(x, y, angle, damage, speed, lifetime, owner, weaponType, piercing, color, damageType = 'kinetic') {
        const projectile = this.world.createEntity('projectile');
        
        // Get player stats for size modifier
        const ownerEntity = this.world.getEntity(owner);
        const ownerComp = ownerEntity ? ownerEntity.getComponent('player') : null;
        const sizeMultiplier = ownerComp && ownerComp.stats.projectileSizeMultiplier ? ownerComp.stats.projectileSizeMultiplier : 1;
        const sizeAdd = ownerComp && ownerComp.stats.projectileSizeAdd ? ownerComp.stats.projectileSizeAdd : 0;
        
        // Calculate final projectile size
        const baseSize = 5;
        const finalSize = baseSize * sizeMultiplier + sizeAdd;
        
        projectile.addComponent('position', Components.Position(x, y));
        projectile.addComponent('velocity', Components.Velocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        ));
        projectile.addComponent('collision', Components.Collision(finalSize));
        projectile.addComponent('renderable', Components.Renderable(color, finalSize, 'circle'));
        projectile.addComponent('projectile', Components.Projectile(
            damage,
            speed,
            lifetime,
            owner,
            weaponType
        ));
        
        const projComp = projectile.getComponent('projectile');
        projComp.piercing = piercing;
        projComp.damageType = damageType || 'kinetic';
        
        return projectile;
    }

    /**
     * Find nearest enemy to position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxRange - Maximum search range (optional)
     * @returns {Entity|null} Nearest enemy or null
     */
    findNearestEnemy(x, y, maxRange = Infinity) {
        const enemies = this.world.getEntitiesByType('enemy');
        let nearest = null;
        let nearestDist = maxRange;

        for (const enemy of enemies) {
            const pos = enemy.getComponent('position');
            if (!pos) continue;

            const dist = MathUtils.distance(x, y, pos.x, pos.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Find N nearest enemies to position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of enemies to find
     * @returns {Array<Entity>} Array of nearest enemies
     */
    findNearestEnemies(x, y, count) {
        const enemies = this.world.getEntitiesByType('enemy');
        
        const sorted = enemies
            .map(enemy => {
                const pos = enemy.getComponent('position');
                if (!pos) return null;
                return {
                    enemy,
                    dist: MathUtils.distance(x, y, pos.x, pos.y)
                };
            })
            .filter(e => e !== null)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, count)
            .map(e => e.enemy);

        return sorted;
    }
    
    /**
     * Update spinning blade halo (Lame Tournoyante)
     * 
     * RESPONSIBILITY: CombatSystem detects hits and delegates damage to DefenseSystem
     * - Detects enemies in range
     * - Calculates damage amount
     * - Calls DefenseSystem.applyDamage() to apply damage
     * 
     * @param {Entity} player - Player entity
     * @param {Object} playerComp - Player component
     * @param {number} deltaTime - Time elapsed
     */
    updateBladeHalo(player, playerComp, deltaTime) {
        // Check if player has blade halo passive (orbitDamage from stats)
        const orbitDamage = playerComp.stats.orbitDamage || 0;
        const orbitRadius = playerComp.stats.orbitRadius || 60;
        
        if (orbitDamage <= 0) {
            // No blade halo active
            if (playerComp.bladeHalo) {
                delete playerComp.bladeHalo;
            }
            return;
        }
        
        // Initialize blade halo state if needed
        if (!playerComp.bladeHalo) {
            playerComp.bladeHalo = {
                angle: 0,
                lastTickTime: 0,
                tickRate: 0.25 // 4 ticks per second
            };
        }
        
        const halo = playerComp.bladeHalo;
        
        // Update rotation
        halo.angle += deltaTime * 3.0; // Rotation speed
        if (halo.angle > Math.PI * 2) {
            halo.angle -= Math.PI * 2;
        }
        
        // Update damage tick
        halo.lastTickTime += deltaTime;
        if (halo.lastTickTime >= halo.tickRate) {
            halo.lastTickTime = 0;
            
            // Detect hits and delegate damage to DefenseSystem
            const playerPos = player.getComponent('position');
            if (!playerPos) return;
            
            const enemies = this.world.getEntitiesByType('enemy');
            const damagePerTick = orbitDamage * halo.tickRate * playerComp.stats.damageMultiplier;
            
            for (const enemy of enemies) {
                const enemyPos = enemy.getComponent('position');
                if (!enemyPos) continue;
                
                const dist = MathUtils.distance(playerPos.x, playerPos.y, enemyPos.x, enemyPos.y);
                if (dist <= orbitRadius) {
                    // CombatSystem detected hit - delegate damage to DefenseSystem
                    // Blade halo uses kinetic damage type (spinning blades = physical)
                    if (this.world.defenseSystem) {
                        // Use DamagePacket for proper damage application
                        const damagePacket = DamagePacket.simple(damagePerTick, 'kinetic');
                        const result = this.world.defenseSystem.applyDamage(enemy, damagePacket);
                        // DefenseSystem handles entity destruction via entityDestroyed event
                    }
                }
            }
        }
    }
    
    /**
     * Fire weapon with new heat system integration
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon data
     */
    fireWeaponWithHeat(player, weapon) {
        // Ensure UI can read the currently firing weapon
        const playerComp = player.getComponent('player');
        if (playerComp) {
            // Handle both weapon formats: objects with .data property or direct weapon objects
            playerComp.currentWeapon = (weapon && weapon.data) ? weapon.data : weapon;
        }

        // Check heat first
        const heat = player.getComponent('heat');
        if (heat && heat.overheated) {
            logger.debug('Combat', `Weapon ${weapon.type} cannot fire - OVERHEATED (${heat.current.toFixed(0)}/${heat.max})`);
            return; // Cannot fire when overheated
        }
        
        // Log weapon fire
        const weaponData = weapon.data || weapon;
        logger.debug('Combat', `Firing ${weapon.type} Lv${weapon.level}`, {
            damageType: weaponData.damageType || 'kinetic',
            baseDamage: weaponData.baseDamage,
            heat: weaponData.heat || 0
        });
        
        // Fire the weapon normally
        this.fireWeapon(player, weapon);
        
        // Add heat if system is active
        if (heat && weapon.data && weapon.data.heat) {
            let heatAmount = weapon.data.heat;
            
            // Apply heat generation multiplier from modules
            const playerComp = player.getComponent('player');
            if (playerComp && playerComp.stats && playerComp.stats.moduleEffects) {
                const heatMult = playerComp.stats.moduleEffects.heatGenerationMult || 1.0;
                heatAmount *= heatMult;
            }
            
            // Use HeatSystem.addHeat() instead of direct manipulation
            if (this.world && this.world.heatSystem) {
                this.world.heatSystem.addHeat(player, heatAmount);
            } else {
                // Fallback if HeatSystem not available
                heat.current += heatAmount;
                if (heat.current >= heat.max) {
                    heat.overheated = true;
                    heat.overheatTimer = typeof HEAT_SYSTEM !== 'undefined'
                        ? HEAT_SYSTEM.OVERHEAT_DISABLE_DURATION
                        : 2.0;
                }
            }
        }
    }
    
    /**
     * Calculate damage with defense system
     * 
     * RESPONSIBILITY: CombatSystem calculates final damage and delegates to DefenseSystem
     * - Applies attacker's damage multipliers (stats, modules, synergies, crits)
     * - Creates final damage value
     * - Delegates actual damage application to DefenseSystem.applyDamage()
     * - Does NOT modify health/defense directly
     * 
     * @param {Entity} attacker - Attacking entity
     * @param {Entity} target - Target entity
     * @param {number} baseDamage - Base damage
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @returns {Object} Damage result from DefenseSystem
     */
    calculateDamageWithDefense(attacker, target, baseDamage, damageType = 'kinetic') {
        // Apply attacker's damage multipliers
        const attackerPlayer = attacker.getComponent('player');
        let damage = baseDamage;
        
        if (attackerPlayer && attackerPlayer.stats) {
            damage *= attackerPlayer.stats.damageMultiplier || 1;
            
            // Apply damage type multiplier from modules
            if (attackerPlayer.stats.moduleEffects) {
                const typeMult = getModuleDamageMultiplier 
                    ? getModuleDamageMultiplier(attackerPlayer.stats.moduleEffects, damageType)
                    : 1.0;
                damage *= typeMult;
            }
            
            // Apply tag synergies if available
            if (this.world.synergySystem) {
                const weapon = { damageType, tags: [damageType] };
                const tagMultiplier = this.world.synergySystem.getWeaponTagMultiplier(weapon);
                damage *= tagMultiplier;
            }
            
            // Apply crit if available
            if (typeof rollCrit !== 'undefined' && typeof CRIT_CAPS !== 'undefined') {
                const critChance = Math.min(attackerPlayer.stats.critChance || 0, CRIT_CAPS.MAX_CRIT_CHANCE);
                const critDamage = Math.min(attackerPlayer.stats.critDamage || 1.5, CRIT_CAPS.MAX_CRIT_DAMAGE);
                
                if (rollCrit(critChance)) {
                    damage *= critDamage;
                }
            }
        }
        
        // Delegate all damage application to DefenseSystem (the only authority)
        // Use DamagePacket for proper damage structure
        if (this.world.defenseSystem) {
            const damagePacket = DamagePacket.simple(damage, damageType);
            return this.world.defenseSystem.applyDamage(target, damagePacket);
        }
        
        // No DefenseSystem available - log error and return empty result
        logger.error('Combat', 'DefenseSystem not available - cannot apply damage');
        return {
            incoming: damage,
            dealt: 0,
            layers: {},
            layer: '',
            destroyed: false,
            totalDamage: 0,
            layersDamaged: [],
            damageType
        };
    }
    
    /**
     * Get damage type for a weapon
     * @param {Object} weaponData - Weapon data
     * @returns {string} Damage type
     */
    getWeaponDamageType(weaponData) {
        if (!weaponData) return 'kinetic';
        
        // Check if weapon has explicit damage type (new system)
        if (weaponData.damageType) {
            return weaponData.damageType;
        }
        
        // Infer from weapon ID or tags (legacy compatibility)
        if (weaponData.id) {
            const id = weaponData.id.toLowerCase();
            if (id.includes('ion') || id.includes('emp') || id.includes('arc') || id.includes('disruptor')) {
                return 'em';
            }
            if (id.includes('plasma') || id.includes('thermal') || id.includes('flame') || id.includes('solar')) {
                return 'thermal';
            }
            if (id.includes('missile') || id.includes('bomb') || id.includes('explosive') || id.includes('cluster')) {
                return 'explosive';
            }
        }
        
        // Default to kinetic
        return 'kinetic';
    }
}
