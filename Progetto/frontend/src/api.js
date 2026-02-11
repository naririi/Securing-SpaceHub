const API_BASE = "https://localhost:3000";

// funzione helper per costruire gli headers
function getHeaders(token) {
    const headers = {
        "Content-Type": "application/json"
    };
    // se abbiamo un token, aggiungiamo l'header Authorization: Bearer <token>
    // questo è lo standard definito per OAuth2 
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiGet(url, token = null) {
    const res = await fetch(API_BASE + url, {
        method: "GET",
        headers: getHeaders(token)
    });
    return res.json();
}

export async function apiPost(url, data, token = null) {
    const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function apiPut(url, data, token = null) {
    const res = await fetch(API_BASE + url, {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function apiDelete(url, token = null) {
    const res = await fetch(API_BASE + url, {
        method: "DELETE",
        headers: getHeaders(token)
    });
    return res.json();
}