/**
 * @file CombatSystem.js
 * @description Handles weapon firing, combat mechanics, and projectile creation
 */

class CombatSystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
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
        }
    }

    /**
     * Update weapon cooldown and fire if ready
     * @param {Entity} player - Player entity
     * @param {Object} weaponData - Weapon component data
     * @param {number} deltaTime - Time elapsed
     */
    updateWeapon(player, weaponData, deltaTime) {
        const weapon = weaponData.component;
        if (!weapon) return;

        // Update cooldown
        weapon.cooldown -= deltaTime;

        // Fire when cooldown is ready
        if (weapon.cooldown <= 0) {
            const fireRate = weapon.data.fireRate * player.getComponent('player').stats.fireRate;
            weapon.cooldown = fireRate > 0 ? 1 / fireRate : 999;
            
            this.fireWeapon(player, weapon);
        }
    }

    /**
     * Fire weapon based on its type
     * @param {Entity} player - Player entity
     * @param {Object} weapon - Weapon component
     */
    fireWeapon(player, weapon) {
        const type = weapon.data.type;
        
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
            
            this.createProjectile(
                pos.x, pos.y,
                finalAngle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                3.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                levelData.piercing || 0,
                weapon.data.color
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
            
            this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                2.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                0,
                weapon.data.color
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
            
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                5.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                0,
                weapon.data.color
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
        this.createProjectile(
            pos.x, pos.y,
            angle,
            weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
            5000,
            0.05,
            player.id,
            weapon.type,
            levelData.piercing || 0,
            weapon.data.color
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
            
            const mine = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
                speed,
                levelData.duration || 10,
                player.id,
                weapon.type,
                0,
                weapon.data.color
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
        
        const projectile = this.createProjectile(
            pos.x, pos.y,
            angle,
            weapon.data.baseDamage * levelData.damage * playerComp.stats.damage,
            weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
            1.0 * playerComp.stats.range,
            player.id,
            weapon.type,
            0,
            weapon.data.color
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
            weapon.data.color
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
            
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                8.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                0,
                weapon.data.color
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
            
            const projectile = this.createProjectile(
                pos.x, pos.y,
                angle,
                weapon.data.baseDamage * stats.damage * playerComp.stats.damage,
                weapon.data.projectileSpeed * playerComp.stats.projectileSpeed,
                2.0 * playerComp.stats.range,
                player.id,
                weapon.type,
                0,
                weapon.data.color
            );
            
            const projComp = projectile.getComponent('projectile');
            projComp.chain = true;
            projComp.chainCount = stats.chainCount;
            projComp.chainRange = stats.area;
            projComp.chained = [target.id];
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
    createProjectile(x, y, angle, damage, speed, lifetime, owner, weaponType, piercing, color) {
        const projectile = this.world.createEntity('projectile');
        
        projectile.addComponent('position', Components.Position(x, y));
        projectile.addComponent('velocity', Components.Velocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        ));
        projectile.addComponent('collision', Components.Collision(5));
        projectile.addComponent('renderable', Components.Renderable(color, 5, 'circle'));
        projectile.addComponent('projectile', Components.Projectile(
            damage,
            speed,
            lifetime,
            owner,
            weaponType
        ));
        
        const projComp = projectile.getComponent('projectile');
        projComp.piercing = piercing;
        
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
}
