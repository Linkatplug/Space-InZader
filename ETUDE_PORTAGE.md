# Étude de portage complète — Space InZader

## 1) Résumé exécutif

Le jeu est **déjà bien structuré pour un portage**: logique séparée par systèmes (mouvement, IA, combat, rendu, UI, vagues), contenu majoritairement data-driven (armes/passifs/ennemis dans des fichiers dédiés), boucle de jeu claire et déterministe, et faible dépendance à des frameworks externes (vanilla JS + Canvas).【F:js/Game.js†L68-L94】【F:js/Game.js†L1241-L1266】【F:js/data/WeaponData.js†L30-L46】

👉 Le portage le plus simple/rapide vers un rendu plus riche est **Godot 4 (2D)** ou **Unity 2D (URP)**.

- **Godot 4**: excellent ratio qualité/complexité pour un petit/moyen scope, pipeline 2D/Shader moderne, export desktop/mobile/web, GDScript rapide à itérer.
- **Unity 2D (URP)**: plus industriel et très fort sur outillage/asset store, mais overhead plus élevé (setup, architecture, build).

Si ton objectif est “beaux graphismes rapidement”, je recommande:
1. **Portage gameplay vers Godot 4** (logique + data),
2. **Refonte visuelle progressive** (sprites, VFX GPU, lighting 2D, post-process),
3. **Optimisation mobile/desktop** par paliers.

---

## 2) Diagnostic technique du jeu actuel (important pour le portage)

### 2.1 Architecture et boucle

- Le cœur s’appuie sur une architecture **ECS maison** (`Entity`, `World`, composants), ce qui facilite la transposition vers un moteur moderne (Node/components Godot, MonoBehaviour/ScriptableObject Unity, etc.).【F:js/core/ECS.js†L8-L35】【F:js/core/ECS.js†L41-L79】
- La boucle appelle les systèmes dans un ordre explicite: wave → synergies → movement → ai → combat → weather → collision → spawn → pickup → particles → effets écran. Cet ordre est déjà proche d’un pipeline “simulation frame”.【F:js/Game.js†L1241-L1266】

### 2.2 Rendu et effets

- Le rendu est Canvas 2D avec starfield parallax, glow/shadow, trails, particules, UI overlay HTML/CSS.【F:js/systems/RenderSystem.js†L9-L24】【F:js/systems/RenderSystem.js†L28-L53】【F:js/systems/RenderSystem.js†L60-L89】
- Visuellement, le style actuel est “neon arcade” défini en grande partie dans le code (couleurs, ombres, formes), donc **très portable**, mais encore peu asset-driven (sprites/animations matériaux).【F:index.html†L16-L35】【F:js/systems/RenderSystem.js†L137-L155】

### 2.3 Données gameplay

- Les armes sont décrites de manière structurée (id, tags, niveaux, stats), parfait pour migration en JSON/Resource Scriptable data assets.【F:js/data/WeaponData.js†L18-L29】【F:js/data/WeaponData.js†L30-L46】
- La persistance est centralisée via `SaveManager` (localStorage), donc conversion vers système de save natif d’un moteur est simple (JSON file, PlayerPrefs, encrypted save).【F:js/managers/SaveManager.js†L6-L14】【F:js/managers/SaveManager.js†L70-L88】

### 2.4 Audio

- Audio hybride WebAudio + éléments audio HTML5 MP3. Ce sera à migrer vers bus audio natifs (Godot AudioBus / Unity Mixer).【F:js/managers/AudioManager.js†L6-L18】【F:js/managers/AudioManager.js†L21-L33】

---

## 3) Ce qui est pertinent pour un portage facile

## ✅ Forces

1. **Séparation claire logique/rendu** (même si pas totale): on peut garder les règles gameplay en priorité.
2. **Données de contenu déjà typées** (armes, passifs, synergies, etc.) → migration table-driven.
3. **Pas de dépendance framework web lourde** → peu de lock-in technique.
4. **Gameplay “survivor-like” standard**: patterns connus, bien supportés dans tous les moteurs.

## ⚠️ Points à anticiper

1. **Rendu immédiat Canvas** à remplacer par scène/entités du moteur.
2. **UI HTML/CSS** à refaire en UI native (Control nodes Godot / uGUI or UI Toolkit Unity).
3. **Entrées clavier + browser lifecycle** (visibility/pause) à recoder via InputMap moteur.【F:js/main.js†L26-L33】
4. **Save localStorage** à migrer (structure JSON conservable, backend différent).

---

## 4) Quel moteur choisir ? (comparatif orienté ton besoin “beaux graphismes + portage facile”)

## Option A — Godot 4 (recommandé)

