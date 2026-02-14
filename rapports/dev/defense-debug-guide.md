# Defense System Debug Guide

## Overview

The DefenseSystem now includes a comprehensive debug logging system that can be toggled on/off via a global flag. This allows real-time monitoring of damage application and regeneration without any performance impact when disabled.

---

## Quick Start

### Enable Debug Mode

Open browser console (F12) and type:
```javascript
window.DEBUG_DEFENSE = true;
```

### Disable Debug Mode

```javascript
window.DEBUG_DEFENSE = false;
```

### Check Current State

```javascript
console.log(window.DEBUG_DEFENSE);
```

---

## What Gets Logged

### 1. Damage Application

After every damage event, the system logs:
- **Entity ID** - Which entity was damaged
- **Shield current/max** - Current shield and maximum
- **Armor current/max** - Current armor and maximum
- **Structure current/max** - Current structure and maximum
- **Total dealt** - Total damage actually applied
- **Overkill** - Excess damage (if any)
- **Destroyed status** - If entity was destroyed

**Example Output:**
```
[DefenseSystem DEBUG] Entity player after damage:
  Shield: 165.0/180
  Armor: 100.0/100
  Structure: 120.0/120
  Total dealt: 15.0, Overkill: 0.0
```

### 2. Regeneration Ticks

For every layer that regenerates, the system logs:
- **Layer name** - Which layer (shield/armor/structure)
- **Before** - Value before regen
- **After** - Value after regen
- **Regenerated** - Amount regenerated this tick
- **Fully restored** - Notification when layer reaches max

**Example Output:**
```
[DefenseSystem DEBUG] Regen tick: shield
  Before: 165.0/180
  After: 177.0/180
  Regenerated: +12.0
```

**Full Restoration:**
```
[DefenseSystem DEBUG] Regen tick: shield
  Before: 177.0/180
  After: 180.0/180
  Regenerated: +3.0
  ✅ shield FULLY RESTORED
```

### 3. Entity Destruction

When an entity's structure reaches 0:
```
[DefenseSystem DEBUG] Entity enemy_123 after damage:
  Shield: 0.0/80
  Armor: 0.0/100
  Structure: 0.0/100
  Total dealt: 280.0, Overkill: 0.0
  ⚠️ ENTITY DESTROYED
```

---

## Use Cases

### Diagnose "Player Not Taking Damage"

1. Enable debug mode: `window.DEBUG_DEFENSE = true`
2. Play the game and get hit
3. Check console:
   - If no logs appear → Damage not reaching DefenseSystem (check weapon/collision logic)
   - If damage logs appear but values don't change → Check layer values and resistances
   - If regen logs appear frequently → Regen may be outpacing damage

### Verify Regeneration Rates

1. Enable debug mode
2. Take damage (shield will regenerate after 3 second delay)
3. Watch for regen tick logs
4. Compare regenerated amounts to expected rates:
   - Shield: 12.0/second (ION_FRIGATE)
   - Structure: 0.5/second (slow constant regen)
   - Armor: 0/second (no regen by default)

### Debug Balance Issues

**Problem: Player seems invincible**
- Check if shield regen (12.0/s) > enemy DPS
- Look at "Total dealt" vs "Regenerated" amounts

**Problem: Player dies instantly**
- Check if "Total dealt" is much larger than expected
- Verify resistances are being applied correctly
- Look for "Overkill" to see excess damage

**Problem: Enemies too tanky**
- Enable debug and attack enemies
- Check their shield/armor/structure values
- Verify damage is being applied correctly

---

## Performance

**When Disabled (Default):**
- Zero overhead
- No performance impact
- Production-ready

**When Enabled:**
- Minimal overhead (console.log only)
- Safe to use during development
- Can be toggled mid-game

---

## Tips

1. **Use filtered console** - Filter console by "DefenseSystem DEBUG" to see only debug logs
2. **Toggle mid-game** - No need to reload, enable/disable anytime
3. **Combine with other debug tools** - Use with DevTools for comprehensive testing
4. **Record console** - Use browser's console save feature to capture logs for analysis

---

## Troubleshooting

**Q: I enabled DEBUG_DEFENSE but see no logs**
- A: Make sure damage is actually being applied. Try using DevTools to manually apply damage.

**Q: Too many logs, can't read them**
- A: Filter console by "DefenseSystem DEBUG" or disable temporarily

**Q: Regen logs spamming console**
- A: This is normal if regeneration is active. Filter or disable if not needed.

**Q: How do I save the logs?**
- A: Right-click in console → "Save as..." or use browser's built-in console export

---

## Code Location

**File:** `js/systems/DefenseSystem.js`

**Debug Toggle:** Line 1-4
```javascript
window.DEBUG_DEFENSE = window.DEBUG_DEFENSE || false;
```

**Damage Logging:** Lines 315-327 (in applyDamage method)

**Regen Logging:** Lines 92-102 (in updateLayer method)

---

## Future Improvements

Potential additions:
- Configurable log levels (verbose, normal, minimal)
- Log history buffer
- Visual debug overlay (instead of console only)
- Export logs to file
- Performance metrics

---

**Created:** 2026-02-14  
**Status:** Active and functional  
**Maintainer:** DefenseSystem
