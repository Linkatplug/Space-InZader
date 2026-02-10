/**
 * @file WeatherSystem.js
 * @description Space weather events system - meteors, black holes, and other hazards
 */

class WeatherSystem {
    constructor(world, canvas, audioManager, gameState) {
        this.world = world;
        this.canvas = canvas;
        this.audioManager = audioManager;
        this.gameState = gameState;
        
        // Event configuration
        this.events = [
            { type: 'meteor_storm', weight: 0.5, duration: 15 }, // Changed: 15s average (12-18s random)
            { type: 'black_hole', weight: 0.3, duration: 12 },
            { type: 'magnetic_storm', weight: 0.2, duration: 5 } // New: Magnetic storm disables weapons
        ];
        
        // Event state
        this.activeEvent = null;
        this.eventTimer = 0;
        this.nextEventIn = this.getRandomEventDelay();
        this.warningTimer = 0;
        this.showingWarning = false;
        
        // Meteor storm configuration
        this.meteorSpawnTimer = 0;
        this.meteorSpawnInterval = 0.3; // Spawn meteor every 0.3s during storm
        
        // Black hole configuration
        this.blackHoleEntity = null;
        this.blackHolePullRadius = 400;
        this.blackHoleDamageRadius = 80;
        
        // Performance limits
        this.maxMeteors = 20;
    }
    
    /**
     * Update weather system
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        // Check for new events
        if (!this.activeEvent) {
            this.nextEventIn -= deltaTime;
            
            if (this.nextEventIn <= 0) {
                this.startRandomEvent();
            }
            return;
        }
        
        // Handle warning phase
        if (this.showingWarning) {
            this.warningTimer -= deltaTime;
            if (this.warningTimer <= 0) {
                this.showingWarning = false;
                this.activateEvent();
            }
            return;
        }
        
        // Update active event
        this.eventTimer -= deltaTime;
        
        if (this.eventTimer <= 0) {
            this.endEvent();
        } else {
            this.updateEvent(deltaTime);
        }
    }
    
    /**
     * Start a random weather event
     */
    startRandomEvent() {
        // Select random event based on weights
        const totalWeight = this.events.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedEvent = this.events[0];
        for (const event of this.events) {
            random -= event.weight;
            if (random <= 0) {
                selectedEvent = event;
                break;
            }
        }
        
        this.activeEvent = selectedEvent;
        this.showingWarning = true;
        // Longer warning for black holes (4s) to give players time to react
        this.warningTimer = selectedEvent.type === 'black_hole' ? 4.0 : 2.0;
        
        // Play warning sound
        this.audioManager.playSFX('warning');
        
        logger.info('WeatherSystem', `Starting event: ${selectedEvent.type}`);
    }
    
    /**
     * Activate the event after warning
     */
    activateEvent() {
        // Random duration variation for meteor storm (12-18s)
        if (this.activeEvent.type === 'meteor_storm') {
            this.eventTimer = 12 + Math.random() * 6; // 12-18 seconds
        } else {
            this.eventTimer = this.activeEvent.duration;
        }
        
        if (this.activeEvent.type === 'black_hole') {
            this.spawnBlackHole();
        } else if (this.activeEvent.type === 'magnetic_storm') {
            this.startMagneticStorm();
        }
        
        // Play event start sound
        if (this.activeEvent.type === 'meteor_storm') {
            this.audioManager.playSFX('meteor_warning');
        } else if (this.activeEvent.type === 'black_hole') {
            this.audioManager.playSFX('black_hole_spawn');
        } else if (this.activeEvent.type === 'magnetic_storm') {
            this.audioManager.playSFX('electric');
        }
    }
    
    /**
     * Update the current active event
     * @param {number} deltaTime - Time elapsed
     */
    updateEvent(deltaTime) {
        if (this.activeEvent.type === 'meteor_storm') {
            this.updateMeteorStorm(deltaTime);
        } else if (this.activeEvent.type === 'black_hole') {
            this.updateBlackHole(deltaTime);
        } else if (this.activeEvent.type === 'magnetic_storm') {
            this.updateMagneticStorm(deltaTime);
        }
    }
    
