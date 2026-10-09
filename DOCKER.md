# Space InZader avec Docker

L'image est construite en deux étapes :

1. **Build** (`node:20-alpine`) : `npm ci`, `npm test` (l'image n'est pas créée si un test échoue), `npx vite build`.
2. **Serveur** (`nginx:alpine`) : sert le dossier `dist/` sur le port 80 (gzip, cache long pour `/assets/*`, pas de cache pour `index.html`).

Fichiers : `Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`, `deploy/update.sh`.

---

## 1. Déploiement depuis Gitea (serveur) — méthode officielle

Le jeu se déploie **uniquement depuis Gitea** : https://git.linkatplug.be/linkatplug/Space-InZader.git
(GitHub ne sert plus que de sauvegarde.)

### Installation (une seule fois, en SSH sur le serveur)

```bash
cd /home/DOCKER && git clone https://git.linkatplug.be/linkatplug/Space-InZader.git space-inzader && cd space-inzader && sh deploy/update.sh
```

Jeu disponible sur `http://<ip-du-serveur>:8118` (port modifiable avec `HOST_PORT` dans un fichier `.env` à côté de `docker-compose.yml`).

### Mettre à jour (à chaque nouvelle version)

```bash
/home/DOCKER/space-inzader/deploy/update.sh
```

Le script `deploy/update.sh` :

1. `git pull --ff-only` (dernier code de Gitea) ;
2. calcule le numéro de version `SI_BUILD` = nombre de commits (`git rev-list --count HEAD`) et la date `SI_BUILD_DATE` ;
3. `docker compose up -d --build` : reconstruit l'image (tests compris) et relance le conteneur ;
4. supprime **uniquement** les anciennes images du jeu (`docker image prune -f --filter "label=app=space-inzader"`) — jamais de nettoyage global, d'autres services tournent sur le serveur ;
5. affiche la version déployée.

La version (ex. `v142 · mis à jour le 09/10/2026`) apparaît en bas du menu principal du jeu.

Si les tests échouent, la reconstruction échoue et **l'ancien conteneur continue de tourner**.

> L'ancienne stack Portainer (autre serveur, branchée sur GitHub) peut être arrêtée.

---

## 2. Déploiement en ligne de commande

```bash
docker compose up -d --build
```

Accès : http://localhost:8118

Arrêter :

```bash
docker compose down
```

### Changer le port

Variable `HOST_PORT` (8118 par défaut), en ligne de commande :

```bash
HOST_PORT=9000 docker compose up -d --build
```

ou dans un fichier `.env` à côté de `docker-compose.yml` :

```
HOST_PORT=9000
```

### Mettre à jour

Utiliser `deploy/update.sh` (voir plus haut) : il fait le `git pull`, passe le numéro de version au build et nettoie les anciennes images du jeu.

---

## Vérifications utiles

```bash
docker compose ps
```

L'état doit être `healthy` (le healthcheck interroge `http://127.0.0.1/` dans le conteneur).

```bash
docker compose logs -f space-inzader
```

## Notes

- Le build Vite utilise `base: './'` : le jeu fonctionne aussi derrière un reverse proxy dans un sous-chemin.
- Les musiques sont servies depuis `/music/*.mp3` (`audio/mpeg`).
- Les sauvegardes du jeu sont dans le `localStorage` du navigateur : rien à persister côté serveur (pas de volume).
- Sans `deploy/update.sh` (ex. `docker compose up -d --build` à la main), la version affichée est `v1.0.0-dev`.
