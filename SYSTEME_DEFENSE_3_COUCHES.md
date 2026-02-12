# Système de Défense à 3 Couches - Documentation Française

## 🛡️ Vue d'Ensemble

Space InZader utilise un système de défense à 3 couches inspiré d'EVE Online:

```
[ BOUCLIER ] → [ ARMURE ] → [ STRUCTURE ]
```

Les dégâts traversent les couches dans cet ordre, avec des résistances spécifiques par type de dégât.

---

## 🛡 Stats de Base (Vaisseau Standard)

Baseline équilibrée pour un vaisseau standard:

| Couche | Valeur Base | Régénération | Fichier |
|--------|-------------|--------------|---------|
| **Bouclier** | 120 | 8/s (après 3s sans dégâts) | DefenseData.js:31 |
| **Armure** | 150 | 0 | DefenseData.js:35 |
| **Structure** | 130 | 0.5/s | DefenseData.js:39 |

**Total EHP brut**: 400

### Régénération

- **Bouclier**: Régénère 8 HP/s mais uniquement après 3 secondes sans subir de dégâts
- **Armure**: Ne régénère pas naturellement (nécessite modules)
- **Structure**: Régénère continuellement à 0.5 HP/s

---

## 🧱 Résistances de Base (Équilibrées)

### Les 4 Types de Dégâts

1. **EM** (Électromagnétique) - Anti-bouclier
2. **Thermal** (Thermique) - Anti-structure
3. **Kinetic** (Cinétique) - Anti-armure
4. **Explosive** (Explosif) - Polyvalent

### 🟦 Bouclier (Énergie Pure)

Le bouclier est une barrière énergétique.

| Type | Résistance | Force/Faiblesse |
|------|------------|-----------------|
| EM | **0%** | ⚠️ **FAIBLE** |
| Thermal | 20% | Normal |
| Kinetic | 40% | Résistant |
| Explosive | **50%** | ✅ **FORT** |

**Logique**: Le bouclier énergétique est vulnérable aux attaques électromagnétiques mais résiste bien aux explosions physiques.

### 🟫 Armure (Plaque Physique)

L'armure est une couche de protection mécanique.

| Type | Résistance | Force/Faiblesse |
|------|------------|-----------------|
| EM | **50%** | ✅ **FORT** |
| Thermal | 35% | Résistant |
| Kinetic | 25% | Normal |
| Explosive | **10%** | ⚠️ **FAIBLE** |

**Logique**: L'armure physique résiste bien à l'EM mais est fragile face aux explosions qui déforment le métal.

### 🔧 Structure (Cœur du Vaisseau)

La structure est le squelette interne du vaisseau.

| Type | Résistance | Force/Faiblesse |
|------|------------|-----------------|
| EM | 30% | Normal |
| Thermal | **0%** | ⚠️ **FAIBLE** |
| Kinetic | 15% | Faible |
| Explosive | 20% | Normal |

**Logique**: La structure interne est très vulnérable à la chaleur qui fait fondre les composants internes.

---

## 🎯 Logique d'Équilibrage

Chaque type de dégât a des forces et faiblesses claires:

| Type | Fort contre | Faible contre | Stratégie |
|------|-------------|---------------|-----------|
| **EM** | Bouclier (0%) | Armure (50%) | Casser les shields rapidement |
| **Thermal** | Structure (0%) | Bouclier (20%) | Finir les ennemis exposés |
| **Kinetic** | Armure (25%) | Bouclier (40%) | Percer les tanks |
| **Explosive** | Armure (10%) & Structure (20%) | Bouclier (50%) | AoE polyvalent |

### Synergies Naturelles

**EM + Thermal** (Combo optimal):
1. EM casse le bouclier rapidement
2. Thermal brûle la structure exposée
3. = Destruction rapide

**Kinetic + Explosive** (Anti-tank):
1. Kinetic perce l'armure
2. Explosive finit en AoE
3. = Excellent contre les groupes blindés

---

## 📊 Formule de Dégâts

### Calcul de Base

```javascript
Dégât final = Dégât brut × (1 - Résistance)
```

### Exemples Concrets

**Exemple 1: 100 dégâts EM sur bouclier**
```
Résistance bouclier EM = 0%
Dégât final = 100 × (1 - 0.0) = 100 dégâts
✅ Dégâts complets
```

**Exemple 2: 100 dégâts EM sur armure**
```
Résistance armure EM = 50%
Dégât final = 100 × (1 - 0.5) = 50 dégâts
⚠️ Dégâts réduits de moitié
```

