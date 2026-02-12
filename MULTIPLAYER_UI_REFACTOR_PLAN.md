# Multiplayer UI Refactor - Complete Implementation Plan

## Problem Statement

The current multiplayer UI has serious overlay issues:
- Multiple screens display simultaneously
- Mixed use of `display: flex/none` and `.active` class
- No centralized screen management
- Ship selection reuses elements causing conflicts
- Missing Cancel/Back buttons
- Errors return to wrong screens

**Result:** Confusing UX with overlapping menus and wrong navigation flow.

## Solution Architecture

### Core Principle: ONE SCREEN AT A TIME

Implement exclusive screen management where only ONE screen is ever visible.

---

## Phase 1: Screen Management System ✅ COMPLETE

### Added to UISystem.js

```javascript
showScreen(screenId) {
    // Hide ALL screens
    // Show ONLY target screen
}
```

**Status:** ✅ Implemented in commit df3ef0c

**Screens Defined:**
- mainMenu, menuScreen, multiplayerMenu
- multiplayerHostScreen, multiplayerJoinScreen, multiplayerLobbyScreen  
- shipSelectionScreen, pauseMenu, gameOverScreen
- metaScreen, commandsScreen, optionsScreen
- scoreboardScreen, creditsScreen

---

## Phase 2: HTML Structure - New Multiplayer Screens

### 2.1 Update CSS - Add .screen Class

**Location:** `index.html` `<style>` section

**Add before existing styles:**

```css
/* Exclusive screen management - prevents overlays */
.screen {
    position: fixed;
    inset: 0;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 26, 0.95);
    z-index: 1000;
    pointer-events: all;
}

.screen.active {
    display: flex;
}
```

### 2.2 Create Dedicated Multiplayer Screens

**Replace current multiplayerMenu div with:**

