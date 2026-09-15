# Handover Guide

This guide is specifically for the technical team that will take over the SSXI 2 project in the future.

### 1. What this project does
SSXI 2 is an event management and participant portal platform for Startup Street XI. It allows users to authenticate via Google, form or join teams via invite codes, track event timelines/announcements, and submit their final pitch decks directly through the platform.

### 2. Project architecture
The project is a strictly separated Monorepo:
- **Frontend** (`frontend/`): React SPA built with Vite and styled with Tailwind CSS.
- **Backend** (`backend/`): Express REST API that handles business logic and directly interfaces with the database.
- **Database**: Supabase (PostgreSQL), utilizing both the Data API and Storage API.

### 3. Where to start reading the code
Recommended reading order to understand the codebase:
1. `docs/ARCHITECTURE.md` (Overview)
2. `docs/FLOW.md` (User workflows)
3. `frontend/src/App.jsx` (Frontend routing)
4. `frontend/src/lib/api.js` (How frontend talks to backend)
5. `backend/app.js` (Express entrypoint)
6. `backend/routes/` & `backend/controllers/` (How backend handles requests)
7. `backend/config/supabase.js` (Database connection)

### 4. Important files

| File | Purpose |
| ---- | ------- |
| `frontend/vite.config.js` | Frontend build and dev server config, including local API proxy. |
| `api/index.js` | Critical wrapper that allows the Express backend to run natively on Vercel Serverless Functions. |
| `vercel.json` | Contains API rewrite rules (`/api/*` -> `api/index.js`) needed for deployment. |
| `backend/controllers/submissions.controller.js` | Complex logic handling file uploads to Supabase storage. |

### 5. Important business rules
- **Zero-Trust File Verification**: Submission endpoints manually check if the uploading user is officially part of the requested team.
- **Team Size Constraints**: Admin configurations (`event_config`) dynamically govern minimum/maximum team sizes. Do NOT hardcode team sizes in the backend.
- **Direct Database Access**: The backend does not use an ORM. It executes direct Supabase queries. Preserve this for performance reasons.

### 6. Environment variables
- `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL. Safe to expose to client.
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key. Safe to expose to client.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase admin key. **MUST REMAIN SECRET**. Only used in backend.
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID used in `authService.js`.

### 7. Deployment
The project is hosted on Vercel. 
- The Vercel project MUST point to the repository root.
- The root `package.json` instructs Vercel to build the frontend.
- `api/index.js` and `vercel.json` instruct Vercel to host the backend as a serverless function.

### 8. Common debugging locations
- **API CORS/Proxy issues locally** → Check `frontend/vite.config.js` proxy settings.
- **Business Logic bugs** → Check `backend/controllers/`.
- **Database / Auth Errors** → Check `backend/config/supabase.js` keys.
- **Deployment 404s** → Check `vercel.json` rewrites.

### 9. Known quirks
- The `api/db-wake.js` script handles "waking up" the Supabase database if it has gone to sleep (common on Supabase free tiers). Do not remove this retry logic in `db-client.js`.