    /**
     * Update meteor storm event
     * @param {number} deltaTime - Time elapsed
     */
    updateMeteorStorm(deltaTime) {
        this.meteorSpawnTimer += deltaTime;
        
        if (this.meteorSpawnTimer >= this.meteorSpawnInterval) {
            this.meteorSpawnTimer = 0;
            
            // Check meteor count
            const meteorCount = this.world.getEntitiesByType('meteor').length;
            if (meteorCount < this.maxMeteors) {
                this.spawnMeteor();
            }
        }
    }
    
    /**
     * Spawn a single meteor
     */
    spawnMeteor() {
        const meteor = this.world.createEntity('meteor');
        
        // Random position at top of screen
        const x = Math.random() * this.canvas.width;
        const y = -50;
        
        // Random velocity (downward with slight horizontal variation)
        const vx = (Math.random() - 0.5) * 100;
        const vy = 200 + Math.random() * 150; // 200-350 downward speed
        
        // Random size
        const size = 20 + Math.random() * 25; // 20-45 radius
        
        // Random rotation speed
        const rotationSpeed = (Math.random() - 0.5) * 3;
        
        meteor.addComponent('position', createPosition(x, y));
        meteor.addComponent('velocity', createVelocity(vx, vy));
        meteor.addComponent('collision', createCollision(size));
        meteor.addComponent('renderable', createRenderable('meteor'));
        meteor.addComponent('meteor', {
            damage: 30 + Math.floor(Math.random() * 20), // 30-50 damage
            size: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: rotationSpeed
        });
    }
    
    /**
     * Update black hole event
     * @param {number} deltaTime - Time elapsed
     */
    updateBlackHole(deltaTime) {
        if (!this.blackHoleEntity || !this.blackHoleEntity.active) {
            return;
        }
        
        const blackHolePos = this.blackHoleEntity.getComponent('position');
        const blackHoleComp = this.blackHoleEntity.getComponent('black_hole');
        
        // Update rotation for visual effect
        blackHoleComp.rotation += deltaTime * 2;
        
        // Apply gravitational pull to player
        const player = this.world.getEntitiesByType('player')[0];
        if (player) {
            const playerPos = player.getComponent('position');
            const playerVel = player.getComponent('velocity');
            
            if (playerPos && playerVel) {
                const dx = blackHolePos.x - playerPos.x;
                const dy = blackHolePos.y - playerPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.blackHolePullRadius && distance > 0) {
                    // Calculate pull force (stronger when closer)
                    // Gentler initial pull - ramp up over 2 seconds
                    const eventAge = blackHoleComp.age || 0;
                    const pullMultiplier = Math.min(eventAge / 2.0, 1.0); // 0 to 1 over 2 seconds
                    const basePullStrength = (1 - distance / this.blackHolePullRadius) * 300;
                    const pullStrength = basePullStrength * (0.3 + 0.7 * pullMultiplier); // 30% min, 100% max
                    const pullX = (dx / distance) * pullStrength * deltaTime;
                    const pullY = (dy / distance) * pullStrength * deltaTime;
                    
                    // Apply pull to player velocity
                    playerVel.vx += pullX;
                    playerVel.vy += pullY;
                    
                    // Track age for pull ramping
                    blackHoleComp.age = eventAge + deltaTime;
                    
                    // Damage if too close (handled by collision system)
                    if (distance < this.blackHoleDamageRadius) {
                        const health = player.getComponent('health');
                        if (health && !blackHoleComp.lastDamageTime) {
                            blackHoleComp.lastDamageTime = 0;
                        }
                        
                        blackHoleComp.lastDamageTime += deltaTime;
                        if (blackHoleComp.lastDamageTime >= 0.5) {
                            // Damage every 0.5 seconds
                            blackHoleComp.lastDamageTime = 0;
                            // Damage will be handled by collision system
                        }
                    }
                }
            }
        }
        
