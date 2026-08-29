import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSession = mutation({
  args: {},
  handler: async (ctx) => {
    const sessionId = await ctx.db.insert("sessions", {
      createdAt: Date.now(),
      status: "active",
    });

    await ctx.db.insert("documentState", {
      sessionId,
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
    });

    await ctx.db.insert("faceState", {
      sessionId,
      expression: "idle",
      mouthOpen: 0.0,
    });

    return sessionId;
  },
});

export const getSessionData = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const docState = await ctx.db
      .query("documentState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    const events = await ctx.db
      .query("conversationEvents")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    const face = await ctx.db
      .query("faceState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    return {
      session,
      documentState: docState,
      events,
      faceState: face,
    };
  },
});

export const updateDocumentField = mutation({
  args: {
    sessionId: v.id("sessions"),
    field: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const docState = await ctx.db
      .query("documentState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!docState) throw new Error("Document state not found");

    await ctx.db.patch(docState._id, {
      [args.field]: args.value,
    });
  },
});

export const updateToothState = mutation({
  args: {
    sessionId: v.id("sessions"),
    tooth: v.string(), // e.g. "47"
    surface: v.string(), // e.g. "occlusal", "vestibular", "lingual", "mesial", "distal", "all"
    status: v.string(), // e.g. "caries", "restored", "missing", "none"
  },
  handler: async (ctx, args) => {
    const docState = await ctx.db
      .query("documentState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!docState) throw new Error("Document state not found");

    const currentOdonto = { ...((docState.odontograma as Record<string, any>) || {}) };
    const currentTooth = { ...(currentOdonto[args.tooth] || {}) };

    if (args.surface === "all") {
      if (args.status === "none") {
        delete currentOdonto[args.tooth];
      } else {
        currentOdonto[args.tooth] = {
          occlusal: args.status,
          vestibular: args.status,
          lingual: args.status,
          mesial: args.status,
          distal: args.status,
        };
      }
    } else {
      if (args.status === "none") {
        delete currentTooth[args.surface];
      } else {
        currentTooth[args.surface] = args.status;
      }

      if (Object.keys(currentTooth).length === 0) {
        delete currentOdonto[args.tooth];
      } else {
        currentOdonto[args.tooth] = currentTooth;
      }
    }

    await ctx.db.patch(docState._id, {
      odontograma: currentOdonto,
    });
  },
});

export const updateTreatmentState = mutation({
  args: {
    sessionId: v.id("sessions"),
    treatmentKey: v.string(),
    checked: v.boolean(),
    qty: v.optional(v.number()),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docState = await ctx.db
      .query("documentState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!docState) throw new Error("Document state not found");

    const currentTreatments = { ...((docState.treatments as Record<string, any>) || {}) };
    const currentItem = currentTreatments[args.treatmentKey] || { checked: false, qty: 1, price: 0 };

    const updatedItem = {
      checked: args.checked,
      qty: args.qty !== undefined ? args.qty : currentItem.qty,
      price: args.price !== undefined ? args.price : currentItem.price,
    };

    currentTreatments[args.treatmentKey] = updatedItem;

    await ctx.db.patch(docState._id, {
      treatments: currentTreatments,
    });
  },
});

export const addProgressRow = mutation({
  args: {
    sessionId: v.id("sessions"),
    fecha: v.string(),
    pieza: v.string(),
    diagnostico: v.string(),
    tratamiento: v.string(),
    aCuenta: v.string(),
    saldo: v.string(),
    firma: v.string(),
  },
  handler: async (ctx, args) => {
    const docState = await ctx.db
      .query("documentState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!docState) throw new Error("Document state not found");

    const currentProgress = [...((docState.progressRows as any[]) || [])];
    currentProgress.push({
      fecha: args.fecha,
      pieza: args.pieza,
      diagnostico: args.diagnostico,
      tratamiento: args.tratamiento,
      aCuenta: args.aCuenta,
      saldo: args.saldo,
      firma: args.firma,
    });

    await ctx.db.patch(docState._id, {
      progressRows: currentProgress,
    });
  },
});

export const addConversationEvent = mutation({
  args: {
    sessionId: v.id("sessions"),
    sender: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("conversationEvents", {
      sessionId: args.sessionId,
      sender: args.sender,
      text: args.text,
      timestamp: Date.now(),
    });
  },
});

export const updateFaceState = mutation({
  args: {
    sessionId: v.id("sessions"),
    expression: v.string(),
    mouthOpen: v.float64(),
  },
  handler: async (ctx, args) => {
    const face = await ctx.db
      .query("faceState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (face) {
      await ctx.db.patch(face._id, {
        expression: args.expression,
        mouthOpen: args.mouthOpen,
      });
    }
  },
});
