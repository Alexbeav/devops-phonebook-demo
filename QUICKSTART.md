# 🚀 DevOps CI/CD Kubernetes Pipeline Demo - Quick Start

This project demonstrates a complete GitOps CI/CD pipeline with GitHub Actions, ArgoCD, and Kubernetes.

## 📋 Prerequisites

- Kubernetes cluster (local or cloud)
- `kubectl` configured
- `helm` CLI installed
- GitHub account with GHCR access


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
## 🏗️ Setup (5 minutes)

### 1. Fork & Clone
```bash
git clone https://github.com/alexbeav/devops-ci-cd-k8s-pipeline-demo.git
cd devops-ci-cd-k8s-pipeline-demo
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
