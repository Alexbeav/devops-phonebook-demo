# Backend Pod Down Runbook

## Alert: MyAppPodDown / MyAppBackendDown

### Description
The backend pod is not responding or is unavailable.

### Immediate Actions

1. **Check pod status**:
   ```bash
   kubectl get pods -n myapp-dev -l app=myapp-backend
   kubectl get pods -n myapp-prod -l app=myapp-backend
   ```

2. **Check pod logs**:
   ```bash
   kubectl logs -f deployment/myapp-backend -n <namespace>
   kubectl logs --previous deployment/myapp-backend -n <namespace>
   ```

3. **Check pod events**:
   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   ```

### Common Causes & Solutions

#### Image Pull Issues
- **Symptoms**: `ImagePullBackOff` or `ErrImagePull`
- **Solution**: 
  ```bash
  # Check if image exists in GHCR
  docker pull ghcr.io/alexbeav/devops-ci-cd-k8s-pipeline-demo/backend:<tag>
  
  # Update image tag if needed
  kubectl set image deployment/myapp-backend backend=ghcr.io/alexbeav/devops-ci-cd-k8s-pipeline-demo/backend:<new-tag> -n <namespace>
  ```

#### Database Connection Issues
- **Symptoms**: Logs show database connection errors
- **Solution**:
  ```bash
  # Check PostgreSQL pod
  kubectl get pods -n <namespace> -l app.kubernetes.io/name=postgresql
  
  # Test database connectivity
  kubectl exec -it deployment/myapp-backend -n <namespace> -- sh
  # Inside pod: nc -zv myapp-postgresql 5432
  ```

#### Resource Constraints
- **Symptoms**: `OOMKilled` or `Pending` state
- **Solution**:
  ```bash
  # Check resource usage
  kubectl top pods -n <namespace>
  
  # Scale up if needed
  kubectl scale deployment myapp-backend --replicas=2 -n <namespace>
  ```

### Recovery Steps

1. **Restart deployment**:
   ```bash
   kubectl rollout restart deployment/myapp-backend -n <namespace>
   ```

2. **Scale deployment**:
   ```bash
   kubectl scale deployment myapp-backend --replicas=0 -n <namespace>
   kubectl scale deployment myapp-backend --replicas=1 -n <namespace>
   ```

3. **Rollback if needed**:
   - Use GitHub Actions "GitOps Rollback Application" workflow
   - Select known good image tags

### Escalation

If issue persists after following this runbook:
1. Check cluster node health: `kubectl get nodes`
2. Check cluster events: `kubectl get events --sort-by=.metadata.creationTimestamp`
3. Contact platform team with gathered logs and symptoms
