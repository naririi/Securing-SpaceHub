// abilita il controllo SSL per i certificati self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

import { loginWithAppRole, getDbSecrets, getTlsCerts, getRsaKeys } from "./src/services/vault.js";
import express from "express";
import path from "path";
import { initDbPool } from "./src/services/db.js";
import cors from "cors";
import https from "https";
import morgan from "morgan";
import { createStream } from "rotating-file-stream";
import rateLimit from "express-rate-limit";

// --- VAULT INIT
await loginWithAppRole();

// 1. recupero Segreti DB
const db = await getDbSecrets();
process.env.DB_HOST = db.DB_HOST;
process.env.DB_PORT = db.DB_PORT;
process.env.DB_NAME = db.DB_NAME;
process.env.DB_USER = db.DB_USER;
process.env.DB_PASS = db.DB_PASS;

// 2. recupero certificati TLS da Vault
const tlsCerts = await getTlsCerts();

// 3. recupero chiavi RSA da Vault
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

// --- SETUP RATE LIMITING
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // finestra di 15 minuti
    max: 150, // limita ogni IP a 150 richieste per finestra temporale
    message: {
        status: 429,
        error: "Too Many Requests",
        message: "Hai superato il limite di richieste consentite. Riprova tra 15 minuti."
    },
    standardHeaders: true, // restituisce le info del limite negli header `RateLimit-*`
    legacyHeaders: false, // disabilita gli header deprecati
});

// applichiamo il rate limiter a tutte le rotte che iniziano per /api/
// in modo da non bloccare il caricamento dei file statici del frontend
app.use('/api', apiLimiter);

// --- SETUP AUDIT LOGGING
morgan.token('kc-user', (req) => req.user ? req.user.sub || req.user.id : 'Anonymous');
morgan.token('kc-role', (req) => req.user ? req.user.realm_access?.roles?.join(',') || req.user.role : 'none');

const logFormat = '[:date[iso]] IP: :remote-addr | User: :kc-user | Role: :kc-role | Action: ":method :url" | Status: :status';

const __dirname = import.meta.dirname;
const auditLogStream = createStream('audit-admin.log', {
    interval: '1d', // un file al giorno
    maxFiles: 7,    // conserva solo gli ultimi 7 file
    path: path.join(__dirname, 'logs') // cartella dove verranno salvati
});

app.use(morgan(logFormat, {
    stream: auditLogStream,
    skip: (req, res) => {
        // definizione di cosa è "privilegiato"
        const isPrivilegedRole = req.user && (req.user.role === 'admin' || req.user.realm_access?.roles?.includes('admin'));
        const isPoliciesRoute = req.originalUrl.startsWith('/api');
        
        // Se NON è admin e NON sta chiamando una rotta critica, SALTA il log
        return !(isPrivilegedRole || isPoliciesRoute);
    }
}));

// --- SETUP FOR FRONTEND
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath));

// --- SETUP ROUTES
import bookingsRoutes from "./src/routes/bookingsRoutes.js";
import readerRoutes from "./src/routes/readerRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import policiesRoutes from "./src/routes/policiesRoutes.js";

bookingsRoutes(app);
readerRoutes(app);
authRoutes(app); 
policiesRoutes(app);

app.get("/", (req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html")); 
});

// --- SETUP HTTPS SERVER
const httpsOptions = {
    cert: tlsCerts.cert,
    key: tlsCerts.key,
    minVersion: 'TLSv1.3' // forza TLS 1.3
};

const server = https.createServer(httpsOptions, app);

server.keepAliveTimeout = 20000; // 20 secondi
server.headersTimeout = 21000;   // 21 secondi

server.listen(port, () => {
    console.log(`Server HTTPS in ascolto su https://localhost:${port}`);
    console.log(`[SECURE] Certificati TLS e chiavi RSA caricati dal Vault in RAM.`);
});