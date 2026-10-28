# Production Architecture

## System overview

```text
                    ┌────────────────────┐
                    │  CloudFront / CDN  │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ React static site  │
                    │ S3 / Netlify       │
                    └─────────┬──────────┘
                              │ HTTPS JSON
                    ┌─────────▼──────────┐
                    │ Load balancer /    │
                    │ App Runner / ECS   │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Node.js API        │
                    │ Express + Zod      │
                    └─────────┬──────────┘
                              │ TLS / pooled connections
                    ┌─────────▼──────────┐
                    │ Supabase Postgres  │
                    └────────────────────┘
```

## Production decisions

| Concern | Decision | Rationale |
|---|---|---|
| Frontend hosting | S3 + CloudFront, or Netlify | Cheap, globally cached static hosting |
| API hosting | AWS App Runner or ECS Fargate | Managed containers, HTTPS, autoscaling |
| Database | Supabase Postgres | Managed Postgres with backups and dashboard |
| Configuration | Environment variables | No secrets in source control |
| Validation | Zod at the API boundary | Reject malformed input early |
| SQL | Parameterized queries | Prevents SQL injection |
| Security | Helmet, CORS allowlist, rate limiting | Reduces common web attack surface |
| Observability | Pino JSON logs, `/health` | Supports CloudWatch and deployment checks |
| Container | Multi-stage Node 20 Alpine image | Small, reproducible deployment artifact |
| CI | GitHub Actions | Tests backend and builds frontend before merge |

## Request flow

1. Browser loads the React bundle from CDN.
2. Browser calls `/api/*` on the API domain.
3. API validates the request with Zod.
4. API executes a parameterized Postgres query through a connection pool.
5. API returns a consistent JSON response.
6. Errors are logged centrally; clients receive safe, non-leaking messages.

## Security controls

- HTTPS everywhere.
- Security headers via Helmet.
- CORS restricted to known frontend origins.
- JSON body size limit.
- API rate limiting.
- Parameterized SQL only.
- Database constraints for required fields, enums, ratings, and relationships.
- Secrets supplied at runtime; `.env` is never committed.
- Non-root Docker user.
- No `service_role` Supabase key in frontend code.

## Observability

- `GET /health` verifies process and database connectivity.
- Structured JSON logs include request method, path, status, and duration.
- In AWS, container logs stream to CloudWatch Logs.
- Add CloudWatch alarms for 5xx rate, latency, and unhealthy target count.

## Scaling

- The API is stateless; scale horizontally behind a load balancer.
- Keep database state in Postgres, never on container disk.
- Use Supabase pooler/connection pooling for serverless or high-concurrency deployments.
- Add pagination before the candidate list grows large.
- Cache static frontend assets aggressively; use hashed filenames for cache busting.

## Deployment and rollback

1. CI runs backend tests and frontend build.
2. Build and push a versioned container image.
3. Deploy the new image to App Runner or ECS.
4. Run database migrations before or during deployment; keep them backward-compatible.
5. Verify `/health`, frontend smoke test, and core API flows.
6. Roll back by redeploying the previous image tag.

## Future improvements

- Authentication and role-based authorization.
- OpenAPI specification and contract tests.
- Integration tests against an isolated Postgres instance.
- Audit logging for candidate and feedback changes.
- Metrics with OpenTelemetry and distributed tracing.
