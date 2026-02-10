listener "tcp" {
  address = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault-tls/vault.crt"
  tls_key_file  = "/opt/vault-tls/vault.key"
}

storage "file" {
  path = "/opt/vault-data"
}

ui = true
