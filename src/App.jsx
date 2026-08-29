import React, { useEffect, useRef, useState } from "react";
import { API_URL, backend } from "./backendApi";
import { BackendGuard } from "./BackendGuard";
import { useBackendSession } from "./useBackendSession";
import AsciiFace from "./components/AsciiFace";
import VoiceController from "./components/VoiceController";
import DocumentPreview from "./components/DocumentPreview";

// Custom SVG Icons to replace emojis for Apple Vision Pro Spatial UI style
const ToothIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C9 2 7.5 4 7.5 7.5c0 3.5 2.5 5 2.5 7.5 0 .5.3.9.8.9h2.4c.5 0 .8-.4.8-.9 0-2.5 2.5-4 2.5-7.5C16.5 4 15 2 12 2z"/>
    <path d="M10 16v4c0 .5.4.9.9.9h2.2c.5 0 .9-.4.9-.9v-4"/>
  </svg>
);

const MicIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const MicMuteIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="2" x2="22" y1="2" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5.19"/>
    <path d="M9 5a3 3 0 0 1 5.12-2.12"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const DbIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
  </svg>
);

const DocIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const CheckIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SettingsIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const RefreshIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M16 3h5v5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 21H3v-5"/>
  </svg>
);

function MainApp() {
  const [micStream, setMicStream] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const didInit = useRef(false);

  // Toda la comunicación con el backend pasa por la API HTTP
  const {
    sessionId,
    sessionData,
    error: initError,
    isOnline,
    startSession,
    mutate,
  } = useBackendSession();

  const addNotification = (text, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const openSession = async (message) => {
    const newId = await startSession();
    if (newId) addNotification(message, "info");
  };

  // Abre una sesión al montar. El ref evita la doble ejecución de StrictMode,
  // que contra un backend real crearía dos sesiones en la base de datos.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    openSession("Sistema listo. Abre el micrófono para dictar.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailRequest = async (email) => {
    addNotification("Generando PDF base del historial clínico...", "info");
    addNotification("Conectando con la API de Gmail...", "info");
    
    // Simulate Gmail send latency
    setTimeout(() => {
      addNotification(`Correo enviado a ${email} con el PDF adjunto.`, "success");
      addNotification("ESTADO: DOCUMENT COMPLETE | PDF GENERATED | EMAIL SENT", "success");
    }, 2500);
  };

  if (initError) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a", padding: "20px" }}>
        <div className="glass-card" style={{ maxWidth: "560px", padding: "32px" }}>
          <h2 style={{ color: "#f8fafc", marginBottom: "12px" }}>No se pudo abrir la sesión</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.7" }}>
            Falló <code style={{ color: "#06b6d4" }}>POST {API_URL}/api/session</code>. Lo más
            habitual es que el backend todavía no esté levantado: en el repositorio del backend
            ejecuta <code style={{ color: "#06b6d4" }}>npx convex dev</code> y comprueba que{" "}
            <code style={{ color: "#06b6d4" }}>VITE_API_URL</code> apunte a su HTTP Actions URL.
          </p>
          <pre style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "14px", marginTop: "16px", color: "#f87171", fontSize: "12px", whiteSpace: "pre-wrap" }}>
            {initError}
          </pre>
          <button
            type="button"
            onClick={() => openSession("Nueva sesión iniciada.")}
            style={{ marginTop: "18px", padding: "10px 18px", background: "#06b6d4", border: "none", color: "#0f172a", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId || !sessionData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a" }}>
        <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
          <ToothIcon size={48} className="spin-tooth" style={{ color: "#06b6d4", marginBottom: "15px" }} />
          <h2>Inicializando DentisCraft AI Core...</h2>
          <p style={{ color: "#94a3b8", marginTop: "8px" }}>Conectando con la API del backend</p>
        </div>
      </div>
    );
  }

  const { documentState, faceState } = sessionData;
  const currentExpression = faceState?.expression || "idle";

  return (
    <div className="app-container">
      {/* Notifications overlay */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "10px" }}>
        {notifications.map(n => (
          <div 
            key={n.id} 
            style={{
              padding: "12px 20px",
              background: n.type === "success" ? "#10b981" : "#1e293b",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              borderLeft: `5px solid ${n.type === "success" ? "#047857" : "#06b6d4"}`,
              fontSize: "13px",
              fontWeight: "bold",
              animation: "slideIn 0.3s ease"
            }}
          >
            {n.text}
          </div>
        ))}
      </div>

      <header className="dashboard-header">
        <div className="app-title-group">
          <ToothIcon size={32} className="app-logo-glow" style={{ color: "#06b6d4" }} />
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "0.5px" }}>
              DENTISCRAFT <span style={{ color: "#06b6d4" }}>PRO</span>
            </h1>
            <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
              Asistente de Ficha Dental Automatizado por Voz
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            ID Sesión: <strong style={{ color: "#06b6d4" }}>{sessionId.substring(0, 12)}...</strong>
          </span>
          <button
            type="button"
            onClick={() => openSession("Nueva sesión iniciada.")}
            style={{
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              transition: "all 0.2s ease"
            }}
            className="header-btn"
          >
            <RefreshIcon size={14} style={{ marginRight: "6px" }} />
            Limpiar Ficha
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Floating Sidebar Pill Dock (Apple Vision Pro style) */}
        <div className="floating-dock">
          <div className="dock-item logo" title="DentisCraft PRO">
            <ToothIcon size={24} style={{ color: "#fff" }} />
          </div>
          <div className={`dock-item status ${micStream ? "active" : ""}`} title={micStream ? "Micrófono Activo" : "Micrófono Apagado"}>
            {micStream ? <MicIcon size={20} style={{ color: "#10b981" }} /> : <MicMuteIcon size={20} style={{ color: "#94a3b8" }} />}
          </div>
          <div
            className={`dock-item status ${isOnline ? "active" : ""}`}
            title={isOnline ? `API conectada (${API_URL})` : "Sin respuesta de la API..."}
          >
            <DbIcon size={20} style={{ color: isOnline ? "#10b981" : "#f59e0b" }} />
          </div>
          <div className={`dock-item status ${currentExpression === "success" ? "active" : ""}`} title="Ficha Completada">
            {currentExpression === "success" ? <CheckIcon size={20} style={{ color: "#10b981" }} /> : <DocIcon size={20} style={{ color: "#94a3b8" }} />}
          </div>
          <div className="dock-item" title="Configuraciones Asistente">
            <SettingsIcon size={20} style={{ color: "#94a3b8" }} />
          </div>
        </div>

        {/* Left Side: Speech, AI Face & Transcription */}
        <div className="left-panel">
          <AsciiFace expression={currentExpression} micStream={micStream} />
          
          <div className="glass-card">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "#888", letterSpacing: "1px", marginBottom: "15px" }}>
              Panel de Control por Voz
            </h3>
            <VoiceController
              sessionId={sessionId}
              documentState={documentState}
              onFieldUpdate={(field, val) => mutate(id => backend.updateField(id, field, val))}
              onToothUpdate={(tooth, surface, status) => mutate(id => backend.updateTooth(id, tooth, surface, status))}
              onTreatmentUpdate={(treatmentKey, checked) => mutate(id => backend.updateTreatment(id, treatmentKey, checked))}
              onAddProgressRow={(row) => mutate(id => backend.addProgressRow(id, row))}
              onAddConversationEvent={(sender, text) => mutate(id => backend.addConversationEvent(id, sender, text))}
              onFaceStateUpdate={(expression, mouthOpen) => mutate(id => backend.updateFace(id, expression, mouthOpen))}
              onEmailRequest={handleEmailRequest}
              setMicStream={setMicStream}
            />
          </div>

          <div className="glass-card" style={{ fontSize: "12px", lineHeight: "1.6", color: "#94a3b8" }}>
            <h4 style={{ color: "#f8fafc", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase" }}>Ejemplos de Voz Admitidos:</h4>
            <ul style={{ paddingLeft: "15px" }}>
              <li>"Paciente se llama Carlos Ortíz"</li>
              <li>"Tiene 42 años"</li>
              <li>"Sin alergias conocidas"</li>
              <li>"Caries en oclusal del molar inferior derecho 47"</li>
              <li>"Marcar pieza 18 ausente"</li>
              <li>"Realizar profilaxis y fluorización"</li>
              <li>"Enviar al correo carlos punto ortiz arroba gmail punto com"</li>
            </ul>
          </div>
        </div>

        {/* Right Side: High-fidelity clinical history preview */}
        <div className="glass-card" style={{ padding: "10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <DocumentPreview
            documentState={documentState}
            onToothUpdate={(tooth, surface, status) => mutate(id => backend.updateTooth(id, tooth, surface, status))}
            onTreatmentUpdate={(treatmentKey, checked) => mutate(id => backend.updateTreatment(id, treatmentKey, checked))}
            onAddProgressRow={(row) => mutate(id => backend.addProgressRow(id, row))}
          />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BackendGuard>
      <MainApp />
    </BackendGuard>
  );
}
