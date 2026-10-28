# Candidate Feedback Board

A small full-stack application for tracking interview candidates, interviews, and structured feedback.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** Supabase Postgres
- **Validation:** Zod
- **Deployment target:** AWS App Runner / S3 + CloudFront; fallback Netlify + Render

## Architecture

```text
React frontend
      |
      v
Express API
      |
      v
Supabase Postgres
```

## Local setup

### 1. Database

1. Create a Supabase project.
2. Run `db/schema.sql` in the Supabase SQL editor.
3. Copy the project connection string.

### 2. Backend

```bash
cd backend
cp ../.env.example .env
npm install
npm run dev
```

Set `DATABASE_URL` in `backend/.env`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3000`.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/api/candidates` | List candidates with interview feedback |
| POST | `/api/candidates` | Create a candidate |
| POST | `/api/candidates/:id/interviews` | Schedule an interview |
| POST | `/api/interviews/:id/feedback` | Add interview feedback |

## Deployment

- Frontend: S3 + CloudFront or Netlify
- Backend: AWS App Runner or Render
- Database: Supabase Postgres
- Secrets: environment variables; never commit `.env`
- Health check: `GET /health`

## AI usage

AI was used to accelerate boilerplate, schema review, and test ideas. All generated SQL, routes, validation, and deployment configuration should be reviewed and tested before use.
