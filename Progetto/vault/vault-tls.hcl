listener "tcp" {
  address = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault-tls/vault.crt"
  tls_key_file  = "/opt/vault-tls/vault.key"
  tls_min_version = "tls13"   # force tls 1.3 
}

storage "file" {
  path = "/opt/vault-data"
}

ui = true
