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
        const playerDefense = player.getComponent('defense');
        const pickupPos = pickup.getComponent('position');
        
        if (!pickupComp || !playerComp) return;

        switch (pickupComp.type) {
            case 'xp':
                this.collectXP(player, pickupComp.value);
                break;
            case 'health':
                // Convert health pickups to structure healing for player
                this.collectStructure(player, playerDefense, pickupComp.value);
                break;
            case 'noyaux':
                this.collectNoyaux(pickupComp.value);
                break;
            case 'module':
                this.collectModule(player, pickupComp.moduleId);
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
        
        // Apply XP bonus with guard against undefined
        const xpBonus = playerComp.stats?.xpBonus ?? 1;
        const finalXP = xpValue * xpBonus;
        playerComp.xp += finalXP;
        
        // Guard against NaN
        if (!Number.isFinite(playerComp.xp)) {
            console.error('[PickupSystem] XP became NaN, resetting to 0');
            playerComp.xp = 0;
        }
        if (!Number.isFinite(playerComp.xpRequired)) {
            console.error('[PickupSystem] xpRequired became NaN, resetting to 100');
            playerComp.xpRequired = 100;
        }

        // P0 FIX: Debug log XP collection
        logger.debug('XP', `Collected ${xpValue} XP (x${playerComp.stats.xpBonus.toFixed(2)} = ${finalXP.toFixed(1)}) → ${playerComp.xp.toFixed(0)}/${playerComp.xpRequired}`);

        // Check for level up
        while (playerComp.xp >= playerComp.xpRequired) {
            playerComp.xp -= playerComp.xpRequired;
            playerComp.level++;
            const oldRequired = playerComp.xpRequired;
            playerComp.xpRequired = Math.floor(playerComp.xpRequired * 1.2);
            
            // P0 FIX: Debug log level up
            logger.info('XP', `LEVEL UP! ${playerComp.level - 1} → ${playerComp.level} (XP required: ${oldRequired} → ${playerComp.xpRequired})`);
            
            // Update stats
            this.gameState.stats.highestLevel = Math.max(
                this.gameState.stats.highestLevel,
                playerComp.level
            );
            
            console.log(`⭐ [PickupSystem] LEVEL UP! Level ${playerComp.level} reached`);
            
            // Trigger level up
            this.onLevelUp(player);
        }
    }

    /**
     * Collect structure healing (replaces old health pickup for player)
     * @param {Entity} player - Player entity
     * @param {Object} defense - Defense component
     * @param {number} healAmount - Amount to heal
     */
    collectStructure(player, defense, healAmount) {
        if (!defense) return;
        
        // Heal structure layer using DefenseSystem
        if (this.world.defenseSystem) {
            this.world.defenseSystem.healLayer(player, 'structure', healAmount);
        } else {
            // Fallback if defenseSystem not available
            defense.structure.current = Math.min(
                defense.structure.current + healAmount,
                defense.structure.max
            );
        }
    }

    /**
     * Collect Noyaux (meta currency)
     * @param {number} amount - Noyaux amount
     */
    collectNoyaux(amount) {
        this.gameState.stats.noyauxEarned += amount;
    }

    /**
     * Collect Module from loot
     * @param {Entity} player - Player entity
     * @param {string} moduleId - Module identifier (e.g., 'SHIELD_BOOSTER')
     */
    collectModule(player, moduleId) {
        const playerComp = player.getComponent('player');
        if (!playerComp) return;

        // Check if ModuleData is available
        if (typeof window.ModuleData === 'undefined' || !window.ModuleData.MODULES) {
            console.error('[Loot] ModuleData not available');
            return;
        }

        const moduleData = window.ModuleData.MODULES[moduleId];
        if (!moduleData) {
            console.error('[Loot] Invalid module ID:', moduleId);
            return;
        }

        // Check max slots (6 modules max)
        const MAX_MODULE_SLOTS = 6;
        if (!playerComp.modules) {
            playerComp.modules = [];
        }

        if (playerComp.modules.length >= MAX_MODULE_SLOTS) {
            console.log('[Loot] Module slots full! Cannot pick up:', moduleData.name);
            return;
        }

        // Apply module using ModuleSystem
        if (typeof applyModule !== 'undefined') {
            const success = applyModule(player, moduleId);
            if (success) {
                console.log(`[Loot] module acquired: ${moduleData.name} (${moduleId})`);
            }
        } else {
            console.error('[Loot] ModuleSystem applyModule function not available');
        }
    }

    /**
     * Handle level up
     * @param {Entity} player - Player entity
     */
    onLevelUp(player) {
        const playerPos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        
        console.log(`⭐ [PickupSystem] LEVEL UP! Player reached level ${playerComp.level}`);
        console.log(`[PickupSystem] XP Progress: ${playerComp.xp.toFixed(1)}/${playerComp.xpRequired} (Next level at ${playerComp.xpRequired})`);
        
        // Create level up particle effect
        this.createLevelUpEffect(playerPos.x, playerPos.y);
        
        // Heal player defense layers on level up (20% of each layer)
        const defense = player.getComponent('defense');
        if (defense && this.world.defenseSystem) {
            // Use DefenseSystem to heal layers (the only authority for defense modifications)
            const healAmount = {
                shield: defense.shield.max * 0.2,
                armor: defense.armor.max * 0.2,
                structure: defense.structure.max * 0.2
            };
            this.world.defenseSystem.healLayer(player, 'shield', healAmount.shield);
            this.world.defenseSystem.healLayer(player, 'armor', healAmount.armor);
            this.world.defenseSystem.healLayer(player, 'structure', healAmount.structure);
            logger.debug('PickupSystem', 'Healed 20% of all defense layers on level up');
        }
        
        // Emit LEVEL_UP event to pause game and show UI
        if (this.world.events) {
            console.log('[PickupSystem] Emitting LEVEL_UP event...');
            this.world.events.emit('LEVEL_UP', { player, level: playerComp.level });
        } else {
            console.error('[PickupSystem] ERROR: No event bus available!');
        }
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
            noyaux: '#FFD700',
            module: '#9b59b6'  // Purple for modules
        };
        
        const color = colors[type] || '#FFFFFF';
        const particleCount = type === 'module' ? 16 : 8; // More particles for modules

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

    /**
     * Create module pickup entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} moduleId - Module identifier (e.g., 'SHIELD_BOOSTER')
     * @returns {Entity} Created module pickup
     */
    createModulePickup(x, y, moduleId) {
        const pickup = this.world.createEntity('pickup');
        
        // Module pickups are distinctive - purple/magenta with diamond/square shape
        pickup.addComponent('position', Components.Position(x, y));
        pickup.addComponent('collision', Components.Collision(12)); // Larger collision
        pickup.addComponent('renderable', Components.Renderable(
            '#9b59b6', // Purple color for modules
            12,
            'square'   // Square shape to distinguish from other pickups
        ));
        
        // Create pickup component with module type
        const pickupComp = Components.Pickup('module', 0);
        pickupComp.moduleId = moduleId; // Store module ID
        pickupComp.magnetRange = 200; // Larger magnet range for modules
        pickupComp.lifetime = 40; // Longer lifetime (40 seconds)
        pickup.addComponent('pickup', pickupComp);
        
        return pickup;
    }
}
