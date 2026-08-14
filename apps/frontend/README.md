# Frontend Service

React (Vite) frontend for the phonebook demo, served by nginx in production.
The `/api` proxy configuration comes from the Helm chart's ConfigMap
(`charts/myapp/templates/frontend-nginx-configmap.yaml`); the Vite dev server
proxies `/api` to `localhost:5000`.

## Image provenance

Every pushed image carries signed SLSA provenance and an SBOM attestation:

```sh
gh attestation verify oci://ghcr.io/alexbeav/devops-phonebook-demo/frontend:<tag> --owner Alexbeav
```

## Development
```sh
npm ci
npm test        # vitest + testing-library
npm run dev     # dev server with /api proxy
npm run build
```
