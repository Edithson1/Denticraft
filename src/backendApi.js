/**
 * Cliente HTTP del backend.
 *
 * El frontend no conoce Convex: solo habla con una URL base por `fetch`.
 * Cambiar de backend local a backend desplegado es cambiar `VITE_API_URL`
 * en `.env.local`, nada mas.
 *
 * Los endpoints los publica el backend en `convex/http.ts`.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL;

/** URL base de la API, sin barra final. */
export const API_URL = RAW_API_URL ? String(RAW_API_URL).replace(/\/+$/, "") : "";
export const isApiConfigured = Boolean(API_URL);

/** Error con el mensaje que devolvio la API, no el genérico de `fetch`. */
export class BackendError extends Error {
  constructor(message, status, options) {
    super(message, options);
    this.name = "BackendError";
    this.status = status;
  }
}

async function request(path, { method = "POST", body, params } = {}) {
  if (!isApiConfigured) {
    throw new BackendError("VITE_API_URL no esta configurada", 0);
  }

  const url = new URL(API_URL + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // fetch solo rechaza por red/CORS; un 4xx o 5xx llega como respuesta.
    throw new BackendError(
      `No se pudo contactar con la API en ${API_URL}. Comprueba que el backend este levantado y que permita CORS.`,
      0,
      { cause },
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new BackendError(
      payload?.error || `La API respondio ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return payload;
}

export const backend = {
  /** Comprueba que la API esta viva y desplegada. */
  health: () => request("/api/health", { method: "GET" }),

  /** Crea una sesion nueva. Devuelve { sessionId }. */
  createSession: () => request("/api/session"),

  /** Ficha completa: { session, documentState, events, faceState }. */
  getSession: (sessionId) =>
    request("/api/session", { method: "GET", params: { sessionId } }),

  updateField: (sessionId, field, value) =>
    request("/api/session/field", { body: { sessionId, field, value } }),

  updateTooth: (sessionId, tooth, surface, status) =>
    request("/api/session/tooth", { body: { sessionId, tooth, surface, status } }),

  updateTreatment: (sessionId, treatmentKey, checked, qty, price) =>
    request("/api/session/treatment", {
      body: { sessionId, treatmentKey, checked, qty, price },
    }),

  addProgressRow: (sessionId, row) =>
    request("/api/session/progress", { body: { sessionId, ...row } }),

  addConversationEvent: (sessionId, sender, text) =>
    request("/api/session/conversation", { body: { sessionId, sender, text } }),

  updateFace: (sessionId, expression, mouthOpen) =>
    request("/api/session/face", { body: { sessionId, expression, mouthOpen } }),
};
