# Stat System Audit Report

**Generated:** 2026-02-14  
**Purpose:** Complete audit of all stat systems in Space-InZader  
**Analysis Type:** Read-only code analysis

---

## Executive Summary

The Space-InZader project currently employs **FOUR distinct stat systems** that coexist:

1. **Legacy Health System** (health/maxHealth) - Partially deprecated but still in use
2. **Defense Layer System** (shield/armor/structure) - Active and primary for player/enemies
3. **ShipStats Model** - Pure data model for ship configuration
4. **Player.stats Object** - Dynamic runtime stats with modifiers

### Critical Findings

- ✅ **Defense Layer System is primary** for damage/defense management
- ⚠️ **Legacy health system still used** in 15+ files
- ✅ **ShipStats successfully adopted** for ship configuration (4 ships)
- ⚠️ **player.stats heavily used** for runtime stat calculations (100+ references)
- ⚠️ **Overlap exists** between systems causing potential inconsistencies

---

## 1. Legacy Health System

### Status: PARTIALLY DEPRECATED

The old single-pool health system (health/maxHealth) is still referenced in multiple locations despite the introduction of the defense layer system.

### References Found: 42 locations

#### Active Usage Files:

**Enemy System:**
- `js/systems/SpawnerSystem.js:278-279, 309-310, 689` - Enemy health initialization
- `js/systems/RenderSystem.js:252, 279, 407, 575, 587, 628` - Health bar rendering
- `js/systems/CollisionSystem.js:94-95, 146, 239-240, 309-310, 323-324, 337, 377` - Damage and collision handling
- `js/systems/AISystem.js:418` - AI behavior based on health percentage
- `js/data/EnemyData.js:424` - Enemy health scaling

**Player System:**
- `js/dev/DevTools.js:330, 485-486, 693-694` - DevTools health manipulation
- `js/Game.js:1302-1306, 1326` - Player invulnerability and death check
- `js/systems/PickupSystem.js:122, 206, 290, 292` - Health pickup/healing
- `js/systems/CollisionSystem.js:711, 745-747, 963-964` - Health pickup collision
- `js/systems/UISystem.js:315, 533, 548, 581-583, 2075` - Health UI display
- `js/utils/DebugOverlay.js:247, 265` - Debug display

**DefenseSystem Fallback:**
- `js/systems/DefenseSystem.js:306-307, 321-322, 350-351` - Fallback to health when defense not available

#### Data References:

**Meta Upgrades:**
- `js/managers/SaveManager.js:44` - maxHealth meta upgrade tracking
- `js/data/ShipUpgradeData.js:28, 177, 339, 498` - maxHealth in ship definitions
- `js/systems/UISystem.js:1200, 1212, 1224, 1236, 1317, 1325` - Fallback ship stats

**Passive Effects:**
- `js/data/PassiveData.js:13, 130, 192, 267, 479, 661, 697, 716, 749, 890, 905, 968, 1092, 1389, 1391` - maxHealthMultiplier bonuses

**Synergy System:**
- `js/systems/SynergySystem.js:119, 200-203` - maxHealthMultiplier and healing based on maxHealth
- `js/data/SynergyData.js:49` - maxHealthMultiplier synergy effect

**Components:**
- `js/core/ECS.js:149, 238-243, 273` - Health component factory and player stats

### Assessment:

**Still Active For:**
- Enemy health management (primary)
- Health pickup system
- UI health bars (legacy display)
- Meta upgrade persistence

**Conflicts With:**
- Defense layer system (player uses defense, not health)
- DefenseSystem has fallback logic for health (lines 306-307, 321-322, 350-351)

**Recommendation:** Migrate enemy system to defense layers to eliminate this system entirely.

---

## 2. Defense Layer System

### Status: ACTIVE - PRIMARY SYSTEM

The 3-layer defense system (shield → armor → structure) is the current authoritative model for player and enemy defense.

### References Found: 180+ locations

#### Core Implementation:

**DefenseSystem (Authority):**
- `js/systems/DefenseSystem.js` - Complete implementation
  - Line 39-41: Update all three layers
  - Line 145-147: Layer state reporting
  - Line 160-162: Damage application to layers
  - Line 235: Structure destruction check
  - Line 310, 325: Total defense calculation
  - Line 354: Alive check based on structure

