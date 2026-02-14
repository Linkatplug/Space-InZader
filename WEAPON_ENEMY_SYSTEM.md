# Weapon and Enemy System Implementation

## Overview

This document describes the implementation of the weapon and enemy systems for the Phaser port of Space InZader.

## Weapon System

### Architecture

The `PhaserWeaponSystem` manages all weapon firing, projectiles, and combat effects. It integrates with the existing weapon data from `js/data/NewWeaponData.js`.

### Implemented Weapon Types

The system supports 5 different weapon behavior types:

1. **Direct Projectiles** (`type: 'direct'`)
   - Standard bullets that travel in a straight line
   - Examples: Ion Blaster, Auto Cannon, Gauss Repeater
   - Visual: Colored circles with glow effect

2. **Homing Missiles** (`type: 'homing'`)
   - Projectiles that track and follow their target
   - Examples: Overload Missile, Fusion Rocket, Cluster Missile
   - Visual: Projectiles that curve toward enemies

3. **Beam Weapons** (`type: 'beam'`)
   - Continuous instant-hit beams
   - Examples: Disruptor Beam, Thermal Lance
   - Visual: Line with glow effect, fades quickly
   - Applies damage directly without projectile

4. **Pulse/AoE** (`type: 'pulse'`)
   - Area-of-effect weapons that damage in a radius
   - Examples: EMP Pulse, Solar Flare, Shockwave Emitter
   - Visual: Expanding circle from player position
   - Damages all enemies in radius

5. **Chain Lightning** (`type: 'chain'`)
   - Arcs between multiple enemies
   - Examples: Arc Disruptor
   - Visual: Zigzag lightning bolts between targets
   - Damage reduces per chain (70% per hop)

### Available Weapons (by Damage Type)

#### EM Weapons (Anti-Shield)
- `ion_blaster` - Rapid-fire direct projectiles
- `emp_pulse` - High-damage AoE pulse
- `arc_disruptor` - Chain lightning
- `disruptor_beam` - Continuous beam
- `overload_missile` - Homing missile with AoE
- `em_drone_wing` - Drone summon (not yet implemented)

#### Thermal Weapons (Anti-Structure)
- `solar_flare` - AoE pulse damage
- `plasma_stream` - Continuous beam
- `thermal_lance` - High-damage beam
- `incinerator_mine` - Area denial (not yet implemented)
- `fusion_rocket` - Homing missile
- `starfire_array` - Multi-projectile (not yet implemented)

#### Kinetic Weapons (Anti-Armor)
- `auto_cannon` - Rapid ballistic fire
- `gauss_repeater` - Fast kinetic projectiles
- `mass_driver` - Heavy single shots
- `shrapnel_burst` - Shotgun spread (not yet implemented)
- `siege_slug` - Slow powerful shots
- `cluster_missile` - Homing with submunitions

#### Explosive Weapons (Anti-Armor + AoE)
- `gravity_bomb` - Homing with gravity well
- `drone_swarm` - Multiple drones (not yet implemented)
- `orbital_strike` - Heavy delayed strike (not yet implemented)
- `shockwave_emitter` - AoE pulse
- `minefield_layer` - Mine deployment (not yet implemented)

### Current Implementation

The GameScene initializes with 2 starting weapons:
- **Ion Blaster** (EM, Direct) - Anti-shield rapid fire
- **Solar Flare** (Thermal, Pulse) - AoE burst damage

To add more weapons, modify `initializePlayerWeapons()` in GameScene:

```javascript
this.weaponSystem.initializePlayerWeapons([
    'ion_blaster',      // EM rapid
    'solar_flare',      // Thermal AoE
    'auto_cannon',      // Kinetic direct
    'gravity_bomb',     // Explosive homing
    'arc_disruptor',    // EM chain
    'thermal_lance',    // Thermal beam
    'mass_driver',      // Kinetic heavy
    'shockwave_emitter' // Explosive AoE
]);
```

### Features

- **Auto-Targeting**: Weapons automatically find and fire at the nearest enemy
- **Cooldown System**: Each weapon has independent cooldown based on fire rate
- **Visual Feedback**: Different colors and effects per weapon type
- **Hit Detection**: Accurate collision detection with generous hitboxes
- **Hit Effects**: Particle explosions on impact
- **Multiple Projectiles**: Can have many projectiles on screen simultaneously

