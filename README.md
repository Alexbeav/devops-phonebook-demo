# DevOps CI/CD + GitOps Pipeline Demo: Phone Book App

![brave_aIIBfqkOBE](https://github.com/user-attachments/assets/789c8001-dfbd-4497-877b-3b3e5ab950e3)


This project demonstrates a modern, production-style DevOps workflow for a full-stack Phone Book app:

- **Frontend:** React (Vite)
- **Backend:** Node.js (Express) with PostgreSQL
- **Database:** PostgreSQL (Bitnami Helm subchart, persistent)
- **CI/CD:** GitHub Actions → Trivy scan → GHCR → Argo CD
- **GitOps Deployment:** Argo CD + Helm
- **Ingress:** Traefik with TLS via cert-manager
- **Monitoring:** Prometheus with comprehensive alerting rules
- **Security Scanning:** Trivy
- **Rollback:** One-click GitOps rollback via GitHub Actions

## 🚀 Quick Start

**See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.**

## ✨ Features Showcase

### 🔄 **GitOps Workflow**
- ✅ Multi-environment deployments (dev/prod)
- ✅ ArgoCD auto-sync with self-healing
- ✅ Automated image tag updates
- ✅ One-click rollback via GitHub Actions

### 🏗️ **CI/CD Pipeline**
- ✅ Conditional builds based on changed components
- ✅ Container security scanning with Trivy
- ✅ Multi-environment Helm value management
- ✅ Automated dependency updates

### 🛡️ **Production-Ready Operations**
- ✅ Traefik ingress controller with TLS
- ✅ Comprehensive Prometheus alerting
- ✅ Detailed runbooks for incident response
- ✅ Resource optimization and scaling

### 📊 **Monitoring & Alerting**
- ✅ Pod availability monitoring
- ✅ Resource usage alerts (CPU/Memory)
- ✅ Database connectivity monitoring
- ✅ Environment-specific alert thresholds

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


## 🔐 Managing Database Credentials with SealedSecrets

To securely manage your database credentials in Kubernetes, use Bitnami SealedSecrets. This allows you to store encrypted secrets in Git and have them automatically decrypted by the SealedSecrets controller in your cluster.

### 1. Install kubeseal (if not already installed)
```bash
curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.30.0/kubeseal-0.30.0-linux-amd64.tar.gz"
tar -xvzf kubeseal-0.30.0-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

Connect:
```bash
kubeseal --controller-name=sealed-secrets --controller-namespace=sealed-secrets
```

### 2. Create a Kubernetes Secret manifest (not applied, just used for sealing)
Example: `myapp-db-dev-secret.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-db-dev
  namespace: myapp-dev
type: Opaque
data:
  username: $(echo -n 'myappuser' | base64)
  password: $(echo -n 'myapppassword' | base64)
```

### 3. Seal the secret using kubeseal
Encode the values first (for prod):
```bash
echo -n 'prodUser01' | base64
echo -n 'prodPass456@' | base64
```
Create a JSON manifest (e.g., `tmp-prod-secret.json`):
```json
{
  "apiVersion": "v1",
  "kind": "Secret",
  "metadata": {
    "name": "myapp-db-prod",
    "namespace": "myapp-prod"
  },
  "type": "Opaque",
  "data": {
    "username": "cHJvZFVzZXIwMQ==",
    "password": "cHJvZFBhc3M0NTZA"
  }
}
```
Seal it:
```bash
kubeseal --controller-name=sealed-secrets --controller-namespace=sealed-secrets --format yaml < tmp-prod-secret.json > manifests/sealedsecret-db-prod.yaml
```
Repeat for `myapp-db-dev` in the `myapp-dev` namespace.

### 4. Apply the SealedSecret to your cluster
```bash
kubectl apply -f manifests/sealedsecret-db-dev.yaml
kubectl apply -f manifests/sealedsecret-db-prod.yaml
```

### 5. Verify the secret is unsealed
```bash
kubectl get secret myapp-db-dev -n myapp-dev -o yaml
kubectl get secret myapp-db-prod -n myapp-prod -o yaml
```

### 6. Sync your ArgoCD application
```bash
argocd app sync phonebook-dev-app
argocd app sync phonebook-prod-app
```

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

## 📝 PostgreSQL Schema
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT
);
```

## 🚨 Alert Rules

This project includes comprehensive monitoring with Prometheus alert rules:

### Critical Alerts
- **Pod Down**: Application pods unavailable for >2 minutes (prod) or >3 minutes (dev)
- **Database Connection**: PostgreSQL connectivity issues

### Warning Alerts  
- **High Memory Usage**: Memory usage >80% for >5 minutes
- **High CPU Usage**: CPU usage >80% for >5 minutes
- **Frequent Restarts**: Pods restarting repeatedly

### Runbooks
Detailed troubleshooting guides available in `docs/runbooks/`:
- [Backend Pod Down](docs/runbooks/backend-down.md)
- [Frontend Pod Down](docs/runbooks/frontend-down.md)
- [High Memory Usage](docs/runbooks/high-memory.md)
- [High CPU Usage](docs/runbooks/high-cpu.md)
- [Pod Restarts](docs/runbooks/pod-restarts.md)
- [Database Connection](docs/runbooks/database-connection.md)

## 🎮 Manual Operations

### GitOps Rollback
Use GitHub Actions "GitOps Rollback Application" workflow:
1. Select environment (dev/prod)
2. Specify backend and frontend image tags
3. Execute rollback - ArgoCD syncs automatically

### Update Image Tags
Use GitHub Actions "Update Helm Image Tags" workflow:
- Automatically fetches latest tags from GHCR
- Updates both dev and prod environments
- Runs daily at 6 AM UTC or manually triggered

## ✅ What This Demonstrates

### DevOps Best Practices
- **GitOps**: All deployments via Git commits
- **Infrastructure as Code**: Helm charts and K8s manifests
- **Immutable Infrastructure**: Container-based deployments
- **Automated Testing**: CI pipeline with security scanning

### Production Readiness
- **Multi-environment**: Separate dev/prod with different configurations  
- **Monitoring**: Comprehensive alerting and runbooks
- **Security**: Container scanning and secret management
- **Reliability**: Auto-healing, scaling, and rollback capabilities

### Enterprise Features
- **Observability**: Prometheus metrics and alerts
- **Incident Response**: Detailed runbooks and escalation procedures
- **Change Management**: Controlled deployments via GitOps
- **Compliance**: Audit trails through Git history