**Exemple 3: 100 dégâts Explosive sur bouclier**
```
Résistance bouclier Explosive = 50%
Dégât final = 100 × (1 - 0.5) = 50 dégâts
⚠️ Peu efficace contre les shields
```

### Overflow (Débordement)

Quand une couche est détruite, les dégâts excédentaires passent à la couche suivante:

```
1. Bouclier: 50 HP restants
2. Attaque: 100 dégâts EM (0% resist)
3. Bouclier prend 50 HP et est détruit
4. 50 dégâts overflow vers Armure
5. Armure résiste à 50% EM
6. Armure prend: 50 × (1 - 0.5) = 25 dégâts
```

**Implémentation**: `DefenseSystem.js:78-125`

---

## ⚖️ Équilibrage Global EHP

### EHP Effectif par Couche

L'EHP (Effective Hit Points) varie selon le type de dégât:

**Bouclier (120 HP base)**:
- vs EM: 120 HP (0% resist)
- vs Thermal: 150 HP (20% resist)
- vs Kinetic: 200 HP (40% resist)
- vs Explosive: 240 HP (50% resist)
- **Moyenne**: ~178 EHP

**Armure (150 HP base)**:
- vs EM: 300 HP (50% resist)
- vs Thermal: 231 HP (35% resist)
- vs Kinetic: 200 HP (25% resist)
- vs Explosive: 167 HP (10% resist)
- **Moyenne**: ~224 EHP

**Structure (130 HP base)**:
- vs EM: 186 HP (30% resist)
- vs Thermal: 130 HP (0% resist)
- vs Kinetic: 153 HP (15% resist)
- vs Explosive: 163 HP (20% resist)
- **Moyenne**: ~158 EHP

### Total EHP Approximatif

**Total EHP moyen**: ~560 HP effectifs

Cela donne une bonne survie en début de partie tout en forçant l'adaptation tactique.

---

## 🔥 Refonte des Armes par Type

### 🟦 ARMES EM (6 armes - Anti-bouclier)

**Gameplay**: Suppression rapide des shields

| Arme | Dégâts | Cadence | Chaleur | Rôle |
|------|--------|---------|---------|------|
| Ion Blaster | 22 | 3.0/s | 4 | DPS anti-shield |
| EMP Pulse | 60 | 0.8/s | 15 | Burst shield |
| Arc Disruptor | 18 | 2.2/s | 6 | Chaînage shield |
| Disruptor Beam | 12 | 12.0/s | 10 | Drain continu |
| EM Drone Wing | 30 | 1.2/s | 8 | Pression |
| Overload Missile | 80 | 0.6/s | 18 | Burst AoE |

**Effets secondaires possibles**:
- Réduction de regen shield
- Désactivation temporaire de modules
- Chaînage entre ennemis

### 🔥 ARMES THERMAL (6 armes - Anti-structure)

**Gameplay**: Dégâts internes, DoT (Damage over Time)

| Arme | Dégâts | Cadence | Chaleur | Rôle |
|------|--------|---------|---------|------|
| Solar Flare | 14 | 2.5/s | 6 | DoT brûlure |
| Plasma Stream | 6 | 10.0/s | 12 | Lance-flammes |
| Thermal Lance | 120 | 0.4/s | 22 | Finisher |
| Incinerator Mine | 75 | 0.5/s | 14 | Contrôle zone |
| Fusion Rocket | 95 | 0.7/s | 18 | Burst moyen |
| Starfire Array | 20 | 2.0/s | 8 | DPS thermal |

**Effets secondaires**:
- Brûlure de structure (DoT)
- Réduction de regen structure
- Zones de chaleur persistantes

### 🟫 ARMES KINETIC (6 armes - Anti-armure)

**Gameplay**: Projectiles lourds, percée

| Arme | Dégâts | Cadence | Chaleur | Rôle |
|------|--------|---------|---------|------|
| Railgun Mk2 | 140 | 0.3/s | 28 | Percée armure |
| Auto Cannon | 16 | 4.0/s | 5 | DPS soutenu |
| Gauss Repeater | 45 | 1.5/s | 10 | Burst moyen |
| Mass Driver | 90 | 0.6/s | 20 | Impact lourd |
| Shrapnel Burst | 10×6 | 1.8/s | 12 | Clear zone |
| Siege Slug | 200 | 0.2/s | 35 | Ultra burst |

**Effets**:
- Pénétration partielle d'armure
- Bonus contre armure lourde
- Recul/knockback

### 💥 ARMES EXPLOSIVE (6 armes - Polyvalent)

