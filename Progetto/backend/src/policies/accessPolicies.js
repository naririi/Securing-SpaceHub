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