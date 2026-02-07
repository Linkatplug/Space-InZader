/**
 * @file MovementSystem.js
 * @description Handles entity movement and player input
 */

class MovementSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.keys = {};
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update(deltaTime) {
        // Update player movement
        const players = this.world.getEntitiesByType('player');
        for (const player of players) {
            this.updatePlayerMovement(player, deltaTime);
        }

        // Update all entities with velocity
        const movingEntities = this.world.getEntitiesWithComponent('velocity');
        for (const entity of movingEntities) {
            this.updateEntityPosition(entity, deltaTime);
        }
    }

    updatePlayerMovement(player, deltaTime) {
        const pos = player.getComponent('position');
        const playerComp = player.getComponent('player');
        
        if (!pos || !playerComp) return;

        let dx = 0;
        let dy = 0;

        // WASD or ZQSD movement
        if (this.keys['w'] || this.keys['z']) dy -= 1;
        if (this.keys['s']) dy += 1;
        if (this.keys['a'] || this.keys['q']) dx -= 1;
        if (this.keys['d']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 || dy !== 0) {
            const normalized = MathUtils.normalize(dx, dy);
            dx = normalized.x;
            dy = normalized.y;
        }

        // Apply speed with stats
        const speed = playerComp.speed * playerComp.stats.speed;
        pos.x += dx * speed * deltaTime;
        pos.y += dy * speed * deltaTime;

        // Keep player in bounds
        const collision = player.getComponent('collision');
        const radius = collision ? collision.radius : 15;
        
        pos.x = MathUtils.clamp(pos.x, radius, this.canvas.width - radius);
        pos.y = MathUtils.clamp(pos.y, radius, this.canvas.height - radius);
    }

    updateEntityPosition(entity, deltaTime) {
        const pos = entity.getComponent('position');
        const vel = entity.getComponent('velocity');
        
        if (!pos || !vel) return;

        pos.x += vel.vx * deltaTime;
        pos.y += vel.vy * deltaTime;

        // Remove entities that are off-screen (with buffer)
        const buffer = 100;
        if (pos.x < -buffer || pos.x > this.canvas.width + buffer ||
            pos.y < -buffer || pos.y > this.canvas.height + buffer) {
            
            // Don't remove player or pickups
            if (entity.type !== 'player' && entity.type !== 'pickup') {
                this.world.removeEntity(entity.id);
            }
        }
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] === true;
    }
}
