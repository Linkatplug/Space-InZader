# Space InZader — notes de reprise (pour Claude)

> Fichier tenu à jour pendant le travail. Si tu reprends le projet, lis tout ce fichier d'abord,
> puis la section « Journal » en bas pour savoir exactement où on s'est arrêté.

## Règles du propriétaire (Linkatplug)
- **Ne JAMAIS commit ni push** sans demande explicite. Il préfère peu de commits, gros et propres.
- **Organisation multi-sessions** : la session « Space-InZader project review » est l'ORGANISATRICE GÉNÉRALE. Tout passe par elle : elle répartit le travail, intègre, vérifie et commite. Les autres sessions (ex. « Space InZader HUD refactor ») lui rendent compte en fin de tâche. Toutes travaillent dans le MÊME dossier `H:\Space InZader` : avant de modifier un fichier, vérifier qu'aucune autre session ne travaille dessus (le dire à l'organisatrice) ; ne pas changer de branche sans prévenir ; un onglet navigateur par session (`tabs_create`) car le panneau est partagé.
- Il parle français, réponses courtes et concrètes.
- Objectif : **continuer et finir le jeu**. Liberté sur les priorités.
- Exigences : code facile à étendre/modifier (piloté par les données), et **tests automatisés** (Vitest).

## Répartition en cours (mise à jour par l'organisatrice)
- Jeu en ligne : **https://space.linkatplug.be** (Docker sur le serveur, déployé depuis Gitea). Le site GitHub Pages (github.io) n'est plus mis à jour.
- Branches gardées : `main`, `old-vision-release-v1-avant-refonte` (archive V1), branche de travail courante (`gh-pages` supprimée le 2026-10-09). Remotes : `gitea` (déploiement) et `origin` (GitHub, sauvegarde). Les branches copilot/*, codex/* ont été supprimées le 2026-10-07.
- Périmètres habituels : **session UI (« Space InZader HUD refactor »)** → `components/**`, `App.tsx`, `index.css`, tests UI (`tests/hud.test.ts`, `tests/options.test.ts`). **Organisatrice (« Space-InZader project review »)** → `engine/**`, `data/**`, `ai/**`, `render/**`, `types.ts`, autres tests.
- Tâches en cours : aucune (dernière intégration commitée et publiée le 2026-10-08).
- API moteur fournie pour les options : `GameSettings` / `DEFAULT_SETTINGS` (engine/Meta.ts), `setMusicVolume`, `setSfxVolume`, `applyAudioSettings` (engine/SoundEngine.ts), `RenderOptions.damageNumbers` (dernier paramètre de `renderGame`), `VisualEffect.kind = 'damage'`.

## Contexte
- `main` = V2 (React 19 + TypeScript + Canvas 2D, Vite). Issue de Google AI Studio, base propre mais contenu creux.
- V1 (JS vanilla, beaucoup plus de contenu) = commit `fb3e679` / branche `old-vision-release-v1-avant-refonte`.
  Lire un fichier V1 : `git show fb3e679:js/data/WeaponData.js` (aussi EnemyData, PassiveData, ShipData, SynergyData, KeystoneData, systems/WeatherSystem.js, managers/SaveManager.js, music/*.mp3).
- Branches `copilot/*` et `codex/*` = obsolètes (ciblent la V1), à ignorer.

## Lancer / vérifier
- `npm install` puis `npm run dev` (port 5173). Config preview : `.claude/launch.json` (nom `dev`).
- `npx tsc --noEmit` doit rester à 0 erreur.
- `npm test` (Vitest) — tests headless du moteur dans `tests/`.

## Déployer
- Le jeu se déploie **uniquement depuis Gitea** (`gitea` = https://git.linkatplug.be/linkatplug/Space-InZader.git) ; GitHub (`origin`) = sauvegarde (son workflow CI ne fait plus que typecheck + tests + build, plus de publication gh-pages).
- Jeu en ligne : https://space.linkatplug.be (vérifier la version en bas du menu après `update.sh`).
- Procédure : commit (sur demande du propriétaire) → `git push gitea main` puis `git push origin main` → sur le serveur, en SSH : `/home/DOCKER/space-inzader/deploy/update.sh` (pull, build Docker avec tests, relance, nettoyage des seules images `label=app=space-inzader`). Détails : DOCKER.md.
- Version affichée en bas du menu : `__BUILD__` / `__BUILD_DATE__` (vite.config.ts, env `SI_BUILD` = nombre de commits, `SI_BUILD_DATE`), formatée par `buildInfo.ts` ; en dev `v1.0.0-dev`. Servira aussi au contexte des avis F8.
- Identifiants Git dans le Gestionnaire d'identifiants Windows : ne jamais taper/demander de mot de passe ni en mettre dans une URL.

## Architecture (cible)
- `types.ts` — tous les types partagés.
- `constants.ts` — réglages globaux (monde, contrôles, stats initiales, couleurs).
- `data/` — **contenu du jeu, piloté par les données** :
  - `weapons.ts` (WEAPONS) — chaque arme a un `behavior.kind` → routine dans `engine/WeaponSystem.ts` (`FIRE_HANDLERS`).
  - `enemies.ts` (ENEMIES) — stats, `ai` → `ai/EnemyAI.ts` (`AI_BEHAVIORS`), `attacks[].pattern` → `engine/EnemyAttacks.ts` (`ATTACK_PATTERNS`), `shape` → `render/ShipRenderer.ts`, `spawnWeight(wave)`, boss en rotation (`BOSS_ROTATION`).
  - `passives.ts`, `keystones.ts`.
- `engine/` — logique pure, **sans DOM** (testable sous Node) :
  - `CoreEngine.ts` `updateGameState(state, dt, keys, mouseWorld, onLevelUp, onGameOver)` — un pas de simulation. Appelé à pas fixe 60 Hz par `App.tsx`.
  - `GameFactory.ts` `createInitialState()`.
  - `Combat.ts` — **point d'entrée unique** des dégâts : `damageEnemy`, `killEnemy`, `explode`, `damagePlayer`, statuts (brûlure, ralentissement), `nearestEnemy`.
  - `WeaponSystem.ts` — tir des armes, drones, projectiles guidés/mines/flammes, zones (feu, gravité, frappes).
  - `DamageEngine.ts` — couches bouclier > armure > coque + résistances.
  - `StatsCalculator.ts` — passifs (rendement dégressif 0.8^n) + keystones.
  - `Progression.ts` — choix d'améliorations au level-up et application.
  - `SoundEngine.ts` — Web Audio procédural (no-op hors navigateur).
- `render/` — dessin Canvas uniquement.
- `components/` — UI React (HUD, menus). `App.tsx` = boucle de jeu + orchestration.
- Temps : `state.time` (ms, horloge de simulation, figée en pause). Ne pas utiliser `performance.now()` dans le moteur.
- Tremblement d'écran : le moteur écrit `state.shake`, App le consomme.

## Feuille de route
1. [FAIT] Combat : comportements réels des 24 armes, pas fixe, pipeline de dégâts unique, ennemis data-driven (+ types V1), tests Vitest.
2. [FAIT] Progression : keystones conditionnels, port keystones V1.
3. [FAIT sauf passifs] Contenu V1 : vaisseaux, synergies. RESTE : plus de passifs.
4. [FAIT] Méta : sauvegarde, déblocages, scores, écran de fin.
5. [FAIT] Événements.
6. [FAIT] Polish (équilibrage de base via bot) : HUD responsive, mobile, musique.
7. [FAIT sauf branches] Nettoyage : README, déploiement (workflow CI). RESTE : suppression des branches obsolètes (demander).

## Journal
- 2026-10-07 — Repo cloné dans `H:\Space InZader`. Corrigé : erreurs JSX DevMenu, tsconfig types node, importmap AI Studio dans index.html, **bug des contrôles** (React StrictMode → `input.dispose()` débranchait le clavier ; ajouté `input.attach()`).
- 2026-10-07 — **Phase 1 terminée** : 24 armes avec vrais comportements (registre `FIRE_HANDLERS`), ennemis data-driven (`data/enemies.ts` : 8 ennemis + 3 boss en rotation, IA `AI_BEHAVIORS`, tirs `ATTACK_PATTERNS`), pipeline de dégâts unique (`engine/Combat.ts`), statuts brûlure/ralenti, recul, zones (feu, gravité, frappes), drones, mines, pas fixe 60 Hz, `state.time`, tir auto (F), `GameFactory`, `EnemyFactory`, `Progression` (6 emplacements, max stacks, keystones tous les 5 niveaux), `spawnEnabled`. **Vitest : 122 tests verts** (`tests/`). Vérifié en navigateur.
  Debug navigateur (dev) : `window.__SI.state()`, `window.__SI.action('spawn_enemy','tank')`, `window.__SI.start()`.
- 2026-10-07 — **Phases 2-3-4 (base) terminées** : 7 vaisseaux (`data/ships.ts`, 3 à débloquer), 9 keystones dont conditionnelles/à l'échelle (`Modifier.condition` / `Modifier.scaling` → `engine/Conditions.ts`), 7 synergies par tags (`data/synergies.ts`, mécaniques `critExplosion`/`chainExplosion`/`burnSpread`/`dashInvuln` dans Combat/Abilities), nouvelles stats (lifesteal, hullRegen, explosionRadiusMult, heatGenMult, burnMult, extraChain/Drones/Projectiles, abilityCooldownMult), stats recalculées chaque pas (`refreshPlayerStats`), tirage pondéré par tags préférés + keystone signature, méta-progression `engine/Meta.ts` (localStorage, records, historique, déblocages), `MainMenu` (choix vaisseau), `GameOverScreen` (stats + build), HUD mis à l'échelle (transform scale) + panneau synergies/keystones. **147 tests verts**.
  Astuce : si Vite affiche « does not provide an export named … » après des modifs, c'est un cache HMR périmé → redémarrer le serveur (preview_stop/preview_start).
  Astuce : sous Git Bash, les heredocs python longs avec apostrophes cassent parfois → écrire le script dans le scratchpad et l'exécuter.
- 2026-10-07 — 30 passifs (16 portés V1 : perforation, exécution, soin à l'élimination, cryo, multi-tir…, stats entières sans rendement dégressif `INTEGER_STATS`, chance → rareté `rarityWeight`). Événements data-driven (`data/events.ts` + `EVENT_HANDLERS` : météores qui blessent aussi les ennemis, trou noir qui mange l'XP, éruption solaire, tempête magnétique ; alerte → actif ; `playerModifiers` ; planification 40–70s ; bouton dev). Musique MP3 V1 dans `public/music` (playlist, repli procédural, M = muet, N = piste suivante, réglage sauvegardé). Mobile : `components/TouchControls.tsx` (joystick, dash/nova, pause), `state.autoAim`/`analogMove`, zoom caméra `viewScaleFor`, menus `justify-[safe_center]`. **166 tests verts**.
- 2026-10-07 — Bot d'équilibrage (`tests/bot.ts`, `npm run balance`, `vitest.balance.config.ts`) + suivi `damageBySource`/`lastHitBy` (« Détruit par » en fin de partie). Équilibrage : refroidissement 15→25, reprise après surchauffe à 50% (`OVERHEAT_RECOVERY`), Tireur/Sniper/Kamikaze adoucis, drones nerfés. Tailwind installé localement (v3, `tailwind.config.js`, `index.css`) au lieu du CDN, `base: './'`, workflow `.github/workflows/ci.yml` (tests + déploiement gh-pages). README + ARCHITECTURE réécrits (guides « ajouter du contenu »). HUD synchronisé à 30 Hz. **166 tests verts, build OK, vérifié en navigateur (dev + build prod + mobile)**.
- 2026-10-07 — Tout fusionné dans main (PR #37), CI + déploiement gh-pages OK, site en ligne https://linkatplug.github.io/Space-InZader/.
- 2026-10-07 — Une AUTRE SESSION refait l'UI (HUD/menus, branche ui-lisibilite) : NE PAS toucher components/ ici. Cette session : branche `gameplay-equilibrage` — banc `npm run bench:weapons` (scripts/weapons.test.ts), harmonisation des 24 armes (chiffres, noms FR, descriptions), bonus de Tech par arme (`Weapon.tech`, `Weapon.techNotes`, `weaponBehavior()`), Onde de choc touche le bord des ennemis, mines 8s, tags passifs corrigés, rééquilibrage vaisseaux. 171 tests verts. À SIGNALER à la session UI : afficher `techNotes[level-1]` dans UpgradeMenu quand on améliore une arme.
- 2026-10-07 — **Refonte UI lisibilité** (branche `ui-lisibilite`, session séparée) : HUD réécrit (`components/hud/model.ts` pur + tests `tests/hud.test.ts`, `widgets.tsx`), échelle 1280×720 + disposition compacte mobile, barre de boss, alerte surchauffe centrale, keystones actives/inactives, synergies avec paliers + infobulles, menu pause avec build complet (+ abandon), level-up avec stats d'arme et progression de synergie (touches 1/2/3), polices Chakra Petch / JetBrains Mono. Preview sur port 5174 (config `dev-ui`).
- 2026-10-07 — Intégration (organisatrice) : travail UI + gameplay réunis sur `gameplay-equilibrage`. Constante unique `BOSS_WAVE_INTERVAL` / `isBossWave` (data/enemies.ts, utilisée par CoreEngine et le HUD). Arcs bouclier/chaleur autour du vaisseau (`drawPlayerGauges`, render/CombatRenderer.ts). **189 tests verts, build OK, vérifié en navigateur.** Commité sur `gameplay-equilibrage` (à fusionner dans main via PR → déclenche le déploiement).
- 2026-10-09 — **Rythme des niveaux** (retour joueur : niveaux 2→5 toutes les ~4 s). Courbe d'XP pilotée par `XP_CURVE` / `xpForLevel` (constants.ts) : ancienne courbe 60 × 1,3^(n−1) (la difficulté est équilibrée dessus) avec un plancher 260 + 45·(n−1) qui ne ralentit que les ~10 premiers niveaux. **Bot réaliste** : cerveau dans `engine/Bot.ts` (`botThink`, `botPickUpgrade`), ramasse XP/butin, esquive au contact ; utilisé par tests/bot.ts ET en jeu : **touche cachée F9** (aussi en production, bascule bot ON/OFF sur la partie en cours ; F8 réservé pour plus tard) ou dev `__SI.bot()`, `__SI.botLog()`, `__SI.bot(false)` ; une partie où le bot a joué n’est pas enregistrée. Mesures (8 parties/vaisseau) : niveau 2 à ~15 s puis ~10–15 s entre niveaux les 2 premières minutes ; survie 310–489 s (ancienne courbe : 360–521 s). Outil `npm run pacing` (scripts/pacing.test.ts, `BotResult.levelTimes`). Aussi dans l'arbre : musique par contexte (`setMusicContext`, engine/SoundEngine.ts + tests/music.test.ts, session Sound Designer ; câblée dans App.tsx par la session HUD). 276 tests verts.
- 2026-10-09 — **Musique par contexte complète** : 8 MP3 dédiés dans `public/music/` (menu, combat-1/2/3 selon la vague, boss, event, gameover, record ; ~31 Mo), registre `MUSIC_CONTEXTS` (engine/SoundEngine.ts, session Sound Designer). App.tsx : fin de partie dans `finishRun` → `startBGM()` puis `setMusicContext('record' | 'gameover')` (record = meilleur score ou vague, jamais pour une partie bot ; plus de `stopBGM` derrière), retour au menu → 'menu', événements → 'event' puis combat/boss. Vérifié en navigateur. 278 tests verts.
- 2026-10-09 — **Enchaînements musicaux** (retour joueur) : après une anomalie, la musique d'avant reprend à sa position (`MUSIC_INTERRUPTIONS` = event) ; un changement de palier de combat attend la fin du morceau en cours (`MUSIC_WAIT_TRACK_END` = combat, règle pure `musicTransition`), le boss coupe tout de suite. engine/SoundEngine.ts (`pending`, `resume`, `switchTrack`, `deferredStartAt`) + tests/music-flow.test.ts (faux lecteur audio). Vérifié en navigateur. 285 tests verts.
- 2026-10-09 — **Déploiement Gitea** : Dockerfile (LABEL app=space-inzader, ARG SI_BUILD/SI_BUILD_DATE → Vite), docker-compose (build.args), `deploy/update.sh` (LF via .gitattributes, exécutable), DOCKER.md réécrit (procédure Gitea, Portainer/GitHub retiré), version dans le menu (`buildInfo.ts`, test `tests/build-info.test.ts`, `resolveJsonModule` dans tsconfig), remote `gitea` ajouté. Docker non installé sur ce PC : build d'image non testé ici (vite build avec SI_BUILD vérifié). 288 tests verts.
- 2026-10-09 — **Fin du site GitHub Pages** : jeu en ligne sur https://space.linkatplug.be (Docker, `deploy/update.sh`, dépôt Gitea). CI GitHub réduite aux vérifications (job `deploy` gh-pages retiré, `permissions: contents: read`). README : lien « Jouer en ligne » + section Déploiement Gitea. Branche `gh-pages` ensuite supprimée sur GitHub à la demande du propriétaire (github.io → 404).
- 2026-10-09 — **Avis testeurs F8 — partie serveur** (organisatrice ; la partie UI est faite par une autre session : components/feedback/**, App.tsx, menus) : contrat `FeedbackKind/Element/Snapshot/Context/Payload` (types.ts), `buildFeedbackSnapshot` (engine/FeedbackSnapshot.ts, topDamage = dégâts SUBIS, heat en %), `feedback/server.mjs` (Node pur, `POST /api/feedback`, page privée `/api/avis/<FEEDBACK_ADMIN_TOKEN>/`, purge = archive, IP jamais écrite), `feedback/Dockerfile` (utilisateur node, volume nommé `feedback-data`), nginx `/api/` (résolution DNS à la demande, IP client = dernière entrée X-Forwarded-For), `.env.example`, `.env`/`feedback/data/` ignorés (avis de dev ; surtout pas `data/` = contenu du jeu), proxy Vite `/api` → :3000. Tests : tests/feedback-snapshot.test.ts, tests/feedback-server.test.ts. Docker absent sur ce PC : images et nginx non testés ici (chaîne dev Vite → serveur vérifiée).
- IDÉES SUITE : plus d'ennemis/boss, compétences actives supplémentaires (V2 n'en a que 2), écran d'options (volume), choix de keystone par vaisseau plus marqués, sprites/effets, traduction, `metadata.json` (reliquat AI Studio) à supprimer si inutile, nettoyage des branches copilot/* (demander).
