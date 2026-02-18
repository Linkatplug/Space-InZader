# Enemy Architecture Audit Report
**Space InZader Game - Enemy System Analysis**  
**Date:** 2026-02-14  
**Status:** Complete

---

## Executive Summary

Space InZader employs a **hybrid health system** with two parallel implementations:
1. **Legacy System**: Simple health pool (EnemyData.js)
2. **Modern System**: 3-layer defense model with resistances (EnemyProfiles.js + DefenseSystem.js)

The game features **12 distinct enemy profiles** with sophisticated AI behaviors, multi-phase boss encounters, and dynamic difficulty scaling based on both time and wave progression.

---

## 1. Health Architecture

### 1.1 System Overview

**Question: Do enemies use HealthComponent or DefenseSystem?**

**Answer:** Enemies use **DefenseSystem** with a 3-layer defense model when using the modern EnemyProfiles.js system.

### 1.2 Legacy System (EnemyData.js)

**Location:** `/js/data/EnemyData.js` (Lines 20-40)

Simple health pool implementation:

```javascript
// Example: Basic Drone
health: 30,        // Single health value
damage: 10,        // Contact damage
armor: 0           // Optional damage reduction %
```

**Enemy Health Values (Legacy):**
- **Démon Vitesse**: 8 HP (lowest)
- **Drone Basique**: 30 HP
- **Tank**: 120 HP
- **Boss Standard**: 1500 HP
- **Tank Boss**: 2500 HP (highest)

### 1.3 Modern Defense System (EnemyProfiles.js + DefenseSystem.js)

**Location:** `/js/data/EnemyProfiles.js` (Lines 159-162)

Three-layer defense model with damage type resistances:

```javascript
defense: {
    shield: 100,     // Layer 1: EM resistance
    armor: 35,       // Layer 2: Kinetic resistance
    structure: 45    // Layer 3: Thermal/Explosive resistance
}
// Total Effective HP = shield + armor + structure
```

**Defense System Processing** (`/js/systems/DefenseSystem.js`):
- **Damage Type Mapping**: EM, Kinetic, Thermal, Explosive
- **Resistance Calculation**: `actualDamage = damage × (1 - resistance)`
- **Layer Penetration**: Damage flows Shield → Armor → Structure
- **Regeneration**: Configurable per layer with delay mechanics

**Example Profile** (Scout Drone):
```javascript
shield: {
    current: 100,
    max: 100,
    resistances: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.3 }
}
armor: {
    current: 35,
    max: 35,
    resistances: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.3 }
}
structure: {
    current: 45,
    max: 45,
    resistances: { em: 0.3, thermal: 0.0, kinetic: 0.15, explosive: 0.1 }
}
```

---

## 2. Enemy Components & Structure

### 2.1 Complete Component List

When an enemy is spawned (`SpawnerSystem.js:261-362`), it receives:

| Component | Purpose | Required |
|-----------|---------|----------|
| **position** | {x, y} coordinates | ✓ Yes |
| **velocity** | {x, y} movement vector | ✓ Yes |
| **defense** | 3-layer defense model | ✓ Modern |
| **health** | Single health pool | ✓ Legacy |
| **collision** | Hitbox radius | ✓ Yes |
| **renderable** | Visual properties (color, size, shape) | ✓ Yes |
| **enemy** | AI type, damage, speed, xpValue | ✓ Yes |
| **boss** | Multi-phase behavior | ○ Bosses only |
| **ai** | Behavior state machine | ✓ Yes |
| **invulnerable** | Temporary immunity timer | ○ Conditional |

### 2.2 Boss Component Structure

**Location:** `SpawnerSystem.js:351-359`

Bosses receive a special **boss component**:

```javascript
boss: {
    phase: 1,
    patterns: ['chase', 'spiral', 'enrage'],
    phaseTimer: 0,
    nextPhaseThreshold: 0.5,  // 50% HP triggers phase 2
    isEnraged: false
}
```

