import { isApiConfigured } from "./backendApi";

/**
 * Si falta `VITE_API_URL` la app no puede hablar con el backend, asi que
 * muestra como configurarla en vez de fallar con una pantalla en blanco.
 */
export function BackendGuard({ children }) {
  if (isApiConfigured) {
    return children;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        padding: "20px",
      }}
    >
      <div className="glass-card" style={{ maxWidth: "600px", padding: "32px" }}>
        <h2 style={{ color: "#f8fafc", marginBottom: "12px" }}>Falta la URL del backend</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.7" }}>
          Este proyecto es solo el frontend: consume el backend a través de una API
          HTTP y necesita saber en qué URL escucha.
        </p>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "16px" }}>
          Crea un archivo <code style={{ color: "#06b6d4" }}>.env.local</code> en la raíz del
          proyecto con una de estas líneas:
        </p>
        <pre
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "10px",
            color: "#e2e8f0",
            fontSize: "13px",
            lineHeight: "1.8",
            overflowX: "auto",
          }}
        >
          {"# backend local (npx convex dev --local)\n"}
          {"VITE_API_URL=http://127.0.0.1:3211\n\n"}
          {"# backend en la nube (npx convex dev)\n"}
          {"VITE_API_URL=https://amiable-shark-651.convex.site"}
        </pre>
        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "16px" }}>
          Después reinicia <code style={{ color: "#06b6d4" }}>npm run dev</code>: Vite solo lee
          las variables de entorno al arrancar.
        </p>
      </div>
    </div>
  );
}
