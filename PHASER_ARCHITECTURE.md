# Space InZader - Phaser Port Architecture

## Overview

This document describes the architecture of the Phaser 3 port of Space InZader and how it integrates with the existing codebase.

## Design Philosophy

### Hybrid Architecture: Reuse + Adapt

The port uses a **hybrid approach** that:
1. **Reuses** game logic, data, and ECS from the original
2. **Adapts** rendering and input to use Phaser APIs
3. **Bridges** the gap between ECS entities and Phaser game objects

This approach minimizes code duplication while leveraging Phaser's strengths.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Phaser 3 Layer                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  BootScene   │  │  MenuScene   │  │  GameScene   │     │
│  │  (Loading)   │→ │  (Menu/UI)   │→ │  (Gameplay)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                            │                │
│                                            ▼                │
│                          ┌─────────────────────────────┐   │
│                          │    PhaserECSBridge          │   │
│                          │  (Entity ↔ Sprite sync)    │   │
│                          └─────────────────────────────┘   │
│                                            │                │
└────────────────────────────────────────────┼────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────┐
│                     Reusable ECS Layer     │                │
├────────────────────────────────────────────┼────────────────┤
│                                            ▼                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    ECS World                         │  │
│  │  (Entities, Components, Query System)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│     ┌──────────────────────┼──────────────────────┐       │
│     ▼                      ▼                      ▼       │
│  ┌────────────┐    ┌────────────┐      ┌────────────┐    │
│  │ Movement   │    │  Combat    │      │    AI      │    │
│  │  System    │    │  System    │ ...  │  System    │    │
│  └────────────┘    └────────────┘      └────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Data Layer (Pure JS Objects)            │
├────────────────────────────┼────────────────────────────────┤
│                            ▼                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ ShipData │  │ EnemyData│  │WeaponData│  │PassiveData│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                            │
│  100% Compatible with both Vanilla JS and Phaser versions │
└────────────────────────────────────────────────────────────┘
```

## Layer Breakdown

### 1. Phaser Layer (New)

**Location**: `phaser/`

#### Scenes (`phaser/scenes/`)

- **BootScene**: Loading screen, asset preloading, initialization
- **MenuScene**: Main menu, ship selection, settings
- **GameScene**: Main gameplay, integrates ECS with Phaser
- **GameOverScene**: Stats display, restart/menu options

Each scene is a Phaser Scene with standard lifecycle:
- `init(data)`: Receive data from previous scene
- `preload()`: Load assets (Boot scene only)
- `create()`: Initialize scene, create game objects
- `update(time, delta)`: Called every frame

#### Phaser Systems (`phaser/systems/`)

- **PhaserECSBridge**: Core bridge between ECS entities and Phaser sprites
  - Maps entity ID → Phaser GameObject
  - Syncs entity position/rotation/state to sprite
  - Handles sprite creation and cleanup
  - Manages render depth and layers

- **PhaserInputAdapter** (to be implemented):
  - Translates Phaser input to MovementSystem
  - Handles keyboard, mouse, touch
  - Provides unified input interface

- **PhaserPhysicsAdapter** (to be implemented):
  - Bridges Phaser Arcade Physics with ECS
  - Syncs physics bodies with entity components
  - Handles collisions via Phaser's collision system

#### Utilities (`phaser/utils/`)

- **AssetLoader**: Manages asset loading
- **EffectsManager**: Screen shake, flash, tween effects
- **UIFactory**: Creates UI elements with consistent styling

### 2. ECS Layer (Reused)

**Location**: `js/core/`

#### Core ECS (`js/core/ECS.js`)

```javascript
class Entity {
    id: number
    type: string
    components: Map<string, Component>
    markedForRemoval: boolean
}

class World {
    entities: Map<id, Entity>
    systems: System[]
    
