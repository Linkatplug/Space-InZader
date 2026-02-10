# DevTools UI Layout - New Features

## Overview
Two major features added to the DevTools Utilities tab:
- **God Mode Toggle** (Player Control section)
- **Wave Jump Controls** (New Wave Control section)

## UI Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  🛠️ DEV TOOLS                    (Press F4 or L to close)       │
├─────────────────────────────────────────────────────────────────┤
│  [⚔️ Weapons] [✨ Passives] [🔧 Utilities] [📊 Audit]          │
└─────────────────────────────────────────────────────────────────┘

                    *** Utilities Tab ***

┌──────────────────────────┬──────────────────────────┬──────────────┐
│  Player Control          │  Wave Control (NEW)      │  Weather     │
│  ─────────────           │  ─────────────           │  ────────    │
│                          │                          │              │
│  [🛡️ God Mode: ON ]     │  Current Wave: 15        │  [🕳️ Black  │
│   ^^^^^ GREEN WHEN ON    │                          │    Hole]     │
│                          │  ┌──────────┬─────────┐  │              │
│  [Spawn Dummy Enemy]     │  │ 15      │[🚀 Jump]│  │  [☄️ Meteor │
│                          │  └──────────┴─────────┘  │    Storm]    │
│  [Reset Run]             │                          │              │
│                          │  [⏭️ Next Wave]         │  [⚡ Mag    │
│  [Max Health]            │                          │    Storm]    │
│                          │  [⏩ Skip +5]           │              │
│  [+1000 XP]              │                          │  [✖️ End    │
│                          │                          │    Event]    │
│  [Clear Weapons/         │                          │              │
│   Passives]              │                          │              │
└──────────────────────────┴──────────────────────────┴──────────────┘

┌──────────────────────────┬──────────────────────────────────────────┐
│  Current Stats           │  Player Info                              │
│  ──────────              │  ───────────                              │
│                          │                                           │
│  [Grid of player stats]  │  HP: 100 / 100                           │
│                          │  🛡️ INVINCIBLE  <--- Shows when God Mode ON │
│                          │  Level: 5                                 │
│                          │  XP: 450 / 500                            │
│                          │  Weapons: 3                               │
│                          │  Passives: 2                              │
└──────────────────────────┴──────────────────────────────────────────┘
```

## Feature Details

### 1. God Mode Button
```
┌──────────────────────────┐
│ 💀 God Mode: OFF         │  <-- Default state (cyan)
└──────────────────────────┘

        ↓ (Click to enable)

┌──────────────────────────┐
│ 🛡️ God Mode: ON          │  <-- Active state (GREEN background)
└──────────────────────────┘
```

**Behavior**:
- OFF: Normal cyan color, skull emoji
- ON: Green background + glow, shield emoji
- Clicking toggles between states
- Console logs activation/deactivation

### 2. Wave Control Section
```
Wave Control
─────────────

Current Wave: 15

┌────────────────────┬──────────────────┐
│  Input: 20         │  [🚀 Jump to     │
│                    │      Wave]       │
└────────────────────┴──────────────────┘

┌─────────────────────────────────────┐
│  ⏭️ Skip to Next Wave              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ⏩ Skip +5 Waves                   │
└─────────────────────────────────────┘
```

**Behavior**:
- Input accepts numbers 1-999
- Jump button uses current input value
- Quick skip buttons provide instant navigation
- All buttons clear enemies and trigger wave announcement

## Console Output Examples

### God Mode Activation
```javascript
[DevTools] God Mode ENABLED - Player is now invincible! 🛡️
// (Green, bold, size 14px)
```

### God Mode Deactivation
```javascript
[DevTools] God Mode DISABLED - Player can take damage again
// (Orange, bold)
```

### Wave Jump
```javascript
[DevTools] Jumped to wave 20! 🚀
// (Green, bold, size 14px)
```

### Invalid Wave Input
```javascript
[DevTools] Invalid wave number: abc
// (Red error)
// Alert: "Please enter a valid wave number (1-999)"
```

## Color Scheme
- **Default buttons**: Cyan (#00ffff) border, semi-transparent cyan background
- **Active God Mode**: Green (#00ff00) border + background glow
- **Invincibility status**: Green text (#00ff00) with shield emoji
- **Input fields**: Dark background, cyan border, cyan text
- **Console success**: Green (#00ff00)
- **Console warning**: Orange (#ffaa00)
- **Console error**: Red (default)

## Keyboard Shortcuts
- **F4** or **L** - Toggle DevTools overlay
- No direct keyboard shortcuts for new features (click-based UI)

## Testing Checklist
- [ ] God mode button toggles correctly
- [ ] Green visual feedback appears when enabled
- [ ] Player Info shows "🛡️ INVINCIBLE" status
- [ ] No damage taken from any source with god mode on
- [ ] Damage works normally with god mode off
- [ ] Wave input accepts valid numbers (1-999)
- [ ] Wave input rejects invalid input (0, 1000+, text)
- [ ] Jump button navigates to specified wave
- [ ] Next Wave button increments by 1
- [ ] Skip +5 button increments by 5
- [ ] Wave announcement triggers on jump
- [ ] Enemies cleared when jumping waves
- [ ] DevTools UI refreshes to show new wave number
