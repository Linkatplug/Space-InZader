# 🚀 Space InZader : Technical Documentation

**Space InZader** est un Roguelite Spatial Tactique haute performance construit avec React et l'API Canvas.

## 🛠 Stack Technique
- **Framework** : React 19
- **Langage** : TypeScript (TSX)
- **Rendu** : HTML5 Canvas (2D Context)
- **Style** : Tailwind CSS (Utility-first)
- **Build Tool** : Vite (pour le développement local)

## 🧠 Architecture du Moteur
Le jeu utilise un pattern de **découplage Moteur/Rendu** pour garantir 60 FPS constants même avec des centaines d'objets :

1.  **CoreEngine (Moteur de Logique)** : 
    - L'état du jeu (`GameState`) est stocké dans un `useRef` (mutable).
    - Cela évite les re-renders inutiles de React qui tueraient les performances.
    - La logique de collision utilise un **QuadTree** pour passer d'une complexité O(n²) à O(n log n).

2.  **CoreRenderer (Moteur de Rendu)** :
    - Utilise `requestAnimationFrame` pour synchroniser le dessin avec le rafraîchissement de l'écran.
    - Système de couches (Background > Particles > Entities > VFX > HUD).

3.  **StatsCalculator (Système de Synergies)** :
    - Implémentation d'un **rendement dégressif** (Diminishing Returns).
    - Formule : `BonusEffectif = Σ (0.8^i)` pour chaque stack. Cela permet d'empiler les passifs sans casser l'équilibrage.

## 🛠 Installation & Lancement Local

### Prérequis
- [Node.js](https://nodejs.org/) (Version 18 ou supérieure)

### Procédure
1.  Exporte tous les fichiers dans un dossier nommé `space-inzader`.
2.  Ouvre un terminal dans ce dossier.
3.  Installe les dépendances :
    ```bash
    npm install
    ```
4.  Lance le serveur de développement :
    ```bash
    npm start
    ```
5.  Ouvre ton navigateur sur `http://localhost:5173`.

## 🕹 Commandes de Développement
- **F3** : Activer/Désactiver l'overlay de Debug (FPS, FrameTime, Entités).
- **Mode Lab** : Accessible depuis le menu principal. Permet de modifier la physique (vitesse, dégâts, heat) en temps réel pendant que tu joues.

## 🎨 Feedback Visuel (Game Feel)
- **Hit Flash** : Les entités clignotent en blanc pur lors d'un impact.
- **Damage Numbers** : Textes flottants avec pop-animation.
    - ⚪ *Cinétique*
    - 🔵 *EM / Ions*
    - 🟠 *Thermique*
    - 🟡 *Explosif / Crit*
    - 🔴 *Dégâts Joueur*