```html
<!-- MULTIPLAYER MAIN MENU -->
<div id="multiplayerMenu" class="screen">
    <div class="menu-container">
        <h1 class="title">MULTIJOUEUR</h1>
        <div id="serverStatus" style="margin-bottom: 20px; padding: 15px; background: rgba(0, 0, 0, 0.5); border-radius: 5px;">
            <span id="connectionStatus">Connexion au serveur...</span>
        </div>
        <div class="menu-buttons">
            <button class="menu-btn" id="createGameBtn">CRÉER UNE PARTIE</button>
            <button class="menu-btn" id="joinGameBtn">REJOINDRE UNE PARTIE</button>
            <button class="menu-btn" id="multiplayerBackBtn">RETOUR</button>
        </div>
    </div>
</div>

<!-- MULTIPLAYER HOST SCREEN -->
<div id="multiplayerHostScreen" class="screen">
    <div class="menu-container">
        <h1 class="title">PARTIE CRÉÉE</h1>
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 24px; margin-bottom: 10px;">Code de la partie:</div>
            <div id="roomCodeDisplay" style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #00ffff; text-shadow: 0 0 20px #00ffff;">------</div>
            <div style="margin-top: 20px; font-size: 18px; color: #aaa;">Partagez ce code avec votre partenaire</div>
        </div>
        <div id="hostWaitingStatus" style="padding: 20px; background: rgba(0, 0, 0, 0.5); border-radius: 5px; margin: 20px 0;">
            En attente du joueur 2...
        </div>
        <div class="menu-buttons">
            <button class="menu-btn" id="cancelHostBtn">ANNULER</button>
        </div>
    </div>
</div>

<!-- MULTIPLAYER JOIN SCREEN -->
<div id="multiplayerJoinScreen" class="screen">
    <div class="menu-container">
        <h1 class="title">REJOINDRE UNE PARTIE</h1>
        <div style="margin: 30px 0;">
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-size: 18px;">CODE DE LA PARTIE</label>
                <input type="text" id="roomCodeInput" placeholder="ENTREZ LE CODE" maxlength="6" 
                       style="width: 300px; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 4px; text-transform: uppercase; background: rgba(0, 0, 0, 0.5); border: 2px solid #00ffff; border-radius: 5px; color: #00ffff; font-family: 'Courier New', monospace;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-size: 18px;">VOTRE NOM</label>
                <input type="text" id="playerNameInput" placeholder="Nom du joueur" maxlength="20"
                       style="width: 300px; padding: 15px; font-size: 18px; background: rgba(0, 0, 0, 0.5); border: 2px solid #00ffff; border-radius: 5px; color: #00ffff; font-family: 'Courier New', monospace;">
            </div>
        </div>
        <div class="menu-buttons">
            <button class="menu-btn" id="confirmJoinBtn">REJOINDRE</button>
            <button class="menu-btn" id="cancelJoinBtn">RETOUR</button>
        </div>
        <div id="joinErrorMessage" style="color: #ff4444; margin-top: 20px; display: none;"></div>
    </div>
</div>

<!-- MULTIPLAYER LOBBY SCREEN -->
<div id="multiplayerLobbyScreen" class="screen">
    <div class="menu-container">
        <h1 class="title">LOBBY</h1>
        <div id="roomCodeLobby" style="text-align: center; margin-bottom: 30px; font-size: 20px;">
            Code: <span style="color: #00ffff; font-weight: bold;">------</span>
        </div>
        <div id="lobbyPlayerList" style="margin: 30px 0; padding: 20px; background: rgba(0, 0, 0, 0.5); border-radius: 5px; min-width: 400px;">
            <!-- Will be populated by updateMultiplayerLobby() -->
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px;">👑 Joueur 1:</span>
                <span id="player1Status" style="color: #888;">EN ATTENTE...</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px;">Joueur 2:</span>
                <span id="player2Status" style="color: #888;">EN ATTENTE...</span>
            </div>
        </div>
        <div id="multiplayerLobbyStatus" style="margin: 20px 0; font-size: 16px; color: #aaa;"></div>
        <div class="menu-buttons">
            <button class="menu-btn" id="readyBtn">PRÊT</button>
            <button class="menu-btn" id="quitLobbyBtn">QUITTER</button>
        </div>
    </div>
</div>

<!-- SHIP SELECTION SCREEN (Reused for both solo and multiplayer) -->
<div id="shipSelectionScreen" class="screen">
    <div class="menu-container">
        <h1 class="title">SÉLECTION DU VAISSEAU</h1>
        <div class="ship-selection" id="shipSelection"></div>
        <div class="menu-buttons">
            <button class="button" id="confirmShipBtn">CONFIRMER</button>
            <button class="button" id="backFromShipBtn">RETOUR</button>
        </div>
    </div>
</div>
```

### 2.3 Update Existing Screens

**Add `.screen` class to:**
- `mainMenu`
- `pauseMenu`
- `gameOverScreen`
- `metaScreen`
- `commandsScreen`
- `optionsScreen`
- `scoreboardScreen`
- `creditsScreen`

**Example:**
```html
<div id="mainMenu" class="screen active">
```

---

## Phase 3: MultiplayerManager.js Updates

### 3.1 Add exitMultiplayerFlow() Method

```javascript
/**
 * Exit multiplayer flow and return to multiplayer menu
 * @param {string} reason - Why we're exiting
 */
exitMultiplayerFlow(reason) {
    console.warn('[MP] Exiting multiplayer flow:', reason);
    
    // Reset all multiplayer state
    this.roomId = null;
    this.playerId = null;
    this.isHost = false;
    this.roomPlayers = [];
    this.joinInProgress = false;
    this.hostInProgress = false;
    this.readySent = false;
    this.startReceived = false;
    
    // Update states
    this.connectionState = 'CONNECTED';
    this.roomState = 'NONE';
    this.gameState = 'IDLE';
    
    // Return to multiplayer menu
    if (this.game && this.game.systems && this.game.systems.ui) {
        this.game.systems.ui.showScreen('multiplayerMenu');
    }
    
    this.logState('Exited multiplayer flow', { reason });
}
```

