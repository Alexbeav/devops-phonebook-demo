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
# Apply ArgoCD applications
kubectl apply -f manifests/

# Access ArgoCD UI (port-forward)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### 4. GitHub Actions Setup
```bash
# Generate GitHub Personal Access Token with packages:write scope
# Add to repository secrets as GHCR_PAT
```

## 🎯 Features Demonstrated

- ✅ **Multi-environment GitOps** (dev/prod)
- ✅ **Automated image builds** with SHA tagging
- ✅ **Container security scanning** with Trivy
- ✅ **Helm chart templating**
- ✅ **ArgoCD auto-sync**
- ✅ **PostgreSQL with persistence**
- ✅ **Traefik ingress with TLS**
- ✅ **One-click rollbacks**
- ✅ **Prometheus monitoring & alerting**

## 🔄 Testing the Pipeline

1. **Make a code change** in `apps/backend/` or `apps/frontend/`
2. **Push to main** - GitHub Actions will build and tag new images
3. **ArgoCD syncs automatically** within ~3 minutes
4. **Verify deployment** in Kubernetes

## 🎮 Manual Operations

### Rollback Application
- Go to **Actions** → **GitOps Rollback Application**
- Select environment and image tags
- Execute rollback

### Update Image Tags
- Go to **Actions** → **Update Helm Image Tags**
- Run workflow to sync latest GHCR tags

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

The project includes comprehensive Prometheus alert rules:

### Critical Alerts
- **MyAppPodDown**: Pod unavailable for >2 minutes
- **MyAppDatabaseConnectionFails**: Database connection issues

### Warning Alerts  
- **MyAppHighMemoryUsage**: Memory usage >80% for >5 minutes
- **MyAppHighCPUUsage**: CPU usage >80% for >5 minutes
- **MyAppPodRestartingFrequently**: Frequent pod restarts

### Environment-Specific Alerts
- **Dev**: More tolerant thresholds (3-minute delays)
- **Prod**: Strict thresholds (1-minute delays for critical alerts)

## 🛠️ Troubleshooting

### Common Issues
1. **Images not building**: Check GHCR_PAT secret is set
2. **ArgoCD not syncing**: Verify applications are deployed with `kubectl get applications -n argocd`
3. **Ingress not working**: Ensure Traefik is deployed and LoadBalancer has external IP
4. **Database connection issues**: Check PostgreSQL pod logs and service connectivity

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
