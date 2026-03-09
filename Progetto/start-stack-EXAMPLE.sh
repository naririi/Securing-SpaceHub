#!/bin/bash

echo "🔐 Inizializzazione dell'infrastruttura Spacehub..."

if ! command -v jq &> /dev/null; then
    echo "❌ ERRORE: L'utility 'jq' non è installata sul tuo sistema."
    exit 1
fi

# --- 0. PREPARAZIONE PERMESSI VOLUMI DOCKER
echo "🔧 Allineamento dei permessi file system per Docker..."

# A. Permessi per Vault (UID 100, GID 1000)
mkdir -p ./vault/data ./vault/certs
sudo touch ./vault/vault-audit.log

# Assegna la proprietà a Vault per poter scrivere dati e log
sudo chown -R 100:1000 ./vault/data
sudo chown 100:1000 ./vault/vault-audit.log

# Permessi di lettura stretti per i certificati statici di Vault
sudo chown -R 100:1000 ./vault/certs
sudo chmod 600 ./vault/certs/*.key
sudo chmod 644 ./vault/certs/*.crt

# --- 1. AVVIO DI VAULT
echo "🚀 Avvio del container Vault..."
docker compose down
docker compose up -d vault

# WARN: il tuo pc è più lento, potresti mettere 30/40 secondi
echo "⏳ Attesa che Vault si inizializzi (10 secondi)..."
sleep 10

echo "🔓 Esecuzione Unseal di Vault..."
source ./vault/unseal.sh

# Controllo post-source per sicurezza
if [ -z "$VAULT_TOKEN" ]; then
  echo "❌ ERRORE CRITICO: La variabile VAULT_TOKEN non è stata importata da unseal.sh!"
  exit 1
fi

export VAULT_ADDR="https://127.0.0.1:8200"
# NOTA: QUESTA COSA È NON SICURA! STO TESTANDO
export VAULT_ROLE_ID=YOUR_VAULT_ROLE_ID
export VAULT_SECRET_ID=YOUR_VAULT_SECRET_ID
export VAULT_TOKEN=YOUR_VAULT_ROOT_TOKEN

# --- 2. RECUPERO CREDENZIALI STATICHE
echo "   -> Recupero credenziali Keycloak..."
KC_SECRETS=$(curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/secret/data/keycloak)

export KC_DB_USER=$(echo "$KC_SECRETS" | jq -r '.data.data.db_user')
export KC_DB_PASSWORD=$(echo "$KC_SECRETS" | jq -r '.data.data.db_password')
export KC_ADMIN_USER=$(echo "$KC_SECRETS" | jq -r '.data.data.admin_user')
export KC_ADMIN_PASS=$(echo "$KC_SECRETS" | jq -r '.data.data.admin_pass')

echo "   -> Recupero credenziali MariaDB..."
MARIADB_SECRETS=$(curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/secret/data/db)
export DB_ROOT_PASSWORD=$(echo "$MARIADB_SECRETS" | jq -r '.data.data.root_password')


# --- 3. GENERAZIONE CERTIFICATI TLS DINAMICI (PKI Engine)
echo "   -> Generazione certificati TLS tramite PKI Engine..."

mkdir -p ./keycloak/certs
mkdir -p ./nginx/certs
mkdir -p ./backend/certs

sudo chown -R $USER ./keycloak/certs ./nginx/certs ./backend/certs

PKI_ROLE="spacehub-role"
DOMAIN="localhost"

# A. Generazione per Keycloak
echo "      - Certificato per Keycloak..."
KC_CERT_RESP=$(curl -s -k -X POST -H "X-Vault-Token: $VAULT_TOKEN" \
  -d "{\"common_name\": \"$DOMAIN\"}" \
  $VAULT_ADDR/v1/pki/issue/$PKI_ROLE)

echo "$KC_CERT_RESP" | jq -r '.data.certificate' > ./keycloak/certs/keycloak.crt
echo "$KC_CERT_RESP" | jq -r '.data.private_key' > ./keycloak/certs/keycloak.key

# B. Generazione per WebApp (Nginx)
echo "      - Certificato per WebApp (Nginx)..."
WEB_CERT_RESP=$(curl -s -k -X POST -H "X-Vault-Token: $VAULT_TOKEN" \
  -d "{\"common_name\": \"$DOMAIN\"}" \
  $VAULT_ADDR/v1/pki/issue/$PKI_ROLE)

echo "$WEB_CERT_RESP" | jq -r '.data.certificate' > ./nginx/certs/webapp.crt
echo "$WEB_CERT_RESP" | jq -r '.data.private_key' > ./nginx/certs/webapp.key

# C. Generazione per il Backend Node.js
echo "      - Certificato per Backend (Node.js)..."
mkdir -p ./backend/certs

# Usiamo "backend" come common_name, che è il nome del container nel docker-compose
BACKEND_CERT_RESP=$(curl -s -k -X POST -H "X-Vault-Token: $VAULT_TOKEN" \
  -d "{\"common_name\": \"$DOMAIN\"}" \
  $VAULT_ADDR/v1/pki/issue/$PKI_ROLE)

echo "$BACKEND_CERT_RESP" | jq -r '.data.certificate' > ./backend/certs/backend.crt
echo "$BACKEND_CERT_RESP" | jq -r '.data.private_key' > ./backend/certs/backend.key

# --- SETUP PERMESSI CERTIFICATI GENERATI

# 1. Permessi per Nginx (L'immagine unprivileged usa UID 101)
sudo chown -R 101:101 ./nginx/certs
sudo chmod 600 ./nginx/certs/*.key
sudo chmod 644 ./nginx/certs/*.crt

# 2. Permessi per Keycloak e Node.js (Usano entrambi UID 1000)
sudo chown -R 1000:1000 ./keycloak/certs ./backend/certs
sudo chmod 600 ./keycloak/certs/*.key ./backend/certs/*.key
sudo chmod 644 ./keycloak/certs/*.crt ./backend/certs/*.crt

echo "✅ Segreti estratti e Certificati generati!"

# --- SETUP APPROLE

#echo "   -> Generazione credenziali AppRole per il Backend..."
#export VAULT_ROLE_ID=$(curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/auth/approle/role/spacehub-role/role-id | jq -r '.data.role_id')

# Genera un nuovo Secret ID dinamico (una sorta di password monouso o a scadenza)
#export VAULT_SECRET_ID=$(curl -s -k -X POST -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/auth/approle/role/spacehub-role/secret-id | jq -r '.data.secret_id')

if [ -z "$VAULT_ROLE_ID" ] || [ "$VAULT_ROLE_ID" == "null" ]; then
    echo "❌ ERRORE: Impossibile recuperare il Role ID. Assicurati che l'auth method approle e il ruolo 'spacehub-role' siano configurati in Vault."
fi

# --- AVVIO DELLO STACK COMPLETO
echo "🚀 Avvio di Keycloak, MariaDB, Node.js e Nginx..."
docker compose up -d

# NOTA: se vengono fatte spesso modifiche al codice conviene avviare con:
# docker compose up -d --build

echo "🎉 Infrastruttura Spacehub avviata con successo!"
echo "Visualizza la pagina web al link: https://localhost"
