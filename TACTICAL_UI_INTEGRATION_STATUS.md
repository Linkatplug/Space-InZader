# Tactical UI Integration Status

## 📊 Current State (as of 2026-02-13)

### ✅ What's Already in Place

1. **EnhancedUIComponents.js** - Already loaded in index.html (line 1392)
   - ThreeLayerDefenseUI class ready
   - HeatGaugeUI class ready
   - WeaponDamageTypeDisplay class ready
   - DamageFloatingText class ready
   - EnemyResistanceIndicator static methods ready
   - LayerDamageNotification class ready

2. **UISystem.js** - Existing HUD system in place
   - update() method called every frame
   - updateHUD() updates player stats
   - Accesses player entity and components
   - Has existing DOM element caching

3. **DefenseSystem.js** - 3-layer defense system exists
   - applyDamage() method applies shield/armor/structure damage
   - Handles resistance calculations
   - Returns damage dealt info

4. **Player Component** - Has or needs these fields:
   - player.defenseLayers (for 3-layer defense)
   - player.heat (for heat system)
   - player.currentWeapon (for weapon type)
   - player.modules (for modules)
   - player.upgrades (for ship upgrades)

### ❌ What Needs to Be Integrated

## 🔧 Integration Implementation Guide

### Phase 1: UISystem Constructor Setup

Add to `js/systems/UISystem.js` constructor (after line 46):

```javascript
// Tactical UI components
this.tacticalUI = {
    enabled: true,
    container: null,
    defenseUI: null,
    heatUI: null,
    weaponTypeUI: null,
    floatingTextElements: []
};

// Initialize tactical UI
if (typeof window.EnhancedUIComponents !== 'undefined') {
    this.initTacticalUI();
}
```

### Phase 2: Initialize Tactical UI Method

Add new method to `js/systems/UISystem.js`:

```javascript
/**
 * Initialize tactical UI components
 */
initTacticalUI() {
    // Create container div
    const container = document.createElement('div');
    container.id = 'tactical-ui-container';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        left: 10px;
        z-index: 100;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    this.tacticalUI.container = container;
    
    // Create sub-containers
    const defenseContainer = document.createElement('div');
    defenseContainer.id = 'defense-ui';
    defenseContainer.style.cssText = 'margin-bottom: 10px;';
    container.appendChild(defenseContainer);
    
    const heatContainer = document.createElement('div');
    heatContainer.id = 'heat-ui';
    heatContainer.style.cssText = 'margin-bottom: 10px;';
    container.appendChild(heatContainer);
    
    const weaponContainer = document.createElement('div');
    weaponContainer.id = 'weapon-type-ui';
    container.appendChild(weaponContainer);
    
    // Instantiate UI components
    const Components = window.EnhancedUIComponents;
    
    this.tacticalUI.defenseUI = new Components.ThreeLayerDefenseUI(defenseContainer);
    this.tacticalUI.heatUI = new Components.HeatGaugeUI(heatContainer);
    this.tacticalUI.weaponTypeUI = new Components.WeaponDamageTypeDisplay(weaponContainer);
    
    console.log('[UI] Tactical UI components initialized');
}
```

### Phase 3: Update Tactical UI in updateHUD()

Modify `js/systems/UISystem.js` updateHUD() method (around line 293).
Add after the existing health/stats updates:

```javascript
// Update tactical UI if enabled
if (this.tacticalUI && this.tacticalUI.enabled) {
    this.updateTacticalUI(player);
}
```

Add new method:

```javascript
/**
 * Update tactical UI components with current player state
 */
updateTacticalUI(player) {
    if (!this.tacticalUI.defenseUI) return;
    
    // Update defense UI
    const defense = player.getComponent('defense');
    if (defense && this.tacticalUI.defenseUI) {
        this.tacticalUI.defenseUI.update(defense);
    }
    
    // Update heat UI
    const heat = player.getComponent('heat');
    if (heat && this.tacticalUI.heatUI) {
        this.tacticalUI.heatUI.update(heat);
    }
    
    // Update weapon type UI
    const playerComp = player.getComponent('player');
    if (playerComp && playerComp.weapons && playerComp.weapons.length > 0) {
        const currentWeapon = playerComp.weapons[0]; // First weapon
        const damageType = currentWeapon.data?.damageType || 'kinetic';
        this.tacticalUI.weaponTypeUI.update(damageType);
    }
}
```

