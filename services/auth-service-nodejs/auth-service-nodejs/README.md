# auth-service-nodejs

Authentication & authorisation microservice for Elastic FS (Express + Postgres + JWT).

## Endpoints
- `POST /api/v1/auth/register` – create user
- `POST /api/v1/auth/login` – issue JWT
- `GET  /api/v1/auth/verify` – verify token (requires `Authorization: Bearer <token>`)
- `GET  /api/v1/auth/me` – current user (requires bearer token)
- `POST /api/v1/auth/roles/assign` – assign a role to a user (requires bearer token with `admin` role)

## Quick start
1. Create DB schema:
   ```sql
   -- run file sql/init.sql against your Postgres
   ```
2. Copy `.env.example` → `.env` and set `JWT_SECRET` and database creds.
3. Install & run:
   ```bash
   npm install
   npm run dev
   # Health
   curl http://localhost:${PORT:-8000}/health
   ```

## Notes
- Passwords are hashed with bcrypt (12 rounds).
- Roles are stored in `roles` and assigned via `user_roles`. Default `user` role is added on registration.
