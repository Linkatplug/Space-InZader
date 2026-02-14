/**
 * @file phaser/scenes/GameOverScene.js
 * @description Game over scene with stats and restart option
 */

import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.ship = data.ship || 'unknown';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        
        // Game Over title
        const title = this.add.text(width / 2, 150, 'GAME OVER', {
            font: 'bold 48px monospace',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Score
        const scoreText = this.add.text(width / 2, 250, `Final Score: ${this.finalScore}`, {
            font: 'bold 32px monospace',
            fill: '#00ffff'
        });
        scoreText.setOrigin(0.5);
        
        // Ship used
        const shipText = this.add.text(width / 2, 300, `Ship: ${this.ship}`, {
            font: '20px monospace',
            fill: '#ffffff'
        });
        shipText.setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.text(width / 2, 400, 'PLAY AGAIN', {
            font: 'bold 24px monospace',
            fill: '#00ff00',
            backgroundColor: '#003300',
            padding: { x: 20, y: 10 }
        });
        restartButton.setOrigin(0.5);
        restartButton.setInteractive({ useHandCursor: true });
        
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ fill: '#ffff00' });
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ fill: '#00ff00' });
        });
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene', { selectedShip: this.ship });
        });
        
        // Menu button
        const menuButton = this.add.text(width / 2, 470, 'MAIN MENU', {
            font: 'bold 20px monospace',
            fill: '#00ffff',
            backgroundColor: '#000033',
            padding: { x: 20, y: 10 }
        });
        menuButton.setOrigin(0.5);
        menuButton.setInteractive({ useHandCursor: true });
        
        menuButton.on('pointerover', () => {
            menuButton.setStyle({ fill: '#ffff00' });
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setStyle({ fill: '#00ffff' });
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}