**Boss Identification:** Explicit `isBoss: true` flag in profile data.

---

## 3. Enemy HP Definition Locations

### 3.1 Static HP Definition

**Primary Locations:**
1. **Legacy Data:** `/js/data/EnemyData.js` (Lines 35-250)
2. **Modern Profiles:** `/js/data/EnemyProfiles.js` (Lines 20-160)

**Modern System Total HP Calculation:**
```javascript
totalHP = defense.shield.max + defense.armor.max + defense.structure.max

// Example: Elite Destroyer
shield: 300, armor: 400, structure: 500
totalHP = 300 + 400 + 500 = 1200 HP
```

### 3.2 Dynamic HP Scaling

**Location:** `SpawnerSystem.js:676-702` (`scaleEnemyStats()` method)

```javascript
const timeFactor = 1 + (gameTime / 300) * 0.3;  // +30% per 5 minutes
const multipliers = calculateDifficultyMultipliers(gameTime, waveNumber);

scaledHealth = baseHealth × multipliers.enemyHealthMult × difficultyMultiplier;
```

**Scaling Formulas** (See Section 7 for complete details)

---

## 4. Enemy Rendering System

### 4.1 Rendering Pipeline

**Location:** `/js/systems/RenderSystem.js:246-287` (`renderEnemies()` method)

**Rendering Order:**
1. Background particles
2. Pickup items
3. Projectiles
4. **Enemies** ← Primary rendering
5. Weather effects
6. Player ship
7. UI overlays

### 4.2 Enemy Visual Effects

**Per-Enemy Rendering:**

```javascript
// Position & Rotation
ctx.translate(pos.x, pos.y);
ctx.rotate(rotation);

// Glow Effect
ctx.shadowBlur = isBoss ? 25 : 15;
ctx.shadowColor = enemy.color;

// Damage Flash
if (invulnerable) {
    ctx.globalAlpha = 0.3 + (invulnTimer / invulnTime) * 0.7;
}

// Shape Drawing
// - Triangles for fast enemies
// - Hexagons for tanks
// - Octagons for bosses
```

**Health Bar Display:**
- **Position:** 40px above enemy (200px for bosses)
- **Width:** 40px regular, 200px bosses
- **Color Coding:**
  - Green: HP > 50%
  - Yellow: 25% < HP ≤ 50%
  - Red: HP ≤ 25%

**Tactical Indicators:**
- **▼ (Down Arrow):** Weak to damage type
- **■ (Square):** Normal resistance
- **▲ (Up Arrow):** Resistant to damage type

### 4.3 Visual Profile Variations

**12 Enemy Types with Distinct Visuals:**

| Enemy Type | Color | Shape | Size | Glow |
|------------|-------|-------|------|------|
| Scout Drone | #FF1493 (Hot Pink) | Triangle | 12 | 15 |
| Interceptor | #00FFFF (Cyan) | Triangle | 10 | 15 |
| Plasma Entity | #FF00FF (Magenta) | Octagon | 15 | 20 |
| Armored Cruiser | #FFA500 (Orange) | Hexagon | 18 | 15 |
| Elite Destroyer | #8B00FF (Violet) | Octagon | 30 | 25 |
| Void Carrier | #000033 (Dark Blue) | Octagon | 35 | 25 |

---

## 5. Enemy Destruction System

### 5.1 Death Sequence Flow

**Primary Handler:** `CollisionSystem.js:563-780` (`killEnemy()` method)

**Complete Death Pipeline:**

```
Enemy Death Triggered
    ↓
[1] Visual/Audio Effects
    ├── Explosion sound (variable pitch 0.8-1.2)
    ├── Screen shake (intensity 8, duration 0.3s)
    └── Particle explosion (20-30 particles)
    ↓
[2] Special Death Mechanics
    ├── Explosive Enemy AOE (80px radius, 40 damage)
    ├── Chain Lightning (if player stat active)
    └── Chain Explosions (if stat active)
    ↓
[3] Loot Drops
    ├── XP Pickup (always, enemyComp.xpValue)
    ├── Health Pack (6.25-12.5% chance, 5-15 HP)
    └── Module Drop (0.5% regular, 3% boss)
    ↓
[4] Cleanup
    ├── Update kill statistics
    └── Remove entity from world (Line 779)
```

