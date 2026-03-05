path "secret/data/db" {
  capabilities = ["read"]
}

path "secret/data/cookie" {
  capabilities = ["read"]
}

path "secret/data/certs" {
  capabilities = ["read"]
}

path "secret/data/keys" {
  capabilities = ["read"]
}

path "pki/issue/spacehub-role" {
  capabilities = ["create", "update"]
}

path "database/creds/spacehub-role" {
  capabilities = ["read"]
}

path "secret/data/keycloak" {
  capabilities = ["read"]
}