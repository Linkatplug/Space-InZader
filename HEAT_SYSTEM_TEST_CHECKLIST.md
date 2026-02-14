# 🔥 HEAT SYSTEM - TEST CHECKLIST

## ✅ Bug Fixed
**Le système de chaleur (heat/overheat) fonctionne maintenant correctement avec les armes automatiques.**

---

## 🎯 Manual Test Checklist

### Préparation
- [ ] Ouvrir le jeu dans le navigateur
- [ ] Ouvrir la console développeur (F12)
- [ ] Activer le debug overlay (F3) pour voir les stats en temps réel

### Test 1: Heat Accumulation (Accumulation de chaleur)
- [ ] Démarrer une partie avec n'importe quel vaisseau
- [ ] Observer le tir automatique (auto-fire)
- [ ] **Vérifier dans la console**: Logs `[Combat] Heat +X => Y/100`
- [ ] **Vérifier UI**: La barre de chaleur (heat bar) en haut à droite se remplit progressivement
- [ ] **Vérifier**: Le chiffre augmente (ex: 0/100 → 15/100 → 30/100...)

**✅ Résultat attendu**: Heat augmente à chaque tir, visible dans console ET UI

---

### Test 2: Overheat Trigger (Déclenchement de surchauffe)
- [ ] Continuer à tirer jusqu'à ce que la chaleur atteigne 100/100
- [ ] **Vérifier console**: Log `[Heat] OVERHEAT start 2.0s` apparaît
- [ ] **Vérifier UI**: 
  - La barre devient rouge vif
  - Le texte change pour "⚠️ OVERHEATED"
- [ ] **Vérifier gameplay**: Le tir s'arrête complètement

**✅ Résultat attendu**: À 100/100, overheat se déclenche, tir s'arrête, UI montre "OVERHEATED"

---

### Test 3: Fire Blocked During Overheat (Tir bloqué pendant surchauffe)
- [ ] Pendant l'overheat, observer le comportement
- [ ] **Vérifier console**: Logs `[Combat] Weapon X cannot fire - OVERHEATED (Y/100)`
- [ ] **Vérifier gameplay**: Aucun projectile n'est tiré
- [ ] **Vérifier UI**: La barre de chaleur reste rouge

**✅ Résultat attendu**: Pas de tir possible pendant overheat

---

### Test 4: Cooldown (Refroidissement)
- [ ] Pendant l'overheat, observer la chaleur diminuer
- [ ] **Vérifier UI**: Le nombre diminue (100 → 90 → 80 → 70...)
- [ ] **Vérifier**: La chaleur descend à environ 10 unités par seconde
- [ ] Attendre que la chaleur descende suffisamment

**✅ Résultat attendu**: Heat diminue progressivement pendant le cooldown

---

### Test 5: Auto-Fire Resume (Reprise du tir automatique)
- [ ] Quand le cooldown est terminé (heat < 100)
- [ ] **Vérifier console**: Log `[Heat] OVERHEAT end` apparaît
- [ ] **Vérifier UI**: La barre redevient normale (jaune/orange)
- [ ] **Vérifier gameplay**: Le tir automatique reprend immédiatement
- [ ] **Vérifier console**: Les logs `[Combat] Firing X` et `[Combat] Heat +Y` reprennent

**✅ Résultat attendu**: Tir automatique reprend après cooldown sans intervention manuelle

---

### Test 6: Cycle Complet (Full Cycle)
- [ ] Observer un cycle complet: fire → overheat → cooldown → resume
- [ ] **Vérifier**: Le cycle peut se répéter plusieurs fois
- [ ] **Vérifier console**: Pas d'erreurs JavaScript
- [ ] **Vérifier console**: Pattern de logs cohérent:
  ```
  [Combat] Heat +5 => 95.0/100
  [Combat] Heat +5 => 100.0/100
  [Heat] OVERHEAT start 2.0s
  [Combat] Weapon cannot fire - OVERHEATED
  ... (cooling)
  [Heat] OVERHEAT end
  [Combat] Firing auto_cannon Lv1
  [Combat] Heat +5 => 5.0/100
  ```

**✅ Résultat attendu**: Cycle complet fonctionne sans erreurs

---

### Test 7: Different Weapons (Armes différentes)
- [ ] Tester avec ion_blaster (heat: 8 - chauffe vite)
- [ ] Tester avec auto_cannon (heat: 5 - chauffe moyennement)
- [ ] **Vérifier**: Armes à heat plus élevé surchauffent plus vite
- [ ] **Vérifier**: Armes à heat faible peuvent tirer plus longtemps

