import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    // recuperiamo anche la funzione 'login' dal context
    const { user, loading, login } = useAuth();

    useEffect(() => {
        // se il caricamento iniziale è finito e non c'è un utente...
        if (!loading && !user) {
            // ...chiamiamo la funzione che reindirizza a Keycloak
            login();
        }
    }, [user, loading, login]);

    // se stiamo caricando o se stiamo aspettando che parta il redirect al login
    if (loading || !user) {
        return <div>Caricamento in corso...</div>;
    }

    // se l'utente c'è, renderizziamo i figli
    return children;
}