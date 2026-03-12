import axios from "axios";

const api = axios.create({
    baseURL: (() => {
        let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        // Ensure the URL ends with /api/
        if (!url.endsWith('/api') && !url.endsWith('/api/')) {
            url = url.endsWith('/') ? `${url}api/` : `${url}/api/`;
        } else if (!url.endsWith('/')) {
            url = `${url}/`;
        }
        return url;
    })(),
    headers: {
        "Content-Type": "application/json",
    },
});

console.log("API baseURL initialized as:", api.defaults.baseURL);

// Interceptor to add JWT token to requests
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
        console.log(`API Request [${config.method?.toUpperCase()} ${config.url}]: Token present (${token.substring(0, 10)}...)`);
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn(`API Request [${config.method?.toUpperCase()} ${config.url}]: No token found in localStorage`);
    }
    return config;
});

export default api;
