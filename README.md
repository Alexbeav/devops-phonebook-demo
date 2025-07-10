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

## Kubernetes/Helm Deployment Notes
- The frontend service is exposed as a `LoadBalancer` for easy access in dev/test clusters.
- **For production, use an Ingress controller and expose the frontend via Ingress instead of LoadBalancer.**
- Both backend and frontend have resource requests/limits and health checks configured by default.

## Quick Start
1. Build and test locally
2. Push to `main` to trigger CI/CD
3. Argo CD syncs Helm chart to cluster
4. Monitor with Prometheus & Grafana
5. Security scans run in CI

## Monitoring

If you have Prometheus Operator installed, you can enable ServiceMonitor creation by setting:
```sh
helm install myapp . --set monitoring.enabled=true
```
