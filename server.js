/**
 * @file server.js
 * @description Multiplayer server for Space InZader - 2 player co-op
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 7779;

// Serve static files
app.use(express.static(__dirname));

// Game rooms - each room has max 2 players
const rooms = new Map();

class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map(); // socketId -> player data
        this.hostId = null;
        this.gameState = {
            started: false,
            enemies: new Map(),
            projectiles: new Map(),
            pickups: new Map()
        };
        this.readyStatus = new Map(); // socketId -> boolean
    }

    addPlayer(socketId, playerData) {
        // Check if player already in room (reconnection scenario)
        if (this.players.has(socketId)) {
            console.log(`[SV] Player ${socketId} already in room ${this.roomId}`);
            return { alreadyInRoom: true, playerId: this.players.get(socketId).playerId };
        }
        
        if (this.players.size >= 2) {
            return false; // Room full
        }
        
        if (this.players.size === 0) {
            this.hostId = socketId;
            playerData.playerId = 1;
            playerData.isHost = true;
        } else {
            playerData.playerId = 2;
            playerData.isHost = false;
        }
        
        this.players.set(socketId, playerData);
        this.readyStatus.set(socketId, false);
        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        this.readyStatus.delete(socketId);
        
        // If host leaves, make other player host
        if (socketId === this.hostId && this.players.size > 0) {
            this.hostId = Array.from(this.players.keys())[0];
            const newHost = this.players.get(this.hostId);
            if (newHost) {
                newHost.playerId = 1;
                newHost.isHost = true;
            }
        }
    }
    
    setPlayerReady(socketId, ready) {
        if (!this.players.has(socketId)) {
            return false;
        }
        this.readyStatus.set(socketId, ready);
        console.log(`[SV] Player ${socketId} ready status: ${ready} in room ${this.roomId}`);
        return true;
    }
    
    isPlayerReady(socketId) {
        return this.readyStatus.get(socketId) || false;
    }
    
    areAllPlayersReady() {
        if (this.players.size < 2) {
            return false; // Need 2 players
        }
        
        for (const [socketId, _] of this.players) {
            if (!this.isPlayerReady(socketId)) {
                return false;
            }
        }
        return true;
    }
    
    getPlayersWithReadyStatus() {
        const players = [];
        for (const [socketId, playerData] of this.players) {
            players.push({
                playerId: playerData.playerId,
                name: playerData.name,
                isHost: playerData.isHost || (socketId === this.hostId),
                ready: this.isPlayerReady(socketId),
                socketId: socketId
            });
        }
        return players;
    }

    isFull() {
        return this.players.size >= 2;
    }

    isEmpty() {
        return this.players.size === 0;
    }

    getPlayerData() {
        return Array.from(this.players.values());
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create room
    socket.on('create-room', (data, callback) => {
        try {
            const roomId = generateRoomId();
            const room = new GameRoom(roomId);
            
            const playerData = {
                socketId: socket.id,
                name: data.playerName || 'Player',
                shipType: data.shipType || 'fighter',
                position: { x: 400, y: 500 },
                health: 100,
                playerId: 1,
                isHost: true
            };

            room.addPlayer(socket.id, playerData);
            rooms.set(roomId, room);
            
            socket.join(roomId);
            socket.roomId = roomId;
            
            console.log(`[SV] create-room socket=${socket.id} room=${roomId} players=${room.players.size}`);
            
            // Send ACK with success response
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId,
                    playerId: 1,
                    playerData: playerData,
                    players: room.getPlayersWithReadyStatus()
                });
            }
            
            // Still emit for backward compatibility with old event listeners
            socket.emit('room-created', {
                roomId: roomId,
                playerId: 1,
                playerData: playerData
            });
        } catch (error) {
            console.error('[SV] Error creating room:', error);
            if (callback) {
                callback({
                    ok: false,
                    error: 'Failed to create room: ' + error.message
                });
            }
        }
    });

    // Join room
    socket.on('join-room', (data, callback) => {
        try {
            const roomId = data.roomId;
            const room = rooms.get(roomId);

            if (!room) {
                const errorMsg = 'Room not found';
                console.log(`[SV] join-room FAILED socket=${socket.id} room=${roomId} reason=${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                // Still emit for backward compatibility
                socket.emit('join-error', { message: errorMsg });
                return;
            }

            // Check if already in room (reconnection)
            const addResult = room.addPlayer(socket.id, {
                socketId: socket.id,
                name: data.playerName || 'Player 2',
                shipType: data.shipType || 'fighter',
                position: { x: 400, y: 500 },
                health: 100,
                playerId: 2,
                isHost: false
            });
            
            if (addResult === false) {
                // Room is full
                const errorMsg = 'Room is full';
                console.log(`[SV] join-room FAILED socket=${socket.id} room=${roomId} reason=${errorMsg} players=${room.players.size}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                socket.emit('join-error', { message: errorMsg });
                return;
            }
            
            if (addResult.alreadyInRoom) {
                // Player reconnecting
                console.log(`[SV] join-room RECONNECT socket=${socket.id} room=${roomId} playerId=${addResult.playerId}`);
                if (callback) {
                    callback({
                        ok: true,
                        roomId: roomId,
                        playerId: addResult.playerId,
                        already: true,
                        players: room.getPlayersWithReadyStatus()
                    });
                }
                return;
            }

            socket.join(roomId);
            socket.roomId = roomId;

            const playerData = room.players.get(socket.id);
            console.log(`[SV] join-room SUCCESS socket=${socket.id} room=${roomId} playerId=${playerData.playerId} totalPlayers=${room.players.size}`);

            // Send ACK with success response
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId,
                    playerId: playerData.playerId,
                    playerData: playerData,
                    players: room.getPlayersWithReadyStatus()
                });
            }

            // Still emit for backward compatibility
            socket.emit('room-joined', {
                roomId: roomId,
                playerId: playerData.playerId,
                playerData: playerData,
                players: room.getPlayerData()
            });

            // Notify other player and broadcast room state
            socket.to(roomId).emit('player-joined', {
                playerData: playerData,
                players: room.getPlayerData()
            });
            
            // Broadcast updated room state to all players
            io.to(roomId).emit('room-state', {
                roomId: roomId,
                players: room.getPlayersWithReadyStatus(),
                hostId: room.hostId
            });
        } catch (error) {
            console.error('[SV] Error joining room:', error);
            if (callback) {
                callback({
                    ok: false,
                    error: 'Failed to join room: ' + error.message
                });
            }
        }
    });

    
    // Player ready (NEW PROTOCOL)
    socket.on('player-ready', (data, callback) => {
        try {
            const roomId = data.roomId || socket.roomId;
            const room = rooms.get(roomId);
            
            if (!room) {
                const errorMsg = 'Room not found';
                console.log(`[SV] player-ready FAILED socket=${socket.id} room=${roomId} reason=${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                return;
            }
            
            // Mark player as ready
            const success = room.setPlayerReady(socket.id, true);
            if (!success) {
                const errorMsg = 'Player not in room';
                console.log(`[SV] player-ready FAILED socket=${socket.id} room=${roomId} reason=${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                return;
            }
            
            const playersStatus = room.getPlayersWithReadyStatus();
            console.log(`[SV] player-ready SUCCESS socket=${socket.id} room=${roomId} players=`, playersStatus.map(p => `${p.playerId}:${p.ready}`).join(','));
            
            // Send ACK
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId
                });
            }
            
            // Broadcast room state to all players
            io.to(roomId).emit('room-state', {
                roomId: roomId,
                players: playersStatus,
                hostId: room.hostId
            });
            
            // Check if all players are ready
            if (room.areAllPlayersReady()) {
                console.log(`[SV] All players ready in room ${roomId}, starting game...`);
                
                // Generate seed for synchronized random
                const seed = Date.now();
                const startAt = Date.now() + 1000; // Start in 1 second
                
                room.gameState.started = true;
                
                console.log(`[SV] start-game AUTO room=${roomId} seed=${seed} startAt=${startAt} players=${room.players.size}`);
                
                // Notify all players to start
                io.to(roomId).emit('start-game', {
                    roomId: roomId,
                    seed: seed,
                    startAt: startAt,
                    players: room.getPlayerData()
                });
            }
        } catch (error) {
            console.error('[SV] Error handling player-ready:', error);
            if (callback) {
                callback({
                    ok: false,
                    error: 'Failed to process ready: ' + error.message
                });
            }
        }
    });

    // Start game (LEGACY - kept for backward compatibility)
    socket.on('start-game', (callback) => {
        try {
            const roomId = socket.roomId;
            const room = rooms.get(roomId);

            if (!room) {
                const errorMsg = 'Room not found';
                console.log(`[SV] start-game FAILED socket=${socket.id} reason=${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                return;
            }

            if (room.hostId !== socket.id) {
                const errorMsg = 'Only host can start the game';
                console.log(`[SV] start-game FAILED socket=${socket.id} room=${roomId} reason=${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                return;
            }

            room.gameState.started = true;
            
            console.log(`[SV] start-game LEGACY room=${roomId} by host`);
            
            // Send ACK with success response
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId,
                    players: room.getPlayerData()
                });
            }
            
            // Notify all players in room
            io.to(roomId).emit('game-started', {
                players: room.getPlayerData()
            });
        } catch (error) {
            console.error('[SV] Error starting game:', error);
            if (callback) {
                callback({
                    ok: false,
                    error: 'Failed to start game: ' + error.message
                });
            }
        }
    });

    // Player movement
    socket.on('player-move', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) {
            player.position = data.position;
            
            // Broadcast to other players in room
            socket.to(roomId).emit('player-moved', {
                playerId: player.playerId,
                position: data.position,
                velocity: data.velocity
            });
        }
    });

    // Player health update
    socket.on('player-health', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) {
            player.health = data.health;
            
            socket.to(roomId).emit('player-health-update', {
                playerId: player.playerId,
                health: data.health
            });
        }
    });

    // Enemy spawned (host only)
    socket.on('enemy-spawn', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room || room.hostId !== socket.id) return;

        room.gameState.enemies.set(data.id, data);
        socket.to(roomId).emit('enemy-spawned', data);
    });

    // Enemy damaged
    socket.on('enemy-damage', (data) => {
        const roomId = socket.roomId;
        if (!roomId) return;

        socket.to(roomId).emit('enemy-damaged', data);
    });

    // Enemy killed
    socket.on('enemy-killed', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        room.gameState.enemies.delete(data.id);
        socket.to(roomId).emit('enemy-killed', data);
    });

    // Projectile fired
    socket.on('projectile-fire', (data) => {
        const roomId = socket.roomId;
        if (!roomId) return;

        socket.to(roomId).emit('projectile-fired', data);
    });

    // Pickup spawned (host only)
    socket.on('pickup-spawn', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room || room.hostId !== socket.id) return;

        room.gameState.pickups.set(data.id, data);
        socket.to(roomId).emit('pickup-spawned', data);
    });

    // Pickup collected
    socket.on('pickup-collect', (data) => {
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        room.gameState.pickups.delete(data.id);
        socket.to(roomId).emit('pickup-collected', data);
    });

    // Player level up
    socket.on('player-levelup', (data) => {
        const roomId = socket.roomId;
        if (!roomId) return;

        socket.to(roomId).emit('player-levelup', {
            playerId: data.playerId,
            level: data.level
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        const roomId = socket.roomId;
        const room = rooms.get(roomId);

        if (room) {
            const player = room.players.get(socket.id);
            const playerId = player ? player.playerId : null;
            
            room.removePlayer(socket.id);

            // Notify other players
            socket.to(roomId).emit('player-disconnected', {
                playerId: playerId,
                message: 'Player disconnected'
            });

            // Remove empty rooms
            if (room.isEmpty()) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            }
        }
    });

    // Get room list
    socket.on('get-rooms', () => {
        const availableRooms = [];
        rooms.forEach((room, roomId) => {
            if (!room.isFull()) {
                availableRooms.push({
                    roomId: roomId,
                    players: room.players.size,
                    maxPlayers: 2
                });
            }
        });
        socket.emit('rooms-list', availableRooms);
    });
});

// Helper function to generate room IDs
function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Error handling for server
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error('\n📋 To fix this issue, try one of the following:\n');
        console.error('1. Stop the existing server:');
        
        // Try to find the PID automatically on Unix-like systems
        const { execSync } = require('child_process');
        try {
            if (process.platform !== 'win32') {
                const lsofOutput = execSync(`lsof -ti :${PORT} 2>/dev/null`, { encoding: 'utf8' }).trim();
                if (lsofOutput) {
                    const pids = lsofOutput.split('\n');
                    console.error(`   ℹ️  Process(es) using port ${PORT}: ${pids.join(', ')}`);
                    console.error(`   - To stop: kill -9 ${pids.join(' ')}`);
                } else {
                    console.error(`   - Find the process: lsof -i :${PORT}`);
                    console.error(`   - Kill it: kill -9 <PID>`);
                }
            } else {
                console.error(`   - Find the process: netstat -ano | findstr :${PORT}`);
                console.error(`   - Kill it: taskkill /PID <PID> /F`);
            }
        } catch (e) {
            // If lsof fails, show generic instructions
            console.error(`   - Find the process: lsof -i :${PORT} (Mac/Linux) or netstat -ano | findstr :${PORT} (Windows)`);
            console.error(`   - Kill it: kill -9 <PID> (Mac/Linux) or taskkill /PID <PID> /F (Windows)`);
        }
        
        console.error('\n2. Use a different port:');
        console.error(`   - PORT=${parseInt(PORT) + 1} npm start`);
        console.error('\n3. Wait a moment and try again (the port may still be releasing)\n');
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// Graceful shutdown handlers
const shutdown = () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 5 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 5000);
};

process.on('SIGINT', shutdown);  // Ctrl+C
process.on('SIGTERM', shutdown); // Kill command

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Space InZader Multiplayer Server running on port ${PORT}`);
    console.log(`📡 Open http://localhost:${PORT} to play`);
    console.log(`⌨️  Press Ctrl+C to stop the server\n`);
});
