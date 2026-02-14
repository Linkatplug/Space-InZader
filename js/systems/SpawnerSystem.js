/**
 * @file SpawnerSystem.js
 * @description Director system for budget-based enemy spawning with difficulty scaling
 */

class SpawnerSystem {
    constructor(world, gameState, canvas) {
        this.world = world;
        this.gameState = gameState;
        this.canvas = canvas;
        
        // Spawning state
        this.spawnBudget = 0;
        this.spawnTimer = 0;
        
        // FIX: Set maximum enemies to 40 (was 250)
        this.maxEnemiesOnScreen = 40;
        
        // Wave tracking
        this.waveNumber = 1;
        this.bossSpawnedThisWave = false;
        this.eliteSpawnedThisWave = false;
        
        // Boss tracking (legacy time-based)
        this.bossSpawned = {
            15: false,
            20: false
        };
        
        // Difficulty scaling
        this.difficultyMultiplier = 1.0;
    }

    /**
     * Update spawn system
     * @param {number} deltaTime - Time elapsed since last frame
     * @param {boolean} canSpawn - Whether spawning is allowed (from WaveSystem)
     */
    update(deltaTime, canSpawn = true) {
        const gameTime = this.gameState.stats.time;
        
        // Dynamically scale max enemies with game progression
        this.maxEnemiesOnScreen = Math.min(
            this.maxEnemiesCap,
            this.baseMaxEnemies + Math.floor(gameTime / 120) * 10  // +10 every 2 minutes
        );
        
        // Get current wave configuration
        const wave = this.getCurrentWave(gameTime);
        
        // Accumulate spawn budget exponentially
        const budgetGain = wave.budgetPerSecond * deltaTime * this.difficultyMultiplier;
        this.spawnBudget += budgetGain;
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn enemies when timer expires and we have budget (and spawning is allowed)
        if (canSpawn && this.spawnTimer >= wave.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemies(wave, gameTime);
        }
    }

    /**
     * Check and spawn bosses at milestone times
     * @param {number} gameTime - Current game time in seconds
     */
    checkBossSpawns(gameTime) {
        // 15 minute boss
        if (gameTime >= 900 && !this.bossSpawned[15]) {
            this.spawnBoss(gameTime);
            this.bossSpawned[15] = true;
        }
        
        // 20 minute boss
        if (gameTime >= 1200 && !this.bossSpawned[20]) {
            this.spawnBoss(gameTime);
            this.bossSpawned[20] = true;
        }
    }

    /**
     * Spawn boss enemy
     * @param {number} gameTime - Current game time
     * @param {string} bossType - Type of boss to spawn
     */
    spawnBoss(gameTime, bossType = 'boss') {
        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        const playerPos = player.getComponent('position');
        const spawnPos = this.getSpawnPosition(playerPos.x, playerPos.y);
        
        // Get boss data and scale it
        const bossData = this.getEnemyData(bossType);
        const scaledData = this.scaleEnemyStats(bossData, gameTime);
        
        this.createEnemy(spawnPos.x, spawnPos.y, scaledData, true);
        
        logger.info('SpawnerSystem', `Boss spawned: ${bossType} at wave ${this.waveNumber}`);
    }

    /**
     * Spawn elite enemy
     * @param {number} gameTime - Current game time
     */
    spawnElite(gameTime) {
        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        const playerPos = player.getComponent('position');
        const spawnPos = this.getSpawnPosition(playerPos.x, playerPos.y);
        
        // Spawn elite with extra scaling
        const eliteData = this.getEnemyData('elite');
        const scaledData = this.scaleEnemyStats(eliteData, gameTime);
        
        this.createEnemy(spawnPos.x, spawnPos.y, scaledData, false);
        
        logger.info('SpawnerSystem', `Elite spawned at wave ${this.waveNumber}`);
    }