**Defense Data:**
- `js/data/DefenseData.js:139-160` - Layer definitions with resistances
  - BASE_DEFENSE_VALUES for shield/armor/structure
  - LAYER_RESISTANCES for damage type mitigation
  - createDefenseComponent factory

**Component Definition:**
- `js/core/ECS.js:332-340` - Defense component factory
- `js/ui/EnhancedUIComponents.js:91, 95, 99` - UI layer tracking

#### Player Usage:

**Initialization:**
- `js/Game.js:480, 503, 583` - Defense component setup from ShipStats
  - Shield: shipInfo.baseStats.maxShield
  - Armor: shipInfo.baseStats.maxArmor
  - Structure: shipInfo.baseStats.maxStructure

**Runtime:**
- `js/Game.js:1331-1332` - Structure death check
- `js/systems/PickupSystem.js:275, 279-285` - Level-up healing per layer
- `js/systems/ModuleSystem.js:92-95, 152-171` - Module bonuses to defense layers
- `js/dev/DevTools.js:237, 327-329, 672, 680-682` - DevTools defense manipulation

**UI Display:**
- `js/systems/UISystem.js:302-310, 547, 557-574` - Three-layer bars (shield/armor/structure)
- `js/utils/DebugOverlay.js:246, 256-263` - Debug overlay

#### Enemy Usage:

**Enemy Profiles:**
- `js/data/EnemyProfiles.js:160-162, 178, 181, 184, 204-221` - Enemy defense layer configuration
- `js/systems/SpawnerSystem.js:271, 274` - Enemy defense initialization

**Combat:**
- `js/systems/CollisionSystem.js:95, 240, 309, 376, 804, 806` - Enemy/player defense access
- `js/systems/RenderSystem.js:293, 315-324` - Defense-based rendering

### Layer Properties:

Each layer (shield/armor/structure) has:
- `current` - Current HP
- `max` - Maximum HP
- `regen` - Regeneration rate (shield only by default)
- `regenDelay` - Time before regen starts (shield)
- `regenDelayMax` - Max delay reset value
- `resistances` - Object with damage type resistance percentages
  - Keys: 'em', 'thermal', 'kinetic', 'explosive'

### Assessment:

**Currently Authoritative For:**
- Player defense (100%)
- Enemy defense (via EnemyProfiles)
- UI display
- Module/upgrade effects
- Damage application

**Strengths:**
- Well-integrated with DefenseSystem
- Clear layer progression (Shield → Armor → Structure)
- Damage type resistances per layer
- Clean separation from stat modifiers

**Issue:** Some systems still check for health component as fallback

---

## 3. ShipStats Model

### Status: ACTIVE - PURE DATA MODEL

ShipStats is a pure data container class for ship base statistics, introduced as part of the data-driven architecture refactor.

### Implementation:

**Class Definition:**
- `js/core/stats/ShipStats.js` (236 lines)
  - Constructor with config object
  - 11 stat properties
  - Static createDefault() factory method
  - clone(), toObject(), fromObject() methods

**Properties:**
```javascript
{
  damageMultiplier: 1.0,
  fireRateMultiplier: 1.0,
  critChance: 0.05,
  critMultiplier: 1.5,
  maxShield: 120,
  maxArmor: 150,
  maxStructure: 120,
  shieldRegen: 8.0,
  armorReduction: 0,
  heatGenerationMultiplier: 1.0,
  cooldownReduction: 0
}
```

### Usage:

**Ship Configuration:**
- `js/data/ShipData.js:40, 98, 155, 228` - All 4 ships use ShipStats
  - ION_FRIGATE: new ShipStats({ maxShield: 180, ... })
  - BALLISTIC_DESTROYER: new ShipStats({ maxArmor: 220, ... })
  - CATACLYSM_CRUISER: new ShipStats({ critChance: 0.12, ... })
  - TECH_NEXUS: new ShipStats({ heatGenerationMultiplier: 0.8, ... })

**Player Initialization:**
- `js/Game.js:480, 503` - Defense layers initialized from ship.baseStats
  - defense.shield.max = shipInfo.baseStats.maxShield
  - defense.armor.max = shipInfo.baseStats.maxArmor
  - defense.structure.max = shipInfo.baseStats.maxStructure

**HTML Integration:**
- `index.html` - Script tag loads ShipStats.js before ShipData.js

### Stat Calculator:

