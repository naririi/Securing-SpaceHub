import { bookingModel } from "../models/bookingModel.js";
import { roomModel } from "../models/roomModel.js";
import { userModel } from "../models/userModel.js";
import { checkKeycloakPermission } from "../policies/accessPolicies.js"; // Assicurati che questo percorso sia corretto

// helper per convertire la data JS in formato compatibile con mariadb 'YYYY-MM-DD HH:MM:SS'
const toSqlDate = (dateObj) => {
    return dateObj.toISOString().slice(0, 19).replace('T', ' ');
};

// --- LISTA AULE DISPONIBILI
export const listRooms = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Parametri mancanti: start ed end sono obbligatori." });
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Formato data/ora non valido. Usa ISO 8601." });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: "L'orario di inizio deve essere precedente alla fine." });
    }

    const sqlStart = toSqlDate(startTime);
    const sqlEnd = toSqlDate(endTime);

    const rooms = await roomModel.getAllRooms();
    const result = [];
    
    for (const r of rooms) {
      const overlap = await bookingModel.hasOverlap(r.id, sqlStart, sqlEnd);
      result.push({
        id: r.id,
        name: r.name,
        location: r.location,
        capacity: r.capacity,
        accessLevel: r.access_level, 
        available: !overlap
      });
    }

    return res.json({ 
        start: startTime.toISOString(), 
        end: endTime.toISOString(), 
        rooms: result 
    });

  } catch (err) {
    console.error("Errore in listRooms:", err);
    return res.status(500).json({ error: "Errore interno server" });
  }
};


// --- RECUPERA SINGOLA PRENOTAZIONE UTENTE
export const getUserBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId    = req.user.id; 
        const booking   = await bookingModel.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non puoi visualizzare questa prenotazione" });
        }

        res.json({ booking });

    } catch (err) {
        console.error("Errore in getUserBookingById:", err);
        res.status(500).json({ error: "Errore nel recupero della prenotazione" });
    }
};


// --- RECUPERA TUTTE LE PRENOTAZIONI UTENTE
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await bookingModel.getActiveBookingsByUser(userId);
        res.json({ bookings });
    } catch (err) {
        console.error("Errore in getUserBookings:", err);
        res.status(500).json({ error: "Errore nel recupero delle prenotazioni" });
    }
};


// --- CREA PRENOTAZIONE (Check UMA: 'book')
export const createBooking = async (req, res) => {
    try {
        const { id, username, email, given_name, family_name } = req.user;
        const { roomId, startTime, endTime } = req.body;
        const userToken = req.headers.authorization; 

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ error: "Dati mancanti" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({ error: "Date non valide" });
        }

        const room = await roomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ error: "Stanza inesistente" });
        }

        // --- VERIFICA PERMESSO SU KEYCLOAK ---
        const resourceName = `room-${roomId}`; // Adatta se usi una risorsa generica es: "Room"
        const canBook = await checkKeycloakPermission(userToken, resourceName, "book");

        if (!canBook) {
            return res.status(403).json({ 
                error: "Accesso negato. Non hai i permessi necessari su Keycloak per prenotare questa aula." 
            });
        }
        // -------------------------------------

        const sqlStart = toSqlDate(start);
        const sqlEnd = toSqlDate(end);

        const overlap = await bookingModel.hasOverlap(roomId, sqlStart, sqlEnd);
        if (overlap) {
            return res.status(400).json({ error: "La stanza è già occupata in quell'orario" });
        }

        await userModel.ensureUserExists(id, username, email, given_name, family_name);
        
        const booking = await bookingModel.createBooking(id, roomId, sqlStart, sqlEnd);

        res.json({ message: "Prenotazione creata con successo", bookingId: booking.id });

    } catch (err) {
        console.error("Errore in createBooking:", err);
        res.status(500).json({ error: "Errore durante la creazione della prenotazione" });
    }
};


// --- MODIFICA PRENOTAZIONE (Check UMA: 'edit')
export const updateBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookingId = req.params.id;
        const { startTime, endTime } = req.body;
        const userToken = req.headers.authorization;

        if (!startTime || !endTime) return res.status(400).json({ error: "Dati mancanti" });

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({ error: "Date non valide" });
        }

        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) return res.status(404).json({ error: "Prenotazione non trovata" });

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non puoi modificare questa prenotazione" });
        }

        // --- VERIFICA PERMESSO SU KEYCLOAK ---
        const resourceName = `room-${booking.room_id}`;
        const canEdit = await checkKeycloakPermission(userToken, resourceName, "edit");

        if (!canEdit) {
            return res.status(403).json({ error: "Permesso 'edit' negato da Keycloak" });
        }
        // -------------------------------------

        const sqlStart = toSqlDate(start);
        const sqlEnd = toSqlDate(end);

        const overlap = await bookingModel.hasOverlap(booking.room_id, sqlStart, sqlEnd);
        const currentDbStart = toSqlDate(new Date(booking.start_time));
        const currentDbEnd = toSqlDate(new Date(booking.end_time));

        if (overlap && !(currentDbStart === sqlStart && currentDbEnd === sqlEnd)) {
            return res.status(400).json({ error: "Nuovo orario non disponibile, stanza occupata" });
        }

        await bookingModel.updateBooking(bookingId, sqlStart, sqlEnd);
        res.json({ message: "Prenotazione aggiornata correttamente" });

    } catch (err) {
        console.error("Errore in updateBooking:", err);
        res.status(500).json({ error: "Errore nell'aggiornamento della prenotazione" });
    }
};


// --- ELIMINA PRENOTAZIONE (Check UMA: 'delete')
export const deleteBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookingId = req.params.id;
        const userToken = req.headers.authorization;

        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) return res.status(404).json({ error: "Prenotazione non trovata" });

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non hai permesso per eliminarla" });
        }

        // --- VERIFICA PERMESSO SU KEYCLOAK ---
        const resourceName = `room-${booking.room_id}`;
        const canDelete = await checkKeycloakPermission(userToken, resourceName, "delete");

        if (!canDelete) {
            return res.status(403).json({ error: "Permesso 'delete' negato da Keycloak" });
        }
        // -------------------------------------

        await bookingModel.deleteBooking(bookingId);
        res.json({ message: "Prenotazione cancellata" });

    } catch (err) {
        console.error("Errore in deleteBooking:", err);
        res.status(500).json({ error: "Errore nella cancellazione della prenotazione" });
    }
};