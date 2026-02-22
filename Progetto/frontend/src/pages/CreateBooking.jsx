import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { apiPost } from "../api";
import "../style/CreateBooking.css";

export default function CreateBooking() {
  const nav = useNavigate();
  const { token, user } = useAuth();      // recuperiamo il token JWT da inviare al backend e i dati utente per i ruoli
  const location = useLocation();   // hook per leggere i dati passati eventualmente da Rooms.jsx (state)

  const { preSelectedRoom, preSelectedStart, preSelectedEnd, accessLevel } = location.state || {};
  // usa i dati precompilati come valori iniziali, altrimenti stringhe vuote
  const [roomId, setRoomId] = useState(preSelectedRoom || "");
  const [startTime, setStartTime] = useState(preSelectedStart || "");
  const [endTime, setEndTime] = useState(preSelectedEnd || "");

  const [errorMsg, setErrorMsg] = useState("");         // messaggio rosso (errore)
  const [successMsg, setSuccessMsg] = useState("");     // messaggio verde (successo)

  const [roleHierarchy, setRoleHierarchy] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // effetto che parte all'avvio per scaricare la gerarchia dei ruoli dal backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("/api/roles");
        if (response.ok) {
          const data = await response.json();
          setRoleHierarchy(data); 
        } else {
          console.error("Errore API nel recupero dei ruoli");
        }
      } catch (err) {
        console.error("Errore di rete nel recupero dei ruoli:", err);
      } finally {
        setIsLoadingRoles(false); 
      }
    };

    fetchRoles();
  }, []);

  // --- LOGICA AUTORIZZAZIONE CLIENT-SIDE ---
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
  const requiredLevel = (accessLevel && roleHierarchy) ? (roleHierarchy[accessLevel] || 1) : 1;
  const isAuthorized = userLevel >= requiredLevel;

  // funzione che gestisce l'invio dei dati del form al backend 
  const handleCreate = async (e) => {
    e.preventDefault();

    // reset messaggi precedenti
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // passiamo il token come terzo argomento alla funzione apiPost
      const data = await apiPost("/api/crea-prenotazione", { roomId, startTime, endTime }, token);

      if (data.error) {
        setErrorMsg(data.error || "Errore sconosciuto");
        return;
      }

      // successo
      setSuccessMsg("Prenotazione creata con successo! Reindirizzamento...");
      // attesa di 2 secondi e reindirizzamento
      setTimeout(() => {
        nav("/my-bookings"); 
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Errore di connessione al server.");
    }
  };

  return (
    <div className="create-page">
      <div className="create-card">
        
        <h2 className="form-title">
            Prenota <span>Spazio</span>
        </h2>

        <form onSubmit={handleCreate} className="booking-form">
          
          <div className="form-group">
            <label>ID Stanza</label>
            <input
                className="form-input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                placeholder="Es. 101"
                // se preSelectedRoom esiste, blocchiamo la modifica per comodità
                readOnly={!!preSelectedRoom} 
            />
          </div>

          <div className="form-group">
            <label>Inizio</label>
            <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
            />
          </div>

          <div className="form-group">
            <label>Fine</label>
            <input
                type="datetime-local"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
            />
          </div>

          {/* CHECK AUTORIZZAZIONE */}
          {isLoadingRoles ? (
            <p style={{ textAlign: "center", marginTop: "1rem" }}>Verifica permessi in corso...</p>
          ) : isAuthorized ? (
            <button type="submit" className="submit-btn" disabled={!!successMsg}>
              {successMsg ? "Attendi..." : "Conferma Prenotazione"}
            </button>
          ) : (
            <div className="msg-box error" style={{ textAlign: "center", marginTop: "1rem" }}>
              ⛔ Accesso Negato <br/>
              Questa aula richiede un livello di accesso: <strong>{accessLevel}</strong>.<br/>
              Il tuo ruolo non è sufficiente per prenotarla.
            </div>
          )}

        </form>

        {/* box messaggi */}
        {errorMsg && (
            <div className="msg-box error">
                ⚠️ {errorMsg}
            </div>
        )}

        {successMsg && (
            <div className="msg-box success">
                ✅ {successMsg}
            </div>
        )}

      </div>
    </div>
  );
}