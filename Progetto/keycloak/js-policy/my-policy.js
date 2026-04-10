// 1. Estraiamo le variabili dal contesto $evaluation
var context = $evaluation.getContext();
var identity = context.getIdentity();
var permission = $evaluation.getPermission();
var resource = permission.getResource();

// 2. Recuperiamo il livello richiesto dalla risorsa (aula)
var requiredLevelName = null;
if (resource != null && resource.getAttributes() != null && resource.getAttributes().containsKey("access_level")) {
    var attributeValues = resource.getAttributes().get("access_level");
    if (attributeValues != null && !attributeValues.isEmpty()) {
        requiredLevelName = attributeValues.get(0);
    }
}

// Mappatura gerarchia
var hierarchy = {
  "student": 1,
  "professor": 2,
  "admin": 3
};

// Se la stanza non ha un livello impostato, di default richiede livello 0 (accesso a tutti)
var requiredLevel = 0;
if (requiredLevelName != null && hierarchy[requiredLevelName] !== undefined) {
    requiredLevel = hierarchy[requiredLevelName];
}

// 3. Calcoliamo il livello dell'utente
var userLevel = 0;

if (identity.hasRealmRole("admin")) {
    userLevel = 3;
} else if (identity.hasRealmRole("professor")) {
    userLevel = 2;
} else if (identity.hasRealmRole("student")) {
    userLevel = 1;
}

// 4. Valutazione finale
if (userLevel >= requiredLevel) {
    $evaluation.grant();
} else {
    $evaluation.deny();
}