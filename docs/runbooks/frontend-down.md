# Frontend Pod Down Runbook

## Alert: MyAppFrontendDown

### Description
The frontend pod is not responding or is unavailable.

### Immediate Actions

1. **Check pod status**:
   ```bash
   kubectl get pods -n myapp-dev -l app=myapp-frontend
   kubectl get pods -n myapp-prod -l app=myapp-frontend
   ```

2. **Check pod logs**:
   ```bash
   kubectl logs -f deployment/myapp-frontend -n <namespace>
   kubectl logs --previous deployment/myapp-frontend -n <namespace>
   ```

3. **Check ingress and service**:
   ```bash
   kubectl get svc myapp-frontend -n <namespace>
   kubectl get ingress -n <namespace>
   ```

### Common Causes & Solutions

#### Nginx Configuration Issues
- **Symptoms**: Pod starts but health checks fail
- **Solution**: 
  ```bash
  # Check nginx config
  kubectl exec -it deployment/myapp-frontend -n <namespace> -- cat /etc/nginx/conf.d/default.conf
  
  # Test nginx config
  kubectl exec -it deployment/myapp-frontend -n <namespace> -- nginx -t
  ```

#### Static Assets Missing
- **Symptoms**: 404 errors for static files
- **Solution**:
  ```bash
  # Check if build artifacts exist
  kubectl exec -it deployment/myapp-frontend -n <namespace> -- ls -la /usr/share/nginx/html/
  
  # Rebuild frontend if needed
  # Trigger CI/CD pipeline by pushing to repository
  ```

#### Backend Connection Issues
- **Symptoms**: API calls failing from frontend
- **Solution**:
  ```bash
  # Test backend connectivity from frontend pod
  kubectl exec -it deployment/myapp-frontend -n <namespace> -- wget -q --spider http://myapp-backend:5000/api/health
  
  # Check if backend service is running
  kubectl get svc myapp-backend -n <namespace>
  ```

### Recovery Steps

1. **Restart deployment**:
   ```bash
   kubectl rollout restart deployment/myapp-frontend -n <namespace>
   ```

2. **Scale and verify**:
   ```bash
   kubectl scale deployment myapp-frontend --replicas=0 -n <namespace>
   kubectl scale deployment myapp-frontend --replicas=1 -n <namespace>
   kubectl get pods -w -n <namespace>
   ```

3. **Test frontend accessibility**:
   ```bash
   # Port forward to test locally
   kubectl port-forward deployment/myapp-frontend 8080:80 -n <namespace>
   # Test: curl http://localhost:8080
   ```

### Ingress Troubleshooting

1. **Check Traefik ingress controller**:
   ```bash
   kubectl get pods -n traefik-system
   kubectl logs -f deployment/traefik -n traefik-system
   ```

2. **Verify ingress configuration**:
   ```bash
   kubectl describe ingress myapp-ingress -n <namespace>
   ```

3. **Test ingress routing**:
   ```bash
   # Get ingress IP
   kubectl get svc -n traefik-system
   
   # Test with curl
   curl -H "Host: myapp-dev.example.com" http://<ingress-ip>/
   ```

### Escalation

If frontend remains unavailable:
1. Check if issue affects all environments
2. Verify Traefik/ingress controller health
3. Consider rollback using GitHub Actions workflow
4. Contact platform team with ingress logs and configuration
