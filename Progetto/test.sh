export VAULT_TOKEN="hvs.zaARBL2QeFHvnY9QoEkPnn4l"
export VAULT_ADDR="https://127.0.0.1:8200"

echo "💣 1. Distruggo il vecchio motore PKI (Tabula Rasa)..."
curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" -X DELETE $VAULT_ADDR/v1/sys/mounts/pki

echo "✨ 2. Ricreo il motore PKI pulito..."
curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" -X POST \
  -d '{"type":"pki"}' $VAULT_ADDR/v1/sys/mounts/pki

echo "⏱️ 3. Sblocco il limite di tempo a 10 anni..."
curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" -X POST \
  -d '{"max_lease_ttl":"87600h"}' $VAULT_ADDR/v1/sys/mounts/pki/tune

echo "👑 4. Genero l'UNICA e sola Root CA (valida fino al 2036)..."
curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" -X POST \
  -d '{"common_name":"SpaceHub Root CA","ttl":"87600h"}' \
  $VAULT_ADDR/v1/pki/root/generate/internal > /dev/null

echo "📜 5. Ricreo il ruolo per Nginx e Node..."
curl -s -k -H "X-Vault-Token: $VAULT_TOKEN" -X POST \
  -d '{"allowed_domains":"localhost,keycloak,backend","allow_subdomains":true,"max_ttl":"8760h"}' \
  $VAULT_ADDR/v1/pki/roles/spacehub-role

echo "✅ Ambiente crittografico perfettamente pulito e ripristinato!"
