import { createContext, useContext, useState, useEffect } from "react";
import Keycloak from "keycloak-js";

// configurazione di Keycloak
const client = new Keycloak({
    url: "https://localhost:8443",
    realm: "spacehub", 
    clientId: "spacehub"       
});

// il context è un meccanismo fornito da React che ti permette di condividere dati tra i componenti (es. lo stato)

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);         // dichiara lo stato locale per tenere traccia dell'utente loggato
    const [loading, setLoading] = useState(true);   // stato di caricamento della pagina (per non reindirizzare a login quando si ricarica la pagina)
    const [token, setToken] = useState(null);       // stato per il token JWT da usare nelle chiamate API

    // funzione login: reindirizza alla pagina di login di Keycloak
    function login() {
        client.login();
    }

    // funzione logout: esegue il logout su Keycloak
    function logout() {
        client.logout();
        setUser(null);
        setToken(null);
    }

    // funzione register: reindirizza alla pagina di registrazione di Keycloak
    function register() {
        client.register();
    }

    // viene eseguito al montaggio del componente, verifica subito se l'utente è loggato
    useEffect(() => {
        // inizializza Keycloak invece di chiamare checkAuth personalizzato
        client.init({ onLoad: "check-sso", checkLoginIframe: false })
            .then(authenticated => {
                if (authenticated) {
                    setToken(client.token);
                    // carica il profilo utente da Keycloak
                    client.loadUserProfile().then(profile => {
                        setUser({
                            ...profile,
                            username: profile.username,
                            // mappiamo i ruoli di Keycloak dentro l'oggetto user per compatibilità
                            roles: client.realmAccess?.roles || []
                        });
                    });
                } else {
                    setUser(null);
                }
            })
            .catch(err => {
                console.error("Errore inizializzazione Keycloak:", err);
                setUser(null);
            })
            .finally(() => {
                // finito il controllo (con successo o errore), togliamo il caricamento
                setLoading(false);
            });
    }, []);

    // rende disponibile ai componenti figli i valori user, login, logout e register.
    // token' servirà per le chiamate al backend
    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading, token }}>
            {children}      
        </AuthContext.Provider>
    );
}