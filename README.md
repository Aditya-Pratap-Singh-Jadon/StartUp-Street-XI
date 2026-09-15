# SSXI 2 - Startup Street XI Participant Portal

SSXI 2 is the fully integrated participant portal and event management platform for Startup Street XI. It handles participant authentication, team creation/joining, event announcements, and submission handling for final pitch decks.

## Architecture & Documentation

This project has been restructured into a decoupled Frontend (React+Vite) and Backend (Express) architecture, unified under a monorepo structure designed for zero-config Vercel Serverless deployment.

Please see the `docs/` directory for comprehensive documentation:
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md): System overview and layout.
- [FLOW.md](./docs/FLOW.md): Core user workflows and component interactions.
- [DATABASE.md](./docs/DATABASE.md): Supabase schema and structure.
- [API.md](./docs/API.md): Backend endpoint specifications.
- [SETUP.md](./docs/SETUP.md): Local development setup instructions.
- [HANDOVER.md](./docs/HANDOVER.md): Detailed handover guide for the technical team.

## Quick Start

```bash
# Install all dependencies (Root, Frontend, and Backend)
npm run install:all

# Start local development server (Frontend on 5173, Backend on 3000)
npm run dev

# Build frontend for production
npm run build
```

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Express, Supabase JavaScript SDK
- **Database**: Supabase (PostgreSQL), Supabase Storage
- **Deployment**: Vercel
