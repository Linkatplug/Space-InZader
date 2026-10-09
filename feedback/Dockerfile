# Space InZader — serveur des avis (F8). Node pur, aucune dépendance npm.
FROM node:20-alpine
LABEL app=space-inzader
WORKDIR /app
COPY server.mjs scores.mjs stats.mjs feedback/
# Dossier des avis : volume nommé, appartient à l'utilisateur non privilégié « node »
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV PORT=3000 DATA_DIR=/app/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "feedback/server.mjs"]