## Enemy System

### Architecture

The `PhaserEnemySystem` manages enemy spawning, AI behaviors, and the 3-layer defense system.

### Implemented Enemy Types (6)

1. **Scout Drone**
   - **Defense**: 100 shield / 35 armor / 45 structure (180 total)
   - **Speed**: Fast (120)
   - **Behavior**: Simple chase
   - **Weakness**: Kinetic (armor is weak)
   - **Visual**: Diamond shape (pink)
   - **XP**: 5

2. **Armored Cruiser**
   - **Defense**: 40 shield / 300 armor / 150 structure (490 total)
   - **Speed**: Slow (70)
   - **Behavior**: Chase
   - **Weakness**: Explosive
   - **Visual**: Rectangle (blue)
   - **XP**: 20

3. **Plasma Entity**
   - **Defense**: 80 shield / 40 armor / 200 structure (320 total)
   - **Speed**: Medium (90)
   - **Behavior**: Weaving movement
   - **Weakness**: Thermal (structure weak)
   - **Visual**: Pulsing circle (orange)
   - **XP**: 18

4. **Siege Hulk**
   - **Defense**: 60 shield / 250 armor / 300 structure (610 total)
   - **Speed**: Very slow (50)
   - **Behavior**: Slow advance
   - **Weakness**: Explosive
   - **Visual**: Hexagon (dark red)
   - **XP**: 30

5. **Interceptor**
   - **Defense**: 120 shield / 70 armor / 80 structure (270 total)
   - **Speed**: Fast (120)
   - **Behavior**: Aggressive chase (1.5x speed)
   - **Weakness**: EM (shield weak)
   - **Visual**: Triangle (varies)
   - **XP**: 15

6. **Elite Destroyer**
   - **Defense**: 150 shield / 120 armor / 150 structure (420 total)
   - **Speed**: Medium (100)
   - **Behavior**: Tactical (keeps distance, circles)
   - **Weakness**: Varies
   - **Visual**: Cross shape (varies)
   - **XP**: 40

### AI Behaviors

1. **Chase**: Simple direct movement toward player
   - Used by: Scout Drone, Armored Cruiser

2. **Weave**: Moves toward player while weaving side-to-side
   - Used by: Plasma Entity
   - Creates sinusoidal pattern

3. **Slow Advance**: Steady downward movement
   - Used by: Siege Hulk
   - Ignores player position

4. **Aggressive**: Fast pursuit at 1.5x speed
   - Used by: Interceptor
   - Closes distance quickly

5. **Tactical**: Maintains preferred distance and circles
   - Used by: Elite Destroyer
   - Keeps ~200 units away, orbits player

### Defense Layer System

Each enemy has 3 defense layers that must be depleted in order:

1. **Shield** (Blue health bar)
   - Regenerates over time (not yet implemented)
   - Weak to EM damage (150% damage)
   - Resistant to other types (100% damage)

2. **Armor** (Orange health bar)
   - No regeneration
   - Weak to Kinetic and Explosive (120% damage)
   - Resistant to EM and Thermal (50% damage)

3. **Structure** (Red health bar)
   - Final layer, no regeneration
   - Weak to Thermal damage (130% damage)
   - Normal damage from other types (100%)

Additionally, each enemy has a **weakness** type that deals 150% damage to that specific enemy when hit.

### Wave System

Enemies spawn based on wave progression:

- **Waves 1-2**: Scout Drones only
- **Waves 3-4**: Scouts, Armored Cruisers, Plasma Entities
- **Waves 5-7**: Add Interceptors
- **Waves 8+**: All enemy types including Elite Destroyers and Siege Hulks

Waves increase every 30 seconds. Spawn rate accelerates with each wave.

### Visual Features

- **Unique Shapes**: Each enemy type has a distinct visual
- **Color Coding**: Different colors per type
- **Health Bars**: Show current defense layer with color
  - Cyan = Shield active
  - Orange = Armor active
  - Red = Structure only
