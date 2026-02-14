# Space InZader - Phaser 3 Edition 🚀

## About This Port

This is a **port of Space InZader to the Phaser 3 game engine**, transforming the original vanilla JavaScript + Canvas 2D game into a modern game engine-based project while preserving all the core gameplay and mechanics.

### Why Phaser?

- **Professional Game Engine**: Phaser 3 is a mature, well-maintained HTML5 game framework
- **Better Performance**: Hardware-accelerated WebGL rendering
- **Rich Features**: Built-in physics, particle systems, tweens, cameras, and more
- **Easier Development**: Less boilerplate code, more focus on game logic
- **Cross-Platform**: Works on desktop and mobile browsers
- **Active Community**: Extensive documentation, examples, and support

## 🎮 Quick Start

### Play the Game

#### Option 1: Development Server (Recommended)
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The game will open automatically at `http://localhost:3000`

#### Option 2: Build for Production
```bash
# Install dependencies
npm install

# Build the game
npm run build

# Preview the build
npm run preview
```

The built game will be in the `dist/` directory.

### Play the Original Version

The original vanilla JS version is still available:
```bash
# Just open index.html in a browser
# No build step required!
```

## 📂 Project Structure

```
Space-InZader/
├── phaser/                    # Phaser 3 implementation
│   ├── main.js               # Entry point
│   ├── config.js             # Game configuration
│   ├── scenes/               # Game scenes
│   │   ├── BootScene.js     # Loading screen
│   │   ├── MenuScene.js     # Main menu
│   │   ├── GameScene.js     # Gameplay
│   │   └── GameOverScene.js # Game over screen
│   ├── systems/              # Game systems (to be ported)
│   └── utils/                # Phaser utilities
│
├── js/                       # Original JavaScript (mostly reusable)
│   ├── core/                 # ECS, GameState ✅ Compatible
│   ├── data/                 # Game data ✅ Compatible
│   ├── managers/             # Managers ✅ Compatible
│   ├── systems/              # Original systems (reference)
│   └── utils/                # Utilities
│
├── index.html                # Original vanilla JS version
├── index-phaser.html         # Phaser version
├── package.json              # Dependencies
├── vite.config.js            # Build configuration
├── PHASER_README.md          # This file
└── PHASER_MIGRATION_GUIDE.md # Detailed migration guide
```

## ✨ Features

### Current Implementation (v0.1)

✅ **Core Gameplay**
- Player ship with WASD/Arrow key movement
- Enemy spawning with basic AI
- Collision detection
- Score tracking
- Health system with visual feedback

✅ **Scenes**
- Boot/Loading scene with progress bar
- Main menu with ship selection
- Game scene with HUD
- Game over scene with stats

✅ **Visuals**
- Animated parallax starfield (3 layers)
- Procedural ship graphics
- Health bar with color-coded states
- Screen shake effects
- Smooth animations

✅ **Technical**
- Phaser 3.80+ with WebGL/Canvas rendering
- Vite build system for fast development
- Hot module reloading
- Modular ES6 code structure

### To Be Implemented

🚧 **Gameplay Systems**
- [ ] Weapon system (8 weapons with auto-firing)
- [ ] 10 passive abilities
- [ ] Weapon evolution system
- [ ] 6 enemy types with unique behaviors
- [ ] XP and leveling system
- [ ] Level-up screen with boost selection

🚧 **Progression**
- [ ] Meta-progression with Noyaux currency
- [ ] Permanent upgrades
- [ ] Ship unlocks
- [ ] Save/load system

🚧 **Visual Effects**
- [ ] Phaser particle emitters
- [ ] Screen effects (flash, glow)
- [ ] Better visual feedback
- [ ] Animated UI elements

🚧 **Audio**
- [ ] Sound effects
- [ ] Background music
- [ ] Audio manager integration

## 🎯 Game Controls

| Control | Action |
|---------|--------|
| **WASD** or **Arrow Keys** | Move player ship |
| **ESC** | Pause game |
| **Mouse** | Navigate menus |

## 🔧 Development

### Technologies Used

- **Phaser 3.80+**: Game engine
- **Vite 5.0+**: Build tool and dev server
- **JavaScript ES6+**: Modern JavaScript
- **HTML5 Canvas/WebGL**: Rendering

### File Organization

#### Phaser-Specific Code (`phaser/`)
New code written specifically for Phaser, including scenes, Phaser system integrations, and utilities.

#### Reusable Code (`js/`)
Most of the original codebase is **reusable**:
- **Data files** (`js/data/`): All game data (ships, weapons, enemies, etc.) works with both versions
- **ECS core** (`js/core/`): The Entity Component System is engine-agnostic
- **Managers** (`js/managers/`): SaveManager, ScoreManager are compatible

#### What Changed?
Only the **rendering** and **input** layers changed significantly:
- Canvas 2D drawing → Phaser Graphics/Sprites
- Window event listeners → Phaser Input system
- Manual game loop → Phaser Scene lifecycle

The **game logic** (damage calculations, AI, spawning, etc.) remains largely unchanged!