    createEntity(type): Entity
    removeEntity(id): void
    query(componentTypes): Entity[]
}
```

**Why Reusable**: ECS is engine-agnostic. It just manages data.

#### Components

Pure data objects with no logic:
- `position`: { x, y }
- `velocity`: { vx, vy }
- `collision`: { radius, type }
- `health`: { current, max }
- `projectileData`: { damage, type }
- `enemyData`: { type, ai, stats }
- etc.

**Why Reusable**: Just data structures, no rendering code.

#### Systems (`js/systems/`)

Game logic systems that operate on components:
- **MovementSystem**: Updates position based on velocity
- **CombatSystem**: Weapon firing, damage calculation
- **AISystem**: Enemy behavior
- **CollisionSystem**: Checks overlaps
- **SpawnerSystem**: Creates enemies
- **WaveSystem**: Wave progression
- **PickupSystem**: XP collection
- **ParticleSystem**: Visual effects
- **DefenseSystem**: Shield/armor mechanics
- **HeatSystem**: Weapon overheat

**Why Reusable**: Pure logic, no direct rendering calls.

**Adaptation Strategy**:
1. Keep all game logic as-is
2. Remove direct Canvas drawing code
3. Let PhaserECSBridge handle visuals
4. Add Phaser-specific features (particles, tweens) as enhancements

### 3. Data Layer (100% Reused)

**Location**: `js/data/`

All game data is defined as pure JavaScript objects:

```javascript
// Example: ShipData.js
const SHIPS = {
    interceptor: {
        name: "Interceptor",
        baseStats: {
            maxHealth: 100,
            damage: 1.2,
            speed: 1.3,
            fireRate: 1.0
        },
        startingWeapon: "laser"
    }
    // ...
};
```

**Why 100% Compatible**: No rendering or engine-specific code.

Files:
- `ShipData.js`: Ship definitions
- `EnemyProfiles.js`: Enemy types and stats
- `NewWeaponData.js`: Weapon definitions
- `PassiveData.js`: Passive abilities
- `DefenseData.js`: Defense layer stats
- `ModuleData.js`: Module system
- `SynergyData.js`: Synergy combinations
- `BalanceConstants.js`: Global tuning values
- `LootData.js`: Drop tables
- `HeatData.js`: Overheat mechanics
- `KeystoneData.js`: Keystone upgrades
- `ShipUpgradeData.js`: Meta-progression
- `TagSynergyData.js`: Tag-based bonuses

### 4. Managers (Mostly Reused)

**Location**: `js/managers/`

- **SaveManager**: LocalStorage persistence → **100% Reusable**
- **ScoreManager**: Score tracking → **100% Reusable**
- **AudioManager**: Sound effects → **Needs Adaptation**
  - Original uses Web Audio API directly
  - Phaser version should use `this.sound` API
  - Keep sound definitions, change playback

## Key Integration Points

### How GameScene Integrates ECS

```javascript
// phaser/scenes/GameScene.js
class GameScene extends Phaser.Scene {
    create() {
        // Initialize ECS World (from js/core/ECS.js)
        this.world = new World();
        
        // Create bridge to sync entities with Phaser sprites
        this.ecsBridge = new PhaserECSBridge(this, this.world);
        
        // Initialize game systems (from js/systems/)
        this.initializeSystems();
        
        // Create player entity
        this.createPlayer();
    }
    
    initializeSystems() {
        // Initialize existing systems
        this.movementSystem = new MovementSystem(this.world);
        this.combatSystem = new CombatSystem(this.world);
        this.aiSystem = new AISystem(this.world);
        // ... etc
        
        // Store in array for update loop
        this.systems = [
            this.movementSystem,
            this.combatSystem,
            this.aiSystem,
            // ...
        ];
    }
    
    update(time, delta) {
        const dt = delta / 1000; // Convert to seconds
        
        // Update all game systems (game logic)
        this.systems.forEach(system => system.update(dt));
        
        // Sync ECS entities to Phaser sprites (rendering)
        this.ecsBridge.updateAll();
    }
    
    createPlayer() {
        // Create entity in ECS world
        const player = this.world.createEntity('player');
        
        // Add components
        player.addComponent('position', { x: 600, y: 700 });
        player.addComponent('velocity', { vx: 0, vy: 0 });
        player.addComponent('collision', { radius: 20 });
        player.addComponent('health', { current: 100, max: 100 });
        
        // Bridge will create Phaser sprite automatically
        // when it sees this entity in updateAll()
    }
}
```

### Rendering Flow

```
ECS Entity (Data)
    ↓
    │ Component: position = {x: 100, y: 200}
    │ Component: velocity = {vx: 50, vy: 0}
    │ Component: health = {current: 80, max: 100}
    ↓
PhaserECSBridge.syncEntity()
    ↓
    │ Check if sprite exists for entity
    │ If not, create sprite based on entity.type
    │ Update sprite.x/y from position component
    │ Update sprite visual effects based on health
    ↓
Phaser Sprite (Visual)
    ↓
Rendered to screen by Phaser
```

### Input Flow

```
User presses 'W' key
    ↓
Phaser Input System detects keydown
    ↓
GameScene reads: this.keys.W.isDown
    ↓
MovementSystem updates player velocity component
    ↓
MovementSystem updates player position component
    ↓
PhaserECSBridge syncs position to sprite
    ↓
Player sprite moves on screen
```

### Collision Flow (Option 1: ECS-based)

```
CollisionSystem.update()
    ↓
    │ Query all entities with collision components
    │ Check distance between each pair
    │ If overlap, trigger collision event
    ↓
Systems respond to collision
    ↓
    │ CombatSystem: Apply damage
    │ ParticleSystem: Create explosion
    │ Remove projectile entity
    ↓
