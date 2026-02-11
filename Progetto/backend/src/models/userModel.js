import {pool} from "../services/db.js";

export const userModel = {

    async findByUsername(username) {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ? LIMIT 1",
            [username]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    // non serve più passwordHash, ma solo l'ID (UUID) che ci arriva dal token
    async createUser(id, username) {
        const [result] = await pool.query(
            "INSERT INTO users (id, username) VALUES (?, ?)",
            [id, username]
        );

        return {
            id: id, // l'ID è quello che abbiamo passato noi (UUID)
            username
        };
    },

    // serve a sincronizzare l'utente: se esiste non fa nulla (o aggiorna), se non esiste lo crea.
    async ensureUserExists(id, username) {
        // cerchiamo l'utente
        const existing = await this.findById(id);
        
        if (existing) {
            return existing; // se c'è già, a posto così
        }

        // se non c'è, lo creiamo usando l'ID di Keycloak
        return await this.createUser(id, username);
    }
};