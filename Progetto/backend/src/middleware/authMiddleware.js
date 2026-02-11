import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
// import bcrypt from "bcrypt"; // non serve più, le password le gestisce Keycloak
// import {userModel} from "../models/userModel.js"; // potrebbe servire in futuro per sincronizzare i dati, per ora lo lascio commentato o attivo se ti serve altrove

// configurazione client per scaricare le chiavi pubbliche di Keycloak
const client = jwksClient({
    jwksUri: 'https://localhost:8443/realms/spacehub/protocol/openid-connect/certs'
});

// funzione helper per ottenere la chiave di firma
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

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
// verifica il Token JWT invece della sessione.
export const requireLogin = (req, res, next) => {
    // 1. cerchiamo il token nell'header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const acc = req.headers.accept || "";
        if (acc.includes("text/html")) {
            // return res.redirect("/login"); 
        }
        return res.status(401).json({ error: "Token mancante o invalido. Devi essere loggato." });
    }

    const token = authHeader.split(" ")[1];

    // 2. verifichiamo il token usando la chiave pubblica di Keycloak
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) {
            console.error("Errore verifica token:", err.message);
            return res.status(401).json({ error: "Token non valido o scaduto" });
        }

        // 3. se valido, attacchiamo i dati dell'utente alla richiesta
        // Keycloak mette l'ID utente nel campo 'sub' (Subject)
        req.user = {
            id: decoded.sub,                        // UUID di Keycloak
            username: decoded.preferred_username,   // Username scelto su Keycloak
            email: decoded.email,
            roles: decoded.realm_access?.roles || []
        };
        
        // manteniamo la compatibilità col vecchio codice che usava req.session.userId?
        // se il resto del backend usa req.session.userId, possiamo mapparlo qui:
        req.session = { userId: decoded.sub }; 

        // procediamo alla rotta successiva
        next();
    });
};

// --- CHECK IF LOGGED
// serve al frontend per verificare se il token è ancora valido
export const checkLogged = async (req, res) => {
    // recuperiamo il token dall'header anche qui
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
         return res.json({ loggedIn: false });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) {
            return res.json({ loggedIn: false });
        }

        // il token è valido
        res.json({
            loggedIn: true,
            user: {
                id: decoded.sub,
                username: decoded.preferred_username
            }
        });
    });
};