**Gameplay**: AoE, contrôle de zone

| Arme | Dégâts | Cadence | Chaleur | Rôle |
|------|--------|---------|---------|------|
| Cluster Missile | 50 | 1.2/s | 12 | AoE spread |
| Gravity Bomb | 85 | 0.7/s | 18 | Pull + Blast |
| Drone Swarm | 30×4 | 1.0/s | 15 | Contrôle champ |
| Orbital Strike | 110 | 0.5/s | 25 | Zone burst |
| Shockwave Emitter | 40 | 1.4/s | 10 | Ring AoE |
| Minefield Layer | 60 | 0.8/s | 13 | Contrôle stable |

**Effets**:
- Bonus contre armure/structure
- Moins efficace contre shields
- AoE important

---

## 🧠 Nouveau Système de Bonus/Malus

### Fini les "+damage génériques"

On remplace par des bonus **spécifiques par type**:

**Ancienne approche** ❌:
```
+20% damage global
```

**Nouvelle approche** ✅:
```
+20% EM damage
+15% Thermal penetration
+25 Shield capacity
+50 Armor plating
```

### Types de Bonus

**Offensifs**:
- `+X% EM damage` - Augmente dégâts EM
- `+X% Thermal damage` - Augmente dégâts Thermal
- `+X% Kinetic penetration` - Pénétration armure
- `+X% Explosive radius` - Rayon AoE

**Défensifs**:
- `+X Shield max` - Capacité bouclier
- `+X% Shield resist` - Résistance bouclier
- `+X Armor max` - Points d'armure
- `+X Structure max` - Points de structure
- `+X% [Type] resist` - Résistance spécifique

---

## 🛠 Exemples de Passifs

### Défensifs (6 modules)

**Reinforced Plating** (Blindage Renforcé)
```
+50 Armure
-10% Vitesse
```
Fichier: `ModuleData.js:59`

**Shield Harmonizer** (Harmoniseur de Bouclier)
```
+40 Bouclier
-5% Damage global
```
Fichier: `ModuleData.js:25`

**Reactive Armor** (Armure Réactive)
```
+10% Résistance au type reçu récemment
-10% Regen bouclier
```
Fichier: `ModuleData.js:67`

**Nano Core** (Cœur Nano)
```
+40 Structure
-10% Portée de ramassage
```
Fichier: `ModuleData.js:76`

**Shield Recharger** (Rechargeur de Bouclier)
```
+3 Regen bouclier/s
+10% Génération chaleur
```
Fichier: `ModuleData.js:34`

**Damage Control** (Contrôle des Dégâts)
```
+8% Toutes résistances
Cap résistances à 75%
```
Fichier: `ModuleData.js:85`

### Offensifs (6 modules)

**EM Amplifier** (Amplificateur EM)
```
+20% Dégâts EM
+10% Chaleur armes EM
```
Fichier: `ModuleData.js:99`

**Thermal Overdrive** (Surchauffe Thermique)
```
+20% Dégâts Thermal
+5% Chaleur passive
```
Fichier: `ModuleData.js:108`

**Kinetic Stabilizer** (Stabilisateur Cinétique)
```
+15% Pénétration Kinetic
-8% Cadence de tir
```
Fichier: `ModuleData.js:117`

**Warhead Expansion** (Extension Ogive)
```
+20% Rayon AoE
-10% Dégâts mono-cible
```
Fichier: `ModuleData.js:126`

**Targeting AI** (IA de Ciblage)
```
+15% Cadence de tir
+15% Génération chaleur
```
Fichier: `ModuleData.js:135`

**Overheat Core** (Cœur Surchauffe)
```
+30% Dégâts
+40% Génération chaleur
```
Fichier: `ModuleData.js:144`

---

## 👾 Ennemis avec Résistances

### Profils d'Ennemis (7 types)

**Drone Scout**
```
Shield: 150 | Armure: 50 | Structure: 60
Faiblesse: Kinetic (armure faible)
Attaque: EM
```
⚡ Petit et rapide, shield élevé

**Armored Cruiser** (Croiseur Blindé)
```
Shield: 40 | Armure: 300 | Structure: 150
Faiblesse: Explosive (armure massive)
Attaque: Kinetic
```
🛡️ Tank lourd, peu de shield

**Plasma Entity** (Entité Plasma)
```
Shield: 80 | Armure: 40 | Structure: 200
Faiblesse: Thermal (structure fragile)
Attaque: Thermal
```
🔥 Structure élevée, peu d'armure

