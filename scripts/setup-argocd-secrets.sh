#!/bin/bash
# Setup script for ArgoCD secrets needed for rollback workflow

echo "Setting up ArgoCD secrets for GitHub Actions rollback workflow..."

# These should be added to your GitHub repository secrets:
echo "Add these secrets to your GitHub repository:"
echo "1. ARGOCD_SERVER: Your ArgoCD server URL (e.g., argocd.example.com)"
echo "2. ARGOCD_USERNAME: Your ArgoCD username (e.g., admin)"
echo "3. ARGOCD_PASSWORD: Your ArgoCD password"

echo ""
echo "Example commands to get ArgoCD info:"
echo "kubectl get svc -n argocd argocd-server"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"

echo ""
echo "Test the rollback workflow manually:"
echo "1. Go to GitHub Actions -> Rollback Application"
echo "2. Select environment (dev/prod)"
echo "3. Leave revision empty for previous, or specify a revision number"
echo "4. Run workflow"
