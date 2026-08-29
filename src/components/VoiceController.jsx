import React, { useState, useEffect, useRef } from "react";

const MicIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const StopIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
  </svg>
);

// Helper to map anatomical tooth descriptions to FDI numbers in Spanish
function mapAnatomicalToNumber(text) {
  const t = text.toLowerCase();
  
  // Upper Right (Quadrants 1 & 5)
  if (t.includes("tercer molar superior derecho") || t.includes("muela del juicio superior derecha")) return "18";
  if (t.includes("segundo molar superior derecho")) return "17";
  if (t.includes("primer molar superior derecho")) return "16";
  if (t.includes("segundo premolar superior derecho")) return "15";
  if (t.includes("primer premolar superior derecho")) return "14";
  if (t.includes("canino superior derecho")) return "13";
  if (t.includes("incisivo lateral superior derecho")) return "12";
  if (t.includes("incisivo central superior derecho")) return "11";
  
  // Upper Left (Quadrants 2 & 6)
  if (t.includes("incisivo central superior izquierdo")) return "21";
  if (t.includes("incisivo lateral superior izquierdo")) return "22";
  if (t.includes("canino superior izquierdo")) return "23";
  if (t.includes("primer premolar superior izquierdo")) return "24";
  if (t.includes("segundo premolar superior izquierdo")) return "25";
  if (t.includes("primer molar superior izquierdo")) return "26";
  if (t.includes("segundo molar superior izquierdo")) return "27";
  if (t.includes("tercer molar superior izquierdo") || t.includes("muela del juicio superior izquierda")) return "28";

  // Lower Left (Quadrants 3 & 7)
  if (t.includes("incisivo central inferior izquierdo")) return "31";
  if (t.includes("incisivo lateral inferior izquierdo")) return "32";
  if (t.includes("canino inferior izquierdo")) return "33";
  if (t.includes("primer premolar inferior izquierdo")) return "34";
  if (t.includes("segundo premolar inferior izquierdo")) return "35";
  if (t.includes("primer molar inferior izquierdo")) return "36";
  if (t.includes("segundo molar inferior izquierdo")) return "37";
  if (t.includes("tercer molar inferior izquierdo") || t.includes("muela del juicio inferior izquierda")) return "38";

  // Lower Right (Quadrants 4 & 8)
  if (t.includes("tercer molar inferior derecho") || t.includes("muela del juicio inferior derecha")) return "48";
  if (t.includes("segundo molar inferior derecho")) return "47";
  if (t.includes("primer molar inferior derecho")) return "46";
  if (t.includes("segundo premolar inferior derecho")) return "45";
  if (t.includes("primer premolar inferior derecho")) return "44";
  if (t.includes("canino inferior derecho")) return "43";
  if (t.includes("incisivo lateral inferior derecho")) return "42";
  if (t.includes("incisivo central inferior derecho")) return "41";

  // Child teeth general matches (molars/canines/incisors)
  if (t.includes("segundo molar temporal superior derecho")) return "55";
  if (t.includes("primer molar temporal superior derecho")) return "54";
  if (t.includes("canino temporal superior derecho")) return "53";
  if (t.includes("incisivo lateral temporal superior derecho")) return "52";
  if (t.includes("incisivo central temporal superior derecho")) return "51";

  if (t.includes("incisivo central temporal superior izquierdo")) return "61";
  if (t.includes("incisivo lateral temporal superior izquierdo")) return "62";
  if (t.includes("canino temporal superior izquierdo")) return "63";
  if (t.includes("primer molar temporal superior izquierdo")) return "64";
  if (t.includes("segundo molar temporal superior izquierdo")) return "65";

  if (t.includes("segundo molar temporal inferior izquierdo")) return "75";
  if (t.includes("primer molar temporal inferior izquierdo")) return "74";
  if (t.includes("canino temporal inferior izquierdo")) return "73";
  if (t.includes("incisivo lateral temporal inferior izquierdo")) return "72";
  if (t.includes("incisivo central temporal inferior izquierdo")) return "71";

  if (t.includes("incisivo central temporal inferior derecho")) return "81";
  if (t.includes("incisivo lateral temporal inferior derecho")) return "82";
  if (t.includes("canino temporal inferior derecho")) return "83";
  if (t.includes("primer molar temporal inferior derecho")) return "84";
  if (t.includes("segundo molar temporal inferior derecho")) return "85";

  // Simple matches for "molar inferior derecho" (fallbacks)
  if (t.includes("molar inferior derecho")) return "47";
  if (t.includes("molar inferior izquierdo")) return "37";
  if (t.includes("molar superior derecho")) return "17";
  if (t.includes("molar superior izquierdo")) return "27";

  return null;
}

