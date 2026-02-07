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
        this.maxEnemiesOnScreen = 150;
        
        // Boss tracking
        this.bossSpawned = {
            15: false,  // 15 minute boss
            20: false   // 20 minute boss
        };
        
        // Difficulty scaling
        this.difficultyMultiplier = 1.0;
    }

    /**
     * Update spawn system
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        const gameTime = this.gameState.stats.time;
        
        // Check for boss spawns at specific times
        this.checkBossSpawns(gameTime);
        
        // Get current wave configuration
        const wave = this.getCurrentWave(gameTime);
        
        // Accumulate spawn budget exponentially
        const budgetGain = wave.budgetPerSecond * deltaTime * this.difficultyMultiplier;
        this.spawnBudget += budgetGain;
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn enemies when timer expires and we have budget
        if (this.spawnTimer >= wave.spawnInterval) {
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
     */
    spawnBoss(gameTime) {
        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        const playerPos = player.getComponent('position');
        const spawnPos = this.getSpawnPosition(playerPos.x, playerPos.y);
        
        // Get boss data and scale it
        const bossData = this.getEnemyData('boss');
        const scaledData = this.scaleEnemyStats(bossData, gameTime);
        
        this.createEnemy(spawnPos.x, spawnPos.y, scaledData, true);
    }

    /**
     * Spawn enemies based on budget and wave configuration
     * @param {Object} wave - Wave configuration
     * @param {number} gameTime - Current game time
     */
    spawnEnemies(wave, gameTime) {
        // Check enemy count limit (soft cap)
        const currentEnemies = this.world.getEntitiesByType('enemy').length;
        if (currentEnemies >= this.maxEnemiesOnScreen) {
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
        enemy.addComponent('health', Components.Health(enemyData.health, enemyData.health));
        enemy.addComponent('collision', Components.Collision(enemyData.size));
        enemy.addComponent('renderable', Components.Renderable(
            enemyData.color,
            enemyData.size,
            'circle'
        ));
        enemy.addComponent('enemy', Components.Enemy(
            enemyData.aiType,
            enemyData.health,
            enemyData.damage,
            enemyData.speed,
            enemyData.xpValue
        ));
        
        // Set enemy data properties
        const enemyComp = enemy.getComponent('enemy');
        enemyComp.attackPattern = enemyData.attackPattern;
        enemyComp.armor = enemyData.armor || 0;
        enemyComp.splitCount = enemyData.splitCount || 0;
        enemyComp.splitType = enemyData.splitType || null;
        
        // Add boss component if boss
        if (isBoss) {
            enemy.addComponent('boss', Components.Boss(
                1,
                ['chase', 'spiral', 'enrage']
            ));
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
            // 0-5 minutes - Early
            return {
                budgetPerSecond: 2 + (gameTime / 60) * 0.5,
                enemyPool: ['drone_basique', 'chasseur_rapide'],
                spawnInterval: 2.0
            };
        } else if (gameTime < 600) {
            // 5-10 minutes - Mid
            return {
                budgetPerSecond: 4 + ((gameTime - 300) / 60) * 0.8,
                enemyPool: ['drone_basique', 'chasseur_rapide', 'tireur', 'tank'],
                spawnInterval: 1.5
            };
        } else if (gameTime < 1200) {
            // 10-20 minutes - Late
            return {
                budgetPerSecond: 8 + ((gameTime - 600) / 60) * 1.2,
                enemyPool: ['chasseur_rapide', 'tireur', 'tank', 'elite'],
                spawnInterval: 1.0
            };
        } else {
            // 20+ minutes - Endgame
            return {
                budgetPerSecond: 15 + ((gameTime - 1200) / 60) * 2.0,
                enemyPool: ['tank', 'elite'],
                spawnInterval: 0.8
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
        const enemies = {
            drone_basique: {
                id: 'drone_basique',
                name: 'Drone Basique',
                health: 20,
                damage: 10,
                speed: 100,
                xpValue: 5,
                aiType: 'chase',
                size: 12,
                color: '#FF1493',
                spawnCost: 1,
                attackPattern: { type: 'none' },
                armor: 0
            },
            chasseur_rapide: {
                id: 'chasseur_rapide',
                name: 'Chasseur Rapide',
                health: 12,
                damage: 15,
                speed: 180,
                xpValue: 8,
                aiType: 'weave',
                size: 10,
                color: '#00FF00',
                spawnCost: 2,
                attackPattern: { type: 'none' },
                armor: 0
            },
            tank: {
                id: 'tank',
                name: 'Tank',
                health: 80,
                damage: 20,
                speed: 60,
                xpValue: 15,
                aiType: 'chase',
                size: 20,
                color: '#4169E1',
                spawnCost: 5,
                attackPattern: { type: 'none' },
                armor: 5
            },
            tireur: {
                id: 'tireur',
                name: 'Tireur',
                health: 25,
                damage: 8,
                speed: 80,
                xpValue: 12,
                aiType: 'kite',
                size: 11,
                color: '#FFD700',
                spawnCost: 3,
                attackPattern: {
                    type: 'shoot',
                    damage: 12,
                    cooldown: 2.0,
                    range: 300,
                    projectileSpeed: 250,
                    projectileColor: '#FFFF00'
                },
                armor: 0
            },
            elite: {
                id: 'elite',
                name: 'Élite',
                health: 150,
                damage: 25,
                speed: 120,
                xpValue: 40,
                aiType: 'aggressive',
                size: 18,
                color: '#FF4500',
                spawnCost: 12,
                attackPattern: {
                    type: 'shoot',
                    damage: 20,
                    cooldown: 1.5,
                    range: 250,
                    projectileSpeed: 300,
                    projectileColor: '#FF0000'
                },
                armor: 3,
                splitCount: 2,
                splitType: 'drone_basique'
            },
            boss: {
                id: 'boss',
                name: 'Boss',
                health: 1000,
                damage: 40,
                speed: 90,
                xpValue: 200,
                aiType: 'boss',
                size: 40,
                color: '#DC143C',
                spawnCost: 100,
                attackPattern: {
                    type: 'special',
                    damage: 30,
                    cooldown: 0.8,
                    range: 400,
                    projectileSpeed: 350,
                    projectileColor: '#FF00FF'
                },
                armor: 10,
                splitCount: 5,
                splitType: 'elite'
            }
        };

        return enemies[enemyId] || enemies.drone_basique;
    }

    /**
     * Scale enemy stats based on time/difficulty
     * @param {Object} enemyData - Base enemy data
     * @param {number} gameTime - Current game time in seconds
     * @returns {Object} Scaled enemy data
     */
    scaleEnemyStats(enemyData, gameTime) {
        // Exponential scaling: +30% every 5 minutes
        const timeFactor = 1 + (gameTime / 300) * 0.3;
        const scaling = timeFactor * this.difficultyMultiplier;

        const scaled = { ...enemyData };
        scaled.health = Math.floor(enemyData.health * scaling);
        scaled.damage = Math.floor(enemyData.damage * scaling);
        scaled.xpValue = Math.floor(enemyData.xpValue * timeFactor);
        
        if (scaled.attackPattern.damage) {
            scaled.attackPattern = {
                ...scaled.attackPattern,
                damage: Math.floor(scaled.attackPattern.damage * scaling)
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
        this.bossSpawned = {
            15: false,
            20: false
        };
        this.difficultyMultiplier = 1.0;
    }
}