### Phase 4: Keyboard Toggle

Add to `js/systems/UISystem.js` bindEvents() method (around line 238):

```javascript
// Tactical UI toggle (U key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'u' || e.key === 'U') {
        if (this.gameState.currentState === GameStates.RUNNING) {
            this.toggleTacticalUI();
        }
    }
});
```

Add new method:

```javascript
/**
 * Toggle tactical UI on/off
 */
toggleTacticalUI() {
    if (!this.tacticalUI) return;
    
    this.tacticalUI.enabled = !this.tacticalUI.enabled;
    
    if (this.tacticalUI.container) {
        this.tacticalUI.container.style.display = 
            this.tacticalUI.enabled ? 'block' : 'none';
    }
    
    console.log(`[UI] tactical HUD ${this.tacticalUI.enabled ? 'enabled' : 'disabled'}`);
}
```

### Phase 5: Event Bus in Game.js

If not already present, add to `js/Game.js` constructor:

```javascript
// Simple event bus for UI communication
this.events = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};

// Make events available to systems
this.world.events = this.events;
```

### Phase 6: DefenseSystem Event Emission

Modify `js/systems/DefenseSystem.js` applyDamage() method.
Add after damage calculation:

```javascript
// Emit event for UI
if (this.world.events) {
    this.world.events.emit('damageApplied', {
        targetId: entity.id,
        targetType: entity.type,
        layerHit: hitLayer, // 'shield', 'armor', or 'structure'
        finalDamage: damageDealt,
        damageType: damageType,
        resistUsed: resistance
    });
}
```

### Phase 7: Listen for Damage Events in UISystem

Add to `js/systems/UISystem.js` initTacticalUI():

```javascript
// Listen for damage events
if (this.world.events) {
    this.world.events.on('damageApplied', (data) => {
        this.showDamageNotification(data);
    });
}
```

Add new method:

```javascript
/**
 * Show floating damage notification
 */
showDamageNotification(data) {
    // Only show for enemies being hit by player
    if (data.targetType !== 'enemy') return;
    
    // Get layer emoji
    const layerEmojis = {
        shield: '🟦',
        armor: '🟫',
        structure: '🔧'
    };
    
    const layerNames = {
        shield: 'BOUCLIER',
        armor: 'ARMURE',
        structure: 'STRUCTURE'
    };
    
    const emoji = layerEmojis[data.layerHit] || '';
    const name = layerNames[data.layerHit] || data.layerHit.toUpperCase();
    const damage = Math.round(data.finalDamage);
    
    console.log(`[Combat] ${emoji} ${name} -${damage}`);
    
    // TODO: Create actual floating text element if position available
}
```

### Phase 8: Enemy Resistance Indicators in RenderSystem

This requires modifying the enemy rendering code to show resistance indicators above enemies.

Add to `js/systems/RenderSystem.js` or wherever enemies are drawn:

