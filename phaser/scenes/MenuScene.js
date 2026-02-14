/**
 * @file phaser/scenes/MenuScene.js
 * @description Main menu scene with ship selection
 */

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Starfield background
        this.createStarfield();
        
        // Title
        const title = this.add.text(width / 2, 100, 'SPACE INZADER', {
            font: 'bold 48px monospace',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Subtitle
        const subtitle = this.add.text(width / 2, 150, 'Phaser Edition', {
            font: '20px monospace',
            fill: '#00ff00'
        });
        subtitle.setOrigin(0.5);
        
        // Ship selection
        this.createShipSelection();
        
        // Start button
        const startButton = this.add.text(width / 2, height - 100, 'START GAME', {
            font: 'bold 24px monospace',
            fill: '#00ffff',
            backgroundColor: '#000033',
            padding: { x: 20, y: 10 }
        });
        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });
        
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ffff00' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#00ffff' });
        });
        
        startButton.on('pointerdown', () => {
            this.startGame();
        });
        
        // Credits
        const credits = this.add.text(width / 2, height - 30, 'Use WASD to move | Ported to Phaser 3', {
            font: '14px monospace',
            fill: '#666666'
        });
        credits.setOrigin(0.5);
    }
    
    createStarfield() {
        // Create animated starfield
        this.stars = this.add.group();
        
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.Between(1, 3);
            
            const star = this.add.circle(x, y, size / 2, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
            this.stars.add(star);
            
            // Twinkling animation
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.2, 1),
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    createShipSelection() {
        const width = this.cameras.main.width;
        const y = 350;
        
        // Access ship data from global scope (loaded via script tags)
        const ships = window.ShipData ? window.ShipData.SHIPS : this.getDefaultShips();
        
        this.selectedShipIndex = 0;
        this.shipCards = [];
        
        const shipKeys = Object.keys(ships);
        const spacing = 250;
        const startX = width / 2 - (shipKeys.length - 1) * spacing / 2;
        
        shipKeys.forEach((key, index) => {
            const ship = ships[key];
            const x = startX + index * spacing;
            
            // Ship card container
            const card = this.add.container(x, y);
            
            // Background
            const bg = this.add.rectangle(0, 0, 180, 200, 0x001144, 0.8);
            bg.setStrokeStyle(2, 0x00ffff);
            card.add(bg);
            
            // Ship visual (simplified representation)
            const shipGraphic = this.add.graphics();
            shipGraphic.fillStyle(this.getShipColor(key), 1);
            shipGraphic.fillTriangle(0, -30, -20, 10, 20, 10);
            card.add(shipGraphic);
            
            // Ship name
            const name = this.add.text(0, 50, ship.name, {
                font: 'bold 16px monospace',
                fill: '#00ffff'
            });
            name.setOrigin(0.5);
            card.add(name);
            
            // Ship stats
            const stats = this.add.text(0, 80, 
                `HP: ${ship.baseStats.maxHealth}\nDMG: ${ship.baseStats.damage}x\nSPD: ${ship.baseStats.speed}x`,
                {
                    font: '12px monospace',
                    fill: '#ffffff',
                    align: 'center'
                }
            );
            stats.setOrigin(0.5);
            card.add(stats);
            
            // Make interactive
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                this.selectShip(index);
            });
            
            this.shipCards.push({ card, bg, key });
        });
        
        // Select first ship by default
        this.selectShip(0);
    }
    
    selectShip(index) {
        this.selectedShipIndex = index;
        
        this.shipCards.forEach((shipCard, i) => {
            if (i === index) {
                shipCard.bg.setStrokeStyle(4, 0xffff00);
                shipCard.card.setScale(1.1);
            } else {
                shipCard.bg.setStrokeStyle(2, 0x00ffff);
                shipCard.card.setScale(1);
            }
        });
    }
    
    getShipColor(shipKey) {
        const colors = {
            interceptor: 0x00ffff,
            destroyer: 0xff0000,
            cruiser: 0x00ff00,
            battleship: 0xff00ff
        };
        return colors[shipKey] || 0xffffff;
    }
    
    getDefaultShips() {
        // Fallback if ShipData not loaded
        return {
            interceptor: { name: 'Interceptor', baseStats: { maxHealth: 100, damage: 1, speed: 1 } }
        };
    }
    
    startGame() {
        const selectedShip = this.shipCards[this.selectedShipIndex];
        
        // Pass selected ship to game scene
        this.scene.start('GameScene', { 
            selectedShip: selectedShip.key 
        });
    }
}
