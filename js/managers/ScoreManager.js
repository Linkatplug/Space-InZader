/**
 * @file ScoreManager.js
 * @description Manages scoreboard and high score persistence
 */

class ScoreManager {
    constructor() {
        this.scores = [];
        this.maxScores = 10; // Top 10 scores
        this.storageKey = 'space_invader_scores';
        this.load();
    }

    /**
     * Load scores from localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.scores = JSON.parse(data);
                console.log('ScoreManager: Loaded', this.scores.length, 'scores');
            } else {
                this.scores = [];
            }
        } catch (error) {
            console.error('ScoreManager: Error loading scores:', error);
            this.scores = [];
        }
    }

    /**
     * Save scores to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
            console.log('ScoreManager: Saved', this.scores.length, 'scores');
        } catch (error) {
            console.error('ScoreManager: Error saving scores:', error);
        }
    }

    /**
     * Add a new score entry
     * @param {Object} scoreData - Score data
     * @param {string} scoreData.playerName - Player name
     * @param {number} scoreData.score - Final score
     * @param {number} scoreData.time - Survival time in seconds
     * @param {number} scoreData.kills - Total kills
     * @param {number} scoreData.level - Highest level reached
     * @param {number} scoreData.wave - Highest wave reached
     * @returns {number} Rank (1-10, or 0 if not in top 10)
     */
    addScore(scoreData) {
        const entry = {
            playerName: scoreData.playerName || 'Anonyme',
            score: scoreData.score || 0,
            time: scoreData.time || 0,
            kills: scoreData.kills || 0,
            level: scoreData.level || 1,
            wave: scoreData.wave || 1,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.scores.push(entry);
        
        // Sort by score (descending)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        this.scores = this.scores.slice(0, this.maxScores);
        
        this.save();
        
        // Find rank of this entry
        const rank = this.scores.findIndex(s => s.timestamp === entry.timestamp);
        return rank >= 0 ? rank + 1 : 0;
    }

    /**
     * Get top scores
     * @param {number} count - Number of scores to retrieve (default: 10)
     * @returns {Array} Array of score entries
     */
    getTopScores(count = 10) {
        return this.scores.slice(0, count);
    }

    /**
     * Check if a score qualifies for the leaderboard
     * @param {number} score - Score to check
     * @returns {boolean} True if score makes top 10
     */
    qualifiesForLeaderboard(score) {
        if (this.scores.length < this.maxScores) {
            return true;
        }
        const lowestScore = this.scores[this.scores.length - 1].score;
        return score > lowestScore;
    }

    /**
     * Clear all scores (for reset/debug)
     */
    clearScores() {
        this.scores = [];
        this.save();
        console.log('ScoreManager: All scores cleared');
    }

    /**
     * Format time for display
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format date for display
     * @param {string} isoString - ISO date string
     * @returns {string} Formatted date
     */
    static formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric'
        });
    }
}
