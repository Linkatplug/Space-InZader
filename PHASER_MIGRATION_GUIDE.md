# Space InZader - Phaser 3 Migration Guide

## Overview
This document describes the port of Space InZader from vanilla JavaScript + Canvas 2D to Phaser 3 game engine.

## 🎯 Migration Status

### ✅ Completed
- [x] Project structure and build configuration (Vite + Phaser 3)
- [x] Core Phaser scenes (Boot, Menu, Game, GameOver)
- [x] Basic game loop integration
- [x] Player movement with Phaser input system
- [x] Starfield parallax background
- [x] Enemy spawning and basic AI
- [x] Collision detection
- [x] HUD (health bar, score)
- [x] Menu with ship selection
- [x] Game over screen

### 🚧 In Progress / To Do
- [ ] Complete ECS integration with Phaser
- [ ] Port all 14+ game systems
- [ ] Weapon system with auto-firing
- [ ] Particle effects using Phaser emitters
- [ ] Audio integration with Phaser sound system
- [ ] All enemy types and behaviors
- [ ] Progression system (XP, levels, upgrades)
- [ ] Meta-progression (Noyaux currency, unlocks)
- [ ] Complete UI (level-up screen, meta screen)
- [ ] Visual effects (screen shake, flashes, glows)
- [ ] All weapons, passives, and synergies
- [ ] Save/load system

## 📁 Project Structure

```
Space-InZader/
├── phaser/                     # NEW: Phaser-specific code
│   ├── main.js                # Entry point
│   ├── config.js              # Phaser configuration
│   ├── scenes/                # Phaser scenes
│   │   ├── BootScene.js       # Loading and initialization
│   │   ├── MenuScene.js       # Main menu with ship selection
│   │   ├── GameScene.js       # Main gameplay
│   │   └── GameOverScene.js   # End game stats
│   ├── systems/               # Ported game systems
│   └── utils/                 # Phaser-specific utilities
├── js/                        # EXISTING: Reusable code
│   ├── core/                  # ECS, GameState (reusable)
│   ├── data/                  # All game data (reusable)
│   ├── managers/              # SaveManager (reusable)
│   └── ...                    # Original systems (for reference)
├── index.html                 # Original vanilla JS version
├── index-phaser.html          # NEW: Phaser version
├── package.json               # NEW: Dependencies
├── vite.config.js             # NEW: Build config
└── PHASER_MIGRATION_GUIDE.md  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

The game will open automatically in your browser at `http://localhost:3000`.

## 🔄 Architecture Changes

### Original (Vanilla JS)
- Pure JavaScript with Canvas 2D
- Custom game loop with `requestAnimationFrame`
- Manual rendering with canvas drawing commands
- Window event listeners for input
- Custom ECS (Entity Component System)
- Systems update in fixed order each frame

### Phaser Edition
- Phaser 3 game engine
- Phaser's scene lifecycle (`create`, `update`, `render`)
- Phaser Graphics API and sprites
- Phaser Input system
- **Same ECS** (reused from original)
- Systems integrated with Phaser's update loop

## 📋 Migration Checklist

### Core Systems
- [x] **BootScene**: Asset loading, initialization
- [x] **MenuScene**: Ship selection, start game
- [x] **GameScene**: Main gameplay loop
- [x] **GameOverScene**: Stats and restart

### Game Systems (To Port)
- [ ] **MovementSystem**: Player input → Use Phaser Input
- [ ] **CombatSystem**: Weapon firing, damage → Integrate with Phaser physics
- [ ] **CollisionSystem**: Hit detection → Use Phaser physics collision
- [ ] **RenderSystem**: Drawing entities → Use Phaser Graphics/Sprites
- [ ] **AISystem**: Enemy behavior → Keep logic, update with Phaser
- [ ] **SpawnerSystem**: Enemy spawning → Use Phaser timers
- [ ] **WaveSystem**: Wave progression → Keep logic
- [ ] **PickupSystem**: Loot collection → Use Phaser physics
- [ ] **ParticleSystem**: Visual effects → Use Phaser particle emitters
- [ ] **DefenseSystem**: 3-layer defense → Keep logic
- [ ] **HeatSystem**: Weapon overheat → Keep logic
- [ ] **UISystem**: Menus, HUD → Use Phaser UI or DOM hybrid
- [ ] **SynergySystem**: Passive combos → Keep logic
- [ ] **WeatherSystem**: Environmental hazards → Adapt to Phaser