    /**
     * Calculate difficulty multipliers based on game time and wave
     * @param {number} gameTime - Current game time in seconds
     * @param {number} waveNumber - Current wave number
     * @returns {{enemyCountMult: number, enemyHealthMult: number, enemySpeedMult: number}}
     */
    calculateDifficultyMultipliers(gameTime, waveNumber) {
        const timeMinutes = gameTime / 60;
        
        // Early game easing curve (waves 1-6): smoother progression
        let enemyCountMult, enemyHealthMult, enemySpeedMult;
        
        if (waveNumber <= 6) {
            // Linear interpolation from easier values to normal
            const t = (waveNumber - 1) / 5; // 0.0 at wave 1, 1.0 at wave 6
            
            // Base count multiplier from time, but eased for early waves
            const baseCountMult = Math.min(4.0, 1 + (timeMinutes * 0.20));
            const earlyCountEasing = 0.6 + (0.4 * t); // 0.6 -> 1.0
            enemyCountMult = baseCountMult * earlyCountEasing;
            
            // Health easing: 0.7 -> 1.0 over waves 1-6
            const normalHealthMult = Math.min(5.0, 1 + (waveNumber * 0.15));
            const earlyHealthEasing = 0.7 + (0.3 * t);
            enemyHealthMult = normalHealthMult * earlyHealthEasing;
            
            // Speed easing: 0.85 -> 1.0 over waves 1-6
            const normalSpeedMult = Math.min(2.0, 1 + (waveNumber * 0.05));
            const earlySpeedEasing = 0.85 + (0.15 * t);
            enemySpeedMult = normalSpeedMult * earlySpeedEasing;
            
            // Debug logging (optional - can be enabled via console: window.debugDifficulty = true)
            if (window.debugDifficulty) {
                console.log(`[Wave ${waveNumber}] Difficulty: Count=${enemyCountMult.toFixed(2)}, Health=${enemyHealthMult.toFixed(2)}, Speed=${enemySpeedMult.toFixed(2)}`);
            }
        } else {
            // Normal scaling from wave 7+
            // WAVE 8+ DIFFICULTY RAMP: Increased speed, HP, count, and special enemies
            const wave8Bonus = waveNumber >= 8 ? (waveNumber - 7) : 0;
            
            enemyCountMult = Math.min(4.0, 1 + (timeMinutes * 0.20) + (wave8Bonus * 0.06)); // +6% per wave after 8
            enemyHealthMult = Math.min(5.0, 1 + (waveNumber * 0.15) + (wave8Bonus * 0.05)); // +5% HP per wave after 8
            enemySpeedMult = Math.min(2.0, 1 + (waveNumber * 0.05) + (wave8Bonus * 0.03)); // +3% speed per wave after 8
            
            // Debug logging
            if (window.debugDifficulty) {
                console.log(`[Wave ${waveNumber}] Difficulty: Count=${enemyCountMult.toFixed(2)}, Health=${enemyHealthMult.toFixed(2)}, Speed=${enemySpeedMult.toFixed(2)} ${wave8Bonus > 0 ? `(+WAVE8 RAMP)` : ''}`);
            }
        }
        
        return { enemyCountMult, enemyHealthMult, enemySpeedMult };
    }

    /**
     * Set wave number from WaveSystem
     * @param {number} waveNumber - Current wave number
     */
    setWaveNumber(waveNumber) {
        if (this.waveNumber !== waveNumber) {
            this.waveNumber = waveNumber;
            this.bossSpawnedThisWave = false;
            this.eliteSpawnedThisWave = false;
        }
    }

    /**
     * Trigger wave-based spawns (boss/elite)
     * @param {number} gameTime - Current game time
     */
    triggerWaveSpawns(gameTime) {
        // Check for boss spawn (every 5 waves)
        if (this.waveNumber % 5 === 0 && !this.bossSpawnedThisWave) {
            const bossTypes = ['boss', 'tank_boss', 'swarm_boss', 'sniper_boss'];
            const bossType = bossTypes[Math.floor(this.waveNumber / 5) % bossTypes.length];
            this.spawnBoss(gameTime, bossType);
            this.bossSpawnedThisWave = true;
        }
        // Check for elite spawn (every 3 waves)
        else if (this.waveNumber % 3 === 0 && !this.eliteSpawnedThisWave) {
            this.spawnElite(gameTime);
            this.eliteSpawnedThisWave = true;
        }
    }

