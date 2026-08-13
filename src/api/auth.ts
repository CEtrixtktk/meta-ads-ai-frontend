/**
 * Funciones que llaman a los endpoints de autenticación del backend.
 * Aíslan las URLs y la forma de los datos, para que el store no sepa de HTTP.
 */
import client from "./client";

// Forma de la respuesta del login: los dos tokens que devuelve DRF SimpleJWT.
export interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * Inicia sesión: envía credenciales y devuelve el par de tokens.
 * Lanza error (que la vista captura) si las credenciales son inválidas.
 */
export async function login(username: string, password: string): Promise<TokenPair> {
  const { data } = await client.post<TokenPair>("/token/", { username, password });
  return data;
}