**✅ Résultat attendu**: Différentes armes ont différents comportements de chaleur

---

### Test 8: No Breaking Changes (Aucune régression)
- [ ] **Vérifier**: Les dégâts fonctionnent toujours
- [ ] **Vérifier**: Le système de défense (shield/armor/structure) fonctionne
- [ ] **Vérifier**: Les ennemis meurent normalement
- [ ] **Vérifier**: Le joueur peut mourir normalement
- [ ] **Vérifier**: XP et level-up fonctionnent
- [ ] **Vérifier**: Upgrades fonctionnent
- [ ] **Vérifier console**: Aucune nouvelle erreur n'apparaît

**✅ Résultat attendu**: Tous les autres systèmes fonctionnent normalement

---

## 🎯 Success Criteria

### Must Have (Obligatoire)
- ✅ Heat augmente à chaque tir
- ✅ Overheat se déclenche à 100
- ✅ Tir s'arrête pendant overheat
- ✅ Heat diminue pendant cooldown
- ✅ Tir reprend automatiquement après cooldown
- ✅ Pas d'erreurs console

### Should Have (Souhaitable)
- ✅ UI claire et visible (heat bar + overheat warning)
- ✅ Logs debug informatifs
- ✅ Gameplay fluide sans lag

### Must Not Have (Doit éviter)
- ❌ Erreurs JavaScript
- ❌ Regression sur autres systèmes
- ❌ Tir qui ne reprend jamais
- ❌ Heat qui n'augmente jamais

---

## 📊 Expected Console Output

### Normal Fire Cycle
```
[Combat] Firing ion_blaster Lv1 { damageType: 'em', baseDamage: 22, heat: 8 }
[Combat] Heat +8 => 8.0/100
[Combat] Firing ion_blaster Lv1
[Combat] Heat +8 => 16.0/100
[Combat] Firing ion_blaster Lv1
[Combat] Heat +8 => 24.0/100
```

### Overheat Trigger
```
[Combat] Heat +8 => 96.0/100
[Combat] Heat +8 => 104.0/100
[Heat] OVERHEAT start 2.0s
```

### During Overheat
```
[Combat] Weapon ion_blaster cannot fire - OVERHEATED (104/100)
[Combat] Weapon ion_blaster cannot fire - OVERHEATED (98/100)
[Combat] Weapon ion_blaster cannot fire - OVERHEATED (92/100)
```

### Cooldown Complete
```
[Heat] OVERHEAT end
[Combat] Firing ion_blaster Lv1
[Combat] Heat +8 => 8.0/100
```

---

## 🐛 Known Issues to Watch For

### If Heat Never Increases
- Check console for `[Combat] Heat +X` logs
- If missing: CombatSystem not calling addHeat
- If present but heat stays 0: HeatSystem issue

### If Overheat Never Triggers
- Check if heat reaches 100/100
- Check console for `[Heat] OVERHEAT start` log
- If missing: HeatSystem addHeat not triggering overheat

### If Fire Never Resumes
- Check console for `[Heat] OVERHEAT end` log
- If missing: HeatSystem cooldown not completing
- Check if heat.overheated is stuck at true

### If UI Doesn't Update
- Check if heat component exists on player
- Check UISystem reading heat.current/max
- Check if heat bar DOM elements exist

---

## ✅ Test Complete

### Signature
- **Testeur**: _________________
- **Date**: _________________
- **Résultat**: ☐ PASS  ☐ FAIL
- **Commentaires**: 
  _______________________________________
  _______________________________________
  _______________________________________

### Bugs Found
- [ ] Aucun bug trouvé ✅
- [ ] Bugs trouvés (décrire ci-dessous):
  _______________________________________
  _______________________________________
  _______________________________________

---

## 📝 Notes Techniques

### Files Modified
- `js/systems/CombatSystem.js` - Added heat on weapon fire
- `js/systems/HeatSystem.js` - Added debug logs

### Key Changes
1. **CombatSystem**: Calls `heatSystem.addHeat(player, weaponHeat)` after each fire
2. **HeatSystem**: Logs overheat start/end for debugging
3. **No changes to**: DefenseSystem, UISystem (already correct), Game.js

### Heat Values
- **ion_blaster**: heat: 8/shot
- **auto_cannon**: heat: 5/shot
- **Max heat**: 100
- **Cooling rate**: 10/sec
- **Overheat duration**: 2 seconds minimum

---

**FIN DE LA CHECKLIST** ✅
