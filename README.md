# Sahayak AI

A full‑stack web application with a React (Vite) frontend and an Express + MongoDB backend. It supports user authentication (email/password and Google OAuth via Firebase), news, services, appointments, and an admin panel.

- Live (Render): `https://sahayak-ai-c7ol.onrender.com`
- Repository: `https://github.com/Nobin7034/Sahayak-AI`

## Features

- React SPA built with Vite and Tailwind CSS
- Express REST API with modular routes and middleware
- MongoDB via Mongoose (users, services, news, appointments, etc.)
- Authentication:
  - Email/password (backend JWT)
  - Google OAuth (Firebase client-side + backend verification)
- Admin area (role-based access)
- Single Render Web Service hosting frontend build and backend API on the same origin

## Architecture

```
root
├── backend
│   ├── config/           # Database & Firebase admin (if used)
│   ├── middleware/       # Auth, cors, etc.
│   ├── models/           # Mongoose schemas (User, Service, News, Appointment, ...)
│   ├── routes/           # Route modules (/api/auth, /api/services, /api/news, ...)
│   └── server.js         # Express app entry, serves frontend in production
└── frontend
    ├── src
    │   ├── components/   # UI components
    │   ├── contexts/     # AuthContext (Axios base, token handling, Google sign-in)
    │   ├── pages/        # Pages (Landing, Login, Dashboard, Admin/*, ...)
    │   ├── firebase.js   # Firebase client init (auth + Google provider)
    │   └── main.jsx      # App bootstrap + GoogleOAuthProvider
    └── index.html        # Vite entry
```

In production (`NODE_ENV=production`), `backend/server.js` serves the built frontend from `frontend/dist` and responds to non‑API routes with `index.html`. API routes live under `/api/*`.

## Prerequisites

- Node.js 18+ (Render uses Node 22 by default — compatible)
- npm
- MongoDB instance (local for dev, hosted for prod)

## Environment Variables

Frontend (Vite reads only variables prefixed with `VITE_` and at build time):

```
frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api         # dev; for prod same origin can be empty
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-web-client-id>
```

Backend (set in Render service and optionally a local `.env` used by `dotenv`):

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
NODE_ENV=development|production
# If you gate CORS in development:
FRONTEND_URL=http://localhost:5173
```

## Local Development

1) Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

2) Run backend

```bash
cd backend
npm start
# listens on http://localhost:5000
```

3) Run frontend (in another terminal)

```bash
cd frontend
npm run dev
# opens http://localhost:5173
```

Ensure `frontend/.env` contains your `VITE_API_BASE_URL` pointing to `http://localhost:5000/api` and a valid `VITE_GOOGLE_CLIENT_ID`.

## Deployment (Render: single Web Service)

We deploy a single Node Web Service that builds the React app and serves it from Express.

- Build Command:

```
cd frontend && npm install && npm run build && cd ../backend && npm install
```

- Start Command:

```
node backend/server.js
```

- Environment (Render → Environment tab):
  - `NODE_ENV=production`
  - `MONGODB_URI=<your-connection-string>`
  - `JWT_SECRET=<your-secret>`
  - `VITE_GOOGLE_CLIENT_ID=<your-google-oauth-web-client-id>`
  - Optional for explicit base: `VITE_API_BASE_URL=` (empty for same-origin)

After deployment, the site is available at your Render URL and the API is served from the same origin under `/api/*`.

## Google OAuth & Firebase Setup

Frontend uses Firebase client auth for Google sign‑in, then exchanges the Firebase ID token with the backend (`POST /api/auth/google`).

1) Firebase Console → Authentication:
   - Enable Google provider.
   - Settings → Authorized domains:
     - Add `localhost` (and/or `127.0.0.1`) for local dev
     - Add your Render domain, e.g. `sahayak-ai-c7ol.onrender.com`

2) Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs:
   - Use a Web client ID and set it as `VITE_GOOGLE_CLIENT_ID`.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000` (if used)
     - `https://sahayak-ai-c7ol.onrender.com`
   - Authorized redirect URIs (only needed if not using popup flow):
     - `http://localhost:5173`
     - `https://sahayak-ai-c7ol.onrender.com`

## API Overview

Base URL:

- Dev: `http://localhost:5000/api`
- Prod: `https://sahayak-ai-c7ol.onrender.com/api` (same origin)

Key routes (see files in `backend/routes/`):

- `POST /auth/register` — register user
- `POST /auth/login` — email/password login (returns backend JWT)
- `POST /auth/google` — verify Firebase ID token and sync/login
- `GET /auth/me` — validate token and fetch user
- `GET /services` — list services
- `GET /news` — list news
- `GET /news/latest/:n` — latest n news
- `POST /appointments` — create appointment (auth required)

## Common Troubleshooting

- Frontend shows API JSON at root URL
  - Ensure `NODE_ENV=production` on Render; `server.js` will serve the React build and route non‑API paths to `index.html`.

- Frontend calls `http://localhost:5000` in production
  - Set `VITE_API_BASE_URL` in Render (or leave empty for same-origin) and redeploy so Vite rebuilds.

- Google sign‑in: `FirebaseError: auth/unauthorized-domain`
  - Add your Render domain to Firebase Auth → Authorized domains.
  - Ensure `VITE_GOOGLE_CLIENT_ID` matches your OAuth Web client ID.

- `vite: not found` on Render build
  - Ensure build tools (`vite`, `@vitejs/plugin-react`, `tailwindcss`, etc.) are in `frontend/package.json` `dependencies` (not only `devDependencies`) or install with `npm install --include=dev` before `npm run build`.

- `npm ci` fails at repo root
  - Install inside `frontend` and `backend` only, not at the monorepo root.

## Scripts

From the project root (Windows helpers):

- `start-dev.bat` — opens two terminals for frontend and backend
- `test-google-login.bat` — helper for Google login testing

From `frontend/`:

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist`
- `npm run preview` — preview built app locally

From `backend/`:

- `npm start` — start Express server

---

If you run into issues, open the browser console and network tab, and check Render logs. Most production issues are environment variable or domain configuration mismatches.