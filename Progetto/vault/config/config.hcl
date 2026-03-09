# --- VAULT CONFIGURATION FOR DOCKER ---

# NOTA SICUREZZA: in produzione va disabilitarla (ui=false), 
# ma tenendola attiva è fondamentale che la porta 8200 sia protetta o accessibile solo in locale/VPN.
ui = true

# impedisce a Vault di scrivere i segreti dalla RAM al disco rigido (Swap).
disable_mlock = false

# --- STORAGE
storage "file" {
  path = "/vault/file"
}

# --- LISTENER DI RETE
listener "tcp" {
  address = "0.0.0.0:8200"

  tls_disable     = "false"
  tls_min_version = "tls13"
  
  tls_cert_file = "/vault/certs/vault.crt"
  tls_key_file  = "/vault/certs/vault.key"
}

# api_addr = "https://127.0.0.1:8200"
api_addr = "https://0.0.0.0:8200"