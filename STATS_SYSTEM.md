# Space InZader - Stats System Documentation

## Overview

The stats system uses a **Base + Derived** model where final stats are calculated from base values (ship + meta-progression) modified by passives and synergies.

## Stats Schema

### Default Stats Blueprint

All stats start with a default value from `DEFAULT_STATS` in `Game.js` to prevent undefined errors. There are **40 core stats** organized into categories:

#### Core Damage Stats
- `damage`: Base damage value (default: 1)
- `damageMultiplier`: Multiplicative damage modifier (default: 1)

#### Fire Rate Stats
- `fireRate`: Base fire rate (default: 1)
- `fireRateMultiplier`: Multiplicative fire rate modifier (default: 1)

#### Movement Stats
- `speed`: Base movement speed (default: 1)
- `speedMultiplier`: Multiplicative speed modifier (default: 1)

#### Health Stats
- `maxHealth`: Base max health (default: 1)
- `maxHealthMultiplier`: Multiplicative health modifier (default: 1)
- `maxHealthAdd`: Flat health addition (default: 0)
- `healthRegen`: Health regeneration per second (default: 0)

#### Defense Stats
- `armor`: Flat damage reduction (default: 0)
- `shield`: Maximum shield points (default: 0)
- `shieldRegen`: Shield regeneration per second (default: 0)
- `shieldRegenDelay`: Delay before shield regeneration starts (default: 3.0)
- `dodgeChance`: Chance to completely avoid damage (default: 0)

#### Lifesteal & Sustain
- `lifesteal`: Percentage of damage healed (default: 0)

#### Critical Stats
- `critChance`: Chance to critically hit (default: 0, max: 1.0)
- `critDamage`: Critical damage multiplier (default: 1.5)

#### Utility Stats
- `luck`: Affects drop rates and rare item chances (default: 0)
- `xpBonus`: Experience point multiplier (default: 1)
- `magnetRange`: Range for attracting XP/pickups (default: 0)

#### Projectile Stats
- `projectileSpeed`: Base projectile speed (default: 1)
- `projectileSpeedMultiplier`: Multiplicative speed modifier (default: 1)
- `range`: Base weapon range (default: 1)
- `rangeMultiplier`: Multiplicative range modifier (default: 1)
- `piercing`: Number of enemies a projectile can pierce (default: 0)

#### Special Effects
- `overheatReduction`: Reduces weapon overheat (default: 0)
- `explosionChance`: Chance projectiles explode on hit (default: 0)
- `explosionDamage`: Explosion damage (default: 0)
- `explosionRadius`: Explosion radius (default: 0)
- `stunChance`: Chance to stun enemies (default: 0)
- `reflectDamage`: Percentage of damage reflected (default: 0)
- `projectileCount`: Bonus projectiles per shot (default: 0)
- `ricochetChance`: Chance projectiles ricochet (default: 0)
- `chainLightning`: Chain lightning bounces (default: 0)
- `slowChance`: Chance to slow enemies (default: 0)

## Stats Calculation Flow

```
1. Reset to DEFAULT_STATS (structuredClone for clean slate)
   ↓
2. Apply Ship Base Stats (from ShipData)
   ↓
3. Apply Meta-Progression Bonuses (from SaveManager)
   ↓
4. Apply All Passives (PassiveData.applyPassiveEffects)
   ↓
5. Apply Synergies (SynergySystem)
   ↓
6. Calculate Max HP (baseMaxHP * hpMultiplier + hpAdd)
   ↓
7. Update Shield Component
   ↓
8. Apply Soft Caps (prevent infinite stacking)
   ↓
9. Validate Stats (warn about extreme values)
   ↓
10. Final Stats Available to Game Systems
```

## Soft Caps

To prevent game-breaking infinite stacking, certain stats have caps:

| Stat | Minimum | Maximum | Reason |
|------|---------|---------|--------|
| `lifesteal` | - | 50% | Prevent invincibility |
| `healthRegen` | - | 10/s | Prevent trivial damage |
| `fireRate` | 0.1 | 10 | Min: prevent freeze, Max: performance |
| `speed` | 0.2 | 5 | Min: prevent stuck, Max: control issues |
| `critChance` | - | 100% | Natural limit |
| `dodgeChance` | - | 75% | Maintain some risk |

Caps are applied in `applySoftCaps()` after passive effects.

## Validation Warnings

The `validateStats()` function checks for concerning values:

### Critical Errors
- Any stat with `undefined` value

### High Value Warnings
- `damageMultiplier > 10x`
- `fireRateMultiplier > 5x`
- `speedMultiplier > 3x`
- `lifesteal > 30%`
- `healthRegen > 5/s`

Warnings are grouped and logged to console with colored output.

