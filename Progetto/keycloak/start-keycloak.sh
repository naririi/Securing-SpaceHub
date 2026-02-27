#!/bin/bash

echo "🔐 Inizializzazione avvio sicuro di Keycloak..."

# check token export
if [ -z "$VAULT_TOKEN" ]; then
  echo "❌ ERRORE CRITICO: La variabile VAULT_TOKEN non è impostata!"
  echo "Uso: VAULT_TOKEN=il_tuo_token ./start-keycloak.sh"
  exit 1
fi

# --- SETUP VAULT
VAULT_ADDR="https://127.0.0.1:8200"

# --- GET CREDENTIALS
echo "   -> Recupero credenziali infrastruttura..."
SECRETS=$(curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/secret/data/keycloak)

export KC_DB_USER=$(echo "$SECRETS" | jq -r '.data.data.db_user')
export KC_DB_PASSWORD=$(echo "$SECRETS" | jq -r '.data.data.db_password')
export KC_ADMIN_USER=$(echo "$SECRETS" | jq -r '.data.data.admin_user')
export KC_ADMIN_PASS=$(echo "$SECRETS" | jq -r '.data.data.admin_pass')

# --- CHECK
if [ -z "$KC_DB_PASSWORD" ] || [ "$KC_DB_PASSWORD" == "null" ]; then
  echo "❌ ERRORE CRITICO: Impossibile estrarre i segreti dal Vault!"
  echo "Risposta grezza dal Vault: $SECRETS"
  exit 1
fi

# --- GET TLS CERTS
echo "   -> Generazione certificati TLS da Vault..."

# put certs in the directory
mkdir -p ./certs

echo "$SECRETS" | jq -r '.data.data.tls_cert' > ./certs/keycloak.crt
echo "$SECRETS" | jq -r '.data.data.tls_key' > ./certs/keycloak.key

# set restrictive permissions
chmod 600 ./certs/keycloak.key

echo "✅ Segreti e Certificati generati localmente! Avvio di Docker Compose..."

# clear old container
docker compose down
docker compose up -d