    /**
     * Spawn enemies based on budget and wave configuration
     * @param {Object} wave - Wave configuration
     * @param {number} gameTime - Current game time
     */
    spawnEnemies(wave, gameTime) {
        // FIX: Check enemy count limit (hard cap of 40)
        const currentEnemies = this.world.getEntitiesByType('enemy').length;
        if (currentEnemies >= this.maxEnemiesOnScreen) {
            // Soft log every 5 seconds to avoid spam
            if (!this.lastCapWarn || gameTime - this.lastCapWarn > 5) {
                console.log(`[SpawnerSystem] Enemy cap reached: ${currentEnemies}/${this.maxEnemiesOnScreen}`);
                this.lastCapWarn = gameTime;
            }
            return;
        }
        
        // Calculate how much budget to spend this spawn
        const spendBudget = Math.min(this.spawnBudget, wave.budgetPerSecond * 2);
        if (spendBudget < 1) return;

        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        const playerPos = player.getComponent('position');
        
        // Select enemies to spawn based on budget
        const enemiesToSpawn = this.selectEnemySpawn(spendBudget, wave.enemyPool);
        
        // Spawn selected enemies
        for (const enemyId of enemiesToSpawn) {
            // Check if we're still under cap
            if (this.world.getEntitiesByType('enemy').length >= this.maxEnemiesOnScreen) {
                break;
            }
            
            const enemyData = this.getEnemyData(enemyId);
            const scaledData = this.scaleEnemyStats(enemyData, gameTime);
            const spawnPos = this.getSpawnPosition(playerPos.x, playerPos.y);
            
            this.createEnemy(spawnPos.x, spawnPos.y, scaledData, false);
            this.spawnBudget -= enemyData.spawnCost;
        }
    }

    /**
     * Create enemy entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} enemyData - Enemy data
     * @param {boolean} isBoss - Whether this is a boss
     * @returns {Entity} Created enemy
     */
    createEnemy(x, y, enemyData, isBoss) {
        const enemy = this.world.createEntity('enemy');
        
        enemy.addComponent('position', Components.Position(x, y));
        enemy.addComponent('velocity', Components.Velocity(0, 0));
        
        // Add defense component using EnemyProfiles
        if (!enemyData.profileId || !window.EnemyProfiles || !window.EnemyProfiles.PROFILES[enemyData.profileId]) {
            throw new Error(`[SpawnerSystem] Cannot create enemy: Invalid profile ${enemyData.profileId}. EnemyProfiles required.`);
        }
        
        const profile = window.EnemyProfiles.PROFILES[enemyData.profileId];
        const defense = window.EnemyProfiles.createEnemyDefense(profile);
        enemy.addComponent('defense', defense);
        
        // Log spawn with defense values
        console.log(`[Spawn] ${enemyData.profileId} S/A/St=${profile.defense.shield}/${profile.defense.armor}/${profile.defense.structure} dmgType=${profile.attackDamageType}`);
        
        // Create collision component directly
        const collision = {
            radius: enemyData.size,
            type: 'enemy'
        };
        enemy.addComponent('collision', collision);
        
        // Create renderable component directly
        const renderable = {
            color: enemyData.color,
            size: enemyData.size,
            shape: 'circle',
            visible: true,
            layer: 1,
            alpha: 1.0,
            blendMode: 'normal'
        };
        enemy.addComponent('renderable', renderable);
        
        // Create enemy component directly
        const enemyComponent = {
            type: enemyData.aiType,
            maxHealth: enemyData.health,
            health: enemyData.health,
            damage: enemyData.damage,
            speed: enemyData.speed,
            xpValue: enemyData.xpValue,
            baseSpeed: enemyData.speed,
            attackPattern: enemyData.attackPattern,
            armor: enemyData.armor || 0,
            splitCount: enemyData.splitCount || 0,
            splitType: enemyData.splitType || null
        };
        
        // Add attack damage type if available
        if (enemyData.attackDamageType) {
            enemyComponent.attackDamageType = enemyData.attackDamageType;
        }
        
        enemy.addComponent('enemy', enemyComponent);
        
        // Add enemy weapon for shooting
        const damageType = (enemyData.profileId && window.EnemyProfiles && window.EnemyProfiles.PROFILES[enemyData.profileId]) 
            ? window.EnemyProfiles.PROFILES[enemyData.profileId].attackDamageType 
            : 'kinetic';
        
        const colorMap = {
            'em': '#00FFFF',
            'thermal': '#FF8C00',
            'kinetic': '#888888',
            'explosive': '#FF0000'
        };
        
        enemyComponent.enemyWeapon = {
            damageType: damageType,
            baseDamage: 6,
            fireRate: 0.8,
            projectileSpeed: 220,
            projectileSize: 4,
            color: colorMap[damageType] || '#888888',
            cooldown: 0
        };
        
        // Add boss component if boss - create directly
        if (isBoss) {
            const bossComponent = {
                phase: 1,
                patterns: ['chase', 'spiral', 'enrage'],
                phaseTimer: 0,
                nextPhaseThreshold: 0.5
            };
            enemy.addComponent('boss', bossComponent);
        }
        
        return enemy;
    }

