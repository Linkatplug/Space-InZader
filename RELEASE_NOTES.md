# Space InZader v1.0.0 - Release Notes

**Release Date**: February 2026

## 🎮 Overview

Space InZader is a fully-featured roguelite space shooter built with vanilla JavaScript and HTML5 Canvas. Inspired by Space Invaders and Vampire Survivors, it offers deep gameplay with auto-firing weapons, progressive upgrades, and endless waves of enemies.

## ✨ Key Features

### Gameplay
- **Top-down 2D shooter** with 60 FPS rendering
- **Auto-targeting weapons** for smooth combat
- **Wave-based progression** with increasing difficulty
- **XP and leveling system** with upgrade choices
- **Roguelite structure** - every run is different

### Content Scale
- **18 Weapons** (8 standard + 10 advanced with evolutions)
- **77 Passive Abilities** (common → legendary)
- **6 Playable Ships** with unique keystones
- **13 Enemy Types** (9 standard + 4 bosses)
- **9 Synergy Trees** with tier-based bonuses
- **Weather Events** (black holes, storms)

### Progression
- **Per-Run**: XP → Levels → Weapon/Passive upgrades
- **Meta**: Noyaux currency → Permanent stat boosts
- **Unlocks**: New ships, weapons, and passives

### Technical
- **Pure Vanilla JavaScript** - No frameworks
- **No Build Process** - Open and play
- **Entity Component System** architecture
- **LocalStorage** save system
- **Developer Tools** (F4/L) for testing

## 📦 What's Included

```
Space-InZader/
├── index.html           # Main game file - OPEN THIS
├── README.md            # Complete documentation
├── ROADMAP.md           # Future plans
├── CONTRIBUTING.md      # Developer guide
├── LICENSE              # MIT License
├── RELEASE_CHECKLIST.md # Testing checklist
├── js/                  # All game code
│   ├── core/           # ECS & state management
│   ├── data/           # Weapons, passives, enemies
│   ├── systems/        # Game logic systems
│   ├── managers/       # Audio, save, score
│   ├── dev/            # Developer tools
│   └── utils/          # Helper functions
├── music/              # Background music files
├── test/               # Test HTML files
└── docs/               # Archived documentation
```

## 🚀 Quick Start

1. **Open `index.html`** in a modern browser
2. **Select a ship** (start with Tank for easier gameplay)
3. **Click START GAME**
4. **Move** with WASD, **Dash** with Spacebar
5. **Collect XP** (green orbs), **Choose upgrades** when leveling
6. **Press F4** to access developer tools

## 🎯 Game Loop

1. Spawn → Enemies appear in waves
2. Combat → Auto-fire weapons, collect XP
3. Level Up → Choose 1 of 3 upgrades
4. Survive → Waves get harder, rewards increase
5. Boss → Fight powerful bosses every 10 waves
6. Meta → Spend Noyaux on permanent upgrades

## 💡 Tips for New Players

- **Start with Tank ship** - Easiest for beginners (high HP)
- **Balance offense and defense** - Pure damage builds die fast
- **Watch for synergies** - Matching tags = powerful bonuses
- **Use dash wisely** - Invincibility frames save lives
- **Collect XP quickly** - Orbs disappear after 10 seconds
- **Read descriptions** - Understand what each upgrade does
- **Avoid black hole centers** - Instant death zone!

## 🛠️ Developer Features

### DevTools (F4/L)
- **Weapon Testing** - Give any weapon at any level
- **Passive Testing** - Apply any passive with stack control
- **Utility Commands** - God mode, spawn enemies, jump waves
- **Environment Control** - Spawn black holes and storms
- **Stats Display** - Real-time player statistics

### For Modders/Contributors
- **JSON-like data files** - Easy to add content
- **Well-documented code** - JSDoc comments throughout
- **No build process** - Edit and refresh
- **ContentAuditor** - Validates data integrity

## 🎨 Content Highlights

### Featured Ships
- **Vampire** - Lifesteal specialist (hard)
- **Gunner** - Fire rate focus (medium)
- **Tank** - Defense tank (easy)
- **Sniper** - Precision crits (hard)
- **Engineer** - Summon army (medium)
- **Berserker** - High risk/reward (hard)

### Top Weapons
- **Rayon Vampirique** - Continuous beam with lifesteal
- **Missiles Guidés** - Homing missiles with explosions
- **Arc Électrique** - Chain lightning between enemies
- **Tempête Ionique** (Evolution) - Massive chain storm

### Notable Passives
- **Phoenix** (Epic) - Revive on death once per run
- **Glass Cannon** - Massive damage, reduced defense
- **Blood Frenzy** (Keystone) - Stacking damage on hits

### Synergies
- **Vampirique** - +11% lifesteal at tier 3 (-25% max HP)
- **Explosif** - +60% explosion radius (+15% self-damage)
- **Canon de Verre** - +95% damage (+40% damage taken)

## �� Stats & Records

Track your performance:
- **High Score** per ship
- **Longest Run** (waves survived)
- **Total Noyaux** earned
- **Enemies Defeated** lifetime

## 🐛 Known Issues

- Black holes may occasionally spawn near player
- Meteor hitboxes slightly misaligned
- Audio can desync after 60+ minute sessions

See [ROADMAP.md](ROADMAP.md) for planned fixes.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to add weapons, passives, enemies
- Coding standards and style guide
- Testing procedures
- Pull request process

## 📄 License

MIT License - Free to use, modify, and distribute.
See [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [github.com/Linkatplug/Space-InZader](https://github.com/Linkatplug/Space-InZader)
- **Issues**: [Report bugs or request features](https://github.com/Linkatplug/Space-InZader/issues)
- **Roadmap**: [See planned features](ROADMAP.md)

## 🎮 Credits

**Design & Programming**: [Linkatplug](https://github.com/Linkatplug)

**Inspired By**:
- Space Invaders (1978) - Taito
- Vampire Survivors (2021) - Poncle
- Geometry Wars (2003) - Bizarre Creations

**Technology**:
- Vanilla JavaScript (ES6+)
- HTML5 Canvas 2D API
- Web Audio API

## 🌟 What's Next?

See [ROADMAP.md](ROADMAP.md) for upcoming features:
- **v1.1** - Balance pass and bug fixes
- **v1.2** - New weapons, passives, enemies
- **v1.3** - Game modes and achievements
- **v1.4** - Technical improvements
- **v2.0** - Multiplayer and procedural generation

---

## 🎯 Final Words

**Survive the waves. Upgrade your arsenal. Become the ultimate Space InZader!**

Thank you for playing! 🚀✨

---

*For questions, feedback, or bug reports, please open an issue on GitHub.*
