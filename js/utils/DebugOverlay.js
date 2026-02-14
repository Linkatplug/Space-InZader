/**
 * Debug Overlay - On-screen debug information display
 * Toggle with F3 key
 */

class DebugOverlay {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.container = null;
        this.fpsHistory = [];
        this.maxFpsHistory = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        
        // Performance tracking
        this.updateTime = 0;
        this.renderTime = 0;
        
        // Load saved state
        this.loadSettings();
        
        // Create UI
        this.createUI();
        
        // Setup keyboard listener
        this.setupKeyboardListener();
        
        // Update display regularly
        if (this.enabled) {
            this.show();
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('debugOverlayEnabled');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
        } catch (e) {
            console.warn('Could not load debug overlay settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('debugOverlayEnabled', this.enabled.toString());
        } catch (e) {
            console.warn('Could not save debug overlay settings:', e);
        }
    }

    /**
     * Setup keyboard listener for F3 toggle
     */
    setupKeyboardListener() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                this.toggle();
            }
            // Backtick/tilde key for console commands (future)
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                logger.info('DebugOverlay', 'Console commands not yet implemented');
            }
        });
    }

    /**
     * Create debug UI overlay
     */
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'debugOverlay';
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 5px;
            z-index: 10000;
            min-width: 300px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
            pointer-events: none;
        `;

        // Add sections
        this.container.innerHTML = `
            <div style="margin-bottom: 10px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
                <strong style="color: #00ffff;">DEBUG MODE (F3 to toggle)</strong>
            </div>
            <div id="debugPerformance"></div>
            <div id="debugGameState"></div>
            <div id="debugEntities"></div>
            <div id="debugPlayer"></div>
            <div id="debugLogs"></div>
        `;

        document.body.appendChild(this.container);
    }

    /**
     * Toggle debug overlay
     */
    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        
        if (this.enabled) {
            this.show();
            logger.info('DebugOverlay', 'Debug overlay enabled');
        } else {
            this.hide();
            logger.info('DebugOverlay', 'Debug overlay disabled');
        }
    }

    /**
     * Show debug overlay
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Hide debug overlay
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Update FPS calculation
     */
    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;

        if (delta > 0) {
            const currentFps = 1000 / delta;
            this.fpsHistory.push(currentFps);
            
            if (this.fpsHistory.length > this.maxFpsHistory) {
                this.fpsHistory.shift();
            }
            
            // Calculate average FPS
            const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
            this.fps = Math.round(sum / this.fpsHistory.length);
        }

        this.frameCount++;
    }

    /**
     * Update debug overlay display
     */
    update() {
        if (!this.enabled || !this.container) {
            return;
        }

        this.updateFPS();

        // Update performance section
        const perfSection = document.getElementById('debugPerformance');
        if (perfSection) {
            const minFps = this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory).toFixed(0) : 0;
            const maxFps = this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory).toFixed(0) : 0;
            
            perfSection.innerHTML = `
                <div style="margin-bottom: 5px;">
                    <strong style="color: #ffff00;">PERFORMANCE</strong><br>
                    FPS: ${this.fps} (min: ${minFps}, max: ${maxFps})<br>
                    Update: ${this.updateTime.toFixed(2)}ms<br>
                    Render: ${this.renderTime.toFixed(2)}ms<br>
                    Frame: ${this.frameCount}
                </div>
            `;
        }

        // Update game state section
        const stateSection = document.getElementById('debugGameState');
        if (stateSection && this.game.gameState) {
            const state = this.game.gameState;
            stateSection.innerHTML = `
                <div style="margin-bottom: 5px;">
                    <strong style="color: #ffff00;">GAME STATE</strong><br>
                    State: ${state.currentState}<br>
                    Time: ${state.stats.time.toFixed(1)}s<br>
                    Kills: ${state.stats.kills}<br>
                    Score: ${state.stats.score}
                </div>
            `;
        }

        // Update entities section
        const entitiesSection = document.getElementById('debugEntities');
        if (entitiesSection && this.game.world) {
            const entities = Array.from(this.game.world.entities.values());
            const byType = {};
            
            entities.forEach(entity => {
                if (entity.active) {
                    byType[entity.type] = (byType[entity.type] || 0) + 1;
                }
            });

            let entitiesHtml = '<div style="margin-bottom: 5px;"><strong style="color: #ffff00;">ENTITIES</strong><br>';
            entitiesHtml += `Total: ${entities.filter(e => e.active).length}<br>`;
            for (const [type, count] of Object.entries(byType)) {
                entitiesHtml += `${type}: ${count}<br>`;
            }
            entitiesHtml += '</div>';
            
            entitiesSection.innerHTML = entitiesHtml;
        }

        // Update player section
        const playerSection = document.getElementById('debugPlayer');
        if (playerSection && this.game.player) {
            const player = this.game.player;
            const playerComp = player.getComponent('player');
            const defense = player.getComponent('defense');
            const health = player.getComponent('health');
            const heat = player.getComponent('heat');
            const pos = player.getComponent('position');

            if (playerComp && pos) {
                let playerHtml = '<div style="margin-bottom: 5px;"><strong style="color: #ffff00;">PLAYER</strong><br>';
                
                // Defense layers (priority) or legacy health
                if (defense) {
                    const shield = defense.shield;
                    const armor = defense.armor;
                    const structure = defense.structure;
                    
                    playerHtml += '<span style="color: #00ffff;">DEFENSE LAYERS:</span><br>';
                    playerHtml += `  🛡️ Shield: ${Math.ceil(shield.current)}/${shield.max}<br>`;
                    playerHtml += `  🛡️ Armor: ${Math.ceil(armor.current)}/${armor.max}<br>`;
                    playerHtml += `  ⚙️ Structure: ${Math.ceil(structure.current)}/${structure.max}<br>`;
                } else if (health) {
                    playerHtml += `HP: ${Math.ceil(health.current)}/${health.max}<br>`;
                }
                
                // Heat
                if (heat) {
                    const heatPercent = Math.round((heat.current / heat.max) * 100);
                    const heatColor = heat.overheated ? '#ff0000' : heatPercent > 80 ? '#ff8800' : '#00ff00';
                    playerHtml += `<span style="color: ${heatColor};">🔥 Heat: ${Math.ceil(heat.current)}/${heat.max} (${heatPercent}%)</span><br>`;
                    if (heat.overheated) {
                        playerHtml += `<span style="color: #ff0000;">⚠️ OVERHEATED!</span><br>`;
                    }
                }
                
                playerHtml += `Ship: ${playerComp.shipId || 'Unknown'}<br>`;
                playerHtml += `Level: ${playerComp.level}<br>`;
                playerHtml += `XP: ${playerComp.xp}/${playerComp.xpRequired}<br>`;
                playerHtml += `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})<br>`;
                
                // Current weapon damage type
                if (playerComp.currentWeapon && playerComp.currentWeapon.damageType) {
                    const dtColors = { em: '#00ffff', kinetic: '#888888', thermal: '#ff8800', explosive: '#ff0000' };
                    const dtColor = dtColors[playerComp.currentWeapon.damageType] || '#ffffff';
                    playerHtml += `<span style="color: ${dtColor};">Damage Type: ${playerComp.currentWeapon.damageType.toUpperCase()}</span><br>`;
                }
                
                // Weapons
                playerHtml += `Weapons: ${playerComp.weapons.length}<br>`;
                if (playerComp.weapons.length > 0) {
                    playerHtml += '<span style="color: #00aaff;">Equipped:</span><br>';
                    playerComp.weapons.forEach(w => {
                        const dmgType = w.data && w.data.damageType ? ` (${w.data.damageType})` : '';
                        playerHtml += `  ${w.type} Lv${w.level}${dmgType}<br>`;
                    });
                }
                
                // Modules
                if (playerComp.modules && playerComp.modules.length > 0) {
                    playerHtml += `<span style="color: #ff00ff;">Modules: ${playerComp.modules.length}</span><br>`;
                    playerComp.modules.forEach(m => {
                        playerHtml += `  ${m}<br>`;
                    });
                }
                
                // Upgrades
                if (playerComp.upgrades && playerComp.upgrades.size > 0) {
                    playerHtml += `<span style="color: #ffaa00;">Upgrades: ${playerComp.upgrades.size}</span><br>`;
                    for (const [upgradeId, level] of playerComp.upgrades) {
                        playerHtml += `  ${upgradeId}: Lv${level}<br>`;
                    }
                }
                
                playerHtml += '</div>';
                playerSection.innerHTML = playerHtml;
            }
        }

        // Update logs section
        const logsSection = document.getElementById('debugLogs');
        if (logsSection && window.logger) {
            const recentLogs = logger.getRecentLogs(5);
            let logsHtml = '<div style="margin-bottom: 5px;"><strong style="color: #ffff00;">RECENT LOGS</strong><br>';
            
            if (recentLogs.length === 0) {
                logsHtml += '<span style="color: #888;">No recent logs</span>';
            } else {
                recentLogs.forEach(log => {
                    const color = 
                        log.level === LogLevel.ERROR ? '#ff0000' :
                        log.level === LogLevel.WARN ? '#ffaa00' :
                        log.level === LogLevel.INFO ? '#00ff00' :
                        '#888888';
                    
                    logsHtml += `<span style="color: ${color};">[${log.category}] ${log.message}</span><br>`;
                });
            }
            
            logsHtml += '</div>';
            logsSection.innerHTML = logsHtml;
        }
    }

    /**
     * Track update time
     * @param {number} time - Time in milliseconds
     */
    setUpdateTime(time) {
        this.updateTime = time;
    }

    /**
     * Track render time
     * @param {number} time - Time in milliseconds
     */
    setRenderTime(time) {
        this.renderTime = time;
    }
}

// Make it globally accessible
if (typeof window !== 'undefined') {
    window.DebugOverlay = DebugOverlay;
}
