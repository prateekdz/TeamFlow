# Team Flow

Team Flow is a full-stack task management app migrated to modern JavaScript with an Express API, a React frontend, Drizzle ORM models, and Clerk authentication.

## Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
public/
  index.html
  src/
  lib/
tests/
```

## Requirements

- Node.js 22+ or newer
- PostgreSQL
- Clerk keys for authentication

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Push the database schema:

```bash
npm run db:push
```

4. Start local development:

```bash
npm run dev
```

The API runs on `PORT` and Vite runs on `CLIENT_PORT`.

## Scripts

- `npm run dev` starts the API and frontend together.
- `npm run start` starts the API server.
- `npm run build` builds the frontend into `dist/public`.
- `npm run test` runs the Node test suite.
- `npm run lint` runs ESLint.
- `npm run db:push` pushes the Drizzle schema to PostgreSQL.
