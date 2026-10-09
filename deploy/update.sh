#!/bin/sh
# Space InZader — mise à jour sur le serveur (dépôt Gitea) :
#   /home/DOCKER/space-inzader/deploy/update.sh
# Récupère le dernier code, reconstruit l'image (tests compris) et relance le conteneur.
set -eu

# Racine du dépôt (ce script est dans deploy/)
cd "$(dirname "$0")/.."

git pull --ff-only

SI_BUILD=$(git rev-list --count HEAD)
SI_BUILD_DATE=$(date +%Y-%m-%d)
export SI_BUILD SI_BUILD_DATE

docker compose up -d --build

# Nettoyage : uniquement les anciennes images du jeu (jamais de prune global,
# d'autres services tournent sur le serveur)
docker image prune -f --filter "label=app=space-inzader"

echo "Space InZader v$SI_BUILD ($SI_BUILD_DATE) déployé."