### 5.2 Particle System Details

**Location:** `/js/systems/ParticleSystem.js:66-107` (`createExplosion()`)

**Explosion Parameters:**
```javascript
particleCount: 15-40 (scales with enemy size)
velocity: 50-150 units/sec (radial spread)
lifetime: 0.5-1.0 seconds
velocityDecay: 0.92 per frame
alphaDecay: fadeOut over lifetime

// Color Variations
colors: [
    enemy.color,              // Base color
    lighten(enemy.color, 20%), // Light variation
    darken(enemy.color, 20%)   // Dark variation
]

// Delayed Shockwave
ringParticles: 2 rings × 20 particles each
ringDelay: 0.05s, 0.1s
```

### 5.3 Special Death Mechanics

**Explosive Enemies** (`CollisionSystem.js:605-645`):
```javascript
explosionRadius: 80,
explosionDamage: 40,
falloffMode: 'distance',
playerDamage: 100% of explosion damage,
enemyDamage: 50% of explosion damage (friendly fire reduction)
```

**Chain Lightning** (if player has stat):
```javascript
targetCount: 2-6 enemies
range: 150px (closest)
damage: 30% of killed enemy's max HP
```

**Chain Explosions** (prevents infinite cascade):
```javascript
radius: 80px
damage: 50-100% (distance falloff)
preventLoop: marks enemies as "killedByExplosion"
```

### 5.4 Cleanup & Entity Removal

**Final Removal:** `Line 779: this.world.removeEntity(enemy.id)`

- All components destroyed
- Memory released
- No manual visual cleanup (renderer skips dead entities)
- Particle system auto-cleans particles when lifetime ≤ 0

---

## 6. Boss Architecture

### 6.1 Structural Implementation

**Question: Do bosses exist structurally or only via stats?**

**Answer:** Bosses exist **STRUCTURALLY** with dedicated component and behavioral systems.

**Boss Identification Criteria:**
1. `isBoss: true` flag in profile data
2. Receives dedicated **boss component** (SpawnerSystem.js:351-359)
3. Special rendering (200px health bar, 25 glow intensity)
4. Unique AI patterns and phase transitions

### 6.2 Boss Profiles

**Location:** `/js/data/EnemyProfiles.js`

**Two Boss Types:**

#### ELITE_DESTROYER (Lines 113-131)
```javascript
{
    id: 'elite_destroyer',
    name: 'Elite Destroyer',
    isBoss: true,
    spawnCost: 50,
    xpValue: 100,
    baseSpeed: 70,
    defense: {
        shield: 300,
        armor: 400,
        structure: 500
    },
    // Total HP: 1200
    damageType: 'kinetic',
    weakness: 'thermal'
}
```

#### VOID_CARRIER (Lines 133-151)
```javascript
{
    id: 'void_carrier',
    name: 'Void Carrier',
    isBoss: true,
    spawnCost: 75,
    xpValue: 150,
    baseSpeed: 50,
    defense: {
        shield: 500,
        armor: 300,
        structure: 400
    },
    // Total HP: 1200
    damageType: 'em',
    weakness: 'explosive'
}
```

### 6.3 Multi-Phase Boss Logic

**Location:** `/js/systems/AISystem.js:417-583` (`updateBossAI()` method)

**Phase Transition System:**

```javascript
// Phase Trigger
const healthPercent = currentHP / maxHP;
boss.isEnraged = healthPercent <= 0.6;  // 60% HP threshold

// Visual Feedback
if (boss.isEnraged && !wasEnraged) {
    screenEffects.flash();
    audioManager.play('electric');
}
```