**Pourquoi c’est le meilleur compromis ici :**
- Très bon 2D natif (lights, particles, shaders canvas item).
- Rapide pour prototyper/porter un gameplay déjà défini.
- Export desktop/mobile/web sans coûts licence.

**Pour les beaux graphismes :**
- Normal maps 2D + bloom + glow + gradient LUT.
- GPUParticles2D pour explosions, traînées, impacts.
- Shader par arme/enemi (dissolve, heat, electric arc).

## Option B — Unity 2D (URP)

**Pourquoi tu pourrais le choisir :**
- Pipeline graphique mature, beaucoup d’assets prêts à l’emploi.
- Outils de profiling solides, bon pour montée en production long terme.

**Inconvénients pour ce projet :**
- Setup et architecture souvent plus lourds.
- Peut ralentir la phase de portage initial si équipe petite.

## Option C — Rester web mais monter en gamme visuelle

- Phaser + WebGL / PixiJS / voire Three.js 2.5D.
- C’est viable si priorité absolue = garder distribution navigateur.
- Mais pour “portage” cross-plateforme riche (desktop/mobile), Godot/Unity restent plus confortables.

---

## 5) Plan de portage recommandé (étapes concrètes)

## Phase 0 — Cadrage (2–4 jours)
- Figer un “vertical slice” du gameplay (1 ship, 3 armes, 2 types d’ennemis, 1 boss).
- Définir budget visuel: style, palette, niveau de FX, cible FPS plateforme.

## Phase 1 — Migration du cœur gameplay (1–2 semaines)
- Recréer boucle de simulation par systèmes.
- Migrer données armes/passifs/ennemis en assets.
- Vérifier équivalence TTK, cadence, densité ennemis.

## Phase 2 — Refaire le rendu propre moteur (1–2 semaines)
- Remplacer formes Canvas par sprites placeholder.
- Mettre pipeline VFX (particules, impacts, explosions, trails).
- Ajouter caméra dynamique (shake, zoom hit, chromatic subtle).

## Phase 3 — UI/UX native (4–8 jours)
- Menu, HUD, level-up choices, meta progression.
- Animations UI, feedback sélection, lisibilité mobile.

## Phase 4 — Polish graphique (2–4 semaines)
- Direction artistique finale (sprites HD, animations, VFX pass).
- Son spatialisé + bus + ducking musique/SFX.
- Profiling + optimisations.

---

## 6) Graphismes: comment passer de “correct” à “très beau”

1. **Direction artistique claire**: neon sci-fi stylisé + cohérence de palette (pas seulement des couleurs codées en dur).
2. **Assets haute qualité**: sprites vaisseaux/ennemis animés (idle, hit, death).
3. **VFX GPU**: particules volumétriques, shockwaves, trails procéduraux.
4. **Lighting 2D**: glow local, rim light, normal maps sur sprites.
5. **Post-process léger**: bloom calibré, vignette subtile, color grading.
6. **Juice gameplay**: hit-stop bref, screen shake contextuel, flash damage, sons “punchy”.

---

## 7) Mapping JS actuel → moteur cible

- `World/Entity/Components` → Nodes + scripts (Godot) / GameObjects + composants (Unity).【F:js/core/ECS.js†L41-L79】
- `MovementSystem`, `AISystem`, `CombatSystem`, `CollisionSystem` → managers/systems dans `_process` / `FixedUpdate`.【F:js/Game.js†L1255-L1260】
- `RenderSystem` → scène 2D, renderer du moteur + shaders + particle systems.【F:js/systems/RenderSystem.js†L60-L89】
- `SaveManager` → save service natif JSON (même schéma d’objets).【F:js/managers/SaveManager.js†L16-L68】
- `AudioManager` → buses/mixers, events audio, variations pitch random.【F:js/managers/AudioManager.js†L71-L96】

---

## 8) Risques et mitigation

1. **Risque: dérive du feeling gameplay**
   - Mitigation: tests A/B de valeurs clés (speed, fireRate, HP, spawn).
2. **Risque: explosion scope visuel**
   - Mitigation: milestones “visuel minimum viable” puis polish.
3. **Risque: perf mobile**
   - Mitigation: early profiling, limite draw calls, pooling agressif.

---

## 9) Recommandation finale

Si ton objectif est **portage rapide + beau rendu + coût maîtrisé**, prends **Godot 4**.

Ensuite fais un portage en 2 temps:
1. **parité gameplay** (copier le comportement actuel),
2. **upgrade visuel majeur** (assets + VFX + lighting + post-process).

Le code actuel est suffisamment modulaire pour que ce plan soit réaliste sans tout réécrire depuis zéro, surtout grâce à l’organisation en systèmes et aux données de gameplay bien définies.【F:js/Game.js†L68-L94】【F:js/core/ECS.js†L41-L79】【F:js/data/WeaponData.js†L30-L46】
