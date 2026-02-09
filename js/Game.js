/**
 * @file Game.js
 * @description Main game class that coordinates all systems and manages game loop
 */

const BOSS_SIZE_THRESHOLD = 35;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Core systems
        this.world = new World();
        this.gameState = new GameState();
        this.saveManager = new SaveManager();
        this.audioManager = new AudioManager();
        
        // Debug system
        this.debugOverlay = null;
        
        // Screen effects
        this.screenEffects = new ScreenEffects(this.canvas);
        
        // Load save data
        this.saveData = this.saveManager.load();
        
        // Game systems
        this.systems = {
            movement: new MovementSystem(this.world, this.canvas),
            particle: new ParticleSystem(this.world),
            collision: new CollisionSystem(this.world, this.gameState, this.audioManager, null),
            combat: new CombatSystem(this.world, this.gameState, this.audioManager),
            ai: new AISystem(this.world, this.canvas),
            spawner: new SpawnerSystem(this.world, this.gameState, this.canvas),
            pickup: new PickupSystem(this.world, this.gameState),
            render: new RenderSystem(this.canvas, this.world, this.gameState),
            ui: new UISystem(this.world, this.gameState),
            wave: new WaveSystem(this.gameState)
        };
        
        // Set particle system reference in collision system
        this.systems.collision.particleSystem = this.systems.particle;
        
        // Set screen effects reference
        this.systems.collision.screenEffects = this.screenEffects;
        this.systems.render.screenEffects = this.screenEffects;
        
        // Connect wave system to UI
        this.systems.wave.onWaveStart = (waveNumber) => {
            this.systems.ui.showWaveAnnouncement(waveNumber);
            this.audioManager.playWaveStart();
            this.systems.spawner.triggerWaveSpawns(this.gameState.stats.time);
        };
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
        this.player = null;
        
        // Expose to window for system access
        window.game = this;
        
        // Initialize
        this.init();
    }

    init() {
        logger.info('Game', 'Initializing Space InZader...');
        
        // Initialize debug overlay
        this.debugOverlay = new DebugOverlay(this);
        
        // Apply volume settings
        this.audioManager.setMusicVolume(this.saveData.settings.musicVolume);
        this.audioManager.setSFXVolume(this.saveData.settings.sfxVolume);
        
        // Setup UI event listeners
        this.setupUIListeners();
        
        // Start in menu
        this.gameState.setState(GameStates.MENU);
        this.systems.ui.showScreen('menu');
        
        // Start render loop
        this.startRenderLoop();
    }

    setupUIListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            if (this.gameState.selectedShip) {
                this.startGame();
            } else {
                alert('Please select a ship first!');
            }
        });

        // Meta button
        document.getElementById('metaButton').addEventListener('click', () => {
            this.gameState.setState(GameStates.META_SCREEN);
            this.systems.ui.showScreen('meta');
        });

        // Back to menu from meta
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            this.gameState.setState(GameStates.MENU);
            this.systems.ui.showScreen('menu');
        });

        // Return to menu from game over
        document.getElementById('returnMenuButton').addEventListener('click', () => {
            this.gameState.setState(GameStates.MENU);
            this.systems.ui.showScreen('menu');
        });

        // Listen for ship selection
        window.addEventListener('shipSelected', (e) => {
            this.gameState.selectedShip = e.detail.ship;
        });

        // Listen for boost selection - BULLETPROOF handler
        window.addEventListener('boostSelected', (e) => {
            try {
                // Safety guards
                if (!e || !e.detail) {
                    logger.error('Game', 'Invalid boostSelected event - no detail');
                    return;
                }
                
                const boost = e.detail.boost;
                
                if (!boost) {
                    logger.error('Game', 'Invalid boostSelected event - no boost');
                    return;
                }
                
                if (!boost.type) {
                    logger.error('Game', 'Invalid boost - missing type', boost);
                    return;
                }
                
                if (!boost.key) {
                    logger.error('Game', 'Invalid boost - missing key', boost);
                    return;
                }
                
                // Apply the boost
                this.applyBoost(boost);
                
            } catch (error) {
                logger.error('Game', 'Error applying boost', error);
                console.error('Boost application error:', error);
            } finally {
                // ALWAYS resume game, no matter what happened
                try {
                    this.gameState.setState(GameStates.RUNNING);
                    this.running = true;
                    this.systems.ui.showScreen('game');
                    logger.info('Game', 'Game resumed after boost selection');
                } catch (resumeError) {
                    logger.error('Game', 'Critical error resuming game', resumeError);
                    console.error('Resume error:', resumeError);
                    // Last resort - force state
                    this.running = true;
                }
            }
        });

        // Pause/Resume
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameState.isState(GameStates.RUNNING)) {
                this.pauseGame();
            } else if (e.key === 'Escape' && this.gameState.isState(GameStates.PAUSED)) {
                this.resumeGame();
            }
        });

        // Initialize audio on first user interaction
        let audioInitialized = false;
        const initAudio = () => {
            if (!audioInitialized) {
                this.audioManager.init();
                audioInitialized = true;
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            }
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    startGame() {
        logger.info('Game', 'Starting game with ship: ' + this.gameState.selectedShip);
        
        // Reset world and stats
        this.world.clear();
        this.gameState.resetStats();
        this.gameState.setState(GameStates.RUNNING);
        
        // Create player
        this.createPlayer();
        
        // Reset systems
        this.systems.spawner.reset();
        this.systems.render.reset();
        this.systems.wave.reset();
        this.screenEffects.reset();
        
        // Hide menu, show game
        this.systems.ui.showScreen('game');
        
        // Start background music
        this.audioManager.startBackgroundMusic();
        
        logger.info('Game', 'Game started successfully');
        
        // Start game loop
        this.running = true;
    }

    createPlayer() {
        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        if (!shipData) {
            console.error('Invalid ship:', this.gameState.selectedShip);
            return;
        }

        // Apply meta-progression bonuses
        const metaHealth = this.saveData.upgrades.maxHealth * 10;
        const metaDamage = 1 + (this.saveData.upgrades.baseDamage * 0.05);
        const metaXP = 1 + (this.saveData.upgrades.xpBonus * 0.1);

        this.player = this.world.createEntity('player');
        
        const maxHealth = shipData.baseStats.maxHealth + metaHealth;
        
        this.player.addComponent('position', Components.Position(
            this.canvas.width / 2,
            this.canvas.height / 2
        ));
        
        this.player.addComponent('velocity', Components.Velocity(0, 0));
        this.player.addComponent('collision', Components.Collision(15));
        
        this.player.addComponent('health', Components.Health(maxHealth, maxHealth));
        
        const playerComp = Components.Player();
        playerComp.speed = shipData.baseStats.speed;
        playerComp.stats.damage = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.fireRate = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.speed = shipData.baseStats.speed / 200; // Normalize speed
        playerComp.stats.maxHealth = 1;
        playerComp.stats.critChance = shipData.baseStats.critChance;
        playerComp.stats.critDamage = shipData.baseStats.critMultiplier;
        playerComp.stats.lifesteal = shipData.baseStats.lifesteal;
        playerComp.stats.xpBonus = metaXP;
        
        this.player.addComponent('player', playerComp);
        
        this.player.addComponent('renderable', Components.Renderable(
            shipData.color,
            15,
            'triangle'
        ));

        // Add starting weapon
        this.addWeaponToPlayer(shipData.startingWeapon);
        
        console.log('Player created:', this.player);
    }

    addWeaponToPlayer(weaponType) {
        if (!this.player) {
            logger.warn('Game', 'Cannot add weapon - no player');
            return;
        }
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) {
            logger.warn('Game', 'Cannot add weapon - no player component');
            return;
        }

        const weaponData = WeaponData.getWeaponData(weaponType);
        if (!weaponData) {
            logger.error('Game', `Invalid weapon: ${weaponType}`);
            return;
        }

        // Check if weapon already exists
        const existing = playerComp.weapons.find(w => w.type === weaponType);
        if (existing) {
            // Level up weapon
            if (existing.level < weaponData.maxLevel) {
                existing.level++;
                logger.info('Game', `Leveled up ${weaponType} to level ${existing.level}`);
            } else {
                logger.warn('Game', `Weapon ${weaponType} already at max level`);
            }
        } else {
            // Add new weapon
            playerComp.weapons.push({
                type: weaponType,
                level: 1,
                data: weaponData,
                cooldown: 0,
                evolved: false
            });
            logger.info('Game', `Added weapon: ${weaponType}`);
        }

        this.systems.ui.updateHUD();
    }

    addPassiveToPlayer(passiveType) {
        if (!this.player) {
            logger.warn('Game', 'Cannot add passive - no player');
            return;
        }
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) {
            logger.warn('Game', 'Cannot add passive - no player component');
            return;
        }

        const passiveData = PassiveData.getPassiveData(passiveType);
        if (!passiveData) {
            logger.error('Game', `Invalid passive: ${passiveType}`);
            return;
        }

        // Check if passive already exists
        const existing = playerComp.passives.find(p => p.type === passiveType);
        if (existing) {
            // Stack passive
            if (existing.stacks < passiveData.maxStacks) {
                existing.stacks++;
                logger.info('Game', `Stacked ${passiveType} to ${existing.stacks}`);
            } else {
                logger.warn('Game', `Passive ${passiveType} already at max stacks`);
            }
        } else {
            // Add new passive
            playerComp.passives.push({
                type: passiveType,
                data: passiveData,
                stacks: 1
            });
            logger.info('Game', `Added passive: ${passiveType}`);
        }

        // Recalculate stats
        this.recalculatePlayerStats();
    }

    recalculatePlayerStats() {
        if (!this.player) return;
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return;

        // Reset stats to base
        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        const metaDamage = 1 + (this.saveData.upgrades.baseDamage * 0.05);
        const metaXP = 1 + (this.saveData.upgrades.xpBonus * 0.1);

        playerComp.stats.damage = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.fireRate = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.speed = shipData.baseStats.speed / 200; // Normalize speed
        playerComp.stats.critChance = shipData.baseStats.critChance;
        playerComp.stats.critDamage = shipData.baseStats.critMultiplier;
        playerComp.stats.lifesteal = shipData.baseStats.lifesteal;
        playerComp.stats.xpBonus = metaXP;
        playerComp.stats.armor = shipData.baseStats.armor || 0;
        playerComp.stats.projectileSpeed = 1;
        playerComp.stats.range = 1;

        // Apply all passives
        for (const passive of playerComp.passives) {
            PassiveData.applyPassiveEffects(passive, playerComp.stats);
        }

        console.log('Player stats recalculated:', playerComp.stats);
    }

    triggerLevelUp() {
        logger.info('Game', 'Player leveled up!');
        this.gameState.setState(GameStates.LEVEL_UP);
        
        // Generate 3 random boosts
        const boosts = this.generateBoostOptions();
        this.gameState.pendingBoosts = boosts;
        
        this.systems.ui.showLevelUp(boosts);
        
        // Play level up sound
        this.audioManager.playSFX('levelup');
    }

    generateBoostOptions() {
        const options = [];
        const playerComp = this.player.getComponent('player');
        
        if (!playerComp) return options;

        const luck = playerComp.stats.luck;

        for (let i = 0; i < 3; i++) {
            const boost = this.selectRandomBoost(luck, options);
            if (boost) {
                options.push(boost);
            }
        }

        return options;
    }

    selectRandomBoost(luck, existing) {
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return null;

        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        
        // Try rarities in order based on luck, with fallbacks
        const rarities = ['legendary', 'epic', 'rare', 'common'];
        
        // Determine starting rarity based on luck
        const roll = Math.random() + luck * 0.1;
        let startIndex;
        
        if (roll > 0.95) startIndex = 0; // legendary
        else if (roll > 0.8) startIndex = 1; // epic
        else if (roll > 0.5) startIndex = 2; // rare
        else startIndex = 3; // common

        // Try each rarity starting from the rolled one
        for (let i = startIndex; i < rarities.length; i++) {
            const rarity = rarities[i];
            
            // Get available weapons (60% preferred, 40% global)
            const availableWeapons = Object.keys(WeaponData.WEAPONS).filter(key => {
                const weapon = WeaponData.WEAPONS[key];
                const saveWeapon = this.saveData.weapons[weapon.id];
                if (!saveWeapon || !saveWeapon.unlocked) return false;
                if (weapon.rarity !== rarity) return false;
                
                // Check if weapon already at max level
                const existing = playerComp.weapons.find(w => w.type === weapon.id);
                if (existing && existing.level >= weapon.maxLevel) return false;
                
                // 60% chance for preferred weapons, 40% for all weapons
                if (shipData.preferredWeapons && shipData.preferredWeapons.includes(weapon.id)) {
                    return Math.random() < 0.85; // Higher chance for preferred
                } else {
                    return Math.random() < 0.4; // Lower chance for non-preferred
                }
            });

            // Get available passives (60% preferred, 40% global)
            const availablePassives = Object.keys(PassiveData.PASSIVES).filter(key => {
                const passive = PassiveData.PASSIVES[key];
                const savePassive = this.saveData.passives[passive.id];
                if (!savePassive || !savePassive.unlocked) return false;
                if (passive.rarity !== rarity) return false;
                
                // Check if passive already at maxStacks
                const existing = playerComp.passives.find(p => p.id === passive.id);
                if (existing && existing.stacks >= passive.maxStacks) return false;
                
                // 60% chance for preferred passives, 40% for all passives
                if (shipData.preferredPassives && shipData.preferredPassives.includes(passive.id)) {
                    return Math.random() < 0.85; // Higher chance for preferred
                } else {
                    return Math.random() < 0.4; // Lower chance for non-preferred
                }
            });

            const all = [
                ...availableWeapons.map(w => ({ type: 'weapon', key: WeaponData.WEAPONS[w].id, data: WeaponData.WEAPONS[w] })),
                ...availablePassives.map(p => ({ type: 'passive', key: PassiveData.PASSIVES[p].id, data: PassiveData.PASSIVES[p] }))
            ];

            // Filter out duplicates
            const filtered = all.filter(item => {
                return !existing.some(e => e.type === item.type && e.key === item.key);
            });

            // If we found options, select one
            if (filtered.length > 0) {
                const selected = MathUtils.randomChoice(filtered);
                return {
                    type: selected.type,
                    key: selected.key,
                    name: selected.data.name,
                    description: selected.data.description,
                    rarity: selected.data.rarity,
                    color: selected.data.color
                };
            }
        }

        // No options available at any rarity level
        return null;
    }

    /**
     * Update music theme based on game intensity
     */
    updateMusicTheme() {
        if (!this.audioManager || !this.audioManager.initialized) return;

        const enemies = this.world.getEntitiesByType('enemy');
        const enemyCount = enemies.length;
        const gameTime = this.gameState.stats.time;
        
        // Count boss/elite enemies (size >= BOSS_SIZE_THRESHOLD is boss)
        const bosses = enemies.filter(e => {
            const renderable = e.getComponent('renderable');
            return renderable && renderable.size >= BOSS_SIZE_THRESHOLD;
        });
        
        // Determine theme based on game state
        let targetTheme = 'calm';
        
        if (bosses.length > 0) {
            // Boss present -> boss theme
            targetTheme = 'boss';
        } else if (enemyCount > 20 || gameTime > 180) {
            // Many enemies or late game -> action theme
            targetTheme = 'action';
        } else if (enemyCount > 10 || gameTime > 60) {
            // Some action -> action theme
            targetTheme = 'action';
        }
        
        // Switch theme if different (AudioManager handles crossfade)
        if (this.audioManager.currentTheme !== targetTheme) {
            this.audioManager.setMusicTheme(targetTheme);
        }
    }

    applyBoost(boost) {
        if (!boost) return;

        logger.info('Game', `Applying boost: ${boost.type} - ${boost.name}`);

        if (boost.type === 'weapon') {
            this.addWeaponToPlayer(boost.key);
        } else if (boost.type === 'passive') {
            this.addPassiveToPlayer(boost.key);
        }

        logger.debug('Game', 'Boost applied successfully', boost);
    }

    pauseGame() {
        if (this.gameState.isState(GameStates.RUNNING)) {
            this.gameState.setState(GameStates.PAUSED);
            this.running = false;
            // Show pause UI
        }
    }

    resumeGame() {
        if (this.gameState.isState(GameStates.PAUSED) || this.gameState.isState(GameStates.LEVEL_UP)) {
            this.gameState.setState(GameStates.RUNNING);
            this.running = true;
            this.systems.ui.showScreen('game');
        }
    }

    gameOver() {
        this.running = false;
        this.gameState.setState(GameStates.GAME_OVER);
        
        // Calculate rewards
        const noyaux = this.gameState.calculateNoyaux();
        this.saveManager.addNoyaux(noyaux, this.saveData);
        this.saveManager.updateStats(this.gameState.stats, this.saveData);
        
        // Stop background music
        this.audioManager.stopBackgroundMusic();
        
        // Show game over screen
        this.systems.ui.showGameOver();
        
        // Play death sound
        this.audioManager.playSFX('death');
    }

    startRenderLoop() {
        const loop = (currentTime) => {
            requestAnimationFrame(loop);
            
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Track render time
            const renderStart = performance.now();
            this.systems.render.render(deltaTime);
            const renderEnd = performance.now();
            if (this.debugOverlay) {
                this.debugOverlay.setRenderTime(renderEnd - renderStart);
            }
            
            // Only update game logic if running
            if (this.running && this.gameState.isState(GameStates.RUNNING)) {
                const updateStart = performance.now();
                this.update(Math.min(deltaTime, 0.1)); // Cap delta to prevent spiral of death
                const updateEnd = performance.now();
                if (this.debugOverlay) {
                    this.debugOverlay.setUpdateTime(updateEnd - updateStart);
                }
            }
            
            // Update debug overlay
            if (this.debugOverlay) {
                this.debugOverlay.update();
            }
        };
        
        requestAnimationFrame(loop);
    }

    update(deltaTime) {
        // Update game time
        this.gameState.stats.time += deltaTime;
        
        // Update wave system
        this.systems.wave.update(deltaTime);
        this.systems.spawner.setWaveNumber(this.systems.wave.getWaveNumber());
        
        // Update all systems
        this.systems.movement.update(deltaTime);
        this.systems.ai.update(deltaTime);
        this.systems.combat.update(deltaTime);
        this.systems.collision.update(deltaTime);
        
        // Update spawner with wave spawn permission
        this.systems.spawner.update(deltaTime, this.systems.wave.canSpawn());
        
        this.systems.pickup.update(deltaTime);
        this.systems.particle.update(deltaTime);
        this.screenEffects.update(deltaTime);
        
        // Update invulnerability
        if (this.player) {
            const health = this.player.getComponent('health');
            if (health && health.invulnerable) {
                health.invulnerableTime -= deltaTime;
                if (health.invulnerableTime <= 0) {
                    health.invulnerable = false;
                }
            }

            // Check for game over
            if (health && health.current <= 0) {
                this.gameOver();
            }
        }
        
        // Process pending entity removals
        this.world.processPendingRemovals();
        
        // Update UI
        this.systems.ui.updateHUD();
    }
}
