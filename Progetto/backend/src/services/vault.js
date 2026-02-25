import vault from "node-vault";

// client vault
const client = vault({
  endpoint: process.env.VAULT_ADDR || "https://localhost:8200",
  requestOptions: {
    strictSSL: false // necessario per certificati self-signed
  }
});

// login AppRole
export async function loginWithAppRole() {
  if (!process.env.VAULT_ROLE_ID || !process.env.VAULT_SECRET_ID) {
    throw new Error("VAULT_ROLE_ID o VAULT_SECRET_ID mancanti");
  }

  const result = await client.approleLogin({
    role_id: process.env.VAULT_ROLE_ID,
    secret_id: process.env.VAULT_SECRET_ID
  });

  client.token = result.auth.client_token;
}

/**
 * legge i segreti del database (KV v2)
 * path: secret/db
 */
export async function getDbSecrets() {
  const res = await client.read("secret/data/db");
  return res.data.data; // { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS }
}

/**
 * credenziali per database dinamiche
 * path: database/creds/spacehub-role
 */
export async function getDynamicDbCreds() {
  const res = await client.read("database/creds/spacehub-role");
  return {
    username: res.data.username,
    password: res.data.password
  };
}

/**
 * legge i certificati TLS per HTTPS (KV v2)
 * path: secret/data/certs
 */
export async function getTlsCerts() {
  const res = await client.read("secret/data/certs");
  return {
    cert: res.data.data.backend_cert,
    key: res.data.data.backend_key
  };
}

/**
 * legge le chiavi asimmetriche RSA per le firme (KV v2)
 * path: secret/data/keys
 */
export async function getRsaKeys() {
  const res = await client.read("secret/data/keys");
  return {
    privateKey: res.data.data.backend_private,
    publicKey: res.data.data.backend_public
  };
}

export async function getKeycloakSecrets() {
  const res = await client.read("secret/data/keycloak");
  return {
    clientSecret: res.data.data.client_secret
  };
}

export default client;