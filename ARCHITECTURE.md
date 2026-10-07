# 🧠 Architecture — Space InZader

## Principes

1. **Le contenu est piloté par les données.** Armes, ennemis, passifs, keystones, synergies, vaisseaux et événements sont décrits dans `data/`. Ajouter du contenu revient presque toujours à ajouter une entrée de données.
2. **Le moteur est pur et sans DOM.** Tout ce qui est dans `engine/` et `ai/` tourne sous Node. C'est ce qui permet les tests et le bot d'équilibrage.
3. **Une seule porte d'entrée pour les dégâts.** Tout dégât passe par `engine/Combat.ts`, quelle que soit sa source (projectile, rayon, zone, compétence, événement). Mort, butin, vol de vie, statuts et synergies sont donc gérés à un seul endroit.
4. **Simulation à pas fixe (60 Hz)** dans `App.tsx`, avec un accumulateur. Le jeu tourne à la même vitesse sur un écran 60, 144 ou 240 Hz. L'horloge du moteur est `state.time` (ms), figée en pause. Ne jamais utiliser `performance.now()` dans le moteur.

## Arborescence

```
types.ts            Tous les types partagés (GameState, Entity, Weapon, Stats…)
constants.ts        Réglages globaux : monde, contrôles, INITIAL_STATS, couleurs, zoom caméra
data/               CONTENU
  weapons.ts        24 armes            → behavior.kind → WeaponSystem.FIRE_HANDLERS
  enemies.ts        ennemis + boss      → ai → AI_BEHAVIORS, attacks → ATTACK_PATTERNS
  passives.ts       30 passifs
  keystones.ts      9 keystones (modificateurs conditionnels / à l'échelle)
  synergies.ts      7 synergies par tags
  ships.ts          7 vaisseaux
  events.ts         4 événements        → EventSystem.EVENT_HANDLERS
engine/             LOGIQUE (sans DOM)
  CoreEngine.ts     updateGameState() : un pas de simulation, ordre des sous-systèmes
  GameFactory.ts    createInitialState(shipId)
  EnemyFactory.ts   spawnEnemy() depuis data/enemies
  Combat.ts         damageEnemy / killEnemy / explode / damagePlayer / statuts
  WeaponSystem.ts   tir des armes, drones, projectiles spéciaux, zones
  EnemyAttacks.ts   motifs de tir ennemis
  DamageEngine.ts   couches bouclier > armure > coque, résistances
  StatsCalculator.ts stats du joueur (vaisseau + passifs + synergies + keystones + événements)
  Conditions.ts     conditions & sources d'échelle des modificateurs dynamiques
  Synergies.ts      comptage des tags, paliers actifs, mécaniques
  Progression.ts    choix au level-up (pondéré) et application
  EventSystem.ts    événements environnementaux (alerte → actif → fin)
  Meta.ts           sauvegarde localStorage, records, déblocages
  SoundEngine.ts    musique MP3 + sons procéduraux (no-op hors navigateur)
  InputManager.ts   clavier, souris, commandes virtuelles tactiles
ai/EnemyAI.ts       pilotage des ennemis (AI_BEHAVIORS)
render/             DESSIN Canvas uniquement (lit l'état, ne le modifie pas)
components/         UI React : HUD, menus, contrôles tactiles
App.tsx             boucle de jeu, caméra, orchestration UI ↔ moteur
tests/              tests Vitest + helpers + bot
scripts/            rapport d'équilibrage (npm run balance)
```

## Boucle d'un pas (`updateGameState`)

