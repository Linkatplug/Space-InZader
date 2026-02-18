# Legacy Weapon Audit Report

**Generated:** February 14, 2026  
**Repository:** Linkatplug/Space-InZader  
**Branch:** copilot/refactor-defensesystem-damage

---

## Executive Summary

This audit identifies all references to legacy weapon IDs from the old weapon system. The project has transitioned to a new 24-weapon system organized by damage types (EM / Thermal / Kinetic / Explosive).

### Key Findings

- **Total legacy weapon ID references:** 8 (uppercase constant format)
- **Total lowercase/camelCase references:** 11
- **Grand total:** 19 references across 3 files
- **Critical discovery:** SaveManager.js contains 9 legacy weapon unlock entries that could break save data compatibility

### Files Affected

1. `js/managers/SaveManager.js` - 9 legacy weapon unlock references
2. `js/data/ShipUpgradeData.js` - 3 references (1 upgrade ID, 2 starting weapons)
3. `test-new-content.html` - 7 references (test file only)

---

## Section 1: Detailed References by Weapon ID

### 1.1 UPPERCASE Legacy Weapon IDs

#### RAILGUN (3 references)

**File:** `js/data/ShipUpgradeData.js`  
**Line:** 291  
**Context:**
```javascript
id: 'RAILGUN_ACCELERATOR',
name: 'Railgun Accelerator',
description: 'Increase kinetic projectile speed and damage.',
```
**Analysis:** This is an upgrade ID reference, not the weapon itself. The upgrade name references "Railgun" but the actual weapon in the new system is `RAILGUN_MK2`.

**File:** `js/data/NewWeaponData.js`  
**Line:** 253  
**Context:**
```javascript
RAILGUN_MK2: {
    id: 'railgun_mk2',
    name: 'Railgun Mk.II',
```
**Analysis:** This is the NEW weapon system reference (correct). The key uses uppercase format but this is the new weapon, not legacy.

**File:** `test-new-content.html`  
**Line:** 49  
**Context:**
```javascript
const newWeapons = [
    'RAILGUN',
    'LANCE_FLAMMES',
```
**Analysis:** Test file checking for weapons. Uses legacy uppercase format but is testing the new system.

#### LANCE_FLAMMES (1 reference)

**File:** `test-new-content.html`  
**Line:** 50  
**Context:**
```javascript
'RAILGUN',
'LANCE_FLAMMES',
'CANON_GRAVITATIONNEL',
```
**Analysis:** Test file only. Not a functional reference.

#### CANON_GRAVITATIONNEL (1 reference)

**File:** `test-new-content.html`  
**Line:** 51  
**Context:**
```javascript
'LANCE_FLAMMES',
'CANON_GRAVITATIONNEL',
'TOURELLE_AUTONOME',
```
**Analysis:** Test file only. Not a functional reference.

#### TOURELLE_AUTONOME (1 reference)

**File:** `test-new-content.html`  
**Line:** 52  
**Context:**
```javascript
'CANON_GRAVITATIONNEL',
'TOURELLE_AUTONOME',
'LAMES_FANTOMES',
```
**Analysis:** Test file only. Not a functional reference.

#### LAMES_FANTOMES (1 reference)

**File:** `test-new-content.html`  
**Line:** 53  
**Context:**
```javascript
'TOURELLE_AUTONOME',
'LAMES_FANTOMES',
'DRONE_KAMIKAZE'
```
**Analysis:** Test file only. Not a functional reference.

#### DRONE_KAMIKAZE (1 reference)

**File:** `test-new-content.html`  
**Line:** 54  
**Context:**
```javascript
'LAMES_FANTOMES',
'DRONE_KAMIKAZE'
];
```
**Analysis:** Test file only. Not a functional reference.

### 1.2 Legacy Weapons with ZERO References

The following legacy weapon IDs have **NO references** in the codebase:

- ✅ `LASER_FRONTAL` - 0 references
- ✅ `MITRAILLE` - 0 references
- ✅ `MISSILES_GUIDES` - 0 references
- ✅ `ORBES_ORBITAUX` - 0 references
- ✅ `RAYON_VAMPIRIQUE` - 0 references
- ✅ `MINES` - 0 references
- ✅ `ARC_ELECTRIQUE` - 0 references
- ✅ `TOURELLE_DRONE` - 0 references