### 3.2 Update Flow Methods to Use showScreen()

**createRoom():**
```javascript
createRoom(playerName, shipType) {
    // ... existing code ...
    
    // On success:
    this.game.systems.ui.showScreen('multiplayerHostScreen');
    
    // On error:
    this.exitMultiplayerFlow('create room failed');
}
```

**joinRoom():**
```javascript
joinRoom(roomId, playerName, shipType) {
    // ... existing code ...
    
    // On success:
    this.game.systems.ui.showScreen('multiplayerLobbyScreen');
    
    // On error:
    const errorEl = document.getElementById('joinErrorMessage');
    if (errorEl) {
        errorEl.textContent = errorMsg;
        errorEl.style.display = 'block';
    }
    // Stay on joinScreen, don't exit
}
```

**onRoomState():**
```javascript
onRoomState(data) {
    // ... existing code ...
    
    // When player 2 joins (if host):
    if (this.isHost && this.roomPlayers.length === 2) {
        this.game.systems.ui.showScreen('multiplayerLobbyScreen');
    }
}
```

**onGameStart():**
```javascript
onGameStart(data) {
    // ... existing code ...
    
    // Start game:
    this.game.systems.ui.showScreen('gameHud');
}
```

### 3.3 Call exitMultiplayerFlow() on Errors

**Add to disconnect handler:**
```javascript
socket.on('disconnect', () => {
    this.exitMultiplayerFlow('disconnected from server');
});
```

