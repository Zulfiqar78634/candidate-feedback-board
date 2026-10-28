# Candidate Feedback Board

A production-oriented full-stack application for tracking interview candidates, interviews, and structured feedback.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js 20 + Express
- **Database:** Supabase Postgres
- **Validation:** Zod
- **Security:** Helmet, CORS allowlist, rate limiting
- **Observability:** Pino structured JSON logs and `/health`
- **Packaging:** Docker
- **CI:** GitHub Actions

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

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the production architecture, security controls, observability, scaling, and rollback strategy.

## Features

- Create and list candidates.
- Select a candidate and view their interviews and feedback.
- Schedule interviews.
- Submit structured interview feedback with rating, strengths, concerns, and recommendation.
- View aggregate interview count and average rating.

## Local development

### Option A: Docker Compose

```bash
docker compose up --build
```

- API: http://localhost:3000
- Health: http://localhost:3000/health

### Option B: Supabase + local Node

1. Create a Supabase project.
2. Run `db/schema.sql` in the Supabase SQL editor.
3. Copy the connection string.

```bash
cd backend
cp ../.env.example .env
# Set DATABASE_URL to your Supabase connection string
npm install
npm run dev
```

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3000`.

## Environment variables

### Backend

| Variable | Required | Description |
|---|---:|---|
| `PORT` | No | API port; defaults to `3000` |
| `DATABASE_URL` | Yes | Postgres connection string |
| `CORS_ORIGIN` | Yes | Comma-separated allowed frontend origins |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error` |

### Frontend

| Variable | Required | Description |
|---|---:|---|
| `VITE_API_BASE_URL` | Production only | Deployed backend base URL; leave empty locally to use the Vite proxy |

Never commit `.env`. Use deployment-platform environment variables or AWS Secrets Manager/Parameter Store in production.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Checks API and database health |
| GET | `/api/candidates` | Lists candidates with aggregate feedback |
| GET | `/api/candidates/:id` | Returns a candidate with interviews and feedback |
| POST | `/api/candidates` | Creates a candidate |
| POST | `/api/candidates/:id/interviews` | Schedules an interview |
| POST | `/api/interviews/:id/feedback` | Adds structured interview feedback |

## Production deployment

### AWS

- **Frontend:** Build React, upload `dist/` to S3, serve through CloudFront.
- **Backend:** Build `backend/Dockerfile`, push to Amazon ECR, deploy through App Runner or ECS Fargate.
- **Database:** Supabase Postgres.
- **Secrets:** AWS Secrets Manager or Systems Manager Parameter Store.
- **Logs:** CloudWatch Logs.
- **Health check:** `GET /health`.

### Fallback: Render + Netlify

1. Deploy `backend/` to Render using `render.yaml`.
2. Set `DATABASE_URL` to Supabase and `CORS_ORIGIN` to the Netlify frontend URL.
3. Deploy `frontend/` to Netlify using `netlify.toml`.
4. Set `VITE_API_BASE_URL` in Netlify to the Render backend URL, such as `https://candidate-feedback-api.onrender.com`.
5. Test `/health`, candidate creation, interview scheduling, and feedback submission.

## CI

GitHub Actions runs:

1. Backend tests.
2. Frontend production build.

## AI usage

AI was used to accelerate scaffolding, schema review, and test generation. All SQL, API code, security settings, and deployment configuration should be reviewed and tested before production use.
