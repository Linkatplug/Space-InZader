# Space InZader avec Docker

L'image est construite en deux étapes :

1. **Build** (`node:20-alpine`) : `npm ci`, `npm test` (l'image n'est pas créée si un test échoue), `npx vite build`.
2. **Serveur** (`nginx:alpine`) : sert le dossier `dist/` sur le port 80 (gzip, cache long pour `/assets/*`, pas de cache pour `index.html`).

Fichiers : `Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`.

---

## 1. Déploiement via Portainer (stack) — recommandé

### Créer la stack

1. Portainer → **Stacks** → **+ Add stack**.
2. Nom : `space-inzader`.
3. Méthode de build : **Repository**.
   - Repository URL : `https://github.com/Linkatplug/Space-InZader`
   - Repository reference : `refs/heads/main`
   - Compose path : `docker-compose.yml`
   - (Dépôt privé : cocher *Authentication* et donner un jeton GitHub en lecture.)
4. **GitOps updates** : activer.
   - Mechanism **Polling** (ex. toutes les `5m`) → Portainer vérifie le dépôt et redéploie dès qu'un commit arrive sur `main`.
   - ou **Webhook** → Portainer donne une URL ; l'appeler (à la main, ou depuis GitHub *Settings → Webhooks*) déclenche la mise à jour.
   - Cocher **Force redeployment** si l'option est proposée.
5. *Environment variables* (facultatif) : `HOST_PORT` = `8118` (ou un autre port).
6. **Deploy the stack**. Le premier déploiement prend 1 à 2 minutes (installation npm + tests + build).

Jeu disponible sur `http://<ip-du-serveur>:8118`.

### Mettre à jour

Rien à faire : un `git push` sur `main` suffit. Avec le polling, Portainer détecte le nouveau commit et relance la stack ; comme `docker-compose.yml` contient `pull_policy: build`, l'image est **reconstruite** avec le nouveau code à chaque redéploiement.

Mise à jour manuelle : Stacks → `space-inzader` → **Pull and redeploy**.

Si les tests échouent, la reconstruction échoue et **l'ancien conteneur continue de tourner**.

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

```bash
git pull
```

```bash
docker compose up -d --build
```

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
- Alternative possible plus tard : faire construire l'image par GitHub Actions et la publier sur GHCR, puis utiliser dans Portainer une stack `image: ghcr.io/linkatplug/space-inzader:latest` avec « Re-pull image ». Évite de builder sur le serveur, mais demande un workflow supplémentaire.
