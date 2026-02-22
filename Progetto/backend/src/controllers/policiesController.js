import { createRequire } from "module";

const require = createRequire(import.meta.url);

const roleHierarchy = require("../policies/roles.json");

// --- ESPONE LA GERARCHIA DEI RUOLI ---
export const getRoleHierarchy = (req, res) => {
    try {
        // restituiamo il JSON al frontend
        res.json(roleHierarchy);
    } catch (err) {
        console.error("Errore nel recupero della configurazione ruoli:", err);
        res.status(500).json({ error: "Errore interno del server" });
    }
};