**Siege Hulk** (Mastodonte de Siège)
```
Shield: 60 | Armure: 250 | Structure: 300
Faiblesse: Explosive
Attaque: Explosive
```
💪 Ultra tanky sur toutes les couches

**Interceptor**
```
Shield: 120 | Armure: 70 | Structure: 80
Faiblesse: Aucune (équilibré)
Attaque: EM/Kinetic
```
⚡ Rapide, équilibré

**Elite Destroyer** (Boss)
```
Shield: 300 | Armure: 400 | Structure: 500
Faiblesse: Explosive
Attaque: Kinetic
```
👑 Boss puissant

**Void Carrier** (Boss)
```
Shield: 500 | Armure: 300 | Structure: 400
Faiblesse: EM
Attaque: Explosive
```
👑 Boss ultime, shield massif

### Stratégie contre Ennemis

| Ennemi | Build Recommandé | Raison |
|--------|------------------|--------|
| Scout | Kinetic | Armure faible |
| Cruiser | Explosive | Armure massive |
| Plasma | Thermal | Structure exposée |
| Hulk | Explosive | Tank général |
| Interceptor | Hybride | Pas de faiblesse |
| Destroyer | Explosive | Équilibré |
| Carrier | EM | Shield énorme |

---

## 🎯 Méta Stratégique

### Choix de Build

Le joueur doit maintenant **spécialiser** son build:

**Build EM (Brise-bouclier)**:
```
✅ Casse shields ultra-vite
❌ Galère contre tanks blindés
🎯 Bon contre: Scouts, Carriers
```

**Build Kinetic (Brise-armure)**:
```
✅ Excellent anti-tank
❌ Lent contre shields
🎯 Bon contre: Cruisers, Destroyers
```

**Build Thermal (Finisher)**:
```
✅ Finit les ennemis exposés
❌ Faible early (shields up)
🎯 Bon contre: Plasma, Boss endgame
```

**Build Explosive (Polyvalent)**:
```
✅ Clear de swarms, AoE
❌ Faible vs shields
🎯 Bon contre: Groupes, Tanks
```

**Build Hybride (Adaptatif)**:
```
✅ S'adapte à tout
❌ Pas de spécialisation
🎯 Bon pour: Débutants, situations variées
```

---

## 🧬 Synergies Avancées

### Combos Naturels

**EM + Thermal** (Combo Optimal):
```
Phase 1: EM Blaster casse shield (0% resist)
Phase 2: Shield down
Phase 3: Thermal Lance brûle structure (0% resist)
Résultat: ⚡ Destruction ultra-rapide
```

**Kinetic + Explosive** (Anti-Tank):
```
Phase 1: Railgun perce armure (25% resist)
Phase 2: Armure affaiblie
Phase 3: Orbital Strike finit en AoE (10% resist armor)
Résultat: 💥 Clear de tanks en groupe
```

**Thermal + Explosive** (Boss Killer):
```
Phase 1: Focus Thermal sur structure
Phase 2: AoE Explosive pour adds
Phase 3: Finish Thermal sur boss
Résultat: 👑 Optimal contre boss
```

### Anti-Synergies

**EM + Kinetic** ⚠️:
```
Problème: Les deux faibles contre leur couche opposée
EM: Mauvais vs armure (50% resist)
Kinetic: Mauvais vs shield (40% resist)
Résultat: ❌ Pas de combo naturel
```

---

## ⚖️ Équilibrage Important

### Ce qu'on ÉVITE ❌

❌ **Une arme universelle dominante**
- Chaque type a des forces/faiblesses claires

❌ **Une seule stat dominante**
- Les bonus sont spécifiques par type

❌ **Shield trop fort early**
- Shield = 120 HP seulement
- Regen nécessite 3s sans dégâts

❌ **Immortalité par stacking résistances**
- Cap à 75% maximum
- Stacking additif, pas multiplicatif

### Ce qu'on FAVORISE ✅

✅ **Diversité des builds**
- 4 types de dégâts viables
- Chacun a son gameplay

✅ **Adaptation tactique**
- Différents ennemis = différentes stratégies
- Obligation de s'adapter

✅ **Spécialisation récompensée**
- Synergies de tags (+8% à 3 items, +18% à 5)
- Builds focus plus puissants

✅ **Skill-based gameplay**
- Gestion de la chaleur
- Choix tactiques importants
- Pas de auto-win button

---

## 📁 Fichiers d'Implémentation

### Fichiers de Données

