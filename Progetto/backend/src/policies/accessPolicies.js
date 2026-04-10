import { createRequire } from "module";

const require = createRequire(import.meta.url);

const ROLE_HIERARCHY = require("./roles.json");

export function checkRoomAccess(userRoles, requiredLevel) {
    // 1. se non c'è un livello richiesto o è vuoto, assumiamo sia pubblico (o default student)
    if (!requiredLevel) return true;

    // 2. otteniamo il valore numerico della stanza dal file JSON
    // se il livello scritto nel DB non esiste nel JSON, diamo un valore base (1)
    const roomValue = ROLE_HIERARCHY[requiredLevel] || 1;

    // 3. calcoliamo il livello massimo dell'utente
    let userMaxLevel = 0;

    if (userRoles && Array.isArray(userRoles)) {
        userRoles.forEach(role => {
            const val = ROLE_HIERARCHY[role];
            // se il ruolo esiste nel nostro JSON e ha un valore più alto del massimo trovato finora
            if (val && val > userMaxLevel) {
                userMaxLevel = val;
            }
        });
    }

    // 4. se il livello dell'utente è maggiore o uguale a quello della stanza -> Accesso Consentito
    return userMaxLevel >= roomValue;
}

// helper per interrogare Keycloak
export const checkKeycloakPermission = async (userToken, resourceName, scope) => {
    try {
        const token = userToken.replace("Bearer ", "");

        const params = new URLSearchParams();
        params.append("grant_type", "urn:ietf:params:oauth:grant-type:uma-ticket");
        
        // Specifichiamo quale client detiene le risorse e le policy
        params.append("audience", process.env.KEYCLOAK_CLIENT_ID);
        params.append("permission", `${resourceName}#${scope}`);
        
        // Autentichiamo il backend stesso a Keycloak
        params.append("client_id", process.env.KEYCLOAK_CLIENT_ID);
        params.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET);

        const response = await fetch(`${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        // Se l'accesso è negato, logghiamo il motivo esatto per debug
        if (!response.ok) {
            const errorDetails = await response.text();
            console.warn(`[Keycloak] Permesso negato per ${resourceName}#${scope}. Dettagli:`, errorDetails);
            return false;
        }

        return true; 
    } catch (error) {
        console.error("Errore critico durante la verifica dei permessi su Keycloak:", error);
        return false;
    }
};