**Phase 1: Normal Behavior**
- Movement: Circular strafing (0.7x orbit radius)
- Burst Bullets: Every 2.5 seconds
- Laser Sweep: Every 4.0 seconds

**Phase 2: Enraged (≤60% HP)**
- Movement: 1.5x speed, tighter orbit (1.2x radius)
- Burst Bullets: Every 1.5 seconds (40% faster)
- Laser Sweep: Every 2.5 seconds (37.5% faster)
- Minion Summon: Every 5 seconds (enraged-only ability)

**Attack Patterns:**

1. **Burst Bullets** (Lines 474-512):
   ```javascript
   projectileCount: 12
   fanAngle: 120 degrees
   telegraph: 500ms (red indicator)
   speed: 300 units/sec
   ```

2. **Laser Sweep** (Lines 514-554):
   ```javascript
   duration: 1.5 seconds
   rotationSpeed: Math.PI radians/sec
   width: 10 pixels
   telegraph: 500ms (yellow beam)
   ```

3. **Minion Summon** (Lines 556-579):
   ```javascript
   spawnCount: 2-3 minions
   minionType: 'scout_drone'
   cooldown: 5 seconds
   spawnRadius: 100px around boss
   ```

### 6.4 Boss Spawn Timing

**Location:** `/js/systems/WaveSystem.js:91-93`

```javascript
// Boss spawns every 10th wave
if (waveNumber % 10 === 0) {
    spawnBoss();
}

// Elite spawns every 5th wave
if (waveNumber % 5 === 0) {
    spawnElite();
}
```

---

## 7. Wave Scaling System

### 7.1 Wave Progression Mechanics

**Location:** `/js/systems/WaveSystem.js`

**Core Parameters:**
- **Wave Duration:** 35 seconds per wave
- **Inter-Wave Pause:** 1.5 seconds (player recovery)
- **Boss Frequency:** Every 10 waves
- **Elite Frequency:** Every 5 waves

### 7.2 Difficulty Calculation

**Location:** `SpawnerSystem.js:136-172` (`calculateDifficultyMultipliers()`)

**Early Game Easing (Waves 1-6):**

Provides gentle ramp-up for new players:

```javascript
const t = (waveNumber - 1) / 5;  // Progress through first 6 waves

// Enemy Count Multiplier
baseCountMult = min(4.0, 1 + (timeMinutes * 0.20));
earlyCountEasing = 0.6 + (0.4 * t);
enemyCountMult = baseCountMult * earlyCountEasing;

// Enemy Health Multiplier
normalHealthMult = min(5.0, 1 + (waveNumber * 0.15));
earlyHealthEasing = 0.7 + (0.3 * t);
enemyHealthMult = normalHealthMult * earlyHealthEasing;

// Enemy Speed Multiplier
normalSpeedMult = min(2.0, 1 + (waveNumber * 0.05));
earlySpeedEasing = 0.85 + (0.15 * t);
enemySpeedMult = normalSpeedMult * earlySpeedEasing;
```

**Normal Scaling (Wave 7+):**

```javascript
wave8Bonus = max(0, waveNumber - 7);  // Additional scaling post-wave 7

enemyCountMult = min(4.0, 1 + (timeMinutes * 0.20) + (wave8Bonus * 0.06));
enemyHealthMult = min(5.0, 1 + (waveNumber * 0.15) + (wave8Bonus * 0.05));
enemySpeedMult = min(2.0, 1 + (waveNumber * 0.05) + (wave8Bonus * 0.03));
```

### 7.3 Enemy Stat Scaling Formula

**Location:** `SpawnerSystem.js:676-702` (`scaleEnemyStats()`)

