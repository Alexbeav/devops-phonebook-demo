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

## Done (2026-08 supply-chain/evidence upgrade)
- [x] Per-build CycloneDX SBOMs (artifact + OCI attestation)
- [x] Signed SLSA build provenance via actions/attest (push-to-registry)
- [x] Kyverno policy gate with negative-fixture self-tests and no-match safeguard
- [x] CodeQL (main/dev/PR/weekly), checksum-verified gitleaks full-history scan, Dependabot (npm/actions/docker/helm)
- [x] npm audit gate on production dependencies
- [x] Dependabot vulnerability alerts + automated security fixes enabled at repo level

## Future Improvements
- [ ] Main-branch ruleset: require `policy-gate` + `build-and-scan` status checks (upgrades the policy gate from blocking CI validation to true pre-merge enforcement; makes main PR-only)
- [ ] Homelab wiring: Kyverno `verifyImages` at admission against these GitHub attestations — end-to-end supply chain (build provenance → admission verification)
- [ ] Live rollback drill: execute the rollback workflow against a real environment, verify, and record the result (upgrades the README evidence row from capability to tested)
- [ ] Release-tagged durable evidence bundles (SBOM + scan report + attestation bundle attached to GitHub Releases — outlives the 90-day artifact retention)
- [ ] Live-PostgreSQL smoke test in CI (service container) alongside the mocked suite
- [ ] Non-root frontend image (nginx-unprivileged; requires port + chart changes)
- [ ] Horizontal Pod Autoscaler for the backend
- [ ] Argo Rollouts for progressive delivery
- [ ] Loki for log aggregation
- [ ] Terraform for cloud infrastructure (AWS or Azure)
- [ ] Semantic versioning for Docker images
- [ ] Grafana dashboard JSON for the app's metrics
