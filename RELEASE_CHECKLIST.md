# Release Checklist

This document provides a checklist for preparing Space InZader for release.

## ✅ Documentation (Complete)

- [x] Comprehensive README.md with:
  - [x] Game overview and features
  - [x] Complete content lists (weapons, passives, enemies, ships)
  - [x] Gameplay mechanics documentation
  - [x] Developer tools guide
  - [x] Technical architecture
  - [x] Installation instructions
- [x] ROADMAP.md with future plans
- [x] CONTRIBUTING.md for developers
- [x] LICENSE file (MIT)
- [x] Archive old documentation in docs/archive/

## ✅ Code Organization (Complete)

- [x] All JavaScript files properly organized in js/ directory
- [x] Test files moved to test/ directory
- [x] Old documentation archived in docs/ directory
- [x] Clean root directory with only essential files

## 🔍 Pre-Release Testing

### Functionality Testing
- [ ] Game launches without errors
- [ ] All 6 ships are playable
- [ ] All 18 weapons work correctly at all levels
- [ ] All 77 passives apply effects correctly
- [ ] All 13 enemy types spawn and behave properly
- [ ] Boss fights work (waves 10, 20, 30, etc.)
- [ ] Weather events spawn correctly (black holes, storms)
- [ ] Synergy system calculates bonuses correctly
- [ ] XP collection and leveling works
- [ ] Save/load system persists data
- [ ] Meta-progression (Noyaux) works

### UI/UX Testing
- [ ] Main menu displays correctly
- [ ] Ship selection screen works
- [ ] Level-up screen shows options correctly
- [ ] Game over screen displays stats
- [ ] Meta upgrade screen functions
- [ ] Pause menu works (ESC key)
- [ ] All UI elements are readable

### Developer Tools Testing
- [ ] DevTools open with F4/L
- [ ] Weapon testing tab works
- [ ] Passive testing tab works
- [ ] Utility commands function
- [ ] Environment spawning works
- [ ] Stats display is accurate

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)

### Performance Testing
- [ ] Game runs at 60 FPS on modest hardware
- [ ] No memory leaks during long sessions (60+ minutes)
- [ ] Particle system performs well with many enemies
- [ ] No console errors during normal gameplay

### Balance Testing
- [ ] Early game difficulty is appropriate
- [ ] Mid game (waves 20-50) is challenging but fair
- [ ] Late game (waves 50+) is possible to reach
- [ ] All ships are viable
- [ ] No obviously overpowered weapon/passive combos
- [ ] Synergies provide meaningful bonuses

## 📋 Release Preparation

### Version Management
- [ ] Update version number in relevant files
- [ ] Tag release in git (e.g., v1.0.0)
- [ ] Update "Last Updated" dates in documentation

### Final Checks
- [ ] No debug console.log statements in production code
- [ ] All images/assets load correctly
- [ ] Audio files work properly
- [ ] No broken links in documentation
- [ ] All file paths use relative paths (not absolute)

### GitHub Repository
- [ ] Update repository description
- [ ] Add relevant tags/topics (javascript, game, roguelite, html5, canvas)
- [ ] Create GitHub Release with changelog
- [ ] Update repository README preview
- [ ] Ensure LICENSE is visible

### Optional Enhancements
- [ ] Add screenshots to README
- [ ] Create animated GIF of gameplay
- [ ] Add "Play Online" link if hosted
- [ ] Create simple landing page (GitHub Pages)
- [ ] Add social media preview image

## 📢 Release Announcement

### Changelog for v1.0.0
```markdown
# Space InZader v1.0.0 - Initial Release

## Features
- 18 unique weapons with 8 levels each
- 77 passive abilities across all rarities
- 6 playable ships with unique keystones
- 13 enemy types including 4 boss variants
- 9 synergy trees with tier bonuses
- Wave-based roguelite gameplay
- Meta-progression system
- Developer tools (F4/L)
- Full save/load system

## Content
- Weapons: 8 standard + 10 advanced (including 4 evolutions)
- Ships: Vampire, Gunner, Tank, Sniper, Engineer, Berserker
- Enemies: 9 standard types + 4 bosses
- Weather Events: Black holes, meteor storms, magnetic storms

## Technical
- Built with vanilla JavaScript and HTML5 Canvas
- No frameworks or build process required
- Runs at 60 FPS on modern browsers
- LocalStorage save system
```

### Where to Announce
- [ ] GitHub Releases page
- [ ] Repository README
- [ ] Social media (if applicable)
- [ ] Relevant game development communities
- [ ] Reddit (r/webgames, r/gamedev, etc.)

## 🎯 Post-Release

### Monitoring
- [ ] Watch for bug reports in GitHub Issues
- [ ] Monitor feedback from players
- [ ] Track which features are most used
- [ ] Note balance complaints

### Planning v1.1
- [ ] Review roadmap
- [ ] Prioritize bug fixes
- [ ] Plan balance adjustments
- [ ] Schedule next release

---

## Quick Launch Test

To quickly verify the game works:

1. Open `index.html` in browser
2. Select any ship
3. Click "START GAME"
4. Verify:
   - Player moves with WASD
   - Weapon fires automatically
   - Enemies spawn and move
   - XP orbs drop and can be collected
   - Level up screen appears at level 2
   - Game can be paused with ESC
   - DevTools open with F4
5. Test for 5-10 minutes to ensure stability

---

**Ready for Release**: All checkboxes complete = Ready to ship! 🚀
