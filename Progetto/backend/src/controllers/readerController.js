import { cardModel } from "../models/cardModel.js";
import { readerModel } from "../models/readerModel.js";
import { bookingModel } from "../models/bookingModel.js";
import { logModel } from "../models/logModel.js";
import { verifySignature, signData } from "../utils/cryptoUtils.js";

// --- CONTROLLA ACCESSO
export const checkAccess = async (req, res) => {

  // definizione funzione per prendere i dati, firmarli e inviarli al reader
  const sendSignedResponse = (statusCode, payload) => {
      try {
          const SERVER_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;

          if (!SERVER_PRIVATE_KEY) {
              console.error("ERRORE CRITICO: Chiave privata del server non trovata in memoria!");
              return res.status(500).json({ error: "Errore configurazione crittografica" });
          }

          // aggiungiamo il timestamp del server per proteggere il lettore Python
          const payloadWithTime = {
              ...payload,
              server_timestamp: Date.now()
          };

          // firma i dati usando la chiave privata del server recuperata dal Vault
          const signature = signData(payloadWithTime, SERVER_PRIVATE_KEY);
          
          // invia JSON con dati + firma
          return res.status(statusCode).json({ ...payloadWithTime, signature });
      } catch (err) {
          console.error("Errore durante la firma della risposta:", err);
          return res.status(500).json({ error: "Errore firma server" });
      }
  };

  try {
    const { card_uid, reader_uid, timestamp, signature } = req.body;

    // check sui dati (aggiunto il controllo su timestamp)
    if (!card_uid || !reader_uid || !timestamp || !signature) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    // validazione della finestra temporale (replay resistance)
    const now = Date.now();
    const TOLERANCE_MS = 5000; // tolleranza di 5 secondi
    if (Math.abs(now - timestamp) > TOLERANCE_MS) {
      await logModel.createLog(card_uid, reader_uid, false, "Accesso negato: Replay Attack rilevato (Timestamp scaduto)");
      return sendSignedResponse(401, { access: false, message: "Richiesta scaduta o orologio non sincronizzato" });
    }

    // 1. recupera la card
    const card = await cardModel.getCardByUID(card_uid);
    if (!card || !card.active) {
      await logModel.createLog(card_uid, reader_uid, false, "Accesso negato: Card non valida o inattiva");
      return sendSignedResponse(401, { access: false, message: "Card non valida" });
    }

    // 2. recupera il reader
    const reader = await readerModel.getReaderByUID(reader_uid);
    if (!reader || !reader.is_active) {
      await logModel.createLog(card_uid, reader_uid, false, "Accesso negato: Reader non valido o inattivo");
      return sendSignedResponse(401, { access: false, message: "Reader non valido" });
    }

    // 3. verifica firma (autenticità del reader) 
    const validSignature = verifySignature({ card_uid, reader_uid, timestamp }, signature, reader.public_key);
    if (!validSignature) {
      await logModel.createLog(card_uid, reader_uid, false, "Accesso negato: Firma non valida");
      return sendSignedResponse(401, { access: false, message: "Firma non valida" });
    }

    // 4. controlla prenotazione attiva per la stanza (autorizzazione)
    const booking = await bookingModel.getActiveBookingForUserInRoom(
      card.user_id,
      reader.room_id,
      new Date(now)
    );

    if (!booking) {
      await logModel.createLog(card_uid, reader_uid, false, "Accesso negato: Nessuna prenotazione");
      return sendSignedResponse(403, { access: false, message: "Nessuna prenotazione valida ora" });
    }

    // 5. accesso consentito
    await bookingModel.setCheckInStatus(booking.id);
    await logModel.createLog(card_uid, reader_uid, true, "Accesso consentito: Prenotazione valida");
    
    return sendSignedResponse(200, { access: true, message: "Accesso autorizzato" });

  } catch (err) {
    console.error("Errore in checkAccess:", err);
    return res.status(500).json({ access: false, message: "Errore interno server" });
  }
};
