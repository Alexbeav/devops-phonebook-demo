# DevOps CI/CD + GitOps Pipeline Demo: Phone Book App

**🌐 Live demo: [phonebook.crosstalkis.com](https://phonebook.crosstalkis.com)** — this
exact repo, GitOps-deployed by ArgoCD to a self-hosted Kubernetes cluster, served
through Cloudflare + Traefik (CrowdSec, rate limiting, security headers). It's an
open demo: add and delete contacts freely — **data resets nightly, don't enter real
information**. Image provenance is publicly verifiable:
`gh attestation verify oci://ghcr.io/alexbeav/devops-phonebook-demo/backend:<tag> --owner Alexbeav`

![brave_aIIBfqkOBE](https://github.com/user-attachments/assets/789c8001-dfbd-4497-877b-3b3e5ab950e3)


This project demonstrates a modern, production-style DevOps workflow for a full-stack Phone Book app:

- **Frontend:** React (Vite)
- **Backend:** Node.js (Express) with PostgreSQL
- **Database:** PostgreSQL (Bitnami Helm subchart, persistent)
- **CI/CD:** GitHub Actions → Trivy scan → GHCR → Argo CD
- **GitOps Deployment:** Argo CD + Helm
- **Ingress:** Traefik with TLS via cert-manager
- **Monitoring:** Prometheus alert rules, discovered by kube-prometheus-stack
- **Security Scanning:** Trivy (gates images before they are pushed)
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
- ✅ Trivy scan gates every image *before* it is pushed
- ✅ Real test gates (backend: node:test + supertest; frontend: vitest)
- ✅ Pull requests build, test and scan — but never publish
- ✅ `GITHUB_TOKEN` only (no PAT), third-party actions pinned to commit SHAs

### 🛡️ **Production-Ready Operations**
- ✅ Traefik ingress controller with TLS (cert-manager)
- ✅ DB-aware readiness + process liveness probes
- ✅ Single authoritative NetworkPolicy around PostgreSQL
- ✅ Detailed runbooks for incident response
- ✅ Resource requests/limits on every workload

### 📊 **Monitoring & Alerting**
- ✅ Pod availability alerts via kube-state-metrics (absent-proof expressions)
- ✅ Backend `/metrics` (prom-client) + postgres exporter scraping in prod
- ✅ Resource usage alerts (CPU/Memory)
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
npm ci
npm test              # node:test + supertest (DB mocked)
npm run migrate       # Creates contacts table
npm start             # Starts API on :5000
```

### 3. Frontend (React)
```sh
cd apps/frontend
npm ci
npm test              # vitest + testing-library
npm run dev           # Starts Vite dev server (proxies /api to :5000)
```

- The frontend calls the backend at `/api`. In production nginx proxies it
  (config comes from the chart's ConfigMap); in dev the Vite proxy handles it.

---

## 🐳 Build & Push Containers

CI builds, scans and pushes images automatically on pushes to `main`/`dev`.
For a manual build:

```sh
docker build -t ghcr.io/alexbeav/devops-phonebook-demo/backend:dev ./apps/backend
docker build -t ghcr.io/alexbeav/devops-phonebook-demo/frontend:dev ./apps/frontend
```

---

## ☸️ Deploy to Kubernetes (Helm)

The PostgreSQL subchart is vendored in the repo (`charts/myapp/charts/`), so a
fresh checkout deploys without any dependency step:

1. **Deploy:**
   ```sh
   helm upgrade --install myapp charts/myapp --namespace myapp --create-namespace
   # For dev/prod:
   # helm upgrade --install myapp-dev charts/myapp -f charts/myapp/values-dev.yaml --namespace myapp-dev --create-namespace
   # helm upgrade --install myapp-prod charts/myapp -f charts/myapp/values-prod.yaml --namespace myapp-prod --create-namespace
   ```
2. **Check status:**
   ```sh
   kubectl get pods -n myapp
   kubectl get svc -n myapp
   kubectl get ingress -n myapp
   ```

---

## 🔄 GitOps with Argo CD
- See `manifests/argocd-apps.yaml` for Argo CD `AppProject` and `Application` resources.
- The **prod** app tracks `main` with `values-prod.yaml`; the **dev** app tracks the
  `dev` branch with `values-dev.yaml` — create the `dev` branch from `main` if it
  doesn't exist yet (`git branch dev && git push origin dev`).
- Argo CD watches the repo and auto-syncs changes to the cluster.

---

## 📋 Cluster Prerequisites

| Component | Why | Install |
|-----------|-----|---------|
| Traefik | Ingress | `kubectl apply -f manifests/traefik.yaml` (ArgoCD app) |
| cert-manager + `letsencrypt-prod` ClusterIssuer | TLS certificates for the Ingress/IngressRoute | [cert-manager docs](https://cert-manager.io/docs/installation/) |
| kube-prometheus-stack | Discovers the chart's ServiceMonitors and the `PrometheusRule` alerts | see below |

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --version 88.3.0 --namespace monitoring --create-namespace
kubectl apply -f manifests/prometheus-alerts.yaml
```

The release name `prometheus` and namespace `monitoring` matter: the chart's
ServiceMonitors carry a `release: prometheus` label, and the PostgreSQL
NetworkPolicy only admits scrapes from Prometheus pods in `monitoring`.

---


## 🔐 Managing Database Credentials with SealedSecrets

The production Helm values (`values-prod.yaml`) reference a Kubernetes Secret via `existingSecret: myapp-db-credentials` instead of storing passwords in Git. [Bitnami SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) lets you encrypt secrets with your cluster's public key so the encrypted form is safe to commit. The SealedSecrets controller in your cluster decrypts them automatically.

> **Dev environment:** `values-dev.yaml` keeps an inline password for convenience — the Bitnami PostgreSQL subchart auto-creates the Secret. For production, always use SealedSecrets.

### 1. Install the SealedSecrets controller

```bash
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace sealed-secrets --create-namespace
```

### 2. Install the kubeseal CLI

```bash
curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.30.0/kubeseal-0.30.0-linux-amd64.tar.gz"
tar -xvzf kubeseal-0.30.0-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

### 3. Create a plaintext Secret manifest (local only — never commit this)

The Bitnami PostgreSQL chart expects keys `postgres-password` (superuser) and `password` (application user). The backend deployment also reads `password` from this same Secret.

Create a file called `tmp-prod-secret.yaml` (do **not** commit it):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-db-credentials
  namespace: myapp-prod
type: Opaque
stringData:
  postgres-password: "<your-postgres-superuser-password>"
  password: "<your-app-user-password>"
```

### 4. Seal the Secret

```bash
kubeseal \
  --controller-name=sealed-secrets \
  --controller-namespace=sealed-secrets \
  --format yaml \
  < tmp-prod-secret.yaml \
  > manifests/sealedsecret-db-prod.yaml
```

Delete the plaintext file immediately:
```bash
rm tmp-prod-secret.yaml
```

Repeat for dev if desired (change `namespace` to `myapp-dev`).

### 5. Commit the encrypted SealedSecret to Git

The sealed file is safe to commit — it can only be decrypted by your cluster's controller.

```bash
git add manifests/sealedsecret-db-prod.yaml
git commit -m "Add sealed database credentials for production"
git push
```

### 6. Apply to the cluster (bootstrap)

Before the first ArgoCD sync, create the namespaces and apply the sealed secrets:

```bash
kubectl create namespace myapp-prod --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f manifests/sealedsecret-db-prod.yaml
```

The SealedSecrets controller will decrypt it into a regular Secret named `myapp-db-credentials` in the `myapp-prod` namespace. ArgoCD will then be able to deploy the Helm chart, which references this Secret.

### 7. Verify

```bash
# Check the SealedSecret was processed
kubectl get sealedsecret myapp-db-credentials -n myapp-prod

# Check the decrypted Secret exists with the expected keys
kubectl get secret myapp-db-credentials -n myapp-prod -o jsonpath='{.data}' | python3 -c "import sys,json; print(list(json.load(sys.stdin).keys()))"
# Should output: ['password', 'postgres-password']
```

---
## 🔒 Security & Monitoring
- Trivy scans run in CI **before** any image is pushed; a CRITICAL/HIGH finding fails the build with nothing published.
- Monitoring runs on kube-prometheus-stack (see Cluster Prerequisites); the chart ships a backend ServiceMonitor, a postgres exporter (prod), and per-environment `PrometheusRule` alerts.
- TLS via cert-manager on the standard Ingress (default) or via a `Certificate` on the optional Traefik IngressRoute.
- PostgreSQL is reachable only from backend pods (and the Prometheus scraper on the exporter port) via NetworkPolicy.
- The backend container runs as a non-root user; the frontend keeps the stock nginx image (root master process) as an accepted demo tradeoff.

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

Prometheus alert rules ship per environment in `manifests/prometheus-alerts.yaml`.
Every expression is namespace-scoped and pairs its comparison with an `absent()`
branch, so a deleted deployment or never-scraped target still fires.

### Prod (critical)
- **BackendDown / FrontendDown**: no available replicas for >1 minute (kube-state-metrics)
- **DatabaseDown**: postgres exporter reports down, or its metrics are absent

### Prod (warning)
- **BackendScrapeDown**: `/metrics` target down or never discovered
- **High Memory / High CPU**: >80% of limit for >5 minutes
- **Frequent Restarts**: >2 restarts in 15 minutes

### Dev
- Availability + restart alerts only (warning, more tolerant timing) — dev runs
  with `monitoring.enabled=false`, so scrape-based alerts are prod-only.

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
2. Specify backend and frontend image tags (short commit SHAs; validated against GHCR)
3. Execute — the workflow commits to the branch that environment's ArgoCD app
   actually tracks (`dev` → dev branch, `prod` → main) and ArgoCD syncs it

There is intentionally **no** "update to latest" cron: CI pins exact image SHAs
into the values files on every successful build, so a scheduled updater would
only introduce untracked drift.

## 🧾 Controls & Evidence

Each control names where it is enforced, what evidence it produces (with real
retention — nothing here claims to be permanent), and which regulatory theme
that evidence supports. Wording is deliberate: these controls *support
evidence for* obligations; they do not make anything "compliant" by themselves.

| Control | Enforced where | Evidence (retention) | Supports evidence for |
|---------|---------------|----------------------|----------------------|
| Vulnerability scan gates image publication | CI: Trivy runs between build and push; CRITICAL/HIGH fails the job | Workflow run logs | CRA Annex I vulnerability handling |
| Per-build SBOM (CycloneDX) | CI: generated for every build, PR and push | Workflow artifact, 90 days; SBOM attestation on the image (hosted by GitHub, owner-deletable) | CRA Annex I Part II (machine-readable SBOM) |
| Signed SLSA build provenance | CI: `actions/attest` on every pushed image, OCI-discoverable | GitHub attestations — verify with `gh attestation verify oci://ghcr.io/alexbeav/devops-phonebook-demo/backend:<tag> --owner Alexbeav` | NIS2 Art. 21 supply-chain security |
| Policy-as-code gate (incl. negative self-tests) | CI: `policy-gate` job — Kyverno validates both env renders; fixtures prove the policies block violations | Job logs + `policies/` in git history | NIS2 Art. 21 change control |
| Prod changes via pull request | CI writes prod image tags only through the `ci/tag-update` PR | PR history on `main` | NIS2 Art. 21 change control |
| Secret scanning (full history) | CI: pinned, checksum-verified gitleaks with known-positive self-test; findings suppressed only by audited fingerprint | Workflow run logs + `.gitleaksignore` justifications | NIS2 Art. 21 access control / hygiene |
| SAST | CI: CodeQL on main, dev, PRs, weekly | Repository Security tab | CRA secure-development practices |
| Dependency monitoring | Dependabot: version-update PRs (npm/actions/docker/helm) — *plus* repository-level vulnerability alerts and security updates, which are separate settings (both enabled) | Dependabot PRs and alerts | CRA Annex I vulnerability handling |
| Production-dependency audit gate | CI: `npm audit --omit=dev --audit-level=high` per app | Workflow run logs | CRA Annex I vulnerability handling |
| Supply-chain pinning | All third-party actions pinned to commit SHAs; CLI downloads checksum-verified; subchart vendored + locked | Git history / workflow files | NIS2 Art. 21 supply-chain security |
| Rollback capability | `workflow_dispatch` with SHA-validated inputs, GHCR tag verification, branch-mapped GitOps commit | Workflow definition + run history. **Capability, not yet exercised** — a live rollback drill is in TODO | NIS2 Art. 21 incident handling / recovery |
| Incident runbooks | `docs/runbooks/` linked from every alert | Git history | NIS2 Art. 21 incident handling |

Dependabot PRs are deliberately **not** build-blocking: the Trivy gate blocks
vulnerable runtime images, and the npm audit gate blocks vulnerable production
dependencies — build-time/dev-chain advisories arrive as PRs and alerts
instead of holding the pipeline red.

## ✅ What This Demonstrates

### DevOps Best Practices
- **GitOps**: All deployments via Git commits
- **Infrastructure as Code**: Helm charts and K8s manifests
- **Immutable Infrastructure**: Container-based deployments
- **Automated Testing**: CI pipeline with security scanning

### Production Readiness
- **Multi-environment**: Separate dev/prod with different configurations  
- **Monitoring**: Alerting with runbooks (kube-prometheus-stack)
- **Security**: Container scanning, secret management, network policy
- **Reliability**: Probes, ArgoCD self-healing, and one-click rollback

### Enterprise Features
- **Observability**: Prometheus metrics and alerts
- **Incident Response**: Detailed runbooks and escalation procedures
- **Change Management**: Controlled deployments via GitOps
- **Compliance**: Audit trails through Git history
