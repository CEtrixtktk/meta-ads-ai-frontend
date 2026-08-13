/**
 * Store de autenticación (Pinia).
 *
 * Fuente única de verdad sobre la sesión. Cualquier parte de la app consulta
 * aquí si hay sesión, en vez de revisar tokens por su cuenta. Centralizar esto
 * es lo que mantiene la autenticación coherente y fácil de mantener.
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as authApi from "@/api/auth";

export const useAuthStore = defineStore("auth", () => {
  // --- Estado ---
  // Inicializamos desde localStorage para que la sesión sobreviva a recargas
  // de página (F5 no te desloguea).
  const accessToken = ref<string | null>(localStorage.getItem("access_token"));
  const refreshToken = ref<string | null>(localStorage.getItem("refresh_token"));

  // --- Getter derivado ---
  // isAuthenticated es true si hay access token. El router lo usará para
  // decidir si dejar pasar a una ruta protegida.
  const isAuthenticated = computed(() => accessToken.value !== null);

  // --- Acciones ---
  /**
   * Inicia sesión: pide los tokens a la API y los persiste.
   * Si las credenciales fallan, authApi.login lanza y el error sube a la vista.
   */
  async function login(username: string, password: string) {
    const tokens = await authApi.login(username, password);
    // Guardamos en el estado reactivo Y en localStorage (persistencia).
    accessToken.value = tokens.access;
    refreshToken.value = tokens.refresh;
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
  }

  /**
   * Cierra sesión: limpia tokens de memoria y de localStorage.
   */
  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  return { accessToken, refreshToken, isAuthenticated, login, logout };
});