/**
 * @file phaser/main.js
 * @description Phaser entry point - initializes the game
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('Space InZader - Phaser Edition - Initializing...');
    
    try {
        // Create Phaser game instance
        const game = new Phaser.Game(GAME_CONFIG);
        window.phaserGame = game;
        
        console.log('Space InZader - Phaser Edition - Ready!');
    } catch (error) {
        console.error('Failed to initialize Phaser game:', error);
        alert('Failed to start game. Please refresh the page.');
    }
});
