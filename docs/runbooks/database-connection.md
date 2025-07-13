# Database Connection Runbook

## Alert: MyAppDatabaseConnectionFails

### Description
The application cannot connect to the PostgreSQL database.

### Immediate Actions

1. **Check PostgreSQL pod status**:
   ```bash
   kubectl get pods -n <namespace> -l app.kubernetes.io/name=postgresql
   kubectl describe pod <postgresql-pod> -n <namespace>
   ```

2. **Check PostgreSQL service**:
   ```bash
   kubectl get svc myapp-postgresql -n <namespace>
   kubectl describe svc myapp-postgresql -n <namespace>
   ```

3. **Test connectivity from backend pod**:
   ```bash
   kubectl exec -it deployment/myapp-backend -n <namespace> -- sh
   # Inside pod:
   nc -zv myapp-postgresql 5432
   pg_isready -h myapp-postgresql -U myappuser -d myappdb
   ```

### Common Causes & Solutions

#### PostgreSQL Pod Not Running
- **Symptoms**: No PostgreSQL pods or pods in failed state
- **Solution**:
  ```bash
  # Check pod logs
  kubectl logs <postgresql-pod> -n <namespace>
  
  # Check persistent volume
  kubectl get pv,pvc -n <namespace>
  
  # Restart PostgreSQL deployment
  kubectl rollout restart statefulset/myapp-postgresql -n <namespace>
  ```

#### Network Policy Issues
- **Symptoms**: Connection timeouts, network unreachable
- **Solution**:
  ```bash
  # Check network policies
  kubectl get networkpolicies -n <namespace>
  
  # Test DNS resolution
  kubectl exec -it deployment/myapp-backend -n <namespace> -- nslookup myapp-postgresql
  ```

#### Authentication Issues
- **Symptoms**: Authentication failed errors in logs
- **Solution**:
  ```bash
  # Check database credentials
  kubectl get secret myapp-postgresql -n <namespace> -o yaml
  
  # Verify environment variables in backend pod
  kubectl exec -it deployment/myapp-backend -n <namespace> -- env | grep DB_
  ```

#### Database Initialization Issues
- **Symptoms**: Database exists but tables missing
- **Solution**:
  ```bash
  # Connect to database and check tables
  kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d myappdb -c "\dt"
  
  # Run migration manually if needed
  kubectl exec -it deployment/myapp-backend -n <namespace> -- npm run migrate
  ```

### Recovery Steps

1. **Restart PostgreSQL**:
   ```bash
   kubectl delete pod <postgresql-pod> -n <namespace>
   kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n <namespace> --timeout=300s
   ```

2. **Verify database connectivity**:
   ```bash
   # Test from backend pod
   kubectl exec -it deployment/myapp-backend -n <namespace> -- sh -c '
   until pg_isready -h myapp-postgresql -U myappuser -d myappdb; do
     echo "Waiting for database..."
     sleep 2
   done
   echo "Database is ready!"
   '
   ```

3. **Restart backend pods** to reconnect:
   ```bash
   kubectl rollout restart deployment/myapp-backend -n <namespace>
   ```

### Database Health Checks

1. **Check PostgreSQL status**:
   ```bash
   kubectl exec -it <postgresql-pod> -n <namespace> -- pg_isready -U myappuser -d myappdb
   ```

2. **Check database size and connections**:
   ```bash
   kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d myappdb -c "
   SELECT datname, pg_size_pretty(pg_database_size(datname)) as size 
   FROM pg_database 
   WHERE datname = 'myappdb';
   "
   
   kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d myappdb -c "
   SELECT count(*) as active_connections 
   FROM pg_stat_activity 
   WHERE state = 'active';
   "
   ```

3. **Verify application tables**:
   ```bash
   kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d myappdb -c "
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   "
   ```

### PostgreSQL Troubleshooting

1. **Check PostgreSQL logs**:
   ```bash
   kubectl logs <postgresql-pod> -n <namespace> | tail -50
   ```

2. **Check persistent volume status**:
   ```bash
   kubectl get pvc -n <namespace>
   kubectl describe pvc data-myapp-postgresql-0 -n <namespace>
   ```

3. **Check resource usage**:
   ```bash
   kubectl top pods -n <namespace> | grep postgresql
   ```

### Data Recovery

If data appears to be lost:

1. **Check if PVC still exists**:
   ```bash
   kubectl get pvc -n <namespace>
   ```

2. **Restore from backup** (if available):
   ```bash
   # This would depend on your backup strategy
   # Example with manual backup restoration
   kubectl exec -it <postgresql-pod> -n <namespace> -- sh -c '
   psql -U myappuser -d myappdb < /backup/latest-backup.sql
   '
   ```

3. **Reinitialize database** (last resort):
   ```bash
   # Delete and recreate the database
   kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d postgres -c "DROP DATABASE IF EXISTS myappdb;"
   kubectl exec -it <postgresql-pod> -n <namespace> -- psql -U myappuser -d postgres -c "CREATE DATABASE myappdb;"
   
   # Run migrations
   kubectl exec -it deployment/myapp-backend -n <namespace> -- npm run migrate
   ```

### Prevention

1. **Implement database monitoring** with appropriate alerts
2. **Set up automated backups** using CronJob or Velero
3. **Monitor disk space** and set up PVC expansion
4. **Implement connection pooling** in the application
5. **Regular database maintenance** and optimization

### Escalation

If database issues persist:
1. Check cluster storage health
2. Verify node resources and disk space
3. Consider scaling PostgreSQL vertically
4. Contact platform team with PostgreSQL logs and cluster status
