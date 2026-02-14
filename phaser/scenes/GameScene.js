/**
 * @file phaser/scenes/GameScene.js
 * @description Main game scene integrating ECS with Phaser
 */

import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.selectedShip = data.selectedShip || 'interceptor';
    }

    create() {
        console.log('GameScene: Starting with ship:', this.selectedShip);
        
        // Initialize ECS World (from existing ECS.js)
        this.initializeECS();
        
        // Create starfield background
        this.createStarfield();
        
        // Create player
        this.createPlayer();
        
        // Setup input
        this.setupInput();
        
        // Create HUD
        this.createHUD();
        
        // Initialize game systems
        this.initializeSystems();
        
        // Start game loop (Phaser handles this automatically via update())
        this.gameRunning = true;
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }
    
    initializeECS() {
        // Use the existing ECS from js/core/ECS.js
        // This will be loaded via script tags in the HTML
        if (typeof World !== 'undefined') {
            this.world = new World();
            console.log('ECS World initialized');
        } else {
            console.warn('ECS not loaded, creating minimal world');
            this.world = { entities: new Map() };
        }
    }
    
    createStarfield() {
        // Parallax starfield layers
        this.starfieldLayers = [];
        
        for (let layer = 0; layer < 3; layer++) {
            const graphics = this.add.graphics();
            graphics.setDepth(-10 + layer);
            
            const stars = [];
            const count = 50 * (layer + 1);
            
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Phaser.Math.Between(0, this.cameras.main.width),
                    y: Phaser.Math.Between(0, this.cameras.main.height),
                    size: (layer + 1) * 0.5,
                    alpha: 0.3 + layer * 0.3,
                    speed: (layer + 1) * 20
                });
            }
            
            this.starfieldLayers.push({ graphics, stars, layer });
        }
    }
    
    createPlayer() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create player ship graphics
        this.player = this.add.graphics();
        this.player.x = width / 2;
        this.player.y = height - 100;
        this.player.setDepth(10);
        
        this.drawPlayerShip();
        
        // Player physics (if using Phaser physics)
        // For now, manual control to match original
        this.playerData = {
            x: this.player.x,
            y: this.player.y,
            vx: 0,
            vy: 0,
            speed: 200,
            health: 100,
            maxHealth: 100
        };
    }
    
    drawPlayerShip() {
        this.player.clear();
        this.player.fillStyle(0x00ffff, 1);
        this.player.fillTriangle(0, -20, -15, 15, 15, 15);
        
        // Engine glow
        this.player.fillStyle(0x00ff00, 0.6);
        this.player.fillCircle(0, 10, 5);
    }
    
    setupInput() {
        // WASD controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });
        
        // Pause on ESC
        this.keys.ESC.on('down', () => {
            this.pauseGame();
        });
    }
    
    createHUD() {
        // Health bar
        this.healthBarBg = this.add.rectangle(60, 30, 200, 20, 0x330000);
        this.healthBarBg.setOrigin(0, 0.5);
        this.healthBarBg.setDepth(100);
        
        this.healthBar = this.add.rectangle(60, 30, 200, 20, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5);
        this.healthBar.setDepth(101);
        
        this.healthText = this.add.text(20, 30, 'HP:', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        });
        this.healthText.setOrigin(0, 0.5);
        this.healthText.setDepth(102);
        
        // Score
        this.scoreText = this.add.text(this.cameras.main.width - 20, 30, 'Score: 0', {
            font: 'bold 16px monospace',
            fill: '#00ffff'
        });
        this.scoreText.setOrigin(1, 0.5);
        this.scoreText.setDepth(100);
        
        this.score = 0;
    }
    
    initializeSystems() {
        // Here we would initialize the ported systems
        // For now, basic game logic
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
    }
    
    update(time, delta) {
        if (!this.gameRunning) return;
        
        const dt = delta / 1000; // Convert to seconds
        
        // Update starfield
        this.updateStarfield(dt);
        
        // Update player movement
        this.updatePlayer(dt);
        
        // Update enemies
        this.updateEnemies(dt);
        
        // Update projectiles
        this.updateProjectiles(dt);
        
        // Update HUD
        this.updateHUD();
        
        // Check collisions
        this.checkCollisions();
    }
    
    updateStarfield(dt) {
        this.starfieldLayers.forEach(layer => {
            layer.graphics.clear();
            
            layer.stars.forEach(star => {
                star.y += star.speed * dt;
                
                // Wrap around
                if (star.y > this.cameras.main.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.cameras.main.width);
                }
                
                layer.graphics.fillStyle(0xffffff, star.alpha);
                layer.graphics.fillCircle(star.x, star.y, star.size);
            });
        });
    }
    
    updatePlayer(dt) {
        // Movement
        let vx = 0;
        let vy = 0;
        
        if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1;
        if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1;
        if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1;
        if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1;
        
        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }
        
        this.playerData.x += vx * this.playerData.speed * dt;
        this.playerData.y += vy * this.playerData.speed * dt;
        
        // Clamp to screen
        const margin = 20;
        this.playerData.x = Phaser.Math.Clamp(
            this.playerData.x, 
            margin, 
            this.cameras.main.width - margin
        );
        this.playerData.y = Phaser.Math.Clamp(
            this.playerData.y, 
            margin, 
            this.cameras.main.height - margin
        );
        
        this.player.x = this.playerData.x;
        this.player.y = this.playerData.y;
    }
    
    updateEnemies(dt) {
        this.enemies.forEach((enemy, index) => {
            // Simple AI: move toward player
            const dx = this.playerData.x - enemy.x;
            const dy = this.playerData.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
            
            enemy.graphics.x = enemy.x;
            enemy.graphics.y = enemy.y;
            
            // Remove if off screen
            if (enemy.y > this.cameras.main.height + 50) {
                enemy.graphics.destroy();
                this.enemies.splice(index, 1);
            }
        });
    }
    
    updateProjectiles(dt) {
        this.projectiles.forEach((proj, index) => {
            proj.y -= proj.speed * dt;
            proj.graphics.y = proj.y;
            
            // Remove if off screen
            if (proj.y < -50) {
                proj.graphics.destroy();
                this.projectiles.splice(index, 1);
            }
        });
    }
    
    updateHUD() {
        // Update health bar
        const healthPercent = this.playerData.health / this.playerData.maxHealth;
        this.healthBar.width = 200 * healthPercent;
        
        // Color based on health
        if (healthPercent > 0.5) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.25) {
            this.healthBar.setFillStyle(0xffff00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }
    }
    
    checkCollisions() {
        // Player-Enemy collisions
        this.enemies.forEach(enemy => {
            const dx = this.playerData.x - enemy.x;
            const dy = this.playerData.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                this.damagePlayer(10);
                // Push enemy away
                enemy.x -= dx * 0.1;
                enemy.y -= dy * 0.1;
            }
        });
        
        // Projectile-Enemy collisions
        this.projectiles.forEach((proj, pIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 25) {
                    // Hit!
                    enemy.health -= 25;
                    proj.graphics.destroy();
                    this.projectiles.splice(pIndex, 1);
                    
                    if (enemy.health <= 0) {
                        enemy.graphics.destroy();
                        this.enemies.splice(eIndex, 1);
                        this.addScore(100);
                    }
                }
            });
        });
    }
    
    spawnEnemy() {
        if (!this.gameRunning) return;
        
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        const y = -30;
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(0, 0, 15);
        graphics.x = x;
        graphics.y = y;
        graphics.setDepth(5);
        
        this.enemies.push({
            x, y,
            graphics,
            speed: 50,
            health: 100
        });
    }
    
    damagePlayer(amount) {
        this.playerData.health -= amount;
        
        // Screen shake
        this.cameras.main.shake(100, 0.01);
        
        if (this.playerData.health <= 0) {
            this.gameOver();
        }
    }
    
    addScore(points) {
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
    }
    
    pauseGame() {
        this.gameRunning = false;
        this.scene.pause();
        
        // Show pause menu
        const pauseText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'PAUSED\n\nPress ESC to resume',
            {
                font: 'bold 32px monospace',
                fill: '#00ffff',
                align: 'center'
            }
        );
        pauseText.setOrigin(0.5);
        pauseText.setDepth(1000);
        
        this.keys.ESC.once('down', () => {
            pauseText.destroy();
            this.gameRunning = true;
            this.scene.resume();
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        
        this.scene.start('GameOverScene', {
            score: this.score,
            ship: this.selectedShip
        });
    }
}