export default function VoiceController({ 
  sessionId, 
  documentState, 
  onFieldUpdate, 
  onToothUpdate, 
  onTreatmentUpdate,
  onAddProgressRow,
  onAddConversationEvent,
  onFaceStateUpdate,
  onEmailRequest,
  setMicStream
}) {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false); // Active dictation trigger state
  const [transcript, setTranscript] = useState("");
  const [extractedInfo, setExtractedInfo] = useState([]);
  const [patientEmail, setPatientEmail] = useState("");
  const [isWaitingForEmail, setIsWaitingForEmail] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const streamRef = useRef(null);
  const shouldListenRef = useRef(false); // Persistent mic listener flag
  const stateRef = useRef({ documentState, sessionId, isActive, patientEmail });
  const processSpeechTextRef = useRef(null);
  const emailPromptTimeRef = useRef(0);
  
  // Pending email confirmation state
  const [pendingEmail, setPendingEmail] = useState(null);

  // Sync state values to ref to avoid re-creating speech recognition instance
  useEffect(() => {
    stateRef.current = { documentState, sessionId, isActive, patientEmail };
  }, [documentState, sessionId, isActive, patientEmail]);

  // Helper to clean patient name by removing common filler words in Spanish
  const cleanPatientName = (nameText) => {
    const fillers = [
      "es", "el", "la", "paciente", "con", "apellido", "del", "de", "su", 
      "nombres", "apellidos", "llamado", "llamada", "se", "llama", "tal", 
      "como", "este", "un", "una", "nuevo", "documento", "para", "el"
    ];
    // Remove punctuation
    const cleanStr = nameText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = cleanStr.split(/\s+/).filter(w => {
      const low = w.toLowerCase().trim();
      return !fillers.includes(low) && low.length > 1;
    });
    
    // Capitalize each word
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  // Professionalizes casual doctor dictation into formal clinical Spanish
  const clinicalRefactor = (field, value) => {
    if (!value) return "";
    const v = value.toLowerCase().trim();
    
    // Alergias
    if (field === "alergias") {
      if (v === "nada" || v === "ninguna" || v === "no" || v === "no tiene" || v === "no presenta" || v === "ninguno" || v === "sin alergias") {
        return "Sin alergias conocidas";
      }
      return "Alergia a: " + value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    // Antecedentes patológicos
    if (field === "antecedentes") {
      if (v === "nada" || v === "ninguna" || v === "no" || v === "no tiene" || v === "no presenta" || v === "ninguno" || v === "no tiene ninguno") {
        return "Sin antecedentes patológicos de importancia";
      }
    }

    // Hábitos
    if (field === "habitos") {
      if (v === "nada" || v === "ninguno" || v === "no tiene" || v === "no") {
        return "Sin hábitos nocivos registrados";
      }
      if (v.includes("roblox") || v.includes("jugar") || v.includes("juegos") || v.includes("celular")) {
        return "Hábito de recreación digital prolongado (videojuegos)";
      }
      if (v.includes("fuma") || v.includes("cigarrillo") || v.includes("fumar")) {
        return "Tabaquismo activo";
      }
      if (v.includes("toma") || v.includes("alcohol") || v.includes("beber")) {
        return "Consumo social de alcohol";
      }
    }

    // Inspección general
    if (field === "inspeccionGeneral") {
      if (v === "general" || v === "bien" || v === "normal") {
        return "Paciente lúcido, orientado en tiempo, espacio y persona (LOTEP)";
      }
    }

    // Exploración bucal
    if (field === "exploracionBucal") {
      if (v === "no tiene" || v === "normal" || v === "bien" || v === "sano") {
        return "Tejidos blandos sanos, higiene bucal aceptable";
      }
    }
    
    // Dirección
    if (field === "direccion") {
      if (v === "no tiene" || v === "no" || v === "no registra") {
        return "No registra dirección";
      }
    }

    // Ocupación
    if (field === "ocupacion") {
      let cleanVal = value.replace(/^(es|trabaja\s+como|se\s+dedica\s+a)\s+/i, "").trim();
      return cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1).toLowerCase();
    }

    // Lugar de Nacimiento
    if (field === "lugarNac") {
      let cleanVal = value.replace(/\bperu\b/i, "Perú").trim();
      return cleanVal.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    // Capitalize first letter of any other string
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  // Initialize Speech Recognition (ONLY ONCE ON MOUNT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "es-ES";

    rec.onstart = () => {
      setIsListening(true);
      onFaceStateUpdate("listening", 0.0);
    };

    rec.onend = () => {
      // Auto-restart speech recognition if manually stopped is not triggered
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch (e) {
          // already running
        }
      } else {
        setIsListening(false);
        onFaceStateUpdate("idle", 0.0);
      }
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error", e.error);
      onFaceStateUpdate("confused", 0.0);
      
      // Auto-restart on error if should be active
      if (shouldListenRef.current) {
        setTimeout(() => {
          try {
            rec.start();
          } catch (err) {}
        }, 1000);
      }
    };

    rec.onresult = (event) => {
      // Ignore microphone inputs while the text-to-speech engine is speaking
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        return;
      }
      const resultIndex = event.resultIndex;
      const text = event.results[resultIndex][0].transcript;
      setTranscript(text);
      if (processSpeechTextRef.current) {
        processSpeechTextRef.current(text);
      }
    };

    recognitionRef.current = rec;

    // Automatically trigger mic start on page mount
    const autoStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setMicStream(stream);
        shouldListenRef.current = true;
        setIsListening(true);
        rec.start();
      } catch (err) {
        console.log("Microphone auto-start blocked or waiting for user gesture:", err);
      }
    };

    const startTimer = setTimeout(() => {
      autoStart();
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      shouldListenRef.current = false;
      try {
        rec.stop();
      } catch (e) {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  // Voice output synthesizer
  const speakBack = (text) => {
    if (!synthRef.current) return;
    
    // Stop speaking first
    synthRef.current.cancel();

    onFaceStateUpdate("speaking", 0.0);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";

    // Try to find a nice Spanish voice
    const voices = synthRef.current.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith("es-")) || voices[0];
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => {
      // Revert to listening if mic is on, otherwise idle
      if (isListening) {
        onFaceStateUpdate("listening", 0.0);
      } else {
        onFaceStateUpdate("idle", 0.0);
      }
    };

    synthRef.current.speak(utterance);
  };

  // Toggle Microphone manually
  const toggleListening = async () => {
    if (isListening) {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setMicStream(null);
      }
      setIsListening(false);
      onFaceStateUpdate("idle", 0.0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setMicStream(stream);
        shouldListenRef.current = true;
        setIsListening(true);

        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (e) {
        console.error("Failed to access microphone", e);
        alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
      }
    }
  };

  // Clean and parse email spoken addresses
  const parseSpokenEmail = (text) => {
    let clean = text.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/punto/g, ".")
      .replace(/arroba/g, "@")
      .replace(/guionbajo/g, "_")
      .replace(/guion/g, "-")
      .replace(/y/g, "")
      .replace(/com$/, ".com")
      .replace(/es$/, ".es");
    
    // Extract valid email structure
    const match = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : null;
  };
  // NLP rule parser
  const processSpeechText = async (text) => {
    onFaceStateUpdate("thinking", 0.0);
    
    // Log conversation event
    await onAddConversationEvent("dentist", text);

    const lowercase = text.toLowerCase().trim();
    let updates = [];

    // --- 0.5 WAITING FOR EMAIL INPUT FLOW ---
    if (isWaitingForEmail) {
      // Ignore any results received during the speech prompt window (2.5s) to avoid feedback loops
      if (Date.now() - emailPromptTimeRef.current < 2500) {
        return;
      }

      const email = parseSpokenEmail(text);
      if (email) {
        setPatientEmail(email);
        setIsWaitingForEmail(false);
        setIsActive(false);
        stateRef.current.isActive = false;
        shouldListenRef.current = false;
        setIsListening(false);
        onFaceStateUpdate("success", 0.0);

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setMicStream(null);
        }

        speakBack("OK, doctor, voy a enviar el correo con el documento o historia clínica al paciente.");
        
        setTimeout(() => {
          onEmailRequest(email);
        }, 3000);
        return;
      } else {
        // Only speak back if we are outside the quiet window and it's not empty/silence
        if (text.trim().length > 3) {
          speakBack("No logré identificar una dirección de correo válida. Por favor, dictela indicando el usuario, la palabra arroba, el dominio y punto com.");
        }
        return;
      }
    }

    const currentIsActive = stateRef.current.isActive;

    // --- 1. ACTIVATION LOGIC (WAKE WORD) ---
    if (!currentIsActive) {
      const isWakeWord = lowercase.includes("dentis") || 
                         lowercase.includes("craft") || 
                         lowercase.includes("asistente");
                         
      if (isWakeWord) {
        setIsActive(true);
        stateRef.current.isActive = true; // Sync ref immediately
        onFaceStateUpdate("success", 0.0);

        // Check if there is patient name in the wake sentence:
        let namePart = "";
        const nameKeywords = ["paciente es", "paciente", "se llama", "nombre es"];
        for (let kw of nameKeywords) {
          const idx = lowercase.indexOf(kw);
          if (idx !== -1) {
            namePart = text.substring(idx + kw.length).trim();
            break;
          }
        }

        if (namePart) {
          const cleanedName = cleanPatientName(namePart);
          if (cleanedName) {
            await onFieldUpdate("nombre", cleanedName);
            updates.push({ entity: "Nombre Paciente", value: cleanedName });
            setExtractedInfo(updates);
            speakBack(`Hola doctor. DentisCraft activo. Iniciando ficha para el paciente ${cleanedName}.`);
            return;
          }
        }

        speakBack("Hola doctor. DentisCraft activo y listo para registrar. ¿Cuál es el nombre del paciente?");
        return;
      }
      
      // If not active and didn't hear wake word, ignore silently
      onFaceStateUpdate("idle", 0.0);
      return;
    }

    // --- 2. EMAIL CONFIRMATION LOGIC ---
    if (pendingEmail) {
      if (lowercase.includes("sí") || lowercase.includes("si") || lowercase.includes("confirmado") || lowercase.includes("enviar") || lowercase.includes("correcto")) {
        onEmailRequest(pendingEmail);
        speakBack(`Excelente, he enviado el historial clínico en PDF a ${pendingEmail}.`);
        setPendingEmail(null);
        onFaceStateUpdate("success", 0.0);
        return;
      } else if (lowercase.includes("no") || lowercase.includes("cancelar")) {
        speakBack("Entendido, he cancelado el envío.");
        setPendingEmail(null);
        onFaceStateUpdate("idle", 0.0);
        return;
      }
    }

    // --- 3. EXPLICIT SIGN-OFF SIGNAL ---
    const isEndingSignal = lowercase.includes("finalizar documento") ||
                           lowercase.includes("finaliza el documento") ||
                           lowercase.includes("eso sería todo el documento") ||
                           lowercase.includes("eso seria todo el documento") ||
                           lowercase.includes("eso seria todo") ||
                           lowercase.includes("terminar documento") ||
                           lowercase === "finalizar" ||
                           lowercase === "terminar" ||
                           lowercase === "listo";

    if (isEndingSignal) {
      const currentEmail = stateRef.current.patientEmail || patientEmail;
      
      if (currentEmail) {
        setIsActive(false);
        stateRef.current.isActive = false; // Sync ref immediately
        shouldListenRef.current = false; // Turn off auto-restart
        setIsListening(false);
        onFaceStateUpdate("success", 0.0);

        // Stop speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        // Stop mic stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setMicStream(null);
        }

        speakBack("OK, doctor, voy a enviar el correo con el documento o historia clínica al paciente.");

        setTimeout(() => {
          onEmailRequest(currentEmail);
        }, 3500);
        return;
      } else {
        // Ask for patient's email interactively
        setIsWaitingForEmail(true);
        emailPromptTimeRef.current = Date.now(); // Mark transition time
        speakBack("Entendido, doctor. Ficha clínica completada. ¿A qué correo electrónico desea que envíe el historial clínico?");
        return;
      }
    }


    // --- 4. DETECT EMAIL REQUEST MANUALLY ---
    if (lowercase.includes("enviar al correo") || lowercase.includes("enviar a") || lowercase.includes("correo electrónico") || lowercase.includes("correo")) {
      const email = parseSpokenEmail(text);
      if (email) {
        setPatientEmail(email);
        updates.push({ entity: "Correo Registrado", value: email });
        speakBack(`Registrado el correo ${email.split("").join(" ")} para el envío.`);
        setExtractedInfo(updates);
        return;
      }
    }

    // Shared boundary lookahead to isolate fields dictated sequentially in the same stream
    const fieldBoundary = "(?:\\s+(?:nombre|edad|lugar|fecha|ocupación|ocupacion|dirección|direccion|teléfono|telefono|celular|antecedentes|alergias|hábitos|habitos|inspección|inspeccion|exploración|exploracion|motivo|observaciones|diente|pieza|finalizar|terminar|listo)|$)";

    // --- 5. PATIENT NAME extraction (during dictation) ---
    const nameMatch = text.match(new RegExp(`(?:paciente\\s+se\\s+llama|paciente\\s+es|nombre\\s+es|nombre\\s+del\\s+paciente|paciente\\s+con\\s+el\\s+apellido)\\s+([a-záéíóúñ\\s]+?)${fieldBoundary}`, "i"));
    if (nameMatch) {
      const cleaned = cleanPatientName(nameMatch[1]);
      if (cleaned) {
        await onFieldUpdate("nombre", cleaned);
        updates.push({ entity: "Nombre Paciente", value: cleaned });
      }
    }

    // --- 6. AGE extraction ---
    const ageMatch = text.match(new RegExp(`(?:tiene|edad)\\s+(\\d+)\\s+años${fieldBoundary}`, "i")) || 
                     text.match(new RegExp(`\\b(\\d+)\\s+años\\b${fieldBoundary}`, "i")) ||
                     text.match(new RegExp(`edad\\s+(\\d+)${fieldBoundary}`, "i"));
    if (ageMatch) {
      const ageVal = ageMatch[1];
      await onFieldUpdate("edad", ageVal);
      updates.push({ entity: "Edad", value: `${ageVal} años` });
    }

    // --- 7. BIRTHPLACE AND BIRTH DATE extraction ---
    const placeMatch = text.match(new RegExp(`(?:lugar\\s+y\\s+fecha\\s+de\\s+nacimiento|lugar\\s+y\\s+fecha\\s+de\\s+nac|lugar\\s+de\\s+nacimiento|lugar\\s+de\\s+nac|nacido\\s+en|nacimiento\\s+en)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (placeMatch) {
      let place = placeMatch[1].trim();
      
      // If it contains " el " or " fecha " indicating date follows, split it
      const elIdx = place.toLowerCase().indexOf(" el ");
      if (elIdx !== -1) {
        const datePart = place.substring(elIdx + 4).trim();
        place = place.substring(0, elIdx).trim();
        const refinedDate = clinicalRefactor("fechaNac", datePart);
        await onFieldUpdate("fechaNac", refinedDate);
        updates.push({ entity: "Fecha de Nac.", value: refinedDate });
      } else {
        const dateIdx = place.toLowerCase().indexOf("fecha");
        if (dateIdx !== -1) {
          const datePart = place.substring(dateIdx + 5).trim();
          place = place.substring(0, dateIdx).trim();
          const refinedDate = clinicalRefactor("fechaNac", datePart);
          await onFieldUpdate("fechaNac", refinedDate);
          updates.push({ entity: "Fecha de Nac.", value: refinedDate });
        }
      }

      const refinedPlace = clinicalRefactor("lugarNac", place);
      await onFieldUpdate("lugarNac", refinedPlace);
      updates.push({ entity: "Lugar de Nac.", value: refinedPlace });
    }
    
    const dateMatch = text.match(new RegExp(`(?:fecha\\s+de\\s+nacimiento|fecha\\s+de\\s+nac|nacido\\s+el|fecha|el)\\s+(\\d{1,2}\\s+de\\s+[a-záéíóúñ]+\\s+de\\s+\\d{4}|\\d{1,2}\\s+de\\s+[a-záéíóúñ]+|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})${fieldBoundary}`, "i"));
    if (dateMatch) {
      const date = dateMatch[1].trim();
      await onFieldUpdate("fechaNac", date);
      updates.push({ entity: "Fecha de Nac.", value: date });
    }

    // --- 8. OCCUPATION extraction ---
    const occupMatch = text.match(new RegExp(`(?:ocupación|ocupacion|trabaja\\s+como|profesión|profesion)\\s+([a-záéíóúñ\\s]+?)${fieldBoundary}`, "i"));
    if (occupMatch) {
      const occupVal = occupMatch[1].trim();
      const refinedOccup = clinicalRefactor("ocupacion", occupVal);
      await onFieldUpdate("ocupacion", refinedOccup);
      updates.push({ entity: "Ocupación", value: refinedOccup });
    }

    // --- 9. DIRECTION (Address) extraction ---
    const dirMatch = text.match(new RegExp(`(?:dirección|direccion|vive\\s+en|domiciliado\\s+en)\\s+([a-záéíóúñ0-9\\s#.,-]+?)${fieldBoundary}`, "i"));
    if (dirMatch) {
      const dirVal = dirMatch[1].trim();
      const refinedDir = clinicalRefactor("direccion", dirVal);
      await onFieldUpdate("direccion", refinedDir);
      updates.push({ entity: "Dirección", value: refinedDir });
    }

    // --- 10. PHONE extraction ---
    const phoneMatch = text.match(new RegExp(`(?:teléfono|telefono|celular|número\\s+de\\s+contacto)\\s+(\\d[\\d\\s-]{6,12})${fieldBoundary}`, "i"));
    if (phoneMatch) {
      const phoneVal = phoneMatch[1].trim();
      await onFieldUpdate("telefono", phoneVal);
      updates.push({ entity: "Teléfono", value: phoneVal });
    }

    // --- 11. PATHOLOGY HISTORY extraction ---
    const pathMatch = text.match(new RegExp(`(?:antecedentes\\s+patológicos|antecedentes|sufre\\s+de|padece\\s+de)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (pathMatch) {
      const pathVal = pathMatch[1].trim();
      const refinedPath = clinicalRefactor("antecedentes", pathVal);
      await onFieldUpdate("antecedentes", refinedPath);
      updates.push({ entity: "Antecedentes Patológicos", value: refinedPath });
    }

    // --- 12. ALLERGIES extraction ---
    if (lowercase.includes("no tiene alergias conocidas") || lowercase.includes("sin alergias conocidas") || lowercase.includes("no presenta alergias")) {
      await onFieldUpdate("alergias", "Sin alergias conocidas");
      updates.push({ entity: "Alergias", value: "Sin alergias conocidas" });
    } else {
      const allergyMatch = text.match(new RegExp(`(?:alergia\\s+a|alérgico\\s+a|alergias)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
      if (allergyMatch) {
        const allergyVal = allergyMatch[1].trim();
        const refinedAllergy = clinicalRefactor("alergias", allergyVal);
        await onFieldUpdate("alergias", refinedAllergy);
        updates.push({ entity: "Alergias", value: refinedAllergy });
      }
    }

    // --- 13. HABITS extraction ---
    const habitsMatch = text.match(new RegExp(`(?:hábitos|habitos|hábito\\s+de|presenta\\s+hábitos\\s+de)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (habitsMatch) {
      const habitsVal = habitsMatch[1].trim();
      const refinedHabits = clinicalRefactor("habitos", habitsVal);
      await onFieldUpdate("habitos", refinedHabits);
      updates.push({ entity: "Hábitos", value: refinedHabits });
    }

    // --- 14. GENERAL INSPECTION extraction ---
    const inspMatch = text.match(new RegExp(`(?:inspección\\s+general|inspeccion\\s+general|inspección|inspeccion)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (inspMatch) {
      const inspVal = inspMatch[1].trim();
      const refinedInsp = clinicalRefactor("inspeccionGeneral", inspVal);
      await onFieldUpdate("inspeccionGeneral", refinedInsp);
      updates.push({ entity: "Inspección General", value: refinedInsp });
    }

    // --- 15. ORAL EXPLORATION extraction ---
    const explMatch = text.match(new RegExp(`(?:exploración\\s+bucal|exploracion\\s+bucal|exploración|exploracion)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (explMatch) {
      const explVal = explMatch[1].trim();
      const refinedExpl = clinicalRefactor("exploracionBucal", explVal);
      await onFieldUpdate("exploracionBucal", refinedExpl);
      updates.push({ entity: "Exploración Bucal", value: refinedExpl });
    }

    // --- 16. REASON FOR CONSULTATION extraction ---
    const reasonMatch = text.match(new RegExp(`(?:motivo\\s+de\\s+la\\s+consulta|consulta\\s+por|viene\\s+porque)\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (reasonMatch) {
      const reasonVal = reasonMatch[1].trim();
      const refinedReason = clinicalRefactor("motivoConsulta", reasonVal);
      await onFieldUpdate("motivoConsulta", refinedReason);
      updates.push({ entity: "Motivo de consulta", value: refinedReason });
    }

    // --- 17. CLINICAL OBSERVATIONS ---
    const obsMatch = text.match(new RegExp(`observaciones\\s+([a-záéíóúñ\\s,.-]+?)${fieldBoundary}`, "i"));
    if (obsMatch) {
      const obsVal = obsMatch[1].trim();
      const refinedObs = clinicalRefactor("observaciones", obsVal);
      await onFieldUpdate("observaciones", refinedObs);
      updates.push({ entity: "Observaciones", value: refinedObs });
    }

    // --- 18. DENTAL CHART / ODONTOGRAMA COMMANDS ---
    const toothNumMatch = text.match(/\b([1-8][1-8])\b/g);
    let toothNumber = toothNumMatch ? toothNumMatch[0] : null;
    if (!toothNumber) {
      toothNumber = mapAnatomicalToNumber(text);
    }

    if (toothNumber) {
      let surface = "oclusal";
      if (lowercase.includes("vestibular") || lowercase.includes("bucal") || lowercase.includes("labial")) surface = "vestibular";
      if (lowercase.includes("lingual") || lowercase.includes("palatina")) surface = "lingual";
      if (lowercase.includes("mesial")) surface = "mesial";
      if (lowercase.includes("distal")) surface = "distal";
      if (lowercase.includes("oclusal") || lowercase.includes("incisal")) surface = "oclusal";

      let status = "caries";
      if (lowercase.includes("caries") || lowercase.includes("afectado") || lowercase.includes("picado") || lowercase.includes("dañado")) status = "caries";
      else if (lowercase.includes("restauración") || lowercase.includes("obturación") || lowercase.includes("calza") || lowercase.includes("obturado") || lowercase.includes("curado")) status = "restored";
      else if (lowercase.includes("ausente") || lowercase.includes("falta") || lowercase.includes("extraído") || lowercase.includes("exodoncia")) status = "missing";
      else if (lowercase.includes("sano") || lowercase.includes("limpio") || lowercase.includes("borrar")) status = "none";

      if (status === "missing") {
        await onToothUpdate(toothNumber, "all", "missing");
        updates.push({ entity: `Diente ${toothNumber}`, value: `Ausente` });
      } else {
        await onToothUpdate(toothNumber, surface, status);
        updates.push({ entity: `Diente ${toothNumber}`, value: `${surface.toUpperCase()} con ${status === "caries" ? "Caries" : status === "restored" ? "Restauración" : "Sano"}` });
      }
    }

    // --- 19. BUDGET TABLE CHECKBOXES ---
    const treatmentsConfig = [
      { key: "Consulta", keywords: ["consulta", "revisión"] },
      { key: "Rx", keywords: ["rx", "radiografía"] },
      { key: "Sesión Profilaxis", keywords: ["profilaxis", "limpieza dental"] },
      { key: "Fluorización", keywords: ["fluorización", "flúor"] },
      { key: "Exodoncia simple.", keywords: ["exodoncia simple", "extracción simple"] },
      { key: "Exodoncia compleja.", keywords: ["exodoncia compleja", "extracción quirúrgica"] },
      { key: "Restauración simple.", keywords: ["restauración simple", "resina simple"] },
      { key: "Restauración compuesta.", keywords: ["restauración compuesta", "resina compuesta"] },
      { key: "Tratamiento pulpar", keywords: ["tratamiento pulpar", "pulpotomía"] },
      { key: "Endodoncia", keywords: ["endodoncia"] },
      { key: "Corona", keywords: ["corona"] },
      { key: "Puente", keywords: ["puente"] },
      { key: "Perno/poste", keywords: ["perno", "poste"] },
      { key: "Incrustación", keywords: ["incrustación"] },
      { key: "Prótesis parcial removible (PPR)", keywords: ["prótesis parcial", "removible parcial", "ppr"] },
      { key: "Prótesis total removible (PTR)", keywords: ["prótesis total", "removible total", "ptr"] },
      { key: "Ortodoncia", keywords: ["ortodoncia", "brackets"] },
      { key: "Blanqueamiento dental", keywords: ["blanqueamiento"] },
    ];

    for (let treat of treatmentsConfig) {
      const match = treat.keywords.some(kw => lowercase.includes(kw));
      if (match) {
        await onTreatmentUpdate(treat.key, true);
        updates.push({ entity: "Presupuesto", value: `Seleccionado: ${treat.key}` });
      }
    }

    // --- 20. CLINICAL EVOLUTION / PROGRESS TABLE ROW ---
    if (lowercase.includes("evolución") || lowercase.includes("progreso") || lowercase.includes("historial de tratamiento")) {
      const diagVal = text.match(/diagnóstico\s+([a-záéíóúñ\s]+?)(?:tratamiento|a cuenta|$)/i);
      const treatVal = text.match(/tratamiento\s+([a-záéíóúñ\s]+?)(?:a cuenta|saldo|$)/i);
      const accVal = text.match(/a cuenta\s+(\d+)/i) || text.match(/adelanto\s+(\d+)/i);
      const salVal = text.match(/saldo\s+(\d+)/i) || text.match(/resta\s+(\d+)/i) || (lowercase.includes("saldo cero") ? ["0", "0"] : null);
      
      const piezaVal = toothNumber || "Gral";

      if (diagVal || treatVal) {
        const row = {
          fecha: new Date().toLocaleDateString("es-ES"),
          pieza: piezaVal,
          diagnostico: diagVal ? diagVal[1].trim() : "Caries",
          tratamiento: treatVal ? treatVal[1].trim() : "Restauración",
          aCuenta: accVal ? `${accVal[1]}` : "0",
          saldo: salVal ? `${salVal[1]}` : "0",
          firma: "Dr. DentisCraft",
        };

        await onAddProgressRow(row);
        updates.push({ entity: "Nueva Fila Evolución", value: `Pieza ${row.pieza}: ${row.diagnostico} -> ${row.tratamiento}` });
      }
    }

    // Update extracted info list
    if (updates.length > 0) {
      setExtractedInfo(prev => {
        const map = new Map(prev.map(i => [i.entity, i]));
        updates.forEach(u => map.set(u.entity, u));
        return Array.from(map.values());
      });

      onFaceStateUpdate("success", 0.0);
      setTimeout(() => {
        const checkActive = stateRef.current.isActive;
        onFaceStateUpdate(checkActive ? "listening" : "idle", 0.0);
      }, 1500);
    } else {
      const checkActive = stateRef.current.isActive;
      onFaceStateUpdate(checkActive ? "listening" : "idle", 0.0);
    }
  };

  // Sync the latest parser function (placed after declaration to avoid ReferenceError)
  processSpeechTextRef.current = processSpeechText;

  return (
    <div className="voice-controller-panel">
      <div className="mic-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={toggleListening}
          className={`mic-btn ${isListening ? "listening" : "idle"}`}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "none",
            background: isListening ? "#ef4444" : "#10b981",
            color: "#fff",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: isListening ? "0 0 20px rgba(239, 68, 68, 0.6)" : "0 4px 10px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease"
          }}
        >
          {isListening ? <StopIcon /> : <MicIcon />}
        </button>
        <span className="mic-status-text" style={{ 
          fontSize: "13px", 
          fontWeight: "bold", 
          letterSpacing: "1px",
          color: !isListening ? "#94a3b8" : isActive ? "#10b981" : "#e5e7eb",
          display: "flex",
          alignItems: "center"
        }}>
          {!isListening ? (
            <>
              <span className="status-dot red"></span>
              MICROFONO APAGADO
            </>
          ) : isActive ? (
            <>
              <span className="status-dot green"></span>
              DENTISCRAFT ACTIVO — ESCUCHANDO...
            </>
          ) : (
            <>
              <span className="status-dot blue"></span>
              ESTADO SUSPENDIDO — DI: 'HOLA DENTISCRAFT' PARA ACTIVAR
            </>
          )}
        </span>
      </div>

      <div className="transcription-viewer" style={{ marginTop: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", color: "#888", letterSpacing: "1px" }}>Transcripción Real:</h4>
        <div className="transcript-bubble" style={{ background: "#1f2937", padding: "12px", borderRadius: "8px", border: "1px solid #374151", minHeight: "60px", fontSize: "14px", fontStyle: "italic", lineHeight: "1.5" }}>
          {transcript || "Comienza a hablar con DentisCraft para transcribir aquí tu consulta..."}
        </div>
      </div>

      {extractedInfo.length > 0 && (
        <div className="extraction-viewer" style={{ marginTop: "16px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", color: "#888", letterSpacing: "1px" }}>Entidades Extraídas:</h4>
          <div className="entities-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {extractedInfo.map((info, index) => (
              <div key={index} className="entity-tag" style={{ display: "flex", justifyContent: "space-between", background: "#111827", padding: "6px 12px", borderRadius: "4px", borderLeft: "4px solid #10b981", fontSize: "13px" }}>
                <span className="entity-name" style={{ fontWeight: "bold", color: "#10b981" }}>{info.entity}</span>
                <span className="entity-val" style={{ color: "#e5e7eb" }}>{info.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingEmail && (
        <div className="email-confirmation-box" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", padding: "12px", borderRadius: "8px", marginTop: "16px" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "bold", color: "#ef4444" }}>Confirmación de Correo Pendiente</p>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>¿Deseas enviar el PDF a <strong>{pendingEmail}</strong>?</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => processSpeechText("sí")}
              style={{ padding: "4px 10px", background: "#ef4444", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
            >
              Sí, enviar
            </button>
            <button 
              onClick={() => processSpeechText("no")}
              style={{ padding: "4px 10px", background: "transparent", border: "1px solid #9ca3af", color: "#e5e7eb", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