- **Damage Numbers**: Yellow floating numbers on hit
- **Death Effects**: Particle explosion matching enemy color
- **Screen Shake**: Camera shake on enemy death

## Combat Integration

### Damage Application

When a weapon hits an enemy:

1. Check for weakness bonus (1.5x if matching)
2. Apply to shield layer first (with type modifiers)
3. Overflow damage goes to armor (with resistances)
4. Final overflow goes to structure
5. Enemy dies when all layers depleted

### Collision Detection

The system checks:
- **Projectile vs Enemy**: Generous 20-unit hitbox
- **AoE vs Enemy**: Radius-based detection
- **Player vs Enemy**: 35-unit collision damage

### Score System

Score is awarded on enemy kill:
- Score = Enemy XP Value × 10
- Scout: 50 points
- Cruiser: 200 points
- Plasma: 180 points
- Hulk: 300 points
- Interceptor: 150 points
- Elite: 400 points

## Performance Considerations

### Current Optimizations

- Projectiles auto-cleanup after 3 seconds or off-screen
- Enemies cleanup when off-screen or destroyed
- Graphics objects properly destroyed
- No object pooling yet (could be added)

### Known Limitations

- Maximum ~100 projectiles before performance impact
- Maximum ~50 enemies tested
- No spatial hashing for collision detection
- Beam weapons create temporary graphics each frame

## Future Enhancements

### Weapon Features
- [ ] Drone weapons (summonable allies)
- [ ] Mine deployment
- [ ] Orbital strikes
- [ ] Weapon upgrades/leveling
- [ ] Combo weapons (evolution system)

### Enemy Features
- [ ] Boss enemies
- [ ] Enemy firing at player
- [ ] Shield regeneration
- [ ] Formation flight
- [ ] More complex AI patterns

### Combat Features
- [ ] Critical hits
- [ ] Damage over time effects
- [ ] Status effects (stun, slow)
- [ ] Player shield/armor
- [ ] XP orb drops

## Usage Example

```javascript
// In GameScene.create()

// Initialize weapon system
this.weaponSystem = new PhaserWeaponSystem(this);
this.weaponSystem.initializePlayerWeapons([
    'ion_blaster',
    'solar_flare',
    'auto_cannon'
]);

// Initialize enemy system
this.enemySystem = new PhaserEnemySystem(this);

// In update()
const dt = delta / 1000;
const enemies = this.enemySystem.getEnemies();

// Update weapons (auto-fires at enemies)
this.weaponSystem.update(dt, playerPosition, enemies);

// Update enemies (spawning and AI)
this.enemySystem.update(dt, playerPosition);

// Check collisions
enemies.forEach(enemy => {
    const hits = this.weaponSystem.checkProjectileCollision(enemy);
    hits.forEach(hit => {
        this.enemySystem.damageEnemy(enemy, hit.damage, hit.damageType);
    });
});
```

## Testing Checklist

- [x] Weapon firing works
- [x] Auto-targeting selects nearest enemy
- [x] Projectiles travel correctly
- [x] Homing missiles track targets
- [x] Beam weapons hit instantly
- [x] AoE weapons damage in radius
- [x] Chain lightning arcs between enemies
- [x] Enemy spawning works
- [x] All 6 enemy types have unique visuals
- [x] AI behaviors are distinct
- [x] Defense layers work correctly
- [x] Damage type effectiveness works
- [x] Health bars show correct layer
- [x] Death effects appear
- [x] Score is awarded
- [ ] Performance with 100+ entities
- [ ] Wave progression feels balanced

## Configuration

### Adding New Weapons

1. Ensure weapon is defined in `js/data/NewWeaponData.js`
2. Add weapon ID to `initializePlayerWeapons()` array
3. Weapon will auto-fire using existing type system

### Tweaking Balance

Edit values in enemy system:
- Spawn rate: `spawnInterval` in `update()`
- Wave progression: `nextWave()` timer (currently 30s)
- Enemy health: Modify defense values in `EnemyProfiles.js`
- Damage multipliers: Adjust in `damageEnemy()` method

## Credits

- Weapon data from original Space InZader
- Enemy profiles from defense system update
- Phaser 3 for rendering and game loop
- Integration architecture by Phaser port team
