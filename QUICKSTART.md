# 🚀 DevOps CI/CD Kubernetes Pipeline Demo - Quick Start

This project demonstrates a complete GitOps CI/CD pipeline with GitHub Actions, ArgoCD, and Kubernetes.

## 📋 Prerequisites

- Kubernetes cluster (local or cloud)
- `kubectl` configured
- `helm` CLI installed
- GitHub account with GHCR access


## 🔐 Database Credentials (Production)

Production uses [Bitnami SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) for secure credential management. The encrypted secret is committed to Git and decrypted in-cluster automatically.

Quick version (see [README.md](README.md#-managing-database-credentials-with-sealedsecrets) for full details):

```bash
# 1. Install the controller
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace sealed-secrets --create-namespace

# 2. Install kubeseal CLI
curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.30.0/kubeseal-0.30.0-linux-amd64.tar.gz"
tar -xvzf kubeseal-0.30.0-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

# 3. Create a plaintext secret (DO NOT commit this file)
cat > tmp-prod-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: myapp-db-credentials
  namespace: myapp-prod
type: Opaque
stringData:
  postgres-password: "<your-postgres-superuser-password>"
  password: "<your-app-user-password>"
EOF

# 4. Seal it (encrypts with your cluster's public key)
kubeseal --controller-name=sealed-secrets --controller-namespace=sealed-secrets \
  --format yaml < tmp-prod-secret.yaml > manifests/sealedsecret-db-prod.yaml
rm tmp-prod-secret.yaml

# 5. Commit the encrypted file and apply before first ArgoCD sync
git add manifests/sealedsecret-db-prod.yaml && git commit -m "Add sealed DB credentials"
kubectl create namespace myapp-prod --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f manifests/sealedsecret-db-prod.yaml
```

> **Dev environment** uses an inline password in `values-dev.yaml` — no SealedSecret needed.

---
## 🏗️ Setup (5 minutes)

### 1. Fork & Clone
```bash
git clone https://github.com/Alexbeav/devops-phonebook-demo.git
cd devops-phonebook-demo
```

### 2. Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 3. Deploy Applications
```bash
# The dev ArgoCD app tracks the dev branch - create it once if missing
git branch dev && git push origin dev

# Apply the ArgoCD applications (Traefik + the two app environments)
kubectl apply -f manifests/argocd-apps.yaml -f manifests/traefik.yaml

# Alert rules need the kube-prometheus-stack CRDs first (see step 5)
kubectl apply -f manifests/prometheus-alerts.yaml

# Access ArgoCD UI (port-forward)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### 4. GitHub Actions Setup

No secrets to create — the workflows run on `GITHUB_TOKEN` alone. Two one-time
repository settings:

1. **Settings → Actions → General → Workflow permissions**: enable
   *"Allow GitHub Actions to create and approve pull requests"* (the pipeline
   opens a PR to roll prod image tags; without this the step fails).
2. **Package visibility** (once, after the first successful push to GHCR):
   on each package page (`backend`, `frontend`) → *Package settings* →
   *Change visibility* → Public, so the cluster can pull without a pull secret.
   This is an owner-level action that `GITHUB_TOKEN` cannot perform, which is
   why CI doesn't attempt it.

### 5. Monitoring Stack (kube-prometheus-stack)
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --version 88.3.0 --namespace monitoring --create-namespace
```
Release name `prometheus` and namespace `monitoring` are load-bearing: the
chart's ServiceMonitors carry a `release: prometheus` label and the PostgreSQL
NetworkPolicy admits scrapes only from Prometheus pods in `monitoring`.

### 6. TLS (cert-manager)
Install [cert-manager](https://cert-manager.io/docs/installation/) and create a
`ClusterIssuer` named `letsencrypt-prod`; the chart's Ingress references it.

## 🎯 Features Demonstrated

- ✅ **Multi-environment GitOps** (dev/prod)
- ✅ **Automated image builds** with SHA tagging
- ✅ **Trivy scan gate before push**
- ✅ **Real test gates** (node:test + supertest, vitest)
- ✅ **Helm chart templating** (bare install works from a fresh clone)
- ✅ **ArgoCD auto-sync**
- ✅ **PostgreSQL with persistence + NetworkPolicy**
- ✅ **Traefik ingress with TLS via cert-manager**
- ✅ **One-click rollbacks**
- ✅ **Prometheus alerting via kube-prometheus-stack**

## 🔄 Testing the Pipeline

1. **Make a code change** in `apps/backend/` or `apps/frontend/`
2. **Push to `dev`** — CI tests, builds, scans, pushes, and commits the new
   image SHA to `values-dev.yaml`; ArgoCD syncs the dev app
3. **Push (or merge) to `main`** — same, but the prod values bump arrives as a
   PR (`ci/tag-update`); merging it rolls prod
4. **Verify deployment** in Kubernetes

## 🎮 Manual Operations

### Rollback Application
- Go to **Actions** → **GitOps Rollback Application**
- Select environment and image tags (short commit SHAs)
- The workflow validates the tags exist in GHCR and commits to the branch that
  environment's ArgoCD app tracks (`dev` → dev branch, `prod` → main)

## 📊 Monitoring

- **ArgoCD UI**: `http://localhost:8080` (admin/[generated-password])
- **Application**: `kubectl get pods -n myapp-dev`
- **Logs**: `kubectl logs -f deployment/myapp-backend -n myapp-dev`
- **Alerts**: Check Prometheus rules in `manifests/prometheus-alerts.yaml`

## 🏢 Enterprise Features

This demo showcases production-ready patterns:
- GitOps workflow with ArgoCD
- Multi-environment promotion
- Security scanning integration
- Infrastructure as Code
- Observability with Prometheus
- Automated rollback capabilities
- Comprehensive alerting rules

## 🚨 Alert Rules

Per-environment `PrometheusRule` resources (see `manifests/prometheus-alerts.yaml`),
all namespace-scoped with `absent()` companions so missing series still fire:

### Prod
- **MyAppProdBackendDown / MyAppProdFrontendDown** (critical): no available replicas >1m
- **MyAppProdDatabaseDown** (critical): postgres exporter down or absent
- **MyAppProdBackendScrapeDown**, **HighMemory/HighCPU**, **PodRestartingFrequently** (warning)

### Dev
- Availability + restart alerts only, with more tolerant timing (dev doesn't
  enable scraping)

## 🛠️ Troubleshooting

### Common Issues
1. **Prod tag-update PR fails**: enable "Allow GitHub Actions to create and approve pull requests" (Settings → Actions → General)
2. **Cluster can't pull images**: make the GHCR packages public (one-time, see GitHub Actions Setup)
3. **ArgoCD not syncing**: Verify applications are deployed with `kubectl get applications -n argocd`
4. **Ingress not working**: Ensure Traefik is deployed and LoadBalancer has external IP
5. **No metrics/alerts**: confirm kube-prometheus-stack is installed as release `prometheus` in namespace `monitoring`
6. **Database connection issues**: Check PostgreSQL pod logs and service connectivity

### Debugging Commands
```bash
# Check application status
kubectl get pods -n myapp-dev
kubectl get pods -n myapp-prod

# View logs
kubectl logs -f deployment/myapp-backend -n myapp-dev
kubectl logs -f deployment/myapp-frontend -n myapp-dev

# Check ArgoCD applications
kubectl get applications -n argocd
kubectl describe application myapp-dev-app -n argocd

# View ingress status
kubectl get ingress -n myapp-dev
kubectl get svc -n traefik-system
```

## 📈 Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Developer     │───▶│  GitHub      │───▶│  GitHub Actions │
│   Push Code     │    │  Repository  │    │  CI Pipeline    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                     │
                                                     ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   ArgoCD        │◀───│  Helm Charts │◀───│  Container      │
│   GitOps        │    │  Updated     │    │  Registry GHCR  │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Kubernetes    │───▶│  Monitoring  │───▶│  Alerting       │
│   Deployment    │    │  Prometheus  │    │  Rules          │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

This architecture demonstrates modern DevOps practices with complete automation, monitoring, and reliability features suitable for production environments.