### Data Files (Reusable)
All data files in `js/data/` are compatible with both versions:
- ✅ ShipData.js
- ✅ EnemyProfiles.js
- ✅ WeaponDataBridge.js / NewWeaponData.js
- ✅ PassiveData.js
- ✅ DefenseData.js
- ✅ ModuleData.js
- ✅ SynergyData.js
- ✅ BalanceConstants.js
- ✅ LootData.js
- ✅ HeatData.js
- ✅ KeystoneData.js
- ✅ ShipUpgradeData.js
- ✅ TagSynergyData.js

### Rendering Migration

| Canvas 2D | Phaser 3 |
|-----------|----------|
| `ctx.fillRect()` | `this.add.rectangle()` |
| `ctx.arc()` | `this.add.circle()` |
| `ctx.fill()` | `graphics.fill()` |
| `ctx.stroke()` | `graphics.stroke()` |
| Manual transforms | `gameObject.x/y/rotation/scale` |
| Manual layer sorting | `gameObject.setDepth()` |
| Custom particles | `this.add.particles()` |
| Image drawing | `this.add.sprite()` |

### Input Migration

| Vanilla JS | Phaser 3 |
|------------|----------|
| `addEventListener('keydown')` | `this.input.keyboard.addKey()` |
| `this.keys[key] = true` | `key.isDown` |
| `addEventListener('click')` | `gameObject.setInteractive()` |
| Manual mouse tracking | `this.input.activePointer` |

### Physics Migration

| Manual | Phaser Arcade Physics |
|--------|----------------------|
| `entity.x += vx * dt` | `body.setVelocity(vx, vy)` |
| Manual collision checks | `this.physics.overlap()` |
| Manual bounds checking | `body.setCollideWorldBounds()` |
| Custom collision shapes | `body.setCircle()`, `body.setSize()` |

## 🎮 Controls

Both versions use identical controls:
- **WASD** or **Arrow Keys**: Move player
- **ESC**: Pause game
- **Mouse**: Menu navigation

## 🔧 Development Notes

### Keeping Both Versions
The original vanilla JS version (`index.html`) and Phaser version (`index-phaser.html`) can coexist:
- Shared data files work for both
- Shared ECS core works for both
- Different rendering/input implementations
- Easy to compare and test

### Performance Considerations
- Phaser has overhead but provides many optimizations
- WebGL renderer is faster than Canvas 2D for complex scenes
- Phaser's object pooling helps with garbage collection
- Built-in culling for off-screen objects

### Testing Strategy
1. Test basic gameplay first (movement, shooting, enemies)
2. Port one system at a time
3. Verify against original behavior
4. Add visual improvements (better particles, effects)
5. Optimize performance

## 📚 Resources

### Phaser 3 Documentation
- Official Docs: https://photonstorm.github.io/phaser3-docs/
- Examples: https://phaser.io/examples
- Community: https://phaser.discourse.group/

### Migration References
- Phaser 3 Migration Guide: https://phaser.io/phaser3/migration
- Arcade Physics: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.html
- Scene Tutorial: https://phaser.io/tutorials/making-your-first-phaser-3-game

## 🐛 Known Issues

- [ ] Full system integration pending
- [ ] Audio system not yet ported
- [ ] Particle effects using basic graphics (not Phaser emitters yet)
- [ ] UI is simplified (needs full port)
- [ ] Weapon system incomplete
- [ ] Progression system not implemented

## 🎯 Next Steps

1. **Complete Core Gameplay**
   - Port weapon firing system
   - Implement all enemy types
   - Add projectile types

2. **Port Progression System**
   - XP collection and leveling
   - Level-up screen with boost selection
   - Weapon evolution system

3. **Enhance Visuals**
   - Use Phaser particle emitters
   - Add screen effects (shake, flash, glow)
   - Improve visual feedback

4. **Port UI**
   - Complete HUD
   - Level-up screen
   - Meta-progression screen
   - Pause menu

5. **Add Audio**
   - Port AudioManager to Phaser
   - Implement all sound effects
   - Background music

6. **Testing & Polish**
   - Balance testing
   - Performance optimization
   - Bug fixes

## 💡 Tips for Contributors

1. **Reuse Logic**: Most game logic (calculations, algorithms) works as-is
2. **Replace Rendering**: Only rendering code needs significant changes
3. **Replace Input**: Use Phaser's input system instead of DOM events
4. **Test Incrementally**: Port one feature, test, then move to next
5. **Reference Original**: Keep `index.html` working as reference

## 📝 License

Same as original Space InZader project.

---

**Status**: Initial port complete, full feature parity in progress
**Last Updated**: 2024
**Maintainer**: Space InZader Team
