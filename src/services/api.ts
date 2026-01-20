
const getApiBase = () => {
    // In development/local network, use the current hostname but port 3000
    const hostname = window.location.hostname;
    return `http://${hostname}:3000/api`;
};

const API_BASE = getApiBase();

export const api = {
    get: async (endpoint: string) => {
        const userId = localStorage.getItem('uz_parking_session');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (userId) {
            headers['x-user-id'] = userId;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, { headers });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        const userId = localStorage.getItem('uz_parking_session');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (userId) {
            headers['x-user-id'] = userId;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    put: async (endpoint: string, body: any) => {
        const userId = localStorage.getItem('uz_parking_session');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (userId) {
            headers['x-user-id'] = userId;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },

    patch: async (endpoint: string, body: any) => {
        const userId = localStorage.getItem('uz_parking_session');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (userId) {
            headers['x-user-id'] = userId;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },
};
