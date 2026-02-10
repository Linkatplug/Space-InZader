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
    }

    /**
     * Connect to multiplayer server
     * @param {string} serverUrl - Optional server URL. If not provided, connects to same origin
     */
    connect(serverUrl) {
        if (typeof io === 'undefined') {
            console.error('Socket.IO not loaded');
            return false;
        }

        // Connect to same origin if no URL provided (recommended for production)
        // This allows the game to work on both localhost:3000 and games.linkatplug.be:7779
        this.socket = serverUrl ? io(serverUrl) : io();
        
        this.socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from multiplayer server');
            this.connected = false;
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
            console.log('Another player joined:', data.playerData);
            this.onPlayerJoined(data.playerData);
        });

        // Game started
        this.socket.on('game-started', (data) => {
            console.log('Game started with players:', data.players);
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
            alert('Not connected to server');
            return;
        }

        this.socket.emit('create-room', {
            playerName: playerName,
            shipType: shipType
        });
    }

    /**
     * Join existing room
     */
    joinRoom(roomId, playerName, shipType) {
        if (!this.connected) {
            alert('Not connected to server');
            return;
        }

        this.socket.emit('join-room', {
            roomId: roomId,
            playerName: playerName,
            shipType: shipType
        });
    }

    /**
     * Start the game (host only)
     */
    startMultiplayerGame() {
        if (!this.isHost) return;
        
        this.socket.emit('start-game');
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
        
        entity.addComponent('position', Components.Position(
            playerData.position.x,
            playerData.position.y
        ));
        
        entity.addComponent('velocity', Components.Velocity(0, 0));
        entity.addComponent('collision', Components.Collision(15));
        
        entity.addComponent('health', Components.Health(
            playerData.health,
            playerData.health
        ));
        
        entity.addComponent('otherPlayer', {
            playerId: playerData.playerId,
            name: playerData.name,
            shipType: playerData.shipType
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
            <p style="margin-bottom: 20px;">Share this code with your friend</p>
            <button id="startWhenReady" style="
                background: #00ffff;
                color: #000;
                border: none;
                padding: 10px 30px;
                font-size: 16px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            ">Waiting for Player 2...</button>
        `;
        
        document.body.appendChild(modal);
        
        // Update button when player joins
        this.socket.once('player-joined', () => {
            const btn = document.getElementById('startWhenReady');
            if (btn) {
                btn.textContent = 'START GAME';
                btn.onclick = () => {
                    modal.remove();
                    this.game.startGame();
                };
            }
        });
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
        if (this.socket) {
            this.socket.disconnect();
        }
        this.multiplayerEnabled = false;
        this.connected = false;
        this.otherPlayers.clear();
    }
}
