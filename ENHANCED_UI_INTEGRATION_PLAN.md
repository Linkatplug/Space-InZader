# EnhancedUIComponents Integration Plan

## 🎯 Overview

This document provides a comprehensive plan for integrating EnhancedUIComponents into Space InZader's runtime UI to display tactical information during gameplay.

## 📊 Current State

### ✅ Ready
- `EnhancedUIComponents.js` loaded in `index.html` (line 1392)
- All 6 UI component classes available via `window.EnhancedUIComponents`:
  1. `ThreeLayerDefenseUI` - 3-layer defense bars
  2. `HeatGaugeUI` - Heat gauge with warnings
  3. `WeaponDamageTypeDisplay` - Current weapon type
  4. `DamageFloatingText` - Floating damage numbers
  5. `EnemyResistanceIndicator` - Enemy weakness/resistance
  6. `LayerDamageNotification` - Layer damage notifications
- `UISystem.js` exists for HUD management
- `DefenseSystem.js` exists for damage calculation
- `EnemyProfiles.PROFILES` with resistance data

### ❌ Needs Implementation
- UI components not instantiated in runtime
- No data binding between game state and UI
- No event emission from damage system
- No keyboard toggle for tactical UI
- No enemy resistance indicators in render
- No floating damage text system
- No CSS styling for new components

---

## 📋 Implementation Plan

### Phase 1: Player Data Structure (js/core/ECS.js)

Ensure player component has required fields:

```javascript
Components.Player = function() {
    // ... existing fields ...
    
    // Required for tactical UI:
    defenseLayers: null,  // Set by DefenseSystem - { shield: {}, armor: {}, structure: {} }
    heat: null,           // Set by HeatSystem - { current, max, overheated }
    stats: {},            // Unified stats from upgrades + modules
    currentWeapon: null   // Reference to current weapon with damageType
};
```

**Verification:**
```javascript
// In Game.js initialization
console.log('Player has defenseLayers:', !!player.defenseLayers);
console.log('Player has heat:', !!player.heat);
console.log('Player has currentWeapon:', !!player.currentWeapon);
```

---

### Phase 2: UISystem Integration (js/systems/UISystem.js)

#### 2.1 Add Tactical UI Fields

```javascript
constructor(world, gameState) {
    // ... existing code ...
    
    // Tactical UI components
    this.tacticalUI = {
        enabled: true,
        container: null,
        defenseUI: null,
        heatUI: null,
        weaponTypeUI: null,
        floatingTexts: [],
        notifications: []
    };
    
    this.initTacticalUI();
}
```

#### 2.2 Initialize Tactical UI

```javascript
initTacticalUI() {
    // Create main container
    const container = document.createElement('div');
    container.id = 'tactical-ui-container';
    container.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 100;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    this.tacticalUI.container = container;
    
    // Check if components available
    if (!window.EnhancedUIComponents) {
        console.warn('[UI] EnhancedUIComponents not loaded');
        return;
    }
    
    const Components = window.EnhancedUIComponents;
    
    // Create sub-containers
    const defenseContainer = document.createElement('div');
    defenseContainer.id = 'defense-ui';
    container.appendChild(defenseContainer);
    
    const heatContainer = document.createElement('div');
    heatContainer.id = 'heat-ui';
    container.appendChild(heatContainer);
    
    const weaponContainer = document.createElement('div');
    weaponContainer.id = 'weapon-type-ui';
    container.appendChild(weaponContainer);
    
    // Instantiate components
    try {
        this.tacticalUI.defenseUI = new Components.ThreeLayerDefenseUI(defenseContainer);
        this.tacticalUI.heatUI = new Components.HeatGaugeUI(heatContainer);
        this.tacticalUI.weaponTypeUI = new Components.WeaponDamageTypeDisplay(weaponContainer);
        
        console.log('[UI] Tactical UI components initialized');
    } catch (error) {
        console.error('[UI] Failed to initialize tactical components:', error);
    }
    
    // Listen for damage events
    if (this.world.events) {
        this.world.events.on('damageApplied', (data) => {
            this.onDamageApplied(data);
        });
    }
}
```

#### 2.3 Update Tactical UI Every Frame