**Add to error handlers:**
- Join failed: Show error on screen (don't exit)
- Room full: Show error on screen (don't exit)
- Host disconnect: exitMultiplayerFlow('host disconnected')
- Leave room: exitMultiplayerFlow('player left')

---

## Phase 4: Game.js Updates

### 4.1 Update Multiplayer Button Handler

```javascript
document.getElementById('multiplayerBtn')?.addEventListener('click', () => {
    this.systems.ui.showScreen('multiplayerMenu');
    this.multiplayerManager.connect();
});
```

### 4.2 Update Ship Selection Flow

**For Solo:**
```javascript
document.getElementById('playBtn')?.addEventListener('click', () => {
    this.systems.ui.showScreen('shipSelectionScreen');
    this.gameMode = 'solo';
});
```

**For Multiplayer Host:**
```javascript
document.getElementById('createGameBtn')?.addEventListener('click', () => {
    this.systems.ui.showScreen('shipSelectionScreen');
    this.gameMode = 'multiplayer-host';
});
```

**For Multiplayer Join:**
```javascript
document.getElementById('joinGameBtn')?.addEventListener('click', () => {
    this.systems.ui.showScreen('multiplayerJoinScreen');
    this.gameMode = 'multiplayer-join';
});
```

**Ship Confirm Handler:**
```javascript
document.getElementById('confirmShipBtn')?.addEventListener('click', () => {
    const selectedShip = this.systems.ui.selectedShipId;
    
    if (this.gameMode === 'solo') {
        this.startGame();
    } else if (this.gameMode === 'multiplayer-host') {
        this.multiplayerManager.createRoom('Player', selectedShip);
    } else if (this.gameMode === 'multiplayer-join') {
        // After join, they'll be in lobby
        this.systems.ui.showScreen('multiplayerJoinScreen');
    }
});
```

**Back from Ship Selection:**
```javascript
document.getElementById('backFromShipBtn')?.addEventListener('click', () => {
    if (this.gameMode === 'solo') {
        this.systems.ui.showScreen('mainMenu');
    } else {
        this.systems.ui.showScreen('multiplayerMenu');
    }
});
```

### 4.3 Update Other Screen Transitions

**Replace all instances of:**
```javascript
document.getElementById('xyz').style.display = 'flex';
```

**With:**
```javascript
this.systems.ui.showScreen('xyz');
```

---

## Phase 5: Event Handler Updates

### 5.1 Add New Button Handlers in Game.js

```javascript
// Multiplayer host screen
document.getElementById('cancelHostBtn')?.addEventListener('click', () => {
    this.multiplayerManager.exitMultiplayerFlow('host cancelled');
});

// Multiplayer join screen
document.getElementById('confirmJoinBtn')?.addEventListener('click', () => {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    const playerName = document.getElementById('playerNameInput').value.trim() || 'Player';
    const shipType = this.systems.ui.selectedShipId || 'fighter';
    
    if (!roomCode || roomCode.length !== 6) {
        const errorEl = document.getElementById('joinErrorMessage');
        if (errorEl) {
            errorEl.textContent = 'Code invalide (6 caractères requis)';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    this.multiplayerManager.joinRoom(roomCode, playerName, shipType);
});

document.getElementById('cancelJoinBtn')?.addEventListener('click', () => {
    this.systems.ui.showScreen('multiplayerMenu');
});

// Multiplayer lobby screen
document.getElementById('readyBtn')?.addEventListener('click', () => {
    this.multiplayerManager.sendReady();
    // Disable button after click
    document.getElementById('readyBtn').disabled = true;
    document.getElementById('readyBtn').textContent = 'EN ATTENTE...';
});

document.getElementById('quitLobbyBtn')?.addEventListener('click', () => {
    this.multiplayerManager.exitMultiplayerFlow('player quit lobby');
});
```

---

## Phase 6: Enhanced updateMultiplayerLobby()

**Update UISystem.js method:**

```javascript
updateMultiplayerLobby(players = [], isHost = false) {
    // Update lobby screen elements
    const roomCodeLobby = document.getElementById('roomCodeLobby');
    const player1Status = document.getElementById('player1Status');
    const player2Status = document.getElementById('player2Status');
    const lobbyStatus = document.getElementById('multiplayerLobbyStatus');
    
    if (!player1Status || !player2Status) return;
    
    const p1 = players.find(p => p.playerId === 1);
    const p2 = players.find(p => p.playerId === 2);
    
    // Update player 1 status
    if (p1) {
        const readyIcon = p1.ready ? '✓' : '⏳';
        player1Status.textContent = `${p1.name || 'J1'} ${readyIcon}`;
        player1Status.style.color = p1.ready ? '#44ff44' : '#888';
    } else {
        player1Status.textContent = 'EN ATTENTE...';
        player1Status.style.color = '#888';
    }
    
    // Update player 2 status
    if (p2) {
        const readyIcon = p2.ready ? '✓' : '⏳';
        player2Status.textContent = `${p2.name || 'J2'} ${readyIcon}`;
        player2Status.style.color = p2.ready ? '#44ff44' : '#888';
    } else {
        player2Status.textContent = 'EN ATTENTE...';
        player2Status.style.color = '#888';
    }
    
    // Update lobby status
    if (lobbyStatus) {
        const allReady = p1?.ready && p2?.ready;
        if (allReady) {
            lobbyStatus.textContent = '✓ Tous les joueurs sont prêts ! Démarrage...';
            lobbyStatus.style.color = '#44ff44';
        } else {
            const readyCount = (p1?.ready ? 1 : 0) + (p2?.ready ? 1 : 0);
            lobbyStatus.textContent = `${readyCount}/2 joueurs prêts`;
            lobbyStatus.style.color = '#aaa';
        }
    }
}
```

---

## Implementation Checklist

### ✅ Phase 1: Screen Management
- [x] Add showScreen() to UISystem.js

### Phase 2: HTML Structure
- [ ] Add .screen CSS class
- [ ] Update mainMenu with .screen class
- [ ] Create multiplayerMenu screen
- [ ] Create multiplayerHostScreen
- [ ] Create multiplayerJoinScreen
- [ ] Create multiplayerLobbyScreen
- [ ] Create shipSelectionScreen
- [ ] Add .screen class to all existing screens

### Phase 3: MultiplayerManager
- [ ] Add exitMultiplayerFlow() method
- [ ] Update createRoom() to use showScreen()
- [ ] Update joinRoom() to use showScreen()
- [ ] Update onRoomState() to use showScreen()
- [ ] Update onGameStart() to use showScreen()
- [ ] Add exitMultiplayerFlow() to error handlers

### Phase 4: Game.js
- [ ] Update multiplayer button to use showScreen()
- [ ] Update ship selection flow for all modes
- [ ] Replace all style.display with showScreen()
- [ ] Add gameMode tracking (solo/multiplayer-host/multiplayer-join)

### Phase 5: Event Handlers
- [ ] Add cancelHostBtn handler
- [ ] Add confirmJoinBtn handler
- [ ] Add cancelJoinBtn handler
- [ ] Add readyBtn handler
- [ ] Add quitLobbyBtn handler

### Phase 6: Enhanced UI
- [ ] Update updateMultiplayerLobby() with full logic
- [ ] Test all screen transitions
- [ ] Verify no overlays occur

---

## Testing Plan

### Test 1: Solo Mode
1. Click SOLO → Should show shipSelectionScreen
2. Select ship → Click CONFIRMER → Should start game
3. Click RETOUR → Should show mainMenu

### Test 2: Multiplayer Host
1. Click MULTIJOUEUR → Should show multiplayerMenu
2. Click CRÉER → Should show shipSelectionScreen
3. Select ship → Click CONFIRMER → Should show multiplayerHostScreen with code
4. Click ANNULER → Should show multiplayerMenu

### Test 3: Multiplayer Join
1. Click MULTIJOUEUR → Should show multiplayerMenu
2. Click REJOINDRE → Should show multiplayerJoinScreen
3. Enter code → Click REJOINDRE → Should show multiplayerLobbyScreen
4. Click QUITTER → Should show multiplayerMenu

### Test 4: Full Multiplayer Flow
1. Host creates game → Shows code
2. Guest joins → Both in lobby
3. Both click PRÊT → Game starts
4. Verify only game HUD visible

### Test 5: Error Handling
1. Join with invalid code → Error shown on joinScreen (not kicked out)
2. Host cancels → Returns to multiplayerMenu
3. Player disconnects → Other player returns to multiplayerMenu

---

## Expected Results

✅ **No overlays** - Only one screen visible at any time
✅ **Clean navigation** - Back/Cancel buttons everywhere
✅ **Proper error handling** - Errors return to correct screen
✅ **Professional flow** - Intuitive multiplayer experience
✅ **Maintainable** - Centralized screen management

---

## Notes for Implementation

1. **Do NOT modify:** Core game logic, systems (except UI), ECS
2. **Modify carefully:** Event handlers (many interdependencies)
3. **Test after each phase:** Don't combine all phases
4. **Keep logs:** Console logs help debugging screen transitions
5. **CSS specificity:** `.screen` class takes precedence

---

## Common Pitfalls to Avoid

❌ **Don't:** Use `style.display` directly on screens
✅ **Do:** Use `showScreen()` method

❌ **Don't:** Reuse divs for multiple purposes
✅ **Do:** Create dedicated screens

❌ **Don't:** Return to wrong menu on errors
✅ **Do:** Use `exitMultiplayerFlow()`

❌ **Don't:** Forget to remove `.active` class
✅ **Do:** Let `showScreen()` handle it

---

## Current Status

- ✅ Phase 1 complete: showScreen() added
- ⏳ Phase 2: HTML structure needs update
- ⏳ Phase 3: MultiplayerManager needs refactor
- ⏳ Phase 4: Game.js needs updates
- ⏳ Phase 5: Event handlers need addition
- ⏳ Phase 6: Enhanced UI needs implementation

**Next Step:** Implement Phase 2 (HTML structure updates)
