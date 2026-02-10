# Space InZader - Roadmap 🗺️

This document outlines planned features, improvements, and known issues for future development.

---

## 🎯 Version 1.0 - Current Release

### ✅ Completed Features
- [x] Core gameplay loop with auto-firing weapons
- [x] 18 weapons with 8 levels each
- [x] 77 passive abilities across all rarities
- [x] 6 playable ships with unique keystones
- [x] 13 enemy types including 4 boss variants
- [x] 9 synergy trees with tier-based bonuses
- [x] Wave-based progression system
- [x] XP and leveling mechanics
- [x] Meta-progression with Noyaux currency
- [x] Weather events (Black Holes, Storms)
- [x] Developer tools (F4/L overlay)
- [x] Save/load system with LocalStorage
- [x] Particle effects and visual polish
- [x] Audio system with Web Audio API

---

## 🚧 Version 1.1 - Polish & Balance (Next)

### High Priority
- [ ] **Balance Pass**
  - [ ] Review weapon damage scaling at high levels
  - [ ] Adjust enemy HP growth curve (late game too hard?)
  - [ ] Tune synergy drawbacks for better risk/reward
  - [ ] Balance "Canon de Verre" synergy (too risky?)
  - [ ] Review boss fight difficulty (especially Tank Boss)

- [ ] **Bug Fixes**
  - [ ] Fix black hole spawning on top of player
  - [ ] Improve meteor storm collision detection
  - [ ] Fix XP orb collection range edge cases
  - [ ] Resolve dash invincibility frame timing issues
  - [ ] Fix rare crash when spawning weather events

- [ ] **UI/UX Improvements**
  - [ ] Add damage numbers floating above enemies
  - [ ] Improve level-up screen readability
  - [ ] Add visual indicator for synergy activation
  - [ ] Show weapon evolution requirements in UI
  - [ ] Add tooltips for synergy drawbacks
  - [ ] Improve game over screen stats display

### Medium Priority
- [ ] **Quality of Life**
  - [ ] Add settings menu (volume, graphics quality)
  - [ ] Implement key remapping
  - [ ] Add colorblind mode options
  - [ ] Save last selected ship
  - [ ] Add "quick restart" button on game over
  - [ ] Implement pause screen improvements

- [ ] **Performance**
  - [ ] Optimize particle rendering at high enemy counts
  - [ ] Improve collision detection performance
  - [ ] Add graphics quality presets (low/medium/high)
  - [ ] Reduce memory usage for long runs (60+ minutes)

---

## 🎮 Version 1.2 - Content Expansion

### New Weapons (Target: +5 weapons)
- [ ] **Laser Anneau** - Ring-shaped laser that expands
- [ ] **Bouclier Rotatif** - Defensive orbital shield that damages
- [ ] **Nova Pulse** - Rhythmic shockwaves
- [ ] **Fusil de Précision** - Single-target high-damage sniper
- [ ] **Essaim de Nanobots** - Swarm of tiny projectiles

### New Passives (Target: +15 passives)
- [ ] **Rarity Tier**: More epic and legendary options
- [ ] **Build Enablers**: Support for new weapon combos
- [ ] **Defensive Options**: More survivability choices
- [ ] **Utility Passives**: Cooldown reduction, item rerolls

### New Enemies (Target: +5 enemy types)
- [ ] **Necromancer Enemy** - Revives nearby dead enemies
- [ ] **Splitter Boss** - Splits into smaller versions
- [ ] **Teleporter** - Blinks around the battlefield
- [ ] **Shield Bearer** - Absorbs damage for allies
- [ ] **Kamikaze Swarm** - Fast, weak, explosive

### New Weather Events (Target: +3 events)
- [ ] **Solar Flare** - Blinds player temporarily, damages over time
- [ ] **Gravity Well** - Reverse black hole (pushes away)
- [ ] **EMP Burst** - Disables weapons briefly

---

