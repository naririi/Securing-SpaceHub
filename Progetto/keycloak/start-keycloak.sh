#!/bin/bash

echo "🔐 Inizializzazione avvio sicuro di Keycloak..."

# Controllo sicurezza Token (NON SCRIVERLO MAI NEL FILE!)
if [ -z "$VAULT_TOKEN" ]; then
  echo "❌ ERRORE CRITICO: La variabile VAULT_TOKEN non è impostata!"
  echo "Uso: VAULT_TOKEN=il_tuo_token ./start-keycloak.sh"
  exit 1
fi

# Configurazioni Vault
VAULT_ADDR="https://127.0.0.1:8200"

# --- RECUPERO CREDENZIALI E PASSWORD DB
echo "   -> Recupero credenziali infrastruttura..."
# AGGIUNTA FONDAMENTALE: il flag -k (--insecure) permette a curl di leggere Vault anche con certificati locali self-signed
SECRETS=$(curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/secret/data/keycloak)

export KC_DB_USER=$(echo "$SECRETS" | jq -r '.data.data.db_user')
export KC_DB_PASSWORD=$(echo "$SECRETS" | jq -r '.data.data.db_password')
export KC_ADMIN_USER=$(echo "$SECRETS" | jq -r '.data.data.admin_user')
export KC_ADMIN_PASS=$(echo "$SECRETS" | jq -r '.data.data.admin_pass')

# --- CONTROLLO SALVAVITA ---
# Se la password è vuota o "null", blocchiamo tutto prima di far crashare Docker!
if [ -z "$KC_DB_PASSWORD" ] || [ "$KC_DB_PASSWORD" == "null" ]; then
  echo "❌ ERRORE CRITICO: Impossibile estrarre i segreti dal Vault!"
  echo "Risposta grezza dal Vault: $SECRETS"
  exit 1
fi

# --- RECUPERO CERTIFICATI TLS
echo "   -> Generazione certificati TLS da Vault..."
# Essendo tutto in una cartella, possiamo usare direttamente la variabile $SECRETS di prima senza fare una seconda chiamata curl!

# creiamo la cartella certs se non esiste
mkdir -p ./certs

# estraiamo i testi raw e li salviamo nei file
echo "$SECRETS" | jq -r '.data.data.tls_cert' > ./certs/keycloak.crt
echo "$SECRETS" | jq -r '.data.data.tls_key' > ./certs/keycloak.key

# mettiamo i permessi restrittivi sulla chiave privata (solo il proprietario può leggerla)
chmod 600 ./certs/keycloak.key

echo "✅ Segreti e Certificati generati localmente! Avvio di Docker Compose..."

# puliamo vecchi container bloccati e riavviamo pulito
docker compose down
docker compose up -d