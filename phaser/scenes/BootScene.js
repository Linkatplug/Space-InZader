/**
 * @file phaser/scenes/BootScene.js
 * @description Boot scene for loading assets and initialization
 */

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#00ffff'
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.add.text(width / 2, height / 2, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);
        
        // Update loading bar
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // Load any assets here (currently using procedural graphics)
        // this.load.image('player', 'assets/player.png');
    }

    create() {
        console.log('BootScene: Loading complete');
        
        // Initialize game data
        this.initializeGameData();
        
        // Move to menu scene
        this.scene.start('MenuScene');
    }
    
    initializeGameData() {
        // Make game data accessible to Phaser
        // The original JS data files will be loaded via script tags
        console.log('Game data initialized');
    }
}