| Fichier | Description | Lignes Clés |
|---------|-------------|-------------|
| `DefenseData.js` | Stats défense + résistances | 29-79 |
| `NewWeaponData.js` | 24 armes par type | Tout |
| `ModuleData.js` | 12 modules bonus/malus | 25-144 |
| `EnemyProfiles.js` | 7 profils ennemis | Tout |
| `BalanceConstants.js` | Caps et limites | Tout |

### Fichiers Systèmes

| Fichier | Description | Fonction Clé |
|---------|-------------|--------------|
| `DefenseSystem.js` | Gestion 3 couches | `applyDamage()` |
| `HeatSystem.js` | Gestion chaleur | `updateHeat()` |
| `CombatSystem.js` | Calcul dégâts | `calculateDamageWithDefense()` |
| `CollisionSystem.js` | Application dégâts | `damageEnemy()` |

### Fichiers de Tests

| Fichier | Description |
|---------|-------------|
| `test-new-systems.html` | Tests systèmes de base |
| `test-balance-validation.html` | Tests d'équilibrage |

---

## 🧪 Validation du Système

### Tests de Base

✅ **Defense System**
- 3 couches fonctionnelles
- Overflow correct
- Régénération par couche

✅ **Damage Types**
- 4 types distincts
- Résistances appliquées
- Formule correcte

✅ **Weapon System**
- 24 armes implémentées
- Tags et synergies
- Génération chaleur

### Tests d'Équilibrage

✅ **Pas d'invincibilité**
- Cap résistance 75%
- Stacking additif

✅ **Pas de meta dominante**
- Chaque type a contre-play
- EHP moyen équilibré

✅ **Progression raisonnable**
- Tiers additifs (0/12/24/40/60%)
- Pas exponentiel

---

## 🎮 Guide du Joueur

### Pour Débuter

1. **Comprendre les couches**:
   - Shield = première ligne
   - Armor = deuxième ligne
   - Structure = dernière ligne (mort si 0)

2. **Connaître les types**:
   - EM = anti-shield (cyan ✧)
   - Thermal = anti-structure (orange ✹)
   - Kinetic = anti-armor (blanc ⦿)
   - Explosive = AoE (rouge 💥)

3. **Choisir sa spécialisation**:
   - Early: EM pour shields
   - Mid: Kinetic pour tanks
   - Late: Thermal pour finir
   - Toujours: Explosive pour swarms

### Pour Progresser

**Build EM Focus**:
```
Armes: Ion Blaster + Arc Disruptor
Modules: EM Amplifier + Shield Booster
Tags: 5+ EM items = +18% damage
Résultat: Delete shields en 2 secondes
```

**Build Kinetic Tank**:
```
Armes: Railgun + Auto Cannon
Modules: Armor Plating + Kinetic Stabilizer
Tags: 5+ Kinetic items = +18% penetration
Résultat: Percer n'importe quelle armure
```

**Build Thermal Boss Killer**:
```
Armes: Thermal Lance + Plasma Stream
Modules: Thermal Catalyst + Structure Reinforcement
Tags: 5+ Thermal items = +18% damage
Résultat: Burn boss structures
```

---

## 📊 Résumé Technique

### Formules Clés

**Dégâts**:
```javascript
damageFinal = damageRaw * (1 - resistance)
```

**Overflow**:
```javascript
remainingDamage = overflow / (1 - nextLayerResistance)
```

**EHP**:
```javascript
EHP = HP / (1 - resistance)
```

**Crit**:
```javascript
expectedDamage = baseDamage * (1 + critChance * (critDamage - 1))
// Max: 1 + 0.6 * (3 - 1) = 2.2x
```

### Constantes Importantes

```javascript
RESISTANCE_CAP = 0.75          // 75% max
MAX_COOLING_BONUS = 2.0        // 200% max
MAX_CRIT_CHANCE = 0.60         // 60% max
MAX_CRIT_DAMAGE = 3.0          // 300% max
```

---

## ✅ Conclusion

Le système de défense à 3 couches est **COMPLET et FONCTIONNEL**.

**Toutes les spécifications sont implémentées**:
- ✅ 3 couches défensives
- ✅ 4 types de dégâts
- ✅ Résistances par couche
- ✅ 24 armes spécialisées
- ✅ 12 modules bonus/malus
- ✅ 7 profils d'ennemis
- ✅ Système de synergies
- ✅ Équilibrage validé

**Le système force la spécialisation et l'adaptation tactique** comme prévu dans le cahier des charges.

🎮 **Prêt pour le gameplay!**

---

*Documentation créée: 2026-02-12*
*Version: 1.0*
*Langue: Français*
