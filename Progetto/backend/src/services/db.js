import mysql from "mysql2/promise";

let pool = null;

export async function initDbPool(dynamicUser, dynamicPassword) {
  if (!pool) {
    pool = mysql.createPool({
      // l'host deve essere il nome del container Docker!
      host: process.env.DB_HOST || "mariadb", 
      port: process.env.DB_PORT || 3306,
      // usiamo le credenziali dinamiche passate da Vault
      user: dynamicUser,
      password: dynamicPassword,
      database: process.env.DB_NAME || "spacehub",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+00:00",
      charset: "utf8mb4"
    });
    console.log(`[DB] Connessione al pool inizializzata con l'utente dinamico: ${dynamicUser}`);
  }
  return pool;
}

// helper per query
export async function query(sql, params) {
  const p = await initDbPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

export { pool };