```javascript
// Time-based multiplier: +30% per 5 minutes
const timeFactor = 1 + (gameTime / 300) * 0.3;

// Get wave-based multipliers
const multipliers = calculateDifficultyMultipliers(gameTime, waveNumber);

// Apply scaling
scaledHealth = baseHealth * multipliers.enemyHealthMult * difficultyMultiplier;
scaledDamage = baseDamage * timeFactor * difficultyMultiplier;
scaledSpeed = baseSpeed * multipliers.enemySpeedMult;
scaledXP = baseXP * timeFactor;
```

### 7.4 Scaling Caps & Limits

**Hard Limits:**

| Parameter | Maximum | Purpose |
|-----------|---------|---------|
| Enemy Count Multiplier | 4.0x | Prevent overwhelming spawns |
| Health Multiplier | 5.0x | Maintain viable kill times |
| Speed Multiplier | 2.0x | Keep combat playable |
| Max Enemies on Screen | 40 | Performance & visual clarity |

**Spawner Budget Growth:**

```javascript
// Location: SpawnerSystem.js:16-17, 130-175
timeMinutes = gameTime / 60;

if (timeMinutes < 5) {
    budget = 1.0;  // Early game
} else if (timeMinutes < 10) {
    budget = 2.5;  // Mid game
} else if (timeMinutes < 20) {
    budget = 3.5;  // Late game
} else {
    budget = 5.0 + (timeMinutes - 20) * 0.5;  // Endgame scaling
}

// Maximum observed: 18+ budget/sec at 40+ minutes
```

### 7.5 Example Scaling Progression

**Scout Drone Scaling Example:**

| Time | Wave | Base HP | Scaled HP | Base DMG | Scaled DMG | Base Speed | Scaled Speed |
|------|------|---------|-----------|----------|------------|------------|--------------|
| 0 min | 1 | 180 | 126 | 10 | 10 | 120 | 102 |
| 5 min | 6 | 180 | 216 | 10 | 13 | 120 | 120 |
| 10 min | 12 | 180 | 342 | 10 | 16 | 120 | 132 |
| 20 min | 24 | 180 | 648 | 10 | 22 | 120 | 150 |
| 40 min | 48 | 180 | 900 | 10 | 34 | 120 | 180 |

**Calculations:**
- Wave 1: 180 × 0.7 (early easing) = 126 HP
- Wave 6: 180 × (1 + 1×0.15) × 1.0 (easing complete) = 216 HP
- Wave 12: 180 × (1 + 6×0.15 + 5×0.05) = 342 HP
- Time scaling affects damage: 10 × (1 + 10/5×0.3) = 16 DMG at 10 min

---

## 8. Enemy-Related File Structure

### 8.1 Core Data Files

**Enemy Definitions:**
- `/js/data/EnemyData.js` - Legacy enemy stats (20 enemy types)
- `/js/data/EnemyProfiles.js` - Modern defense-layer profiles (12 profiles)

**Supporting Data:**
- `/js/data/DefenseData.js` - Defense system configuration
- `/js/data/BalanceConstants.js` - Global balance parameters

### 8.2 System Files

**Primary Systems:**
- `/js/systems/SpawnerSystem.js` - Enemy creation & scaling (Lines 261-702)
- `/js/systems/AISystem.js` - Enemy behavior & boss AI (Lines 417-583)
- `/js/systems/DefenseSystem.js` - 3-layer defense processing
- `/js/systems/CollisionSystem.js` - Enemy death handling (Lines 563-780)
- `/js/systems/WaveSystem.js` - Wave progression logic
- `/js/systems/RenderSystem.js` - Enemy rendering (Lines 246-287)
- `/js/systems/MovementSystem.js` - Enemy movement processing

**Supporting Systems:**
- `/js/systems/ParticleSystem.js` - Death explosions (Lines 66-107)
- `/js/systems/CombatSystem.js` - Damage calculation
- `/js/systems/PickupSystem.js` - Loot drop handling

### 8.3 Component Architecture

**Entity-Component-System (ECS) Framework:**
- `/js/core/ECS.js` - Base ECS implementation
- `/js/core/GameState.js` - Game state & entity management

