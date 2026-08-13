/**
 * Cliente HTTP central del frontend.
 * Toda comunicación con el backend pasa por aquí. Sus interceptores hacen
 * el JWT invisible: adjuntan el token en cada petición y renuevan el access
 * caducado con el refresh, reintentando la petición original de forma transparente.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// La URL del backend se lee de una variable de entorno de Vite:
// - En desarrollo (.env.development): apunta a localhost.
// - En producción (.env.production o variable de Vercel): apunta a Railway.
// El prefijo VITE_ es obligatorio para que Vite exponga la variable al navegador.
// El fallback a localhost protege si la variable no estuviera definida.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const client = axios.create({ baseURL: API_BASE_URL });

// PETICIÓN: adjunta el access token a cada llamada saliente.
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem("access_token");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// RESPUESTA: ante un 401, renueva con el refresh y reintenta una vez.
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const refresh = localStorage.getItem("refresh_token");

    if (error.response?.status === 401 && refresh && !original._retry) {
      original._retry = true;
      try {
        // axios "pelado" (no el client) para que esta llamada no pase por
        // los interceptores y no entre en recursión.
        const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch {
        // El refresh también murió: sesión terminada, al login.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;