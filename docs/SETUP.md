# SSXI 2 Setup Guide

## Requirements
- Node.js (v18 or higher)
- npm or pnpm

## Local Development Setup

1. **Install Dependencies**
   From the root of the project, run:
   ```bash
   npm run install:all
   ```
   This will install the root dependencies, as well as the dependencies inside `frontend/` and `backend/`.

2. **Environment Variables**
   The project requires Supabase credentials to function.
   - For the frontend (`frontend/.env`):
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
     VITE_GOOGLE_AUTH_PROXY=your_google_proxy
     ```
   - For the backend (`backend/.env`):
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```
   
   *(Note: NEVER commit these `.env` files. Safe `.env.example` files are provided).*

3. **Start the Development Server**
   From the root of the project, run:
   ```bash
   npm run dev
   ```
   This command starts both the Vite frontend (port 5173) and the Express backend (port 3000) concurrently. The frontend Vite configuration automatically proxies `/api` requests to the backend on port 3000.

## Build and Deployment

### Vercel Deployment
This project is configured as a monorepo for Vercel deployment:
- **Root Directory**: Leave it as the project root (`/`).
- **Build Command**: Vercel automatically builds using the `npm run build` script defined in the root `package.json` (which builds the frontend).
- **Output Directory**: Vercel handles the output appropriately.
- **Serverless API**: Vercel detects the `api/index.js` file at the root. We use a rewrite rule in `vercel.json` to funnel all backend traffic (`/api/*`) through this entrypoint, which loads the Express backend.

### Manual Frontend Build
To verify the frontend build locally:
```bash
npm run build
```
This builds the production assets into `frontend/dist`.
