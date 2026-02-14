#!/usr/bin/env node
/**
 * Node.js test runner for DefenseSystem
 * Tests the core damage calculation logic
 */

// Load dependencies in order (simulating browser environment)
const fs = require('fs');
const vm = require('vm');

// Create a sandbox context
const sandbox = {
    console: console,
    Date: Date,
    Math: Math,
    Object: Object,
    Array: Array,
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail || {};
        }
    },
    window: {
        dispatchEvent: function(event) {
            console.log(`[Event Dispatched] ${event.type}`, event.detail);
        }
    }
};

// Load files in order
const files = [
    'js/constants.js',
    'js/utils/Math.js',
    'js/utils/Logger.js',
    'js/core/ECS.js',
    'js/core/GameState.js',
    'js/core/DamagePacket.js',
    'js/systems/DefenseSystem.js'
];

console.log('Loading dependencies...');
for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    try {
        vm.runInContext(code, vm.createContext(sandbox));
        console.log(`✓ Loaded ${file}`);
    } catch (e) {
        console.error(`✗ Failed to load ${file}:`, e.message);
        process.exit(1);
    }
}

// Run tests
console.log('\n=== Running DefenseSystem Tests ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.error(`✗ ${name}: ${e.message}`);
        failed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

// Access sandbox globals
const World = sandbox.World;
const GameState = sandbox.GameState;
const DamagePacket = sandbox.DamagePacket;
const DefenseSystem = sandbox.DefenseSystem;

test('DefenseSystem can be instantiated', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    if (!defenseSystem) throw new Error('DefenseSystem not created');
});

test('Apply damage to entity with only health', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('test');
    entity.addComponent('health', { current: 100, max: 100 });
    
    const damage = new DamagePacket({
        baseDamage: 30,
        damageType: 'kinetic'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    assertEquals(health.current, 70, 'Health after damage');
    assertEquals(result.structureDamage, 30, 'Structure damage');
    assertEquals(result.destroyed, false, 'Entity not destroyed');
});

test('Shield absorbs damage first', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('test');
    entity.addComponent('health', { current: 100, max: 100 });
    entity.addComponent('shield', { current: 50, max: 50, regenDelay: 0, regenDelayMax: 3 });
    
    const damage = new DamagePacket({
        baseDamage: 30,
        damageType: 'energy'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    const shield = entity.getComponent('shield');
    
    assertEquals(shield.current, 20, 'Shield after damage');
    assertEquals(health.current, 100, 'Health unchanged');
    assertEquals(result.shieldDamage, 30, 'Shield damage');
    assertEquals(result.structureDamage, 0, 'No structure damage');
});

test('Damage overflow from shield to health', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('test');
    entity.addComponent('health', { current: 100, max: 100 });
    entity.addComponent('shield', { current: 20, max: 50, regenDelay: 0, regenDelayMax: 3 });
    
    const damage = new DamagePacket({
        baseDamage: 50,
        damageType: 'energy'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    const shield = entity.getComponent('shield');
    
    assertEquals(shield.current, 0, 'Shield depleted');
    assertEquals(health.current, 70, 'Health reduced by overflow');
    assertEquals(result.shieldDamage, 20, 'Shield damage');
    assertEquals(result.structureDamage, 30, 'Structure damage');
});

test('Shield penetration bypasses shield', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('test');
    entity.addComponent('health', { current: 100, max: 100 });
    entity.addComponent('shield', { current: 50, max: 50, regenDelay: 0, regenDelayMax: 3 });
    
    const damage = new DamagePacket({
        baseDamage: 40,
        damageType: 'kinetic',
        shieldPenetration: 0.5
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    const shield = entity.getComponent('shield');
    
    assertEquals(shield.current, 30, 'Shield absorbs non-penetrating damage');
    assertEquals(health.current, 80, 'Health reduced by penetrating damage');
});

test('Armor reduces damage', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('player');
    entity.addComponent('health', { current: 100, max: 100 });
    entity.addComponent('player', { 
        stats: { armor: 10 } 
    });
    
    const damage = new DamagePacket({
        baseDamage: 30,
        damageType: 'kinetic'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    
    assertEquals(health.current, 80, 'Health after armor reduction');
    assertEquals(result.armorReduction, 10, 'Armor reduction');
    assertEquals(result.structureDamage, 20, 'Structure damage');
});

test('Entity destroyed at 0 health', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('test');
    entity.addComponent('health', { current: 30, max: 100 });
    
    let destroyedEntity = null;
    defenseSystem.onEntityDestroyed((e) => { destroyedEntity = e; });
    
    const damage = new DamagePacket({
        baseDamage: 40,
        damageType: 'energy'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    assertEquals(health.current, 0, 'Health capped at 0');
    assertEquals(result.destroyed, true, 'Entity marked as destroyed');
    assertEquals(destroyedEntity, entity, 'Destruction event fired');
});

test('God mode prevents all damage', () => {
    const world = new World();
    const gameState = new GameState();
    const defenseSystem = new DefenseSystem(world, gameState);
    
    const entity = world.createEntity('player');
    entity.addComponent('health', { current: 100, max: 100, godMode: true });
    
    const damage = new DamagePacket({
        baseDamage: 1000,
        damageType: 'energy'
    });
    
    const result = defenseSystem.applyDamage(entity, damage);
    
    const health = entity.getComponent('health');
    assertEquals(health.current, 100, 'Health unchanged');
    assertEquals(result.totalDamage, 0, 'No damage applied');
});

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);
