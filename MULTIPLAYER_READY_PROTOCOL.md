# Protocole READY/START Multijoueur - Documentation Complète

## Vue d'ensemble

Système multijoueur robuste avec machine d'état, logs complets, et protocole READY/START synchronisé pour 2 joueurs coopératifs.

## Architecture

### Machine d'État Client (MultiplayerManager.js)

#### États
```javascript
connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
roomState: 'NONE' | 'HOSTING' | 'JOINING' | 'IN_ROOM'
gameState: 'IDLE' | 'WAITING_READY' | 'STARTING' | 'RUNNING'
```

#### Flags de Protection
```javascript
joinInProgress: boolean    // Empêche double-join
hostInProgress: boolean    // Empêche double-create
readySent: boolean         // Track si ready envoyé
startReceived: boolean     // Track si start reçu
currentRoomId: string      // Room actuelle
roomPlayers: Array         // Liste players avec ready status
```

### Machine d'État Serveur (server.js)

#### GameRoom Extended
```javascript
players: Map<socketId, playerData>
readyStatus: Map<socketId, boolean>
hostId: string
gameState: { started: boolean, ... }
```

## Flux Complets

### 1. HOST - Créer une Partie

```
┌─────────────────────────────────────────────────────────────┐
│ JOUEUR HÔTE                                                 │
└─────────────────────────────────────────────────────────────┘

1. Clic "CRÉER UNE PARTIE"
   ↓
2. Game.js appelle multiplayerManager.createRoom()
   [MP] Creating room... {connectionState: CONNECTED, roomState: HOSTING, ...}
   ↓
3. Client → Serveur: emit('create-room', {playerName, shipType})
   [MP OUT] create-room
   ↓
4. Serveur traite:
   [SV] create-room socket=ABC123 room=XYZ789 players=1
   ↓
5. Serveur → Client: ACK callback({ok: true, roomId, playerId: 1, players: [...]})
   [MP IN] create-room [response]
   [MP] Create room ACK received {ok: true, ...}
   [MP] Room created successfully {roomState: IN_ROOM, gameState: WAITING_READY}
   ↓
6. UI affiche: "Code de la partie: XYZ789"
   UI affiche: "En attente du joueur 2..."

STATE FINAL: roomState=IN_ROOM, gameState=WAITING_READY, isHost=true
```

### 2. GUEST - Rejoindre une Partie

```
┌─────────────────────────────────────────────────────────────┐
│ JOUEUR 2                                                    │
└─────────────────────────────────────────────────────────────┘

1. Clic "REJOINDRE UNE PARTIE", entre code: XYZ789
   ↓
2. Game.js appelle multiplayerManager.joinRoom('XYZ789')
   [MP] Joining room... {connectionState: CONNECTED, roomState: JOINING, roomId: XYZ789}
   ↓
3. Client → Serveur: emit('join-room', {roomId: 'XYZ789', playerName, shipType})
   [MP OUT] join-room
   ↓
4. Serveur traite:
   [SV] join-room SUCCESS socket=DEF456 room=XYZ789 playerId=2 totalPlayers=2
   ↓
5. Serveur → Tous dans room: emit('room-state', {roomId, players: [...], hostId})
   [MP IN] room-state
   [MP] Room state update received {players: [{id:1, ready:false}, {id:2, ready:false}]}
   ↓
6. Serveur → Client: ACK callback({ok: true, roomId, playerId: 2, players: [...]})
   [MP IN] join-room [response]
   [MP] Join room ACK received {ok: true, ...}
   [MP] Joined room successfully {roomState: IN_ROOM, gameState: WAITING_READY}
   ↓
7. UI affiche: "Lobby - Joueur 1: ⏳ | Joueur 2: ⏳"
   UI affiche bouton: "PRÊT"

STATE FINAL: roomState=IN_ROOM, gameState=WAITING_READY, isHost=false
```

### 3. LES DEUX - Envoi READY