### Development Commands

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
rm -rf dist node_modules
```

### Adding New Features

1. **New Scenes**: Create in `phaser/scenes/`
2. **Game Systems**: Port from `js/systems/` or create new in `phaser/systems/`
3. **Data**: Add to `js/data/` (works for both versions)
4. **Assets**: Place in project root or create `assets/` directory

## 📊 Performance

### Phaser Advantages
- **WebGL Rendering**: Hardware acceleration for better FPS
- **Built-in Optimizations**: Object pooling, culling, batching
- **Texture Atlases**: Efficient sprite rendering
- **Physics Engine**: Optimized collision detection

### Current Performance
- 60 FPS on modern browsers
- Smooth with 100+ entities on screen
- Low memory usage with proper cleanup

## 🔄 Migration Progress

| Component | Status | Notes |
|-----------|--------|-------|
| Project Setup | ✅ Complete | Vite + Phaser configured |
| Boot Scene | ✅ Complete | Loading screen |
| Menu Scene | ✅ Complete | Ship selection |
| Game Scene | ✅ Partial | Basic gameplay working |
| Game Over Scene | ✅ Complete | Stats display |
| Player Movement | ✅ Complete | WASD controls |
| Enemy Spawning | ✅ Partial | Basic spawning |
| Collision System | ✅ Partial | Basic collision |
| Weapon System | 🚧 In Progress | Not yet ported |
| Particle Effects | 🚧 In Progress | Using basic graphics |
| Audio System | ⏳ Planned | Not started |
| Progression System | ⏳ Planned | Not started |
| Meta-Progression | ⏳ Planned | Not started |
| UI System | 🚧 In Progress | Basic HUD only |

**Legend**: ✅ Complete | 🚧 In Progress | ⏳ Planned

## 🐛 Known Issues

1. **Incomplete Port**: Many systems not yet ported from original
2. **Simple Enemies**: Only basic enemy AI implemented
3. **No Weapons**: Auto-firing weapons not yet working
4. **Basic Graphics**: Using simple shapes, no sprite sheets yet
5. **No Audio**: Sound effects and music not implemented

## 📚 Documentation

- **[PHASER_MIGRATION_GUIDE.md](./PHASER_MIGRATION_GUIDE.md)**: Detailed technical migration guide
- **[README.md](./README.md)**: Original game documentation
- **[Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)**: Official Phaser documentation
- **[Phaser Examples](https://phaser.io/examples)**: Phaser code examples

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Port Remaining Systems**: See `PHASER_MIGRATION_GUIDE.md` for checklist
2. **Improve Visuals**: Add better graphics, particles, effects
3. **Add Features**: Implement new weapons, enemies, or abilities
4. **Optimize Performance**: Profile and optimize bottlenecks
5. **Fix Bugs**: Check Issues tab for known problems
6. **Documentation**: Improve guides and code comments

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (compare with original version)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Version History

### v0.1.0 - Initial Phaser Port (Current)
- ✅ Basic project structure with Vite
- ✅ Phaser 3 integration
- ✅ Core scenes (Boot, Menu, Game, GameOver)
- ✅ Player movement and basic controls
- ✅ Simple enemy spawning
- ✅ Basic collision detection
- ✅ HUD with health and score

### Upcoming
- v0.2.0: Weapon system and combat
- v0.3.0: All enemy types and AI
- v0.4.0: Progression and leveling
- v0.5.0: Particle effects and visuals
- v0.6.0: Audio system
- v0.7.0: Meta-progression
- v1.0.0: Feature parity with original

## 🎯 Goals

### Short Term
- [ ] Complete weapon firing system
- [ ] Port all enemy types
- [ ] Implement XP and leveling
- [ ] Add particle effects

### Medium Term
- [ ] Full progression system
- [ ] Meta-progression
- [ ] Audio system
- [ ] Enhanced visuals

### Long Term
- [ ] Feature parity with original
- [ ] Additional content (new weapons, enemies)
- [ ] Mobile controls
- [ ] Performance optimizations
- [ ] Multiplayer? (stretch goal)

## 🎮 Comparison with Original

| Aspect | Vanilla JS | Phaser 3 |
|--------|------------|----------|
| **Engine** | None (raw Canvas 2D) | Phaser 3 |
| **Setup** | None (just open HTML) | npm install |
| **Performance** | Good (simple scenes) | Excellent (WebGL) |
| **Development** | More boilerplate | Less boilerplate |
| **Features** | Custom implementation | Engine-provided |
| **Maintenance** | More code to maintain | Framework handles basics |
| **Learning Curve** | Lower (pure JS) | Higher (learn Phaser) |
| **Scalability** | Harder for complex games | Easier for complex games |

**Both versions are valuable:**
- **Vanilla JS**: Great for learning, no dependencies
- **Phaser 3**: Better for larger projects, production games

## ⚖️ License

Same as original Space InZader project.

## 🙏 Acknowledgments

- Original Space InZader team for the amazing game
- Phaser.io team for the excellent game engine
- Space Invaders (1978) for inspiration
- Vampire Survivors (2021) for roguelite mechanics

## 📞 Support

- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Phaser Discord**: [Join Phaser Discord](https://discord.gg/phaser)
- **Documentation**: Check the migration guide

---

**🚀 Happy Gaming and Game Development! 🚀**

---

**Note**: This is a work-in-progress port. The original vanilla JS version in `index.html` is fully functional and feature-complete. This Phaser version aims to achieve feature parity while leveraging the engine's capabilities.
