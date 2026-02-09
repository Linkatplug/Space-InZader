# Game Schema Implementation

## Overview
This document details the comprehensive game schema integration for Space InZader, defining exact specifications for all game systems.

## Implementation Summary

### ✅ Synergies (6 Total)
All synergies implemented with exact tag counting and tiered bonuses:

1. **Blood** - Tags: vampire, on_hit, on_kill
   - Tier 1 (2): +5% Lifesteal
   - Tier 2 (4): Heal 15% on elite kill

2. **Critical** - Tags: crit
   - Tier 1 (2): +15% Crit Damage
   - Tier 2 (4): Crits explode (40px radius, 35% damage, 600ms cooldown)

3. **Explosion** - Tags: explosion, aoe
   - Tier 1 (2): +20% Explosion Radius
   - Tier 2 (4): Chain explosions (2 chains, 55px radius, 40% damage)

4. **Heat** - Tags: heat, fire_rate
   - Tier 1 (2): +25% Cooling Rate
   - Tier 2 (4): Damage ramp (35% max bonus over 3s)

5. **Dash** - Tags: dash, speed
   - Tier 1 (2): -20% Dash Cooldown
   - Tier 2 (4): 250ms invulnerability on dash

6. **Summon** - Tags: summon, turret
   - Tier 1 (2): +1 Max Summons
   - Tier 2 (4): Summons inherit 25% of stats

### ✅ Keystones (6 Total)
Class-specific unique powerful passives:

1. **Blood Frenzy** (Vampire)
   - Effect: Each hit grants +0.5% lifesteal (max 40 stacks), resets after 3s

2. **Overclock Core** (Mitrailleur)
   - Effect: +35% damage per fire rate bonus, 35% more overheat

3. **Fortress Mode** (Tank)
   - Effect: When stationary 700ms: -50% damage taken, +25% explosion radius

4. **Dead Eye** (Sniper)
   - Effect: +15% damage per consecutive hit (max 8), reset on miss

5. **Machine Network** (Engineer)
   - Effect: +6% damage, +5% range per summon (max 10)

6. **Rage Engine** (Berserker)
   - Effect: When HP < 30%: 2x damage, 1.3x speed

### ✅ Ships (6 Total)
Updated with exact schema specifications:

| Ship | HP | Speed | Fire Rate | Special Stats | Keystone |
|------|----|----|-----------|---------------|----------|
| Vampire | 80 | 231 (1.05x) | 1.0 | 15% lifesteal | blood_frenzy |
| Mitrailleur | 100 | 220 | 1.2 | - | overclock_core |
| Tank | 160 | 187 (0.85x) | 1.0 | 4 armor | fortress_mode |
| Sniper | 90 | 220 | 1.0 | 8% crit, 1.7x crit dmg, 1.25x range | dead_eye |
| Engineer | 110 | 220 | 1.0 | - | machine_network |
| Berserker | 85 | 253 (1.15x) | 1.0 | - | rage_engine |

### ✅ Unlock Conditions
- **Vampire, Mitrailleur, Tank, Sniper**: Unlocked by default
- **Engineer**: Unlock by reaching wave 15
- **Berserker**: Unlock by dying with 5+ vampire or crit tagged items

### ✅ Upgrade System Rules
Implemented as specified:

- **Choices Per Level**: 3 options
- **Biased Choices**: 2 out of 3 use ship's preferred tags
- **Biased Weight**: 60% chance for preferred tags
- **Global Weight**: 40% chance for any unlocked item
- **Rerolls Per Run**: 2
- **Rare Guarantee**: Every 4 levels

## Files Modified/Created

### New Files:
1. `js/data/SynergyData.js` - Synergy definitions and helpers
2. `js/data/KeystoneData.js` - Keystone definitions and helpers  
3. `js/systems/SynergySystem.js` - Synergy tracking and application

### Modified Files:
1. `js/data/ShipData.js` - Updated ship stats to match schema
2. `js/Game.js` - Integrated synergy system, keystones, rerolls
3. `js/systems/UISystem.js` - Added synergy HUD and reroll button
4. `index.html` - Added script imports

## Features Implemented

### Synergy System
- Automatic tag counting from equipped weapons and passives
- Real-time synergy activation based on thresholds
- Bonuses applied to player stats
- Visual HUD display showing active synergies

### Keystone System
- Class-specific keystone offering (25% chance per level)
- One keystone per run limit
- Unique keystone tracking
- Special visual indicator on upgrade cards

### Reroll System
- 2 rerolls per run
- Reroll button appears on level-up screen
- Reroll counter display

### Rare Guarantee
- Automatically forces rare+ item every 4 levels
- Counter resets after guarantee triggers

## Testing Notes

All syntax validation passed:
- ✅ SynergyData.js
- ✅ KeystoneData.js
- ✅ SynergySystem.js
- ✅ Game.js
- ✅ UISystem.js

Schema compliance verified:
- ✅ All 6 synergies present with correct thresholds
- ✅ All 6 keystones present with epic rarity
- ✅ All 6 ships have correct HP values
- ✅ All ships linked to correct keystones
- ✅ Unlock conditions properly formatted

## Usage

The systems are fully integrated and work automatically:

1. **Synergies** activate automatically when player acquires items with matching tags
2. **Keystones** appear as upgrade choices with 25% chance per level (once per run)
3. **Rerolls** available via button on level-up screen (2 per run)
4. **Rare Guarantee** triggers automatically every 4 levels

## Future Enhancements

Potential additions not in current schema:
- Synergy combo effects
- Keystone evolution mechanics
- Dynamic difficulty scaling based on synergies
- Synergy-specific visual effects
