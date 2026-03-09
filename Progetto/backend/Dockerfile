FROM node:20-alpine

LABEL maintainer="Spacehub Admin"
LABEL description="Backend Node.js sicuro per Spacehub"

# Installa dumb-init (gestisce i processi in modo sicuro evitando processi "zombie")
RUN apk add --no-cache dumb-init

# Imposta l'ambiente di produzione (performance migliori)
ENV NODE_ENV=production

# Crea la directory di lavoro per l'applicazione
WORKDIR /usr/src/app

# Assegna la proprietà della directory all'utente limitato 'node' PRIMA di passarci dentro
RUN chown node:node /usr/src/app

# Passiamo all'utente node 
# Da questa riga in poi, Docker non è più root. Ogni operazione è confinata.
USER node

# Copia SOLO i file delle dipendenze per sfruttare la cache dei layer di Docker
COPY --chown=node:node package*.json ./

# Installa le dipendenze. 
RUN npm ci --only=production

# Copia tutto il resto del codice sorgente del backend
COPY --chown=node:node . .

# Esponi la porta 3000
EXPOSE 3000

# Avvia l'applicazione in modo sicuro avvolgendo Node all'interno di dumb-init
CMD ["dumb-init", "node", "index.js"]