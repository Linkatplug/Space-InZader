/**
 * @file MultiplayerManager.js
 * @description Handles multiplayer networking and synchronization
 */

class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.multiplayerEnabled = false;
        this.otherPlayers = new Map(); // playerId -> entity
        
        // Queue for events received before game starts
        this.eventQueue = [];
        
        // State machine for reliable multiplayer
        this.connectionState = 'DISCONNECTED'; // DISCONNECTED | CONNECTING | CONNECTED
        this.roomState = 'NONE'; // NONE | HOSTING | JOINING | IN_ROOM
        this.gameState = 'IDLE'; // IDLE | WAITING_READY | STARTING | RUNNING
        this.currentRoomId = null;
        this.joinInProgress = false;
        this.hostInProgress = false;
        this.readySent = false;
        this.startReceived = false;
        this.roomCodeModal = null;
        
        // Room players state
        this.roomPlayers = []; // Array of {playerId, name, ready, isHost}
    }
    
    /**
     * Log state transitions with context
     */
    logState(msg, extra = {}) {
        console.log(`[MP] ${msg}`, {
            connectionState: this.connectionState,
            roomState: this.roomState,
            gameState: this.gameState,
            roomId: this.currentRoomId,
            playerId: this.playerId,
            isHost: this.isHost,
            readySent: this.readySent,
            ...extra
        });
    }

    /**
     * Connect to multiplayer server
     * @param {string} serverUrl - Optional server URL. If not provided, connects to same origin
     */
    connect(serverUrl) {
        if (typeof io === 'undefined') {
            console.error('[MP] Socket.IO not loaded');
            return false;
        }
        
        // Prevent multiple connections
        if (this.socket && this.connectionState !== 'DISCONNECTED') {
            this.logState('Already connected or connecting, skipping');
            return true;
        }

        this.connectionState = 'CONNECTING';
        this.logState('Connecting to server', { serverUrl: serverUrl || 'same-origin' });

        // Connect to same origin if no URL provided (recommended for production)
        this.socket = serverUrl ? io(serverUrl) : io();
        
        // Remove all previous listeners to prevent duplicates
        this.socket.removeAllListeners();
        
        // Add debug listener for all incoming events
        this.socket.onAny((event, ...args) => {
            console.log('[MP IN]', event, args);
        });
        
        this.socket.on('connect', () => {
            this.connectionState = 'CONNECTED';
            this.connected = true;
            this.logState('Connected to server', { socketId: this.socket.id });
        });

        this.socket.on('disconnect', () => {
            this.connectionState = 'DISCONNECTED';
            this.connected = false;
            this.logState('Disconnected from server');
            this.showDisconnectMessage();
        });

        this.setupEventHandlers();
        return true;
    }

    /**
     * Setup socket event handlers
     */
    setupEventHandlers() {
        // Room created
        this.socket.on('room-created', (data) => {
            this.roomId = data.roomId;
            this.playerId = data.playerId;
            this.isHost = true;
            this.multiplayerEnabled = true;
            console.log(`Room created: ${this.roomId}`);
            this.showRoomCode();
        });

        // Room joined
        this.socket.on('room-joined', (data) => {
            this.roomId = data.roomId;
            this.playerId = data.playerId;
            this.isHost = false;
            this.multiplayerEnabled = true;
            console.log(`Joined room: ${this.roomId} as Player ${this.playerId}`);
            this.onRoomJoined(data.players);
        });

        // Join error
        this.socket.on('join-error', (data) => {
            alert(`Failed to join room: ${data.message}`);
        });

        // Player joined
        this.socket.on('player-joined', (data) => {
            this.logState('Player joined notification', data);
            this.onPlayerJoined(data.playerData);
        });
        
        // Room state update (new protocol)
        this.socket.on('room-state', (data) => {
            this.logState('Room state update received', data);
            this.updateRoomState(data);
        });
        
        // Start game (new synchronized protocol)
        this.socket.on('start-game', (data) => {
            this.logState('Start game command received', data);
            this.onGameStart(data);
        });

        // Game started (old protocol - keep for compatibility)
        this.socket.on('game-started', (data) => {
            this.logState('Game started (legacy)', data);
            // Host already started, client needs to start
            if (!this.isHost && this.game.gameState.state !== GameStates.RUNNING) {
                this.game.startGame();
            }
        });

        // Player moved
        this.socket.on('player-moved', (data) => {
            this.onPlayerMoved(data);
        });

        // Player health update
        this.socket.on('player-health-update', (data) => {
            this.onPlayerHealthUpdate(data);
        });

        // Enemy spawned
        this.socket.on('enemy-spawned', (data) => {
            this.eventQueue.push({ type: 'enemy-spawn', data });
        });

        // Enemy damaged
        this.socket.on('enemy-damaged', (data) => {
            this.eventQueue.push({ type: 'enemy-damage', data });
        });

        // Enemy killed
        this.socket.on('enemy-killed', (data) => {
            this.eventQueue.push({ type: 'enemy-kill', data });
        });

        // Projectile fired
        this.socket.on('projectile-fired', (data) => {
            this.eventQueue.push({ type: 'projectile-fire', data });
        });

        // Pickup spawned
        this.socket.on('pickup-spawned', (data) => {
            this.eventQueue.push({ type: 'pickup-spawn', data });
        });

        // Pickup collected
        this.socket.on('pickup-collected', (data) => {
            this.eventQueue.push({ type: 'pickup-collect', data });
        });

        // Player leveled up
        this.socket.on('player-levelup', (data) => {
            this.onPlayerLevelUp(data);
        });

        // Player disconnected
        this.socket.on('player-disconnected', (data) => {
            this.onPlayerDisconnected(data);
        });
    }

    /**
     * Create a new room (host)
     */
    createRoom(playerName, shipType) {
        if (!this.connected) {
            alert('Non connecté au serveur');
            return;
        }
        
        // Prevent double-create
        if (this.hostInProgress) {
            this.logState('Create room already in progress, ignoring');
            return;
        }
        
        if (this.currentRoomId) {
            this.logState('Already in a room, ignoring', { currentRoom: this.currentRoomId });
            return;
        }

        this.hostInProgress = true;
        this.roomState = 'HOSTING';
        this.logState('Creating room...', { playerName, shipType });
        
        this.socket.emit('create-room', {
            playerName: playerName,
            shipType: shipType
        }, (response) => {
            this.logState('Create room ACK received', response);
            this.hostInProgress = false;
            
            if (!response?.ok) {
                const errorMsg = response?.error || 'Erreur inconnue';
                this.logState('Create room failed', { error: errorMsg });
                alert('Impossible de créer la partie: ' + errorMsg);
                this.roomState = 'NONE';
                return;
            }
            
            // Success - update state
            this.roomId = response.roomId;
            this.currentRoomId = response.roomId;
            this.playerId = response.playerId;
            this.isHost = true;
            this.multiplayerEnabled = true;
            this.roomState = 'IN_ROOM';
            this.gameState = 'WAITING_READY';
            this.logState('Room created successfully');
            this.showRoomCode();
            this.sendReady();
        });
    }

    /**
     * Join existing room
     */
    joinRoom(roomId, playerName, shipType) {
        if (!this.connected) {
            alert('Non connecté au serveur');
            return;
        }
        
        // Prevent double-join
        if (this.joinInProgress) {
            this.logState('Join room already in progress, ignoring');
            return;
        }
        
        if (this.currentRoomId) {
            this.logState('Already in a room, ignoring', { currentRoom: this.currentRoomId });
            return;
        }

        this.joinInProgress = true;
        this.roomState = 'JOINING';
        this.logState('Joining room...', { roomId, playerName, shipType });
        
        this.socket.emit('join-room', {
            roomId: roomId,
            playerName: playerName,
            shipType: shipType
        }, (response) => {
            this.logState('Join room ACK received', response);
            this.joinInProgress = false;
            
            if (!response?.ok) {
                const errorMsg = response?.error || 'Erreur inconnue';
                this.logState('Join room failed', { error: errorMsg });
                alert('Impossible de rejoindre la partie: ' + errorMsg);
                this.roomState = 'NONE';
                return;
            }
            
            // Success - update state
            this.roomId = response.roomId;
            this.currentRoomId = response.roomId;
            this.playerId = response.playerId;
            this.isHost = false;
            this.multiplayerEnabled = true;
            this.roomState = 'IN_ROOM';
            this.gameState = 'WAITING_READY';
            this.logState('Joined room successfully');
            this.onRoomJoined(response.players);
            this.sendReady();
        });
    }

    /**
     * Start the game (host only) - OLD PROTOCOL
     */
    startMultiplayerGame() {
        if (!this.isHost) {
            this.logState('Only host can start the game');
            return;
        }
        
        this.logState('Starting game (legacy)...');
        
        this.socket.emit('start-game', (response) => {
            this.logState('Start game ACK (legacy)', response);
            
            if (!response?.ok) {
                const errorMsg = response?.error || 'Erreur inconnue';
                this.logState('Start game failed', { error: errorMsg });
                alert('Impossible de démarrer la partie: ' + errorMsg);
                return;
            }
            
            this.logState('Game started successfully (legacy)');
        });
    }
    
    /**
     * Send ready status - NEW PROTOCOL
     */
    sendReady() {
        if (!this.currentRoomId) {
            this.logState('Cannot send ready: not in a room');
            return;
        }
        
        if (this.readySent) {
            this.logState('Ready already sent, ignoring');
            return;
        }
        
        this.readySent = true;
        this.logState('Sending ready status');
        
        this.socket.emit('player-ready', {
            roomId: this.currentRoomId
        }, (response) => {
            this.logState('Player ready ACK', response);
            
            if (!response?.ok) {
                const errorMsg = response?.error || 'Erreur inconnue';
                this.logState('Player ready failed', { error: errorMsg });
                alert('Erreur lors de l\'envoi du statut prêt: ' + errorMsg);
                this.readySent = false;
                return;
            }
            
            this.logState('Ready status sent successfully');
        });
    }
    
    /**
     * Update room state from server
     */
    updateRoomState(data) {
        this.logState('Updating room state', data);
        
        if (data.roomId !== this.currentRoomId) {
            this.logState('Room state for different room, ignoring', { 
                expected: this.currentRoomId, 
                received: data.roomId 
            });
            return;
        }
        
        // Update players list with ready status
        this.roomPlayers = data.players || [];
        
        // Update UI to show player ready status
        this.updateLobbyUI();
    }
    
    /**
     * Handle game start command from server
     */
    onGameStart(data) {
        if (this.startReceived) {
            this.logState('Start already received, ignoring duplicate');
            return;
        }
        
        this.startReceived = true;
        this.gameState = 'STARTING';
        this.logState('Processing game start', data);
        
        const startAt = data.startAt || Date.now();
        const now = Date.now();
        const delay = Math.max(0, startAt - now);
        
        this.logState('Scheduling game start', { startAt, now, delay });
        
        // Wait until synchronized start time
        setTimeout(() => {
            this.gameState = 'RUNNING';
            this.logState('Starting game NOW');
            this.closeRoomCodeModal();
            
            // Start the actual game
            if (this.game.gameState.state !== GameStates.RUNNING) {
                this.game.startGame();
            }
        }, delay);
    }
    
    /**
     * Update lobby UI with player ready status
     */
    updateLobbyUI() {
        // This will be called by Game.js to update the UI
        this.logState('Updating lobby UI', { players: this.roomPlayers });
        
        // Trigger UI update in game (safe: UI system may not implement multiplayer lobby yet)
        const ui = this.game?.systems?.ui;
        const fn = ui?.updateMultiplayerLobby;
        if (typeof fn === 'function') {
            fn.call(ui, this.roomPlayers, this.isHost);
        } else {
            // Avoid crashing the whole multiplayer flow if UI method is missing
            this.logState('UISystem.updateMultiplayerLobby missing (skipping UI update)');
        }

        // Also update the fallback modal shown to the host with simple status text.
        const roomStatusEl = document.getElementById('roomPlayersStatus');
        if (roomStatusEl) {
            const p1 = this.roomPlayers.find((p) => p.playerId === 1);
            const p2 = this.roomPlayers.find((p) => p.playerId === 2);
            roomStatusEl.textContent = `${p1?.name || 'J1'}: ${p1?.ready ? 'PRÊT' : 'EN ATTENTE'} | ${p2?.name || 'J2'}: ${p2?.ready ? 'PRÊT' : 'EN ATTENTE'}`;
        }
    }

    /**
     * Send player position
     */
    sendPlayerPosition(position, velocity) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('player-move', {
            position: position,
            velocity: velocity
        });
    }

    /**
     * Send player health
     */
    sendPlayerHealth(health) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('player-health', {
            health: health
        });
    }

    /**
     * Send enemy spawn (host only)
     */
    sendEnemySpawn(enemyData) {
        if (!this.isHost || !this.connected) return;

        this.socket.emit('enemy-spawn', enemyData);
    }

    /**
     * Send enemy damage
     */
    sendEnemyDamage(enemyId, damage, health) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('enemy-damage', {
            id: enemyId,
            damage: damage,
            health: health
        });
    }

    /**
     * Send enemy killed
     */
    sendEnemyKilled(enemyId) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('enemy-killed', {
            id: enemyId
        });
    }

    /**
     * Send projectile fired
     */
    sendProjectileFired(projectileData) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('projectile-fire', projectileData);
    }

    /**
     * Send pickup spawn (host only)
     */
    sendPickupSpawn(pickupData) {
        if (!this.isHost || !this.connected) return;

        this.socket.emit('pickup-spawn', pickupData);
    }

    /**
     * Send pickup collected
     */
    sendPickupCollected(pickupId) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('pickup-collect', {
            id: pickupId
        });
    }

    /**
     * Send player level up
     */
    sendPlayerLevelUp(level) {
        if (!this.multiplayerEnabled || !this.connected) return;

        this.socket.emit('player-levelup', {
            playerId: this.playerId,
            level: level
        });
    }

    /**
     * Process queued events
     */
    processEventQueue() {
        if (!this.multiplayerEnabled) return;

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.handleQueuedEvent(event);
        }
    }

    /**
     * Handle queued event
     */
    handleQueuedEvent(event) {
        switch (event.type) {
            case 'enemy-spawn':
                // Create enemy entity from remote data
                // This would be handled by spawner system
                break;
            case 'enemy-damage':
                // Update enemy health
                const enemy = this.game.world.getEntity(event.data.id);
                if (enemy) {
                    const health = enemy.getComponent('health');
                    if (health) {
                        health.current = event.data.health;
                    }
                }
                break;
            case 'enemy-kill':
                // Remove enemy
                this.game.world.removeEntity(event.data.id);
                break;
            case 'projectile-fire':
                // Create projectile from remote data
                break;
            case 'pickup-spawn':
                // Create pickup from remote data
                break;
            case 'pickup-collect':
                // Remove pickup
                this.game.world.removeEntity(event.data.id);
                break;
        }
    }

    /**
     * Handle room joined
     */
    onRoomJoined(players) {
        // Create entities for existing players
        players.forEach(playerData => {
            if (playerData.playerId !== this.playerId) {
                this.createOtherPlayerEntity(playerData);
            }
        });
    }

    /**
     * Handle player joined
     */
    onPlayerJoined(playerData) {
        if (playerData.playerId !== this.playerId) {
            this.createOtherPlayerEntity(playerData);
        }
    }

    /**
     * Create entity for other player
     */
    createOtherPlayerEntity(playerData) {
        const entity = this.game.world.createEntity('other-player');

        // Defensive defaults: room-state/player lists may omit gameplay fields
        // (especially during early handshake / partial payloads)
        const safePos = playerData?.position || { x: 400, y: 500 };
        const safeHealth = typeof playerData?.health === 'number' ? playerData.health : 100;
        const safeShipType = playerData?.shipType || 'fighter';
        
        entity.addComponent('position', Components.Position(
            safePos.x,
            safePos.y
        ));
        
        entity.addComponent('velocity', Components.Velocity(0, 0));
        entity.addComponent('collision', Components.Collision(15));
        
        entity.addComponent('health', Components.Health(
            safeHealth,
            safeHealth
        ));
        
        entity.addComponent('otherPlayer', {
            playerId: playerData.playerId,
            name: playerData.name,
            shipType: safeShipType
        });

        this.otherPlayers.set(playerData.playerId, entity);
        console.log(`Created entity for player ${playerData.playerId}`);
    }

    /**
     * Handle player moved
     */
    onPlayerMoved(data) {
        const entity = this.otherPlayers.get(data.playerId);
        if (entity) {
            const pos = entity.getComponent('position');
            const vel = entity.getComponent('velocity');
            
            if (pos) {
                pos.x = data.position.x;
                pos.y = data.position.y;
            }
            
            if (vel && data.velocity) {
                vel.vx = data.velocity.vx;
                vel.vy = data.velocity.vy;
            }
        }
    }

    /**
     * Handle player health update
     */
    onPlayerHealthUpdate(data) {
        const entity = this.otherPlayers.get(data.playerId);
        if (entity) {
            const health = entity.getComponent('health');
            if (health) {
                health.current = data.health;
            }
        }
    }

    /**
     * Handle player level up
     */
    onPlayerLevelUp(data) {
        // Show notification
        console.log(`Player ${data.playerId} reached level ${data.level}`);
    }

    /**
     * Handle player disconnected
     */
    onPlayerDisconnected(data) {
        const entity = this.otherPlayers.get(data.playerId);
        if (entity) {
            this.game.world.removeEntity(entity.id);
            this.otherPlayers.delete(data.playerId);
        }
        
        if (this.game.gameState.isState(GameStates.RUNNING)) {
            alert(data.message || 'Other player disconnected');
        }
    }

    /**
     * Show room code to host
     */
    showRoomCode() {
        this.closeRoomCodeModal();

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ffff;
            padding: 30px;
            z-index: 10000;
            text-align: center;
            font-family: 'Courier New', monospace;
            color: #00ffff;
        `;
        
        modal.innerHTML = `
            <h2 style="margin-bottom: 20px;">Room Created!</h2>
            <p style="margin-bottom: 10px;">Room Code:</p>
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px; letter-spacing: 4px;">${this.roomId}</div>
            <p style="margin-bottom: 12px;">Share this code with your friend</p>
            <p id="roomPlayersStatus" style="margin-bottom: 20px; color: #7cfdfd;">J1: EN ATTENTE | J2: ABSENT</p>
            <button id="closeRoomCodeModal" style="
                background: #00ffff;
                color: #000;
                border: none;
                padding: 10px 30px;
                font-size: 16px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            ">FERMER</button>
        `;
        
        document.body.appendChild(modal);
        this.roomCodeModal = modal;

        const closeBtn = document.getElementById('closeRoomCodeModal');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeRoomCodeModal();
        }
    }

    closeRoomCodeModal() {
        if (this.roomCodeModal) {
            this.roomCodeModal.remove();
            this.roomCodeModal = null;
        }
    }

    /**
     * Show disconnect message
     */
    showDisconnectMessage() {
        if (this.game.gameState.isState(GameStates.RUNNING)) {
            alert('Disconnected from server. Returning to menu...');
            this.game.gameState.setState(GameStates.MENU);
            this.game.systems.ui.showScreen('menu');
        }
    }

    /**
     * Cleanup
     */
    disconnect() {
        this.closeRoomCodeModal();
        if (this.socket) {
            this.socket.disconnect();
        }
        this.multiplayerEnabled = false;
        this.connected = false;
        this.otherPlayers.clear();
    }
}
