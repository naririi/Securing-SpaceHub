import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../api";
import "../style/MyBookings.css";

// funzione che controlla se la prenotazione è attiva ORA
function isBookingActive(start, end) {
    const now = new Date();
    return now >= new Date(start) && now <= new Date(end);
}

export default function MyBookings() {
    const [list, setList] = useState([]);
    // messaggi di feedback (verdi -> successo / rosso -> fallimento)
    const [feedback, setFeedback] = useState({ msg: "", type: "" });

    // funzione per prelevare tutte le prenotazioni dell'utente
    async function load() {
        try {
            const res = await apiGet("/api/prenotazioni");
            // le prenotazioni sono ordinate dalla più recente alla più vecchia
            const bookings = res.bookings || [];
            bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            setList(bookings);
        } catch (err) {
            console.error(err);
            setList([]); // in caso di errore, reset della lista
        }
    }

    async function del(id) {
        if (!confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;

        try {
            const res = await apiDelete(`/api/prenotazioni/${id}`);
            if (res.error) {
                setFeedback({ msg: res.error, type: "error" });
            } else {
                load();
                setFeedback({ msg: "Prenotazione eliminata con successo!", type: "success" });
                // rimuovi messaggio dopo 3 secondi
                setTimeout(() => setFeedback({ msg: "", type: "" }), 3000);
            }
        } catch (err) {
            console.error(err);
            setFeedback({ msg: "Errore durante l'eliminazione.", type: "error" });
        }
    }

    useEffect(() => { load(); }, []);

    // helper per cambiare i colori alle prenotazioni
    const getCardGradient = (index) => {
        const gradients = [
            "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
            "linear-gradient(135deg, #9baee7 0%, #83b5fe 100%)",
            "linear-gradient(135deg, #a18cd1 0%, #a1c4fd 100%)",
            "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
        ];
        return gradients[index % gradients.length];
    };

    // helper per formattare la data per il frontend
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bookings-page">
            <div className="bookings-banner">
                <h1>📅 Le mie Prenotazioni</h1>
            </div>

            <div className="bookings-container">

                {/* feedback Message */}
                {feedback.msg && (
                    <div className={`feedback-msg ${feedback.type}`}>
                        {feedback.msg}
                    </div>
                )}

                {list.length === 0 && !feedback.msg && (
                    <div className="no-bookings">
                        <p>Non hai ancora effettuato prenotazioni.</p>
                        <Link to="/rooms" style={{ color: "#a18cd1", fontWeight: "bold" }}>
                            Prenota un'aula ora
                        </Link>
                    </div>
                )}

                <div className="bookings-grid">
                    {list.map((b, index) => {

                        return (
                            <div key={b.id} className="booking-card">

                                {/* header Colorato */}
                                <div className="booking-header" style={{ background: getCardGradient(index) }}>
                                    <div>
                                        <h3 className="booking-room-title">Aula {b.room_id}</h3>
                                    </div>
                                    <span className="booking-id">#{b.id}</span>
                                </div>

                                {/* body con dettagli sulla prenotazione */}
                                <div className="booking-body">
                                    <div className="info-row">
                                        <span className="icon">🗓️</span>
                                        <span>{formatDate(b.start_time)}</span>
                                    </div>

                                    <div className="info-row">
                                        <span className="icon">🕒</span>
                                        <span>
                                            {formatTime(b.start_time)} ➔ {formatTime(b.end_time)}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    backgroundColor: b.check_in ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span style={{ fontSize: '1.5em' }}>
                                        {b.check_in ? "🪑" : "⏳"}
                                    </span>
                                    <div>
                                        <strong style={{ display: 'block', color: b.check_in ? '#2ecc71' : '#aaa' }}>
                                            {b.check_in ? "Accesso fisico rilevato" : "Accesso fisico non rilevato"}
                                        </strong>
                                        <small style={{ color: '#ccc' }}>
                                            {b.check_in 
                                                ? "La porta è stata aperta tramite badge." 
                                                : "Nessun ingresso registrato dal lettore."}
                                        </small>
                                    </div>
                                </div>

                                {/* azioni (modifica, elimina) */}
                                <div className="booking-actions">
                                    <Link to={`/edit-booking/${b.id}`} className="btn-action btn-edit">
                                        ✏️ Modifica
                                    </Link>
                                    <button onClick={() => del(b.id)} className="btn-action btn-delete">
                                        🗑️ Elimina
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}