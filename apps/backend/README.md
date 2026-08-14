# Backend Service

Node.js/Express REST API for the phonebook demo.

## Endpoints
- `GET/POST /api/contacts`, `GET/PUT/DELETE /api/contacts/:id` — CRUD (PostgreSQL)
- `GET /api/health` — liveness (process-only)
- `GET /api/ready` — readiness (runs `SELECT 1` against the database)
- `GET /metrics` — Prometheus metrics (prom-client default metrics)

## Development
```sh
npm ci
npm test          # node:test + supertest, DB mocked
npm run migrate   # creates the contacts table (needs a running PostgreSQL)
npm start
```

The app is built as a factory (`createApp(pool)` in `app.js`) so tests inject a
fake pool; `index.js` is the runtime entrypoint that wires the real pg pool
from environment variables (see `.env.example`).

## Image provenance

Every pushed image carries signed SLSA provenance and an SBOM attestation:

```sh
gh attestation verify oci://ghcr.io/alexbeav/devops-phonebook-demo/backend:<tag> --owner Alexbeav
```
