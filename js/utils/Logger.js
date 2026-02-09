/**
 * Logger utility for game debugging and logging
 * Provides different log levels and on-screen display
 */

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor() {
        this.currentLevel = LogLevel.INFO;
        this.enabled = false;
        this.maxLogs = 100;
        this.logs = [];
        this.categories = new Set();
        
        // Load settings from localStorage
        this.loadSettings();
    }

    /**
     * Load logger settings from localStorage
     */
    loadSettings() {
        try {
            const savedLevel = localStorage.getItem('debugLogLevel');
            const savedEnabled = localStorage.getItem('debugEnabled');
            
            if (savedLevel !== null) {
                this.currentLevel = parseInt(savedLevel);
            }
            if (savedEnabled !== null) {
                this.enabled = savedEnabled === 'true';
            }
        } catch (e) {
            console.warn('Could not load logger settings:', e);
        }
    }

    /**
     * Save logger settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('debugLogLevel', this.currentLevel.toString());
            localStorage.setItem('debugEnabled', this.enabled.toString());
        } catch (e) {
            console.warn('Could not save logger settings:', e);
        }
    }

    /**
     * Toggle debug mode on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        console.log(`Debug logging ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    }

    /**
     * Set log level
     * @param {number} level - Log level from LogLevel enum
     */
    setLevel(level) {
        this.currentLevel = level;
        this.saveSettings();
        console.log(`Log level set to: ${this.getLevelName(level)}`);
    }

    /**
     * Get name of log level
     * @param {number} level - Log level
     * @returns {string} Level name
     */
    getLevelName(level) {
        const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
        return names[level] || 'UNKNOWN';
    }

    /**
     * Add a log entry
     * @param {number} level - Log level
     * @param {string} category - Log category/system name
     * @param {string} message - Log message
     * @param {*} data - Optional additional data
     */
    log(level, category, message, data = null) {
        if (!this.enabled || level < this.currentLevel) {
            return;
        }

        const timestamp = Date.now();
        const entry = {
            timestamp,
            level,
            category,
            message,
            data,
            time: new Date().toLocaleTimeString()
        };

        this.logs.push(entry);
        this.categories.add(category);

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Also log to console
        const levelName = this.getLevelName(level);
        const prefix = `[${entry.time}] [${levelName}] [${category}]`;
        
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(prefix, message, data || '');
                break;
            case LogLevel.INFO:
                console.log(prefix, message, data || '');
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, data || '');
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, data || '');
                break;
        }
    }

    /**
     * Log debug message
     */
    debug(category, message, data) {
        this.log(LogLevel.DEBUG, category, message, data);
    }

    /**
     * Log info message
     */
    info(category, message, data) {
        this.log(LogLevel.INFO, category, message, data);
    }

    /**
     * Log warning message
     */
    warn(category, message, data) {
        this.log(LogLevel.WARN, category, message, data);
    }

    /**
     * Log error message
     */
    error(category, message, data) {
        this.log(LogLevel.ERROR, category, message, data);
    }

    /**
     * Get recent logs
     * @param {number} count - Number of logs to retrieve
     * @param {string} category - Optional category filter
     * @returns {Array} Recent log entries
     */
    getRecentLogs(count = 20, category = null) {
        let logs = this.logs;
        
        if (category) {
            logs = logs.filter(log => log.category === category);
        }
        
        return logs.slice(-count);
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        console.clear();
    }

    /**
     * Get all tracked categories
     * @returns {Array} List of categories
     */
    getCategories() {
        return Array.from(this.categories);
    }
}

// Create global logger instance
const logger = new Logger();

// Make it accessible globally
if (typeof window !== 'undefined') {
    window.logger = logger;
    window.LogLevel = LogLevel;
}
