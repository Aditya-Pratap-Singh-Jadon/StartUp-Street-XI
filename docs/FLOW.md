# Application Flows

This document maps out the critical user flows in the SSXI 2 application.

## Authentication Flow

```text
User
 ↓ (Clicks "Login with Google")
Login Page (`frontend/src/pages/Login.jsx`)
 ↓
Google Auth Service (`frontend/src/services/authService.js`)
 ↓
OAuth Popup
 ↓
Supabase Authentication (ID Token / Access Token)
 ↓
AuthContext updates (`frontend/src/contexts/AuthContext.jsx`)
 ↓
API Call to `POST /api/auth`
 ↓ (Creates or updates user profile)
Backend Auth Controller (`backend/src/controllers/auth.controller.js`)
 ↓
Supabase `profiles` table
 ↓
User redirected to Dashboard
```

## Team Creation Flow

```text
User (Logged In)
 ↓ (Enters Team Name, clicks "Create")
Dashboard Page (`frontend/src/pages/Dashboard.jsx`)
 ↓
API Call to `POST /api/teams` (action: 'create')
 ↓
Backend Teams Controller (`backend/src/controllers/teams.controller.js`)
 ↓
Validation (checks if user is already in a team)
 ↓
Generates unique Team Code
 ↓
Supabase `teams` and `team_members` tables
 ↓
Dashboard updates with new team information
```

## Team Joining Flow

```text
User (Logged In)
 ↓ (Enters Team Code or clicks Invite Link)
Join Team Page (`frontend/src/pages/JoinTeam.jsx`)
 ↓
API Call to `POST /api/teams` (action: 'join')
 ↓
Backend Teams Controller (`backend/src/controllers/teams.controller.js`)
 ↓
Validation (team not full, code exists)
 ↓
Supabase `team_members` table
 ↓
Notification sent to Team Leader
 ↓
User redirected to Dashboard
```

## Final Pitch Submission Flow

```text
User (Team Member)
 ↓ (Selects file, clicks "Submit")
Dashboard Page (`frontend/src/pages/Dashboard.jsx`)
 ↓
API Call to `POST /api/submissions`
 ↓
Backend Submissions Controller (`backend/src/controllers/submissions.controller.js`)
 ↓
Validation (Submissions open? File valid?)
 ↓
File uploaded to Supabase Storage (`submissions` bucket)
 ↓
Supabase `submissions` table updated
 ↓
Notification sent to all team members
```
