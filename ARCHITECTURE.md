# 🧠 Architecture Technique : Space InZader

Ce document détaille la structure interne du projet pour faciliter la compréhension et l'extension du code par de nouveaux développeurs.

## 1. Philosophie de Design
Le projet repose sur une séparation stricte entre **la Logique (Engine)**, **le Rendu (Renderer)** et **l'Interface (React UI)**.

- **Engine** : Calculs mathématiques purs, aucune notion de pixels ou de dessin.
- **Renderer** : Traduction de l'état du jeu en formes géométriques sur Canvas.
- **React UI** : Couche d'interface (HUD, Menus) qui "survole" le jeu sans interférer avec la boucle de calcul.

---

## 2. Gestion de l'État (State Management)
Contrairement à une application React classique, le jeu n'utilise pas `useState` pour la simulation temps réel.

- **`engineState` (Mutable Ref)** : L'intégralité du monde (joueur, ennemis, projectiles) est stockée dans un objet `useRef` dans `App.tsx`. Cela permet des mises à jour à 60 FPS sans déclencher de re-renders React qui ralentiraient le processeur.
- **`uiState` (React State)** : Une copie légère de l'état est synchronisée avec React uniquement pour mettre à jour le HUD et les menus.

---

## 3. La Boucle de Jeu (Game Loop)
Située dans `App.tsx`, elle utilise `requestAnimationFrame`. À chaque frame :
1. Elle calcule le `deltaTime` (temps écoulé).
2. Elle appelle `updateGameState` (Engine).
3. Elle appelle `renderGame` (Renderer).
4. Elle met à jour le HUD via React.

---

## 4. Organisation des Modules (src/)

### 📂 `engine/` (Le Cerveau)
- **`CoreEngine.ts`** : Le chef d'orchestre. Il appelle tous les autres sous-systèmes dans le bon ordre.
- **`PhysicsEngine.ts`** : Gère les déplacements de base (vitesse, inertie) et les limites du monde.
- **`CollisionSystem.ts`** : Détecte les impacts. Il utilise un **QuadTree** pour ne tester que les entités proches les unes des autres (optimisation majeure).
- **`DamageEngine.ts`** : Le simulateur de combat. Il calcule la réduction de dégâts selon les couches (Bouclier > Armure > Coque) et les résistances élémentaires.
- **`StatsCalculator.ts`** : Gère les formules mathématiques complexes, notamment le **rendement dégressif** des bonus pour éviter que le joueur ne devienne "trop fort" trop vite.
- **`AbilitySystem.ts`** : Gère les cooldowns et l'exécution des compétences actives (Dash, Nova, etc.).
- **`InputManager.ts`** : Centralise les entrées clavier et souris.

### 📂 `render/` (Les Yeux)
- **`CoreRenderer.ts`** : Définit l'ordre de dessin (le fond d'abord, puis les entités, puis les effets).
- **`ShipRenderer.ts`** : Dessine les vaisseaux à partir de primitives géométriques (pas d'images/sprites pour plus de flexibilité). Gère aussi le **Hit Flash** (clignotement blanc).
- **`EffectRenderer.ts`** : Gère tout ce qui est éphémère : particules, explosions et textes de dégâts flottants.
- **`WorldRenderer.ts`** : Dessine la grille hexagonale et les bordures du secteur.

### 📂 `components/` (L'Interface)
- **`HUD.tsx`** : Interface de combat (barres de vie, radar, chaleur).
- **`UpgradeMenu.tsx`** : Le menu de montée de niveau.
- **`DevMenu.tsx`** : Un outil surpuissant pour tester le jeu (Labo d'ingénierie).

---

## 5. Optimisations Clés

### Le QuadTree (`engine/QuadTree.ts`)
Au lieu de comparer chaque projectile avec chaque ennemi (ce qui ferait des milliers de calculs par seconde), le monde est divisé en quadrants. On ne teste les collisions que dans les zones où des objets sont présents.

### Rendement Dégressif (`engine/StatsCalculator.ts`)
Pour les passifs, nous utilisons la formule : `Bonus = Σ (0.8 ^ stacks)`. 
Cela signifie que le 1er bonus est à 100% d'efficacité, le 2ème à 80%, le 3ème à 64%, etc. Cela permet de monter à l'infini sans jamais atteindre des valeurs qui cassent le jeu.

### Audio Procédural (`engine/SoundEngine.ts`)
Le jeu n'utilise pas de fichiers MP3. Les sons sont générés mathématiquement par la carte son (Web Audio API) pour une latence zéro et un poids nul.