1. Stats du joueur recalculées (les keystones conditionnelles changent en continu), mécaniques de synergie.
2. Passage de vague, apparition du boss.
3. Événements environnementaux.
4. Contrôles joueur → compétences → armes (`WeaponSystem`).
5. IA et tirs des ennemis.
6. Séparation des ennemis, physique des projectiles, aimantation de l'XP.
7. Zones (feu, gravité, frappes), statuts (brûlure, ralenti).
8. Collisions (QuadTree) → `Combat`.
9. Chaleur, régénération du bouclier et de la coque, apparitions, particules.
10. Fin de partie ou level-up (callbacks vers l'UI).

## Guides : ajouter du contenu

### Une arme
Ajoute une entrée dans `data/weapons.ts`. Choisis un `behavior.kind` existant (`projectile`, `beam`, `chain`, `pulse`, `strike`, `drone`, `flame`, `mine`) et ses paramètres (`count`, `spread`, `pierce`, `homing`, `explodeRadius`, `burn`, `slow`, `knockback`, `split`, `gravity`, `fireZone`, `autoTarget`…). Les `tags` comptent pour les synergies.
Bonus de niveau : `tech: { 2: {...}, 3: {...} }` (fusionnés dans `behavior` par `weaponBehavior(w)`) et `techNotes: ['Tech II', 'Tech III']` pour le texte affiché. Les dégâts et la cadence montent automatiquement via `TECH_MULTIPLIERS`.
Mesure ton arme avec `npm run bench:weapons` (DPS mono-cible, de foule, nombre de kills contre une nuée, part du temps sans surchauffe) et compare-la aux autres.
Pour un **nouveau type de tir**, ajoute la valeur dans `WeaponKind` (types.ts) et une routine dans `FIRE_HANDLERS` (WeaponSystem.ts).

### Un ennemi
Ajoute une entrée dans `ENEMIES` (`data/enemies.ts`) : stats, `ai`, `attacks`, `drops`, `shape`, `color` et `spawnWeight(wave)` (0 = jamais). Pour un boss : `isBoss: true` et ajoute son id dans `BOSS_ROTATION`.
- Nouvelle IA : entrée dans `AI_BEHAVIORS` (ai/EnemyAI.ts) et dans le type `AIBehavior`.
- Nouveau motif de tir : entrée dans `ATTACK_PATTERNS` (engine/EnemyAttacks.ts) et dans `AttackPatternId`.
- Nouvelle forme : cas dans `drawShape` (render/ShipRenderer.ts) et dans `ShipShape`.

### Un passif / une keystone
Ajoute une entrée de `modifiers` sur une stat de `Stats`. `additive` ajoute, `multiplicative` multiplie (1.10 = +10 %).
- `condition: 'highHeat' | 'lowHull' | 'stationary' | 'shieldDown' | 'overheated'` : actif seulement si la condition est vraie.
- `scaling: { source: 'hitStreak' | 'droneCount' | 'comboCount' | 'onHitStacks', max }` : vaut `value × min(source, max)`.
- Nouvelle condition ou source : `engine/Conditions.ts` + type dans `types.ts`.
- Nouvelle **stat** : ajoute-la dans `Stats` (types.ts) et `INITIAL_STATS` (constants.ts), puis utilise-la dans le moteur. Si c'est un entier (nombre de projectiles…), ajoute-la aussi à `INTEGER_STATS` (pas de rendement dégressif).

### Une synergie
Entrée dans `data/synergies.ts` : `tags` comptés et `tiers` (paliers croissants, avec `modifiers` et/ou `mechanic`). Une nouvelle mécanique s'ajoute dans `MechanicId` puis se code avec `hasMechanic(state, '…')`.

### Un vaisseau
Entrée dans `data/ships.ts` : `stats` (remplacent `INITIAL_STATS`), `startingWeapon`, `signatureKeystone`, `preferredTags` (ces améliorations sortent ×2.5 plus souvent), `unlock` (optionnel).

### Un événement
Valeur dans `EnvEventType` (types.ts), définition dans `data/events.ts` (durée, alerte, vague minimale, `playerModifiers`), comportement dans `EVENT_HANDLERS` (engine/EventSystem.ts).

## Tests

- `npm test` lance les tests de `tests/`, sans navigateur, en quelques secondes. Ils couvrent :
  - l'intégrité des données : ids uniques et références valides (une faute de frappe dans `data/` casse un test) ;
  - les dégâts et les stats ;
  - chaque arme, en vérifiant qu'elle inflige réellement des dégâts ;
  - les ennemis et les boss ;
  - les keystones, synergies et passifs ;
  - les événements et la méta-progression ;
  - des parties complètes simulées (pas de NaN, pas de crash, la progression avance).
- Helpers (`tests/helpers.ts`) :
  - `makeState({ weaponIds, noSpawn })` crée un état de test ;
  - `addEnemy(state, type, dx, dy)` place un ennemi ;
  - `run(state, secondes, { keys, mouse })` fait avancer la simulation ;
  - `seedRandom(n)` rend l'aléatoire déterministe.
- `npm run bench:weapons` : banc d'essai des armes (Tech I et III) sur mannequins fixes ancrés et sur une nuée.
- `npm run balance` : le bot de `tests/bot.ts` joue N parties par vaisseau et affiche survie, vague, kills, dégâts, et les dégâts subis par source. Variables d'environnement : `BALANCE_RUNS`, `BALANCE_SECONDS`.

## Pièges connus

- Si Vite affiche « does not provide an export named … » après de grosses modifications, c'est un cache HMR périmé : redémarre `npm run dev`.
- HUD (`components/HUD.tsx`) : données d'affichage calculées par des fonctions pures dans `components/hud/model.ts` (testées dans `tests/hud.test.ts`), briques visuelles dans `components/hud/widgets.tsx`. Disposition bureau dessinée pour 1280×720 puis agrandie (`hudLayout` : ×1.5 en 1080p, ×2 en 1440p) ; en dessous de ×0.9, disposition compacte (téléphone, petite fenêtre) qui laisse libres les coins des boutons tactiles. Polices : Orbitron (titres), Chakra Petch (`font-hud`, libellés), JetBrains Mono (`font-mono`, chiffres). Menus agrandis par paliers sur grand écran (classe `.ui-zoom`, `index.css`). La caméra dézoome sur petit écran (`viewScaleFor`).
