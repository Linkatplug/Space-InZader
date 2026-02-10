# Black Hole Instant Kill Feature

## Overview
The black hole (trou de verre / glass hole) now has a deadly center zone that instantly kills both the player and NPCs/enemies, rather than just damaging them gradually.

## Implementation Details

### Kill Zones
The black hole now has two damage zones:

1. **Center Kill Zone (Instant Death)** ☠️
   - Radius: **30 pixels** from center
   - Effect: **INSTANT DEATH**
   - Triggers immediate game over for player
   - Instantly kills all NPCs/enemies

2. **Damage Zone (Gradual Damage)**
   - Radius: **30-80 pixels** from center
   - Effect: Scaled damage based on distance
   - Existing damage behavior maintained
   - Closer to center = more damage (1x to 3x multiplier)

3. **Safe Zone**
   - Distance: **> 80 pixels** from center
   - Effect: No damage

### Technical Implementation

#### Player Instant Kill
Located in `CollisionSystem.js` (lines ~724-747):
```javascript
if (distance < centerKillRadius) {
    // INSTANT KILL - Player is in the center of the black hole
    const health = player.getComponent('health');
    if (health && !health.godMode) {
        health.current = 0; // Instant death
        
        // Intense visual feedback
        this.screenEffects.shake(15, 0.5);
        this.screenEffects.flash('#9400D3', 0.5, 0.5);
        
        // Play death sound
        this.audioManager.playSFX('death');
    }
}
```

**Features:**
- Respects god mode (DevTools feature)
- Intense visual feedback:
  - Screen shake: 15 intensity, 0.5 seconds
  - Purple flash (#9400D3), 0.5 intensity, 0.5 seconds
- Death sound plays immediately
- Console log for debugging

#### NPC/Enemy Instant Kill
Located in `CollisionSystem.js` (lines ~788-795):
```javascript
if (distance < centerKillRadius) {
    // INSTANT KILL - Enemy is in the center of the black hole
    const enemyHealth = enemy.getComponent('health');
    if (enemyHealth) {
        enemyHealth.current = 0; // Instant death
    }
}
```

**Features:**
- Works on all enemy types (Drone, Chasseur, Tank, Tireur, Elite, Boss)
- No exceptions or protections
- Console log for debugging

### Game Over Trigger
When player health reaches 0, the game loop automatically detects it and calls `gameOver()`:
- Located in `Game.js` (lines ~1293-1295)
- Checks health in main update loop
- Triggers immediately when health.current <= 0

## Testing Recommendations

### Manual Testing
1. **Player Death Test**:
   - Start game
   - Wait for black hole event (press F4 → Utilities → "Spawn Glass Hole")
   - Fly directly into the center of the black hole
   - Expected: Instant death, game over screen
   - Visual: Strong screen shake + purple flash
   - Audio: Death sound plays

2. **NPC Death Test**:
   - Spawn black hole (F4 → DevTools)
   - Spawn dummy enemy near black hole (F4 → "Spawn Dummy Enemy")
   - Watch enemy get pulled into center
   - Expected: Enemy dies instantly when reaching center
   - Console: "[Black Hole] Enemy sucked into center - INSTANT DEATH!"

3. **God Mode Test**:
   - Enable god mode (F4 → "God Mode: ON")
   - Fly into black hole center
   - Expected: No death (god mode protection works)
   - Disable god mode → fly in again → instant death

4. **Damage Zone Test**:
   - Stay between 30-80 pixels from black hole center
   - Expected: Gradual damage (existing behavior)
   - Not instant death

### Console Logging
The following messages appear in console for debugging:
```
[Black Hole] Player sucked into center - INSTANT DEATH!
[Black Hole] Enemy sucked into center - INSTANT DEATH!
```

## Visual Feedback

### Player Death
- **Screen Shake**: 15 intensity (3x stronger than normal hit)
- **Flash**: Purple (#9400D3), 0.5 intensity (5x stronger than normal hit)
- **Duration**: 0.5 seconds
- **Sound**: Death sound effect

### Enemy Death
- No special visual feedback (standard enemy death)
- Counted in kill statistics
- XP orb drops normally

## Balance Considerations

### Kill Radius: 30 pixels
- **Small enough** to be avoidable with skill
- **Large enough** to be threatening when pulled
- Approximately 37.5% of damage radius (80 pixels)
- Visible center of black hole sprite

### Pull Strength
- Black hole pull radius: 800 pixels
- Strong pull near center makes escape difficult
- Creates risk/reward: staying near black hole is dangerous

### Grace Period
- 1 second grace period after spawn (existing behavior)
- Gives players time to react and escape
- Center kill starts only after grace period

## Code Locations

### Files Modified
1. **js/systems/CollisionSystem.js** (+37 lines)
   - Player instant kill logic (lines ~724-747)
   - Enemy instant kill logic (lines ~788-795)

2. **index.html** (+1 line)
   - DevTools scrolling fix (min-height: 0)

### Key Constants
```javascript
const centerKillRadius = 30; // Instant death zone
const damageRadius = 80;     // Gradual damage zone (from WeatherSystem)
const pullRadius = 800;      // Pull effect zone (from WeatherSystem)
```

## Known Behavior

### What Gets Killed
✅ Player (triggers game over)
✅ All enemy types (Drone, Chasseur, Tank, Tireur, Elite, Boss)
✅ Dummy enemies (from DevTools)

### What Doesn't Get Killed
❌ XP orbs (destroyed separately by black hole)
❌ Projectiles (no health component)
❌ Player with god mode enabled (DevTools feature)

### Edge Cases
- **Multiple enemies**: All killed simultaneously if in center
- **Boss enemies**: Killed instantly like any other enemy
- **Respawn**: Player respawns normally after game over
- **Score**: Player's final score is saved before game over

## Future Enhancements (Optional)
- [ ] Visual indicator for instant kill zone (red circle at 30px radius)
- [ ] Unique animation for center death (vortex effect)
- [ ] Achievement: "Avoided the Singularity" (survive black hole event)
- [ ] Statistics: Track black hole deaths separately
- [ ] Warning sound when entering kill zone

## Related Features
- Black hole pull mechanics (MovementSystem.js)
- Black hole visual effects (RenderSystem.js)
- Weather event system (WeatherSystem.js)
- DevTools spawning (DevTools.js)
