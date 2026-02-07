/**
 * @file ECS.js
 * @description Entity Component System architecture
 */

/**
 * Entity class
 */
class Entity {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.components = {};
        this.active = true;
    }

    addComponent(name, data) {
        this.components[name] = data;
        return this;
    }

    getComponent(name) {
        return this.components[name];
    }

    hasComponent(name) {
        return this.components[name] !== undefined;
    }

    removeComponent(name) {
        delete this.components[name];
        return this;
    }
}

/**
 * World class - manages all entities
 */
class World {
    constructor() {
        this.entities = new Map();
        this.nextEntityId = 0;
        this.entitiesToRemove = [];
    }

    createEntity(type) {
        const entity = new Entity(this.nextEntityId++, type);
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entityId) {
        this.entitiesToRemove.push(entityId);
    }

    getEntity(entityId) {
        return this.entities.get(entityId);
    }

    getEntitiesByType(type) {
        return Array.from(this.entities.values()).filter(e => e.type === type && e.active);
    }

    getEntitiesWithComponent(componentName) {
        return Array.from(this.entities.values()).filter(
            e => e.active && e.hasComponent(componentName)
        );
    }

    processPendingRemovals() {
        for (const id of this.entitiesToRemove) {
            this.entities.delete(id);
        }
        this.entitiesToRemove = [];
    }

    clear() {
        this.entities.clear();
        this.nextEntityId = 0;
        this.entitiesToRemove = [];
    }
}

/**
 * Common Components
 */
const Components = {
    Position: (x, y) => ({ x, y }),
    Velocity: (vx, vy) => ({ vx, vy }),
    
    Health: (current, max) => ({ 
        current, 
        max,
        invulnerable: false,
        invulnerableTime: 0
    }),
    
    Collision: (radius) => ({ radius }),
    
    Renderable: (color, size, shape = 'circle') => ({ 
        color, 
        size, 
        shape,
        rotation: 0
    }),
    
    Player: () => ({ 
        speed: 250,
        level: 1,
        xp: 0,
        xpRequired: 100,
        weapons: [],
        passives: [],
        stats: {
            damage: 1,
            fireRate: 1,
            speed: 1,
            maxHealth: 1,
            critChance: 0,
            critDamage: 1.5,
            lifesteal: 0,
            luck: 0,
            xpBonus: 1,
            armor: 0,
            projectileSpeed: 1,
            range: 1
        }
    }),
    
    Enemy: (aiType, baseHealth, damage, speed, xpValue) => ({ 
        aiType,
        baseHealth,
        damage,
        speed,
        xpValue,
        attackCooldown: 0,
        target: null
    }),
    
    Weapon: (type, level, data) => ({
        type,
        level,
        data,
        cooldown: 0,
        currentAmmo: data.ammo || Infinity,
        evolved: false
    }),
    
    Projectile: (damage, speed, lifetime, owner, weaponType) => ({
        damage,
        speed,
        lifetime,
        maxLifetime: lifetime,
        owner,
        weaponType,
        piercing: 0,
        homing: false
    }),
    
    Pickup: (type, value) => ({
        type, // 'xp', 'health', 'noyaux'
        value,
        magnetRange: 150,
        collected: false
    }),
    
    Particle: (lifetime, vx, vy, decay = 0.98) => ({
        lifetime,
        maxLifetime: lifetime,
        vx,
        vy,
        decay,
        alpha: 1
    }),
    
    Boss: (phase, patterns) => ({
        phase,
        patterns,
        phaseTime: 0,
        nextPhaseHealth: 0.5
    })
};
