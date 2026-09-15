# API Endpoints

This document outlines the backend API endpoints.

## 1. Auth (`/api/auth`)

- **`GET /api/auth`**
  - **Purpose**: Fetch user profile(s).
  - **Params**: `id` (User ID), `all` (Admin only), `admin_id` (Admin ID if `all=1`).
  - **Auth**: None, except for Admin checks when `all=1`.

- **`POST /api/auth`**
  - **Purpose**: Create or update user profile.
  - **Body**: `id`, `email`, `name`, `phone`, `reg_no`.

- **`PUT /api/auth`**
  - **Purpose**: Update user profile fields.

## 2. Teams (`/api/teams`)

- **`GET /api/teams`**
  - **Purpose**: Fetch team details or list all teams.
  - **Params**: `code` (Invite Code), `user_id`, `all` (Admin only).

- **`POST /api/teams`**
  - **Purpose**: Perform a team action.
  - **Body Actions**: 
    - `create`: requires `name`, `user_id`.
    - `join`: requires `code`, `user_id`.
    - `leave`: requires `user_id`.
    - `remove_member`: requires `team_id`, `user_id` (leader), `target_id`.

- **`PUT /api/teams`**
  - **Purpose**: Rename a team (leader only).

## 3. Submissions (`/api/submissions`)

- **`GET /api/submissions`**
  - **Purpose**: Get team submission or all submissions.
  - **Params**: `team_id`, `all`.

- **`POST /api/submissions` & `PUT /api/submissions`**
  - **Purpose**: Upload or update final pitch deck.
  - **Body**: `team_id`, `user_id`, `file_name`, `file_base64`, `content_type`, `github_url`.
  
## 4. Other Endpoints

- **`/api/announcements`**: CRUD for announcements.
- **`/api/config`**: Get/set event configuration limits.
- **`/api/faqs`**: CRUD for FAQs.
- **`/api/judges`**: CRUD for Judge profiles.
- **`/api/notifications`**: Get user notifications / mark as read.
- **`/api/results`**: CRUD for judging results.
- **`/api/stats`**: Admin event statistics.
- **`/api/timeline`**: CRUD for timeline events.