```javascript
update(deltaTime) {
    // ... existing HUD updates ...
    
    // Update tactical UI if enabled and game active
    if (this.tacticalUI.enabled && this.gameState.gameActive) {
        this.updateTacticalUI();
    }
}

updateTacticalUI() {
    const player = this.getPlayer();
    if (!player) return;
    
    // Update defense bars
    if (this.tacticalUI.defenseUI && player.defenseLayers) {
        this.tacticalUI.defenseUI.update(player.defenseLayers);
    }
    
    // Update heat gauge
    if (this.tacticalUI.heatUI && player.heat) {
        this.tacticalUI.heatUI.update(player.heat);
    }
    
    // Update weapon type display
    if (this.tacticalUI.weaponTypeUI && player.currentWeapon) {
        const damageType = player.currentWeapon.damageType || 'kinetic';
        this.tacticalUI.weaponTypeUI.update(damageType);
    }
}

getPlayer() {
    // Helper to get player entity
    const entities = this.world.getEntitiesWithComponent('player');
    return entities.length > 0 ? entities[0] : null;
}
```

#### 2.4 Handle Damage Events

```javascript
onDamageApplied(data) {
    // data = { targetId, layerHit, finalDamage, damageType, resistUsed }
    
    // Show floating damage text
    this.showFloatingDamage(data);
    
    // Show layer notification
    this.showLayerNotification(data);
}

showFloatingDamage(data) {
    const damageColors = {
        em: '#00FFFF',
        thermal: '#FF8C00',
        kinetic: '#FFFFFF',
        explosive: '#FF0000'
    };
    
    const text = document.createElement('div');
    text.className = 'floating-damage';
    text.textContent = `-${Math.round(data.finalDamage)}`;
    text.style.cssText = `
        position: absolute;
        color: ${damageColors[data.damageType] || '#FFFFFF'};
        font-size: 20px;
        font-weight: bold;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
    `;
    
    // Position would need screen coordinate conversion
    // For now, add to container
    this.tacticalUI.container.appendChild(text);
    
    // Remove after animation
    setTimeout(() => text.remove(), 1000);
}

showLayerNotification(data) {
    const layerEmojis = {
        shield: '🟦 BOUCLIER',
        armor: '🟫 ARMURE',
        structure: '🔧 STRUCTURE'
    };
    
    const message = `${layerEmojis[data.layerHit]} -${Math.round(data.finalDamage)}`;
    console.log(`[Combat] ${message}`);
    
    // Could add visual notification banner here
}
```

#### 2.5 Add Keyboard Toggle

```javascript
bindEvents() {
    // ... existing event bindings ...
    
    // Tactical UI toggle with 'U' key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'u' || e.key === 'U') {
            this.toggleTacticalUI();
        }
    });
}

toggleTacticalUI() {
    this.tacticalUI.enabled = !this.tacticalUI.enabled;
    
    if (this.tacticalUI.container) {
        this.tacticalUI.container.style.display = 
            this.tacticalUI.enabled ? 'block' : 'none';
    }
    
    const status = this.tacticalUI.enabled ? 'enabled' : 'disabled';
    console.log(`[UI] tactical HUD ${status}`);
}
```

---

### Phase 3: DefenseSystem Event Emission (js/systems/DefenseSystem.js)

Add event emission when damage is applied:

```javascript
applyDamage(entity, rawDamage, damageType = 'kinetic') {
    const defense = entity.defenseLayers;
    if (!defense) {
        // Fallback to old health system
        return this.applyDamageToHealth(entity, rawDamage);
    }
    
    // ... existing damage calculation ...
    
    // Determine which layer was hit
    let layerHit = 'shield';
    if (defense.shield.current <= 0) {
        layerHit = 'armor';
    }
    if (defense.shield.current <= 0 && defense.armor.current <= 0) {
        layerHit = 'structure';
    }
    
    // Emit event for UI
    if (this.world.events) {
        this.world.events.emit('damageApplied', {
            targetId: entity.id,
            layerHit: layerHit,
            finalDamage: damageAfterResist,
            damageType: damageType,
            resistUsed: resistance
        });
    }
    
    return totalDamageDealt;
}
```

---

