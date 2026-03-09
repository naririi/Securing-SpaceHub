import express from "express";
import path from "path";
import cors from "cors";
import fs from 'fs';
import https from "https";
import morgan from "morgan";
import { createStream } from "rotating-file-stream";
import rateLimit from "express-rate-limit";
import helmet from 'helmet';

import { loginWithAppRole, getDynamicDbCreds, getRsaKeys } from "./src/services/vault.js";
import { initDbPool } from "./src/services/db.js";

// --- VAULT INIT
await loginWithAppRole();

// 1. recupero credenziali DINAMICHE database
const dynamicDb = await getDynamicDbCreds();

// 2. recupero certificati TLS da Vault
// deprecato - ora i certificati sono gestiti da nginx
// const tlsCerts = await getTlsCerts();

// 3. recupero chiavi RSA da Vault
const rsaKeys = await getRsaKeys();
process.env.BACKEND_PRIVATE_KEY = rsaKeys.privateKey;
process.env.BACKEND_PUBLIC_KEY = rsaKeys.publicKey;

// --- DB INIT
await initDbPool(dynamicDb.username, dynamicDb.password);

// --- SETUP BACKEND
const app = express();
const port = process.env.BACKEND_PORT || 3000;

// dice a express di fidarsi degli IP passati dal reverse proxy (nginx)
app.set('trust proxy', 1);

// --- SETUP CORS
app.use(cors({
    // Aggiorniamo le origin per accettare le porte di Nginx
    origin: ["https://localhost:8443", "https://localhost"], 
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"] 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SETUP SECURITY HEADERS
app.use(helmet());      // helmet di base applica di default header come X-Content-Type-Options: nosniff

// forza header X-XSS-Protection per prevenire il furto del token dal sessionStorage
app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"], // permette risorse solo dal nostro stesso dominio
    // permettiamo gli script interni e le connessioni al nostro Keycloak/DB
    scriptSrc: ["'self'", "'unsafe-inline'"], 
    connectSrc: ["'self'", "https://localhost", "https://localhost:8443"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // per i font esterni
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:"],
    frameAncestors: ["'none'"], // previene il clickjacking
  },
}));

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

// applichiamo il rate limiter a tutte le rotte che iniziano per /api
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
// deprecato - servito staticamente da nginx in produzione
// const buildPath = path.join(__dirname, "..", "frontend", "dist");
// app.use(express.static(buildPath));

// --- SETUP ROUTES
import bookingsRoutes from "./src/routes/bookingsRoutes.js";
import readerRoutes from "./src/routes/readerRoutes.js";
// import authRoutes from "./src/routes/authRoutes.js";    // deprecato - gestisce keycloak
import policiesRoutes from "./src/routes/policiesRoutes.js";

bookingsRoutes(app);
readerRoutes(app);
// authRoutes(app); 
policiesRoutes(app);

// --- SETUP HTTPS SERVER 
const httpsOptions = {
    cert: fs.readFileSync('/usr/src/app/certs/backend.crt'),
    key: fs.readFileSync('/usr/src/app/certs/backend.key'),
    minVersion: 'TLSv1.3' 
};

const server = https.createServer(httpsOptions, app);

server.keepAliveTimeout = 20000; 
server.headersTimeout = 21000;   

server.listen(port, () => {
    console.log(`[SECURE] API Backend in ascolto (con TLS 1.3) su porta interna ${port}`);
    console.log(`[SECURE] Segreti DB e chiavi RSA caricati dal Vault in RAM.`);
});