```javascript
// Draw resistance indicator above enemy
drawEnemyResistanceIndicator(ctx, enemy, playerWeaponType) {
    const defense = enemy.getComponent('defense');
    if (!defense) return;
    
    // Calculate average resistance for active layers
    let totalResist = 0;
    let layerCount = 0;
    
    if (defense.shield.current > 0) {
        totalResist += defense.shield.resistances[playerWeaponType] || 0;
        layerCount++;
    }
    if (defense.armor.current > 0) {
        totalResist += defense.armor.resistances[playerWeaponType] || 0;
        layerCount++;
    }
    if (defense.structure.current > 0) {
        totalResist += defense.structure.resistances[playerWeaponType] || 0;
        layerCount++;
    }
    
    const avgResist = layerCount > 0 ? totalResist / layerCount : 0;
    
    // Determine symbol and color
    let symbol, color;
    if (avgResist <= 0.15) {
        symbol = '▼';  // Weak
        color = '#00FF00';
    } else if (avgResist <= 0.40) {
        symbol = '■';  // Normal
        color = '#FFFF00';
    } else {
        symbol = '▲';  // Resistant
        color = '#FF0000';
    }
    
    // Draw above enemy
    const pos = enemy.getComponent('position');
    const collision = enemy.getComponent('collision');
    if (pos && collision) {
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(symbol, pos.x, pos.y - collision.size - 10);
        ctx.restore();
    }
}
```

### Phase 9: CSS Styling

Add to `index.html` in the `<head>` section or in a CSS file:

```html
<style>
/* Tactical UI Container */
#tactical-ui-container {
    font-family: 'Courier New', monospace;
    color: white;
    text-shadow: 0 0 5px rgba(0,0,0,0.8);
}

/* Defense UI Styles */
#defense-ui {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.defense-layer {
    margin-bottom: 5px;
}

.layer-label {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 2px;
}

.layer-bar {
    width: 200px;
    height: 18px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
}

.layer-fill {
    height: 100%;
    transition: width 0.2s;
}

.layer-value {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 11px;
    line-height: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

/* Heat UI Styles */
#heat-ui {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.heat-gauge {
    width: 200px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
}

.heat-fill {
    height: 100%;
    transition: width 0.2s, background-color 0.3s;
}

.heat-warning {
    animation: pulse 0.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

/* Weapon Type UI Styles */
#weapon-type-ui {
    background: rgba(0, 0, 0, 0.7);
    padding: 8px 12px;
    border-radius: 5px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: inline-block;
}

.weapon-type-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.weapon-type-symbol {
    font-size: 20px;
}

.weapon-type-name {
    font-size: 12px;
    font-weight: bold;
}

/* Floating damage text animation */
@keyframes floatUp {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(-50px);
        opacity: 0;
    }
}

.floating-damage {
    position: absolute;
    font-size: 18px;
    font-weight: bold;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}
</style>
```

## ✅ Validation Steps

After implementation, test:

1. **Defense Bars**: Open game, check top-left shows 3 colored bars (blue/brown/red)
2. **Heat Gauge**: Fire weapons, watch heat bar fill and change color
3. **Weapon Type**: Verify weapon icon shows with correct color
4. **Damage Text**: Hit enemies, check console for "🟦 BOUCLIER -XX" messages
5. **Enemy Indicators**: Look above enemies for ▼/■/▲ symbols
6. **Toggle**: Press 'U' to hide/show tactical UI

## 📊 Expected Console Output

```
[UI] Tactical UI components initialized
[UI] tactical HUD enabled
[Combat] 🟦 BOUCLIER -45
[Combat] 🟫 ARMURE -32
[Combat] 🔧 STRUCTURE -28
```

## 🎯 Success Criteria

- ✅ 3-layer bars visible and updating every frame
- ✅ Heat gauge changes color (green→yellow→orange→red)
- ✅ Heat warning appears at 95%+
- ✅ Weapon type icon shows current weapon's damage type
- ✅ Console shows damage events with layer info
- ✅ Enemy resistance indicators visible above enemies
- ✅ 'U' key toggles UI on/off

## 📝 Notes

- All UI components are additive - existing UI continues to work
- Components check for data existence before rendering
- Performance impact is minimal (only updating visible elements)
- Can be disabled with 'U' key if needed for debugging
- Console logs help verify integration is working

## 🚀 Status

**DOCUMENTATION COMPLETE** - Ready for implementation
**ESTIMATED LOC**: ~300-400 lines across 4-5 files
**ESTIMATED TIME**: 2-3 hours for full integration + testing
