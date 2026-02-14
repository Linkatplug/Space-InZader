/**
 * @file phaser/systems/PhaserECSBridge.js
 * @description Bridge between existing ECS systems and Phaser rendering/physics
 * Allows reusing the original game logic with Phaser's features
 */

export class PhaserECSBridge {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.entitySprites = new Map(); // entity ID -> Phaser GameObject
        this.pools = {
            graphics: [],
            circles: [],
            rectangles: []
        };
    }

    /**
     * Create or update Phaser visual for an entity
     */
    syncEntity(entity) {
        const id = entity.id;
        
        if (!this.entitySprites.has(id)) {
            this.createSpriteForEntity(entity);
        }
        
        this.updateSpriteForEntity(entity);
    }

    /**
     * Create Phaser game object for entity
     */
    createSpriteForEntity(entity) {
        const { type, position } = entity.components;
        
        if (!position) return;

        let sprite;
        
        switch (type) {
            case 'player':
                sprite = this.createPlayerSprite(position);
                break;
            case 'enemy':
                sprite = this.createEnemySprite(entity);
                break;
            case 'projectile':
                sprite = this.createProjectileSprite(entity);
                break;
            case 'particle':
                sprite = this.createParticleSprite(entity);
                break;
            case 'pickup':
                sprite = this.createPickupSprite(entity);
                break;
            default:
                sprite = this.createDefaultSprite(position);
        }
        
        if (sprite) {
            sprite.setDepth(this.getDepthForType(type));
            this.entitySprites.set(entity.id, sprite);
        }
    }

    /**
     * Update sprite position and properties from entity
     */
    updateSpriteForEntity(entity) {
        const sprite = this.entitySprites.get(entity.id);
        if (!sprite) return;

        const { position, velocity, rotation, collision, health } = entity.components;
        
        if (position) {
            sprite.x = position.x;
            sprite.y = position.y;
        }
        
        if (rotation) {
            sprite.angle = rotation.angle * (180 / Math.PI);
        }
        
        // Update health-based effects
        if (health && health.current < health.max * 0.3) {
            sprite.setTint(0xff0000);
        } else {
            sprite.clearTint();
        }
        
        // Mark for removal if entity is dead
        if (entity.markedForRemoval) {
            this.removeSprite(entity.id);
        }
    }

    /**
     * Create player ship visual
     */
    createPlayerSprite(position) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillTriangle(0, -20, -15, 15, 15, 15);
        graphics.fillStyle(0x00ff00, 0.6);
        graphics.fillCircle(0, 10, 5);
        return graphics;
    }

    /**
     * Create enemy visual based on enemy data
     */
    createEnemySprite(entity) {
        const enemyData = entity.components.enemyData;
        const size = enemyData?.size || 15;
        
        const graphics = this.scene.add.graphics();
        
        // Different shapes for different enemy types
        const enemyType = enemyData?.type || 'basic';
        const color = this.getEnemyColor(enemyType);
        
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, size);
        
        // Add detail
        graphics.lineStyle(2, 0xffffff, 0.5);
        graphics.strokeCircle(0, 0, size * 0.7);
        
        return graphics;
    }

    /**
     * Create projectile visual
     */
    createProjectileSprite(entity) {
        const projectileData = entity.components.projectileData;
        const color = projectileData?.color || 0xffff00;
        const size = projectileData?.size || 4;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, size);
        
        // Add glow effect
        graphics.lineStyle(1, color, 0.5);
        graphics.strokeCircle(0, 0, size * 1.5);
        
        return graphics;
    }

    /**
     * Create particle visual
     */
    createParticleSprite(entity) {
        const particleData = entity.components.particleData;
        const color = particleData?.color || 0xffffff;
        const size = particleData?.size || 2;
        const alpha = particleData?.alpha || 1;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillCircle(0, 0, size);
        
        return graphics;
    }

    /**
     * Create pickup (XP orb) visual
     */
    createPickupSprite(entity) {
        const pickupData = entity.components.pickupData;
        const color = pickupData?.color || 0x00ff00;
        const size = pickupData?.size || 6;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 0.8);
        graphics.fillCircle(0, 0, size);
        
        // Add pulsing animation
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0.5,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        return graphics;
    }

    /**
     * Create default visual
     */
    createDefaultSprite(position) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(-5, -5, 10, 10);
        return graphics;
    }

    /**
     * Get color for enemy type
     */
    getEnemyColor(type) {
        const colors = {
            drone: 0xff6600,
            chasseur: 0xff0000,
            tank: 0x660000,
            tireur: 0xff00ff,
            elite: 0xffff00,
            boss: 0xff0066
        };
        return colors[type] || 0xff0000;
    }

    /**
     * Get rendering depth for entity type
     */
    getDepthForType(type) {
        const depths = {
            particle: 0,
            pickup: 5,
            projectile: 10,
            enemy: 15,
            player: 20,
            ui: 100
        };
        return depths[type] || 10;
    }

    /**
     * Remove sprite from scene
     */
    removeSprite(entityId) {
        const sprite = this.entitySprites.get(entityId);
        if (sprite) {
            sprite.destroy();
            this.entitySprites.delete(entityId);
        }
    }

    /**
     * Update all entities - call this in scene update()
     */
    updateAll() {
        // Sync all entities from world
        this.world.entities.forEach(entity => {
            this.syncEntity(entity);
        });
        
        // Clean up removed entities
        this.entitySprites.forEach((sprite, id) => {
            if (!this.world.entities.has(id)) {
                this.removeSprite(id);
            }
        });
    }

    /**
     * Clean up all sprites
     */
    destroy() {
        this.entitySprites.forEach(sprite => sprite.destroy());
        this.entitySprites.clear();
    }
}
