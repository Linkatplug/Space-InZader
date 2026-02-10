# Space InZader 🚀

**A fully-featured roguelite space shooter** inspired by Space Invaders and Vampire Survivors. Built entirely with vanilla JavaScript and HTML5 Canvas - no frameworks, no build process required!

![Menu Screenshot](https://github.com/user-attachments/assets/f5370b5d-ecba-4307-8fa3-eebbc7d24cf3)

---

## 📖 Table of Contents

- [Features](#-features)
- [How to Play](#-how-to-play)
- [Game Content](#-game-content)
- [Game Mechanics](#-game-mechanics)
- [Developer Tools](#️-developer-tools)
- [Technical Architecture](#️-technical-architecture)
- [Installation](#-installation)
- [Credits](#-credits)

---

## ✨ Features

### Core Gameplay
- **Top-down 2D shooter** with smooth 60 FPS rendering on HTML5 Canvas
- **Auto-firing weapons** that intelligently target the closest enemy
- **Responsive controls**: WASD/ZQSD movement + Spacebar dash ability
- **Dynamic enemy waves** with exponential difficulty scaling over time
- **13 enemy types** including drones, tanks, snipers, elites, and 4 boss variants
- **Weather events**: Black holes, meteor storms, and magnetic interference

### Progression Systems

#### Per-Run Progression
- **XP-based leveling** with exponential scaling (level 1: 100 XP → level 2: 150 XP...)
- **Level-up screen** with choice of 3 random upgrades weighted by rarity
- **18 unique weapons** with 8 levels each and evolution mechanics
- **77 passive abilities** that modify stats and gameplay
- **Weapon evolution system**: Max-level weapons + specific passives = ultimate weapons
- **Synergy system**: 9 synergy trees with tier-based bonuses

#### Meta-Progression (Persistent)
- **Noyaux currency** earned from runs based on performance
- **Permanent upgrade tree**: Boost health, damage, XP gain forever
- **6 playable ships** with unique stats, weapons, and exclusive keystones
- **Unlock system** for weapons, passives, and ships
- **LocalStorage persistence** - your progress is saved automatically

### Visual & Audio
- **Neon sci-fi aesthetic** with glowing particle effects
- **Animated starfield background** with parallax scrolling
- **Particle systems** for explosions, impacts, level-ups, and weather
- **Rarity color coding**:
  - Common: Gray (#888)
  - Uncommon: Green (#32CD32)
  - Rare: Blue (#4169E1)
  - Epic: Purple (#9370DB)
  - Legendary: Gold (#FFD700)
- **Web Audio API** for dynamic sound effects

---

## 🎮 How to Play

### Quick Start
1. **Open `index.html`** in a modern web browser (Chrome, Firefox, Edge recommended)
2. **Select a ship** from the six available options
3. **Click START GAME** to begin your run
4. **Move** with WASD or ZQSD keys
5. **Dash** with Spacebar (2.5s cooldown)
6. **Collect green XP orbs** dropped by defeated enemies
7. **Level up** and choose 1 of 3 upgrades (weapons or passives)
8. **Survive** as long as possible against endless waves!

### Controls
| Key | Action |
|-----|--------|
| **W/Z** | Move Up |
| **A/Q** | Move Left |
| **S** | Move Down |
| **D** | Move Right |
| **Spacebar** | Dash (invincibility frames) |
| **ESC** | Pause Game |
| **F4 / L** | Toggle Developer Tools |
| **Mouse** | Menu Navigation & Upgrade Selection |

### Gameplay Tips
- **Prioritize survivability** in early waves - max HP and armor help
- **Balance offense and defense** - glass cannon builds are risky
- **Watch for synergies** - items with matching tags grant powerful bonuses
- **Use dash wisely** - invincibility frames can save you from instant death
- **Collect XP quickly** - green orbs disappear after 10 seconds
- **Avoid black hole centers** - the vortex pulls you in for instant death
- **Plan weapon evolutions** - max level weapon + specific passive = ultimate power

---

## 🎯 Game Content

### 18 Weapons

#### Standard Weapons (8)
| Weapon | Type | Rarity | Description |
|--------|------|--------|-------------|
| **Laser Frontal** | Direct | Common | High fire rate piercing shots (2.0/s) |
| **Mitraille** | Spread | Common | Shotgun cone, excellent vs swarms (4.0/s) |
| **Missiles Guidés** | Homing | Uncommon | Seeking missiles with AoE explosions |
| **Orbes Orbitaux** | Orbital | Uncommon | Rotating energy spheres dealing contact damage |
| **Rayon Vampirique** | Beam | Rare | Continuous beam with lifesteal (20.0/s) |
| **Mines** | Trap | Uncommon | Placed explosives triggered by enemies |
| **Arc Électrique** | Chain | Rare | Lightning that chains between enemies |
| **Tourelle Drone** | Summon | Rare | Deploys autonomous attack drones |

#### Advanced Weapons (10)
| Weapon | Type | Rarity | Special Mechanics |
|--------|------|--------|-------------------|
| **Railgun** | Piercing | Rare | Infinite pierce, +100% heat, -40% fire rate |
| **Lance-Flammes** | Cone | Uncommon | Cone of fire, disables crits, +200% heat |
| **Canon Gravitationnel** | Utility | Rare | Gravity orbs pull enemies (and player!) |
| **Tourelle Autonome** | Turret | Uncommon | Stationary turret (max 1) |
| **Lames Fantômes** | Orbital | Rare | Ethereal blades, -40% boss damage |
| **Drone Kamikaze** | Summon | Rare | Suicide drones, deals 20% self-damage |
| **Rayon Plasma Continu** | Evolution | Epic | Laser upgrade: wider continuous beam |
| **Salves Multi-Verrouillage** | Evolution | Epic | Missile upgrade: 8x homing salvo |
| **Couronne Gravitationnelle** | Evolution | Epic | Orbes upgrade: gravity field around orbs |
| **Tempête Ionique** | Evolution | Legendary | Arc upgrade: massive chain storm |

**Weapon Evolution**: Upgrade a weapon to max level (8) and pick up its required passive to transform it into an ultimate weapon!

### 77 Passive Abilities

Passives are categorized by rarity and provide stackable stat bonuses:

#### Common (8 passives)
- Basic stat boosts: +15% damage, +12% fire rate, +20 HP, +10% speed
- Simple mechanics, safe choices for beginners

#### Uncommon (12 passives)
- Combo mechanics: Piercing shots, ricochet bullets, small explosions on kill
- Shields, armor, and basic defensive options
- Enhanced projectile behavior

#### Rare (18 passives)
- Powerful synergies: Lifesteal, critical hits, execution damage
- Advanced mechanics: Fury stacks, predator bonus, lightning chains
- Risk/reward builds: Berserker (+dmg at low HP), Glass Cannon (+dmg, -defense)

#### Epic (12 passives)
- Game-changing abilities: Phoenix (revive on death), Time Dilation (slow on hit)
- Massive stat transformations: Unstable Reactor (+50% dmg, explosive on death)
- Complex build enablers: Orbital Arsenal, Storm Caller, Necromancer

#### Legendary Keystones (6 passives - Ship Exclusive)
Each ship has a unique keystone passive:
- **Blood Frenzy** (Vampire): +0.25% damage per hit, max 40 stacks
- **Overclock Core** (Gunner): +35% damage per fire rate bonus
- **Fortress Mode** (Tank): -50% damage taken when stationary 700ms+
- **Dead Eye** (Sniper): Stacking crit bonus on consecutive hits
- **Machine Network** (Engineer): Summons coordinate attacks
- **Rage Engine** (Berserker): +60% damage when below 50% HP

### 9 Synergy Trees

Synergies activate when you have 2, 4, or 6 items with matching tags:

| Synergy | Tags | Tier 1 (2) | Tier 2 (4) | Tier 3 (6) | Drawback |
|---------|------|-----------|-----------|-----------|----------|
| **Vampirique** | vampire, on_hit, on_kill | +3% Lifesteal | Heal 15% on elite kill | +8% Lifesteal | -25% Max HP |
| **Critique** | crit | +15% Crit Damage | Crits cause explosions | +30% Crit Damage | -10% Crit Chance |
| **Explosif** | explosive, aoe | +20% Explosion Radius | Explosions chain 2x | +40% Explosion Radius | 15% Self-damage |
| **Chaleur** | heat, fire_rate | +25% Cooling Rate | Damage ramps up +35% | +50% Cooling Rate | Permanent heat buildup |
| **Mobilité** | dash, speed | -20% Dash Cooldown | 250ms invuln on dash | -40% Dash Cooldown | -15% Movement Speed |
| **Invocation** | summon, turret | +1 Max Summon | Summons inherit 25% stats | +2 Max Summons | -20% Personal Damage |
| **Canon de Verre** | glass_cannon, risk | +15% Damage | +30% Damage | +50% Damage | +20-40% Damage Taken |
| **Utilitaire** | utility, control, support | +15% Range | +25% Magnet Radius | +30% Range | -10% Damage |
| **Prédateur** | on_kill, xp | +10% XP | +15% Damage vs low HP | +20% XP | -10% Max HP |

### 6 Playable Ships

| Ship | Starting Weapon | Keystone | Playstyle | Difficulty |
|------|----------------|----------|-----------|------------|
| **Vampire** | Rayon Vampirique | Blood Frenzy | Lifesteal & crits | Hard |
| **Gunner** | Mitraille | Overclock Core | Fire rate specialist | Medium |
| **Tank** | Orbes Orbitaux | Fortress Mode | Defense tank | Easy |
| **Sniper** | Laser Frontal | Dead Eye | Precision crits | Hard |
| **Engineer** | Tourelle Drone | Machine Network | Summon army | Medium |
| **Berserker** | Laser Frontal | Rage Engine | High risk/reward | Hard |

### 13 Enemy Types

#### Standard Enemies
- **Drone Basique** (30 HP) - Basic chase AI
- **Chasseur Rapide** (18 HP, 180 speed) - Fast zigzag patterns
- **Tank** (120 HP, 5 armor) - Slow but heavily armored
- **Tireur** (35 HP) - Ranged kiter, shoots back
- **Elite** (220 HP) - Splits into 2 drones on death
- **Tourelle** (60 HP) - Stationary auto-turret
- **Drone Explosif** (15 HP) - Explodes on death (80px radius)
- **Tireur Lourd** (45 HP) - Heavy sniper with long range
- **Démon de Vitesse** (8 HP, 250 speed) - Extremely fast glass cannon

#### Bosses (Spawn every 10 waves)
- **Boss Standard** (1500 HP) - Complex multi-phase AI, splits into 5 elites
- **Tank Boss** (2500 HP) - Massive melee threat with 50px hitbox
- **Swarm Boss** (800 HP) - Spawns 15 fast hunters on death
- **Sniper Boss** (1200 HP) - Long-range artillery, spawns 6 shooters on death

---

## ⚙️ Game Mechanics

### Wave System
- **Duration**: 45 seconds per wave + 2-second break
- **Enemy Budget**: Dynamic scaling based on game time
- **Difficulty Scaling**: Enemy stats increase by 30% every 5 minutes
- **Elite Spawning**: Every 5 waves (waves 5, 10, 15...)
- **Boss Spawning**: Every 10 waves (waves 10, 20, 30...)
- **Soft Caps**: Enemy count max 3.5x, enemy HP max 6.0x

### Combat System
- **Damage Types**: Physical, explosive, electric, beam
- **Critical Hits**: Base 5% chance, 1.5x multiplier (modifiable)
- **Lifesteal**: Heal for % of damage dealt
- **Armor**: Flat damage reduction per hit
- **Piercing**: Shots pass through multiple enemies
- **Chain/Bounce**: Projectiles jump between targets

### Overheat System
- All weapons generate heat when firing
- Overheat = reduced fire rate or weapon lockout
- Cooling passives reduce heat generation
- **Railgun**: 2.0x heat generation
- **Lance-Flammes**: 3.0x heat generation
- Heat Synergy grants damage ramp-up

### Weather Events
Random environmental hazards that spawn during runs:

#### Black Holes
- **Warning Phase**: 4 seconds with visual indicator
- **Active Duration**: 12 seconds
- **Vortex Effect**: Gradually pulls player and enemies toward center
- **Death Zone**: Instant kill in center radius
- **Audio Cue**: Warning sound on spawn

#### Meteor Storms
- Random meteor impacts across the battlefield
- Deals area damage on impact
- Visual falling animation with impact circles

#### Magnetic Storms
- Electric interference effects
- Reduces weapon accuracy or fire rate temporarily

### XP & Leveling
- **Base XP to Level**: 100 XP
- **Scaling Factor**: 1.5x per level (level 5 requires 506 XP total)
- **XP Orbs**: Dropped by all enemies, last 10 seconds
- **Magnet Range**: Auto-collect within range (base 100px, increasable)
- **Upgrade Screen**: Pause game, choose 1 of 3 options weighted by rarity

---

## 🛠️ Developer Tools

Press **F4** or **L** to toggle the developer overlay during gameplay!

### Features

#### Weapon Testing Tab
- **Browse All 18 Weapons** - View stats, fire rate, damage, rarity
- **Give Any Weapon** - Instantly add at any level (0-8)
- **Search/Filter** - Find weapons by name quickly
- **Test Mechanics** - Verify weapon behavior in real-time

#### Passive Testing Tab
- **Browse All 77 Passives** - Organized by rarity
- **View Effects** - See exact stat modifications
- **Instant Application** - Add passives with custom stack counts
- **Synergy Preview** - See which tags activate synergies

#### Utility Commands
- **God Mode** - Toggle invincibility (no damage taken)
- **Spawn Dummy** - Create test enemy for target practice
- **Wave Jump** - Skip to any wave number (1-999)
- **Add Health** - Set health to 9999 for testing
- **Add XP** - Grant 1000 XP instantly
- **Clear Inventory** - Remove all weapons & passives
- **Reset Run** - Start fresh without reloading page

#### Environment Spawning
- **Spawn Black Hole** - Test vortex mechanics and death zone
- **Spawn Meteor Storm** - Verify meteor collision and damage
- **Spawn Magnetic Storm** - Test interference effects

#### Stats Display
- Real-time overlay showing:
  - Current player stats (HP, damage, fire rate, etc.)
  - Active weapons and levels
  - Active passives and stacks
  - Synergy tier information
  - Current wave number

### Usage Notes
- DevTools work in-game only (not on menus)
- Changes persist until run ends or reset
- Safe to use - won't corrupt save data
- Press **F4** or **L** again to close

---

## 🏗️ Technical Architecture

### Technology Stack
- **Vanilla JavaScript (ES6+)** - No frameworks, no transpiling
- **HTML5 Canvas 2D** - Hardware-accelerated rendering
- **Web Audio API** - Dynamic sound effects
- **LocalStorage** - Save data persistence
- **No build process** - Open `index.html` and play!

### Entity Component System (ECS)

Clean, modular architecture with dedicated systems:

#### Systems (`js/systems/`)
- **MovementSystem** - Physics, collision, player controls
- **CombatSystem** - Damage calculation, crits, lifesteal
- **AISystem** - Enemy behaviors (9 AI types)
- **SpawnerSystem** - Enemy wave spawning with budget system
- **WaveSystem** - Wave progression and difficulty scaling
- **WeatherSystem** - Black holes, storms, environmental hazards
- **CollisionSystem** - Entity collision detection (spatial hashing)
- **ParticleSystem** - Explosions, impacts, visual effects
- **PickupSystem** - XP orb collection and magnet mechanics
- **RenderSystem** - Canvas drawing and visual effects
- **UISystem** - HUD, menus, level-up screens
- **SynergySystem** - Tag-based synergy calculation

#### Data Definitions (`js/data/`)
- **WeaponData.js** - All 18 weapons with 8 levels each
- **PassiveData.js** - All 77 passives with effects
- **EnemyData.js** - All 13 enemy types with AI configs
- **ShipData.js** - All 6 ships with unique stats
- **KeystoneData.js** - 6 ship-exclusive epic passives
- **SynergyData.js** - 9 synergy trees with tier bonuses

#### Core (`js/core/`)
- **ECS.js** - Entity Component System implementation
- **GameState.js** - Game state machine (menu, playing, paused, gameover)

#### Managers (`js/managers/`)
- **AudioManager** - Sound effect playback
- **SaveManager** - LocalStorage save/load
- **ScoreManager** - High score tracking

#### Utilities (`js/utils/`)
- **Logger** - Debug logging
- **DebugOverlay** - Performance metrics
- **ScreenEffects** - Screen shake, flash effects
- **Math** - Vector math, collision helpers

#### Development (`js/dev/`)
- **DevTools** - F4/L developer overlay
- **ContentAuditor** - Data validation and testing

### Project Structure
```
Space-InZader/
├── index.html           # Main game file
├── debug.html           # Debug testing page
├── README.md            # This file
├── ROADMAP.md           # Future plans
├── js/
│   ├── main.js          # Entry point
│   ├── Game.js          # Game coordinator
│   ├── constants.js     # Global constants
│   ├── core/            # ECS & state management
│   ├── data/            # Game content definitions
│   ├── systems/         # ECS systems
│   ├── managers/        # Managers (audio, save, score)
│   ├── dev/             # Developer tools
│   └── utils/           # Utility functions
└── music/               # Audio files (if any)
```

### Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `BASE_XP_TO_LEVEL` | 100 | Initial XP requirement |
| `XP_SCALING_FACTOR` | 1.5 | XP multiplier per level |
| `WAVE_DURATION` | 45s | Seconds per wave |
| `ELITE_SPAWN_INTERVAL` | 5 waves | Elite enemy spawning |
| `BOSS_SPAWN_INTERVAL` | 10 waves | Boss spawning |
| `DIFFICULTY_SCALING` | 30% every 5min | Enemy stat increases |

---

## 📦 Installation

### For Players
1. **Download** or clone this repository
2. **Open `index.html`** in a modern web browser
3. **Start playing!** No installation needed

### For Developers
1. **Clone the repository**
   ```bash
   git clone https://github.com/Linkatplug/Space-InZader.git
   cd Space-InZader
   ```

2. **Open in your code editor**
   ```bash
   code .  # VS Code
   ```

3. **Serve locally** (optional, for testing)
   ```bash
   python -m http.server 8000
   # Or use Live Server extension in VS Code
   ```

4. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Or open `index.html` directly

5. **Start developing!**
   - Edit files in `js/` directory
   - Refresh browser to see changes
   - Press F4 to access DevTools
   - Check console for logs

### Browser Compatibility
- ✅ **Chrome/Edge** 90+ (Recommended)
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ❌ Internet Explorer (not supported)

### System Requirements
- **CPU**: Any modern processor
- **RAM**: 2GB minimum
- **GPU**: Hardware acceleration recommended for smooth 60 FPS
- **Display**: 1280x720 minimum resolution

---

## 🎨 Credits

### Inspiration
- **Space Invaders** (1978) - Taito - Classic arcade shooter
- **Vampire Survivors** (2021) - Poncle - Roguelite auto-shooter
- **Geometry Wars** (2003) - Bizarre Creations - Twin-stick shooter aesthetics

### Development
- **Game Design & Programming**: [Linkatplug](https://github.com/Linkatplug)
- **Built with**: Vanilla JavaScript, HTML5 Canvas, Web Audio API
- **No external frameworks or libraries used**

### Asset Credits
- **Graphics**: Custom rendered with Canvas 2D
- **Audio**: Web Audio API synthesized effects
- **Fonts**: Courier New (system font)

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **GitHub Repository**: [Linkatplug/Space-InZader](https://github.com/Linkatplug/Space-InZader)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/Linkatplug/Space-InZader/issues)
- **Roadmap**: See [ROADMAP.md](ROADMAP.md) for planned features

---

## 🎮 Enjoy the Game!

**Survive the waves. Upgrade your arsenal. Become the ultimate Space InZader!** 🚀✨

---

*Last updated: February 2026*
