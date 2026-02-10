# Contributing to Space InZader 🚀

Thank you for your interest in contributing to Space InZader! This document provides guidelines and information for contributors.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Adding Content](#adding-content)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

---

## 📜 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior
- ✅ Be respectful and inclusive
- ✅ Provide constructive feedback
- ✅ Focus on what's best for the community
- ✅ Show empathy towards other contributors

### Unacceptable Behavior
- ❌ Harassment or discriminatory language
- ❌ Personal attacks or trolling
- ❌ Publishing others' private information
- ❌ Spam or off-topic discussions

---

## 🤝 How to Contribute

### Reporting Bugs
1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Provide details**: Steps to reproduce, expected vs actual behavior
4. **Include system info**: Browser, OS, game version

### Suggesting Features
1. **Check the roadmap** (`ROADMAP.md`) to see if it's already planned
2. **Use the feature request template** when creating an issue
3. **Explain the use case**: Why is this feature needed?
4. **Consider alternatives**: Have you thought of other solutions?

### Contributing Code
1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Test thoroughly** using DevTools (F4/L)
5. **Submit a pull request** with clear description

### Contributing Content
- **Weapons**: Add new weapon types with balanced stats
- **Passives**: Create interesting passive abilities
- **Enemies**: Design challenging enemy behaviors
- **Ships**: Propose new ship archetypes with unique keystones
- **Synergies**: Suggest new synergy combinations

---

## 🛠️ Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- Code editor (VS Code recommended)
- Git
- Basic knowledge of JavaScript, HTML5 Canvas

### Getting Started
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Space-InZader.git
cd Space-InZader

# Open in your editor
code .

# Serve locally (optional)
python -m http.server 8000
# Or use VS Code Live Server extension
```

### Running the Game
- Open `index.html` in your browser
- Or navigate to `http://localhost:8000` if using local server
- Press **F4** or **L** to open DevTools

### Development Tools
- **F4/L**: Toggle developer overlay
- **Browser DevConsole** (F12): View console logs
- **debug.html**: Minimal testing environment

---

## 📁 Project Structure

```
js/
├── main.js              # Entry point, initializes Game
├── Game.js              # Game coordinator, manages systems
├── constants.js         # Global constants (balance values)
│
├── core/
│   ├── ECS.js          # Entity Component System implementation
│   └── GameState.js    # State machine (menu, playing, paused, etc.)
│
├── data/               # Game content definitions (ADD CONTENT HERE)
│   ├── WeaponData.js   # Weapon definitions and levels
│   ├── PassiveData.js  # Passive ability definitions
│   ├── EnemyData.js    # Enemy types and AI configs
│   ├── ShipData.js     # Ship stats and starting loadouts
│   ├── KeystoneData.js # Ship-exclusive epic passives
│   └── SynergyData.js  # Synergy trees and bonuses
│
├── systems/            # ECS systems (game logic)
│   ├── CombatSystem.js      # Damage, crits, lifesteal
│   ├── MovementSystem.js    # Physics, player controls
│   ├── AISystem.js          # Enemy AI behaviors
│   ├── SpawnerSystem.js     # Enemy spawning logic
│   ├── WaveSystem.js        # Wave progression
│   ├── WeatherSystem.js     # Environmental hazards
│   ├── CollisionSystem.js   # Collision detection
│   ├── ParticleSystem.js    # Visual effects
│   ├── PickupSystem.js      # XP collection
│   ├── RenderSystem.js      # Canvas rendering
│   ├── UISystem.js          # Menus and HUD
│   └── SynergySystem.js     # Synergy calculations
│
├── managers/
│   ├── AudioManager.js      # Sound effects
│   ├── SaveManager.js       # Save/load data
│   └── ScoreManager.js      # High scores
│
├── dev/
│   ├── DevTools.js          # Developer overlay UI
│   └── ContentAuditor.js    # Data validation
│
└── utils/
    ├── Logger.js
    ├── DebugOverlay.js
    ├── ScreenEffects.js
    └── Math.js
```

---

## 💻 Coding Standards

### JavaScript Style
```javascript
// Use ES6+ features
const myVariable = 'value';
let mutableValue = 10;

// Arrow functions for callbacks
array.map(item => item.value);

// Object destructuring
const { health, damage } = entity.components;

// Template literals
console.log(`Player health: ${health}`);

// Consistent naming
const MY_CONSTANT = 100;       // UPPER_SNAKE_CASE for constants
class MyClass {}               // PascalCase for classes
function myFunction() {}       // camelCase for functions
let myVariable = 0;            // camelCase for variables
```

### Code Organization
- **One class per file** (systems, managers)
- **Group related functions** together
- **Keep functions small** (<50 lines when possible)
- **Use JSDoc comments** for public APIs

### JSDoc Documentation
```javascript
/**
 * @fileoverview Brief description of file purpose
 */

/**
 * Calculate damage with modifiers
 * @param {number} baseDamage - Base damage value
 * @param {Object} modifiers - Damage modifiers
 * @param {number} modifiers.damageMultiplier - Damage multiplier
 * @param {number} modifiers.critChance - Critical hit chance (0-1)
 * @returns {number} Final damage value
 */
function calculateDamage(baseDamage, modifiers) {
  // Implementation
}
```

### Performance Considerations
- **Minimize object creation** in hot paths (game loop)
- **Use object pooling** for particles and projectiles
- **Cache calculations** when possible
- **Profile before optimizing** (use DevTools)

---

## ➕ Adding Content

### Adding a New Weapon

1. **Edit `js/data/WeaponData.js`**
2. **Add your weapon object** to the `WEAPONS` export:

```javascript
MY_NEW_WEAPON: {
  id: 'my_new_weapon',
  tags: ['projectile', 'fire_rate', 'piercing'],  // Tags for synergies
  name: 'My New Weapon',
  description: 'A cool new weapon that does X.',
  baseDamage: 20,              // Base damage per shot
  fireRate: 2.5,               // Shots per second
  projectileSpeed: 700,        // Pixels per second
  maxLevel: 8,                 // Always 8
  rarity: 'uncommon',          // common/uncommon/rare/epic/legendary
  color: '#00FF00',            // Hex color for visuals
  type: 'direct',              // Weapon behavior type
  levels: [
    // 8 levels (index 0-7)
    { damage: 1.0, projectileCount: 1 },
    { damage: 1.2, projectileCount: 1 },
    { damage: 1.4, projectileCount: 2 },
    { damage: 1.6, projectileCount: 2 },
    { damage: 1.8, projectileCount: 2, piercing: 1 },
    { damage: 2.0, projectileCount: 3, piercing: 1 },
    { damage: 2.3, projectileCount: 3, piercing: 2 },
    { damage: 2.6, projectileCount: 4, piercing: 2 }
  ]
}
```

3. **Test with DevTools** (F4 → Weapons tab → Give weapon)
4. **Balance test** - Play a full run and evaluate power level

### Adding a New Passive

1. **Edit `js/data/PassiveData.js`**
2. **Add your passive object**:

```javascript
MY_NEW_PASSIVE: {
  id: 'my_new_passive',
  tags: ['fire_rate', 'utility'],     // Tags for synergies
  name: 'My New Passive',
  description: 'Increases fire rate by X%.',
  rarity: 'uncommon',                  // common/uncommon/rare/epic
  effects: {
    fireRateMultiplier: 0.15,          // +15% fire rate per stack
    // See PassiveData.js for all available effect types
  },
  maxStacks: 5,                        // How many times can be picked
  color: '#FFD700',                    // Hex color
  icon: '⚡'                           // Emoji icon
}
```

3. **Test with DevTools** (F4 → Passives tab → Apply passive)
4. **Test synergies** - Check if tags trigger synergy bonuses

### Adding a New Enemy

1. **Edit `js/data/EnemyData.js`**
2. **Add your enemy object**:

```javascript
MY_NEW_ENEMY: {
  id: 'my_new_enemy',
  name: 'My New Enemy',
  health: 50,
  speed: 150,
  armor: 0,
  damage: 15,
  size: 20,
  color: '#FF00FF',
  scoreValue: 100,
  xpValue: 10,
  aiType: 'chase',  // chase, weave, kite, aggressive, stationary, etc.
  fireRate: 0,      // 0 for non-shooting enemies
  projectileSpeed: 0,
  behavior: {
    // Custom behavior parameters
    zigzagAmplitude: 0,
    shootRange: 0
  }
}
```

3. **Test with DevTools** - May need to modify SpawnerSystem to include it
4. **Balance test** - Ensure difficulty is appropriate for spawn wave

### Adding a New Ship

1. **Edit `js/data/ShipData.js`**
2. **Add your ship object** (follow existing structure)
3. **Create a keystone** in `js/data/KeystoneData.js`
4. **Test thoroughly** - Ships are complex!

---

## 🧪 Testing

### Manual Testing
1. **Use DevTools** (F4/L) extensively
   - Give weapons at all levels
   - Apply passives with various stacks
   - Test synergy interactions
   - Spawn enemies and weather events

2. **Test edge cases**
   - Max level weapons
   - Max stacks passives
   - All synergies at tier 3
   - Very high wave numbers (100+)

3. **Test performance**
   - Monitor FPS (Ctrl+Shift+I → Performance)
   - Spawn many enemies simultaneously
   - Test particle-heavy scenarios

### Balance Testing
- **Play full runs** with your new content
- **Compare to existing content** of same rarity
- **Check synergy interactions** - Does it break anything?
- **Get feedback** from other players

### Browser Testing
Test in multiple browsers:
- Chrome/Edge (primary)
- Firefox
- Safari (if available)

---

## 📤 Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-weapon
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Test thoroughly

4. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "Add new plasma rifle weapon"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/my-new-weapon
   ```

6. **Open a Pull Request**
   - Go to the main repository on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template

### PR Guidelines
- **One feature per PR** - Don't mix unrelated changes
- **Clear description** - Explain what and why
- **Link related issues** - Use "Fixes #123" syntax
- **Screenshots/videos** - Show visual changes if applicable
- **Request review** - Tag relevant maintainers

### PR Checklist
- [ ] Code follows project coding standards
- [ ] JSDoc comments added for new public functions
- [ ] Content is balanced (for weapons/passives/enemies)
- [ ] Tested in DevTools (F4/L)
- [ ] Tested in actual gameplay
- [ ] No console errors
- [ ] Works in Chrome and Firefox
- [ ] README updated if needed (new features)

---

## 🎨 Art Contributions

### Sprites
- **Format**: PNG with transparency
- **Style**: Neon sci-fi aesthetic
- **Size**: Proportional to existing entities
- **Submit**: As PR with image files

### Sound Effects
- **Format**: MP3 or WAV
- **Quality**: 44.1kHz, 16-bit minimum
- **Style**: Sci-fi/retro game sounds
- **Submit**: As PR with audio files

---

## 📝 Documentation

### Updating Documentation
- **README.md** - Main game documentation
- **ROADMAP.md** - Future plans and features
- **CONTRIBUTING.md** - This file
- **JSDoc** - Inline code documentation

### Writing Good Docs
- **Be clear and concise**
- **Use examples** where helpful
- **Keep formatting consistent**
- **Update version numbers** when applicable

---

## 🏆 Recognition

Contributors will be:
- Listed in a CONTRIBUTORS.md file (coming soon)
- Credited in release notes
- Mentioned in relevant documentation

---

## 💬 Getting Help

### Where to Ask Questions
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Pull Request Comments**: Code-specific questions

### Useful Resources
- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript and Canvas API
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- Existing code - Study how current weapons/systems work!

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Space InZader! 🚀**

*Your contributions help make this game better for everyone.*