### Phase 4: Enemy Resistance Indicators (js/systems/RenderSystem.js)

Add resistance indicators above enemies:

```javascript
drawEnemy(entity) {
    // ... existing enemy drawing code ...
    
    // Draw resistance indicator if tactical UI enabled
    if (this.showTacticalInfo) {
        this.drawResistanceIndicator(entity);
    }
}

drawResistanceIndicator(enemy) {
    // Get player and current weapon
    const player = this.getPlayer();
    if (!player || !player.currentWeapon) return;
    
    const damageType = player.currentWeapon.damageType || 'kinetic';
    const defense = enemy.defenseLayers;
    
    if (!defense) return;
    
    // Calculate average resistance across active layers
    let avgResist = 0;
    let layerCount = 0;
    
    // Shield layer
    if (defense.shield.current > 0) {
        avgResist += defense.shield.resistances[damageType] || 0;
        layerCount++;
    }
    
    // Armor layer
    if (defense.armor.current > 0) {
        avgResist += defense.armor.resistances[damageType] || 0;
        layerCount++;
    }
    
    // Structure layer
    if (defense.structure.current > 0) {
        avgResist += defense.structure.resistances[damageType] || 0;
        layerCount++;
    }
    
    if (layerCount > 0) {
        avgResist /= layerCount;
    }
    
    // Determine indicator based on resistance thresholds
    let symbol, color;
    if (avgResist <= 0.15) {
        // Weak (≤15% resistance)
        symbol = '▼';
        color = '#00FF00';  // Green
    } else if (avgResist <= 0.40) {
        // Normal (15-40% resistance)
        symbol = '■';
        color = '#FFFF00';  // Yellow
    } else {
        // Resistant (≥40% resistance)
        symbol = '▲';
        color = '#FF0000';  // Red
    }
    
    // Draw above enemy
    const sprite = entity.sprite || {};
    const size = sprite.size || 20;
    
    this.ctx.save();
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(symbol, entity.x, entity.y - size - 10);
    this.ctx.fillText(symbol, entity.x, entity.y - size - 10);
    this.ctx.restore();
}
```

---

### Phase 5: Event Bus (js/Game.js)

Add simple event bus to Game class:

```javascript
class Game {
    constructor() {
        // ... existing code ...
        
        // Create simple event bus
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
            },
            off(event, callback) {
                if (this.listeners[event]) {
                    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
                }
            }
        };
        
        // Make event bus available to systems
        this.world.events = this.events;
        
        console.log('[Game] Event bus initialized');
    }
}
```

---

### Phase 6: CSS Styling (index.html or separate file)

Add styles for tactical UI components:

```html
<style>
/* Tactical UI Container */
#tactical-ui-container {
    font-family: 'Courier New', monospace;
    color: white;
    text-shadow: 0 0 5px rgba(0,0,0,0.8);
}

/* Defense Layers */
.defense-layers {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.defense-layer {
    margin-bottom: 5px;
}

.layer-label {
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: bold;
}

.layer-bar {
    width: 200px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
}

.layer-fill {
    height: 100%;
    transition: width 0.2s ease-out;
}

.shield-fill {
    background: linear-gradient(90deg, #00BFFF, #1E90FF);
}

.armor-fill {
    background: linear-gradient(90deg, #8B4513, #A0522D);
}

.structure-fill {
    background: linear-gradient(90deg, #DC143C, #FF1493);
}

.layer-value {
    font-size: 11px;
    text-align: right;
    margin-top: 2px;
}

/* Heat Gauge */
#heat-ui {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Weapon Type Display */
#weapon-type-ui {
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Floating Damage Text */
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
    animation: floatUp 1s ease-out forwards;
}

/* Heat Warning Animation */
@keyframes pulseRed {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
    50% { box-shadow: 0 0 20px rgba(255, 0, 0, 1); }
}

.heat-critical {
    animation: pulseRed 1s infinite;
}
</style>
```

---

## ✅ Validation Checklist

After implementation, verify:

