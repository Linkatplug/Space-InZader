/**
 * @file Game.js
 * @description Main game class that coordinates all systems and manages game loop
 */

// Default stats blueprint - ALL stats must be defined to prevent undefined errors
// Base Stats: Core stats from ship + meta progression
// Derived Stats: Calculated from passives/synergies (multipliers apply to base)
const DEFAULT_STATS = {
    // === CORE DAMAGE STATS ===
    damage: 1,
    damageMultiplier: 1,
    
    // === FIRE RATE STATS ===
    fireRate: 1,
    fireRateMultiplier: 1,
    
    // === MOVEMENT STATS ===
    speed: 1,
    speedMultiplier: 1,
    
    // === HEALTH STATS ===
    maxHealth: 1,
    maxHealthMultiplier: 1,
    maxHealthAdd: 0,
    healthRegen: 0,
    
    // === DEFENSE STATS ===
    armor: 0,
    shield: 0,
    shieldRegen: 0,
    shieldRegenDelay: 3.0,
    dodgeChance: 0,
    
    // === LIFESTEAL & SUSTAIN ===
    lifesteal: 0,
    
    // === CRITICAL STATS ===
    critChance: 0,
    critDamage: 1.5,
    
    // === UTILITY STATS ===
    luck: 0,
    xpBonus: 1,
    magnetRange: 0,
    
    // === PROJECTILE STATS ===
    projectileSpeed: 1,
    projectileSpeedMultiplier: 1,
    range: 1,
    rangeMultiplier: 1,
    piercing: 0,
    
    // === SPECIAL EFFECTS (defaults for passives) ===
    overheatReduction: 0,
    explosionChance: 0,
    explosionDamage: 0,
    explosionRadius: 0,
    stunChance: 0,
    reflectDamage: 0,
    projectileCount: 0,
    ricochetChance: 0,
    chainLightning: 0,
    slowChance: 0
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Core systems
        this.world = new World();
        
        // Simple event bus for UI communication
        this.world.events = {
            listeners: {},
            on(event, callback) {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(callback);
            },
            emit(event, data) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(cb => {
                        try {
                            cb(data);
                        } catch (err) {
                            console.error(`[Event] Error in ${event} listener:`, err);
                        }
                    });
                }
            }
        };
        console.log('[Game] Event bus initialized');
        
        this.gameState = new GameState();
        this.saveManager = new SaveManager();
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager();
        
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
            wave: new WaveSystem(this.gameState),
            weather: new WeatherSystem(this.world, this.canvas, this.audioManager, this.gameState),
            defense: new DefenseSystem(this.world),
            heat: new HeatSystem(this.world, this.gameState),
            shipUpgrade: new ShipUpgradeSystem(this.world)
        };
        
        // Synergy system (initialized when game starts)
        this.synergySystem = null;
        
        // Keystone and reroll tracking
        this.keystonesOffered = new Set();
        this.rerollsRemaining = 2;
        this.levelsUntilRareGuarantee = 4;
        
        // ESC key debounce protection
        this.escapePressed = false;
        
        // Set particle system reference in collision system
        this.systems.collision.particleSystem = this.systems.particle;
        
        // Set screen effects reference
        this.systems.collision.screenEffects = this.screenEffects;
        this.systems.render.screenEffects = this.screenEffects;
        
        // Set system references in world for cross-system access
        this.world.defenseSystem = this.systems.defense;
        this.world.heatSystem = this.systems.heat;
        this.world.particleSystem = this.systems.particle;
        
        // Connect wave system to UI
        this.systems.wave.onWaveStart = (waveNumber) => {
            this.systems.ui.showWaveAnnouncement(waveNumber);
            this.audioManager.playWaveStart();
            this.systems.spawner.triggerWaveSpawns(this.gameState.stats.time);
        };
        
        // Give UI system reference to wave system for display updates
        this.systems.ui.waveSystem = this.systems.wave;
        
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

        // View scoreboard from game over
        document.getElementById('viewScoreboardButton').addEventListener('click', () => {
            this.systems.ui.showScoreboard();
        });

        // Scoreboard back button
        document.getElementById('scoreboardBackButton').addEventListener('click', () => {
            this.systems.ui.hideScoreboard();
            this.systems.ui.showGameOver();
        });

        // Submit score with name
        document.getElementById('submitScoreButton').addEventListener('click', () => {
            this.submitScore();
        });

        // Skip score entry
        document.getElementById('skipScoreButton').addEventListener('click', () => {
            this.systems.ui.hideNameEntryDialog();
            this.systems.ui.showGameOver();
        });

        // Allow Enter key to submit name
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
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
        
        // Listen for reroll event
        window.addEventListener('rerollBoosts', (e) => {
            if (this.rerollsRemaining > 0) {
                this.rerollsRemaining--;
                const boosts = this.generateBoostOptions();
                this.gameState.pendingBoosts = boosts;
                this.systems.ui.showLevelUp(boosts, this.rerollsRemaining);
                logger.info('Game', `Rerolled boosts, ${this.rerollsRemaining} rerolls remaining`);
            }
        });

        // Pause/Resume with ESC key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Prevent key repeat from triggering multiple times
                if (e.repeat) return;
                
                // Check if we're in a sub-screen (commands or options)
                const uiSystem = this.systems?.ui;
                if (uiSystem?.isScreenActive('commandsScreen')) {
                    // If commands screen is active, go back to pause menu
                    uiSystem.showPauseMenu();
                    return;
                }
                if (uiSystem?.isScreenActive('optionsScreen')) {
                    // If options screen is active, go back based on return screen
                    if (uiSystem.optionsReturnScreen === 'pause') {
                        uiSystem.showPauseMenu();
                    } else {
                        uiSystem.showMainMenu();
                    }
                    return;
                }
                
                // Normal pause/resume logic
                if (this.gameState.isState(GameStates.RUNNING)) {
                    this.pauseGame();
                } else if (this.gameState.isState(GameStates.PAUSED)) {
                    this.resumeGame();
                }
            }
        });

        // Initialize audio on first user interaction
        let audioInitialized = false;
        const initAudio = () => {
            if (!audioInitialized) {
                this.audioManager.init();
                audioInitialized = true;
                
                // Start background music immediately after initialization
                this.audioManager.startBackgroundMusic();
                console.log('Audio initialized and music started');
                
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
        
        // Reset keystone and reroll tracking
        this.keystonesOffered.clear();
        this.rerollsRemaining = 2;
        this.levelsUntilRareGuarantee = 4;
        
        // Create player
        this.createPlayer();
        
        // Initialize synergy system
        this.synergySystem = new SynergySystem(this.world, this.player);
        this.world.particleSystem = this.systems.particle;
        
        // Reset systems
        this.systems.spawner.reset();
        this.systems.render.reset();
        this.systems.wave.reset();
        this.systems.weather.reset();
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
        // Get ship from new ShipData.SHIPS
        const shipId = this.gameState.selectedShip || 'ION_FRIGATE';
        const ship = window.ShipData && window.ShipData.SHIPS ? window.ShipData.SHIPS[shipId] : null;
        
        if (!ship) {
            console.error('Invalid ship:', shipId);
            // Fallback to ION_FRIGATE
            const fallbackShip = window.ShipData.SHIPS.ION_FRIGATE;
            if (!fallbackShip) {
                console.error('Cannot create player - no ship data available');
                return;
            }
            this.gameState.selectedShip = 'ION_FRIGATE';
            return this.createPlayer(); // Retry with fallback
        }

        // Apply meta-progression bonuses
        const metaDamage = 1 + (this.saveData.upgrades.baseDamage * 0.05);
        const metaXP = 1 + (this.saveData.upgrades.xpBonus * 0.1);

        this.player = this.world.createEntity('player');
        
        this.player.addComponent('position', Components.Position(
            this.canvas.width / 2,
            this.canvas.height / 2
        ));
        
        this.player.addComponent('velocity', Components.Velocity(0, 0));
        this.player.addComponent('collision', Components.Collision(15));
        
        // Add defense layers from ship data
        const defenseLayers = {
            shield: {
                max: ship.defenses.shieldMax,
                current: ship.defenses.shieldMax,
                resistances: { em: 0.3, kinetic: 0.2, thermal: 0.2, explosive: 0.2 }
            },
            armor: {
                max: ship.defenses.armorMax,
                current: ship.defenses.armorMax,
                resistances: { em: 0.2, kinetic: 0.4, thermal: 0.25, explosive: 0.3 }
            },
            structure: {
                max: ship.defenses.structureMax,
                current: ship.defenses.structureMax,
                resistances: { em: 0.1, kinetic: 0.1, thermal: 0.1, explosive: 0.1 }
            }
        };
        
        this.player.addComponent('defense', Components.Defense(defenseLayers));
        
        // Add heat component with cooling multiplier from ship
        const baseHeatMax = 100;
        const baseCoolingRate = 20; // base cooling per second
        this.player.addComponent('heat', Components.Heat(
            baseHeatMax,
            baseCoolingRate * (ship.defenses.coolingMult || 1.0)
        ));
        
        const playerComp = Components.Player();
        playerComp.speed = 220; // Base player speed
        playerComp.shipId = shipId;
        
        // Initialize stats from DEFAULT_STATS blueprint to prevent undefined errors
        playerComp.stats = structuredClone(DEFAULT_STATS);
        
        // Apply ship-specific stats
        playerComp.stats.damage = metaDamage;
        playerComp.stats.damageMultiplier = metaDamage;
        playerComp.stats.fireRate = 1.0;
        playerComp.stats.fireRateMultiplier = 1.0;
        playerComp.stats.speed = 1.0;
        playerComp.stats.speedMultiplier = 1.0;
        playerComp.stats.maxHealth = 1;
        playerComp.stats.xpBonus = metaXP;
        
        // Store ship mods for systems to use
        playerComp.stats.shipMods = {
            offense: ship.offense,
            tradeoffs: ship.tradeoffs,
            shieldRegenMult: ship.defenses.shieldRegenMult || 1.0,
            coolingMult: ship.defenses.coolingMult || 1.0
        };
        
        // Store base stats snapshot for delta calculations in UI
        playerComp.baseStats = {
            damageMultiplier: playerComp.stats.damageMultiplier,
            fireRateMultiplier: playerComp.stats.fireRateMultiplier,
            speed: playerComp.stats.speed,
            armor: 0,
            critChance: 0.05,
            critDamage: 1.5,
            lifesteal: 0,
            healthRegen: 0,
            rangeMultiplier: 1,
            projectileSpeedMultiplier: 1
        };
        
        this.player.addComponent('player', playerComp);
        
        // Ship color (basic for now)
        const shipColors = {
            ION_FRIGATE: '#00FFFF',
            BALLISTIC_DESTROYER: '#FFFFFF',
            CATACLYSM_CRUISER: '#FF0000',
            TECH_NEXUS: '#FF8C00'
        };
        
        this.player.addComponent('renderable', Components.Renderable(
            shipColors[shipId] || '#00FFFF',
            15,
            'triangle'
        ));

        // Add starting weapon
        console.log('[Game] Adding starting weapon:', ship.startingWeaponId);
        this.addWeaponToPlayer(ship.startingWeaponId);
        
        // Ensure currentWeapon is set for UI
        if (playerComp.weapons && playerComp.weapons.length > 0) {
            const weapon = playerComp.weapons[0];
            playerComp.currentWeapon = weapon.data || weapon;
            console.log('[Game] currentWeapon set:', playerComp.currentWeapon);
        } else {
            console.error('[Game] No weapons in player weapons array!');
        }
        
        console.log('Player created with ship:', shipId);
    }

    addWeaponToPlayer(weaponType) {
        console.log('[Game] addWeaponToPlayer called with:', weaponType);
        
        if (!this.player) {
            logger.warn('Game', 'Cannot add weapon - no player');
            return;
        }
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) {
            logger.warn('Game', 'Cannot add weapon - no player component');
            return;
        }

        console.log('[Game] Looking up weapon:', weaponType);
        console.log('[Game] WeaponData available:', typeof WeaponData !== 'undefined');
        const weaponData = WeaponData.getWeaponData(weaponType);
        console.log('[Game] Weapon data result:', weaponData);
        
        if (!weaponData) {
            console.error('[Game] Failed to get weapon data for:', weaponType);
            console.error('[Game] Available weapons:', WeaponData.WEAPONS ? Object.keys(WeaponData.WEAPONS) : 'NONE');
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

        // Check if it's a keystone (try KeystoneData first)
        let passiveData = KeystoneData.getKeystone(passiveType);
        let isKeystone = !!passiveData;
        
        if (!passiveData) {
            passiveData = PassiveData.getPassiveData(passiveType);
        }
        
        if (!passiveData) {
            logger.error('Game', `Invalid passive: ${passiveType}`);
            return;
        }
        
        // Track keystone acquisition
        if (isKeystone) {
            this.keystonesOffered.add(passiveType);
            logger.info('Game', `Acquired keystone: ${passiveType}`);
        }

        // Check if passive already exists
        const existing = playerComp.passives.find(p => p.type === passiveType);
        if (existing) {
            // Stack passive (keystones can't stack)
            if (!isKeystone && existing.stacks < passiveData.maxStacks) {
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
                stacks: 1,
                id: passiveType
            });
            logger.info('Game', `Added passive: ${passiveType}`);
        }

        // Recalculate stats
        const health = this.player.getComponent('health');
        console.log(`Before recalculate - HP: ${health ? health.current + '/' + health.max : 'N/A'}`);
        this.recalculatePlayerStats();
        
        // Log after recalculation to verify
        if (health) {
            console.log(`After recalculate - HP: ${health.current}/${health.max}`);
        }
    }

    recalculatePlayerStats() {
        if (!this.player) return;
        
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return;

        // Store old health and shield values before recalculation
        const health = this.player.getComponent('health');
        const shield = this.player.getComponent('shield');
        const oldMaxHP = health ? health.max : 100;
        const oldCurrentHP = health ? health.current : 100;
        const oldMaxShield = shield ? shield.max : 0;
        const oldCurrentShield = shield ? shield.current : 0;

        // Reset stats to DEFAULT_STATS blueprint to prevent undefined errors
        playerComp.stats = structuredClone(DEFAULT_STATS);
        
        // Apply ship-specific base stats (new ship system doesn't have these stats)
        const metaDamage = 1 + (this.saveData.upgrades.baseDamage * 0.05);
        const metaXP = 1 + (this.saveData.upgrades.xpBonus * 0.1);

        playerComp.stats.damage = metaDamage;
        playerComp.stats.damageMultiplier = metaDamage;
        playerComp.stats.fireRate = 1.0;
        playerComp.stats.fireRateMultiplier = 1.0;
        playerComp.stats.speed = 1.0;
        playerComp.stats.speedMultiplier = 1;
        playerComp.stats.critChance = 0.05;
        playerComp.stats.critDamage = 1.5;
        playerComp.stats.lifesteal = 0;
        playerComp.stats.healthRegen = 0;
        playerComp.stats.xpBonus = metaXP;
        playerComp.stats.armor = 0;
        playerComp.stats.projectileSpeed = 1;
        playerComp.stats.projectileSpeedMultiplier = 1;
        playerComp.stats.range = 1;
        playerComp.stats.rangeMultiplier = 1;
        playerComp.stats.shield = 0;
        playerComp.stats.shieldRegen = 0;
        playerComp.stats.shieldRegenDelay = 3.0;

        // Apply all passives (keeping for backwards compatibility with keystones)
        for (const passive of playerComp.passives) {
            PassiveData.applyPassiveEffects(passive, playerComp.stats);
        }
        
        // Apply ship upgrades
        if (this.systems && this.systems.shipUpgrade) {
            const upgradeEffects = this.systems.shipUpgrade.calculateTotalUpgradeEffects(this.player);
            
            // Apply upgrade effects to stats
            for (const [key, value] of Object.entries(upgradeEffects)) {
                if (key.endsWith('Mult') || key.includes('Multiplier')) {
                    // Multiplicative stat
                    if (!playerComp.stats[key]) playerComp.stats[key] = 1;
                    playerComp.stats[key] += value;
                } else if (key.endsWith('Add') || key.includes('Bonus')) {
                    // Additive stat
                    if (!playerComp.stats[key]) playerComp.stats[key] = 0;
                    playerComp.stats[key] += value;
                } else if (key.endsWith('Chance')) {
                    // Chance stat (0-1 range)
                    if (!playerComp.stats[key]) playerComp.stats[key] = 0;
                    playerComp.stats[key] = Math.min(1, playerComp.stats[key] + value);
                } else {
                    // Default: additive
                    if (!playerComp.stats[key]) playerComp.stats[key] = 0;
                    playerComp.stats[key] += value;
                }
            }
        }
        
        // Recalculate max HP using base stats vs derived stats formula
        if (health) {
            // Store old values
            const oldMax = health.max;
            const oldCurrent = health.current;
            const ratio = oldMax > 0 ? oldCurrent / oldMax : 1;
            
            // Calculate base max HP (ship stats + meta upgrades)
            const metaHealth = this.saveData.upgrades.maxHealth * 10;
            const baseMaxHP = shipData.baseStats.maxHealth + metaHealth;
            
            // Get multiplier and flat additions from passives
            const hpMultiplier = playerComp.stats.maxHealthMultiplier || 1;
            const hpAdd = playerComp.stats.maxHealthAdd || 0;
            
            // Calculate new max: floor(baseMaxHP * hpMultiplier + hpAdd), minimum 1
            const newMax = Math.max(1, Math.floor(baseMaxHP * hpMultiplier + hpAdd));
            
            console.log(`HP Calculation: base=${baseMaxHP}, multiplier=${hpMultiplier}, add=${hpAdd}, newMax=${newMax}`);
            
            // Apply new max
            health.max = newMax;
            
            // Adjust current HP: clamp(ceil(newMax * ratio), 1, newMax)
            health.current = Math.max(1, Math.min(Math.ceil(newMax * ratio), newMax));
            
            console.log(`Max HP recalculated: ${oldMax} -> ${health.max}, Current: ${oldCurrent} -> ${health.current}`);
        }
        
        // Update shield component based on stats with ratio preservation
        if (shield && playerComp.stats.shield > 0) {
            const newMaxShield = playerComp.stats.shield;
            
            // Preserve shield ratio
            const shieldRatio = oldMaxShield > 0 ? oldCurrentShield / oldMaxShield : 1;
            shield.max = newMaxShield;
            shield.current = Math.max(0, Math.min(Math.ceil(shield.max * shieldRatio), shield.max));
            shield.regen = playerComp.stats.shieldRegen;
            shield.regenDelayMax = playerComp.stats.shieldRegenDelay;
            
            console.log(`Shield recalculated: ${oldMaxShield} -> ${shield.max}, Current: ${oldCurrentShield} -> ${shield.current}`);
        } else if (shield) {
            // No shield stats, reset shield
            shield.current = 0;
            shield.max = 0;
            shield.regen = 0;
        }
        
        // Force synergy system to recalculate
        if (this.synergySystem) {
            this.synergySystem.forceRecalculate();
        }

        // Apply soft caps to prevent infinite stacking
        this.applySoftCaps(playerComp.stats);
        
        // Validate stats and log warnings
        this.validateStats(playerComp.stats);

        console.log('Player stats recalculated:', playerComp.stats);
    }
    
    /**
     * Apply soft caps to stats to prevent infinite stacking
     * @param {Object} stats - Player stats object
     */
    applySoftCaps(stats) {
        // Lifesteal cap at 50% to prevent invincibility
        if (stats.lifesteal > 0.5) {
            console.warn(`Lifesteal capped at 50% (was ${(stats.lifesteal * 100).toFixed(1)}%)`);
            stats.lifesteal = 0.5;
        }
        
        // Health regen cap at 10/s to prevent trivializing damage
        if (stats.healthRegen > 10) {
            console.warn(`Health regen capped at 10/s (was ${stats.healthRegen.toFixed(1)}/s)`);
            stats.healthRegen = 10;
        }
        
        // Fire rate minimum 0.1 (max 10x speed) to prevent freeze
        if (stats.fireRate < 0.1) {
            console.warn(`Fire rate capped at minimum 0.1 (was ${stats.fireRate.toFixed(2)})`);
            stats.fireRate = 0.1;
        }
        
        // Fire rate maximum 10 to prevent performance issues
        if (stats.fireRate > 10) {
            console.warn(`Fire rate capped at 10 (was ${stats.fireRate.toFixed(2)})`);
            stats.fireRate = 10;
        }
        
        // Speed minimum 0.2 to prevent getting stuck
        if (stats.speed < 0.2) {
            console.warn(`Speed capped at minimum 0.2 (was ${stats.speed.toFixed(2)})`);
            stats.speed = 0.2;
        }
        
        // Speed maximum 5 to prevent control issues
        if (stats.speed > 5) {
            console.warn(`Speed capped at 5 (was ${stats.speed.toFixed(2)})`);
            stats.speed = 5;
        }
        
        // Crit chance cap at 100%
        if (stats.critChance > 1.0) {
            console.warn(`Crit chance capped at 100% (was ${(stats.critChance * 100).toFixed(1)}%)`);
            stats.critChance = 1.0;
        }
        
        // Dodge chance cap at 75% to maintain some risk
        if (stats.dodgeChance > 0.75) {
            console.warn(`Dodge chance capped at 75% (was ${(stats.dodgeChance * 100).toFixed(1)}%)`);
            stats.dodgeChance = 0.75;
        }
    }
    
    /**
     * Validate stats for sanity and log warnings for extreme values
     * @param {Object} stats - Player stats object
     */
    validateStats(stats) {
        const warnings = [];
        
        // Check for undefined stats (critical error)
        for (const [key, value] of Object.entries(stats)) {
            if (value === undefined) {
                warnings.push(`CRITICAL: Stat '${key}' is undefined!`);
            }
        }
        
        // Check for extreme values
        if (stats.damageMultiplier > 10) {
            warnings.push(`Very high damage multiplier: ${stats.damageMultiplier.toFixed(2)}x`);
        }
        
        if (stats.fireRateMultiplier > 5) {
            warnings.push(`Very high fire rate multiplier: ${stats.fireRateMultiplier.toFixed(2)}x`);
        }
        
        if (stats.speedMultiplier > 3) {
            warnings.push(`Very high speed multiplier: ${stats.speedMultiplier.toFixed(2)}x`);
        }
        
        if (stats.lifesteal > 0.3) {
            warnings.push(`High lifesteal: ${(stats.lifesteal * 100).toFixed(1)}%`);
        }
        
        if (stats.healthRegen > 5) {
            warnings.push(`High health regen: ${stats.healthRegen.toFixed(1)}/s`);
        }
        
        // Log all warnings grouped
        if (warnings.length > 0) {
            console.group('%c⚠️ Stats Validation Warnings', 'color: #ffaa00; font-weight: bold;');
            warnings.forEach(w => console.warn(w));
            console.groupEnd();
        }
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
        // Old ship system - keystones not implemented for new ships yet
        // const shipData = ShipData.getShipData(this.gameState.selectedShip);
        
        // TODO: Implement keystone system for new ships
        // Check if we should offer keystone
        // const keystone = KeystoneData.getKeystoneForClass(shipData.id);
        let keystoneOffered = false;
        const keystone = null; // Disabled for now
        if (keystone && !this.keystonesOffered.has(keystone.id)) {
            // 25% chance to offer keystone if not yet obtained
            if (Math.random() < 0.25) {
                options.push({
                    type: 'passive',
                    key: keystone.id,
                    data: keystone,
                    isKeystone: true
                });
                keystoneOffered = true;
            }
        }
        
        // Determine if rare guarantee applies
        let forceRare = false;
        if (this.levelsUntilRareGuarantee <= 0) {
            forceRare = true;
            this.levelsUntilRareGuarantee = 4;
        } else {
            this.levelsUntilRareGuarantee--;
        }

        // Generate remaining options (3 total, or 2 if keystone offered)
        const numOptions = keystoneOffered ? 2 : 3;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loops
        
        while (options.length < (keystoneOffered ? 3 : 3) && attempts < maxAttempts) {
            const constraintLevel = Math.floor(attempts / 20); // Relax constraints every 20 attempts
            const boost = this.selectRandomBoost(luck, options, forceRare && options.length === (keystoneOffered ? 1 : 0), constraintLevel);
            if (boost) {
                options.push(boost);
                attempts = 0; // Reset attempts on success
            } else {
                attempts++;
            }
        }
        
        // Fallback: If still not enough options, try absolute last resort
        while (options.length < (keystoneOffered ? 3 : 3)) {
            const boost = this.selectRandomBoostLastResort(options);
            if (boost) {
                options.push(boost);
            } else {
                break; // No more options possible
            }
        }

        return options;
    }

    selectRandomBoost(luck, existing, forceRare = false, constraintLevel = 0) {
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return null;

        // Old ship system - tags not implemented for new ships yet
        const preferredTags = [];
        const bannedTags = [];
        
        // Progressive constraint relaxation:
        // 0: Use all constraints (preferred tags, rarity, banned tags)
        // 1: Ignore preferred tags
        // 2: Ignore rarity restrictions
        // 3: Ignore banned tags (last resort)
        const usePreferredTags = constraintLevel < 1;
        const useRarityFilter = constraintLevel < 2;
        const useBannedTags = constraintLevel < 3;
        
        // Try rarities in order based on luck, with fallbacks
        const rarities = ['legendary', 'epic', 'rare', 'common'];
        
        // Determine starting rarity based on luck or force rare
        let startIndex;
        if (forceRare) {
            startIndex = 2; // Force rare or better
        } else {
            const roll = Math.random() + luck * 0.1;
            
            if (roll > 0.95) startIndex = 0; // legendary
            else if (roll > 0.8) startIndex = 1; // epic
            else if (roll > 0.5) startIndex = 2; // rare
            else startIndex = 3; // common
        }
        
        // If not using rarity filter, try all rarities
        if (!useRarityFilter) {
            startIndex = 0;
        }

        // Try each rarity starting from the rolled one
        for (let i = startIndex; i < rarities.length; i++) {
            const rarity = rarities[i];
            
            // 60% chance to use preferred tags, 40% for global pool (only if using preferred tags)
            const usePreferred = usePreferredTags && Math.random() < 0.6;
            
            // Get available weapons with tag filtering
            const availableWeapons = Object.keys(WeaponData.WEAPONS).filter(key => {
                const weapon = WeaponData.WEAPONS[key];
                const saveWeapon = this.saveData.weapons[weapon.id];
                if (!saveWeapon || !saveWeapon.unlocked) return false;
                if (useRarityFilter && weapon.rarity !== rarity) return false;
                
                // Check if weapon already at max level
                const existing = playerComp.weapons.find(w => w.type === weapon.id);
                if (existing && existing.level >= weapon.maxLevel) return false;
                
                // Filter by banned tags (unless relaxed)
                if (useBannedTags) {
                    const hasBannedTag = weapon.tags?.some(t => bannedTags.includes(t));
                    if (hasBannedTag) return false;
                }
                
                // If using preferred tags, check for match
                if (usePreferred) {
                    return weapon.tags?.some(t => preferredTags.includes(t));
                }
                
                return true;
            });

            // Get available ship upgrades (NOT maxed out)
            const shipId = playerComp.shipId || 'ION_FRIGATE';
            const shipData = window.ShipUpgradeData?.SHIPS?.[shipId];
            
            const availableUpgrades = shipData ? shipData.upgrades.filter(upgrade => {
                const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
                if (currentLevel >= upgrade.maxLevel) return false;
                
                // Treat upgrades as 'rare' rarity for now (can be enhanced later)
                if (useRarityFilter && rarity !== 'rare') return false;
                
                // Filter by banned tags (unless relaxed)
                if (useBannedTags) {
                    const hasBannedTag = upgrade.tags?.some(t => bannedTags.includes(t));
                    if (hasBannedTag) return false;
                }
                
                // If using preferred tags, check for match
                if (usePreferred) {
                    return upgrade.tags?.some(t => preferredTags.includes(t));
                }
                
                return true;
            }).map(upgrade => {
                const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
                return {
                    ...upgrade,
                    currentLevel,
                    nextLevel: currentLevel + 1,
                    // Add display properties for UI
                    rarity: 'rare',  // Upgrades are treated as rare rarity
                    color: '#9b59b6'  // Purple color for upgrades
                };
            }) : [];

            let all = [
                ...availableWeapons.map(w => ({ type: 'weapon', key: WeaponData.WEAPONS[w].id, data: WeaponData.WEAPONS[w] })),
                ...availableUpgrades.map(u => ({ type: 'upgrade', key: u.id, data: u, currentLevel: u.currentLevel, maxLevel: u.maxLevel }))
            ];

            // FIX: If preferred pool is empty, fallback to global pool for this rarity
            if (all.length === 0 && usePreferred) {
                logger.debug('Game', `No preferred options at ${rarity}, trying global pool`);
                
                // Retry without preferred filter
                const globalWeapons = Object.keys(WeaponData.WEAPONS).filter(key => {
                    const weapon = WeaponData.WEAPONS[key];
                    const saveWeapon = this.saveData.weapons[weapon.id];
                    if (!saveWeapon || !saveWeapon.unlocked) return false;
                    if (weapon.rarity !== rarity) return false;
                    
                    const existing = playerComp.weapons.find(w => w.type === weapon.id);
                    if (existing && existing.level >= weapon.maxLevel) return false;
                    
                    const hasBannedTag = weapon.tags?.some(t => bannedTags.includes(t));
                    if (hasBannedTag) return false;
                    
                    return true;
                });
                
                const globalUpgrades = shipData ? shipData.upgrades.filter(upgrade => {
                    const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
                    if (currentLevel >= upgrade.maxLevel) return false;
                    
                    // Treat upgrades as 'rare' rarity
                    if (rarity !== 'rare') return false;
                    
                    const hasBannedTag = upgrade.tags?.some(t => bannedTags.includes(t));
                    if (hasBannedTag) return false;
                    
                    return true;
                }).map(upgrade => {
                    const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
                    return {
                        ...upgrade,
                        currentLevel,
                        nextLevel: currentLevel + 1,
                        // Add display properties for UI
                        rarity: 'rare',  // Upgrades are treated as rare rarity
                        color: '#9b59b6'  // Purple color for upgrades
                    };
                }) : [];
                
                all = [
                    ...globalWeapons.map(w => ({ type: 'weapon', key: WeaponData.WEAPONS[w].id, data: WeaponData.WEAPONS[w] })),
                    ...globalUpgrades.map(u => ({ type: 'upgrade', key: u.id, data: u, currentLevel: u.currentLevel, maxLevel: u.maxLevel }))
                ];
            }

            // Filter out duplicates
            const filtered = all.filter(item => {
                return !existing.some(e => e.type === item.type && e.key === item.key);
            });

            logger.debug('Game', `Rarity ${rarity}: found ${filtered.length} options (before dedup: ${all.length})`);

            // If we found options, select one
            if (filtered.length > 0) {
                const selected = MathUtils.randomChoice(filtered);
                logger.info('Game', `Selected ${selected.type}: ${selected.key} (${rarity})`);
                
                const boost = {
                    type: selected.type,
                    key: selected.key,
                    name: selected.data.name,
                    description: selected.data.description,
                    rarity: selected.data.rarity,
                    color: selected.data.color
                };
                
                // Add upgrade-specific fields
                if (selected.type === 'upgrade') {
                    boost.currentLevel = selected.currentLevel;
                    boost.maxLevel = selected.maxLevel;
                }
                
                return boost;
            }
        }

        logger.warn('Game', 'No boost options available at any rarity level');

        // No options available at any rarity level
        return null;
    }
    
    /**
     * Last resort boost selection - ignores all constraints except duplicates
     */
    selectRandomBoostLastResort(existing) {
        const playerComp = this.player.getComponent('player');
        if (!playerComp) return null;
        
        // Get ALL available weapons (not maxed)
        const availableWeapons = Object.keys(WeaponData.WEAPONS).filter(key => {
            const weapon = WeaponData.WEAPONS[key];
            const saveWeapon = this.saveData.weapons[weapon.id];
            if (!saveWeapon || !saveWeapon.unlocked) return false;
            
            const existingWeapon = playerComp.weapons.find(w => w.type === weapon.id);
            if (existingWeapon && existingWeapon.level >= weapon.maxLevel) return false;
            
            return true;
        });
        
        // Get ALL available ship upgrades (not maxed)
        const shipId = playerComp.shipId || 'ION_FRIGATE';
        const shipData = window.ShipUpgradeData?.SHIPS?.[shipId];
        
        const availableUpgrades = shipData ? shipData.upgrades.filter(upgrade => {
            const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
            return currentLevel < upgrade.maxLevel;
        }).map(upgrade => {
            const currentLevel = playerComp.upgrades.get(upgrade.id) || 0;
            return {
                ...upgrade,
                currentLevel,
                nextLevel: currentLevel + 1,
                // Add display properties for UI
                rarity: 'rare',  // Upgrades are treated as rare rarity
                color: '#9b59b6'  // Purple color for upgrades
            };
        }) : [];
        
        const all = [
            ...availableWeapons.map(w => ({ type: 'weapon', key: WeaponData.WEAPONS[w].id, data: WeaponData.WEAPONS[w] })),
            ...availableUpgrades.map(u => ({ type: 'upgrade', key: u.id, data: u, currentLevel: u.currentLevel, maxLevel: u.maxLevel }))
        ];
        
        // Filter out duplicates
        const filtered = all.filter(item => {
            return !existing.some(e => e.type === item.type && e.key === item.key);
        });
        
        if (filtered.length > 0) {
            const selected = MathUtils.randomChoice(filtered);
            return {
                type: selected.type,
                key: selected.key,
                name: selected.data.name,
                description: selected.data.description,
                rarity: selected.data.rarity || 'common',
                color: selected.data.color || '#888888',
                currentLevel: selected.currentLevel,
                maxLevel: selected.maxLevel
            };
        }
        
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
        } else if (boost.type === 'upgrade') {
            // Apply ship upgrade using ShipUpgradeSystem
            if (this.systems && this.systems.shipUpgrade) {
                this.systems.shipUpgrade.incrementUpgrade(this.player, boost.key);
                this.recalculatePlayerStats();
                logger.info('Game', `Applied upgrade: ${boost.key} (Level ${boost.currentLevel + 1}/${boost.maxLevel})`);
            } else {
                logger.error('Game', 'ShipUpgradeSystem not available');
            }
        }

        logger.debug('Game', 'Boost applied successfully', boost);
    }

    pauseGame() {
        // Prevent double pause (PAUSED -> PAUSED)
        if (this.gameState.isState(GameStates.PAUSED)) return;
        
        if (this.gameState.isState(GameStates.RUNNING)) {
            this.gameState.setState(GameStates.PAUSED);
            this.running = false;
            // Show pause UI
            if (this.systems && this.systems.ui) {
                this.systems.ui.showPauseMenu();
            }
        }
    }

    resumeGame() {
        if (this.gameState.isState(GameStates.PAUSED) || this.gameState.isState(GameStates.LEVEL_UP)) {
            this.gameState.setState(GameStates.RUNNING);
            this.running = true;
            if (this.systems && this.systems.ui) {
                this.systems.ui.hidePauseMenu();
                this.systems.ui.showScreen('game');
            }
        }
    }

    gameOver() {
        this.running = false;
        this.gameState.setState(GameStates.GAME_OVER);
        
        // Calculate rewards
        const credits = this.gameState.calculateNoyaux();
        this.saveManager.addNoyaux(credits, this.saveData);
        this.saveManager.updateStats(this.gameState.stats, this.saveData);
        
        // Keep background music playing (instead of stopping it)
        // Music will continue seamlessly from gameplay to game over screen
        
        // Check if score qualifies for leaderboard
        const finalScore = this.gameState.stats.score;
        if (this.scoreManager.qualifiesForLeaderboard(finalScore)) {
            // Show name entry dialog
            this.systems.ui.showNameEntryDialog();
        } else {
            // Show game over screen directly
            this.systems.ui.showGameOver();
        }
        
        // Play death sound
        this.audioManager.playSFX('death');
    }

    /**
     * Submit score to leaderboard
     */
    submitScore() {
        const nameInput = document.getElementById('playerNameInput');
        const playerName = nameInput ? nameInput.value.trim() : '';
        
        if (!playerName) {
            alert('Veuillez entrer un nom');
            return;
        }
        
        const stats = this.gameState.stats;
        const waveNumber = this.systems.wave?.getWaveNumber() || 1;
        
        const scoreData = {
            playerName: playerName,
            score: stats.score,
            time: stats.time,
            kills: stats.kills,
            level: stats.highestLevel,
            wave: waveNumber
        };
        
        const rank = this.scoreManager.addScore(scoreData);
        
        // Hide name entry and show game over
        this.systems.ui.hideNameEntryDialog();
        this.systems.ui.showGameOver();
        
        // Show a congratulations message if in top 3
        if (rank > 0 && rank <= 3) {
            const medals = ['🥇', '🥈', '🥉'];
            alert(`Félicitations! Vous êtes ${rank}${rank === 1 ? 'er' : 'ème'}! ${medals[rank - 1]}`);
        }
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
        
        // Update synergy system
        if (this.synergySystem) {
            this.synergySystem.update(deltaTime);
        }
        
        // Update all systems
        this.systems.movement.update(deltaTime);
        this.systems.ai.update(deltaTime);
        this.systems.combat.update(deltaTime);
        this.systems.defense.update(deltaTime);
        this.systems.heat.update(deltaTime);
        this.systems.weather.update(deltaTime);
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
            
            // Update shield regeneration
            const shield = this.player.getComponent('shield');
            if (shield && shield.max > 0) {
                // Update regen delay
                if (shield.regenDelay > 0) {
                    shield.regenDelay -= deltaTime;
                } else {
                    // Regenerate shield
                    if (shield.current < shield.max && shield.regen > 0) {
                        shield.current += shield.regen * deltaTime;
                        shield.current = Math.min(shield.current, shield.max);
                    }
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
