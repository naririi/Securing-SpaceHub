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

    // FUNZIONE DI SINCRONIZZAZIONE GLOBALE (usata nel middleware)
    async syncUserKeycloak(id, username, email, firstName, lastName, role) {
        const query = `
            INSERT INTO users (id, username, email, first_name, last_name, role) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                username = VALUES(username),
                email = VALUES(email),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                role = VALUES(role)
        `;
        
        await pool.query(query, [id, username, email, firstName, lastName, role]);

        return { id, username, email, firstName, lastName, role };
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
            // L'utente esiste: facciamo l'UPDATE dei dati per tenerli sincronizzati
            await pool.query(
                `UPDATE users 
                 SET username = ?, email = ?, first_name = ?, last_name = ? 
                 WHERE id = ?`,
                [username, email, firstName, lastName, id]
            );
            
            // Ritorniamo l'oggetto unendo i vecchi dati (es. il ruolo) con quelli appena aggiornati
            return { 
                ...existing, 
                username, 
                email, 
                first_name: firstName, 
                last_name: lastName 
            }; 
        }

        // se non c'è, lo creiamo passando tutti i dati
        return await this.createUser(id, username, email, firstName, lastName);
    }
};