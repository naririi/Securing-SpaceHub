import * as policies from "../controllers/policiesController.js";

export default function policiesRoutes(app) {
    // recupera la gerarchia dei ruoli per il frontend
    // questa rotta è pubblica (non ha auth.requireLogin) 
    app.route("/api/roles")
        .get(policies.getRoleHierarchy);
};