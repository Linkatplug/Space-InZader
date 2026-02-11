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

const PORT = process.env.PORT || 3000;

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
    }

    addPlayer(socketId, playerData) {
        if (this.players.size >= 2) {
            return false; // Room full
        }
        
        if (this.players.size === 0) {
            this.hostId = socketId;
            playerData.playerId = 1;
        } else {
            playerData.playerId = 2;
        }
        
        this.players.set(socketId, playerData);
        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        
        // If host leaves, make other player host
        if (socketId === this.hostId && this.players.size > 0) {
            this.hostId = Array.from(this.players.keys())[0];
            const newHost = this.players.get(this.hostId);
            if (newHost) {
                newHost.playerId = 1;
            }
        }
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
                playerId: 1
            };

            room.addPlayer(socket.id, playerData);
            rooms.set(roomId, room);
            
            socket.join(roomId);
            socket.roomId = roomId;
            
            console.log(`Room created: ${roomId} by ${socket.id}`);
            
            // Send ACK with success response
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId,
                    playerId: 1,
                    playerData: playerData
                });
            }
            
            // Still emit for backward compatibility with old event listeners
            socket.emit('room-created', {
                roomId: roomId,
                playerId: 1,
                playerData: playerData
            });
        } catch (error) {
            console.error('Error creating room:', error);
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
                console.log(`Join failed: ${errorMsg} - ${roomId}`);
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

            if (room.isFull()) {
                const errorMsg = 'Room is full';
                console.log(`Join failed: ${errorMsg} - ${roomId}`);
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

            const playerData = {
                socketId: socket.id,
                name: data.playerName || 'Player 2',
                shipType: data.shipType || 'fighter',
                position: { x: 400, y: 500 },
                health: 100,
                playerId: 2
            };

            room.addPlayer(socket.id, playerData);
            socket.join(roomId);
            socket.roomId = roomId;

            console.log(`Player ${socket.id} joined room ${roomId}`);

            // Send ACK with success response
            if (callback) {
                callback({
                    ok: true,
                    roomId: roomId,
                    playerId: 2,
                    playerData: playerData,
                    players: room.getPlayerData()
                });
            }

            // Still emit for backward compatibility
            socket.emit('room-joined', {
                roomId: roomId,
                playerId: 2,
                playerData: playerData,
                players: room.getPlayerData()
            });

            // Notify other player
            socket.to(roomId).emit('player-joined', {
                playerData: playerData,
                players: room.getPlayerData()
            });
        } catch (error) {
            console.error('Error joining room:', error);
            if (callback) {
                callback({
                    ok: false,
                    error: 'Failed to join room: ' + error.message
                });
            }
        }
    });

    // Start game
    socket.on('start-game', (callback) => {
        try {
            const roomId = socket.roomId;
            const room = rooms.get(roomId);

            if (!room) {
                const errorMsg = 'Room not found';
                console.log(`Start game failed: ${errorMsg}`);
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
                console.log(`Start game failed: ${errorMsg}`);
                if (callback) {
                    callback({
                        ok: false,
                        error: errorMsg
                    });
                }
                return;
            }

            room.gameState.started = true;
            
            console.log(`Game started in room ${roomId}`);
            
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
            console.error('Error starting game:', error);
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
        console.error(`   - Find the process: lsof -i :${PORT} (Mac/Linux) or netstat -ano | findstr :${PORT} (Windows)`);
        console.error('   - Kill it: kill -9 <PID> (Mac/Linux) or taskkill /PID <PID> /F (Windows)');
        console.error('\n2. Use a different port:');
        console.error(`   - PORT=3001 npm start`);
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
