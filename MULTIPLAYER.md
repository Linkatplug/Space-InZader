# Mode Multijoueur - Space InZader 🚀

## ⚠️ IMPORTANT - Comment Démarrer

**NE DOUBLE-CLIQUEZ PAS sur index.html !** Le multijoueur nécessite un serveur Node.js.

### Étapes Obligatoires

1. **Ouvrez un terminal** dans le dossier du jeu
2. **Installez les dépendances** (une seule fois) :
   ```bash
   npm install
   ```
3. **Démarrez le serveur** :
   ```bash
   npm start
   ```
4. **Ouvrez votre navigateur** à : `http://localhost:3000`

⚠️ **N'ouvrez PAS le fichier index.html directement !**

---

## Description

Le mode multijoueur permet à 2 joueurs de jouer en coopération contre les vagues d'ennemis. Un joueur héberge la partie et partage un code de salle avec l'autre joueur.

## Configuration du Serveur

### Prérequis
- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

### Installation

1. Installer les dépendances :
```bash
npm install
```

2. Démarrer le serveur :
```bash
npm start
```

Le serveur démarre sur le port 3000 par défaut. Vous verrez :
```
Space InZader Multiplayer Server running on port 3000
Open http://localhost:3000 to play
```

## Comment Jouer en Multijoueur

### Pour l'Hôte (Joueur 1)

1. Ouvrez le jeu dans votre navigateur : `http://localhost:3000`
2. Cliquez sur **MULTIJOUEUR** dans le menu principal
3. Attendez la connexion au serveur (vous verrez "Connecté au serveur ✓")
4. Sélectionnez votre vaisseau
5. Cliquez sur **CRÉER UNE PARTIE**
6. Un code à 6 caractères s'affiche - **partagez ce code** avec le Joueur 2
7. Attendez que le Joueur 2 rejoigne
8. Cliquez sur **START GAME** quand les deux joueurs sont prêts

### Pour le Joueur 2

1. Ouvrez le jeu dans votre navigateur : `http://localhost:3000`
2. Cliquez sur **MULTIJOUEUR** dans le menu principal
3. Attendez la connexion au serveur (vous verrez "Connecté au serveur ✓")
4. Sélectionnez votre vaisseau
5. Cliquez sur **REJOINDRE UNE PARTIE**
6. Entrez le **code de la salle** fourni par l'Hôte
7. Entrez votre nom (optionnel)
8. Cliquez sur **REJOINDRE**
9. La partie démarre automatiquement quand l'Hôte lance le jeu

## Contrôles

- **Joueur 1 & 2** : WASD ou ZQSD pour se déplacer
- Les armes tirent automatiquement
- Ramassez les orbes d'XP verts pour gagner des niveaux
- ESC pour mettre en pause

## Synchronisation

Le serveur synchronise :
- ✅ Positions des joueurs
- ✅ Santé des joueurs
- ✅ Apparition des ennemis (contrôlé par l'hôte)
- ✅ Dégâts aux ennemis
- ✅ Collecte d'objets
- ✅ Montée de niveau

## Remarques Techniques

### Architecture
- **Serveur** : Node.js + Express + Socket.IO
- **Client** : Vanilla JavaScript avec Socket.IO client
- **Communication** : WebSocket en temps réel
- **Connexion** : Automatique vers l'origine du serveur (fonctionne en local et en production)

### Déploiement
Le jeu se connecte automatiquement au serveur qui l'héberge :
- En développement : Se connecte à `http://localhost:3000`
- En production : Se connecte à l'URL du serveur (ex: `http://games.linkatplug.be:7779`)

Aucune configuration supplémentaire n'est nécessaire.

### Limites
- Maximum **2 joueurs** par partie
- Les deux joueurs doivent pouvoir accéder au même serveur
- L'hôte contrôle l'apparition des ennemis pour éviter les désynchronisations

### Résolution de Problèmes

**Impossible de se connecter au serveur**
- Vérifiez que le serveur est démarré (`npm start`)
- Vérifiez que le port 3000 n'est pas utilisé par une autre application
- Vérifiez votre pare-feu

**Code de salle invalide**
- Vérifiez que le code est correct (6 caractères)
- Vérifiez que l'hôte n'a pas quitté
- Vérifiez que la salle n'est pas déjà pleine (2 joueurs max)

**Déconnexion pendant la partie**
- Si un joueur se déconnecte, l'autre joueur reçoit une notification
- La partie peut continuer en solo
- L'hôte peut créer une nouvelle partie

## Mode Solo

Le mode solo reste disponible ! Cliquez simplement sur **SOLO** dans le menu principal pour jouer seul.

## Support

Pour tout problème ou suggestion, ouvrez une issue sur le dépôt GitHub.

---

**Bon jeu ! 🎮**
