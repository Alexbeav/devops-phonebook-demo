# TODO & Verification Checklist

## General
- [ ] Verify LICENSE file is present and correct
- [ ] Verify CONTRIBUTING.md is present and clear
- [ ] Verify README.md is up to date

## Backend
- [ ] Test /api/health endpoint returns { status: 'ok' }
- [ ] Test /api/hello endpoint returns { message: 'Hello from backend!' }
- [ ] Confirm .dockerignore is present and excludes node_modules, dist, .env, etc.

## Frontend
- [ ] Confirm .dockerignore is present and excludes node_modules, dist, .env, etc.
- [ ] Confirm public/robots.txt is present and blocks indexing
- [ ] Confirm public/health.html is present and accessible

## Helm Chart
- [ ] Confirm charts/myapp/.dockerignore is present and excludes charts/, tmp/, *.tgz, *.lock

## CI/CD
- [ ] Confirm GitHub Actions pipeline runs without privileged error
- [ ] Confirm Trivy scans run for both backend and frontend images
- [ ] Confirm build, test, and deploy steps work as expected

## Monitoring & Security
- [ ] Confirm Prometheus & Grafana manifests are present
- [ ] Confirm Trivy scan results are visible in CI logs

## Collaboration
- [ ] Confirm CONTRIBUTING.md provides guidance for new contributors

## Future Improvements
- [ ] Add automated tests for backend and frontend
- [ ] Add semantic versioning for Docker images
- [ ] Add Terraform for cloud infrastructure
- [ ] Add Argo Rollouts and Loki for advanced delivery/logging

---

## Verification Steps
- Run backend and check /api/health and /api/hello endpoints
- Run frontend and check /health.html and robots.txt
- Build Docker images and confirm .dockerignore is respected
- Run CI/CD pipeline and confirm all steps succeed
- Check Helm chart deployment and verify .dockerignore
- Review LICENSE and CONTRIBUTING.md for completeness
- Review README.md for clarity and accuracy
