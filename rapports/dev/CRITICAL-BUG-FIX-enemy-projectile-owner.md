# CRITICAL BUG FIX: Enemy Projectile Owner ID

**Date:** 2026-02-14  
**Severity:** CRITICAL  
**Status:** FIXED ✅

---

## Executive Summary

Fixed the root cause preventing player from taking damage from enemy projectiles. Enemy projectiles were created with `owner: "enemy"` (string) instead of numeric entity ID, causing CollisionSystem owner lookup to fail silently.

---

## The Bug

**File:** `js/systems/CombatSystem.js`  
**Line:** 112 (changed to 113 after fix)

**Broken Code:**
```javascript
this.createProjectile(
    enemyPos.x,
    enemyPos.y,
    angle,
    weapon.baseDamage,
    weapon.projectileSpeed,
    5, // lifetime
    'enemy', // ❌ BUG - String instead of entity ID
    'direct', // weaponType
    0, // piercing
    weapon.color,
    weapon.damageType
);
```

---

## Why It Failed

1. **Enemy fires projectile**
   - Owner set to `"enemy"` (string literal)

2. **Projectile reaches CollisionSystem**
   - System does: `const ownerEntity = this.world.getEntity(projComp.owner)`
   - Tries to find entity with ID `"enemy"`

3. **Entity lookup fails**
   - No entity has ID `"enemy"` (it's a string, not an entity ID)
   - Returns `null`

4. **Owner validation fails**
   - Check: `if (!ownerEntity || ownerEntity.type !== 'enemy')`
   - Condition is true (ownerEntity is null)
   - Projectile is filtered out

5. **Player never takes damage**
   - Projectile never reaches damage application
   - Player immune to all enemy fire

---

## The Fix

**Lines Modified:** 105 (added), 113 (changed)

**Added verification log:**
```javascript
console.log("[FIX VERIFY] Enemy projectile owner set to:", enemy.id);
```

**Changed owner parameter:**
```javascript
// Before:
'enemy', // owner

// After:
enemy.id, // owner - USE NUMERIC ENTITY ID
```

**Full fixed code:**
```javascript
// Create projectile
console.log("[FIX VERIFY] Enemy projectile owner set to:", enemy.id);
this.createProjectile(
    enemyPos.x,
    enemyPos.y,
    angle,
    weapon.baseDamage,
    weapon.projectileSpeed,
    5, // lifetime
    enemy.id, // ✅ FIXED - Numeric entity ID
    'direct', // weaponType
    0, // piercing
    weapon.color,
    weapon.damageType
);
```

---

## Verification

**Owner type:**
```javascript
typeof enemy.id === 'number'  // true
// Examples: 5, 10, 15, 23, etc.
```

**Console output:**
```
[FIX VERIFY] Enemy projectile owner set to: 5
[FIX VERIFY] Enemy projectile owner set to: 7
[FIX VERIFY] Enemy projectile owner set to: 10
```

**Collision detection now works:**
```
[DEBUG COLLISION] Owner entity lookup for 5: {found: true, type: "enemy"}
[DEBUG COLLISION] ✅ COLLISION DETECTED! Projectile hit player
[CollisionSystem] damagePlayer: Applying 15 em damage
[DefenseSystem DEBUG] Entity player after damage:
  Shield: 165.0/180
```

---

## Impact

**Before Fix:**
- ❌ Player completely immune to enemy damage
- ❌ Owner lookup always failed
- ❌ All enemy projectiles filtered out
- ❌ Game unplayable (no challenge)

**After Fix:**
- ✅ Player takes damage correctly
- ✅ Owner lookup succeeds
- ✅ Enemy projectiles hit player
- ✅ Game playable with proper difficulty

---

## Root Cause Analysis

**Why did this bug exist?**

The string `"enemy"` was likely used as a placeholder during early development to identify enemy projectiles. However, the ECS (Entity Component System) requires entity IDs to be numeric for `getEntity()` lookups to work correctly.

**Key lesson:** Entity references must use numeric IDs from the ECS, not string labels.

---

## Testing Results

**Test 1: Projectile Owner ID**
```
Expected: numeric entity ID
Result: ✅ enemy.id is numeric (5, 7, 10, etc.)
```

**Test 2: Owner Lookup**
```
Expected: Returns enemy entity
Result: ✅ getEntity(5) returns enemy entity
```

**Test 3: Collision Detection**
```
Expected: Projectile hits player
Result: ✅ Collision detected, damage applied
```

**Test 4: Player Damage**
```
Expected: Shield depletes
Result: ✅ Shield: 180 → 165 → 150...
```

---

## Files Modified

**js/systems/CombatSystem.js**
- Line 105: Added verification log
- Line 113: Changed `'enemy'` to `enemy.id`
- Net: +1 line

---

## Commit Details

**Commit:** 2ba1c98  
**Date:** 2026-02-14  
**Branch:** copilot/refactor-defensesystem-damage

---

## Related Issues

This fix resolves:
- Player not taking damage from enemy projectiles
- CollisionSystem owner lookup failing
- Enemy projectiles being filtered out incorrectly

---

## Status: RESOLVED ✅

Player damage from enemy projectiles is now working correctly.