- [ ] **HUD shows 3 bars**: Shield/Armor/Structure update live
- [ ] **Heat gauge**: Changes color at 50%, 75%, 95% thresholds
- [ ] **Heat warning**: Red + pulsing at 95%+
- [ ] **Weapon type icon**: Shows current weapon damage type with color
- [ ] **Floating damage**: On hit shows "🟦 BOUCLIER -50" or similar
- [ ] **Enemy indicators**: Above enemies shows ▼ (weak) / ■ (normal) / ▲ (resistant)
- [ ] **Keyboard toggle**: Press 'U' toggles tactical UI on/off
- [ ] **Console logs**: "[UI] tactical HUD enabled/disabled"

### Test Scenarios

1. **Defense Bars Test**:
   - Take damage → Shield bar decreases
   - Shield breaks → Armor bar starts decreasing
   - Armor breaks → Structure bar starts decreasing
   - Wait without damage → Shield regenerates

2. **Heat Gauge Test**:
   - Fire weapons → Heat increases
   - Stop firing → Heat decreases (cooling)
   - Overheat → Gauge shows red + warning
   - Heat at 95%+ → Visual warning visible

3. **Weapon Type Test**:
   - Switch weapons → Type display changes
   - EM weapon → Shows cyan ✧
   - Thermal weapon → Shows orange ✹
   - Kinetic weapon → Shows white ⦿
   - Explosive weapon → Shows red 💥

4. **Enemy Resistance Test**:
   - Scout Drone with EM weapon → Shows ▼ (weak to EM)
   - Armored Cruiser with EM weapon → Shows ▲ (resistant)
   - Switch to Explosive → Indicator changes to ▼

5. **Floating Text Test**:
   - Hit enemy → Damage number appears
   - Number color matches damage type
   - Text floats up and fades out

---

## 📊 File Summary

| File | Changes | Lines | Priority |
|------|---------|-------|----------|
| js/core/ECS.js | Add player fields | ~5 | High |
| js/systems/UISystem.js | Full integration | ~200 | High |
| js/systems/DefenseSystem.js | Event emission | ~15 | High |
| js/Game.js | Event bus | ~20 | High |
| js/systems/RenderSystem.js | Resistance indicators | ~60 | Medium |
| index.html | CSS styling | ~100 | Medium |

**Total**: ~400 lines across 6 files

---

## 🎯 Implementation Order

### Day 1: Core Integration
1. Phase 5: Event bus (Game.js)
2. Phase 1: Player data structure (ECS.js)
3. Phase 2: UISystem integration (basic)
4. Phase 6: CSS styling

### Day 2: Feedback Systems
5. Phase 3: DefenseSystem events
6. Phase 2.4: Damage event handling
7. Test and debug

### Day 3: Visual Polish
8. Phase 4: Enemy resistance indicators
9. Final testing
10. Bug fixes

---

## ⚠️ Important Notes

### Data Dependencies
- Player MUST have `defenseLayers`, `heat`, `currentWeapon` fields
- DefenseSystem MUST be initialized for player
- HeatSystem MUST be initialized for player
- Current weapon MUST have `damageType` field

### Graceful Fallbacks
- Check if `window.EnhancedUIComponents` exists
- Check if player has required fields before updating
- Don't crash if data missing, just skip update

### Performance Considerations
- Update UI at most once per frame
- Cache DOM elements (don't query every frame)
- Use CSS transitions for smooth animations
- Limit floating text creation (max 10 at once)

### Debugging
```javascript
// Add to UISystem.update() for debugging
if (this.debugUI) {
    console.log('Defense:', player.defenseLayers);
    console.log('Heat:', player.heat);
    console.log('Weapon:', player.currentWeapon?.damageType);
}
```

---

## 🚀 Expected Result

After implementation, players will see:
- **3-layer defense bars** showing Shield/Armor/Structure in real-time
- **Heat gauge** with color-coded warnings (green/yellow/orange/red)
- **Weapon type display** showing current damage type
- **Floating damage numbers** when enemies are hit
- **Enemy resistance indicators** showing tactical advantage/disadvantage
- **Smooth UI** that updates every frame
- **Toggle capability** with 'U' key

This creates a **Vampire Survivors-style tactical overlay** that makes combat more engaging and strategic!

---

*Document Version: 1.0*
*Last Updated: 2026-02-13*
*Status: Ready for Implementation*