**FinalStatsCalculator:**
- `js/core/stats/FinalStatsCalculator.js` (310 lines)
- Pure function: `calculate(baseStats, modifiers)`
- Applies additive then multiplicative modifiers
- Returns new immutable ShipStats instance
- Not yet integrated into game systems (prepared for future use)

### Assessment:

**Purpose:**
- Pure data container for ship base statistics
- Foundation for ship configuration
- Provides default values and factories

**Current Integration:**
- ✅ Used by all ships in ShipData
- ✅ Used during player initialization
- ⚠️ Not used for runtime stat calculation (player.stats used instead)
- ⚠️ FinalStatsCalculator created but not integrated

**Potential:** Strong foundation for centralizing all stat calculations

---

## 4. Player.stats Object

### Status: ACTIVE - RUNTIME STAT SYSTEM

The player.stats object is a dynamic runtime system that aggregates stats from multiple sources: base values, passives, upgrades, modules, and synergies.

### References Found: 200+ locations

#### Definition:

**Component Factory:**
- `js/core/ECS.js:145-158, 269-285` - Player component with stats object

**Game Initialization:**
- `js/Game.js:12-20` - DEFAULT_STATS template
- `js/Game.js:729, 745-762` - Stats initialization and reset

#### Stats Properties:

```javascript
{
  damage: 1,
  damageMultiplier: 1,
  fireRate: 1,
  fireRateMultiplier: 1,
  speed: 1,
  speedMultiplier: 1,
  maxHealth: 1,         // Legacy
  critChance: 0.05,
  critDamage: 1.5,
  lifesteal: 0,
  luck: 0,
  xpBonus: 1,
  armor: 0,
  projectileSpeed: 1,
  projectileSpeedMultiplier: 1,
  range: 1,
  rangeMultiplier: 1,
  shield: 0,            // Legacy (now in defense component)
  shieldRegen: 0,       // Legacy
  shieldRegenDelay: 3.0,
  piercing: 0,
  explosionDamage: 30,
  // ... additional dynamic stats from passives/modules
}
```

#### Stat Sources:

**1. Meta Upgrades (Persistent):**
- `js/Game.js:524, 526, 746-748, 754` - Applied from SaveManager
- Damage, fire rate, XP bonus

**2. Passive Effects:**
- `js/Game.js:766` - `PassiveData.applyPassiveEffects(passive, playerComp.stats)`
- `js/data/PassiveData.js:1385-1407` - Passive effect application
- Modifies stats based on equipped passives

**3. Upgrades:**
- `js/systems/ShipUpgradeSystem.js:44, 49` - Per-level and tradeoff effects
- Applied delta to stats

**4. Modules:**
- `js/Game.js:777-790` - Module effect accumulation
- `js/systems/ModuleSystem.js:28-29, 78, 81` - Module stat modifiers

**5. Synergies:**
- `js/systems/SynergySystem.js:115-119` - Synergy bonuses initialization
- `js/data/SynergyData.js:194, 208, 214, 221, 248` - Synergy effects

#### Heavy Usage:

**Combat System:**
- `js/systems/CombatSystem.js:142, 286-292, 325-331, 361-367, 414, 448-452, 479-483, 515-521, 565, 592-598, 642, 677-683, 722-728, 769-775, 941, 1039`
- Used for damage calculation, projectile speed, range, piercing
- Multiplicative: `baseDamage * levelData.damage * playerComp.stats.damage`

**UI Display:**
- `js/systems/UISystem.js:528-537, 2054-2076` - Stat display in HUD
- `js/dev/DevTools.js:244` - DevTools stat inspector

**Stat Recalculation:**
- `js/Game.js:725-828` - `recalculatePlayerStats()` method
- Aggregates all sources
- Applies soft caps
- Validates ranges

**Validation & Caps:**
- `js/Game.js:823, 826, 894-899` - Soft caps and warnings
- FireRate capped at 5x
- Damage capped at 10x

### Assessment:

**Purpose:**
- Runtime aggregation of all stat modifiers
- Dynamic stat calculation during gameplay
- Single source for combat calculations

**Strengths:**
- Flexible and extensible
- Handles multiple modifier sources
- Well-integrated with all game systems

**Issues:**
- ⚠️ Contains legacy fields (maxHealth, shield, shieldRegen)
- ⚠️ Overlaps with ShipStats (damageMultiplier, fireRateMultiplier)
- ⚠️ Not using FinalStatsCalculator for aggregation
- ⚠️ Manual aggregation logic prone to bugs

