# DentisCraft PRO — Frontend

Interfaz de **DentisCraft PRO**: asistente que rellena una ficha clínica dental
por dictado de voz (React + Vite).

Este repositorio es **solo frontend**. No contiene esquema de base de datos ni
lógica de servidor: consume el backend a través de una **API HTTP**, contra una
URL base configurable. No depende del SDK de Convex — solo de `fetch`.

---

## Requisitos

- Node.js 20+
- El backend de DentisCraft levantado (local o desplegado)
- Navegador con `SpeechRecognition` (Chrome / Edge) para el dictado por voz

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y pon la URL de tu backend
npm run dev
```

`.env.local`:

```
# Backend local (npx convex dev --local en el repo del backend)
VITE_API_URL=http://127.0.0.1:3211

# Backend en la nube (npx convex dev / npx convex deploy)
VITE_API_URL=https://amiable-shark-651.convex.site
```

> Ojo: es la **HTTP Actions URL** (`.convex.site`), no la Cloud URL
> (`.convex.cloud`). Y Vite solo lee las variables de entorno al arrancar: si
> cambias `.env.local`, reinicia `npm run dev`.

Si falta `VITE_API_URL`, la app explica cómo configurarla en vez de fallar en
blanco. Si la URL está pero el backend no responde, muestra el error concreto
con un botón de reintento.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | Oxlint |

## Estructura

```
src/
├── main.jsx                # Punto de entrada
├── App.jsx                 # Layout y cableado de la sesión
├── backendApi.js           # Cliente HTTP: la única puerta al backend
├── useBackendSession.js    # Estado de la sesión (carga, escrituras, sondeo)
├── BackendGuard.jsx        # Pantalla si falta VITE_API_URL
├── index.css / App.css     # Estilos (glassmorphism estilo Vision Pro)
└── components/
    ├── AsciiFace.jsx        # Avatar ASCII reactivo al micrófono
    ├── VoiceController.jsx  # Dictado + extracción de entidades en español
    ├── DocumentPreview.jsx  # Ficha clínica en pantalla y exportación a PDF
    └── Odontograma.jsx      # Odontograma interactivo (notación FDI)
```

Los componentes de `components/` son presentacionales: reciben estado y
callbacks por props y no saben que existe un backend.

## Cómo se conecta con el backend

**`src/backendApi.js`** es la única puerta de salida. Expone `backend.*`, un
método por endpoint, y lee la URL base de `import.meta.env.VITE_API_URL`.
Cambiar de backend local a desplegado es cambiar esa variable, nada más.

**`src/useBackendSession.js`** mantiene el estado de la sesión y devuelve
`{ sessionId, sessionData, error, isOnline, startSession, mutate }`. Toda
escritura pasa por `mutate`:

```js
mutate(id => backend.updateField(id, "nombre", "Carlos Ortiz"));
```

### Frescura de los datos

Sobre HTTP no hay suscripción reactiva, así que la ficha se mantiene al día de
dos formas:

1. **Tras cada escritura se relee la ficha.** Las ráfagas del dictado se agrupan
   con un debounce de 150 ms para no disparar una lectura por palabra.
2. **Sondeo de fondo cada 4 s**, que además hace de latido para el indicador de
   conexión del dock.

Ambos intervalos son constantes al principio de `useBackendSession.js`.

### Endpoints que consume

`GET /api/health`, `POST /api/session`, `GET /api/session`,
`POST /api/session/field`, `POST /api/session/tooth`,
`POST /api/session/treatment`, `POST /api/session/progress`,
`POST /api/session/conversation`, `POST /api/session/face`.

El contrato completo está documentado en el README del backend.

## Pendiente

El envío del PDF por correo (`handleEmailRequest` en `App.jsx`) hoy está
**simulado** con un `setTimeout`. La implementación real corresponde al backend,
para no exponer credenciales de Gmail en el navegador.