## Passive Effect Keys

### Explicitly Handled Multipliers (8)
These modify base stats multiplicatively:
- `damageMultiplier`
- `fireRateMultiplier`
- `speedMultiplier`
- `maxHealthMultiplier`
- `rangeMultiplier`
- `projectileSpeedMultiplier`
- `critMultiplier`
- `xpMultiplier`

### Explicitly Handled Additives (4)
These add to base stats:
- `critChance`
- `lifesteal`
- `armor`
- `luck`

### Other Effects (71+)
All other effect keys are added directly to stats object via:
```javascript
stats[effectKey] = (stats[effectKey] || 0) + totalValue;
```

This includes special mechanics like:
- `piercing`, `ricochetChance`, `bounceCount`
- `explosionChance`, `explosionDamage`, `explosionRadius`
- `stunChance`, `slowChance`, `chainLightning`
- `shield`, `healthRegen`, `reflectDamage`
- `executeThreshold`, `revive`, `dodgeChance`
- And 60+ more special mechanics

## Passive Balance Guidelines

Passives follow a rarity-based balance model:

### Common (10 passives)
- **Bonuses**: 10-15% small improvements
- **Malus Rate**: ~10% (1/10 passives)
- **Max Stacks**: 5-8
- **Examples**: +12% damage, +10% fire rate, +10% health

### Uncommon (21 passives)
- **Bonuses**: 15-25% moderate improvements
- **Malus Rate**: ~19% (4/21 passives)
- **Max Stacks**: 3-5
- **Examples**: +20% range, +15% ricochet, +20 shield

### Rare (27 passives)
- **Bonuses**: 25-50% significant improvements
- **Malus Rate**: ~41% (11/27 passives)
- **Max Stacks**: 2-4
- **Examples**: +50% fury, +80% crit multi, +30% chain lightning

### Epic (18 passives)
- **Bonuses**: 50-100%+ major improvements
- **Malus Rate**: ~72% (13/18 passives)
- **Max Stacks**: 1-2
- **Examples**: +60% damage/-30% HP, +100% burst damage, revive mechanic

Higher rarities have more powerful effects but come with significant trade-offs.

## Health Calculation

Max health uses a special **base * multiplier + add** formula:

```javascript
const baseMaxHP = shipData.baseStats.maxHealth + (metaUpgrades * 10);
const hpMultiplier = stats.maxHealthMultiplier || 1;
const hpAdd = stats.maxHealthAdd || 0;
const newMax = Math.max(1, Math.floor(baseMaxHP * hpMultiplier + hpAdd));
```

Current HP is adjusted to maintain the health ratio:
```javascript
const ratio = oldCurrent / oldMax;
health.current = Math.max(1, Math.min(Math.ceil(newMax * ratio), newMax));
```

This ensures:
- Health changes preserve percentage (e.g., 50% stays 50%)
- Uses ceiling to avoid killing player via rounding
- Clamps to valid range [1, newMax]

## Best Practices

### When Adding New Stats
1. Add default value to `DEFAULT_STATS`
2. Document the stat in this file
3. Consider if it needs a soft cap
4. Add validation warning if needed
5. Test with extreme values

### When Creating New Passives
1. Use existing effect keys when possible
2. Follow rarity-based balance guidelines
3. Include malus for powerful effects (especially rare/epic)
4. Limit max stacks appropriately
5. Test stacking behavior

### When Debugging Stats
1. Check console for validation warnings
2. Verify DEFAULT_STATS has the stat
3. Check if soft cap is being applied
4. Trace through recalculatePlayerStats flow
5. Use browser devtools to inspect stats object

## Common Issues

### "Cannot read toFixed of undefined"
**Cause**: Stat not in DEFAULT_STATS  
**Fix**: Add the stat to DEFAULT_STATS with appropriate default value

### "Stats seem too high after 20 waves"
**Cause**: No soft cap or cap too high  
**Fix**: Add soft cap in applySoftCaps() or adjust existing cap

### "Passive has no effect"
**Cause**: Effect key typo or not recognized  
**Fix**: Check effect key matches applyPassiveEffects logic

### "Health keeps changing unexpectedly"
**Cause**: Ratio preservation or multiple recalculations  
**Fix**: Check that maxHealthMultiplier is being used correctly

## Summary

The stats system is designed to:
- ✅ Prevent undefined errors (all stats have defaults)
- ✅ Support flexible passive effects (83 unique effect keys)
- ✅ Maintain game balance (soft caps prevent infinite scaling)
- ✅ Provide clear feedback (validation warnings)
- ✅ Be extensible (easy to add new stats/effects)

**Total Stats**: 40 core stats + 83 effect keys = 123 possible stat modifications
