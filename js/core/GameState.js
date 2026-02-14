/**
 * @file GameState.js
 * @description Game state machine and management
 */

const GameStates = {
    BOOT: 'BOOT',
    MENU: 'MENU',
    RUNNING: 'RUNNING',
    LEVEL_UP: 'LEVEL_UP',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    META_SCREEN: 'META_SCREEN'
};

class GameState {
    constructor() {
        this.currentState = GameStates.BOOT;
        this.previousState = null;
        
        // Game statistics
        this.stats = {
            time: 0,
            kills: 0,
            score: 0,
            highestLevel: 1,
            noyauxEarned: 0,
            damageDealt: 0,
            damageTaken: 0
        };
        
        // Selected ship
        this.selectedShip = null;
        
        // Pending level up boosts
        this.pendingBoosts = [];
    }

    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        console.log(`State changed: ${this.previousState} -> ${this.currentState}`);
    }

    isState(state) {
        return this.currentState === state;
    }

    resetStats() {
        this.stats = {
            time: 0,
            kills: 0,
            score: 0,
            highestLevel: 1,
            noyauxEarned: 0,
            damageDealt: 0,
            damageTaken: 0
        };
    }

    addKill(xpValue) {
        this.stats.kills++;
        this.stats.score += xpValue * 10;
    }

    calculateNoyaux() {
        // Calculate Noyaux based on performance
        const baseNoyaux = Math.floor(this.stats.time / 60); // 1 per minute
        const killBonus = Math.floor(this.stats.kills / 10); // 1 per 10 kills
        const levelBonus = (this.stats.highestLevel - 1) * 2;
        
        this.stats.noyauxEarned = baseNoyaux + killBonus + levelBonus;
        return this.stats.noyauxEarned;
    }
}
