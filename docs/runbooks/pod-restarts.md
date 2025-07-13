# Pod Restarts Runbook

## Alert: MyAppPodRestartingFrequently

### Description
Application pods are restarting frequently, indicating potential stability issues.

### Immediate Actions

1. **Check restart count and reasons**:
   ```bash
   kubectl get pods -n <namespace> -o wide
   kubectl describe pod <pod-name> -n <namespace>
   ```

2. **Check recent events**:
   ```bash
   kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
   ```

3. **Examine pod logs** (current and previous):
   ```bash
   kubectl logs <pod-name> -n <namespace>
   kubectl logs <pod-name> -n <namespace> --previous
   ```

### Common Restart Causes

#### OOMKilled (Out of Memory)
- **Symptoms**: `Reason: OOMKilled` in pod events
- **Solution**:
  ```bash
  # Check memory usage trends
  kubectl top pods -n <namespace> --sort-by=memory
  
  # Increase memory limits temporarily
  kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
  ```

#### Failed Health Checks
- **Symptoms**: `Liveness probe failed` or `Readiness probe failed`
- **Solution**:
  ```bash
  # Test health endpoint manually
  kubectl exec -it <pod-name> -n <namespace> -- wget -q --spider http://localhost:5000/api/health
  
  # Adjust probe timings if needed
  kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","livenessProbe":{"initialDelaySeconds":60}}]}}}}'
  ```

#### Application Crashes
- **Symptoms**: Exit codes in logs, exception stack traces
- **Solution**:
  ```bash
  # Look for error patterns in logs
  kubectl logs deployment/myapp-backend -n <namespace> | grep -i "error\|exception\|fatal"
  
  # Consider rollback to stable version
  # Use GitOps Rollback workflow
  ```

#### Resource Constraints
- **Symptoms**: `Reason: Evicted` due to resource pressure
- **Solution**:
  ```bash
  # Check node resources
  kubectl describe nodes | grep -A 10 "Allocated resources"
  
  # Scale to less constrained nodes
  kubectl scale deployment myapp-backend --replicas=0 -n <namespace>
  kubectl scale deployment myapp-backend --replicas=1 -n <namespace>
  ```

### Investigation Steps

1. **Analyze restart patterns**:
   ```bash
   # Check restart frequency
   kubectl get pods -n <namespace> --sort-by=.status.containerStatuses[0].restartCount
   
   # Look for patterns in timing
   kubectl get events -n <namespace> --field-selector reason=Killing
   ```

2. **Resource analysis**:
   ```bash
   # Current resource usage
   kubectl top pods -n <namespace>
   
   # Resource requests vs limits
   kubectl describe deployment myapp-backend -n <namespace> | grep -A 10 "Limits\|Requests"
   ```

### Recovery Actions

1. **Stabilize with increased resources**:
   ```bash
   kubectl patch deployment myapp-backend -n <namespace> -p '{
     "spec": {
       "template": {
         "spec": {
           "containers": [{
             "name": "backend",
             "resources": {
               "requests": {"memory": "128Mi", "cpu": "100m"},
               "limits": {"memory": "512Mi", "cpu": "500m"}
             }
           }]
         }
       }
     }
   }'
   ```

2. **Adjust health check parameters**:
   ```bash
   kubectl patch deployment myapp-backend -n <namespace> -p '{
     "spec": {
       "template": {
         "spec": {
           "containers": [{
             "name": "backend",
             "livenessProbe": {
               "initialDelaySeconds": 60,
               "periodSeconds": 30,
               "timeoutSeconds": 10,
               "failureThreshold": 5
             }
           }]
         }
       }
     }
   }'
   ```

3. **Scale down and up** to get fresh pods:
   ```bash
   kubectl scale deployment myapp-backend --replicas=0 -n <namespace>
   sleep 30
   kubectl scale deployment myapp-backend --replicas=1 -n <namespace>
   ```

### Monitoring Commands

```bash
# Watch for new restarts
watch -n 10 'kubectl get pods -n <namespace> --sort-by=.status.containerStatuses[0].restartCount'

# Monitor resource usage
watch -n 5 'kubectl top pods -n <namespace>'

# Check for new events
watch -n 15 'kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp | tail -10'
```

### Prevention

1. **Set appropriate resource requests and limits**
2. **Implement proper health check endpoints**
3. **Use graceful shutdown handling in application**
4. **Regular load testing** to identify resource requirements
5. **Implement circuit breakers** for external dependencies

### Long-term Solutions

- Review and optimize resource allocations in Helm charts
- Implement application-level monitoring and alerting
- Consider implementing Horizontal Pod Autoscaler
- Regular application profiling and optimization
