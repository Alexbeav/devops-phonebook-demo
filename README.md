# DevOps CI/CD + GitOps Pipeline Demo: Phone Book App

This project demonstrates a modern, production-style DevOps workflow for a full-stack Phone Book app:

- **Frontend:** React (Vite)
- **Backend:** Node.js (Express) with PostgreSQL
- **Database:** PostgreSQL (Bitnami Helm subchart, persistent)
- **CI/CD:** GitHub Actions → Trivy scan → GHCR → Argo CD
- **GitOps Deployment:** Argo CD + Helm
- **Monitoring:** Prometheus & Grafana
- **Security Scanning:** Trivy
- **Ingress:** NGINX + TLS via cert-manager

---

## 📁 Structure
- `apps/backend` — Node.js/Express backend (REST API, PostgreSQL)
- `apps/frontend` — React frontend
- `charts/myapp` — Helm chart for deployment (with PostgreSQL subchart)
- `manifests/` — K8s manifests (Argo CD, monitoring, etc)

---

## 🚀 Local Development & Testing

### 1. Start PostgreSQL (locally, for dev)
```sh
# Using Docker
export POSTGRES_PASSWORD=secretpassword
export POSTGRES_USER=phonebook
export POSTGRES_DB=phonebook

docker run --rm -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  -e POSTGRES_USER=$POSTGRES_USER \
  -e POSTGRES_DB=$POSTGRES_DB \
  postgres:15
```

### 2. Backend (Node.js)
```sh
cd apps/backend
cp .env.example .env  # Edit if needed
npm install
npm run migrate       # Creates contacts table
npm start             # Starts API on :5000
```

### 3. Frontend (React)
```sh
cd apps/frontend
npm install
npm run dev           # Starts Vite dev server
```

- The frontend expects the backend at `/api` (see Nginx config for production).
- For local dev, you may need to set up a Vite proxy to forward `/api` to `localhost:5000`.

---

## 🐳 Build & Push Containers

```sh
# Backend
cd apps/backend
npm run build         # If you have a build step
# Build and push image
# docker build -t ghcr.io/<your-username>/backend:latest .
# docker push ghcr.io/<your-username>/backend:latest

# Frontend
cd apps/frontend
npm run build
# docker build -t ghcr.io/<your-username>/frontend:latest .
# docker push ghcr.io/<your-username>/frontend:latest
```

---

## ☸️ Deploy to Kubernetes (Helm)

1. **Install dependencies:**
   ```sh
   helm dependency update charts/myapp
   ```
2. **Deploy:**
   ```sh
   helm upgrade --install myapp charts/myapp --namespace myapp --create-namespace
   # For dev/prod:
   # helm upgrade --install myapp charts/myapp -f charts/myapp/values-dev.yaml --namespace myapp --create-namespace
   # helm upgrade --install myapp charts/myapp -f charts/myapp/values-prod.yaml --namespace myapp --create-namespace
   ```
3. **Check status:**
   ```sh
   kubectl get pods -n myapp
   kubectl get svc -n myapp
   kubectl get ingress -n myapp
   ```

---

## 🔄 GitOps with Argo CD
- See `manifests/argocd-app.yaml` for Argo CD `AppProject` and `Application` resources.
- Argo CD will watch your GitHub repo and auto-sync changes to your cluster.

---

## 🔒 Security & Monitoring
- Trivy scans run in CI before image push.
- Prometheus & Grafana manifests included for monitoring.
- Ingress is set up for TLS via cert-manager (see `ingress.yaml`).

---

## 📝 PostgreSQL Schema
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT
);
```

---

## ✅ What This Shows
- Clean separation of tiers
- Production-ready CI/CD & GitOps
- Helm values for config/secrets
- Monitoring & security best practices

---

## Troubleshooting
- If pods fail to pull images, check imagePullSecrets or make images public.
- If frontend shows "Loading...", check Nginx proxy config and backend API connectivity.
- For DB issues, check pod logs and DB env vars.

---

## Credits
- Bitnami Helm charts
- Argo CD
- Trivy
- cert-manager