    /**
     * Get current wave configuration based on game time
     * @param {number} gameTime - Current game time in seconds
     * @returns {Object} Wave configuration
     */
    getCurrentWave(gameTime) {
        if (gameTime < 300) {
            // 0-5 minutes - Early (REDUCED for better early game experience)
            return {
                budgetPerSecond: 1.0 + (gameTime / 120) * 0.3,  // Much slower ramp
                enemyPool: ['drone_basique', 'chasseur_rapide'],
                spawnInterval: 3.5  // Increased from 2.0
            };
        } else if (gameTime < 600) {
            // 5-10 minutes - Mid
            return {
                budgetPerSecond: 2.5 + ((gameTime - 300) / 90) * 0.6,
                enemyPool: ['drone_basique', 'chasseur_rapide', 'tireur'],
                spawnInterval: 2.5  // Increased from 1.5
            };
        } else if (gameTime < 1200) {
            // 10-20 minutes - Late
            return {
                budgetPerSecond: 5 + ((gameTime - 600) / 90) * 0.8,
                enemyPool: ['chasseur_rapide', 'tireur', 'tank', 'elite'],
                spawnInterval: 1.5  // Increased from 1.0
            };
        } else {
            // 20+ minutes - Endgame
            return {
                budgetPerSecond: 10 + ((gameTime - 1200) / 120) * 1.5,
                enemyPool: ['tank', 'elite'],
                spawnInterval: 1.0  // Increased from 0.8
            };
        }
    }

    /**
     * Select enemies to spawn based on available budget
     * @param {number} budget - Available spawn budget
     * @param {Array<string>} enemyPool - Available enemy types
     * @returns {Array<string>} Array of enemy IDs to spawn
     */
    selectEnemySpawn(budget, enemyPool) {
        const enemies = [];
        let remainingBudget = budget;

        // Sort pool by spawn cost
        const sortedPool = enemyPool
            .map(id => {
                const data = this.getEnemyData(id);
                return { id, cost: data.spawnCost };
            })
            .sort((a, b) => b.cost - a.cost);

        // Fill budget efficiently
        while (remainingBudget >= 1) {
            const affordable = sortedPool.filter(e => e.cost <= remainingBudget);
            if (affordable.length === 0) break;

            // Weighted random selection (prefer variety)
            const selected = affordable[Math.floor(Math.random() * affordable.length)];
            enemies.push(selected.id);
            remainingBudget -= selected.cost;
        }

        return enemies;
    }

    /**
     * Get enemy data by ID
     * @param {string} enemyId - Enemy identifier
     * @returns {Object} Enemy data
     */
    getEnemyData(enemyId) {
        // Map old enemy IDs to new EnemyProfiles
        const enemyMapping = {
            'drone_basique': 'SCOUT_DRONE',
            'chasseur_rapide': 'INTERCEPTOR',
            'tank': 'ARMORED_CRUISER',
            'tireur': 'PLASMA_ENTITY',
            'elite': 'SIEGE_HULK',
            'boss': 'ELITE_DESTROYER',
            'tank_boss': 'SIEGE_HULK',
            'swarm_boss': 'VOID_CARRIER',
            'sniper_boss': 'PLASMA_ENTITY'
        };
        
        // Get profile ID (use mapping or direct if already a profile ID)
        const profileId = enemyMapping[enemyId] || enemyId;
        
        // Get profile from EnemyProfiles
        if (window.EnemyProfiles && window.EnemyProfiles.PROFILES && window.EnemyProfiles.PROFILES[profileId]) {
            const profile = window.EnemyProfiles.PROFILES[profileId];
            
            // Convert profile to enemy data format
            return {
                id: profile.id,
                name: profile.name,
                health: profile.defense.shield + profile.defense.armor + profile.defense.structure, // Total HP for scaling
                damage: 10, // Base damage (will be overridden by profile)
                speed: profile.speed,
                xpValue: profile.xpValue,
                aiType: profile.aiType,
                size: profile.size,
                color: profile.color,
                secondaryColor: profile.secondaryColor || profile.color,
                spawnCost: profile.spawnCost,
                attackPattern: profile.attackPattern || { type: 'none' },
                armor: 0, // Armor is now in defense layers
                
                // New profile properties
                profileId: profileId,
                attackDamageType: profile.attackDamageType,
                defenseLayers: profile.defense,
                weakness: profile.weakness,
                isBoss: profile.isBoss || false,
                splitCount: profile.splitCount || 0,
                splitType: profile.splitType || null
            };
        }
        
        // Profile not found - error and use default
        console.error(`[SpawnerSystem] Enemy profile not found: ${profileId}. Check EnemyProfiles.js and enemyMapping.`);
        
        // Default to SCOUT_DRONE if profile missing
        const defaultProfile = window.EnemyProfiles.PROFILES['SCOUT_DRONE'];
        if (!defaultProfile) {
            throw new Error('[SpawnerSystem] FATAL: EnemyProfiles.SCOUT_DRONE not found. Cannot spawn enemies.');
        }
        
        return {
            id: defaultProfile.id,
            name: defaultProfile.name,
            health: defaultProfile.defense.shield + defaultProfile.defense.armor + defaultProfile.defense.structure,
            damage: 10,
            speed: defaultProfile.speed,
            xpValue: defaultProfile.xpValue,
            aiType: defaultProfile.aiType,
            size: defaultProfile.size,
            color: defaultProfile.color,
            secondaryColor: defaultProfile.secondaryColor || defaultProfile.color,
            spawnCost: defaultProfile.spawnCost,
            attackPattern: defaultProfile.attackPattern || { type: 'none' },
            armor: 0,
            profileId: 'SCOUT_DRONE',
            attackDamageType: defaultProfile.attackDamageType,
            defenseLayers: defaultProfile.defense,
            weakness: defaultProfile.weakness,
            isBoss: false
        };
    }

