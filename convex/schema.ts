import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    createdAt: v.number(),
    status: v.string(), // "active" | "completed"
  }),
  documentState: defineTable({
    sessionId: v.id("sessions"),
    fecha: v.optional(v.string()),
    nombre: v.optional(v.string()),
    edad: v.optional(v.string()),
    lugarNac: v.optional(v.string()),
    fechaNac: v.optional(v.string()),
    ocupacion: v.optional(v.string()),
    direccion: v.optional(v.string()),
    telefono: v.optional(v.string()),
    antecedentes: v.optional(v.string()),
    alergias: v.optional(v.string()),
    habitos: v.optional(v.string()),
    inspeccionGeneral: v.optional(v.string()),
    exploracionBucal: v.optional(v.string()),
    motivoConsulta: v.optional(v.string()),
    observaciones: v.optional(v.string()),
    // Odontograma maps tooth number to an object of affected zones and their statuses
    // e.g. { "47": { "occlusal": "caries", "vestibular": "restored" } }
    odontograma: v.any(), 
    // Treatments table state
    // e.g. { "Consulta": { checked: true, qty: 1, price: 50, total: 50 } }
    treatments: v.any(),
    // Array of objects representing rows in the clinical evolution table
    progressRows: v.any(),
  }),
  conversationEvents: defineTable({
    sessionId: v.id("sessions"),
    sender: v.string(), // "dentist" | "ai"
    text: v.string(),
    timestamp: v.number(),
  }),
  faceState: defineTable({
    sessionId: v.id("sessions"),
    expression: v.string(), // "idle" | "listening" | "thinking" | "speaking" | "success" | "confused"
    mouthOpen: v.float64(), // 0.0 to 1.0
  }),
});