**Integration:** Heavily used by all systems, would be difficult to replace

---

## 5. System Dependencies

### Defense Layer System Dependencies:

**Depends On:**
- DefenseSystem (authority)
- DefenseData (layer configuration)
- DamagePacket (damage application)

**Used By:**
- Game.js (player initialization)
- SpawnerSystem (enemy initialization)
- CollisionSystem (damage events)
- PickupSystem (healing)
- ModuleSystem (bonuses)
- UISystem (display)
- RenderSystem (health bars)
- DevTools (manipulation)

### ShipStats Dependencies:

**Depends On:**
- Nothing (pure data model)

**Used By:**
- ShipData.js (ship configuration)
- Game.js (player initialization)
- FinalStatsCalculator (planned integration)

### Player.stats Dependencies:

**Depends On:**
- SaveManager (meta upgrades)
- PassiveData (passive effects)
- ShipUpgradeSystem (upgrade effects)
- ModuleSystem (module bonuses)
- SynergySystem (synergy bonuses)

**Used By:**
- CombatSystem (damage/fire rate calculations)
- UISystem (stat display)
- Game.js (recalculation)
- All weapon spawn logic

### Legacy Health Dependencies:

**Depends On:**
- Components.Health factory
- EnemyData (health values)

**Used By:**
- SpawnerSystem (enemy creation)
- RenderSystem (health bars)
- CollisionSystem (damage)
- PickupSystem (healing)
- UISystem (display)
- AISystem (behavior)

---

## 6. Authoritative Model Analysis

### Question: Which model is currently authoritative?

**Answer: It depends on the context**

| Context | Authoritative Model | Status |
|---------|-------------------|--------|
| Player Defense | Defense Layer System | ✅ Active |
| Enemy Defense | Mixed (Health + Defense) | ⚠️ Transitioning |
| Ship Base Stats | ShipStats | ✅ Active |
| Runtime Combat Stats | player.stats | ✅ Active |
| Stat Aggregation | Manual in Game.js | ⚠️ Should use FinalStatsCalculator |
| Meta Progression | SaveManager + player.stats | ✅ Active |

### Overlap Matrix:

```
           Defense   ShipStats   player.stats   Legacy Health
Defense      -         -            ⚠️             ⚠️
ShipStats    -         -            ⚠️             -
player.stats ⚠️        ⚠️            -             ⚠️
Health       ⚠️        -            ⚠️             -
```

**⚠️ = Overlap/Conflict exists**

### Specific Overlaps:

1. **maxShield/maxArmor/maxStructure:**
   - Defined in: ShipStats
   - Used by: Defense Layer System
   - Also in: player.stats (shield, armor - legacy)

2. **damageMultiplier:**
   - Defined in: ShipStats
   - Used by: player.stats (runtime)
   - Source: Meta upgrades, passives, modules

3. **fireRateMultiplier:**
   - Defined in: ShipStats
   - Used by: player.stats (runtime)
   - Source: Meta upgrades, passives, modules

4. **health:**
   - Legacy system: maxHealth in player.stats
   - Current system: defense.structure
   - Conflict: Both still in use

---

## 7. Migration Status

### Completed Migrations:

✅ **Player Defense → Defense Layer System**
- Player now uses defense component with 3 layers
- Initialized from ShipStats (maxShield/maxArmor/maxStructure)
- UI updated to show all 3 layers
- DevTools support added

✅ **Ship Configuration → ShipStats**
- All 4 ships use ShipStats for base configuration
- Clean data-driven architecture
- No business logic in ship definitions

✅ **Damage Application → DefenseSystem**
- All damage flows through DefenseSystem.applyDamage()
- Uses DamagePacket for damage info
- Handles penetration and crit multipliers
- Emits entityDestroyed event

✅ **Legacy Weapon Migration**
- Weapon unlock keys migrated in SaveManager
- Old weapon IDs mapped to new system

### Incomplete Migrations:

⚠️ **Enemy System Still Uses Health**
- Enemies use health component (not defense layers)
- SpawnerSystem creates health component
- Some enemies have defense profiles but not all
- **Blocking:** Full transition to defense layers

⚠️ **player.stats Contains Legacy Fields**
- maxHealth still in DEFAULT_STATS
- shield, shieldRegen, shieldRegenDelay still present
- Not actively used but not removed
- **Blocking:** Clean stat model

