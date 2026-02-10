/**
 * @file DevTools.js
 * @description Developer tools overlay for testing weapons and passives
 * Press F4 or L to toggle
 */

class DevTools {
    constructor(game) {
        this.game = game;
        this.auditor = new ContentAuditor(game);
        this.visible = false;
        this.currentTab = 'weapons';
        this.searchTerm = '';
        this.container = null;
        this.godModeEnabled = false; // Track invincibility state
        
        this.setupKeyBindings();
        this.createUI();
    }

    /**
     * Setup keyboard bindings
     */
    setupKeyBindings() {
        window.addEventListener('keydown', (e) => {
            // Support both F4 and L key for toggling dev tools
            if (e.key === 'F4' || e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Toggle dev tools visibility
     */
    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Show dev tools
     */
    show() {
        if (!this.container) {
            this.createUI();
        }
        
        // Initialize auditor if needed
        if (!this.auditor.initialized) {
            this.auditor.initialize();
        }
        
        this.container.style.display = 'block';
        this.render();
        
        console.log('%c[DevTools] Opened (F4 or L to close)', 'color: #00ff00; font-weight: bold');
    }

    /**
     * Hide dev tools
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        console.log('%c[DevTools] Closed', 'color: #888');
    }

    /**
     * Create UI container
     */
    createUI() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'devtools-overlay';
        this.container.className = 'devtools-overlay';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    /**
     * Render dev tools UI
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="devtools-header">
                <h2>🛠️ DEV TOOLS <span style="font-size: 14px; opacity: 0.7;">(Press F4 or L to close)</span></h2>
                <div class="devtools-tabs">
                    <button class="devtools-tab ${this.currentTab === 'weapons' ? 'active' : ''}" onclick="window.devTools.switchTab('weapons')">
                        ⚔️ Weapons
                    </button>
                    <button class="devtools-tab ${this.currentTab === 'passives' ? 'active' : ''}" onclick="window.devTools.switchTab('passives')">
                        ✨ Passives
                    </button>
                    <button class="devtools-tab ${this.currentTab === 'utils' ? 'active' : ''}" onclick="window.devTools.switchTab('utils')">
                        🔧 Utilities
                    </button>
                    <button class="devtools-tab ${this.currentTab === 'audit' ? 'active' : ''}" onclick="window.devTools.switchTab('audit')">
                        📊 Audit
                    </button>
                </div>
            </div>
            <div class="devtools-content">
                ${this.renderTabContent()}
            </div>
        `;
    }

    /**
     * Render current tab content
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'weapons':
                return this.renderWeaponsTab();
            case 'passives':
                return this.renderPassivesTab();
            case 'utils':
                return this.renderUtilitiesTab();
            case 'audit':
                return this.renderAuditTab();
            default:
                return '<p>Unknown tab</p>';
        }
    }

    /**
     * Render weapons tab
     */
    renderWeaponsTab() {
        const weapons = this.auditor.weapons.filter(w => 
            !this.searchTerm || 
            w.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        
        return `
            <div class="devtools-search">
                <input type="text" 
                       placeholder="Search weapons..." 
                       value="${this.searchTerm}"
                       oninput="window.devTools.setSearch(this.value)">
            </div>
            <div class="devtools-list">
                ${weapons.map(w => `
                    <div class="devtools-item">
                        <div class="devtools-item-info">
                            <div class="devtools-item-name" style="color: ${w.color}">
                                ${w.name}
                            </div>
                            <div class="devtools-item-meta">
                                ${w.rarity} | Lv1-${w.maxLevel} | ${w.baseDamage} dmg | ${w.fireRate}/s
                            </div>
                            <div class="devtools-item-desc">${w.description}</div>
                            <div class="devtools-item-tags">${w.tags.join(', ')}</div>
                        </div>
                        <div class="devtools-item-actions">
                            <button class="devtools-btn" onclick="window.devTools.giveWeapon('${w.id}')">
                                Give
                            </button>
                            <button class="devtools-btn-small" onclick="window.devTools.verifyItem('weapon', '${w.id}')">
                                Test
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render passives tab
     */
    renderPassivesTab() {
        const passives = this.auditor.passives.filter(p => 
            !this.searchTerm || 
            p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        
        return `
            <div class="devtools-search">
                <input type="text" 
                       placeholder="Search passives..." 
                       value="${this.searchTerm}"
                       oninput="window.devTools.setSearch(this.value)">
            </div>
            <div class="devtools-list">
                ${passives.map(p => {
                    const effectsStr = Object.entries(p.effects)
                        .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
                        .join(', ');
                    
                    return `
                        <div class="devtools-item ${p.isMalus ? 'malus' : ''}">
                            <div class="devtools-item-info">
                                <div class="devtools-item-name" style="color: ${p.color}">
                                    ${p.icon} ${p.name} ${p.isMalus ? '⚠️' : ''}
                                </div>
                                <div class="devtools-item-meta">
                                    ${p.rarity} | Max stacks: ${p.maxStacks}
                                </div>
                                <div class="devtools-item-desc">${p.description}</div>
                                <div class="devtools-item-effects">${effectsStr}</div>
                                <div class="devtools-item-tags">${p.tags.join(', ')}</div>
                            </div>
                            <div class="devtools-item-actions">
                                <button class="devtools-btn" onclick="window.devTools.givePassive('${p.id}')">
                                    Give
                                </button>
                                <button class="devtools-btn-small" onclick="window.devTools.verifyItem('passive', '${p.id}')">
                                    Test
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render utilities tab
     */
    renderUtilitiesTab() {
        const player = this.game.world.getEntitiesByType('player')[0];
        const playerComp = player?.getComponent('player');
        const health = player?.getComponent('health');
        const waveNumber = this.game.systems.wave?.getWaveNumber() || 1;
        
        const statsHtml = playerComp ? `
            <div class="stats-grid">
                ${Object.entries(playerComp.stats).map(([key, value]) => `
                    <div class="stat-item">
                        <span class="stat-key">${key}:</span>
                        <span class="stat-value">${typeof value === 'number' ? value.toFixed(3) : value}</span>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No player found</p>';
        
        const godModeButtonStyle = this.godModeEnabled ? 
            'background: rgba(0, 255, 0, 0.2); border-color: #00ff00;' : '';
        
        return `
            <div class="devtools-utilities">
                <div class="utility-section">
                    <h3>Player Control</h3>
                    <button class="devtools-btn" style="${godModeButtonStyle}" onclick="window.devTools.toggleGodMode()">
                        ${this.godModeEnabled ? '🛡️ God Mode: ON' : '💀 God Mode: OFF'}
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.spawnDummy()">
                        Spawn Dummy Enemy
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.resetRun()">
                        Reset Run
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.setHealth(9999)">
                        Max Health
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.addXP(1000)">
                        +1000 XP
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.clearAll()">
                        Clear Weapons/Passives
                    </button>
                </div>
                
                <div class="utility-section">
                    <h3>Wave Control</h3>
                    <p style="margin: 10px 0; color: #aaa; font-size: 14px;">Current Wave: ${waveNumber}</p>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                        <input type="number" 
                               id="waveInput" 
                               min="1" 
                               max="999" 
                               value="${waveNumber}"
                               style="flex: 1; padding: 10px; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(0, 255, 255, 0.3); color: #00ffff; font-family: 'Courier New', monospace; font-size: 14px;"
                               placeholder="Wave number">
                        <button class="devtools-btn" style="width: auto; margin: 0;" onclick="window.devTools.jumpToWave(document.getElementById('waveInput').value)">
                            🚀 Jump to Wave
                        </button>
                    </div>
                    <button class="devtools-btn" onclick="window.devTools.jumpToWave(${waveNumber + 1})">
                        ⏭️ Skip to Next Wave
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.jumpToWave(${waveNumber + 5})">
                        ⏩ Skip +5 Waves
                    </button>
                </div>
                
                <div class="utility-section">
                    <h3>Weather Events</h3>
                    <button class="devtools-btn" onclick="window.devTools.spawnBlackHole()">
                        🕳️ Spawn Glass Hole
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.spawnMeteorStorm()">
                        ☄️ Spawn Meteor Storm
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.spawnMagneticStorm()">
                        ⚡ Spawn Magnetic Storm
                    </button>
                    <button class="devtools-btn" onclick="window.devTools.endWeatherEvent()">
                        ✖️ End Current Event
                    </button>
                </div>
                
                <div class="utility-section">
                    <h3>Current Stats</h3>
                    ${statsHtml}
                </div>
                
                <div class="utility-section">
                    <h3>Player Info</h3>
                    ${health ? `<p>HP: ${health.current} / ${health.max}</p>` : ''}
                    ${health && this.godModeEnabled ? `<p style="color: #00ff00;">🛡️ INVINCIBLE</p>` : ''}
                    ${playerComp ? `<p>Level: ${playerComp.level}</p>` : ''}
                    ${playerComp ? `<p>XP: ${playerComp.xp} / ${playerComp.xpToLevel}</p>` : ''}
                    ${playerComp ? `<p>Weapons: ${playerComp.weapons.length}</p>` : ''}
                    ${playerComp ? `<p>Passives: ${playerComp.passives.length}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render audit tab
     */
    renderAuditTab() {
        return `
            <div class="audit-section">
                <h3>Content Audit</h3>
                <p>Run automated verification of all weapons and passives.</p>
                <button class="devtools-btn" onclick="window.devTools.runAudit()">
                    Run Full Audit
                </button>
                <button class="devtools-btn" onclick="window.devTools.printAuditReport()">
                    Print Report to Console
                </button>
                
                <div id="audit-results" style="margin-top: 20px;">
                    <p style="opacity: 0.7;">Click "Run Full Audit" to start verification.</p>
                </div>
            </div>
        `;
    }

    /**
     * Switch to a different tab
     */
    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    }

    /**
     * Set search term
     */
    setSearch(term) {
        this.searchTerm = term;
        this.render();
    }

    /**
     * Give weapon to player
     */
    giveWeapon(weaponId) {
        try {
            this.game.addWeaponToPlayer(weaponId);
            console.log(`%c[DevTools] Gave weapon: ${weaponId}`, 'color: #00ff00');
            this.render(); // Refresh to show updated stats
        } catch (error) {
            console.error(`[DevTools] Failed to give weapon ${weaponId}:`, error);
        }
    }

    /**
     * Give passive to player
     */
    givePassive(passiveId) {
        try {
            this.game.addPassiveToPlayer(passiveId);
            console.log(`%c[DevTools] Gave passive: ${passiveId}`, 'color: #00ff00');
            this.render(); // Refresh to show updated stats
        } catch (error) {
            console.error(`[DevTools] Failed to give passive ${passiveId}:`, error);
        }
    }

    /**
     * Verify an item (weapon or passive)
     */
    verifyItem(type, id) {
        if (type === 'weapon') {
            const result = this.auditor.verifyWeapon(id);
            console.log(`%cWeapon Verification: ${id}`, 'color: #ffaa00; font-weight: bold');
            console.log('Status:', result.status);
            console.log('Checks:', result.checks);
            console.log('Warnings:', result.warnings);
        } else if (type === 'passive') {
            const result = this.auditor.verifyPassive(id);
            console.log(`%cPassive Verification: ${id}`, 'color: #ffaa00; font-weight: bold');
            console.log('Status:', result.status);
            console.log('Checks:', result.checks);
            console.log('Warnings:', result.warnings);
            
            // Also test application
            const appResult = this.auditor.testPassiveApplication(id);
            if (appResult.success) {
                console.log('%cApplication Test: SUCCESS', 'color: #00ff00');
                console.log('Changes:', appResult.changes);
            } else {
                console.log('%cApplication Test: FAILED', 'color: #ff0000');
                console.log('Error:', appResult.error);
            }
        }
    }

    /**
     * Spawn a dummy enemy for testing
     */
    spawnDummy() {
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) {
            console.error('[DevTools] No player found');
            return;
        }
        
        const playerPos = player.getComponent('position');
        const dummy = this.game.world.createEntity('enemy');
        
        dummy.addComponent('position', Components.Position(playerPos.x + 150, playerPos.y));
        dummy.addComponent('velocity', Components.Velocity(0, 0)); // Immobile
        dummy.addComponent('collision', Components.Collision(25));
        dummy.addComponent('health', Components.Health(10000, 10000)); // High HP
        dummy.addComponent('renderable', Components.Renderable('#ff00ff', 25, 'circle'));
        dummy.addComponent('enemy', {
            type: 'dummy',
            damage: 0,
            xpValue: 0,
            aiType: 'none', // No AI
            speed: 0
        });
        
        console.log('%c[DevTools] Spawned dummy enemy', 'color: #00ff00');
    }

    /**
     * Reset the current run
     */
    resetRun() {
        if (confirm('Reset current run? (This will restart the game)')) {
            this.game.gameOver();
            setTimeout(() => {
                this.game.startGame();
            }, 100);
            console.log('%c[DevTools] Run reset', 'color: #00ff00');
        }
    }

    /**
     * Set player health
     */
    setHealth(amount) {
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) return;
        
        const health = player.getComponent('health');
        if (health) {
            health.current = Math.min(amount, health.max);
            console.log(`%c[DevTools] Set health to ${health.current}`, 'color: #00ff00');
            this.render();
        }
    }

    /**
     * Add XP to player
     */
    addXP(amount) {
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) return;
        
        const playerComp = player.getComponent('player');
        if (playerComp) {
            playerComp.xp += amount;
            console.log(`%c[DevTools] Added ${amount} XP`, 'color: #00ff00');
            this.render();
        }
    }

    /**
     * Clear all weapons and passives
     */
    clearAll() {
        if (!confirm('Clear all weapons and passives?')) return;
        
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) return;
        
        const playerComp = player.getComponent('player');
        if (playerComp) {
            playerComp.weapons = [];
            playerComp.passives = [];
            this.game.recalculatePlayerStats();
            console.log('%c[DevTools] Cleared all weapons and passives', 'color: #00ff00');
            this.render();
        }
    }

    /**
     * Run full audit
     */
    runAudit() {
        const report = this.auditor.runFullAudit();
        
        const resultsDiv = document.getElementById('audit-results');
        if (resultsDiv) {
            const weaponStatus = report.weapons.fail > 0 ? '🔴' : '🟢';
            const passiveStatus = report.passives.fail > 0 ? '🔴' : '🟢';
            
            resultsDiv.innerHTML = `
                <div class="audit-summary">
                    <h4>Audit Summary</h4>
                    <p>${weaponStatus} Weapons: ${report.weapons.ok}/${report.weapons.total} OK, ${report.weapons.fail} FAIL</p>
                    <p>${passiveStatus} Passives: ${report.passives.ok}/${report.passives.total} OK, ${report.passives.fail} FAIL</p>
                    ${report.details.length > 0 ? `<p>⚠️ ${report.details.length} issues found (see console)</p>` : '<p>✅ No issues found!</p>'}
                </div>
            `;
        }
        
        console.log('%c[DevTools] Full audit complete - see report above', 'color: #00ff00');
    }

    /**
     * Print audit report to console
     */
    printAuditReport() {
        this.auditor.printReport();
    }
    
    /**
     * Spawn a black hole (glass hole) event
     */
    spawnBlackHole() {
        const weatherSystem = this.game.systems.weather;
        if (!weatherSystem) {
            console.error('[DevTools] Weather system not found');
            return;
        }
        
        // End current event if any
        if (weatherSystem.activeEvent) {
            weatherSystem.endEvent();
        }
        
        // Manually trigger black hole
        weatherSystem.activeEvent = { type: 'black_hole', duration: 12 };
        weatherSystem.showingWarning = false;
        weatherSystem.eventTimer = 12;
        weatherSystem.spawnBlackHole();
        
        if (weatherSystem.audioManager && weatherSystem.audioManager.initialized) {
            weatherSystem.audioManager.playSFX('black_hole_spawn');
        }
        
        console.log('%c[DevTools] Spawned black hole (glass hole)', 'color: #9400D3; font-weight: bold');
    }
    
    /**
     * Spawn a meteor storm event
     */
    spawnMeteorStorm() {
        const weatherSystem = this.game.systems.weather;
        if (!weatherSystem) {
            console.error('[DevTools] Weather system not found');
            return;
        }
        
        // End current event if any
        if (weatherSystem.activeEvent) {
            weatherSystem.endEvent();
        }
        
        // Manually trigger meteor storm
        weatherSystem.activeEvent = { type: 'meteor_storm', duration: 15 };
        weatherSystem.showingWarning = false;
        weatherSystem.eventTimer = 15;
        weatherSystem.meteorSpawnTimer = 0;
        
        if (weatherSystem.audioManager && weatherSystem.audioManager.initialized) {
            weatherSystem.audioManager.playSFX('meteor_warning');
        }
        
        console.log('%c[DevTools] Spawned meteor storm', 'color: #ff6600; font-weight: bold');
    }
    
    /**
     * Spawn a magnetic storm event
     */
    spawnMagneticStorm() {
        const weatherSystem = this.game.systems.weather;
        if (!weatherSystem) {
            console.error('[DevTools] Weather system not found');
            return;
        }
        
        // End current event if any
        if (weatherSystem.activeEvent) {
            weatherSystem.endEvent();
        }
        
        // Manually trigger magnetic storm
        weatherSystem.activeEvent = { type: 'magnetic_storm', duration: 5 };
        weatherSystem.showingWarning = false;
        weatherSystem.eventTimer = 5;
        weatherSystem.startMagneticStorm();
        
        if (weatherSystem.audioManager && weatherSystem.audioManager.initialized) {
            weatherSystem.audioManager.playSFX('electric');
        }
        
        console.log('%c[DevTools] Spawned magnetic storm', 'color: #9900ff; font-weight: bold');
    }
    
    /**
     * End the current weather event
     */
    endWeatherEvent() {
        const weatherSystem = this.game.systems.weather;
        if (!weatherSystem) {
            console.error('[DevTools] Weather system not found');
            return;
        }
        
        if (!weatherSystem.activeEvent) {
            console.log('%c[DevTools] No active weather event to end', 'color: #ffaa00');
            return;
        }
        
        const eventType = weatherSystem.activeEvent.type;
        weatherSystem.endEvent();
        console.log(`%c[DevTools] Ended weather event: ${eventType}`, 'color: #00ff00');
    }
    
    /**
     * Toggle god mode (invincibility)
     */
    toggleGodMode() {
        this.godModeEnabled = !this.godModeEnabled;
        
        const player = this.game.world.getEntitiesByType('player')[0];
        if (!player) {
            console.error('[DevTools] No player found');
            return;
        }
        
        const health = player.getComponent('health');
        if (health) {
            if (this.godModeEnabled) {
                // Enable god mode - make player permanently invulnerable
                health.godMode = true;
                console.log('%c[DevTools] God Mode ENABLED - Player is now invincible! 🛡️', 'color: #00ff00; font-weight: bold; font-size: 14px');
            } else {
                // Disable god mode
                health.godMode = false;
                console.log('%c[DevTools] God Mode DISABLED - Player can take damage again', 'color: #ffaa00; font-weight: bold');
            }
            this.render();
        }
    }
    
    /**
     * Jump to a specific wave
     * @param {number} waveNumber - Target wave number
     */
    jumpToWave(waveNumber) {
        const targetWave = parseInt(waveNumber);
        
        // Validate wave number (1-999 to match UI constraints)
        if (isNaN(targetWave) || targetWave < 1 || targetWave > 999) {
            console.error('[DevTools] Invalid wave number:', waveNumber);
            alert('Please enter a valid wave number (1-999)');
            return;
        }
        
        const waveSystem = this.game.systems.wave;
        if (!waveSystem) {
            console.error('[DevTools] Wave system not found');
            return;
        }
        
        // Update wave system state directly (WaveSystem doesn't provide setter methods)
        // This is acceptable in dev tools context for testing purposes
        waveSystem.waveNumber = targetWave;
        waveSystem.waveTimer = 0;
        waveSystem.isPaused = false;
        waveSystem.pauseTimer = 0;
        waveSystem.shouldSpawn = true;
        
        // Trigger wave announcement
        if (waveSystem.onWaveStart) {
            waveSystem.onWaveStart(targetWave);
        }
        
        // Clear existing enemies for clean slate
        const enemies = this.game.world.getEntitiesByType('enemy');
        enemies.forEach(enemy => {
            this.game.world.removeEntity(enemy);
        });
        
        console.log(`%c[DevTools] Jumped to wave ${targetWave}! 🚀`, 'color: #00ff00; font-weight: bold; font-size: 14px');
        
        // Refresh UI to show new wave number
        this.render();
    }
}

// Make DevTools globally accessible
window.DevTools = DevTools;
