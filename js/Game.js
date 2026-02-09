/**
 * @file Game.js
 * @description Main game class that coordinates all systems and manages game loop
 */

// Default stats blueprint - ALL stats must be defined to prevent undefined errors
const DEFAULT_STATS = {
    damage: 1,
    damageMultiplier: 1,
    fireRate: 1,
    fireRateMultiplier: 1,
    speed: 1,
    speedMultiplier: 1,
    maxHealth: 1,
    armor: 0,
    lifesteal: 0,
    healthRegen: 0,
    critChance: 0,
    critDamage: 1.5,
    luck: 0,
    xpBonus: 1,
    projectileSpeed: 1,
    projectileSpeedMultiplier: 1,
    range: 1,
    rangeMultiplier: 1,
    shield: 0,
    shieldRegen: 0,
    shieldRegenDelay: 3.0
};

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
            wave: new WaveSystem(this.gameState),
            weather: new WeatherSystem(this.world, this.canvas, this.audioManager)
        };
        
        // Synergy system (initialized when game starts)
        this.synergySystem = null;
        
        // Keystone and reroll tracking
        this.keystonesOffered = new Set();
        this.rerollsRemaining = 2;
        this.levelsUntilRareGuarantee = 4;
        
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
        
        // Add shield component (starts at 0)
        this.player.addComponent('shield', Components.Shield(0, 0, 0));
        
        const playerComp = Components.Player();
        playerComp.speed = shipData.baseStats.speed;
        
        // Initialize stats from DEFAULT_STATS blueprint to prevent undefined errors
        playerComp.stats = structuredClone(DEFAULT_STATS);
        
        // Apply ship-specific stats (using metaDamage and metaXP from above)
        playerComp.stats.damage = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.damageMultiplier = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.fireRate = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.fireRateMultiplier = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.speed = shipData.baseStats.speed / 200; // Normalize speed
        playerComp.stats.speedMultiplier = 1;
        playerComp.stats.maxHealth = 1;
        playerComp.stats.critChance = shipData.baseStats.critChance;
        playerComp.stats.critDamage = shipData.baseStats.critMultiplier;
        playerComp.stats.lifesteal = shipData.baseStats.lifesteal;
        playerComp.stats.healthRegen = shipData.baseStats.healthRegen || 0;
        playerComp.stats.xpBonus = metaXP;
        playerComp.stats.armor = shipData.baseStats.armor || 0;
        
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
        this.recalculatePlayerStats();
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
        
        // Apply ship-specific base stats
        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        const metaDamage = 1 + (this.saveData.upgrades.baseDamage * 0.05);
        const metaXP = 1 + (this.saveData.upgrades.xpBonus * 0.1);

        playerComp.stats.damage = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.damageMultiplier = shipData.baseStats.damageMultiplier * metaDamage;
        playerComp.stats.fireRate = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.fireRateMultiplier = shipData.baseStats.fireRateMultiplier;
        playerComp.stats.speed = shipData.baseStats.speed / 200; // Normalize speed
        playerComp.stats.speedMultiplier = 1;
        playerComp.stats.critChance = shipData.baseStats.critChance;
        playerComp.stats.critDamage = shipData.baseStats.critMultiplier;
        playerComp.stats.lifesteal = shipData.baseStats.lifesteal;
        playerComp.stats.healthRegen = shipData.baseStats.healthRegen || 0;
        playerComp.stats.xpBonus = metaXP;
        playerComp.stats.armor = shipData.baseStats.armor || 0;
        playerComp.stats.projectileSpeed = 1;
        playerComp.stats.projectileSpeedMultiplier = 1;
        playerComp.stats.range = 1;
        playerComp.stats.rangeMultiplier = 1;
        playerComp.stats.shield = 0;
        playerComp.stats.shieldRegen = 0;
        playerComp.stats.shieldRegenDelay = 3.0;

        // Apply all passives
        for (const passive of playerComp.passives) {
            PassiveData.applyPassiveEffects(passive, playerComp.stats);
        }
        
        // Recalculate max HP with ratio preservation
        if (health) {
            const metaHealth = this.saveData.upgrades.maxHealth * 10;
            const baseMaxHP = shipData.baseStats.maxHealth + metaHealth;
            const hpMultiplier = playerComp.stats.maxHealthMultiplier || 1;
            const newMaxHP = Math.floor(baseMaxHP * hpMultiplier);
            
            // Preserve HP ratio
            const hpRatio = oldMaxHP > 0 ? oldCurrentHP / oldMaxHP : 1;
            health.max = Math.max(1, newMaxHP);
            health.current = Math.max(1, Math.min(Math.ceil(health.max * hpRatio), health.max));
            
            console.log(`Max HP recalculated: ${oldMaxHP} -> ${health.max}, Current: ${oldCurrentHP} -> ${health.current}`);
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
        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        
        // Check if we should offer keystone
        const keystone = KeystoneData.getKeystoneForClass(shipData.id);
        let keystoneOffered = false;
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

        const shipData = ShipData.getShipData(this.gameState.selectedShip);
        const preferredTags = shipData.preferredTags || [];
        const bannedTags = shipData.bannedTags || [];
        
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

            // Get available passives with tag filtering
            const availablePassives = Object.keys(PassiveData.PASSIVES).filter(key => {
                const passive = PassiveData.PASSIVES[key];
                const savePassive = this.saveData.passives[passive.id];
                if (!savePassive || !savePassive.unlocked) return false;
                if (useRarityFilter && passive.rarity !== rarity) return false;
                
                // Check if passive already at maxStacks
                const existing = playerComp.passives.find(p => p.id === passive.id);
                if (existing && existing.stacks >= passive.maxStacks) return false;
                
                // Filter by banned tags (unless relaxed)
                if (useBannedTags) {
                    const hasBannedTag = passive.tags?.some(t => bannedTags.includes(t));
                    if (hasBannedTag) return false;
                }
                
                // If using preferred tags, check for match
                if (usePreferred) {
                    return passive.tags?.some(t => preferredTags.includes(t));
                }
                
                return true;
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
        
        // Get ALL available passives (not maxed)
        const availablePassives = Object.keys(PassiveData.PASSIVES).filter(key => {
            const passive = PassiveData.PASSIVES[key];
            const savePassive = this.saveData.passives[passive.id];
            if (!savePassive || !savePassive.unlocked) return false;
            
            const existingPassive = playerComp.passives.find(p => p.id === passive.id);
            if (existingPassive && existingPassive.stacks >= passive.maxStacks) return false;
            
            return true;
        });
        
        const all = [
            ...availableWeapons.map(w => ({ type: 'weapon', key: WeaponData.WEAPONS[w].id, data: WeaponData.WEAPONS[w] })),
            ...availablePassives.map(p => ({ type: 'passive', key: PassiveData.PASSIVES[p].id, data: PassiveData.PASSIVES[p] }))
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
                rarity: selected.data.rarity,
                color: selected.data.color
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
        
        // Update synergy system
        if (this.synergySystem) {
            this.synergySystem.update(deltaTime);
        }
        
        // Update all systems
        this.systems.movement.update(deltaTime);
        this.systems.ai.update(deltaTime);
        this.systems.combat.update(deltaTime);
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
