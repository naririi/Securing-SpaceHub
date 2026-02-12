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

    async createUser(id, username, email, firstName, lastName) {
        const [result] = await pool.query(
            `INSERT INTO users (id, username, email, first_name, last_name) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, username, email, firstName, lastName]
        );

        return {
            id,
            username,
            email,
            firstName,
            lastName
        };
    },

    async ensureUserExists(id, username, email, firstName, lastName) {
        // cerchiamo l'utente
        const existing = await this.findById(id);
        
        if (existing) {
            // Opzionale: Se volessi tenere aggiornati i dati (es. l'utente cambia cognome su Keycloak),
            // potresti fare un UPDATE qui. Per ora ritorniamo l'esistente come richiesto.
            return existing; 
        }

        // se non c'è, lo creiamo passando tutti i dati
        return await this.createUser(id, username, email, firstName, lastName);
    }
};