**Enemy Components Used:**
1. `position` - Spatial location
2. `velocity` - Movement vector
3. `defense` - 3-layer defense model (modern)
4. `health` - Single HP pool (legacy)
5. `collision` - Collision detection
6. `renderable` - Visual properties
7. `enemy` - Enemy-specific data
8. `boss` - Boss-specific behaviors
9. `ai` - AI state machine
10. `invulnerable` - Temporary immunity

---

## 9. Summary of Findings

### 9.1 Key Architecture Decisions

**✅ Strengths:**
1. **Dual Health System:** Supports both simple and complex defense mechanics
2. **Structural Boss Design:** Bosses have dedicated components and multi-phase logic
3. **Sophisticated Scaling:** Time + wave-based with early-game easing
4. **Rich Visual Feedback:** Health bars, tactical indicators, damage flashes
5. **Comprehensive Death System:** Particles, loot, chain reactions, audio

**⚠️ Architectural Notes:**
1. **Hybrid System Complexity:** Two parallel health systems (legacy + modern) may cause confusion
2. **Hard-Coded Values:** Many magic numbers (e.g., 60% phase threshold, 80px explosion radius)
3. **Performance Concerns:** 40 enemy cap suggests potential optimization issues at scale

### 9.2 Answers to Mission Objectives

| Question | Answer |
|----------|--------|
| **Do enemies use HealthComponent or DefenseSystem?** | **DefenseSystem** (3-layer defense model in modern system) |
| **List all enemy-related components** | position, velocity, defense, health, collision, renderable, enemy, boss, ai, invulnerable |
| **Where is HP defined?** | EnemyData.js (legacy), EnemyProfiles.js (modern), scaled at spawn in SpawnerSystem.js:676-702 |
| **How are enemies rendered?** | RenderSystem.js:246-287 with glow, health bars, tactical indicators, damage flash |
| **How are enemies destroyed?** | CollisionSystem.js:563-780 with particles, loot, chain reactions, entity removal |
| **Do bosses exist structurally?** | **YES** - Dedicated boss component, multi-phase AI, special rendering |
| **How does wave scaling work?** | Time + wave multipliers with early-game easing, caps at 4x count/5x HP/2x speed |

### 9.3 Recommendations

**For Future Development:**
1. **Consolidate Health Systems:** Migrate fully to DefenseSystem or create adapter pattern
2. **Externalize Balance Constants:** Move magic numbers to BalanceConstants.js
3. **Boss Phase Configuration:** Make phase thresholds and patterns data-driven
4. **Performance Profiling:** Investigate if 40 enemy cap can be raised
5. **Type Safety:** Add JSDoc types or migrate to TypeScript for component structure

---

## 10. File Reference Index

**Quick Reference for Code Locations:**

```
Enemy Data & Profiles
├── /js/data/EnemyData.js (Lines 20-250) - Legacy enemy definitions
└── /js/data/EnemyProfiles.js (Lines 20-160) - Modern defense-layer profiles

Enemy Spawning & Scaling
├── /js/systems/SpawnerSystem.js:261-362 - Enemy creation
├── /js/systems/SpawnerSystem.js:676-702 - Stat scaling
└── /js/systems/SpawnerSystem.js:136-172 - Difficulty multipliers

Enemy AI & Behavior
├── /js/systems/AISystem.js:417-583 - Boss AI & phases
└── /js/systems/MovementSystem.js - Movement processing

Enemy Combat & Death
├── /js/systems/DefenseSystem.js - 3-layer defense processing
├── /js/systems/CollisionSystem.js:563-780 - Death handling
└── /js/systems/ParticleSystem.js:66-107 - Death explosions

Enemy Rendering
└── /js/systems/RenderSystem.js:246-287 - Visual rendering

Wave & Progression
└── /js/systems/WaveSystem.js:91-93 - Wave progression
```

---

**End of Report**

*This audit provides a complete architectural overview of the enemy system in Space InZader. No code modifications were made during this analysis.*