---

## Section 2: Lowercase/CamelCase Legacy References

### 2.1 SaveManager.js - Weapon Unlock System (CRITICAL)

**File:** `js/managers/SaveManager.js`  
**Lines:** 42-51  
**Context:**
```javascript
weapons: {
    laser_frontal: { unlocked: true },
    mitraille: { unlocked: true },
    missiles_guides: { unlocked: true },
    orbes_orbitaux: { unlocked: true },
    rayon_vampirique: { unlocked: true },
    mines: { unlocked: false },
    arc_electrique: { unlocked: false },
    tourelle_drone: { unlocked: false },
    lame_tournoyante: { unlocked: true }
}
```

**Analysis:** 
- **CRITICAL FINDING:** SaveManager contains 9 legacy weapon unlock entries
- These represent the OLD weapon unlock system
- Player save files may contain these keys
- Removing without migration could break existing saves
- `lame_tournoyante` is also present (blade halo passive, not a weapon)

**Legacy weapons in save system:**
1. `laser_frontal` - Legacy laser weapon
2. `mitraille` - Legacy minigun weapon
3. `missiles_guides` - Legacy guided missiles
4. `orbes_orbitaux` - Legacy orbital orbs
5. `rayon_vampirique` - Legacy vampiric ray
6. `mines` - Legacy mines
7. `arc_electrique` - Legacy electric arc
8. `tourelle_drone` - Legacy drone turret
9. `lame_tournoyante` - Blade halo (passive ability, not weapon)

### 2.2 ShipUpgradeData.js - Starting Weapons

**File:** `js/data/ShipUpgradeData.js`  
**Line:** 175  
**Context:**
```javascript
startingWeapon: 'mitrailleuse',
```
**Analysis:** Ship upgrade/evolution references legacy weapon `mitrailleuse` as starting weapon. This needs to be mapped to a new weapon ID.

**File:** `js/data/ShipUpgradeData.js`  
**Line:** 496  
**Context:**
```javascript
startingWeapon: 'lance_flammes',
```
**Analysis:** Ship upgrade/evolution references legacy weapon `lance_flammes` as starting weapon. This needs to be mapped to a new weapon ID (likely `inferno_beam` or `flame_projector`).

---

## Section 3: WeaponData.js File References

### 3.1 Missing WeaponData.js File

**Status:** WeaponData.js file does NOT exist in the repository

**HTML files referencing WeaponData.js:**

1. `system-test.html` (Line 30): `<script src="js/data/WeaponData.js"></script>`
2. `test-new-content.html` (Line 44): `<script src="js/data/WeaponData.js"></script>`
3. `debug.html` (Line 33): `<script src="js/data/WeaponData.js"></script>`
4. `manual-test.html` (Line 25): `<script src="js/data/WeaponData.js"></script>`

**Analysis:** These HTML test files attempt to load WeaponData.js which doesn't exist. The main game (index.html) correctly uses:
- `NewWeaponData.js` (new 24-weapon system)
- `WeaponDataBridge.js` (compatibility layer)

---

## Section 4: Risk Assessment

### 4.1 Can legacy WeaponData.js be safely removed?

**Answer:** **PARTIAL** - With conditions

**Reasoning:**

#### ✅ SAFE to remove:
- The actual `WeaponData.js` file is already gone
- Uppercase constant references (RAILGUN, LANCE_FLAMMES, etc.) in test-new-content.html are non-functional test code
- The new system (NewWeaponData.js + WeaponDataBridge.js) is already in place

#### ⚠️ REQUIRES ATTENTION:

1. **SaveManager.js weapon unlocks (HIGH PRIORITY)**
   - 9 legacy weapon unlock entries must be migrated
   - Existing player saves may have these keys
   - Need migration strategy to map old unlocks to new weapons
   - **Risk:** Breaking existing player progression

2. **ShipUpgradeData.js starting weapons (MEDIUM PRIORITY)**
   - 2 legacy weapon IDs used as `startingWeapon`
   - Need to map: `mitrailleuse` → new weapon ID
   - Need to map: `lance_flammes` → new weapon ID
   - **Risk:** Ships failing to initialize with starting weapon

