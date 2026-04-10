import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
// import bcrypt from "bcrypt"; // non serve più, le password le gestisce Keycloak
import {userModel} from "../models/userModel.js";

// configurazione client per scaricare le chiavi pubbliche di Keycloak
const client = jwksClient({
    jwksUri: 'https://keycloak:8443/realms/spacehub/protocol/openid-connect/certs'
});

// funzione helper per ottenere la chiave di firma
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

// funzione helper per calcolare il ruolo principale da salvare nel DB
const getPrimaryRole = (roles) => {
    if (!roles) return 'student';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('professor')) return 'professor';
    return 'student'; // fallback di default
};

// --- LOGIN
// con Keycloak, il login avviene interamente lato frontend. 
export const login = async (req, res) => {
    return res.status(404).json({ error: "Endpoint deprecato. Usa Keycloak su frontend." });
};

// --- REGISTER
// con Keycloak, il register avviene interamente lato frontend. 
export const register = async (req, res) => {
    return res.status(404).json({ error: "Endpoint deprecato. Usa Keycloak su frontend." });
};

// --- LOGOUT
export const logout = (req, res) => {
    res.clearCookie("connect.sid"); // puliamo eventuali vecchi cookie per sicurezza
    res.json({ message: "Logout locale completato (ricorda di fare logout anche su Keycloak lato FE)" });
};

// --- RICHIEDI LOGIN (PER PAGINE PROTETTE)
export const requireLogin = (req, res, next) => {
    // 1. cerchiamo il token nell'header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token mancante o invalido. Devi essere loggato." });
    }

    const token = authHeader.split(" ")[1];

    // 2. verifichiamo il token usando la chiave pubblica di Keycloak
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, async (err, decoded) => {
        if (err) {
            console.error("Errore verifica token:", err.message);
            // Questo copre già il controllo IA-11 (Token scaduto o invalido)
            return res.status(401).json({ error: "Token non valido o scaduto" });
        }

        const roles = decoded.realm_access?.roles || [];
        const dbRole = getPrimaryRole(roles);

        // 3. se valido, attacchiamo i dati dell'utente alla richiesta
        req.user = {
            id: decoded.sub,                        // UUID di Keycloak
            username: decoded.preferred_username,   // Username scelto su Keycloak
            email: decoded.email,
            given_name: decoded.given_name,         // Nome (first_name)
    family_name: decoded.family_name,       // Cognome (last_name)
    roles: roles,                           // Array originale di Keycloak
    role: dbRole                            // ruolo primario
        };

        // --- SINCRONIZZAZIONE INTELLIGENTE CON IL DB ---
        // controlliamo il claim "iat" (Issued At - data di creazione del token).
        // se il token è stato creato da meno di 5 minuti, aggiorniamo il DB.
        // altrimenti, assumiamo che l'utente sia già stato sincronizzato per evitare spam al DB.
        const tokenAgeInSeconds = Math.floor(Date.now() / 1000) - decoded.iat;

        if (tokenAgeInSeconds < 300) { // 300 secondi = 5 minuti
            try {
                await userModel.syncUserKeycloak(
                    req.user.id,
                    req.user.username,
                    req.user.email,
                    req.user.given_name,
                    req.user.family_name,
                    req.user.role
                );
            } catch (dbErr) {
                console.error("Errore durante la sincronizzazione dell'utente nel DB:", dbErr);
            }
        }

        // manteniamo la compatibilità col vecchio codice che usava req.session.userId
        req.session = { userId: decoded.sub };

        // procediamo alla rotta successiva
        next();
    });
};
