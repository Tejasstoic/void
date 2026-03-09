import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://void-backend-kia3.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

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
