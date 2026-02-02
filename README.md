# Coffee Inventory MVP

Web-based inventory and forecasting MVP for a single-location coffee shop. Built as a monorepo: Vue 3 frontend, Next.js API, Prisma + SQLite.

## Stack

- **Frontend**: Vue 3, Vite, TypeScript, Pinia, Tailwind CSS, Chart.js
- **Backend**: Next.js (App Router) API routes only
- **Database**: SQLite (local dev), Prisma ORM
- **Hosting**: Vercel (one project; web + API)

## Project structure

```
apps/
  web/     Vue 3 + Vite app
  api/     Next.js API routes
packages/
  db/      Prisma schema + client
lib/
  forecasting/  Day-of-week forecast, reorder suggestions
  posAdapters/  Square & Toast stubs (not implemented)
```

## Local development

### Prerequisites

- Node 18+
- SQLite (automatically created by Prisma)

### Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. A `.env` file has been created in the **repo root** with:

   - `DATABASE_URL="file:./dev.db"` — SQLite database for local development
   - `SESSION_SECRET` — secret for session cookies
   - `ALLOWED_ORIGIN` — CORS origin for API (defaults to `http://localhost:5173`)

   The SQLite database is stored at `packages/db/prisma/dev.db`.

3. Generate Prisma client and push schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Seed the database:

   ```bash
   npm run db:seed
   ```

   Seed creates one shop, owner user (`owner@demo.coffee` / `demo123`), core ingredients (espresso beans, whole milk, oat milk, orange flavoring, cardamom), base drinks (espresso, latte, iced latte), and the signature drink **Foxtrot** (espresso + orange flavoring + cardamom).

5. Run dev servers (from repo root):

   ```bash
   npm run dev:api    # Next.js API on http://localhost:3000 (uses root .env)
   npm run dev:web    # Vue on http://localhost:5173
   ```

   Open http://localhost:5173 and sign in with `owner@demo.coffee` / `demo123`.

## Deploy (Vercel)

- Use **one Vercel project** at the monorepo root. Configure build so both `apps/web` and `apps/api` are deployed (e.g. web as frontend, api as serverless functions).
- **Environment variables**:
  - `DATABASE_URL` — production PostgreSQL URL
  - `SESSION_SECRET` — strong secret for session cookies
  - `ALLOWED_ORIGIN` — your frontend origin (e.g. `https://your-app.vercel.app`)
  - For the Vue app build: `VITE_API_URL` — your API base URL (e.g. `https://your-api.vercel.app`) so the frontend calls the correct API in production.

**CORS**: The Next.js API is configured to allow the web app origin and credentials (cookies) via middleware and `next.config.js` headers. Set `ALLOWED_ORIGIN` to match your frontend URL.

## Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev:web`   | Start Vue dev server (port 5173) |
| `npm run dev:api`   | Start Next.js API (port 3000)    |
| `npm run db:generate` | Generate Prisma client          |
| `npm run db:push`   | Push schema to DB (no migrations) |
| `npm run db:seed`   | Run seed script                 |

## Architecture

See [architecture.md](architecture.md) for goals, data models, inventory and forecasting logic, and API design.
