{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end }}

{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride }}
{{- else }}
{{- printf "%s" (include "myapp.name" .) }}
{{- end }}
{{- end }}

{{/*
IngressRoute routes. Takes a dict with "host" and "middlewares" so the main
route and the optional LAN route render the same routes with different
middleware chains.
*/}}
{{- define "myapp.ingressRouteRoutes" -}}
routes:
  # Backend keeps its /api prefix - no stripPrefix middleware. The Express
  # routes are registered as /api/..., so stripping the prefix would 404.
  - match: Host(`{{ .host }}`) && PathPrefix(`/api`)
    kind: Rule
    {{- with .middlewares }}
    middlewares:
      {{- range . }}
      - name: {{ .name }}
        {{- with .namespace }}
        namespace: {{ . }}
        {{- end }}
      {{- end }}
    {{- end }}
    services:
      - name: myapp-backend
        port: 5000
  - match: Host(`{{ .host }}`)
    kind: Rule
    {{- with .middlewares }}
    middlewares:
      {{- range . }}
      - name: {{ .name }}
        {{- with .namespace }}
        namespace: {{ . }}
        {{- end }}
      {{- end }}
    {{- end }}
    services:
      - name: myapp-frontend
        port: 80
{{- end }}