## 🌟 Version 1.3 - Advanced Features

### New Game Modes
- [ ] **Endless Mode** - No wave breaks, pure survival
- [ ] **Boss Rush** - Fight all bosses back-to-back
- [ ] **Challenge Runs** - Pre-set modifiers and restrictions
- [ ] **Daily Challenge** - Seeded run with leaderboard
- [ ] **New Game+** - Start with meta upgrades, harder enemies

### Achievements System
- [ ] **Achievement Framework** - Track player accomplishments
- [ ] **50+ Achievements** - Various difficulty levels
- [ ] **Achievement Rewards** - Unlock cosmetics or bonuses
- [ ] **Steam-like UI** - Percentage complete, rarity stats

### Leaderboards
- [ ] **Local Leaderboard** - Best runs per ship
- [ ] **Global Leaderboard** (Optional) - Online integration
- [ ] **Filters** - By ship, by mode, by difficulty
- [ ] **Replay System** (Stretch) - Watch top runs

### Meta-Progression Expansion
- [ ] **More Meta Upgrades** - Expand permanent upgrade tree
- [ ] **Prestige System** - Reset for bonus multipliers
- [ ] **Cosmetic Unlocks** - Ship skins, colors, effects
- [ ] **Milestone Rewards** - Unlock content at XP thresholds

---

## 🔧 Version 1.4 - Technical Improvements

### Architecture Refactors
- [ ] **Separate Game Loop** - Decouple rendering from logic
- [ ] **Worker Threads** - Offload AI calculations
- [ ] **Memory Management** - Improve object pooling
- [ ] **Code Splitting** - Lazy-load systems and data

### Developer Experience
- [ ] **Hot Reload** - Auto-refresh on file changes (dev mode)
- [ ] **Data Validation** - Catch errors in weapon/passive data
- [ ] **Unit Tests** - Cover critical systems (combat, AI, synergy)
- [ ] **CI/CD Pipeline** - Automated testing and deployment
- [ ] **Documentation** - JSDoc coverage for all systems

### Modding Support
- [ ] **JSON Data Files** - Extract data from JS to JSON
- [ ] **Mod Loader** - Load custom weapons/passives
- [ ] **API Documentation** - Guide for modders
- [ ] **Example Mods** - Sample weapon/passive/enemy

---

## 💡 Version 2.0 - Major Features (Long-term)

### Multiplayer (Stretch Goal)
- [ ] **Local Co-op** - Two players on same screen
- [ ] **Online Co-op** - WebRTC or WebSocket implementation
- [ ] **PvP Mode** - Fight other players
- [ ] **Shared Progress** - Co-op affects both players' meta

### Procedural Generation
- [ ] **Procedural Maps** - Random arena layouts
- [ ] **Procedural Weapons** - Randomized weapon stats
- [ ] **Procedural Enemies** - Combine enemy traits randomly
- [ ] **Seed System** - Reproduce specific runs

### Mobile Support
- [ ] **Touch Controls** - Virtual joystick and buttons
- [ ] **Responsive Layout** - Scale to mobile screens
- [ ] **Performance Tuning** - Optimize for mobile GPUs
- [ ] **PWA Support** - Install as mobile app

### Advanced Graphics
- [ ] **WebGL Renderer** - Hardware-accelerated 2D/3D
- [ ] **Shader Effects** - Screen-space effects (bloom, chromatic aberration)
- [ ] **3D Models** - Optional 3D ship models
- [ ] **Sprite Animation** - Frame-based animations

---

## 🐛 Known Issues

### High Priority Bugs
- [ ] Black holes occasionally spawn inside player hitbox
- [ ] Meteor storm hitboxes slightly misaligned
- [ ] XP collection can fail at exact edge of magnet range
- [ ] Dash invincibility frames don't work with certain attacks
- [ ] Game crashes if too many particles spawn simultaneously (>5000)

