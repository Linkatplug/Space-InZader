# Mobile Input Architecture

## Overview

This document explains how mobile input is handled in Space InZader to ensure menus remain clickable while gameplay touch controls work properly.

## Problem Statement

On mobile devices (Samsung Internet, Chrome Android), there are two competing needs:
1. **In Menus**: Buttons must be fully clickable using touch/pointer events
2. **In Gameplay**: Touch events on canvas should prevent default behavior (scroll/zoom) and could drive game controls

Without proper state management, canvas touch handlers can call `preventDefault()` globally, which prevents the browser from generating click events on menu buttons, making them unresponsive.

## Solution Architecture

### 1. State-Aware Input Handling

**Core Function** (`js/Game.js`):
```javascript
isGameplayActive() {
    return this.gameState && this.gameState.isState(GameStates.RUNNING);
}
```

This function is the **single source of truth** for whether input should be processed for gameplay or ignored for menus.

### 2. Canvas Touch Event Guards

**Implementation** (`js/Game.js` - `setupCanvasTouchHandlers()`):

```javascript
this.canvas.addEventListener('touchstart', (e) => {
    if (!this.isGameplayActive()) {
        // In menus: allow normal touch behavior (enables clicks)
        return;
    }
    // In gameplay: prevent scroll/zoom
    e.preventDefault();
}, { passive: false });
```

**Key Points**:
- ✅ Only listens on `canvas` element, not `document` or `window`
- ✅ Checks state before calling `preventDefault()`
- ✅ Uses `{ passive: false }` to allow preventDefault when needed
- ✅ Returns early in menus, allowing normal click generation

### 3. CSS Pointer Event Management

**Implementation** (`index.html`):

```css
/* Disable canvas pointer capture when menus are active */
body:has(.menu-screen.active) #gameCanvas,
body:has(.level-up-screen.active) #gameCanvas,
body:has(.game-over-screen.active) #gameCanvas,
body:has(.meta-screen.active) #gameCanvas {
    pointer-events: none !important;
    touch-action: none !important;
}
```

**Benefits**:
- ✅ Canvas cannot capture pointer events when menus are visible
- ✅ Works automatically based on DOM state
- ✅ No JavaScript coordination needed

### 4. Mobile-Friendly Button Handlers

**Implementation** (`js/Game.js`):

```javascript
const addButtonHandler = (buttonId, handler) => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    // Add click handler (for desktop and fallback)
    btn.addEventListener('click', handler);
    
    // Add pointerdown handler (more reliable on mobile)
    btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Prevent event from reaching canvas
        handler(e);
    });
};
```

**Benefits**:
- ✅ Dual event system: `click` (desktop) + `pointerdown` (mobile)
- ✅ `stopPropagation()` prevents canvas from seeing events
- ✅ Works on all devices and browsers

### 5. Movement System Integration

**Implementation** (`js/systems/MovementSystem.js`):

The MovementSystem only handles keyboard input, which is passive and doesn't interfere with touch. However, it's only updated when the game is in RUNNING state:

**Game Loop Guard** (`js/Game.js`):
```javascript
if (this.running && this.gameState.isState(GameStates.RUNNING)) {
    this.update(deltaTime); // Calls systems.movement.update()
}
```

## State Flow

### Menu State (MENU, PAUSED, LEVEL_UP, GAME_OVER)

```
User touches button
    ↓
Canvas touch handler checks isGameplayActive()
    ↓
Returns false → no preventDefault()
    ↓
Browser generates normal click event
    ↓
Button receives click
    ↓
Handler fires ✅
```

**Canvas State**:
- CSS: `pointer-events: none` (cannot capture)
- Touch handlers: Return early (no preventDefault)
- Movement: Not updated (game loop guard)

### Gameplay State (RUNNING)

```
User touches canvas
    ↓
Canvas touch handler checks isGameplayActive()
    ↓
Returns true → preventDefault() called
    ↓
No scroll/zoom interference
    ↓
Game can handle touch for controls ✅
```

**Canvas State**:
- CSS: `pointer-events: auto` (can capture)
- Touch handlers: Active (preventDefault enabled)
- Movement: Updated normally

## Best Practices

