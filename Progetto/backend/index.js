// disabilita il controllo SSL per i certificati self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { loginWithAppRole, getDbSecrets, getTlsCerts, getRsaKeys } from "./src/services/vault.js";
import express from "express";
import path from "path";
import { initDbPool } from "./src/services/db.js";
import cors from "cors";
import https from "https";

// --- VAULT INIT
await loginWithAppRole();

// 1. Recupero Segreti DB
const db = await getDbSecrets();
process.env.DB_HOST = db.DB_HOST;
process.env.DB_PORT = db.DB_PORT;
process.env.DB_NAME = db.DB_NAME;
process.env.DB_USER = db.DB_USER;
process.env.DB_PASS = db.DB_PASS;

// 2. Recupero Certificati TLS da Vault (In Memoria)
const tlsCerts = await getTlsCerts();

// 3. Recupero Chiavi RSA da Vault (Le salviamo globalmente)
const rsaKeys = await getRsaKeys();
process.env.BACKEND_PRIVATE_KEY = rsaKeys.privateKey;
process.env.BACKEND_PUBLIC_KEY = rsaKeys.publicKey;

// --- DB INIT
await initDbPool();

// --- SETUP BACKEND
const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(cors({
    origin: "https://localhost:5173",
    credentials: true,
    // aggiungiamo 'Authorization' agli header permessi per consentire il passaggio del Token Bearer
    allowedHeaders: ["Content-Type", "Authorization"] 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SETUP FOR FRONTEND
const __dirname = import.meta.dirname;
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath));

// --- SETUP ROUTES
import bookingsRoutes from "./src/routes/bookingsRoutes.js";
import readerRoutes from "./src/routes/readerRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import policiesRoutes from "./src/routes/policiesRoutes.js";

bookingsRoutes(app);
readerRoutes(app);
authRoutes(app); // le rotte di auth ora restituiranno 404/deprecated, ma lasciamo l'import per pulizia
policiesRoutes(app);

app.get("/", (req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));    // routing for index.html
});

// --- SETUP HTTPS SERVER
const httpsOptions = {
    cert: tlsCerts.cert,
    key: tlsCerts.key
};

https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server HTTPS in ascolto su https://localhost:${port}`);
    console.log(`[SECURE] Certificati TLS e chiavi RSA caricati dal Vault in RAM.`);
});