PhaserECSBridge removes sprite
```

### Collision Flow (Option 2: Phaser Physics)

```
Phaser Physics Body detects overlap
    ↓
Physics collision callback fires
    ↓
Callback finds associated entities
    ↓
Apply damage to entity components
    ↓
Systems respond as above
```

## Migration Patterns

### Pattern 1: Pure Logic (100% Reusable)

```javascript
// js/systems/WaveSystem.js
class WaveSystem {
    update(deltaTime) {
        this.waveTimer += deltaTime;
        
        if (this.waveTimer >= this.waveInterval) {
            this.spawnWave();
            this.waveTimer = 0;
            this.waveNumber++;
        }
    }
    
    spawnWave() {
        const enemyCount = 5 + this.waveNumber * 2;
        for (let i = 0; i < enemyCount; i++) {
            this.spawner.spawnEnemy(this.getEnemyType());
        }
    }
}
```

**Status**: ✅ No changes needed, works in both versions.

### Pattern 2: Rendering (Needs Adaptation)

```javascript
// ORIGINAL: js/systems/RenderSystem.js
class RenderSystem {
    render(deltaTime) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        entities.forEach(entity => {
            const pos = entity.position;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(pos.x, pos.y, 20, 20);
        });
    }
}
```

**Phaser Approach**: Remove RenderSystem, use PhaserECSBridge instead.

### Pattern 3: Input (Needs Adaptation)

```javascript
// ORIGINAL: js/systems/MovementSystem.js
setupInput() {
    window.addEventListener('keydown', e => {
        this.keys[e.key] = true;
    });
}
```

**Phaser Approach**:
```javascript
// phaser/scenes/GameScene.js
create() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.movementSystem = new MovementSystem(this.world, this.keys);
}
```

### Pattern 4: Particles (Enhanced in Phaser)

```javascript
// ORIGINAL: Custom particle system with manual drawing
// PHASER: Use built-in particle emitters

createExplosion(x, y) {
    const emitter = this.add.particles(x, y, 'particle', {
        speed: { min: 50, max: 200 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        quantity: 20
    });
    emitter.explode();
}
```

## File Organization

### What Goes Where?

| Code Type | Location | Notes |
|-----------|----------|-------|
| Pure game logic | `js/systems/` | Reused as-is |
| Game data | `js/data/` | 100% compatible |
| ECS core | `js/core/` | Engine-agnostic |
| Phaser scenes | `phaser/scenes/` | New code |
| Phaser rendering | `phaser/systems/PhaserECSBridge.js` | New adapter |
| Phaser utilities | `phaser/utils/` | Phaser-specific helpers |
| Save/Score managers | `js/managers/` | Reused |
| Audio (adapted) | `phaser/systems/PhaserAudioManager.js` | Adapted for Phaser |

## Testing Strategy

### Parallel Testing
Keep both versions working simultaneously:
1. Test feature in vanilla JS version (`index.html`)
2. Port to Phaser version (`index-phaser.html`)
3. Compare behavior
4. Ensure consistency

### Unit Tests
- ECS core tests (works for both)
- System logic tests (works for both)
- Phaser integration tests (Phaser-specific)

### Visual Comparison
Create side-by-side comparison tests to ensure visual parity.

## Performance Considerations

### Phaser Optimizations
- **Object Pooling**: Reuse sprites instead of creating/destroying
- **Culling**: Don't render off-screen objects
- **Texture Atlases**: Batch sprite rendering
- **Physics Groups**: Efficient collision checking

### ECS Optimizations
- **Spatial Hashing**: For collision detection
- **Component Arrays**: For cache-friendly iteration
- **Dirty Flags**: Only update changed entities

## Future Enhancements

### What Phaser Enables

1. **Better Visual Effects**
   - Particle systems (explosions, trails)
   - Post-processing shaders
   - Camera effects (zoom, shake)
   - Tweening animations

2. **Mobile Support**
   - Touch controls
   - Responsive scaling
   - Performance optimization

3. **Asset Pipeline**
   - Sprite sheets
   - Texture atlases
   - Audio sprites
   - Asset compression

4. **Advanced Features**
   - Tilemaps (if adding levels)
   - Tilesprites (for scrolling backgrounds)
   - Bitmap fonts
   - Container management

## Conclusion

The hybrid architecture allows:
- ✅ **Maximum code reuse** (60-70% of original code works as-is)
- ✅ **Phaser benefits** (better rendering, effects, tools)
- ✅ **Maintainability** (changes to game logic affect both versions)
- ✅ **Learning path** (compare vanilla vs engine-based approaches)

This approach proves that **good game architecture transcends the engine**. Well-designed ECS and data-driven systems can be ported to any platform with minimal effort.

---

**Key Takeaway**: We're not rewriting the game; we're giving it a new rendering layer.
