import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/AuthContext";
import "../style/Home.css";

export default function Home() {
    const nav = useNavigate();
    // recuperiamo 'login' e 'token' dal context (e 'user' per leggere i ruoli)
    const { user, login, token } = useAuth();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [roleHierarchy, setRoleHierarchy] = useState(null);

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

    // helper per ottenere la stringa "YYYY-MM-DDTHH:MM" dell'ora locale
    const getLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    // al caricamento, cerca le aule disponibili in questo momento
    useEffect(() => {
        async function fetchNow() {
            setLoading(true);
            try {
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);  // +1 ora

                const startStr = getLocalISOString(now);
                const endStr = getLocalISOString(oneHourLater);

                // passiamo il token come secondo argomento (se null, apiGet non mette l'header, va bene per endpoint pubblici)
                const res = await apiGet(
                    `/api/aule-disponibili?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`,
                    token
                );

                const fetchedRooms = res.rooms || [];
                // ordina per ID
                fetchedRooms.sort((a, b) => a.id - b.id);
                setRooms(fetchedRooms);

            } catch (err) {
                console.error("Errore home fetch:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNow();

        // timer per aggiornare l'orologio visualizzato ogni minuto
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [token]);

    // gestione click su "Prenota Subito"
    const handleQuickBook = (roomId, accessLevel) => {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        nav("/create-booking", {
            state: {
                preSelectedRoom: roomId,
                preSelectedStart: getLocalISOString(now),
                preSelectedEnd: getLocalISOString(oneHourLater),
                accessLevel: accessLevel // passiamo il livello richiesto alla pagina di creazione
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
        <div className="home-page">
            
            {/* HERO SECTION */}
            <div className="home-hero">
                <h1 className="hero-title">
                    {user ? (
                        <>
                            Ciao, {user.username}! 
                            {/* visualizzazione dello status utente */}
                            <span className="status-badge" style={{
                                fontSize: "0.5em", 
                                verticalAlign: "middle", 
                                marginLeft: "10px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: user.roles.includes('professor') ? "#9n25ff" : 
                                                 user.roles.includes('admin') ? "#7ab0off" : "#9nc5ff",
                                color: "#fff",
                                textTransform: "uppercase"
                            }}>
                                {user.roles.includes('admin') ? 'Admin' : 
                                 user.roles.includes('professor') ? 'Professore' : 'Studente'}
                            </span>
                        </>
                    ) : (
                        "Benvenuto in SpaceHub 💬"
                    )}
                </h1>
                <p className="hero-subtitle">
                    Trova e prenota la tua aula ideale in pochi secondi
                </p>
            </div>

            <div className="home-container">
                
                {/* QUICK ACTIONS */}
                <div className="actions-grid">
                    <div className="action-card" onClick={() => nav("/rooms")}>
                        <span className="action-icon">🔍</span>
                        <h3 className="action-title">Cerca Aule</h3>
                        <p className="action-desc">Filtra per data e orario specifico</p>
                    </div>

                    {/* se non c'è user, chiama login() */}
                    <div className="action-card" onClick={() => user ? nav("/my-bookings") : login()}>
                        <span className="action-icon">📅</span>
                        <h3 className="action-title">Le mie Prenotazioni</h3>
                        <p className="action-desc">Gestisci le tue prenotazioni e avvia la riunione</p>
                    </div>
                </div>

                {/* LIVE AVAILABILITY */}
                <h2 className="section-title">
                    <span className="live-indicator"></span>
                    Libere adesso ({currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                </h2>

                {loading ? (
                    <p className="loading-text">Caricamento disponibilità in tempo reale...</p>
                ) : (
                    <>
                        {rooms.length === 0 ? (
                            <p className="loading-text">Nessuna aula libera in questo momento. Prova a cercare per un altro orario.</p>
                        ) : (
                            <div className="home-rooms-grid">
                                {rooms.map((r, index) => {
                                    // verifichiamo se l'utente ha l'autorizzazione
                                    const isAuthorized = checkRoomAccess(r.accessLevel);

                                    return (
                                        <div key={r.id} className="home-room-card">
                                            <div className="h-room-header" style={{ background: getCardGradient(index) }}>
                                                <span>ID: {r.id}</span>
                                                {r.available && <span>✔</span>}
                                            </div>
                                            <div className="h-room-body">
                                                <h4 className="h-room-name">{r.name}</h4>
                                                <span className="h-room-info">📍 {r.location}</span>
                                                <span className="h-room-info">👥 Cap: {r.capacity}</span>
                                                
                                                {/* info sul livello e logica del bottone in base all'autorizzazione */}
                                                <span className="h-room-info" style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                                                    🔐 Lvl: {r.accessLevel || 'student'}
                                                </span>

                                                {r.available && (
                                                    isAuthorized ? (
                                                        <button 
                                                            className="h-room-btn"
                                                            onClick={() => handleQuickBook(r.id, r.accessLevel)}
                                                        >
                                                            Prenota per 1 ora
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="h-room-btn" 
                                                            style={{ backgroundColor: "#ccc", cursor: "not-allowed", color: "#666" }}
                                                            disabled
                                                        >
                                                            Livello Insufficiente
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}