⚠️ **FinalStatsCalculator Not Integrated**
- Calculator created but not used
- Manual stat aggregation in Game.js
- **Blocking:** Centralized stat calculation

⚠️ **Health UI Still Exists**
- UISystem has healthBar, healthFill, healthValue
- Legacy display code not removed
- **Blocking:** Clean UI architecture

---

## 8. Data Flow Diagrams

### Current Player Stat Flow:

```
ShipStats (base)
    ↓
Game.createPlayer()
    ↓
defense component ← maxShield/maxArmor/maxStructure
    ↓
DefenseSystem (damage authority)

SaveManager (meta)
    ↓
player.stats (runtime) ← Passives
    ↓                    ← Upgrades
    ↓                    ← Modules
    ↓                    ← Synergies
Game.recalculatePlayerStats()
    ↓
CombatSystem (uses player.stats)
```

### Ideal Player Stat Flow:

```
ShipStats (base)
    ↓
FinalStatsCalculator.calculate(base, modifiers)
    ↓
Final ShipStats (immutable)
    ↓
    ├─→ defense component (maxShield/maxArmor/maxStructure)
    ├─→ combat stats (damage/fireRate multipliers)
    └─→ heat stats (generation/cooldown)
```

---

## 9. Recommendations

### Priority 1: Critical (Before Further Refactoring)

1. **Migrate Enemy System to Defense Layers**
   - Replace health component with defense component
   - Update SpawnerSystem to create defense layers
   - Remove health-based rendering and damage logic
   - **Impact:** Unifies defense model across all entities

2. **Remove Legacy Health Fields from player.stats**
   - Remove: maxHealth, shield, shieldRegen, shieldRegenDelay
   - Update DEFAULT_STATS
   - Clean up Game.js stat initialization
   - **Impact:** Eliminates confusion and overlap

3. **Integrate FinalStatsCalculator**
   - Replace manual aggregation in Game.recalculatePlayerStats()
   - Use ShipStats as input
   - Convert modifiers to standard format
   - **Impact:** Centralized, testable stat calculation

### Priority 2: Architecture Improvements

4. **Consolidate Stat Models**
   - Use ShipStats as the single stat model
   - Convert player.stats to use ShipStats instance
   - Remove duplicate stat definitions
   - **Impact:** Single source of truth

5. **Clean Up UI Code**
   - Remove legacy health bar code
   - Ensure all UI uses defense layers
   - Update HUD to use consolidated stats
   - **Impact:** Consistent UI rendering

6. **Document Stat System**
   - Create developer guide for stat system
   - Document modifier application order
   - Explain ShipStats → player.stats → combat flow
   - **Impact:** Easier for developers to work with stats

### Priority 3: Future Enhancements

7. **Implement Stat Events**
   - Emit events when stats change
   - Allow systems to react to stat changes
   - **Impact:** Better separation of concerns

8. **Add Stat Validation**
   - Validate stat ranges at runtime
   - Warn about extreme values
   - **Impact:** Better balance and debugging

---

## 10. File Classification

### Pure Stat Model Files:
- `js/core/stats/ShipStats.js` - Pure data model
- `js/core/stats/FinalStatsCalculator.js` - Pure calculator

### Stat Authority Files:
- `js/systems/DefenseSystem.js` - Defense layer authority
- `js/Game.js` - player.stats aggregation authority

### Stat Data Files:
- `js/data/ShipData.js` - Ship base stats
- `js/data/PassiveData.js` - Passive stat effects
- `js/data/ShipUpgradeData.js` - Upgrade stat effects
- `js/data/SynergyData.js` - Synergy stat effects
- `js/data/DefenseData.js` - Defense layer definitions

### Stat Consumer Files:
- `js/systems/CombatSystem.js` - Uses player.stats
- `js/systems/UISystem.js` - Displays all stat types
- `js/systems/ModuleSystem.js` - Modifies stats and defense
- `js/systems/CollisionSystem.js` - Uses health and defense
- `js/systems/RenderSystem.js` - Renders health bars

### Legacy Stat Files (To Be Updated):
- `js/systems/SpawnerSystem.js` - Still uses health
- `js/systems/PickupSystem.js` - Still has health pickups
- `js/core/ECS.js` - Has legacy stat definitions

---

## 11. Summary

### Stat Models Count: 4

