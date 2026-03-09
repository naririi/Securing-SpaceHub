# --- BUILD APPLICAZIONE REACT
FROM node:20-alpine AS build

# Impostiamo la cartella di lavoro nel container
WORKDIR /app

# Copiamo SOLO i file delle dipendenze per sfruttare la cache di Docker.
# Se non modifichi il package.json, Docker salterà questo step nei build successivi, risparmiando minuti!
COPY package*.json ./

RUN npm ci

# Ora copiamo tutto il resto del codice sorgente di React
COPY . .

# Compiliamo React. 
RUN npm run build


# --- PRODUZIONE NGINX
# Usiamo l'immagine ufficiale non-root di Nginx
FROM nginxinc/nginx-unprivileged:alpine

LABEL maintainer="Spacehub Admin"
LABEL description="Frontend React servito tramite Nginx Unprivileged"

# 1. Diventiamo momentaneamente root per fare pulizia
USER root
RUN rm -rf /usr/share/nginx/html/*

# 2. Torniamo all'utente limitato di Nginx (UID 101) per massima sicurezza (NIST Compliant)
USER 101

# Copiamo i file dallo Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080 8443
CMD ["nginx", "-g", "daemon off;"]