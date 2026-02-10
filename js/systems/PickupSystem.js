/**
 * @file PickupSystem.js
 * @description Handle pickup behavior, magnet attraction, and collection
 */

class PickupSystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
        this.bobTime = 0;
    }

    /**
     * Update all pickups
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        this.bobTime += deltaTime;
        
        const pickups = this.world.getEntitiesByType('pickup');
        const player = this.world.getEntitiesByType('player')[0];
        
        if (!player) return;

        for (const pickup of pickups) {
            this.updatePickup(pickup, player, deltaTime);
        }
    }

    /**
     * Update individual pickup
     * @param {Entity} pickup - Pickup entity
     * @param {Entity} player - Player entity
     * @param {number} deltaTime - Time elapsed
     */
    updatePickup(pickup, player, deltaTime) {
        const pickupComp = pickup.getComponent('pickup');
        const pickupPos = pickup.getComponent('position');
        const playerPos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        
        if (!pickupComp || !pickupPos || !playerPos || !playerComp) return;

        // Update lifetime
        if (pickupComp.lifetime !== undefined) {
            pickupComp.lifetime -= deltaTime;
            
            // Remove expired pickups
            if (pickupComp.lifetime <= 0) {
                this.world.removeEntity(pickup.id);
                return;
            }
            
            // Flash when about to expire
            const renderable = pickup.getComponent('renderable');
            if (renderable && pickupComp.lifetime < 3) {
                const flash = Math.sin(pickupComp.lifetime * 10) > 0;
                renderable.alpha = flash ? 1.0 : 0.3;
            }
        }

        // Calculate distance to player
        const dx = playerPos.x - pickupPos.x;
        const dy = playerPos.y - pickupPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Magnet attraction - use player's magnetRange stat plus bonus from luck
        const baseMagnetRange = pickupComp.magnetRange || 100; // Default base range
        const playerMagnetBonus = playerComp.stats.magnetRange || 0; // Bonus from passives
        const magnetRange = (baseMagnetRange + playerMagnetBonus) * (1 + playerComp.stats.luck * 0.5);
        
        if (distance < magnetRange && !pickupComp.collected) {
            // Pull towards player
            const pullStrength = 300 + (200 * playerComp.stats.luck);
            const normalized = MathUtils.normalize(dx, dy);
            
            pickupPos.x += normalized.x * pullStrength * deltaTime;
            pickupPos.y += normalized.y * pullStrength * deltaTime;
            
            // Mark as being collected to prevent multiple collections
            if (distance < 20) {
                pickupComp.collected = true;
                this.collectPickup(pickup, player);
            }
        }

        // Visual bobbing effect
        this.applyBobEffect(pickup, deltaTime);
    }

    /**
     * Apply visual bobbing effect to pickup
     * @param {Entity} pickup - Pickup entity
     * @param {number} deltaTime - Time elapsed
     */
    applyBobEffect(pickup, deltaTime) {
        const renderable = pickup.getComponent('renderable');
        if (!renderable) return;

        // Oscillate size slightly for visual effect
        const baseSize = renderable.baseSize || renderable.size;
        if (!renderable.baseSize) {
            renderable.baseSize = baseSize;
        }
        
        const bobAmount = Math.sin(this.bobTime * 3 + pickup.id) * 2;
        renderable.size = baseSize + bobAmount;
        
        // Glow effect
        renderable.glow = true;
        renderable.glowIntensity = 0.5 + Math.sin(this.bobTime * 2 + pickup.id) * 0.3;
    }

    /**
     * Collect pickup and apply effects to player
     * @param {Entity} pickup - Pickup entity
     * @param {Entity} player - Player entity
     */
    collectPickup(pickup, player) {
        const pickupComp = pickup.getComponent('pickup');
        const playerComp = player.getComponent('player');
        const playerHealth = player.getComponent('health');
        const pickupPos = pickup.getComponent('position');
        
        if (!pickupComp || !playerComp) return;

        switch (pickupComp.type) {
            case 'xp':
                this.collectXP(player, pickupComp.value);
                break;
            case 'health':
                this.collectHealth(playerHealth, pickupComp.value);
                break;
            case 'noyaux':
                this.collectNoyaux(pickupComp.value);
                break;
        }

        // Create collection particle effect
        this.createCollectionEffect(pickupPos.x, pickupPos.y, pickupComp.type);

        // Remove pickup
        this.world.removeEntity(pickup.id);
    }

    /**
     * Collect XP and check for level up
     * @param {Entity} player - Player entity
     * @param {number} xpValue - XP amount
     */
    collectXP(player, xpValue) {
        const playerComp = player.getComponent('player');
        
        // Apply XP bonus
        const finalXP = xpValue * playerComp.stats.xpBonus;
        playerComp.xp += finalXP;

        // Check for level up
        while (playerComp.xp >= playerComp.xpRequired) {
            playerComp.xp -= playerComp.xpRequired;
            playerComp.level++;
            playerComp.xpRequired = Math.floor(playerComp.xpRequired * 1.2);
            
            // Update stats
            this.gameState.stats.highestLevel = Math.max(
                this.gameState.stats.highestLevel,
                playerComp.level
            );
            
            // Trigger level up
            this.onLevelUp(player);
        }
    }

    /**
     * Collect health pickup
     * @param {Object} health - Health component
     * @param {number} healAmount - Amount to heal
     */
    collectHealth(health, healAmount) {
        if (!health) return;
        
        health.current = Math.min(health.current + healAmount, health.max);
    }

    /**
     * Collect Noyaux (meta currency)
     * @param {number} amount - Noyaux amount
     */
    collectNoyaux(amount) {
        this.gameState.stats.noyauxEarned += amount;
    }

    /**
     * Handle level up
     * @param {Entity} player - Player entity
     */
    onLevelUp(player) {
        const playerPos = player.getComponent('position');
        
        // Create level up particle effect
        this.createLevelUpEffect(playerPos.x, playerPos.y);
        
        // Heal player slightly on level up
        const health = player.getComponent('health');
        if (health) {
            health.current = Math.min(health.current + health.max * 0.2, health.max);
        }
        
        // Pause game and show level up choices
        // This would be handled by the main game loop
        console.log('Level Up! Now level', player.getComponent('player').level);
    }

    /**
     * Create collection particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Pickup type
     */
    createCollectionEffect(x, y, type) {
        const colors = {
            xp: '#00FFFF',
            health: '#00FF00',
            noyaux: '#FFD700'
        };
        
        const color = colors[type] || '#FFFFFF';
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('velocity', Components.Velocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
            particle.addComponent('renderable', Components.Renderable(color, 3, 'circle'));
            particle.addComponent('particle', Components.Particle(
                0.5,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.95
            ));
        }
    }

    /**
     * Create level up particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createLevelUpEffect(x, y) {
        const particleCount = 30;
        const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00'];

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 150 + Math.random() * 150;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('velocity', Components.Velocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
            particle.addComponent('renderable', Components.Renderable(color, 5, 'circle'));
            particle.addComponent('particle', Components.Particle(
                1.5,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.92
            ));
        }
    }

    /**
     * Create pickup entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Pickup type ('xp', 'health', 'noyaux')
     * @param {number} value - Pickup value
     * @returns {Entity} Created pickup
     */
    createPickup(x, y, type, value) {
        const pickup = this.world.createEntity('pickup');
        
        const colors = {
            xp: '#00FFFF',
            health: '#00FF00',
            noyaux: '#FFD700'
        };
        
        const sizes = {
            xp: 6,
            health: 8,
            noyaux: 10
        };
        
        pickup.addComponent('position', Components.Position(x, y));
        pickup.addComponent('collision', Components.Collision(sizes[type] || 6));
        pickup.addComponent('renderable', Components.Renderable(
            colors[type] || '#FFFFFF',
            sizes[type] || 6,
            'circle'
        ));
        pickup.addComponent('pickup', Components.Pickup(type, value));
        
        // Set lifetime based on type
        const pickupComp = pickup.getComponent('pickup');
        if (type === 'xp') {
            pickupComp.lifetime = 30; // 30 seconds
        } else {
            pickupComp.lifetime = 20; // 20 seconds
        }
        
        return pickup;
    }
}
