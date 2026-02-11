// disabilita il controllo SSL per i certificati self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { loginWithAppRole, getDbSecrets } from "./src/services/vault.js";
import express from "express";
import path from "path";
import { initDbPool } from "./src/services/db.js";
import cors from "cors";
import https from "https";
import fs from "fs";

// --- VAULT INIT
await loginWithAppRole();
const db = await getDbSecrets();
process.env.DB_HOST = db.DB_HOST;
process.env.DB_PORT = db.DB_PORT;
process.env.DB_NAME = db.DB_NAME;
process.env.DB_USER = db.DB_USER;
process.env.DB_PASS = db.DB_PASS;

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

bookingsRoutes(app);
readerRoutes(app);
authRoutes(app); // le rotte di auth ora restituiranno 404/deprecated, ma lasciamo l'import per pulizia

app.get("/", (req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));    // routing for index.html
});

// --- SETUP HTTPS SERVER
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.cert'))
};

https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server HTTPS in ascolto su https://localhost:${port}`); 
});