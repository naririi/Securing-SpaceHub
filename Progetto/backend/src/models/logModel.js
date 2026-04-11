import { pool } from "../services/db.js";

export const logModel = {
    async createLog(cardUid, readerUid, accessGranted, message) {
        await pool.query(
            `INSERT INTO access_logs (card_id, reader_id, access_granted, message)
             VALUES (
                 (SELECT id FROM cards WHERE card_uid = ?), 
                 (SELECT id FROM readers WHERE reader_uid = ?), 
                 ?, 
                 ?
             )`,
            [cardUid, readerUid, accessGranted ? 1 : 0, message]
        );
    }
};
