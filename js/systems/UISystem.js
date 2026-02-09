/**
 * @file UISystem.js
 * @description UI management system for Space InZader
 * Handles HUD updates, menus, level-up screen, and meta-progression
 */

class UISystem {
    constructor(world, gameState) {
        this.world = world;
        this.gameState = gameState;
        
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
        this.killsDisplay = document.getElementById('killsDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.hpDisplay = document.getElementById('hpDisplay');
        this.healthFill = document.getElementById('healthFill');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.xpFill = document.getElementById('xpFill');
        this.weaponSlots = document.getElementById('weaponSlots');
        this.controlsHelp = document.getElementById('controlsHelp');

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

            // Update kills and score
            this.killsDisplay.textContent = this.gameState.stats.kills;
            this.scoreDisplay.textContent = this.gameState.stats.score;

            // Update level and XP
            this.levelDisplay.textContent = playerComp.level;
            const xpPercent = (playerComp.xp / playerComp.xpRequired) * 100;
            this.xpFill.style.width = `${Math.min(100, xpPercent)}%`;
        }

        if (health) {
            // Update health
            this.hpDisplay.textContent = `${Math.ceil(health.current)}/${health.max}`;
            const healthPercent = (health.current / health.max) * 100;
            this.healthFill.style.width = `${Math.max(0, healthPercent)}%`;
        }

        // Update weapon slots
        this.updateWeaponDisplay(playerComp);
        
        // Update synergy display
        this.updateSynergyDisplay();
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
        if (!playerComp || !playerComp.weapons) return;

        this.weaponSlots.innerHTML = '';
        
        playerComp.weapons.forEach((weapon, index) => {
            const weaponDiv = document.createElement('div');
            weaponDiv.style.marginBottom = '5px';
            weaponDiv.style.fontSize = '12px';
            weaponDiv.style.textAlign = 'right';
            
            const weaponName = weapon.type || 'Unknown';
            const level = weapon.level || 1;
            const maxLevel = weapon.data?.maxLevel || 8;
            
            weaponDiv.innerHTML = `${weaponName} <span style="color: #00ff00;">Lv${level}/${maxLevel}</span>`;
            this.weaponSlots.appendChild(weaponDiv);
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
        if (window.game?.gameState?.currentState === GameStates.PAUSED) {
            window.game.gameState.setState(GameStates.RUNNING);
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
        
        const saveManager = window.game?.saveManager;
        if (!saveManager) {
            this.scoreList.innerHTML = '<div style="color:#666;text-align:center;padding:40px;">SaveManager not available</div>';
            return;
        }
        
        const scores = saveManager.getTopScores(10);
        this.scoreList.innerHTML = '';
        
        if (scores.length === 0) {
            this.scoreList.innerHTML = '<div style="color:#666;text-align:center;padding:40px;">No scores yet. Play to set a record!</div>';
            return;
        }
        
        scores.forEach((entry, index) => {
            const rank = index + 1;
            const div = document.createElement('div');
            div.className = `score-entry rank-${rank}`;
            
            const date = new Date(entry.date);
            const timeStr = Math.floor(entry.time / 60) + ':' + String(Math.floor(entry.time % 60)).padStart(2, '0');
            
            div.innerHTML = `
                <div class="score-header">
                    <span>#${rank} - ${entry.class}</span>
                    <span>${entry.score.toLocaleString()}</span>
                </div>
                <div class="score-details">
                    Wave ${entry.wave} | ${entry.kills} kills | ${timeStr} | ${entry.bossKills} bosses
                </div>
                <div class="score-build">
                    ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                </div>
            `;
            
            this.scoreList.appendChild(div);
        });
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

        // Get ships from ShipData
        const ships = ShipData && ShipData.getAllShips ? ShipData.getAllShips() : this.getDefaultShips();
        const saveData = window.game?.saveData || {};
        const progress = saveData.meta || { maxWave: 0, bloodCritCount: 0 };

        ships.forEach(ship => {
            const card = document.createElement('div');
            card.className = 'ship-card';
            card.dataset.shipId = ship.id;
            
            // Check if ship is locked
            const isLocked = !ship.unlocked && ship.unlockCondition;
            if (isLocked) {
                card.classList.add('locked');
            }

            // Select first unlocked ship by default
            if (!this.selectedShipId && !isLocked) {
                this.selectedShipId = ship.id;
                card.classList.add('selected');
                // Dispatch ship selected event for default selection
                window.dispatchEvent(new CustomEvent('shipSelected', { 
                    detail: { ship: ship.id } 
                }));
            } else if (this.selectedShipId === ship.id && !isLocked) {
                card.classList.add('selected');
            }

            let unlockText = '';
            if (isLocked) {
                const cond = ship.unlockCondition;
                if (cond.type === 'wave') {
                    unlockText = `<div style="color:#ff4444;font-size:11px;margin-top:8px;">🔒 Reach Wave ${cond.value}</div>`;
                } else if (cond.type === 'blood_crit_count') {
                    unlockText = `<div style="color:#ff4444;font-size:11px;margin-top:8px;">🔒 Get ${cond.value} Blood Crits</div>`;
                }
            }

            card.innerHTML = `
                <h3 style="color: ${ship.color}; margin-bottom: 10px; text-align: center;">${ship.name}</h3>
                <div style="margin-bottom: 10px; font-size: 12px; line-height: 1.4;">
                    ${ship.description}
                </div>
                <div style="font-size: 11px; opacity: 0.8;">
                    <div>HP: ${ship.baseStats.maxHealth}</div>
                    <div>DMG: x${ship.baseStats.damageMultiplier.toFixed(2)}</div>
                    <div>SPD: ${ship.baseStats.speed}</div>
                    <div>Difficulty: ${ship.difficulty.toUpperCase()}</div>
                </div>
                ${unlockText}
            `;

            card.addEventListener('click', () => {
                if (isLocked) return; // Can't select locked ships
                
                document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedShipId = ship.id;
                
                // Dispatch ship selected event
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

        boosts.forEach((boost, index) => {
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
     * Render end-of-run statistics
     */
    renderEndStats() {
        const stats = this.gameState.stats;
        const noyaux = this.gameState.calculateNoyaux();

        const minutes = Math.floor(stats.time / 60);
        const seconds = Math.floor(stats.time % 60);

        this.endStats.innerHTML = `
            <div class="stat-line">
                <span>Survival Time:</span>
                <span style="color: #00ffff;">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="stat-line">
                <span>Total Kills:</span>
                <span style="color: #00ffff;">${stats.kills}</span>
            </div>
            <div class="stat-line">
                <span>Final Score:</span>
                <span style="color: #00ffff;">${stats.score}</span>
            </div>
            <div class="stat-line">
                <span>Highest Level:</span>
                <span style="color: #00ffff;">${stats.highestLevel}</span>
            </div>
            <div class="stat-line">
                <span>Damage Dealt:</span>
                <span style="color: #ff6600;">${Math.floor(stats.damageDealt)}</span>
            </div>
            <div class="stat-line">
                <span>Damage Taken:</span>
                <span style="color: #ff0000;">${Math.floor(stats.damageTaken)}</span>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #00ffff;">
                <div class="stat-line" style="font-size: 20px; font-weight: bold;">
                    <span>Noyaux Earned:</span>
                    <span style="color: #ffaa00;">⬡ ${noyaux}</span>
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
        
        // Show controls help
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
        announcement.style.top = '50%';
        announcement.style.left = '50%';
        announcement.style.transform = 'translate(-50%, -50%)';
        announcement.style.padding = '40px 80px';
        announcement.style.background = 'rgba(10, 10, 26, 0.98)';
        announcement.style.border = '4px solid #00FFFF';
        announcement.style.borderRadius = '20px';
        announcement.style.color = '#00FFFF';
        announcement.style.fontSize = '72px';
        announcement.style.fontWeight = 'bold';
        announcement.style.textShadow = '0 0 30px #00FFFF, 0 0 60px #00FFFF';
        announcement.style.zIndex = '2000';
        announcement.style.pointerEvents = 'none';
        announcement.style.opacity = '0';
        announcement.style.transition = 'opacity 0.3s ease-in';
        announcement.textContent = `WAVE ${waveNumber}`;

        document.getElementById('ui').appendChild(announcement);

        // Fade in
        setTimeout(() => {
            announcement.style.opacity = '1';
        }, 50);

        // Hold and fade out
        setTimeout(() => {
            announcement.style.transition = 'opacity 0.5s ease-out';
            announcement.style.opacity = '0';
            setTimeout(() => announcement.remove(), 500);
        }, 2000);
    }

    /**
     * Reset UI state
     */
    reset() {
        this.hideAllScreens();
        this.hideHUD();
    }
}
