import vault from "node-vault";

// Client Vault
const client = vault({
  endpoint: process.env.VAULT_ADDR || "https://localhost:8200",
  requestOptions: {
    strictSSL: false // necessario perché usi certificati self-signed
  }
});

/**
 * Login con AppRole
 */
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
 * Legge i segreti del database (KV v2)
 * path: secret/db
 */
export async function getDbSecrets() {
  const res = await client.read("secret/data/db");
  return res.data.data; // { db_host, db_port, db_name, db_user, db_pass }
}

/**
 * Legge i segreti dell'app (KV v2)
 * path: secret/app
 */
export async function getAppSecrets() {
  const res = await client.read("secret/data/cookie");
  return res.data.data; // { sessionSecret }
}

/**
 * (Opzionale) Dynamic DB credentials
 * path: database/creds/aule-role
 */
export async function getDynamicDbCreds() {
  const res = await client.read("database/creds/spacehub-role");
  return {
    username: res.data.username,
    password: res.data.password
  };
}

export default client;
