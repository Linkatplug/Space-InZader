# 🚀 Phaser Port - Quick Start Guide

## Installation (5 minutes)

```bash
# 1. Install Node.js dependencies
npm install

# 2. Start development server
npm run dev

# 3. Browser opens automatically at:
#    http://localhost:3000
```

## What Works Now

✅ **Playable Game**:
- Move player with WASD/Arrow keys
- Enemies spawn and chase player
- Collisions damage player
- Health bar shows damage
- Score tracks kills
- Game over when health reaches 0
- Animated starfield background

✅ **Menu System**:
- Ship selection (4 ships)
- Visual ship cards with stats
- Start game button
- Responsive UI

✅ **Technical**:
- Hot module reload (edit code, see changes instantly)
- Phaser 3.80+ with WebGL rendering
- 60 FPS smooth gameplay
- ECS architecture maintained

## Project Structure

```
Space-InZader/
│
├── 🎮 PHASER VERSION (New)
│   ├── phaser/
│   │   ├── scenes/         # Game screens
│   │   ├── systems/        # Phaser integration
│   │   └── main.js         # Entry point
│   ├── index-phaser.html   # Run this!
│   ├── package.json
│   └── vite.config.js
│
├── 🕹️ ORIGINAL VERSION (Still works!)
│   ├── index.html          # Just open in browser
│   └── js/                 # All original code
│
└── 📚 DOCUMENTATION
    ├── PHASER_README.md              # Full user guide
    ├── PHASER_MIGRATION_GUIDE.md     # Migration checklist
    ├── PHASER_ARCHITECTURE.md        # Technical deep-dive
    ├── PHASER_IMPLEMENTATION_GUIDE.md # Developer guide
    ├── PHASER_PORT_SUMMARY.md        # This work summary
    └── PHASER_QUICK_START.md         # This file
```

## Controls

| Key | Action |
|-----|--------|
| **W** or **↑** | Move up |
| **A** or **←** | Move left |
| **S** or **↓** | Move down |
| **D** or **→** | Move right |
| **ESC** | Pause game |
| **Mouse** | Navigate menus |

## Development Commands

```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
rm -rf dist node_modules
```

## What's Next?

See the full roadmap in `PHASER_README.md`, but key next steps:

1. **Weapon System** - Auto-firing weapons (8 types)
2. **Enemy Types** - All 6 enemy behaviors  
3. **XP & Leveling** - Progression system
4. **Visual Polish** - Particle effects, animations
5. **Audio** - Sound effects and music

## Documentation

| File | Purpose |
|------|---------|
| `PHASER_QUICK_START.md` | ⚡ This file - get started fast |
| `PHASER_README.md` | 📖 Complete user guide |
| `PHASER_ARCHITECTURE.md` | 🏗️ Technical architecture |
| `PHASER_IMPLEMENTATION_GUIDE.md` | 💻 Developer guide |
| `PHASER_MIGRATION_GUIDE.md` | 🔄 Migration checklist |

## Troubleshooting

**Problem**: `npm install` fails  
**Solution**: Make sure Node.js 16+ is installed

**Problem**: Port 3000 already in use  
**Solution**: Edit `vite.config.js` to use different port

**Problem**: White screen / no game  
**Solution**: Check browser console for errors

**Problem**: Changes not showing  
**Solution**: Vite has hot reload, but try refreshing browser

## Compare Versions

| Version | How to Run | Setup |
|---------|------------|-------|
| **Original** | Open `index.html` | None needed |
| **Phaser** | `npm run dev` | `npm install` first |

Both versions are fully functional!

## Key Files to Explore

```javascript
phaser/
├── scenes/GameScene.js     ← Main gameplay logic
├── scenes/MenuScene.js     ← Ship selection
├── systems/PhaserECSBridge.js  ← ECS-Phaser sync
└── config.js               ← Phaser settings

js/data/
├── ShipData.js            ← Ship definitions
├── EnemyProfiles.js       ← Enemy types
└── WeaponDataBridge.js    ← Weapon definitions
```

## Contributing

1. Read `PHASER_IMPLEMENTATION_GUIDE.md`
2. Pick a system to port from checklist
3. Test thoroughly
4. Submit PR

## Questions?

- Check the documentation files
- Open an issue on GitHub
- See Phaser 3 docs: https://phaser.io/docs

---

**Status**: ✅ Foundation Complete  
**Version**: 0.1.0  
**Next**: System Implementation

🎮 **Have fun coding!**
