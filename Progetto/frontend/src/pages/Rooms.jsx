import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/AuthContext";
import "../style/Rooms.css"; 

export default function Rooms() {
    const nav = useNavigate();
    const { token, user } = useAuth(); // recuperiamo anche user per leggere i ruoli

    // adesso l'utente inserisce prima la data e poi gli orari di inizio e fine
    // quindi utilizziamo degli stati separati per data e ora
    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    
    const [rooms, setRooms] = useState([]);     // array per contenere l'elenco delle aule restituite dal backend
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    const [roleHierarchy, setRoleHierarchy] = useState(null);

    // effetto per caricare la gerarchia dei ruoli all'avvio della pagina
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch("/api/roles");
                if (response.ok) {
                    const data = await response.json();
                    setRoleHierarchy(data);
                }
            } catch (err) {
                console.error("Errore nel recupero della gerarchia ruoli:", err);
            }
        };
        fetchRoles();
    }, []);

    // helper per calcolare il livello dell'utente loggato
    const getUserLevel = (roles) => {
        if (!roleHierarchy || !roles || roles.length === 0) return 1; 

        let maxLevel = 0;
        roles.forEach(role => {
            const val = roleHierarchy[role];
            if (val && val > maxLevel) {
                maxLevel = val;
            }
        });
        
        return maxLevel === 0 ? (roleHierarchy.student || 1) : maxLevel;
    };

    const userLevel = getUserLevel(user?.roles);

    // funzione che controlla se l'utente può prenotare la singola stanza
    const checkRoomAccess = (roomAccessLevel) => {
        const requiredLevel = (roomAccessLevel && roleHierarchy) ? (roleHierarchy[roomAccessLevel] || 1) : 1;
        return userLevel >= requiredLevel;
    };

    async function loadRooms() {
        setError("");
        setSearched(true); // imposta che abbiamo provato a cercare

        // validazione anche su frontend
        if (!selectedDate || !startTime || !endTime) {
            setError("Inserisci la data e gli orari di inizio e fine.");
            return;
        }

        // controllo coerenza orari
        if (startTime >= endTime) {
            setError("L'orario di inizio deve essere precedente all'orario di fine.");
            setRooms([]); // pulisce eventuali risultati precedenti
            return;
        }

        // combinazione stringhe per creare il formato corretto (YYYY-MM-DDTHH:MM)
        const startFull = `${selectedDate}T${startTime}`;
        const endFull = `${selectedDate}T${endTime}`;

        try {
            // passiamo il token
            const res = await apiGet(
                `/api/aule-disponibili?start=${encodeURIComponent(startFull)}&end=${encodeURIComponent(endFull)}`,
                token
            );
            
            const fetchedRooms = res.rooms || [];           // agguirna lo stato di rooms con l'elenco di aule restituito
            fetchedRooms.sort((a, b) => a.id - b.id);       // ordina array in base all'id
            
            setRooms(fetchedRooms);
        } catch (err) {
            console.error(err);
            setError("Errore nel caricamento delle aule.");
        }
    }

    // funzione per gestire il click su "Prenota" (AGGIUNTO accessLevel tra i parametri)
    const handleBookClick = (roomId, accessLevel) => {
        const startFull = `${selectedDate}T${startTime}`;
        const endFull = `${selectedDate}T${endTime}`;

        // naviga verso la pagina di creazione passando i dati nello 'state'
        nav("/create-booking", {
            state: {
                preSelectedRoom: roomId,
                preSelectedStart: startFull,
                preSelectedEnd: endFull,
                accessLevel: accessLevel // passiamo anche questo a CreateBooking
            }
        });
    };

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

    return (
        <div className="rooms-page">
            
            {/* --- HEADER BANNER --- */}
            <div className="rooms-banner">
                <h1>🔍 Trova la tua Aula</h1>
            </div>

            {/* --- SEARCH SECTION --- */}
            <div className="search-container">
                <h3 className="search-title">Cerca disponibilità</h3>
                
                <div className="search-form">
                    
                    {/* input data */}
                    <div className="input-group">
                        <label>📅 Seleziona Data</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* input ora inizio */}
                    <div className="input-group">
                        <label>🕒 Ora Inizio</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* input ora fine */}
                    <div className="input-group">
                        <label>🕒 Ora Fine</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* bottone cerca */}
                    <button onClick={loadRooms} className="search-button">
                        Cerca Aule
                    </button>
                </div>

                {/* messaggio di errore (rosso) */}
                {error && <p className="error-msg">{error}</p>}
            </div>

            {/* --- RESULTS SECTION --- */}
            <div className="results-container">
                <h3 className="results-title">Aule disponibili</h3>

                {searched && rooms.length === 0 && !error && (
                    <p className="no-result">Nessuna aula trovata per questo orario.</p>
                )}

                <div className="rooms-grid">
                    {rooms.map((r, index) => {
                        // verifichiamo se l'utente ha l'autorizzazione per questa singola stanza
                        const isAuthorized = checkRoomAccess(r.accessLevel);

                        return (
                            <div key={r.id} className="room-card">
                                <div className="card-header" style={{ background: getCardGradient(index) }}>
                                    <div className="badge-container">
                                        {r.available ? (
                                            <span className="badge success">✔ Disponibile</span>
                                        ) : (
                                            <span className="badge error">✖ Occupata</span>
                                        )}
                                    </div>
                                    <h4 className="card-room-code">ID: {r.id}</h4>
                                </div>

                                <div className="card-body">
                                    <h3 className="card-title">{r.name}</h3>
                                    <p className="card-detail">📍 {r.location}</p>
                                    <p className="card-detail">👥 Capienza: {r.capacity} persone</p>
                                    {/* aggiunto per far capire all'utente chi può prenotare */}
                                    <p className="card-detail" style={{ fontSize: "0.85rem", color: "#555" }}>
                                        🔐 Livello richiesto: <strong>{r.accessLevel || 'student'}</strong>
                                    </p>

                                    {/* logica dei bottoni condizionale per permessi e disponibilità */}
                                    {r.available ? (
                                        isAuthorized ? (
                                            <button 
                                                onClick={() => handleBookClick(r.id, r.accessLevel)} 
                                                className="book-button"
                                            >
                                                Prenota Ora
                                            </button>
                                        ) : (
                                            <button disabled className="book-button" style={{ backgroundColor: "#ccc", cursor: "not-allowed", color: "#666" }}>
                                                Livello Insufficiente
                                            </button>
                                        )
                                    ) : (
                                        <button disabled className="book-button" style={{ backgroundColor: "#ffebee", color: "#d32f2f", cursor: "not-allowed" }}>
                                            Non Disponibile
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}