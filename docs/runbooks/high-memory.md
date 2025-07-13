# High Memory Usage Runbook

## Alert: MyAppHighMemoryUsage

### Description
Application pods are using more than 80% of their memory limit for over 5 minutes.

### Immediate Actions

1. **Check current memory usage**:
   ```bash
   kubectl top pods -n <namespace> --containers
   kubectl describe pod <pod-name> -n <namespace>
   ```

2. **Check memory limits**:
   ```bash
   kubectl get pods <pod-name> -n <namespace> -o jsonpath='{.spec.containers[*].resources}'
   ```

### Investigation Steps

1. **Analyze memory patterns**:
   ```bash
   # Check if memory usage is growing
   kubectl top pods -n <namespace> --sort-by=memory
   
   # Monitor for memory leaks
   watch -n 5 'kubectl top pods -n <namespace>'
   ```

2. **Check application logs for memory-related errors**:
   ```bash
   kubectl logs deployment/myapp-backend -n <namespace> | grep -i "memory\|oom\|killed"
   ```

### Common Causes & Solutions

#### Memory Leak
- **Symptoms**: Continuously increasing memory usage
- **Solution**: 
  ```bash
  # Restart pod to clear memory
  kubectl delete pod <pod-name> -n <namespace>
  
  # Consider increasing memory limits temporarily
  kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
  ```

#### High Load
- **Symptoms**: Memory spikes correlate with traffic
- **Solution**:
  ```bash
  # Scale horizontally
  kubectl scale deployment myapp-backend --replicas=3 -n <namespace>
  ```

#### Inefficient Queries
- **Symptoms**: Database-related memory growth
- **Solution**: Review application logs for slow queries and optimize

### Recovery Actions

1. **Immediate relief** (if pod is at risk):
   ```bash
   kubectl delete pod <pod-name> -n <namespace>
   ```

2. **Scale out**:
   ```bash
   kubectl scale deployment myapp-backend --replicas=2 -n <namespace>
   ```

3. **Increase memory limits** (temporary):
   ```bash
   kubectl patch deployment myapp-backend -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"512Mi"}}}]}}}}'
   ```

### Long-term Solutions

1. **Profile application** for memory usage optimization
2. **Review memory requests/limits** in Helm values
3. **Implement memory monitoring** in application code
4. **Consider horizontal pod autoscaling** based on memory metrics

### Prevention

- Set appropriate memory requests and limits
- Implement application-level memory monitoring
- Regular load testing to identify memory patterns
- Code reviews focusing on memory efficiency
