# SSXI 2 Architecture

This document provides a high-level overview of the SSXI 2 project architecture.

## Overview

SSXI 2 is a monolithic repository split into two main sections:
1. **Frontend**: A React application built with Vite and Tailwind CSS.
2. **Backend**: An Express.js application designed to be compatible with Vercel Serverless functions, connecting to MongoDB for data storage, and Supabase for Authentication and Storage.

```text
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Frontend     │
                    │ React + Vite    │
                    │ (Hosted on      │
                    │  Vercel Edge/   │
                    │  Static Build)  │
                    └────────┬────────┘
                             │
                         API Calls
                      (/api/* routes)
                             │
                             ▼
                    ┌─────────────────┐
                    │     Backend     │
                    │ Express App     │
                    │ (Hosted as      │
                    │ Vercel Function)│
                    └────────┬────────┘
             ┌───────────────┴───────────────┐
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │    MongoDB      │             │    Supabase     │
    │   (Mongoose)    │             │ (Auth & Storage)│
    └─────────────────┘             └─────────────────┘
```

## Frontend Architecture

Located in `frontend/`. 
- **Components**: Found in `frontend/src/components/`, containing reusable UI pieces.
- **Pages**: Found in `frontend/src/pages/`, each corresponding to a specific route.
- **Contexts**: Located in `frontend/src/contexts/`, managing global state (e.g., AuthContext).
- **Libraries**: Handlers for API requests and third-party interactions, located in `frontend/src/lib/`.
- **Styling**: Tailwind CSS is used heavily, configured via `vite.config.js`.

## Backend Architecture

Located in `backend/`.
- **Express Setup**: `backend/app.js` builds the Express application and initializes the MongoDB connection. `backend/server.js` listens for local development.
- **Controllers & Routes**: Separated into `backend/controllers/` and `backend/routes/`. The controllers interact directly with Mongoose models.
- **Models**: Located in `backend/models/`. Mongoose schemas defining the structure of the data collections.
- **Services**: Helper functions (like `helpers.js`) and notification broadcasting.
- **Configuration**: 
  - `backend/config/database.js` manages MongoDB connectivity.
  - `backend/config/supabase.js` initializes the Supabase client for specific internal operations like Storage.

## Deployment Architecture

The project is deployed on Vercel.
- The `frontend/` directory is built using `npm run build`.
- The `api/index.js` file at the root acts as a Serverless Function entry point, wrapping the Express app.
- `vercel.json` contains a rewrite rule ensuring all requests to `/api/*` are handled by `api/index.js`.