### DO:
✅ Check `isGameplayActive()` before any gameplay input processing
✅ Use `{ passive: false }` only when you need preventDefault
✅ Add touch handlers to specific elements (canvas), not globally
✅ Use `stopPropagation()` on button handlers
✅ Test on actual mobile devices (Samsung Internet, Chrome Android)

### DON'T:
❌ Call preventDefault() on document-level touch events
❌ Add global touch handlers that always preventDefault
❌ Forget to check game state before input processing
❌ Use only `click` events on mobile (add pointerdown too)
❌ Rely on z-index alone to fix touch capture issues

## Testing

### Manual Testing Checklist

**On Mobile Device (Samsung Internet / Chrome Android)**:

1. **Main Menu Test**:
   - [ ] Open game on mobile
   - [ ] Touch SOLO button → Should navigate to ship selection
   - [ ] Touch MULTIJOUEUR button → Should open multiplayer menu
   - [ ] Touch OPTIONS button → Should open options
   - [ ] No joystick or game controls visible

2. **Gameplay Test**:
   - [ ] Start a game
   - [ ] Touch canvas → Should NOT scroll page
   - [ ] Touch canvas → Should NOT zoom page
   - [ ] Keyboard controls work (if applicable)

3. **Pause Menu Test**:
   - [ ] Pause game (ESC or menu button)
   - [ ] Touch RESUME button → Should resume
   - [ ] Touch OPTIONS button → Should open options
   - [ ] No gameplay input processed while paused

4. **Game Over Test**:
   - [ ] Reach game over screen
   - [ ] Touch RETRY button → Should restart
   - [ ] Touch MAIN MENU button → Should return to menu

### Browser DevTools Mobile Testing

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select device: "Samsung Galaxy S20 Ultra" or similar
4. Test touch events using mouse (simulates touch)
5. Check console for errors

## Troubleshooting

### Problem: Menu buttons don't respond on mobile

**Check**:
1. Open DevTools console
2. Look for JavaScript errors
3. Verify `isGameplayActive()` returns false in menu:
   ```javascript
   console.log('Gameplay active?', window.gameInstance.isGameplayActive());
   ```
4. Check if canvas has `pointer-events: none` in Elements tab
5. Verify no global preventDefault on document

### Problem: Canvas scrolls/zooms during gameplay

**Check**:
1. Verify `isGameplayActive()` returns true during gameplay
2. Check canvas touch handlers are attached:
   ```javascript
   console.log('Canvas handlers:', window.gameInstance.canvas);
   ```
3. Ensure `{ passive: false }` is set on touch handlers

### Problem: Joystick appears in menus

**Note**: This game does not currently implement a virtual joystick. If you see one:
- It's likely a browser extension (gamepad overlay)
- Check for third-party scripts
- The CSS in `index.html` includes rules to hide common joystick overlays

## Future Enhancements

### Adding Virtual Joystick (If Needed)

If you want to add touch-based movement controls:

1. **Create JoystickManager**:
   ```javascript
   class JoystickManager {
       constructor(game, canvas) {
           this.game = game;
           this.canvas = canvas;
           this.active = false;
       }
       
       enable() {
           if (!this.game.isGameplayActive()) return;
           this.active = true;
           // Add touch handlers for joystick
       }
       
       disable() {
           this.active = false;
           // Remove touch handlers
       }
   }
   ```

2. **State-Aware Activation**:
   ```javascript
   // In Game.js
   onGameStart() {
       if (this.joystickManager) {
           this.joystickManager.enable();
       }
   }
   
   onGameEnd() {
       if (this.joystickManager) {
           this.joystickManager.disable();
       }
   }
   ```

3. **Guard All Touch Input**:
   ```javascript
   onTouch(e) {
       if (!this.game.isGameplayActive()) return;
       // Process joystick input
   }
   ```

## Summary

The mobile input system is designed with **state-awareness** as the core principle. Every input handler checks whether gameplay is active before processing touch events or calling preventDefault. This ensures:

- ✅ Menus remain fully functional on mobile
- ✅ Gameplay touch controls work properly
- ✅ No interference between menu and game input
- ✅ Clean separation of concerns
- ✅ Robust cross-browser compatibility

The key is: **Always check `isGameplayActive()` before any gameplay input handling.**