```
┌─────────────────────────────────────────────────────────────┐
│ LES DEUX JOUEURS (Ordre quelconque)                        │
└─────────────────────────────────────────────────────────────┘

JOUEUR 1 (Host):
1. Clic bouton "PRÊT"
   ↓
2. UI appelle multiplayerManager.sendReady()
   [MP] Sending ready status {readySent: false, currentRoomId: XYZ789}
   ↓
3. Client → Serveur: emit('player-ready', {roomId: 'XYZ789'})
   [MP OUT] player-ready
   ↓
4. Serveur traite:
   [SV] player-ready SUCCESS socket=ABC123 room=XYZ789 players=1:true,2:false
   ↓
5. Serveur → Tous: emit('room-state', {players: [{id:1, ready:true}, {id:2, ready:false}]})
   [MP IN] room-state
   [MP] Room state update received
   [MP] Updating lobby UI {players: [1:✓, 2:⏳]}
   ↓
6. UI update: "Lobby - Joueur 1: ✓ | Joueur 2: ⏳"

---

JOUEUR 2:
1. Clic bouton "PRÊT"
   ↓
2. UI appelle multiplayerManager.sendReady()
   [MP] Sending ready status {readySent: false, currentRoomId: XYZ789}
   ↓
3. Client → Serveur: emit('player-ready', {roomId: 'XYZ789'})
   [MP OUT] player-ready
   ↓
4. Serveur traite:
   [SV] player-ready SUCCESS socket=DEF456 room=XYZ789 players=1:true,2:true
   ↓
5. Serveur détecte: areAllPlayersReady() === true
   [SV] All players ready in room XYZ789, starting game...
   ↓
6. Serveur génère:
   seed = Date.now() = 1234567890
   startAt = Date.now() + 1000 = 1234568890 (dans 1 seconde)
   [SV] start-game AUTO room=XYZ789 seed=1234567890 startAt=1234568890 players=2
   ↓
7. Serveur → Tous: emit('start-game', {roomId, seed, startAt, players: [...]})

TOUS LES CLIENTS REÇOIVENT:
   [MP IN] start-game
   [MP] Start game command received {seed, startAt, delay: 1000}
   [MP] Scheduling game start {startAt: 1234568890, now: 1234567890, delay: 1000}
   ↓
8. Après 1 seconde (exactement):
   [MP] Starting game NOW {gameState: RUNNING}
   → game.startGame() appelé
   → Le jeu démarre simultanément pour les 2 joueurs
```

## Logs Complets

### Format Logs Client

Tous les logs utilisent le préfixe `[MP]` et incluent l'état:

```javascript
[MP] Message {
  connectionState: 'CONNECTED',
  roomState: 'IN_ROOM',
  gameState: 'WAITING_READY',
  roomId: 'XYZ789',
  playerId: 1,
  isHost: true,
  readySent: false,
  ...extra
}
```

**Logs entrants:**
```
[MP IN] event-name [args]
```

**Exemple complet:**
```
[MP] Creating room... {connectionState: CONNECTED, roomState: HOSTING, ...}
[MP OUT] create-room
[MP IN] create-room [{ok: true, roomId: 'XYZ789', ...}]
[MP] Create room ACK received {ok: true, ...}
[MP] Room created successfully {roomState: IN_ROOM, gameState: WAITING_READY}
```

### Format Logs Serveur

Tous les logs utilisent le préfixe `[SV]`:

```
[SV] operation socket=socketId room=roomId ...details
```

**Exemples:**
```
[SV] create-room socket=ABC123 room=XYZ789 players=1
[SV] join-room SUCCESS socket=DEF456 room=XYZ789 playerId=2 totalPlayers=2
[SV] player-ready SUCCESS socket=ABC123 room=XYZ789 players=1:true,2:false
[SV] All players ready in room XYZ789, starting game...
[SV] start-game AUTO room=XYZ789 seed=1234567890 startAt=1234568890 players=2
```

## Protection Contre Erreurs

### 1. Double-Join / Double-Create

**Client:**
```javascript
// Dans createRoom()
if (this.hostInProgress) {
    this.logState('Create room already in progress, ignoring');
    return;
}
if (this.currentRoomId) {
    this.logState('Already in a room, ignoring');
    return;
}
```

**Serveur:**
```javascript
// Dans addPlayer()
if (this.players.has(socketId)) {
    console.log(`[SV] Player ${socketId} already in room`);
    return { alreadyInRoom: true, playerId: ... };
}
```

### 2. Double-Ready

**Client:**
```javascript
// Dans sendReady()
if (this.readySent) {
    this.logState('Ready already sent, ignoring');
    return;
}
```

### 3. Double-Start

**Client:**
```javascript
// Dans onGameStart()
if (this.startReceived) {
    this.logState('Start already received, ignoring duplicate');
    return;
}
```

### 4. Listeners en Double

**Client:**
```javascript
// Dans connect()
this.socket.removeAllListeners();
// Puis setupEventHandlers()
```

## Events Socket.IO

### Client → Serveur

| Event | Payload | ACK Response | Description |
|-------|---------|--------------|-------------|
| `create-room` | `{playerName, shipType}` | `{ok, roomId, playerId, players}` | Créer une room |
| `join-room` | `{roomId, playerName, shipType}` | `{ok, roomId, playerId, players}` | Rejoindre une room |
| `player-ready` | `{roomId}` | `{ok, roomId}` | Indiquer prêt à jouer |

### Serveur → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-state` | `{roomId, players: [{id, name, ready, isHost}], hostId}` | État de la room avec statuts ready |
| `start-game` | `{roomId, seed, startAt, players}` | Commande de démarrage synchronisé |
| `player-joined` (legacy) | `{playerData, players}` | Notification qu'un joueur a rejoint |

## Intégration UI (À Faire - Phase 4)

### 1. Lobby UI

Créer `updateMultiplayerLobby(players, isHost)` dans UISystem:

