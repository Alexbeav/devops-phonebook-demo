# High CPU Usage Runbook

## Alert: MyAppHighCPUUsage

### Description
Application pods are using more than 80% of their CPU limit for over 5 minutes.

### Immediate Actions

1. **Check current CPU usage**:
   ```bash
   kubectl top pods -n <namespace> --containers
   kubectl top nodes
   ```

2. **Check CPU limits and requests**:
   ```bash
   kubectl describe pod <pod-name> -n <namespace> | grep -A 5 -B 5 "cpu"
   ```

### Investigation Steps

1. **Monitor CPU patterns**:
   ```bash
   # Watch CPU usage over time
   watch -n 2 'kubectl top pods -n <namespace> --sort-by=cpu'
   
   # Check node CPU pressure
   kubectl describe nodes | grep -A 5 "Conditions"
   ```

2. **Analyze application behavior**:
   ```bash
   # Check for CPU-intensive processes
   kubectl exec -it <pod-name> -n <namespace> -- top
   
   # Look for infinite loops or blocking operations in logs
   kubectl logs <pod-name> -n <namespace> --tail=100
   ```

### Common Causes & Solutions

#### High Traffic Load
- **Symptoms**: CPU spikes correlate with increased requests
- **Solution**:
  ```bash
  # Scale horizontally immediately
  kubectl scale deployment myapp-backend --replicas=3 -n <namespace>
  
  # Monitor load distribution
  kubectl get pods -n <namespace> -w
  ```

#### Inefficient Code/Queries
- **Symptoms**: Sustained high CPU regardless of load
- **Solution**:
  ```bash
  # Check database connection pooling
  kubectl logs deployment/myapp-backend -n <namespace> | grep -i "connection\|pool\|query"
  
  # Consider rollback to previous version
  # Use GitOps Rollback workflow with known good image tags
  ```

#### Resource Constraints
- **Symptoms**: CPU throttling, slow response times
- **Solution**:
  ```bash
  # Temporarily increase CPU limits
  kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"cpu":"500m"}}}]}}}}'
  ```

### Recovery Actions

1. **Immediate scaling**:
   ```bash
   # Scale out to distribute load
   kubectl scale deployment myapp-backend --replicas=2 -n <namespace>
   ```

2. **Increase CPU limits** (temporary):
   ```bash
   kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"cpu":"400m"}}}]}}}}'
   ```

3. **Restart high-CPU pods**:
   ```bash
   # Find highest CPU pod
   kubectl top pods -n <namespace> --sort-by=cpu
   
   # Restart specific pod
   kubectl delete pod <high-cpu-pod> -n <namespace>
   ```

### Performance Optimization

1. **Enable CPU profiling** in application
2. **Review database queries** for efficiency
3. **Implement caching** where appropriate
4. **Consider async processing** for CPU-intensive tasks

### Long-term Solutions

1. **Horizontal Pod Autoscaler**:
   ```bash
   kubectl autoscale deployment myapp-backend --cpu-percent=70 --min=1 --max=5 -n <namespace>
   ```

2. **Optimize resource requests/limits** in Helm values
3. **Implement application performance monitoring**
4. **Load testing** to identify optimal scaling parameters

### Monitoring Commands

```bash
# Continuous monitoring
watch -n 5 'kubectl top pods -n <namespace> && echo "---" && kubectl top nodes'

# Check HPA status (if configured)
kubectl get hpa -n <namespace>

# View detailed metrics
kubectl describe hpa myapp-backend -n <namespace>
```
