# 🚀 Space InZader

### 🎮 Jouer en ligne : **https://space.linkatplug.be**

Roguelite spatial tactique en vue de dessus : survis aux vagues, monte de niveau, combine armes, passifs et keystones pour déclencher des synergies.

Construit avec **React 19 + TypeScript + Canvas 2D** (Vite). Aucun moteur de jeu externe.

## Lancer en local

```bash
npm install
```

```bash
npm run dev
```

Puis ouvre `http://localhost:5173`.

### Commandes

| Action | Clavier / souris | Tactile |
|---|---|---|
| Se déplacer | ZQSD / WASD / flèches | joystick (moitié gauche de l'écran) |
| Viser | souris | automatique |
| Tirer | clic gauche / Espace | automatique |
| Tir automatique | F | — |
| Dash | Shift | bouton ⚡ |
| Nova EM | E | bouton 🌀 |
| Pause | P / Échap | bouton ⏸ |
| Couper le son / piste suivante | M / N | — |
| Overlay debug (FPS, entités) | F3 | — |

## Contenu

- **7 vaisseaux** (3 à débloquer) avec stats, arme de départ et keystone signature.
- **24 armes** aux comportements distincts : balles, rayons perforants, arcs électriques, ondes de choc, frappes orbitales, drones, lance-flammes, mines, missiles guidés, bombes à fragmentation, puits gravitationnels…
- **30 passifs** (rendement dégressif), **9 keystones** (dont conditionnelles : chaleur, coque basse, immobilité, série d'impacts…).
- **7 synergies** par tags, avec paliers et mécaniques spéciales (critiques explosifs, réactions en chaîne, propagation des brûlures…).
- **8 ennemis + 3 boss** en rotation toutes les 10 vagues.
- **4 événements** : pluie de météores, trou noir, éruption solaire, tempête magnétique.
- Défense en couches **bouclier → armure → coque** avec 4 types de dégâts (EM, cinétique, thermique, explosif).
- Méta-progression sauvegardée (records, historique, déblocages), musique, version mobile.

## Développement

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm test` | tests du moteur (Vitest, sans navigateur) |
| `npm run typecheck` | vérification TypeScript |
| `npm run build` | typecheck + build de production dans `dist/` |
| `npm run balance` | rapport d'équilibrage : un bot joue des parties avec chaque vaisseau |

- **Mode Lab** (menu principal → ENGINEERING_LAB) : modifie les stats en direct, fait apparaître ennemis et événements, installe n'importe quelle arme ou passif.
- **Console (dev)** : `window.__SI.state()` renvoie l'état du jeu ; `window.__SI.action('spawn_enemy', 'tank')` déclenche une action dev.

L'architecture et les guides « comment ajouter une arme / un ennemi / … » sont dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Déploiement

Le jeu est hébergé sur **https://space.linkatplug.be** (conteneur Docker + nginx), déployé depuis le dépôt Gitea `https://git.linkatplug.be/linkatplug/Space-InZader.git` avec le script `deploy/update.sh`. Procédure complète : [DOCKER.md](DOCKER.md).

GitHub sert uniquement de sauvegarde (aucun test automatique ni déploiement). Les tests tournent pendant la construction de l'image Docker : une version qui échoue n'est jamais mise en ligne. Le build utilise des chemins relatifs (`base: './'`) : il fonctionne à la racine d'un domaine comme dans un sous-chemin.

## Crédits

Musiques 8-bit issues de Newgrounds Audio Portal (fichiers `public/music/`, repris de la V1 du projet).