1. **Legacy Health System** - 42 references, partially deprecated
2. **Defense Layer System** - 180+ references, primary for defense
3. **ShipStats Model** - 20 references, pure data model
4. **player.stats Object** - 200+ references, runtime stats

### System Dependencies:

**Defense Layer System:**
- Used by: 8 systems
- Status: Active, authoritative for defense

**ShipStats:**
- Used by: 3 files
- Status: Active, foundation for ship configuration

**player.stats:**
- Used by: 10+ systems
- Status: Active, authoritative for combat stats

**Legacy Health:**
- Used by: 15+ files
- Status: Partially deprecated, still used for enemies

### Current Authoritative Models:

- **Player Defense:** Defense Layer System ✅
- **Enemy Defense:** Legacy Health ⚠️ (should migrate)
- **Ship Base Stats:** ShipStats ✅
- **Runtime Combat Stats:** player.stats ✅
- **Stat Aggregation:** Manual (should use FinalStatsCalculator) ⚠️

### Key Issues:

1. Multiple stat systems cause confusion
2. Legacy health system not fully removed
3. FinalStatsCalculator created but not integrated
4. player.stats has overlap with ShipStats
5. Enemy system needs migration to defense layers

### Next Steps:

1. Migrate enemies to defense layers
2. Remove legacy health fields from player.stats
3. Integrate FinalStatsCalculator
4. Consolidate stat models
5. Update documentation

---

## Appendix A: Complete File References

### Files Using Defense Layer System (Shield/Armor/Structure):

1. js/Game.js - Player defense initialization
2. js/systems/DefenseSystem.js - Authority implementation
3. js/systems/UISystem.js - UI display
4. js/systems/ModuleSystem.js - Module effects
5. js/systems/PickupSystem.js - Level-up healing
6. js/systems/SpawnerSystem.js - Enemy defense (partial)
7. js/systems/RenderSystem.js - Defense-based rendering
8. js/systems/CollisionSystem.js - Defense access
9. js/dev/DevTools.js - Debug tools
10. js/utils/DebugOverlay.js - Debug display
11. js/ui/EnhancedUIComponents.js - UI components
12. js/data/ShipData.js - Ship special traits
13. js/data/DefenseData.js - Layer definitions
14. js/data/EnemyProfiles.js - Enemy defense profiles
15. js/core/ECS.js - Component factory
16. index.html - Script loading

### Files Using Legacy Health System:

1. js/systems/SpawnerSystem.js - Enemy health
2. js/systems/RenderSystem.js - Health bars
3. js/systems/CollisionSystem.js - Damage handling
4. js/systems/PickupSystem.js - Health pickups
5. js/systems/UISystem.js - Health display
6. js/systems/DefenseSystem.js - Fallback logic
7. js/systems/SynergySystem.js - Healing mechanics
8. js/systems/AISystem.js - Health-based behavior
9. js/dev/DevTools.js - Health manipulation
10. js/Game.js - Invulnerability
11. js/utils/DebugOverlay.js - Health display
12. js/managers/SaveManager.js - Meta upgrades
13. js/data/EnemyData.js - Enemy health values
14. js/data/ShipUpgradeData.js - maxHealth fields
15. js/data/PassiveData.js - maxHealthMultiplier
16. js/data/SynergyData.js - Health synergies
17. js/core/ECS.js - Health component

### Files Using ShipStats:

1. js/core/stats/ShipStats.js - Class definition
2. js/core/stats/FinalStatsCalculator.js - Calculator
3. js/data/ShipData.js - Ship configuration
4. js/Game.js - Player initialization
5. index.html - Script loading

### Files Using player.stats:

1. js/Game.js - Initialization and recalculation
2. js/systems/CombatSystem.js - Combat calculations
3. js/systems/UISystem.js - Stat display
4. js/systems/ShipUpgradeSystem.js - Upgrade effects
5. js/systems/ModuleSystem.js - Module bonuses
6. js/systems/CollisionSystem.js - Damage/explosion
7. js/systems/SynergySystem.js - Synergy bonuses
8. js/dev/DevTools.js - Stat inspection
9. js/dev/ContentAuditor.js - Passive auditing
10. js/data/PassiveData.js - Passive application
11. js/data/ShipData.js - Ship trait effects
12. js/core/ECS.js - Component definition

---

**End of Report**

This audit provides a complete picture of all stat systems in the Space-InZader project. Use this information to guide further refactoring and consolidation efforts.
