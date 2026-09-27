# API Reference

Interactive OpenAPI reference: `/api-docs`.

All feature routes require `Authorization: Bearer <access-token>` except auth endpoints and `/api/health`. Successful JSON responses use `{ "success": true, "data": ... }`; create responses use HTTP 201, accepted async work uses 202, and delete responses use 204.

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| Current user | `GET /api/users/me` |
| Prompt templates | `GET /api/prompts`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Prompt evolution | `GET /api/prompt-history`, `GET /:id` |
| Videos | `GET /api/videos`, `GET /:id`, `GET /:id/download`, `POST /generate`, `DELETE /:id` |
| Metadata | `GET /api/metadata/:videoId`, `PUT /:videoId`, `POST /regenerate/:videoId` |
| Channels | `POST /api/channels/connect`, `POST /disconnect`, `GET /`, `GET /:id`, `POST /:id/refresh` |
| Uploads | `GET /api/uploads`, `POST /retry/:id`, `DELETE /cancel/:id`, `GET /:id/logs` |
| Analytics | `GET /api/analytics/summary`, `/daily`, `/weekly`, `/monthly`, `/video/:id` |
| Notifications | `GET /api/notifications`, `PATCH /:id/read`, `DELETE /:id` |
| Settings | `GET /api/settings`, `PUT /api/settings` |

Prompt/video/history/metadata/upload/analytics/channel/notification/settings access is scoped to the authenticated user. YouTube channel connect accepts a server-exchanged OAuth authorization code, never provider credentials. The daily generation clock is stored in each user's settings, including timezone and daily run cap.