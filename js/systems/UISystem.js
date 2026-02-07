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

        // Menu elements
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
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.onStartGame());
        }
        if (this.metaButton) {
            this.metaButton.addEventListener('click', () => this.onShowMeta());
        }
        if (this.returnMenuButton) {
            this.returnMenuButton.addEventListener('click', () => this.onReturnToMenu());
        }
        if (this.backToMenuButton) {
            this.backToMenuButton.addEventListener('click', () => this.onBackToMenu());
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
     * Show main menu screen
     */
    showMainMenu() {
        this.hideAllScreens();
        this.hideHUD();
        if (this.menuScreen) {
            this.menuScreen.classList.add('active');
        }
        this.renderShipSelection();
    }

    /**
     * Render ship selection UI
     */
    renderShipSelection() {
        this.shipSelection.innerHTML = '';

        // Get ships from ShipData
        const ships = ShipData && ShipData.getAllShips ? ShipData.getAllShips() : this.getDefaultShips();

        ships.forEach(ship => {
            const card = document.createElement('div');
            card.className = 'ship-card';
            card.dataset.shipId = ship.id;

            // Select first ship by default
            if (!this.selectedShipId && ships.indexOf(ship) === 0) {
                this.selectedShipId = ship.id;
                card.classList.add('selected');
                // Dispatch ship selected event for default selection
                window.dispatchEvent(new CustomEvent('shipSelected', { 
                    detail: { ship: ship.id } 
                }));
            } else if (this.selectedShipId === ship.id) {
                card.classList.add('selected');
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
            `;

            card.addEventListener('click', () => {
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
    showLevelUp(boosts) {
        this.hideAllScreens();
        this.levelUpScreen.classList.add('active');
        this.renderBoostOptions(boosts);
    }

    /**
     * Render boost selection options
     * @param {Array} boosts - Available boosts
     */
    renderBoostOptions(boosts) {
        this.boostOptions.innerHTML = '';

        boosts.forEach((boost, index) => {
            const card = document.createElement('div');
            card.className = `boost-card ${boost.rarity || 'common'}`;
            
            const rarityColor = this.rarityColors[boost.rarity || 'common'];
            
            card.innerHTML = `
                <div class="boost-name" style="color: ${rarityColor};">
                    ${boost.name}
                </div>
                <div style="font-size: 11px; color: ${rarityColor}; margin-bottom: 8px; text-transform: uppercase;">
                    ${boost.rarity || 'common'}
                </div>
                <div class="boost-description">
                    ${boost.description}
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
    }

    /**
     * Handle boost selection
     * @param {Object} boost - Selected boost
     * @param {number} index - Boost index
     */
    onBoostSelected(boost, index) {
        // Dispatch custom event for game to handle
        const event = new CustomEvent('boostSelected', { detail: { boost, index } });
        window.dispatchEvent(event);

        // Hide level up screen
        this.levelUpScreen.classList.remove('active');
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
        if (this.menuScreen) this.menuScreen.classList.remove('active');
        if (this.levelUpScreen) this.levelUpScreen.classList.remove('active');
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('active');
        if (this.metaScreen) this.metaScreen.classList.remove('active');
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
     * Reset UI state
     */
    reset() {
        this.hideAllScreens();
        this.hideHUD();
    }
}