        // Apply gravitational pull to enemies
        const enemies = this.world.getEntitiesByType('enemy');
        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent('position');
            const enemyVel = enemy.getComponent('velocity');
            
            if (!enemyPos || !enemyVel) continue;
            
            const dx = blackHolePos.x - enemyPos.x;
            const dy = blackHolePos.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.blackHolePullRadius && distance > 0) {
                // Calculate pull force (same as player but slightly weaker)
                const eventAge = blackHoleComp.age || 0;
                const pullMultiplier = Math.min(eventAge / 2.0, 1.0);
                const basePullStrength = (1 - distance / this.blackHolePullRadius) * 250; // Slightly weaker than player
                const pullStrength = basePullStrength * (0.3 + 0.7 * pullMultiplier);
                const pullX = (dx / distance) * pullStrength * deltaTime;
                const pullY = (dy / distance) * pullStrength * deltaTime;
                
                // Apply pull to enemy velocity
                enemyVel.vx += pullX;
                enemyVel.vy += pullY;
            }
        }
        
        // Pull and destroy XP pickups
        const pickups = this.world.getEntitiesByType('pickup');
        const destroyRadius = this.blackHoleDamageRadius * 1.5; // 120 pixels destroy radius
        
        for (const pickup of pickups) {
            const pickupComp = pickup.getComponent('pickup');
            if (!pickupComp || pickupComp.type !== 'xp') continue;
            
            const pickupPos = pickup.getComponent('position');
            const pickupVel = pickup.getComponent('velocity');
            
            if (!pickupPos || !pickupVel) continue;
            
            const dx = blackHolePos.x - pickupPos.x;
            const dy = blackHolePos.y - pickupPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Pull XP orbs (faster than player)
            if (distance < this.blackHolePullRadius && distance > 0) {
                const pullStrength = (1 - distance / this.blackHolePullRadius) * 500; // Stronger than player
                const pullX = (dx / distance) * pullStrength * deltaTime;
                const pullY = (dy / distance) * pullStrength * deltaTime;
                
                pickupVel.vx += pullX;
                pickupVel.vy += pullY;
            }
            
            // Destroy XP if too close to black hole
            if (distance < destroyRadius) {
                // Create destruction particles
                this.world.createParticles({
                    x: pickupPos.x,
                    y: pickupPos.y,
                    count: 8,
                    color: '#00ff00', // XP orb green color
                    speed: 50,
                    lifetime: 0.5,
                    size: 3
                });
                
                // Remove the pickup
                this.world.removeEntity(pickup.id);
            }
        }
    }
    
    /**
     * Spawn a black hole
     */
    spawnBlackHole() {
        // Random position not too close to edges
        const margin = 150;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);
        
        this.blackHoleEntity = this.world.createEntity('black_hole');
        
        this.blackHoleEntity.addComponent('position', createPosition(x, y));
        this.blackHoleEntity.addComponent('collision', createCollision(this.blackHoleDamageRadius));
        this.blackHoleEntity.addComponent('renderable', createRenderable('black_hole'));
        this.blackHoleEntity.addComponent('black_hole', {
            pullRadius: this.blackHolePullRadius,
            damageRadius: this.blackHoleDamageRadius,
            damage: 25, // Damage per tick when too close
            rotation: 0,
            lastDamageTime: 0
        });
    }
    
    /**
     * Start magnetic storm event
     */
    startMagneticStorm() {
        // Random weapon disable duration 2-6 seconds
        this.magneticStormTimer = 2 + Math.random() * 4;
        this.gameState.weaponDisabled = true;
        
        logger.info('WeatherSystem', `Magnetic storm disabling weapons for ${this.magneticStormTimer.toFixed(1)}s`);
    }
    
    /**
     * Update magnetic storm event
     * @param {number} deltaTime - Time elapsed
     */
    updateMagneticStorm(deltaTime) {
        // Update weapon disable timer
        if (this.magneticStormTimer !== undefined && this.magneticStormTimer > 0) {
            this.magneticStormTimer -= deltaTime;
            
            // Re-enable weapons when timer expires
            if (this.magneticStormTimer <= 0) {
                this.gameState.weaponDisabled = false;
                logger.info('WeatherSystem', 'Magnetic storm ended - weapons re-enabled');
            }
        }
    }
    
    /**
     * End the current event
     */
    endEvent() {
        // Guard: Don't try to end an event if there isn't one active
        if (!this.activeEvent) return;
        
        logger.info('WeatherSystem', `Ending event: ${this.activeEvent.type}`);
        
        if (this.activeEvent.type === 'meteor_storm') {
            // Remove all meteors
            const meteors = this.world.getEntitiesByType('meteor');
            meteors.forEach(meteor => this.world.removeEntity(meteor.id));
        } else if (this.activeEvent.type === 'black_hole') {
            // Remove black hole
            if (this.blackHoleEntity) {
                this.world.removeEntity(this.blackHoleEntity.id);
                this.blackHoleEntity = null;
            }
        } else if (this.activeEvent.type === 'magnetic_storm') {
            // Re-enable weapons
            this.gameState.weaponDisabled = false;
            this.magneticStormTimer = 0;
        }
        
        this.activeEvent = null;
        this.nextEventIn = this.getRandomEventDelay();
        this.meteorSpawnTimer = 0;
    }
    
    /**
     * Get random delay until next event
     * @returns {number} Delay in seconds
     */
    getRandomEventDelay() {
        return 30 + Math.random() * 30; // 30-60 seconds between events
    }
    
    /**
     * Get current weather warning text
     * @returns {string|null} Warning text or null
     */
    getWarningText() {
        if (!this.showingWarning || !this.activeEvent) {
            return null;
        }
        
        if (this.activeEvent.type === 'meteor_storm') {
            return 'ALERTE: TEMPÊTE DE MÉTÉORITES APPROCHE!';
        } else if (this.activeEvent.type === 'black_hole') {
            return 'ALERTE: ANOMALIE GRAVITATIONNELLE DÉTECTÉE!';
        } else if (this.activeEvent.type === 'magnetic_storm') {
            return 'ALERTE: TEMPÊTE MAGNÉTIQUE APPROCHE!';
        }
        
        return null;
    }
    
    /**
     * Get magnetic storm status text (during active event)
     * @returns {string|null} Status text or null
     */
    getMagneticStormStatus() {
        if (!this.activeEvent || this.activeEvent.type !== 'magnetic_storm' || this.showingWarning) {
            return null;
        }
        
        if (this.gameState.weaponDisabled && this.magneticStormTimer > 0) {
            return `TEMPÊTE MAGNÉTIQUE: ARMES OFF (${Math.ceil(this.magneticStormTimer)}s)`;
        }
        
        return null;
    }
    
    /**
     * Check if an event is currently active
     * @returns {boolean}
     */
    isEventActive() {
        return this.activeEvent !== null && !this.showingWarning;
    }
    
    /**
     * Get current active event type
     * @returns {string|null}
     */
    getActiveEventType() {
        if (!this.activeEvent || this.showingWarning) {
            return null;
        }
        return this.activeEvent.type;
    }
    
    /**
     * Reset weather system (for new game)
     */
    reset() {
        this.endEvent();
        this.activeEvent = null;
        this.eventTimer = 0;
        this.nextEventIn = this.getRandomEventDelay();
        this.warningTimer = 0;
        this.showingWarning = false;
        this.meteorSpawnTimer = 0;
        this.blackHoleEntity = null;
        this.magneticStormTimer = 0;
        this.gameState.weaponDisabled = false;
    }
}
