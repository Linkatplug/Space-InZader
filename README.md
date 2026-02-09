# Space InZader 🚀

A fully playable **roguelite space shooter** web game inspired by Space Invaders and Vampire Survivors. Built with vanilla JavaScript and HTML5 Canvas.

![Menu Screenshot](https://github.com/user-attachments/assets/f5370b5d-ecba-4307-8fa3-eebbc7d24cf3)

## 🎮 Features

### Core Gameplay
- **Top-down 2D shooter** rendered at 60 FPS on HTML5 Canvas
- **Auto-firing weapons** that target the closest enemy
- **WASD/ZQSD movement** with smooth, responsive controls
- **Progressive enemy waves** with exponential difficulty scaling
- **6 enemy types**: Drone, Chasseur, Tank, Tireur, Elite, Boss

### Progression System (Per-Run)
- **XP collection** from defeated enemies
- **Level-up system** with pause screen on each level gain
- **Boost selection**: Choose 1 of 3 random upgrades with rarity weighting
- **8 unique weapons** with independent leveling (max level 8)
- **10 passive abilities** that modify gameplay stats
- **Weapon evolution system**: Combine max-level weapons with specific passives

### Meta-Progression (Persistent)
- **Noyaux currency** earned each run based on performance
- **Permanent upgrade tree**: Increase health, damage, XP bonus
- **4 playable ships** with unique stats and starting weapons
- **Unlock system** for weapons, passives, and ships
- **LocalStorage persistence** for save data

### Visual & Audio
- **Neon sci-fi aesthetic** with glowing effects
- **Animated starfield background** with parallax layers
- **Particle effects** for explosions, impacts, level-ups
- **Rarity color coding**: Common (gray), Rare (blue), Epic (purple), Legendary (gold)
- **Web Audio API sound effects**

## 🚀 How to Play

1. **Open `index.html`** in a modern web browser
2. **Select a ship** from the four available options
3. **Click START GAME** to begin
4. **Move** with WASD or ZQSD keys
5. **Weapons auto-fire** at the nearest enemy
6. **Collect green XP orbs** to level up
7. **Choose upgrades** when you level up
8. **Survive** as long as possible!

### Controls
- **WASD** or **ZQSD** - Move player
- **ESC** - Pause game
- **Mouse** - Menu navigation

## 🛠️ Technical Architecture

Built entirely with vanilla JavaScript - no frameworks or build process required!

### Technology Stack
- Vanilla JavaScript (ES6+)
- HTML5 Canvas 2D
- Web Audio API
- LocalStorage

### ECS Architecture
Entity Component System for clean, modular code with dedicated systems for movement, combat, AI, collision, spawning, particles, rendering, and UI.

## 📊 Game Content

### 8 Weapons
Laser Frontal • Mitraille • Missiles Guidés • Orbes Orbitaux • Rayon Vampirique • Mines • Arc Électrique • Tourelle Drone

### 10 Passive Abilities  
Surchauffe • Radiateur • Sang Froid • Coeur Noir • Bobines Tesla • Focaliseur • Mag-Tractor • Plating • Réacteur • Chance

### 4 Weapon Evolutions
Combine max-level weapons with specific passives for powerful upgrades!

## 🎨 Credits

Inspired by Space Invaders (1978), Vampire Survivors (2021), and Geometry Wars.

---

**Enjoy the game! 🚀**
