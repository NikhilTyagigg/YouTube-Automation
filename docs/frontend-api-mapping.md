# Frontend to Backend API Map

The frontend uses React Query for server state and Zustand only for session state held in memory and user interface preferences such as theme. Successful backend `{ success, data }` responses are unwrapped by the Axios response interceptor. Errors are propagated to the screen and surfaced in retryable error or inline mutation states.

| Frontend screen / workflow | Data and mutations | Backend endpoints |
| --- | --- | --- |
| Login | Login, restore session, sign out | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Register | Create user/session | `POST /api/auth/register` |
| Profile | Current user comes with refresh/login session; profile service available | `GET /api/users/me` |
| Forgot/reset password | Calls the expected endpoint and reports server errors. Backend has no recovery endpoints yet. | **Not implemented:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Dashboard | Metrics summary, views chart, recent videos, connected channels | `GET /api/analytics/summary`, `GET /api/analytics/daily`, `GET /api/videos`, `GET /api/channels` |
| Prompt library | List/search/filter, create/edit/delete; clone is create with copied fields | `GET /api/prompts`, `GET /api/prompts/:id`, `POST /api/prompts`, `PUT /api/prompts/:id`, `DELETE /api/prompts/:id` |
| Prompt evolution | List and date/name filter stored prompt runs | `GET /api/prompt-history`, `GET /api/prompt-history/:id` |
| Video studio | List, generate from active prompt, details, delete, download | `GET /api/videos`, `GET /api/videos/:id`, `POST /api/videos/generate`, `DELETE /api/videos/:id`, `GET /api/videos/:id/download` |
| Metadata | Load/save/regenerate title, description, hashtags | `GET /api/metadata/:videoId`, `PUT /api/metadata/:videoId`, `POST /api/metadata/regenerate/:videoId` |
| Upload schedule | Reads/writes the account's one daily upload time, timezone and cap; shows queue | `GET /api/settings`, `PUT /api/settings`, `GET /api/uploads` |
| Upload manager | Queue, retry, cancel, upload logs | `GET /api/uploads`, `POST /api/uploads/retry/:id`, `DELETE /api/uploads/cancel/:id`, `GET /api/uploads/:id/logs` |
| Channels | List, OAuth connect, detail, refresh token, disconnect | `GET /api/channels`, `GET /api/channels/:id`, `GET /api/channels/oauth/url`, Google OAuth callback, `POST /api/channels/:id/refresh`, `POST /api/channels/disconnect` |
| Analytics | Summary, daily/weekly/monthly series, per-video data | `GET /api/analytics/summary`, `GET /api/analytics/daily`, `GET /api/analytics/weekly`, `GET /api/analytics/monthly`, `GET /api/analytics/video/:id` |
| Notifications | List, mark read, delete; unread badge polls every 60 seconds | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `DELETE /api/notifications/:id` |
| Settings | User generation, channel, daily upload and notification defaults | `GET /api/settings`, `PUT /api/settings` |

## Current backend capability gaps

The backend schema/settings currently stores one daily upload time per account. It does not provide CRUD for multiple weekday/custom schedules, so the scheduler screen exposes the supported daily setting and upload queue rather than persisting pretend local schedules. Password recovery endpoints and email delivery are also not implemented. Subscriber counts and YouTube traffic-source breakdown are not included in current analytics collectors; those fields display as unavailable instead of fabricated values.

## Environment and credentials

`frontend/.env` uses `VITE_API_URL=http://localhost:5000/api`. The browser only stores the short-lived access token in memory. The refresh token remains an HttpOnly cookie. Gemini and Google client secrets stay on the backend.