3. **Test HTML files (LOW PRIORITY)**
   - 4 HTML files attempt to load missing WeaponData.js
   - These are test/debug files, not production
   - **Risk:** Test files will fail to load

4. **ShipUpgradeData.js upgrade ID (LOW PRIORITY)**
   - `RAILGUN_ACCELERATOR` upgrade references "Railgun"
   - This is descriptive text, not a functional dependency
   - **Risk:** Minimal, just naming convention

### 4.2 Systems that depend on legacy weapons

**Direct Dependencies:**

1. **SaveManager.js**
   - Weapon unlock system
   - Save/load functionality
   - Player progression persistence

2. **ShipUpgradeData.js**
   - Ship evolution system
   - Starting weapon assignments
   - Ship configuration

**No Dependencies Found:**

- ✅ LootData.js - Uses new weapon IDs only
- ✅ EnemyData.js - No legacy weapon references
- ✅ UI weapon selection - Not found to use legacy IDs
- ✅ Drop tables - Use new system
- ✅ Evolution logic - Except ShipUpgradeData starting weapons

---

## Section 5: Recommendations

### 5.1 Required Actions Before Removal

#### HIGH PRIORITY: SaveManager Migration

```javascript
// Recommended: Create weapon ID migration map
const LEGACY_TO_NEW_WEAPON_MAP = {
    'laser_frontal': 'ion_blaster',
    'mitraille': 'auto_cannon',
    'missiles_guides': 'overload_missile',
    'orbes_orbitaux': 'orbital_strike',
    'rayon_vampirique': null, // No direct equivalent, remove
    'mines': 'thermal_mine',
    'arc_electrique': 'arc_disruptor',
    'tourelle_drone': 'em_drone_wing',
    'lame_tournoyante': null // Passive ability, not weapon
};

// Update SaveManager.load() to migrate old save data
```

#### MEDIUM PRIORITY: ShipUpgradeData Starting Weapons

```javascript
// Update starting weapons:
startingWeapon: 'mitrailleuse' → 'auto_cannon' or 'gauss_repeater'
startingWeapon: 'lance_flammes' → 'inferno_beam' or 'flame_projector'
```

#### LOW PRIORITY: Test File Cleanup

- Update test HTML files to load NewWeaponData.js instead
- Update test-new-content.html weapon array to use new IDs
- Remove or update debug.html, system-test.html, manual-test.html

### 5.2 Safe to Remove

- ❌ **WeaponData.js** - Already doesn't exist (safe)
- ⚠️ **WeaponDataBridge.js** - KEEP until all references migrated
- ✅ **Legacy weapon constant references** - Can be removed after above actions

---

## Section 6: Migration Checklist

### Before removing WeaponDataBridge.js:

- [ ] Migrate SaveManager.js weapon unlock keys
- [ ] Add save data migration logic
- [ ] Update ShipUpgradeData.js starting weapons
- [ ] Test save/load with migrated data
- [ ] Update or remove test HTML files
- [ ] Verify no runtime errors with missing WeaponData.js
- [ ] Test weapon unlock UI with new IDs
- [ ] Verify ship initialization with new starting weapons

### After migration:

- [ ] Remove WeaponDataBridge.js
- [ ] Clean up any remaining uppercase weapon constants in tests
- [ ] Update documentation

---

## Conclusion

The codebase has mostly transitioned to the new 24-weapon system. The primary blocker for complete legacy weapon removal is the **SaveManager.js weapon unlock system**, which maintains 9 legacy weapon ID entries that are stored in player save files.

**Key recommendation:** Implement save data migration before removing WeaponDataBridge.js to prevent breaking existing player progression.

**Files requiring changes:**
1. js/managers/SaveManager.js (weapon unlocks migration - CRITICAL)
2. js/data/ShipUpgradeData.js (starting weapon IDs - IMPORTANT)
3. Test HTML files (optional cleanup)

**Current Status:**
- ✅ New weapon system (NewWeaponData.js) is fully implemented
- ✅ WeaponDataBridge.js provides compatibility layer
- ⚠️ Legacy references remain in save system and ship configurations
- ❌ Cannot safely remove WeaponDataBridge.js yet
