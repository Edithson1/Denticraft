import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "./backendApi";

/**
 * Estado de la sesion clinica leido desde la API HTTP.
 *
 * Sobre una API REST no hay suscripcion reactiva como la del SDK de Convex, asi
 * que la frescura de la ficha se mantiene de dos formas:
 *
 *  1. Tras cada escritura se relee la ficha. Las rafagas del dictado se agrupan
 *     con un debounce corto para no disparar una lectura por palabra.
 *  2. Un sondeo de fondo trae los cambios hechos desde otra pestana o
 *     dispositivo, y sirve de latido para el indicador de conexion.
 */

const POLL_INTERVAL_MS = 4000;
const REFRESH_DEBOUNCE_MS = 150;

export function useBackendSession() {
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  // La sesion se guarda tambien en un ref para que `refresh` y `mutate` la lean
  // sin recrearse en cada render (y sin reiniciar el intervalo de sondeo).
  const sessionIdRef = useRef(null);
  const refreshTimer = useRef(null);

  const refresh = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;

    try {
      const data = await backend.getSession(id);
      setSessionData(data);
      setIsOnline(true);
    } catch (cause) {
      console.error("No se pudo leer la sesion del backend", cause);
      setIsOnline(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      refresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [refresh]);

  /** Crea una sesion nueva y carga su ficha. Devuelve el id, o null si fallo. */
  const startSession = useCallback(async () => {
    try {
      const { sessionId: id } = await backend.createSession();
      sessionIdRef.current = id;
      setSessionId(id);
      setSessionData(null);
      setError(null);
      setIsOnline(true);
      await refresh();
      return id;
    } catch (cause) {
      console.error("No se pudo crear la sesion en el backend", cause);
      setError(cause?.message || String(cause));
      setIsOnline(false);
      return null;
    }
  }, [refresh]);

  /**
   * Ejecuta una escritura contra la API y relee la ficha.
   * `call` recibe el sessionId activo: mutate((id) => backend.updateField(id, ...)).
   */
  const mutate = useCallback(
    async (call) => {
      const id = sessionIdRef.current;
      if (!id) return;

      try {
        await call(id);
        setIsOnline(true);
        scheduleRefresh();
      } catch (cause) {
        console.error("La escritura contra el backend fallo", cause);
        setIsOnline(false);
      }
    },
    [scheduleRefresh],
  );

  // Sondeo de fondo mientras haya sesion abierta.
  useEffect(() => {
    if (!sessionId) return undefined;
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId, refresh]);

  // Cancela el debounce pendiente al desmontar.
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  return { sessionId, sessionData, error, isOnline, startSession, mutate };
}
