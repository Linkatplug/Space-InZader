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
 * Common Component Factory Functions
 * These functions create component data objects for entities
 * Note: Kept as global functions for backward compatibility
 */

// Position component
function createPosition(x, y) {
    return { x, y };
}

// Velocity component
function createVelocity(vx, vy) {
    return { vx, vy };
}

// Health component
function createHealth(current, max) {
    return { 
        current, 
        max,
        invulnerable: false,
        invulnerableTime: 0
    };
}

// Shield component
function createShield(current, max, regen) {
    return {
        current,
        max,
        regen: regen || 0, // Shield regen per second
        regenDelay: 0, // Time since last damage before regen starts
        regenDelayMax: 3.0 // Seconds to wait before regen starts
    };
}

// Collision component
function createCollision(radius) {
    return { radius };
}

// Renderable component
function createRenderable(color, size, shape = 'circle') {
    return { 
        color, 
        size, 
        shape,
        rotation: 0
    };
}

// Player component
function createPlayer() {
    return { 
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
    };
}

// Enemy component
function createEnemy(aiType, baseHealth, damage, speed, xpValue) {
    return { 
        aiType,
        baseHealth,
        damage,
        speed,
        xpValue,
        attackCooldown: 0,
        target: null
    };
}

// Weapon component
function createWeapon(type, level, data) {
    return {
        type,
        level,
        data,
        cooldown: 0,
        currentAmmo: data.ammo || Infinity,
        evolved: false
    };
}

// Projectile component
function createProjectile(damage, speed, lifetime, owner, weaponType) {
    return {
        damage,
        speed,
        lifetime,
        maxLifetime: lifetime,
        owner,
        weaponType,
        piercing: 0,
        homing: false
    };
}

// Pickup component
function createPickup(type, value) {
    return {
        type, // 'xp', 'health', 'noyaux'
        value,
        magnetRange: 150,
        collected: false
    };
}

// Particle component
function createParticle(lifetime, vx, vy, decay = 0.98) {
    return {
        lifetime,
        maxLifetime: lifetime,
        vx,
        vy,
        decay,
        alpha: 1
    };
}

// Boss component
function createBoss(phase, patterns) {
    return {
        phase,
        patterns,
        phaseTime: 0,
        nextPhaseHealth: 0.5
    };
}

// === Backward compatibility Components wrapper ===
// DO NOT REMOVE: used by Game.createPlayer and legacy systems
const Components = {
    Position: (x, y) => ({ x, y }),
    Velocity: (vx, vy) => ({ vx, vy }),
    Health: (current, max) => ({ 
        current, 
        max,
        invulnerable: false,
        invulnerableTime: 0
    }),
    Shield: (current, max, regen) => ({
        current,
        max,
        regen: regen || 0,
        regenDelay: 0,
        regenDelayMax: 3.0
    }),
    Sprite: (sprite) => ({ sprite }),
    Collider: (radius) => ({ radius }),
    Collision: (radius) => ({ radius }), // Alias for Collider
    Weapon: (id) => ({ id }),
    Player: () => ({ 
        speed: 250,
        level: 1,
        xp: 0,
        xpRequired: 100,
        weapons: [],
        passives: [],
        shipId: 'ION_FRIGATE',  // Current ship identifier
        upgrades: new Map(),    // Map<upgradeId, level> for ship upgrades
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
            range: 1,
            shield: 0,
            shieldRegen: 0,
            shieldRegenDelay: 3.0
        }
    }),
    Renderable: (color, size, shape = 'circle') => ({ 
        color, 
        size, 
        shape,
        rotation: 0
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
        type,
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
    Enemy: (aiType, baseHealth, damage, speed, xpValue) => ({ 
        aiType,
        baseHealth,
        damage,
        speed,
        xpValue,
        attackCooldown: 0,
        target: null
    }),
    Boss: (phase, patterns) => ({
        phase,
        patterns,
        phaseTime: 0,
        nextPhaseHealth: 0.5
    }),
    // New defense component for 3-layer defense system
    Defense: () => {
        // Import from DefenseData if available, otherwise use inline definition
        if (typeof createDefenseComponent !== 'undefined') {
            return createDefenseComponent();
        }
        // Fallback inline definition
        const baseShield = { current: 120, max: 120, regen: 8, regenDelay: 0, regenDelayMax: 3, 
            resistances: { em: 0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 } };
        const baseArmor = { current: 150, max: 150, regen: 0, regenDelay: 0, regenDelayMax: 0, 
            resistances: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 } };
        const baseStructure = { current: 130, max: 130, regen: 0.5, regenDelay: 0, regenDelayMax: 0, 
            resistances: { em: 0.3, thermal: 0, kinetic: 0.15, explosive: 0.2 } };
        return { shield: baseShield, armor: baseArmor, structure: baseStructure };
    },
    // Heat component for heat management system
    Heat: (maxHeat = 100, cooling = 10, passiveHeat = 0) => ({
        current: 0,
        max: maxHeat,
        cooling: cooling,
        passiveHeat: passiveHeat,
        overheated: false,
        overheatTimer: 0
    })
};