```javascript
updateMultiplayerLobby(players, isHost) {
    const lobbyDiv = document.getElementById('multiplayer-lobby');
    lobbyDiv.innerHTML = '<h3>Lobby</h3>';
    
    players.forEach(p => {
        const status = p.ready ? '✓ PRÊT' : '⏳ En attente';
        const hostBadge = p.isHost ? ' (Hôte)' : '';
        lobbyDiv.innerHTML += `
            <div class="player-status">
                Joueur ${p.playerId}${hostBadge}: ${p.name} - ${status}
            </div>
        `;
    });
    
    // Afficher bouton PRÊT si pas encore prêt
    if (!this.game.multiplayerManager.readySent) {
        lobbyDiv.innerHTML += '<button onclick="game.multiplayerManager.sendReady()">PRÊT</button>';
    }
}
```

### 2. Bouton PRÊT

Dans le HTML du lobby multiplayer:

```html
<button id="ready-button" onclick="game.multiplayerManager.sendReady()">
    PRÊT
</button>
```

Désactiver après clic:
```javascript
// Dans sendReady() après emit
document.getElementById('ready-button').disabled = true;
document.getElementById('ready-button').textContent = 'EN ATTENTE...';
```

## Debugging

### Activer Logs Détaillés

Tous les logs sont déjà actifs! Vérifier dans la console:

**Client:**
```
[MP] ...     // États et transitions
[MP IN] ...  // Events reçus
[MP OUT] ... // Events envoyés (si ajouté)
```

**Serveur:**
```
[SV] ...     // Toutes les opérations
```

### Scénarios de Test

#### Test 1: Flow Complet
1. Démarrer serveur: `node server.js`
2. Ouvrir 2 onglets: `http://localhost:7779`
3. Onglet 1: MULTIJOUEUR → CRÉER
4. Onglet 2: MULTIJOUEUR → REJOINDRE (avec code)
5. Les deux: Clic PRÊT
6. Vérifier: Démarrage simultané après 1 seconde

**Logs attendus:**
```
[SV] create-room socket=... room=ABC123 players=1
[SV] join-room SUCCESS socket=... room=ABC123 playerId=2 totalPlayers=2
[SV] player-ready SUCCESS socket=... room=ABC123 players=1:true,2:false
[SV] player-ready SUCCESS socket=... room=ABC123 players=1:true,2:true
[SV] All players ready in room ABC123, starting game...
[SV] start-game AUTO room=ABC123 seed=... startAt=... players=2
```

#### Test 2: Double-Join
1. Player 1 crée room
2. Player 2 rejoint room
3. Player 2 essaye de rejoindre à nouveau
4. Vérifier: Guard l'empêche avec log

**Log attendu:**
```
[MP] Join room already in progress, ignoring
```

#### Test 3: Reconnexion
1. Player 1 crée, Player 2 rejoint
2. Player 2 ferme onglet
3. Player 2 ouvre nouvel onglet, rejoint même room
4. Vérifier: Serveur détecte "already in room"

**Log attendu:**
```
[SV] join-room RECONNECT socket=... room=... playerId=2
```

## Prochaines Étapes

### Phase 4: UI Ready Button
- [ ] Ajouter lobby UI avec liste players
- [ ] Afficher status ready de chaque player
- [ ] Bouton PRÊT fonctionnel
- [ ] Désactiver bouton après clic
- [ ] Message "En attente de l'autre joueur..."

### Phase 5: Tests E2E
- [ ] Tester 2 vrais joueurs
- [ ] Vérifier synchronisation start
- [ ] Tester déconnexion/reconnexion
- [ ] Vérifier pas de double-join
- [ ] Vérifier logs complets

## Commandes Utiles

```bash
# Démarrer serveur en dev
node server.js

# Démarrer serveur avec logs dans fichier
node server.js > server.log 2>&1 &

# Voir logs en temps réel
tail -f server.log

# Tuer serveur sur port 7779
kill $(lsof -ti :7779)

# Ouvrir navigateur
open http://localhost:7779
```

## Notes Techniques

### Synchronisation Temporelle

Le serveur envoie `startAt = Date.now() + 1000` (1 seconde dans le futur).
Les clients calculent `delay = startAt - Date.now()` et utilisent `setTimeout(delay)`.

**Pourquoi 1 seconde?**
- Compense latence réseau (~100-300ms)
- Temps pour traiter l'event côté client
- Permet affichage "3... 2... 1... GO!" si désiré

### Seed Pour Random Synchronisé

Le serveur génère `seed = Date.now()` et l'envoie aux clients.
Les clients peuvent l'utiliser pour `Math.seedrandom(seed)` (bibliothèque externe).

**Important:** Pas encore implémenté côté client! À ajouter si besoin de synchroniser les randoms.

## Résumé

✅ **Machine d'état robuste** - Plus de confusion sur l'état
✅ **Logs complets** - Debug facile
✅ **Protection double-join** - Pas de duplicatas
✅ **Protocole READY** - Synchronisation claire
✅ **Auto-start** - Démarre automatiquement quand les 2 sont prêts
✅ **Start synchronisé** - Les 2 joueurs démarrent exactement en même temps

🎮 **Le multijoueur est maintenant solide et debuggable!**
