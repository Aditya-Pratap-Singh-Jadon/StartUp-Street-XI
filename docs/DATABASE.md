# Database Architecture

SSXI 2 uses MongoDB (via Mongoose) as its primary database, while continuing to use Supabase strictly for Authentication and File Storage.

## Connection Architecture

- **Frontend**: The frontend interacts directly with the Backend APIs for all data operations. It uses the Supabase client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) purely for authentication (Google OAuth/Login) and auth state tracking.
- **Backend**: The backend connects to MongoDB Atlas using `MONGODB_URI` for all data collections. It uses the Supabase client for handling file uploads to Supabase Storage.

## Core Models (Mongoose)

### 1. `Profile`
Stores participant information.
- **Fields**: `_id` (Matches the Supabase Auth User UUID), `email`, `name`, `phone`, `reg_no`, `role` (admin/participant), `created_at`.
- **Usage**: Managed by the Auth controller. Maps directly to the Supabase Auth user.

### 2. `Team`
Stores team entities.
- **Fields**: `name`, `code` (Unique invite code), `leader_id` (References `Profile._id`), `created_at`.
- **Usage**: Managed by the Teams controller.

### 3. `TeamMember`
Junction collection mapping users to teams.
- **Fields**: `team_id`, `user_id`, `joined_at`.

### 4. `Submission`
Stores final pitch submissions.
- **Fields**: `team_id`, `file_name`, `file_url`, `file_type`, `file_size`, `github_url`, `status`, `submitted_by`, `updated_at`, `created_at`.

### 5. `EventConfig`
Key-Value store for global event configuration (e.g., whether submissions are open).
- **Fields**: `key`, `value`.

### 6. `Notification`
Stores system notifications for users.
- **Fields**: `user_id`, `title`, `body`, `type`, `read`, `created_at`.

### 7. `Announcement`
Stores global event announcements.
- **Fields**: `title`, `content`, `priority`, `published`, `expires_at`, `created_at`.

### 8. `Result`
Stores the final judging results.
- **Fields**: `team_name`, `team_code`, `position`, `category`, `description`, `sort_order`, `published`.

### 9. `TimelineEvent`
Stores the event schedule/timeline.

### 10. `FAQ`
Stores frequently asked questions and answers.

### 11. `Judge`
Stores profiles of the judges.

## File Storage
- **`submissions` Bucket**: A Supabase Storage bucket is still used to store presentation files uploaded by participants. This functionality remains separate from the MongoDB migration.
