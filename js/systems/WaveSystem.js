/**
 * @file WaveSystem.js
 * @description Wave management system for roguelite progression
 * Manages wave counter, transitions, and triggers special spawns
 */

class WaveSystem {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Wave state
        this.waveNumber = 1;
        this.waveDuration = 35; // 35 seconds per wave
        this.waveTimer = 0;
        this.isPaused = false;
        this.pauseTimer = 0;
        this.pauseDuration = 1.5; // 1.5 second pause between waves
        
        // Spawn triggers
        this.shouldSpawn = true;
        
        // UI callback
        this.onWaveStart = null;
        
        logger.info('WaveSystem', 'Initialized');
    }

    /**
     * Update wave system
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        if (this.isPaused) {
            this.pauseTimer += deltaTime;
            
            if (this.pauseTimer >= this.pauseDuration) {
                this.endPause();
            }
            return;
        }
        
        this.waveTimer += deltaTime;
        
        // Check if wave should end
        if (this.waveTimer >= this.waveDuration) {
            this.endWave();
        }
    }

    /**
     * End current wave and start pause
     */
    endWave() {
        this.waveNumber++;
        this.waveTimer = 0;
        this.isPaused = true;
        this.pauseTimer = 0;
        this.shouldSpawn = false;
        
        logger.info('WaveSystem', `Wave ${this.waveNumber - 1} completed. Starting wave ${this.waveNumber}`);
        
        // Trigger UI announcement
        if (this.onWaveStart) {
            this.onWaveStart(this.waveNumber);
        }
    }

    /**
     * End pause and resume spawning
     */
    endPause() {
        this.isPaused = false;
        this.pauseTimer = 0;
        this.shouldSpawn = true;
        
        logger.info('WaveSystem', `Wave ${this.waveNumber} active`);
    }

    /**
     * Check if elite should spawn this wave
     * @returns {boolean} True if elite should spawn
     */
    shouldSpawnElite() {
        return this.waveNumber % 5 === 0;
    }

    /**
     * Check if boss should spawn this wave
     * @returns {boolean} True if boss should spawn
     */
    shouldSpawnBoss() {
        return this.waveNumber % 10 === 0;
    }

    /**
     * Get current wave number
     * @returns {number} Current wave
     */
    getWaveNumber() {
        return this.waveNumber;
    }

    /**
     * Check if spawning is allowed
     * @returns {boolean} True if enemies can spawn
     */
    canSpawn() {
        return this.shouldSpawn && !this.isPaused;
    }

    /**
     * Get wave progress (0-1)
     * @returns {number} Wave progress
     */
    getWaveProgress() {
        return Math.min(1, this.waveTimer / this.waveDuration);
    }

    /**
     * Reset wave system
     */
    reset() {
        this.waveNumber = 1;
        this.waveTimer = 0;
        this.isPaused = false;
        this.pauseTimer = 0;
        this.shouldSpawn = true;
        
        logger.info('WaveSystem', 'Reset to wave 1');
    }
}
