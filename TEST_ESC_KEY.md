# 🧪 Test ESC Key - Guide de Vérification

## Ce qui a été corrigé

### Problème Original
- ESC ne fonctionnait pas
- Menu pause ne s'affichait pas
- Toggles pause/resume rapides

### Corrections Appliquées
1. ✅ Ajout débounce 300ms réel (était absent malgré commit précédent)
2. ✅ hidePauseMenu() appelle maintenant resumeGame() correctement
3. ✅ Transitions propres entre états

---

## Tests à Effectuer

### Test 1: Ouvrir Menu Pause
**Étapes:**
1. Ouvrir `index.html`
2. Cliquer "PLAY"
3. Sélectionner un vaisseau
4. Cliquer "START GAME"
5. **Appuyer ESC**

**Résultat attendu:**
- ✅ Menu pause s'affiche avec fond semi-transparent
- ✅ Boutons visibles:
  - REPRENDRE
  - COMMANDES
  - OPTIONS
  - QUITTER
- ✅ Jeu arrêté (timer ne bouge pas, ennemis figés)
- ✅ Musique continue

---

### Test 2: Reprendre avec ESC
**Étapes:**
1. Menu pause ouvert (Test 1)
2. **Appuyer ESC à nouveau**

**Résultat attendu:**
- ✅ Menu pause disparaît
- ✅ Jeu reprend immédiatement
- ✅ Timer continue
- ✅ Ennemis bougent
- ✅ Vaisseau contrôlable

---

### Test 3: Reprendre avec Bouton
**Étapes:**
1. Menu pause ouvert (Test 1)
2. **Cliquer "REPRENDRE"**

**Résultat attendu:**
- ✅ Menu pause disparaît
- ✅ Jeu reprend immédiatement
- ✅ Timer continue
- ✅ Ennemis bougent

---

### Test 4: Spam ESC (Test Débounce)
**Étapes:**
1. En jeu
2. **Appuyer ESC rapidement 5-10 fois**

**Résultat attendu:**
- ✅ Menu pause s'ouvre
- ✅ Pas de toggle rapide pause/resume
- ✅ Menu reste stable
- ✅ Pas de glitch visuel

---

### Test 5: Navigation Menu Pause
**Étapes:**
1. Menu pause ouvert
2. **Cliquer "COMMANDES"**
3. Regarder les contrôles
4. **Cliquer "RETOUR"**

**Résultat attendu:**
- ✅ Écran commandes s'affiche
- ✅ Bouton retour visible
- ✅ Retour au menu pause
- ✅ Peut reprendre le jeu

---

### Test 6: Options depuis Pause
**Étapes:**
1. Menu pause ouvert
2. **Cliquer "OPTIONS"**
3. Ajuster volume musique/SFX
4. **Cliquer "RETOUR"**
5. **Cliquer "REPRENDRE"**

**Résultat attendu:**
- ✅ Options s'affichent
- ✅ Sliders fonctionnent
- ✅ Volume change en temps réel
- ✅ Retour au menu pause OK
- ✅ Reprendre fonctionne

---

### Test 7: Quitter vers Menu
**Étapes:**
1. Menu pause ouvert
2. **Cliquer "QUITTER"**

**Résultat attendu:**
- ✅ Retour au menu principal
- ✅ Musique menu démarre
- ✅ Peut relancer une partie

---

## Console Debug

### Logs Attendus (F12 Console)

**Lors de ESC (pause):**
```
State changed: RUNNING -> PAUSED
Game paused - menu opened
```

**Lors de ESC (resume):**
```
State changed: PAUSED -> RUNNING
```

**Lors du bouton Reprendre:**
```
State changed: PAUSED -> RUNNING
```

### Logs à NE PAS voir

❌ **Toggles rapides:**
```
State changed: RUNNING -> PAUSED
State changed: PAUSED -> RUNNING  ← Immédiat (BAD!)
State changed: RUNNING -> PAUSED
State changed: PAUSED -> RUNNING
```

---

## Debugging

### Si ESC ne fonctionne toujours pas:

1. **Vérifier la console (F12)**
   - Erreurs JavaScript?
   - Logs de changement d'état?

2. **Vérifier index.html**
   - `<div id="pauseMenu">` existe?
   - Boutons ont les bons IDs?

3. **Vérifier GameStates**
   - État actuel dans console: `window.game.gameState.currentState`
   - Devrait être "RUNNING" en jeu

4. **Forcer refresh**
   - Ctrl+F5 (hard reload)
   - Vider cache navigateur

---

## Code Modifié

### Game.js
```javascript
// Propriété debounce
this.escapePressed = false;

// Event listener
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !this.escapePressed) {
        this.escapePressed = true;
        setTimeout(() => { 
            this.escapePressed = false; 
        }, 300);
        
        if (this.gameState.isState(GameStates.RUNNING)) {
            this.pauseGame();
        } else if (this.gameState.isState(GameStates.PAUSED)) {
            this.resumeGame();
        }
    }
});
```

### UISystem.js
```javascript
hidePauseMenu() {
    if (this.pauseMenu) {
        this.pauseMenu.classList.remove('active');
    }
    // Resume properly!
    if (window.game && window.game.gameState.isState(GameStates.PAUSED)) {
        window.game.resumeGame();
    }
}
```

---

## Résultat Attendu

✅ **ESC ouvre le menu pause**
✅ **ESC ferme le menu pause**
✅ **Bouton Reprendre fonctionne**
✅ **Pas de toggles rapides**
✅ **Navigation menu fluide**
✅ **Options accessibles**
✅ **Quitter fonctionne**

**Si tous les tests passent, ESC fonctionne correctement!** 🎮