    /**
     * Scale enemy stats based on time/difficulty
     * @param {Object} enemyData - Base enemy data
     * @param {number} gameTime - Current game time in seconds
     * @returns {Object} Scaled enemy data
     */
    scaleEnemyStats(enemyData, gameTime) {
        // Get multipliers from wave and time
        const multipliers = this.calculateDifficultyMultipliers(gameTime, this.waveNumber);
        
        // Exponential scaling: +30% every 5 minutes (legacy)
        const timeFactor = 1 + (gameTime / 300) * 0.3;
        
        // Combine all scalings
        const healthScaling = multipliers.enemyHealthMult * this.difficultyMultiplier;
        const damageScaling = timeFactor * this.difficultyMultiplier;
        const speedScaling = multipliers.enemySpeedMult;

        const scaled = { ...enemyData };
        scaled.health = Math.floor(enemyData.health * healthScaling);
        scaled.damage = Math.floor(enemyData.damage * damageScaling);
        scaled.speed = Math.floor(enemyData.speed * speedScaling);
        scaled.xpValue = Math.floor(enemyData.xpValue * timeFactor);
        
        if (scaled.attackPattern.damage) {
            scaled.attackPattern = {
                ...scaled.attackPattern,
                damage: Math.floor(scaled.attackPattern.damage * damageScaling)
            };
        }

        return scaled;
    }

    /**
     * Calculate spawn position on screen edge
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @returns {{x: number, y: number}} Spawn position
     */
    getSpawnPosition(playerX, playerY) {
        const margin = 50;
        const edge = Math.floor(Math.random() * 4);
        
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;

        switch (edge) {
            case 0: // Top
                return {
                    x: MathUtils.clamp(
                        playerX + (Math.random() - 0.5) * screenWidth,
                        margin,
                        screenWidth - margin
                    ),
                    y: -margin
                };
            case 1: // Right
                return {
                    x: screenWidth + margin,
                    y: MathUtils.clamp(
                        playerY + (Math.random() - 0.5) * screenHeight,
                        margin,
                        screenHeight - margin
                    )
                };
            case 2: // Bottom
                return {
                    x: MathUtils.clamp(
                        playerX + (Math.random() - 0.5) * screenWidth,
                        margin,
                        screenWidth - margin
                    ),
                    y: screenHeight + margin
                };
            case 3: // Left
                return {
                    x: -margin,
                    y: MathUtils.clamp(
                        playerY + (Math.random() - 0.5) * screenHeight,
                        margin,
                        screenHeight - margin
                    )
                };
            default:
                return { x: playerX, y: playerY };
        }
    }

    /**
     * Reset spawner state for new game
     */
    reset() {
        this.spawnBudget = 0;
        this.spawnTimer = 0;
        this.waveNumber = 1;
        this.bossSpawnedThisWave = false;
        this.eliteSpawnedThisWave = false;
        this.bossSpawned = {
            15: false,
            20: false
        };
        this.difficultyMultiplier = 1.0;
    }
}
