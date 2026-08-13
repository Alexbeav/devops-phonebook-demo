# TODO & Future Improvements

## Done (2026-08 remediation)
- [x] Real backend test suite (node:test + supertest, DB mocked) gating CI
- [x] Real frontend test (vitest + testing-library) gating CI
- [x] Trivy scan moved ahead of image push
- [x] DB-aware readiness (`/api/ready`) + process liveness (`/api/health`) probes
- [x] Backend `/metrics` endpoint (prom-client)
- [x] Single authoritative PostgreSQL NetworkPolicy (subchart policy disabled)
- [x] Rollback workflow targets the branch each environment actually tracks
- [x] `GITHUB_TOKEN`-only workflows, third-party actions pinned to commit SHAs
- [x] Vendored PostgreSQL subchart committed; bare `helm install` works from a fresh clone
- [x] cert-manager as the single TLS path; Traefik insecure flags removed

## Future Improvements
- [ ] Live-PostgreSQL smoke test in CI (service container) alongside the mocked suite
- [ ] Non-root frontend image (nginx-unprivileged; requires port + chart changes)
- [ ] Horizontal Pod Autoscaler for the backend
- [ ] Argo Rollouts for progressive delivery
- [ ] Loki for log aggregation
- [ ] Terraform for cloud infrastructure (AWS or Azure)
- [ ] Semantic versioning for Docker images
- [ ] Grafana dashboard JSON for the app's metrics
