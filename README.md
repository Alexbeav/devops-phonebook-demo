# DevOps CI/CD + GitOps Pipeline Demo

This project demonstrates a modern DevOps workflow:

- **Backend:** Flask (Python)
- **Frontend:** React (Node.js)
- **CI/CD:** GitHub Actions
- **GitOps Deployment:** Argo CD + Helm
- **Monitoring:** Prometheus & Grafana
- **Security Scanning:** Trivy

## Structure
- `apps/backend` — Flask backend
- `apps/frontend` — React frontend
- `charts/myapp` — Helm chart for deployment
- `manifests/` — K8s manifests (monitoring, etc)

## Quick Start
1. Build and test locally
2. Push to `main` to trigger CI/CD
3. Argo CD syncs Helm chart to cluster
4. Monitor with Prometheus & Grafana
5. Security scans run in CI
