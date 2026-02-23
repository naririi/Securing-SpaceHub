import fs from 'fs';
import { cardModel } from "../models/cardModel.js";
import { readerModel } from "../models/readerModel.js";
import { bookingModel } from "../models/bookingModel.js";
import { logModel } from "../models/logModel.js";
import { verifySignature, signData } from "../utils/cryptoUtils.js";

// --- CONFIGURAZIONE DOTENV
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });
// caricamento della chiave privata del server
const SERVER_PRIVATE_KEY_PATH = process.env.SERVER_PRIVATE_KEY_PATH || path.resolve('keys', 'server_private.pem');
let SERVER_PRIVATE_KEY;

try {
    SERVER_PRIVATE_KEY = fs.readFileSync(SERVER_PRIVATE_KEY_PATH, 'utf8');
} catch (e) {
    console.error("ERRORE CRITICO: Impossibile caricare la chiave privata del server!", e.message);
}

// --- CONTROLLA ACCESSO
export const checkAccess = async (req, res) => {

  // definizione funzione per prendere i dati, firmarli e inviarli al reader
  const sendSignedResponse = (statusCode, payload) => {
      try {
          // aggiungiamo il timestamp del server per proteggere il lettore Python
          const payloadWithTime = {
              ...payload,
              server_timestamp: Date.now()
          };

          // firma i dati usando la chiave privata del server (ora include il timestamp)
          const signature = signData(payloadWithTime, SERVER_PRIVATE_KEY);
          
          // invia JSON con dati + firma
          return res.status(statusCode).json({ ...payloadWithTime, signature });
      } catch (err) {
          console.error("Errore durante la firma della risposta:", err);
          return res.status(500).json({ error: "Errore firma server" });
      }
  };

  try {
    // AGGIUNTA ANTI-REPLAY: Estraiamo anche il timestamp inviato dal lettore
    const { card_uid, reader_uid, timestamp, signature } = req.body;

    // check sui dati (aggiunto il controllo su timestamp)
    if (!card_uid || !reader_uid || !timestamp || !signature) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    // validazione della finestra temporale (Replay Resistance)
    const now = Date.now();
    const TOLERANCE_MS = 5000; // tolleranza di 5 secondi
    if (Math.abs(now - timestamp) > TOLERANCE_MS) {
      await logModel.createLog(null, reader_uid, false, "Accesso negato: Replay Attack rilevato (Timestamp scaduto)");
      return sendSignedResponse(401, { access: false, message: "Richiesta scaduta o orologio non sincronizzato" });
    }

    // 1. recupera la card
    const card = await cardModel.getCardByUID(card_uid);
    if (!card || !card.active) {
      await logModel.createLog(null, reader_uid, false, "Accesso negato: Card non valida o inattiva");
      return sendSignedResponse(401, { access: false, message: "Card non valida" });
    }

    // 2. recupera il reader
    const reader = await readerModel.getReaderByUID(reader_uid);
    if (!reader || !reader.is_active) {
      await logModel.createLog(card.id, null, false, "Accesso negato: Reader non valido o inattivo");
      return sendSignedResponse(401, { access: false, message: "Reader non valido" });
    }

    // 3. verifica firma (autenticità del reader) 
    // includiamo il timestamp nell'oggetto da verificare
    const validSignature = verifySignature({ card_uid, reader_uid, timestamp }, signature, reader.public_key);
    if (!validSignature) {
      await logModel.createLog(card.id, reader.id, false, "Accesso negato: Firma non valida");
      return sendSignedResponse(401, { access: false, message: "Firma non valida" });
    }

    // 4. controlla prenotazione attiva per la stanza (autorizzazione)
    const booking = await bookingModel.getActiveBookingForUserInRoom(
      card.user_id,
      reader.room_id,
      new Date(now) // utilizziamo il 'now' calcolato in precedenza
    );

    if (!booking) {
      await logModel.createLog(card.id, reader.id, false, "Accesso negato: Nessuna prenotazione");
      return sendSignedResponse(403, { access: false, message: "Nessuna prenotazione valida ora" });
    }

    // 5. accesso consentito
    await bookingModel.setCheckInStatus(booking.id);
    await logModel.createLog(card.id, reader.id, true, "Accesso consentito: Prenotazione valida");
    return sendSignedResponse(200, { access: true, message: "Accesso autorizzato" });

  } catch (err) {
    console.error("Errore in checkAccess:", err);
    return res.status(500).json({ access: false, message: "Errore interno server" });
  }
};