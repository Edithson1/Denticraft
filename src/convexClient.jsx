import { useState, useEffect, createContext, useContext } from "react";

// Local state representation when Convex is not running in live mode.
const LOCAL_STORAGE_KEY = "dentiscraft_session_state";

const initialDocState = {
  fecha: new Date().toLocaleDateString("es-ES"),
  nombre: "",
  edad: "",
  lugarNac: "",
  fechaNac: "",
  ocupacion: "",
  direccion: "",
  telefono: "",
  antecedentes: "",
  alergias: "",
  habitos: "",
  inspeccionGeneral: "",
  exploracionBucal: "",
  motivoConsulta: "",
  observaciones: "",
  odontograma: {},
  treatments: {},
  progressRows: [],
};

const initialFaceState = {
  expression: "idle",
  mouthOpen: 0.0,
};

// Simple event emitter for reactive updates when in offline mode
class SimpleEventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== cb);
    };
  }
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

const localEmitter = new SimpleEventEmitter();

export function getLocalState() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse local storage session state", e);
    }
  }
  return {
    sessions: {},
    documentState: {},
    conversationEvents: [],
    faceState: {},
    activeSessionId: null,
  };
}

export function saveLocalState(state) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  localEmitter.emit("update", state);
}

// React context for the mock database
const MockConvexContext = createContext(null);

export function MockConvexProvider({ children }) {
  const [state, setState] = useState(() => getLocalState());

  useEffect(() => {
    return localEmitter.on("update", (newState) => {
      setState(newState);
    });
  }, []);

  return (
    <MockConvexContext.Provider value={{ state, setState }}>
      {children}
    </MockConvexContext.Provider>
  );
}

// Custom hooks that behave like Convex client hooks, falling back to local simulation if VITE_CONVEX_URL is missing.
const isConvexConfigured = !!import.meta.env.VITE_CONVEX_URL;

export function useConvexMutation(functionPath) {
  // If Convex is configured, we can return the real mutation
  // For offline/out-of-the-box ease, we use the local state emulator.
  const context = useContext(MockConvexContext);

  return async (args) => {
    const currentState = getLocalState();
    let updated = false;
    let newSessionId = null;

    if (functionPath === "sessions:createSession") {
      newSessionId = `session_${Date.now()}`;
      currentState.activeSessionId = newSessionId;
      currentState.sessions[newSessionId] = {
        _id: newSessionId,
        createdAt: Date.now(),
        status: "active",
      };
      currentState.documentState[newSessionId] = {
        _id: `doc_${newSessionId}`,
        sessionId: newSessionId,
        ...initialDocState,
      };
      currentState.faceState[newSessionId] = {
        _id: `face_${newSessionId}`,
        sessionId: newSessionId,
        ...initialFaceState,
      };
      currentState.conversationEvents = currentState.conversationEvents.filter(
        e => e.sessionId !== newSessionId
      );
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState));
      if (context) {
        context.setState(currentState);
      }
      return newSessionId;
    }

    const { sessionId } = args;
    if (!sessionId) return;

    if (functionPath === "sessions:updateDocumentField") {
      const { field, value } = args;
      if (currentState.documentState[sessionId]) {
        currentState.documentState[sessionId][field] = value;
        updated = true;
      }
    } else if (functionPath === "sessions:updateToothState") {
      const { tooth, surface, status } = args;
      const doc = currentState.documentState[sessionId];
      if (doc) {
        if (!doc.odontograma) doc.odontograma = {};
        const currentTooth = { ...(doc.odontograma[tooth] || {}) };

        if (surface === "all") {
          if (status === "none") {
            delete doc.odontograma[tooth];
          } else {
            doc.odontograma[tooth] = {
              occlusal: status,
              vestibular: status,
              lingual: status,
              mesial: status,
              distal: status,
            };
          }
        } else {
          if (status === "none") {
            delete currentTooth[surface];
          } else {
            currentTooth[surface] = status;
          }

          if (Object.keys(currentTooth).length === 0) {
            delete doc.odontograma[tooth];
          } else {
            doc.odontograma[tooth] = currentTooth;
          }
        }
        updated = true;
      }
    } else if (functionPath === "sessions:updateTreatmentState") {
      const { treatmentKey, checked, qty, price } = args;
      const doc = currentState.documentState[sessionId];
      if (doc) {
        if (!doc.treatments) doc.treatments = {};
        const item = doc.treatments[treatmentKey] || { checked: false, qty: 1, price: 0 };
        doc.treatments[treatmentKey] = {
          checked,
          qty: qty !== undefined ? qty : item.qty,
          price: price !== undefined ? price : item.price,
        };
        updated = true;
      }
    } else if (functionPath === "sessions:addProgressRow") {
      const { fecha, pieza, diagnostico, tratamiento, aCuenta, saldo, firma } = args;
      const doc = currentState.documentState[sessionId];
      if (doc) {
        if (!doc.progressRows) doc.progressRows = [];
        doc.progressRows.push({ fecha, pieza, diagnostico, tratamiento, aCuenta, saldo, firma });
        updated = true;
      }
    } else if (functionPath === "sessions:addConversationEvent") {
      const { sender, text } = args;
      currentState.conversationEvents.push({
        _id: `evt_${Date.now()}_${Math.random()}`,
        sessionId,
        sender,
        text,
        timestamp: Date.now(),
      });
      updated = true;
    } else if (functionPath === "sessions:updateFaceState") {
      const { expression, mouthOpen } = args;
      if (currentState.faceState[sessionId]) {
        currentState.faceState[sessionId].expression = expression;
        currentState.faceState[sessionId].mouthOpen = mouthOpen;
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState));
      if (context) {
        context.setState(currentState);
      }
    }
  };
}

export function useConvexQuery(functionPath, args) {
  const context = useContext(MockConvexContext);
  if (!context) return null;

  const { state } = context;
  const { sessionId } = args;

  if (!sessionId) return null;

  if (functionPath === "sessions:getSessionData") {
    const session = state.sessions[sessionId];
    if (!session) return null;

    return {
      session,
      documentState: state.documentState[sessionId] || { ...initialDocState },
      events: state.conversationEvents.filter(e => e.sessionId === sessionId),
      faceState: state.faceState[sessionId] || { ...initialFaceState },
    };
  }

  return null;
}
