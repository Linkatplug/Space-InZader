/**
 * @file UISystem.js
 * @description UI management system for Space InZader
 * Handles HUD updates, menus, level-up screen, and meta-progression
 */

class UISystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
        this.waveSystem = null; // Will be set by Game.js
        
        // Cache DOM elements
        this.cacheElements();
        
        // Bind event handlers
        this.bindEvents();
        
        // Rarity colors
        this.rarityColors = {
            common: '#888',
            rare: '#4488ff',
            epic: '#aa44ff',
            legendary: '#ffaa00'
        };
        
        // Selected ship
        this.selectedShipId = null;
        
        // Double-click protection for boost selection
        this._boostPicking = false;
        
        // Options return screen tracking
        this.optionsReturnScreen = 'main';
        
        // Menu starfield animation ID
        this.menuStarfieldAnim = null;
        
        // Controls help tracking
        this.controlsShownThisGame = false;
        
        // Stats overlay toggle state
        this.statsOverlayVisible = true;
        
        // Track missing stats warnings to avoid spam
        this.missingStatsWarned = new Set();
        
        // Tactical UI state
        this.tacticalUI = {
            enabled: true,
            container: null,
            defenseUI: null,
            heatUI: null,
            weaponTypeUI: null,
            floatingTexts: []
        };
        
        // Initialize tactical UI
        this.initTacticalUI();
    }

    /**
     * Initialize tactical UI components
     */
    initTacticalUI() {
        if (!window.EnhancedUIComponents) {
            console.warn('[UI] EnhancedUIComponents not found, skipping tactical UI');
            return;
        }

        try {
            // Create container
            const container = document.createElement('div');
            container.id = 'tactical-ui-container';
            container.style.cssText = 'position:absolute;top:10px;left:10px;z-index:100;pointer-events:none;';
            document.body.appendChild(container);
            this.tacticalUI.container = container;

            // Defense UI container
            const defenseContainer = document.createElement('div');
            defenseContainer.id = 'defense-ui';
            container.appendChild(defenseContainer);

            // Heat UI container  
            const heatContainer = document.createElement('div');
            heatContainer.id = 'heat-ui';
            heatContainer.style.marginTop = '10px';
            container.appendChild(heatContainer);

            // Weapon type UI container
            const weaponContainer = document.createElement('div');
            weaponContainer.id = 'weapon-type-ui';
            weaponContainer.style.marginTop = '10px';
            container.appendChild(weaponContainer);

            // Instantiate components
            const Components = window.EnhancedUIComponents;
            this.tacticalUI.defenseUI = new Components.ThreeLayerDefenseUI(defenseContainer);
            this.tacticalUI.heatUI = new Components.HeatGaugeUI(heatContainer);
            this.tacticalUI.weaponTypeUI = new Components.WeaponDamageTypeDisplay(weaponContainer);

            // Subscribe to damage events
            if (this.world.events) {
                this.world.events.on('damageApplied', (data) => this.onDamageApplied(data));
            }

            console.log('[UI] Tactical UI components initialized');
        } catch (err) {
            console.error('[UI] Error initializing tactical UI:', err);
        }
    }

    /**
     * Toggle tactical UI visibility
     */
    toggleTacticalUI() {
        this.tacticalUI.enabled = !this.tacticalUI.enabled;
        if (this.tacticalUI.container) {
            this.tacticalUI.container.style.display = this.tacticalUI.enabled ? 'block' : 'none';
        }
        // Store state for RenderSystem to check
        if (this.world && this.world.gameState) {
            this.world.gameState.tacticalUIEnabled = this.tacticalUI.enabled;
        }
        console.log(`[UI] tactical HUD ${this.tacticalUI.enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update tactical UI components
     */
    updateTacticalUI() {
        if (!this.tacticalUI.enabled || !this.tacticalUI.defenseUI) return;

        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        try {
            // Update defense bars
            const defense = player.getComponent('defense');
            if (defense && this.tacticalUI.defenseUI) {
                this.tacticalUI.defenseUI.update(defense);
            }

            // Update heat gauge
            const heat = player.getComponent('heat');
            if (heat && this.tacticalUI.heatUI) {
                this.tacticalUI.heatUI.update(heat);
            }

            // Update weapon type display
            const playerComp = player.getComponent('player');
            if (playerComp && playerComp.currentWeapon && this.tacticalUI.weaponTypeUI) {
                const damageType = playerComp.currentWeapon.damageType || 'kinetic';
                this.tacticalUI.weaponTypeUI.update(damageType);
            }
        } catch (err) {
            console.error('[UI] Error updating tactical UI:', err);
        }
    }

    /**
     * Handle damage applied event
     */
    onDamageApplied(data) {
        this.createFloatingDamage(data);
        
        const layerEmojis = {
            shield: '🟦 BOUCLIER',
            armor: '🟫 ARMURE', 
            structure: '🔧 STRUCTURE'
        };
        const layerName = layerEmojis[data.layerHit] || data.layerHit;
        console.log(`[Combat] ${layerName} -${Math.round(data.finalDamage)}`);
    }

    /**
     * Create floating damage text
     */
    createFloatingDamage(data) {
        // Limit active floating texts
        if (this.tacticalUI.floatingTexts.length >= 10) {
            const oldest = this.tacticalUI.floatingTexts.shift();
            if (oldest && oldest.parentNode) {
                oldest.parentNode.removeChild(oldest);
            }
        }

        const text = document.createElement('div');
        text.className = 'floating-damage';
        text.textContent = `-${Math.round(data.finalDamage)}`;
        
        const typeColors = {
            em: '#00FFFF',
            thermal: '#FF8C00',
            kinetic: '#FFFFFF',
            explosive: '#FF0000'
        };
        
        const canvas = this.gameCanvas;
        let left = data.x || 0;
        let top = data.y || 0;

        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            left = rect.left + left;
            top = rect.top + top;
        }

        text.style.cssText = `
            position: fixed;
            left: ${left}px;
            top: ${top}px;
            color: ${typeColors[data.damageType] || '#FFF'};
            font-size: 20px;
            font-weight: bold;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
            z-index: 1000;
        `;

        document.body.appendChild(text);
        this.tacticalUI.floatingTexts.push(text);

        setTimeout(() => {
            if (text.parentNode) {
                text.parentNode.removeChild(text);
            }
            const index = this.tacticalUI.floatingTexts.indexOf(text);
            if (index > -1) {
                this.tacticalUI.floatingTexts.splice(index, 1);
            }
        }, 1000);
    }

    /**
     * Cache all UI DOM elements
     */
    cacheElements() {
        // Screens
        this.menuScreen = document.getElementById('menuScreen');
        this.levelUpScreen = document.getElementById('levelUpScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.metaScreen = document.getElementById('metaScreen');

        // Main menu elements
        this.mainMenu = document.getElementById('mainMenu');
        this.playBtn = document.getElementById('playBtn');
        this.scoreboardBtn = document.getElementById('scoreboardBtn');
        this.optionsBtn = document.getElementById('optionsBtn');
        this.creditsBtn = document.getElementById('creditsBtn');
        this.backToMainBtn = document.getElementById('backToMainBtn');

        // Pause menu elements
        this.pauseMenu = document.getElementById('pauseMenu');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.commandsBtn = document.getElementById('commandsBtn');
        this.pauseOptionsBtn = document.getElementById('pauseOptionsBtn');
        this.quitBtn = document.getElementById('quitBtn');

        // Commands screen elements
        this.commandsScreen = document.getElementById('commandsScreen');
        this.commandsBackBtn = document.getElementById('commandsBackBtn');

        // Options screen elements
        this.optionsScreen = document.getElementById('optionsScreen');
        this.musicSlider = document.getElementById('musicSlider');
        this.musicDown = document.getElementById('musicDown');
        this.musicUp = document.getElementById('musicUp');
        this.musicValue = document.getElementById('musicValue');
        this.sfxSlider = document.getElementById('sfxSlider');
        this.sfxDown = document.getElementById('sfxDown');
        this.sfxUp = document.getElementById('sfxUp');
        this.sfxValue = document.getElementById('sfxValue');
        this.muteToggle = document.getElementById('muteToggle');
        this.optionsBackBtn = document.getElementById('optionsBackBtn');

        // Scoreboard screen elements
        this.scoreboardScreen = document.getElementById('scoreboardScreen');
        this.scoreList = document.getElementById('scoreList');
        this.clearScoresBtn = document.getElementById('clearScoresBtn');
        this.scoreboardBackBtn = document.getElementById('scoreboardBackBtn');

        // Credits screen elements
        this.creditsScreen = document.getElementById('creditsScreen');
        this.creditsBackBtn = document.getElementById('creditsBackBtn');

        // Menu starfield canvas
        this.menuStarfield = document.getElementById('menuStarfield');

        // HUD elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.waveDisplay = document.getElementById('waveDisplay');
        this.killsDisplay = document.getElementById('killsDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.hpDisplay = document.getElementById('hpDisplay');
        this.healthFill = document.getElementById('healthFill');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.xpFill = document.getElementById('xpFill');
        this.weaponSlots = document.getElementById('weaponSlots');
        this.controlsHelp = document.getElementById('controlsHelp');
        
        // Shield elements
        this.shieldBar = document.getElementById('shieldBar');
        this.shieldFill = document.getElementById('shieldFill');
        this.shieldDisplay = document.getElementById('shieldDisplay');
        this.shieldValue = document.getElementById('shieldValue');
        
        // Heat/Overheat elements
        this.heatBar = document.getElementById('heatBar');
        this.heatFill = document.getElementById('heatFill');
        this.heatDisplay = document.getElementById('heatDisplay');
        this.heatValue = document.getElementById('heatValue');
        
        // Stats display elements
        this.statDamage = document.getElementById('statDamage');
        this.statFireRate = document.getElementById('statFireRate');
        this.statSpeed = document.getElementById('statSpeed');
        this.statArmor = document.getElementById('statArmor');
        this.statLifesteal = document.getElementById('statLifesteal');
        this.statRegen = document.getElementById('statRegen');
        
        // Game canvas (for coordinate conversion)
        this.gameCanvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
        this.statCrit = document.getElementById('statCrit');
        
        // Weapon and passive status elements
        this.weaponList = document.getElementById('weaponList');
        this.passiveList = document.getElementById('passiveList');
        
        // Stats overlay panel
        this.statsOverlayPanel = document.getElementById('statsOverlayPanel');

        // Menu elements (ship selection)
        this.shipSelection = document.getElementById('shipSelection');
        this.startButton = document.getElementById('startButton');
        this.metaButton = document.getElementById('metaButton');

        // Level up elements
        this.boostOptions = document.getElementById('boostOptions');

        // Game over elements
        this.endStats = document.getElementById('endStats');
        this.returnMenuButton = document.getElementById('returnMenuButton');

        // Meta screen elements
        this.metaUpgrades = document.getElementById('metaUpgrades');
        this.backToMenuButton = document.getElementById('backToMenuButton');
    }

    /**
     * Bind UI event handlers
     */
    bindEvents() {
        // Ship selection screen
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.onStartGame());
        }
        if (this.metaButton) {
            this.metaButton.addEventListener('click', () => this.onShowMeta());
        }
        
        // Game over screen
        if (this.returnMenuButton) {
            this.returnMenuButton.addEventListener('click', () => this.onReturnToMenu());
        }
        
        // Meta screen
        if (this.backToMenuButton) {
            this.backToMenuButton.addEventListener('click', () => this.onBackToMenu());
        }

        // Main menu buttons
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.showShipSelection());
        }
        if (this.scoreboardBtn) {
            this.scoreboardBtn.addEventListener('click', () => this.showScoreboard());
        }
        if (this.optionsBtn) {
            this.optionsBtn.addEventListener('click', () => this.showOptions('main'));
        }
        if (this.creditsBtn) {
            this.creditsBtn.addEventListener('click', () => this.showCredits());
        }

        // Back button from ship selection
        if (this.backToMainBtn) {
            this.backToMainBtn.addEventListener('click', () => this.showMainMenu());
        }

        // Pause menu buttons
        if (this.resumeBtn) {
            this.resumeBtn.addEventListener('click', () => this.hidePauseMenu());
        }
        if (this.commandsBtn) {
            this.commandsBtn.addEventListener('click', () => this.showCommands());
        }
        if (this.pauseOptionsBtn) {
            this.pauseOptionsBtn.addEventListener('click', () => this.showOptions('pause'));
        }
        if (this.quitBtn) {
            this.quitBtn.addEventListener('click', () => this.onQuitToMenu());
        }

        // Commands screen
        if (this.commandsBackBtn) {
            this.commandsBackBtn.addEventListener('click', () => this.showPauseMenu());
        }

        // Options screen - sliders
        if (this.musicSlider) {
            this.musicSlider.addEventListener('input', (e) => this.onMusicVolumeChange(e.target.value));
        }
        if (this.sfxSlider) {
            this.sfxSlider.addEventListener('input', (e) => this.onSfxVolumeChange(e.target.value));
        }

        // Options screen - volume buttons
        if (this.musicDown) {
            this.musicDown.addEventListener('click', () => this.adjustMusicVolume(-10));
        }
        if (this.musicUp) {
            this.musicUp.addEventListener('click', () => this.adjustMusicVolume(10));
        }
        if (this.sfxDown) {
            this.sfxDown.addEventListener('click', () => this.adjustSfxVolume(-10));
        }
        if (this.sfxUp) {
            this.sfxUp.addEventListener('click', () => this.adjustSfxVolume(10));
        }

        // Options screen - mute toggle
        if (this.muteToggle) {
            this.muteToggle.addEventListener('change', (e) => this.onMuteToggle(e.target.checked));
        }

        // Options screen - back button
        if (this.optionsBackBtn) {
            this.optionsBackBtn.addEventListener('click', () => this.onOptionsBack());
        }

        // Scoreboard screen
        if (this.clearScoresBtn) {
            this.clearScoresBtn.addEventListener('click', () => this.onClearScores());
        }
        if (this.scoreboardBackBtn) {
            this.scoreboardBackBtn.addEventListener('click', () => this.showMainMenu());
        }

        // Credits screen
        if (this.creditsBackBtn) {
            this.creditsBackBtn.addEventListener('click', () => this.showMainMenu());
        }
        
        // Stats overlay toggle with 'A' key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') {
                // Only toggle if game is running
                if (this.gameState && (this.gameState.currentState === GameStates.RUNNING || this.gameState.currentState === GameStates.LEVEL_UP)) {
                    this.toggleStatsOverlay();
                }
            }
            
            // Tactical UI toggle with 'U' key
            if (e.key === 'u' || e.key === 'U') {
                if (this.gameState && (this.gameState.currentState === GameStates.RUNNING || this.gameState.currentState === GameStates.LEVEL_UP)) {
                    this.toggleTacticalUI();
                }
            }
        });
    }

    /**
     * Update UI based on game state
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        const state = this.gameState.currentState;

        // Update HUD when game is running
        if (state === GameStates.RUNNING || state === GameStates.LEVEL_UP) {
            this.updateHUD();
            this.updateTacticalUI();
        }
    }

    /**
     * Update HUD elements
     */
    updateHUD() {
        const player = this.world.getEntitiesByType('player')[0];
        if (!player) return;

        const playerComp = player.getComponent('player');
        const health = player.getComponent('health');

        if (playerComp) {
            // Update time
            const minutes = Math.floor(this.gameState.stats.time / 60);
            const seconds = Math.floor(this.gameState.stats.time % 60);
            this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Update wave display
            if (this.waveSystem && this.waveDisplay) {
                this.waveDisplay.textContent = this.waveSystem.getWaveNumber();
            }

            // Update kills and score
            this.killsDisplay.textContent = this.gameState.stats.kills;
            this.scoreDisplay.textContent = this.gameState.stats.score;

            // Update level and XP
            this.levelDisplay.textContent = playerComp.level;
            const xpPercent = (playerComp.xp / playerComp.xpRequired) * 100;
            this.xpFill.style.width = `${Math.min(100, xpPercent)}%`;
            
            // Update real-time stats display with safe access (nullish coalescing)
            if (playerComp.stats) {
                const stats = playerComp.stats;
                const damageMultiplier = stats.damageMultiplier ?? 1;
                const fireRateMultiplier = stats.fireRateMultiplier ?? 1;
                const speed = stats.speed ?? 1;
                const armor = stats.armor ?? 0;
                const lifesteal = stats.lifesteal ?? 0;
                const healthRegen = stats.healthRegen ?? 0;
                const critChance = stats.critChance ?? 0;
                
                this.statDamage.textContent = `${Math.round(damageMultiplier * 100)}%`;
                this.statFireRate.textContent = `${Math.round(fireRateMultiplier * 100)}%`;
                this.statSpeed.textContent = `${Math.round(speed)}`;
                this.statArmor.textContent = `${Math.round(armor)}`;
                this.statLifesteal.textContent = `${Math.round(lifesteal * 100)}%`;
                this.statRegen.textContent = `${healthRegen.toFixed(1)}/s`;
                this.statCrit.textContent = `${Math.round(critChance * 100)}%`;
            }
        }

        if (health) {
            // Update health
            this.hpDisplay.textContent = `${Math.ceil(health.current)}/${health.max}`;
            const healthPercent = (health.current / health.max) * 100;
            this.healthFill.style.width = `${Math.max(0, healthPercent)}%`;
        }
        
        // Update shield
        const shield = player.getComponent('shield');
        if (shield && shield.max > 0) {
            this.shieldBar.style.display = 'block';
            this.shieldDisplay.style.display = 'block';
            this.shieldValue.textContent = `${Math.ceil(shield.current)}/${shield.max}`;
            const shieldPercent = (shield.current / shield.max) * 100;
            this.shieldFill.style.width = `${Math.max(0, shieldPercent)}%`;
        } else {
            this.shieldBar.style.display = 'none';
            this.shieldDisplay.style.display = 'none';
        }
        
        // Update heat/overheat gauge
        if (this.heatBar && this.heatFill && this.heatDisplay) {
            const heat = playerComp?.heat ?? 0;
            const heatMax = playerComp?.heatMax ?? 100;
            
            if (heatMax > 0 && heat > 0) {
                this.heatBar.style.display = 'block';
                this.heatDisplay.style.display = 'block';
                this.heatValue.textContent = `${Math.ceil(heat)}/${heatMax}`;
                const heatPercent = (heat / heatMax) * 100;
                this.heatFill.style.width = `${Math.max(0, Math.min(100, heatPercent))}%`;
                
                // Change color based on heat level
                if (heatPercent >= 80) {
                    this.heatFill.style.background = 'linear-gradient(to right, #ff4444, #ff0000)';
                } else if (heatPercent >= 50) {
                    this.heatFill.style.background = 'linear-gradient(to right, #ffaa00, #ff6600)';
                } else {
                    this.heatFill.style.background = 'linear-gradient(to right, #ffcc00, #ff9900)';
                }
            } else {
                this.heatBar.style.display = 'none';
                this.heatDisplay.style.display = 'none';
            }
        }

        // Update weapon display
        this.updateWeaponDisplay(playerComp);
        
        // Update passive display
        this.updatePassiveDisplay(playerComp);
        
        // Update synergy display
        this.updateSynergyDisplay();
        
        // Update weather warning
        this.updateWeatherWarning();
        
        // Update magnetic storm status (during active event)
        this.updateMagneticStormStatus();
        
        // Update stats overlay (deltas)
        this.updateStatsOverlay(playerComp, health);
    }
    
    /**
     * Update synergy HUD display
     */
    updateSynergyDisplay() {
        if (!window.game || !window.game.synergySystem) return;
        
        const activeSynergies = window.game.synergySystem.getActiveSynergies();
        
        // Get or create synergy container
        let synergyContainer = document.getElementById('synergyDisplay');
        if (!synergyContainer) {
            synergyContainer = document.createElement('div');
            synergyContainer.id = 'synergyDisplay';
            synergyContainer.style.cssText = `
                position: absolute;
                top: 60px;
                left: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                pointer-events: none;
            `;
            document.getElementById('ui').appendChild(synergyContainer);
        }
        
        // Clear and rebuild
        synergyContainer.innerHTML = '';
        
        if (activeSynergies.length === 0) return;
        
        activeSynergies.forEach(({ synergy, count, threshold }) => {
            const badge = document.createElement('div');
            const color = threshold === 4 ? '#FFD700' : '#00FFFF';
            
            badge.style.cssText = `
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid ${color};
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                color: ${color};
                text-shadow: 0 0 5px ${color};
                box-shadow: 0 0 10px ${color}40;
            `;
            
            badge.textContent = `${synergy.name} ${count}/${threshold}`;
            synergyContainer.appendChild(badge);
        });
    }

    /**
     * Update weapon display in HUD
     * @param {Object} playerComp - Player component
     */
    updateWeaponDisplay(playerComp) {
        if (!playerComp || !playerComp.weapons || !this.weaponList) return;

        this.weaponList.innerHTML = '';
        
        playerComp.weapons.forEach((weapon, index) => {
            const weaponDiv = document.createElement('div');
            weaponDiv.className = 'weapon-item';
            
            const weaponData = weapon.data;
            const weaponName = weaponData?.name || weapon.type || 'Unknown';
            const level = weapon.level || 1;
            const maxLevel = weaponData?.maxLevel || 8;
            const rarity = weaponData?.rarity || 'common';
            
            // Get rarity color
            const rarityColor = this.rarityColors[rarity] || '#888';
            
            // Format weapon info
            weaponDiv.innerHTML = `
                <span style="color: ${rarityColor};">${weaponName}</span> 
                <span style="color: #00ff00;">Lv${level}/${maxLevel}</span>
            `;
            this.weaponList.appendChild(weaponDiv);
        });
    }
    
    /**
     * Update passive display
     */
    updatePassiveDisplay(playerComp) {
        if (!playerComp || !playerComp.passives || !this.passiveList) return;
        
        this.passiveList.innerHTML = '';
        
        // Get unique passives with stacks
        const passiveMap = new Map();
        playerComp.passives.forEach(passive => {
            const key = passive.type || passive.id;
            if (passiveMap.has(key)) {
                passiveMap.get(key).stacks++;
            } else {
                passiveMap.set(key, {
                    ...passive,
                    stacks: 1
                });
            }
        });
        
        // Display passives
        passiveMap.forEach((passive, key) => {
            const passiveDiv = document.createElement('div');
            passiveDiv.className = 'passive-item';
            
            const passiveData = passive.data;
            const name = passiveData?.name || passive.type || key;
            const rarity = passiveData?.rarity || 'common';
            const rarityColor = this.rarityColors[rarity] || '#888';
            
            const stackText = passive.stacks > 1 ? ` x${passive.stacks}` : '';
            
            passiveDiv.innerHTML = `<span style="color: ${rarityColor};">${name}${stackText}</span>`;
            this.passiveList.appendChild(passiveDiv);
        });
    }

    /**
     * Show screen by name
     * @param {string} screen - Screen name ('menu', 'game', 'levelup', 'gameover', 'meta')
     */
    showScreen(screen) {
        switch (screen) {
            case 'menu':
                this.showMainMenu();
                break;
            case 'game':
                this.hideAllScreens();
                this.showHUD();
                break;
            case 'levelup':
                // Handled by showLevelUp
                break;
            case 'gameover':
                this.showGameOver();
                break;
            case 'meta':
                this.showMetaScreen();
                break;
        }
    }

    /**
     * Show main menu and start starfield animation
     */
    showMainMenu() {
        this.hideAllScreens();
        this.hideHUD();
        if (this.mainMenu) {
            this.mainMenu.classList.add('active');
        }
        this.startMenuStarfield();
        if (window.game?.audioManager) {
            window.game.audioManager.setMusicTheme('calm');
        }
    }

    /**
     * Hide main menu
     */
    hideMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.classList.remove('active');
        }
        this.stopMenuStarfield();
    }

    /**
     * Show ship selection screen
     */
    showShipSelection() {
        this.hideAllScreens();
        this.stopMenuStarfield();
        if (this.menuScreen) {
            this.menuScreen.classList.add('active');
        }
        this.renderShipSelection();
    }

    /**
     * Show pause menu
     */
    showPauseMenu() {
        if (window.game?.gameState) {
            window.game.gameState.setState(GameStates.PAUSED);
        }
        // Hide other screens first
        this.hideAllScreens();
        if (this.pauseMenu) {
            this.pauseMenu.classList.add('active');
        }
    }

    /**
     * Hide pause menu
     */
    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.classList.remove('active');
        }
        // Resume the game properly
        if (window.game && window.game.gameState.isState(GameStates.PAUSED)) {
            window.game.resumeGame();
        }
    }

    /**
     * Show commands screen
     */
    showCommands() {
        this.hideAllScreens();
        if (this.commandsScreen) {
            this.commandsScreen.classList.add('active');
        }
    }

    /**
     * Show options screen
     * @param {string} returnScreen - Screen to return to ('main', 'pause', etc.)
     */
    showOptions(returnScreen = 'main') {
        this.optionsReturnScreen = returnScreen;
        this.hideAllScreens();
        if (this.optionsScreen) {
            this.optionsScreen.classList.add('active');
        }
        this.loadOptionsValues();
    }

    /**
     * Load current audio settings into options UI
     */
    loadOptionsValues() {
        const audio = window.game?.audioManager;
        if (audio) {
            const musicVol = Math.round(audio.musicVolume * 100);
            const sfxVol = Math.round(audio.sfxVolume * 100);
            
            if (this.musicSlider) this.musicSlider.value = musicVol;
            if (this.musicValue) this.musicValue.textContent = musicVol + '%';
            if (this.sfxSlider) this.sfxSlider.value = sfxVol;
            if (this.sfxValue) this.sfxValue.textContent = sfxVol + '%';
            if (this.muteToggle) this.muteToggle.checked = audio.muted;
        }
    }

    /**
     * Show scoreboard screen
     */
    showScoreboard() {
        this.hideAllScreens();
        if (this.scoreboardScreen) {
            this.scoreboardScreen.classList.add('active');
        }
        this.renderScoreboard();
    }

    /**
     * Render scoreboard entries
     */
    renderScoreboard() {
        if (!this.scoreList) return;
        
        const scoreManager = window.game?.scoreManager;
        if (!scoreManager) {
            this.scoreList.innerHTML = '<div style="color:#666;text-align:center;padding:40px;font-size:20px;">Score Manager not available</div>';
            return;
        }
        
        const scores = scoreManager.getTopScores(10);
        
        if (scores.length === 0) {
            this.scoreList.innerHTML = '<div style="color:#0ff;text-align:center;padding:40px;font-size:22px;text-shadow:0 0 10px #0ff;">Aucun score enregistré.<br><br>Jouez pour établir un record!</div>';
            return;
        }
        
        // Create table structure
        let tableHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:20px;">
                <thead>
                    <tr style="border-bottom:2px solid #0ff;color:#0ff;text-shadow:0 0 10px #0ff;">
                        <th style="padding:10px;text-align:left;">Rang</th>
                        <th style="padding:10px;text-align:left;">Nom</th>
                        <th style="padding:10px;text-align:right;">Score</th>
                        <th style="padding:10px;text-align:center;">Vague</th>
                        <th style="padding:10px;text-align:center;">Temps</th>
                        <th style="padding:10px;text-align:right;">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        scores.forEach((entry, index) => {
            const rank = index + 1;
            const date = new Date(entry.date);
            const timeStr = Math.floor(entry.time / 60) + ':' + String(Math.floor(entry.time % 60)).padStart(2, '0');
            
            // Color based on rank
            let rankColor = '#fff';
            if (rank === 1) rankColor = '#ffd700'; // Gold
            else if (rank === 2) rankColor = '#c0c0c0'; // Silver
            else if (rank === 3) rankColor = '#cd7f32'; // Bronze
            else rankColor = '#0ff'; // Cyan for others
            
            const rowStyle = `
                border-bottom:1px solid #333;
                color:${rankColor};
                text-shadow:0 0 5px ${rankColor};
            `;
            
            tableHTML += `
                <tr style="${rowStyle}">
                    <td style="padding:12px;text-align:left;font-weight:bold;">#${rank}</td>
                    <td style="padding:12px;text-align:left;">${entry.playerName}</td>
                    <td style="padding:12px;text-align:right;font-weight:bold;">${entry.score.toLocaleString()}</td>
                    <td style="padding:12px;text-align:center;">${entry.wave}</td>
                    <td style="padding:12px;text-align:center;">${timeStr}</td>
                    <td style="padding:12px;text-align:right;font-size:16px;">${date.toLocaleDateString()}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        this.scoreList.innerHTML = tableHTML;
    }

    /**
     * Show credits screen
     */
    showCredits() {
        this.hideAllScreens();
        if (this.creditsScreen) {
            this.creditsScreen.classList.add('active');
        }
    }

    /**
     * Start menu starfield animation
     */
    startMenuStarfield() {
        const canvas = this.menuStarfield;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const stars = [];
        const starCount = 150;
        
        // Initialize stars
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 0.2 + Math.random() * 0.8,
                size: 1 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.7
            });
        }
        
        const animate = () => {
            if (!this.mainMenu || !this.mainMenu.classList.contains('active')) {
                cancelAnimationFrame(this.menuStarfieldAnim);
                this.menuStarfieldAnim = null;
                return;
            }
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                star.y += star.speed;
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
                
                ctx.fillStyle = `rgba(0, 255, 255, ${star.opacity})`;
                ctx.fillRect(star.x, star.y, star.size, star.size);
            });
            
            this.menuStarfieldAnim = requestAnimationFrame(animate);
        };
        
        this.menuStarfieldAnim = requestAnimationFrame(animate);
    }

    /**
     * Stop menu starfield animation
     */
    stopMenuStarfield() {
        if (this.menuStarfieldAnim) {
            cancelAnimationFrame(this.menuStarfieldAnim);
            this.menuStarfieldAnim = null;
        }
    }

    /**
     * Check if a screen is currently active
     * @param {string} screenId - ID of the screen to check
     * @returns {boolean}
     */
    isScreenActive(screenId) {
        const screen = document.getElementById(screenId);
        return screen ? screen.classList.contains('active') : false;
    }

    /**
     * Handle music volume change
     * @param {number} value - Volume value (0-100)
     */
    onMusicVolumeChange(value) {
        const audio = window.game?.audioManager;
        if (audio) {
            audio.setMusicVolume(value / 100);
            if (this.musicValue) {
                this.musicValue.textContent = value + '%';
            }
        }
    }

    /**
     * Handle SFX volume change
     * @param {number} value - Volume value (0-100)
     */
    onSfxVolumeChange(value) {
        const audio = window.game?.audioManager;
        if (audio) {
            audio.setSfxVolume(value / 100);
            if (this.sfxValue) {
                this.sfxValue.textContent = value + '%';
            }
        }
    }

    /**
     * Adjust music volume by delta
     * @param {number} delta - Volume change amount
     */
    adjustMusicVolume(delta) {
        const audio = window.game?.audioManager;
        if (audio && this.musicSlider) {
            const currentVol = parseInt(this.musicSlider.value);
            const newVol = Math.max(0, Math.min(100, currentVol + delta));
            this.musicSlider.value = newVol;
            this.onMusicVolumeChange(newVol);
        }
    }

    /**
     * Adjust SFX volume by delta
     * @param {number} delta - Volume change amount
     */
    adjustSfxVolume(delta) {
        const audio = window.game?.audioManager;
        if (audio && this.sfxSlider) {
            const currentVol = parseInt(this.sfxSlider.value);
            const newVol = Math.max(0, Math.min(100, currentVol + delta));
            this.sfxSlider.value = newVol;
            this.onSfxVolumeChange(newVol);
        }
    }

    /**
     * Handle mute toggle
     * @param {boolean} muted - Mute state
     */
    onMuteToggle(muted) {
        const audio = window.game?.audioManager;
        if (audio) {
            audio.setMuted(muted);
        }
    }

    /**
     * Handle options back button
     */
    onOptionsBack() {
        if (this.optionsReturnScreen === 'pause') {
            this.showPauseMenu();
        } else {
            this.showMainMenu();
        }
    }

    /**
     * Handle clear scores button
     */
    onClearScores() {
        const saveManager = window.game?.saveManager;
        if (saveManager && confirm('Are you sure you want to clear all scores?')) {
            saveManager.clearScoreboard();
            this.renderScoreboard();
        }
    }

    /**
     * Handle quit to menu from pause
     */
    onQuitToMenu() {
        this.hidePauseMenu();
        this.hideHUD();
        this.gameState.setState(GameStates.MENU);
        this.showMainMenu();
        
        // Dispatch event for game to handle
        const event = new CustomEvent('returnToMenu');
        document.dispatchEvent(event);
    }

    /**
     * Render ship selection UI
     */
    renderShipSelection() {
        this.shipSelection.innerHTML = '';

        const ships = window.ShipData && window.ShipData.SHIPS ? Object.values(window.ShipData.SHIPS) : [];
        
        if (ships.length === 0) {
            console.error('No ships found in ShipData.SHIPS');
            return;
        }

        ships.forEach(ship => {
            const card = document.createElement('div');
            card.className = 'ship-card';
            card.dataset.shipId = ship.id;
            
            if (!this.selectedShipId) {
                this.selectedShipId = ship.id;
                card.classList.add('selected');
                window.dispatchEvent(new CustomEvent('shipSelected', { 
                    detail: { ship: ship.id } 
                }));
            } else if (this.selectedShipId === ship.id) {
                card.classList.add('selected');
            }

            const damageTypeColors = {
                em: '#00FFFF',
                kinetic: '#FFFFFF',
                explosive: '#FF0000',
                thermal: '#FF8C00'
            };
            const damageColor = damageTypeColors[ship.dominantDamageType] || '#FFFFFF';

            card.innerHTML = `
                <h3 style="margin-bottom: 8px; text-align: center;">${ship.icon} ${ship.name}</h3>
                <div style="text-align:center; margin-bottom:8px;">
                    <span style="background:${damageColor}; color:#000; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:bold;">${ship.dominantDamageType.toUpperCase()}</span>
                </div>
                <div style="margin-bottom: 8px; font-size: 11px; opacity: 0.9;">
                    ${ship.role}
                </div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedShipId = ship.id;
                
                window.dispatchEvent(new CustomEvent('shipSelected', { 
                    detail: { ship: ship.id } 
                }));
            });

            this.shipSelection.appendChild(card);
        });
    }

    /**
     * Get default ships if data not available
     * @returns {Array}
     */
    getDefaultShips() {
        return [
            {
                id: 'equilibre',
                name: 'Équilibré',
                description: 'Bon en tout, parfait pour débuter',
                baseStats: { maxHealth: 100, damageMultiplier: 1.0, speed: 210 },
                color: '#9370DB',
                difficulty: 'easy'
            },
            {
                id: 'defenseur',
                name: 'Défenseur',
                description: 'Plus de HP, meilleure survie',
                baseStats: { maxHealth: 120, damageMultiplier: 1.0, speed: 200 },
                color: '#00BFFF',
                difficulty: 'easy'
            }
        ];
    }

    /**
     * Show level up screen with boost options
     * @param {Array} boosts - Available boost options
     */
    showLevelUp(boosts, rerollsRemaining = 0) {
        this.hideAllScreens();
        this.levelUpScreen.classList.add('active');
        this.renderBoostOptions(boosts, rerollsRemaining);
    }

    /**
     * Render boost selection options
     * @param {Array} boosts - Available boosts
     * @param {number} rerollsRemaining - Number of rerolls left
     */
    renderBoostOptions(boosts, rerollsRemaining = 0) {
        this.boostOptions.innerHTML = '';
        
        // Filter out null/undefined boosts to prevent empty cards
        const validBoosts = boosts.filter(boost => boost != null);
        
        if (validBoosts.length === 0) {
            console.error('UISystem: No valid boosts to display!');
            return;
        }

        validBoosts.forEach((boost, index) => {
            const card = document.createElement('div');
            card.className = `boost-card ${boost.rarity || 'common'}`;
            
            const rarityColor = this.rarityColors[boost.rarity || 'common'];
            
            // Special styling for keystones
            const isKeystone = boost.isKeystone || boost.uniquePerRun;
            
            card.innerHTML = `
                ${isKeystone ? '<div style="color: #FFD700; font-size: 24px; margin-bottom: 5px;">⭐</div>' : ''}
                <div class="boost-name" style="color: ${rarityColor};">
                    ${boost.name || boost.data?.name}
                </div>
                <div style="font-size: 11px; color: ${rarityColor}; margin-bottom: 8px; text-transform: uppercase;">
                    ${isKeystone ? 'KEYSTONE' : (boost.rarity || 'common')}
                </div>
                <div class="boost-description">
                    ${boost.description || boost.data?.description}
                </div>
                ${boost.currentLevel ? `
                    <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
                        Current Level: ${boost.currentLevel}/${boost.maxLevel || 5}
                    </div>
                ` : ''}
            `;

            card.addEventListener('click', () => {
                this.onBoostSelected(boost, index);
            });

            this.boostOptions.appendChild(card);
        });
        
        // Add reroll button if rerolls available
        if (rerollsRemaining > 0) {
            const rerollBtn = document.createElement('button');
            rerollBtn.className = 'button';
            rerollBtn.style.marginTop = '20px';
            rerollBtn.textContent = `REROLL (${rerollsRemaining} LEFT)`;
            rerollBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('rerollBoosts'));
            });
            this.boostOptions.appendChild(rerollBtn);
        }
    }

    /**
     * Handle boost selection
     * @param {Object} boost - Selected boost
     * @param {number} index - Boost index
     */
    onBoostSelected(boost, index) {
        // Double-click protection
        if (this._boostPicking) {
            logger.warn('UISystem', 'Boost selection already in progress, ignoring');
            return;
        }
        
        // Lock boost selection
        this._boostPicking = true;
        
        // Disable pointer events on all boost cards immediately
        const cards = document.querySelectorAll('.boost-card');
        cards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.5';
        });
        
        logger.info('UISystem', `Boost selected: ${boost?.name || 'unknown'}`);
        
        // Dispatch custom event for game to handle
        const event = new CustomEvent('boostSelected', { detail: { boost, index } });
        window.dispatchEvent(event);

        // Hide level up screen
        this.levelUpScreen.classList.remove('active');
        
        // Unlock after 250ms (safety delay)
        setTimeout(() => {
            this._boostPicking = false;
            logger.debug('UISystem', 'Boost selection unlocked');
        }, 250);
    }

    /**
     * Show game over screen with statistics
     */
    showGameOver() {
        this.hideAllScreens();
        this.gameOverScreen.classList.add('active');
        this.renderEndStats();
    }

    /**
     * Render end-of-run statistics (in French)
     */
    renderEndStats() {
        const stats = this.gameState.stats;
        const credits = this.gameState.calculateNoyaux();
        const waveNumber = window.game?.systems?.wave?.getWaveNumber() || 1;

        const minutes = Math.floor(stats.time / 60);
        const seconds = Math.floor(stats.time % 60);

        this.endStats.innerHTML = `
            <div class="stat-line">
                <span>Temps de Survie:</span>
                <span style="color: #00ffff;">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="stat-line">
                <span>Vague Atteinte:</span>
                <span style="color: #00ffff;">${waveNumber}</span>
            </div>
            <div class="stat-line">
                <span>Ennemis Éliminés:</span>
                <span style="color: #00ffff;">${stats.kills}</span>
            </div>
            <div class="stat-line">
                <span>Score Final:</span>
                <span style="color: #00ffff;">${stats.score}</span>
            </div>
            <div class="stat-line">
                <span>Niveau Maximum:</span>
                <span style="color: #00ffff;">${stats.highestLevel}</span>
            </div>
            <div class="stat-line">
                <span>Dégâts Infligés:</span>
                <span style="color: #ff6600;">${Math.floor(stats.damageDealt)}</span>
            </div>
            <div class="stat-line">
                <span>Dégâts Subis:</span>
                <span style="color: #ff0000;">${Math.floor(stats.damageTaken)}</span>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #00ffff;">
                <div class="stat-line" style="font-size: 20px; font-weight: bold;">
                    <span>Crédits Gagnés:</span>
                    <span style="color: #ffaa00;">⬡ ${credits}</span>
                </div>
            </div>
        `;
    }

    /**
     * Show meta-progression screen
     */
    showMetaScreen() {
        this.hideAllScreens();
        this.metaScreen.classList.add('active');
        this.renderMetaUpgrades();
    }

    /**
     * Render meta-progression upgrade tree
     */
    renderMetaUpgrades() {
        // Placeholder for meta upgrades
        // In a full implementation, this would show upgradeable stats
        this.metaUpgrades.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3 style="color: #ffaa00; margin-bottom: 20px;">⬡ Meta Progression ⬡</h3>
                <p style="margin-bottom: 20px;">Permanent upgrades using Noyaux</p>
                <div style="font-size: 14px; opacity: 0.7;">
                    <p>Available Noyaux: <span style="color: #ffaa00; font-weight: bold;">0</span></p>
                    <p style="margin-top: 20px;">Coming Soon: Permanent stat upgrades, ship unlocks, and more!</p>
                </div>
            </div>
        `;
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        if (this.mainMenu) this.mainMenu.classList.remove('active');
        if (this.menuScreen) this.menuScreen.classList.remove('active');
        if (this.levelUpScreen) this.levelUpScreen.classList.remove('active');
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('active');
        if (this.metaScreen) this.metaScreen.classList.remove('active');
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.commandsScreen) this.commandsScreen.classList.remove('active');
        if (this.optionsScreen) this.optionsScreen.classList.remove('active');
        if (this.scoreboardScreen) this.scoreboardScreen.classList.remove('active');
        if (this.creditsScreen) this.creditsScreen.classList.remove('active');
    }

    /**
     * Show HUD elements
     */
    showHUD() {
        const hudElements = [
            document.getElementById('hudTopLeft'),
            document.getElementById('hudTopCenter'),
            document.getElementById('hudBottomLeft'),
            document.getElementById('hudBottomCenter'),
            document.getElementById('hudBottomRight')
        ];

        hudElements.forEach(el => {
            if (el) el.style.display = 'block';
        });
        
        // Don't show controls automatically - only on wave 1
    }

    /**
     * Hide HUD elements
     */
    hideHUD() {
        const hudElements = [
            document.getElementById('hudTopLeft'),
            document.getElementById('hudTopCenter'),
            document.getElementById('hudBottomLeft'),
            document.getElementById('hudBottomCenter'),
            document.getElementById('hudBottomRight')
        ];

        hudElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        // Hide controls help
        if (this.controlsHelp) {
            this.controlsHelp.classList.remove('active');
        }
    }

    /**
     * Event handler: Start game
     */
    onStartGame() {
        if (!this.selectedShipId) {
            console.warn('No ship selected');
            return;
        }

        this.gameState.selectedShip = this.selectedShipId;
        
        // Dispatch custom event for game to handle
        const event = new CustomEvent('startGame', { detail: { shipId: this.selectedShipId } });
        document.dispatchEvent(event);
    }

    /**
     * Event handler: Show meta screen
     */
    onShowMeta() {
        this.showMetaScreen();
    }

    /**
     * Event handler: Return to menu from game over
     */
    onReturnToMenu() {
        this.gameState.setState(GameStates.MENU);
        this.showMainMenu();
        this.hideHUD();
        
        // Dispatch event for game to handle
        const event = new CustomEvent('returnToMenu');
        document.dispatchEvent(event);
    }

    /**
     * Event handler: Back to menu from meta screen
     */
    onBackToMenu() {
        this.showMainMenu();
    }

    /**
     * Generate random boosts for level up
     * @param {Object} playerComp - Player component
     * @param {number} count - Number of boosts to generate
     * @returns {Array}
     */
    generateRandomBoosts(playerComp, count = 3) {
        const availableBoosts = this.getAvailableBoosts(playerComp);
        const selectedBoosts = [];

        // Shuffle and select random boosts
        for (let i = 0; i < Math.min(count, availableBoosts.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableBoosts.length);
            const boost = availableBoosts.splice(randomIndex, 1)[0];
            
            // Determine rarity based on luck
            boost.rarity = this.determineRarity(playerComp.stats.luck || 0);
            
            selectedBoosts.push(boost);
        }

        return selectedBoosts;
    }

    /**
     * Get available boosts based on player state
     * @param {Object} playerComp - Player component
     * @returns {Array}
     */
    getAvailableBoosts(playerComp) {
        // Default boosts if no data available
        const defaultBoosts = [
            {
                name: 'Damage +10%',
                description: 'Increase damage by 10%',
                type: 'stat',
                stat: 'damage',
                value: 0.1
            },
            {
                name: 'Fire Rate +10%',
                description: 'Increase fire rate by 10%',
                type: 'stat',
                stat: 'fireRate',
                value: 0.1
            },
            {
                name: 'Max HP +10',
                description: 'Increase maximum health by 10',
                type: 'stat',
                stat: 'maxHealth',
                value: 10
            },
            {
                name: 'Speed +10%',
                description: 'Increase movement speed by 10%',
                type: 'stat',
                stat: 'speed',
                value: 0.1
            },
            {
                name: 'Critical Chance +5%',
                description: 'Increase critical hit chance by 5%',
                type: 'stat',
                stat: 'critChance',
                value: 0.05
            }
        ];

        return [...defaultBoosts];
    }

    /**
     * Determine boost rarity based on luck
     * @param {number} luck - Player luck value
     * @returns {string}
     */
    determineRarity(luck) {
        const rand = Math.random() + (luck * 0.1);

        if (rand > 0.95) return 'legendary';
        if (rand > 0.80) return 'epic';
        if (rand > 0.60) return 'rare';
        return 'common';
    }

    /**
     * Show notification message
     * @param {string} message - Message text
     * @param {string} color - Message color
     */
    showNotification(message, color = '#00ffff') {
        const notification = document.createElement('div');
        notification.style.position = 'absolute';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.padding = '20px 40px';
        notification.style.background = 'rgba(10, 10, 26, 0.95)';
        notification.style.border = `2px solid ${color}`;
        notification.style.color = color;
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.textShadow = `0 0 10px ${color}`;
        notification.style.zIndex = '1000';
        notification.style.pointerEvents = 'none';
        notification.textContent = message;

        document.getElementById('ui').appendChild(notification);

        // Fade out and remove
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    /**
     * Show wave announcement
     * @param {number} waveNumber - Current wave number
     */
    showWaveAnnouncement(waveNumber) {
        const announcement = document.createElement('div');
        announcement.style.position = 'fixed';
        announcement.style.top = '35%';  // Positioned slightly above center
        announcement.style.left = '50%';
        announcement.style.transform = 'translate(-50%, -50%)';
        announcement.style.padding = '10px 30px';  // Compact padding
        announcement.style.background = 'rgba(0, 0, 0, 0.3)';  // Very transparent
        announcement.style.border = '2px solid rgba(0, 255, 255, 0.5)';  // Semi-transparent border
        announcement.style.borderRadius = '8px';
        announcement.style.color = '#00FFFF';
        announcement.style.fontSize = '28px';  // ~40% of original 72px
        announcement.style.fontWeight = 'bold';
        announcement.style.textShadow = '0 0 10px #00FFFF';  // Subtle glow
        announcement.style.zIndex = '2000';
        announcement.style.pointerEvents = 'none';
        announcement.style.opacity = '0';
        announcement.style.transition = 'opacity 0.2s ease-in';
        announcement.textContent = `VAGUE ${waveNumber}`;  // French: WAVE → VAGUE

        document.getElementById('ui').appendChild(announcement);

        // Fade in quickly
        setTimeout(() => {
            announcement.style.opacity = '0.9';  // Max 0.9 opacity for subtlety
        }, 50);

        // Hold briefly and fade out rapidly
        setTimeout(() => {
            announcement.style.transition = 'opacity 0.3s ease-out';
            announcement.style.opacity = '0';
            setTimeout(() => announcement.remove(), 300);
        }, 1000);  // Disappears faster (1s instead of 1.5s)
        
        // Show controls on wave 1 only
        if (waveNumber === 1 && !this.controlsShownThisGame) {
            this.showControlsHelp();
            this.controlsShownThisGame = true;
        }
    }
    
    /**
     * Show controls help overlay
     */
    showControlsHelp() {
        if (this.controlsHelp) {
            this.controlsHelp.classList.add('active');
            
            // Auto-hide controls help after 10 seconds
            if (this.controlsHelpTimer) {
                clearTimeout(this.controlsHelpTimer);
            }
            this.controlsHelpTimer = setTimeout(() => {
                if (this.controlsHelp) {
                    this.controlsHelp.classList.remove('active');
                }
            }, 10000); // 10 seconds
        }
    }

    /**
     * Reset UI state
     */
    reset() {
        this.hideAllScreens();
        this.hideHUD();
        // Reset controls flag for new game
        this.controlsShownThisGame = false;
    }
    
    /**
     * Update weather warning display
     */
    updateWeatherWarning() {
        if (!window.game || !window.game.systems || !window.game.systems.weather) return;
        
        const warningText = window.game.systems.weather.getWarningText();
        
        // Get or create warning element
        let warningEl = document.getElementById('weatherWarning');
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = 'weatherWarning';
            warningEl.style.cssText = `
                position: absolute;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 0, 0, 0.8);
                border: 2px solid #ff0000;
                padding: 15px 30px;
                border-radius: 5px;
                font-size: 24px;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 0 10px #ff0000;
                animation: pulse 0.5s infinite alternate;
                z-index: 1000;
                display: none;
            `;
            document.getElementById('gameCanvas').parentElement.appendChild(warningEl);
            
            // Add CSS animation if not exists
            if (!document.getElementById('weatherWarningStyle')) {
                const style = document.createElement('style');
                style.id = 'weatherWarningStyle';
                style.textContent = `
                    @keyframes pulse {
                        from { opacity: 0.7; }
                        to { opacity: 1.0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        if (warningText) {
            warningEl.textContent = warningText;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }
    
    /**
     * Update magnetic storm status display (during active event)
     */
    updateMagneticStormStatus() {
        if (!window.game || !window.game.systems || !window.game.systems.weather) return;
        
        const statusText = window.game.systems.weather.getMagneticStormStatus();
        
        // Get or create status element
        let statusEl = document.getElementById('magneticStormStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'magneticStormStatus';
            statusEl.style.cssText = `
                position: absolute;
                top: 150px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(100, 0, 255, 0.8);
                border: 2px solid #6600ff;
                padding: 10px 20px;
                border-radius: 5px;
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 0 10px #6600ff;
                z-index: 999;
                display: none;
            `;
            document.getElementById('gameCanvas').parentElement.appendChild(statusEl);
        }
        
        if (statusText) {
            statusEl.textContent = statusText;
            statusEl.style.display = 'block';
        } else {
            statusEl.style.display = 'none';
        }
    }

    /**
     * Show name entry dialog for scoreboard
     */
    showNameEntryDialog() {
        const dialog = document.getElementById('nameEntryDialog');
        if (dialog) {
            dialog.classList.add('active');
            const input = document.getElementById('playerNameInput');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }

    /**
     * Hide name entry dialog
     */
    hideNameEntryDialog() {
        const dialog = document.getElementById('nameEntryDialog');
        if (dialog) {
            dialog.classList.remove('active');
        }
    }

    /**
     * Show scoreboard screen
     */
    showScoreboard() {
        this.hideAllScreens();
        const scoreboardScreen = document.getElementById('scoreboardScreen');
        if (scoreboardScreen) {
            scoreboardScreen.classList.add('active');
            this.renderScoreboard();
        }
    }

    /**
     * Hide scoreboard screen
     */
    hideScoreboard() {
        const scoreboardScreen = document.getElementById('scoreboardScreen');
        if (scoreboardScreen) {
            scoreboardScreen.classList.remove('active');
        }
    }

    /**
     * Render scoreboard table
     */
    renderScoreboard() {
        const scoreManager = window.game?.scoreManager;
        const container = document.getElementById('scoreboardContainer');
        
        if (!container || !scoreManager) return;
        
        const scores = scoreManager.getTopScores(10);
        
        if (scores.length === 0) {
            container.innerHTML = '<div class="scoreboard-empty">Aucun score enregistré</div>';
            return;
        }
        
        let html = `
            <table class="scoreboard-table">
                <thead>
                    <tr>
                        <th class="scoreboard-rank">#</th>
                        <th class="scoreboard-name">Joueur</th>
                        <th class="scoreboard-score">Score</th>
                        <th class="scoreboard-wave">Vague</th>
                        <th class="scoreboard-date">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        scores.forEach((score, index) => {
            html += `
                <tr>
                    <td class="scoreboard-rank">${index + 1}</td>
                    <td class="scoreboard-name">${score.playerName}</td>
                    <td class="scoreboard-score">${score.score}</td>
                    <td class="scoreboard-wave">V${score.wave}</td>
                    <td class="scoreboard-date">${ScoreManager.formatDate(score.date)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Toggle stats overlay visibility
     */
    toggleStatsOverlay() {
        this.statsOverlayVisible = !this.statsOverlayVisible;
        if (this.statsOverlayPanel) {
            this.statsOverlayPanel.style.display = this.statsOverlayVisible ? 'block' : 'none';
        }
    }
    
    /**
     * Update stats overlay with delta calculations
     * @param {Object} playerComp - Player component with stats and baseStats
     * @param {Object} health - Health component
     */
    updateStatsOverlay(playerComp, health) {
        if (!this.statsOverlayPanel || !this.statsOverlayVisible || !playerComp) return;
        
        const stats = playerComp.stats || {};
        const baseStats = playerComp.baseStats || {};
        
        // Helper function to get stat with fallback
        const getStat = (statName, defaultValue = 0) => {
            const value = stats[statName];
            if (value === undefined || value === null) {
                // Warn once per stat
                if (!this.missingStatsWarned.has(statName)) {
                    console.warn(`[UISystem] Missing stat: ${statName}, using default ${defaultValue}`);
                    this.missingStatsWarned.add(statName);
                }
                return defaultValue;
            }
            return value;
        };
        
        const getBaseStat = (statName, defaultValue = 0) => {
            return baseStats[statName] !== undefined ? baseStats[statName] : defaultValue;
        };
        
        // Calculate deltas and format display
        const statsList = [
            {
                label: 'Damage',
                current: getStat('damageMultiplier', 1),
                base: getBaseStat('damageMultiplier', 1),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Fire Rate',
                current: getStat('fireRateMultiplier', 1),
                base: getBaseStat('fireRateMultiplier', 1),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Speed',
                current: getStat('speed', 1),
                base: getBaseStat('speed', 1),
                format: 'number',
                multiplier: 1
            },
            {
                label: 'Max HP',
                current: health ? health.max : 100,
                base: getBaseStat('maxHealth', 100),
                format: 'number',
                multiplier: 1
            },
            {
                label: 'Armor',
                current: getStat('armor', 0),
                base: getBaseStat('armor', 0),
                format: 'number',
                multiplier: 1
            },
            {
                label: 'Crit Chance',
                current: getStat('critChance', 0),
                base: getBaseStat('critChance', 0),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Crit Damage',
                current: getStat('critDamage', 1.5),
                base: getBaseStat('critDamage', 1.5),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Lifesteal',
                current: getStat('lifesteal', 0),
                base: getBaseStat('lifesteal', 0),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Health Regen',
                current: getStat('healthRegen', 0),
                base: getBaseStat('healthRegen', 0),
                format: 'decimal',
                suffix: '/s',
                multiplier: 1
            },
            {
                label: 'Range',
                current: getStat('rangeMultiplier', 1),
                base: getBaseStat('rangeMultiplier', 1),
                format: 'percent',
                multiplier: 100
            },
            {
                label: 'Projectile Speed',
                current: getStat('projectileSpeedMultiplier', 1),
                base: getBaseStat('projectileSpeedMultiplier', 1),
                format: 'percent',
                multiplier: 100
            }
        ];
        
        // Build HTML
        let html = '<div class="stats-overlay-title">PLAYER STATS</div>';
        
        statsList.forEach(stat => {
            const current = stat.current * stat.multiplier;
            const base = stat.base * stat.multiplier;
            const delta = current - base;
            
            // Format values
            let currentStr;
            let deltaStr;
            
            if (stat.format === 'percent') {
                currentStr = `${Math.round(current)}%`;
                deltaStr = delta === 0 ? '±0%' : `${delta > 0 ? '+' : ''}${Math.round(delta)}%`;
            } else if (stat.format === 'decimal') {
                currentStr = `${current.toFixed(1)}${stat.suffix || ''}`;
                deltaStr = delta === 0 ? '±0' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${stat.suffix || ''}`;
            } else {
                currentStr = `${Math.round(current)}`;
                deltaStr = delta === 0 ? '±0' : `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
            }
            
            // Determine color
            let deltaColor;
            if (delta > 0) {
                deltaColor = '#0f0'; // Green
            } else if (delta < 0) {
                deltaColor = '#f33'; // Red
            } else {
                deltaColor = '#888'; // Gray
            }
            
            html += `
                <div class="stats-overlay-row">
                    <span class="stats-overlay-label">${stat.label}:</span>
                    <span class="stats-overlay-value">${currentStr}</span>
                    <span class="stats-overlay-delta" style="color: ${deltaColor}">${deltaStr}</span>
                </div>
            `;
        });
        
        html += '<div class="stats-overlay-hint">Press [A] to toggle</div>';
        
        this.statsOverlayPanel.innerHTML = html;
    }
}