### Medium Priority Bugs
- [ ] DevTools search sometimes returns incorrect results
- [ ] Level-up screen can show duplicate options (rare)
- [ ] Audio can desync after extended gameplay (>1 hour)
- [ ] Save data corrupts if browser closes during save operation
- [ ] Keystone passives don't show in stats overlay

### Low Priority Bugs
- [ ] Particle effects clip through UI occasionally
- [ ] Enemy pathfinding struggles with corner cases
- [ ] Some weapon names overflow UI at certain resolutions
- [ ] Color transitions jitter at low frame rates

---

## 🎨 Art & Polish Wishlist

### Visual Improvements
- [ ] **Ship Sprites** - Custom sprite art for all 6 ships
- [ ] **Enemy Sprites** - Unique sprites for each enemy type
- [ ] **Background Variants** - Different space environments
- [ ] **UI Themes** - Multiple color schemes (neon, retro, minimal)
- [ ] **Animated Backgrounds** - Nebulae, planets, asteroids

### Audio Improvements
- [ ] **Music Tracks** - Dynamic background music system
- [ ] **More SFX** - Weapon-specific sounds
- [ ] **Ambient Sounds** - Space atmosphere, engine hum
- [ ] **Audio Feedback** - Hit markers, level-up stingers

### Animations
- [ ] **Ship Animations** - Thrust, hit reactions, death
- [ ] **Enemy Animations** - Attack telegraphs, death sequences
- [ ] **UI Animations** - Smooth transitions, button effects
- [ ] **Weather Animations** - Improved black hole vortex, meteors

---

## 📊 Analytics & Metrics (Optional)

### Player Data
- [ ] **Telemetry System** - Track gameplay metrics (opt-in)
- [ ] **Popular Builds** - Most common weapon/passive combos
- [ ] **Balance Data** - Win rates by ship, difficulty curves
- [ ] **Session Length** - Average playtime per run

### A/B Testing
- [ ] **Feature Flags** - Toggle features for testing
- [ ] **Variant Testing** - Test balance changes on subsets

---

## 🤝 Community Features

### Social
- [ ] **Share System** - Share builds with codes
- [ ] **Screenshot Tool** - Capture end-of-run stats
- [ ] **Discord Integration** - Rich presence, webhooks
- [ ] **Twitch Integration** - Overlay for streamers

### Content Creation
- [ ] **Replay Recording** - Save and watch runs
- [ ] **Build Guides** - In-game build templates
- [ ] **Wiki Integration** - Link to community wiki
- [ ] **Mod Browser** - Browse and download mods

---

## 📅 Timeline Estimates

| Version | Target Date | Status |
|---------|-------------|--------|
| v1.0 | ✅ Released | Complete |
| v1.1 | Q1 2026 | In Progress |
| v1.2 | Q2 2026 | Planned |
| v1.3 | Q3 2026 | Planned |
| v1.4 | Q4 2026 | Planned |
| v2.0 | 2027 | Vision |

*Dates are estimates and subject to change based on development priorities.*

---

## 💬 Feedback & Suggestions

Have ideas for the roadmap? We'd love to hear them!

- **GitHub Issues**: [Submit a feature request](https://github.com/Linkatplug/Space-InZader/issues/new)
- **Discussions**: [Join the conversation](https://github.com/Linkatplug/Space-InZader/discussions)

---

## 📝 Notes

### Philosophy
- **Player-First**: Features should enhance gameplay, not bloat it
- **No Pay-to-Win**: All content unlockable through gameplay
- **Performance Matters**: 60 FPS on modest hardware is a goal
- **Accessible**: Simple to learn, deep to master

### Development Principles
- **Iterative Development**: Release small, stable updates frequently
- **Community Feedback**: Listen to players and adapt roadmap
- **Open Source Spirit**: Encourage contributions and modding
- **Quality over Quantity**: Polish existing content before adding new

---

*This roadmap is a living document and will be updated as development progresses.*

**Last Updated**: February 2026
