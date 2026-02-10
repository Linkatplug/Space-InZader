/**
 * @file main.js
 * @description Entry point for Space InZader game
 */

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('Space InZader - Initializing...');
    
    try {
        const game = new Game();
        window.gameInstance = game;
        
        // Initialize dev tools (F4 or L to toggle)
        if (typeof DevTools !== 'undefined') {
            window.devTools = new DevTools(game);
            console.log('%c[DevTools] Initialized - Press F4 or L to open', 'color: #00ff00; font-weight: bold');
        }
        
        console.log('Space InZader - Ready!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to start game. Please refresh the page.');
    }
});

// Handle page visibility for pause/resume
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.gameInstance) {
        if (window.gameInstance.gameState.isState(GameStates.RUNNING)) {
            window.gameInstance.pauseGame();
        }
    }
});

// Prevent context menu on canvas
document.getElementById('gameCanvas')?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

console.log('Space InZader - Scripts loaded');
