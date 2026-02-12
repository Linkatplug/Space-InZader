# Contenu "Refonte Armement/Bonus" - Guide d'Utilisation

## 📊 Vue d'Ensemble

Le contenu de la refonte est maintenant **chargé passivement** dans le jeu. Cela signifie:
- ✅ Tous les fichiers sont présents et chargés
- ✅ Toutes les données sont accessibles via `window`
- ✅ Le gameplay actuel est **inchangé**
- ✅ Prêt pour migration future quand décidé

## 🔍 Accès aux Données

### Dans la Console du Navigateur

Ouvrir `index.html` ou `content-debug.html`, puis dans la console (F12):

```javascript
// Voir toutes les armes (24)
console.table(window.NEW_WEAPONS)

// Voir tous les modules (12)
console.table(window.ModuleData.MODULES)

// Voir tous les profils d'ennemis (7)
console.table(window.EnemyProfiles.PROFILES)

// Voir les constantes d'équilibrage
console.log(window.BalanceConstants)

// Voir les upgrades des vaisseaux (4 ships)
console.log(window.ShipUpgradeData.SHIPS)

// Voir les composants UI (6)
console.log(window.EnhancedUIComponents)
```

## 📋 Page de Debug

Ouvrir `content-debug.html` pour voir:
- Dashboard complet avec toutes les données
- Compteurs (24 armes, 12 modules, etc.)
- Listes détaillées de tout le contenu
- Bouton "Dump to Console" pour afficher tout

## 📦 Contenu Disponible

### 🎯 Armes (24)
- **EM (6)**: Anti-bouclier
- **Thermal (6)**: Anti-structure  
- **Kinetic (6)**: Anti-armure
- **Explosive (6)**: Polyvalent/AoE

### 🛡️ Modules (12)
- **Défensifs (6)**: Shield Booster, Armor Plating, etc.
- **Offensifs (6)**: EM Amplifier, Thermal Catalyst, etc.
- Tous avec **trade-offs** (bénéfices ET coûts)

### 👾 Ennemis (7)
- Défense 3 couches (Shield/Armor/Structure)
- Résistances différenciées
- Types d'attaque variés

### 🚢 Upgrades (44 total)
- **ION_FRIGATE**: 10 upgrades (spécialiste EM/Shield)
- **BALLISTIC_DESTROYER**: 11 upgrades (spécialiste Kinetic/Armor)
- **CATACLYSM_CRUISER**: 11 upgrades (spécialiste Explosive/AoE)
- **TECH_NEXUS**: 12 upgrades (spécialiste Thermal/Heat)

### 🎨 UI Components (6)
- ThreeLayerDefenseUI
- HeatGaugeUI
- WeaponDamageTypeDisplay
- DamageFloatingText
- EnemyResistanceIndicator
- LayerDamageNotification

## 🔧 Migration Future

Quand vous déciderez d'activer le nouveau système:

### Étape 1: Remplacer les Armes
```javascript
// Au lieu de:
// import from WeaponData.js

// Utiliser:
const weapons = window.NEW_WEAPONS;
```

### Étape 2: Remplacer les Modules
```javascript
// Au lieu de:
// import from PassiveData.js

// Utiliser:
const modules = window.ModuleData.MODULES;
```

### Étape 3: Activer les Ennemis
```javascript
// Utiliser les nouveaux profils:
const enemy = window.EnemyProfiles.PROFILES.SCOUT_DRONE;
// Créer la défense 3 couches:
const defense = window.EnemyProfiles.createEnemyDefense(enemy);
```

### Étape 4: Intégrer l'UI
```javascript
// Utiliser les nouveaux composants:
const defenseUI = new window.EnhancedUIComponents.ThreeLayerDefenseUI(container);
const heatUI = new window.EnhancedUIComponents.HeatGaugeUI(container);
```

## ✅ Console Output

Quand tout est chargé correctement:

```
[Content] Balance constants loaded (RESIST_CAP: 0.75, MAX_COOLING: 2.0, CRIT_CAP: 0.6/3.0)
[Content] Tag synergy rules loaded (3+ => +8%, 5+ => +18%, malus -10%)
[Content] New weapons loaded: 24
[Content] Modules loaded: 12
[Content] Enemy profiles loaded: 7
[Content] Ship upgrades loaded: 4 ships (ION_FRIGATE=10 upgrades, BALLISTIC_DESTROYER=11 upgrades, CATACLYSM_CRUISER=11 upgrades, TECH_NEXUS=12 upgrades)
[Content] Enhanced UI components loaded (6 components ready)
```

## 📝 Fichiers

### Données
- `js/data/NewWeaponData.js` - 24 armes
- `js/data/ModuleData.js` - 12 modules
- `js/data/EnemyProfiles.js` - 7 profils
- `js/data/ShipUpgradeData.js` - 4 vaisseaux avec upgrades
- `js/data/TagSynergyData.js` - Règles de synergies
- `js/data/BalanceConstants.js` - Caps et constantes

### UI
- `js/ui/EnhancedUIComponents.js` - 6 composants UI

### Debug
- `content-debug.html` - Dashboard de debug

## 🎮 État Actuel

**Le jeu fonctionne avec l'ancien système**:
- Anciennes armes de `WeaponData.js`
- Anciens bonus de `PassiveData.js`
- Ancien système de combat

**Nouveau contenu = PASSIF**:
- Chargé mais non utilisé
- Accessible pour tests
- Prêt pour migration

## ❓ Questions Fréquentes

**Q: Le nouveau contenu est-il utilisé dans le jeu?**
R: Non, il est chargé passivement. Le gameplay actuel utilise les anciens fichiers.

**Q: Comment tester le nouveau contenu?**
R: Ouvrir `content-debug.html` ou utiliser la console du navigateur.

**Q: Y a-t-il des breaking changes?**
R: Non, aucun. Le jeu fonctionne exactement comme avant.

**Q: Quand sera-t-il activé?**
R: Quand vous déciderez de faire la migration. Le contenu est prêt.

**Q: Puis-je supprimer ces fichiers?**
R: Oui, mais ils sont préparés pour la future refonte du système de combat.
