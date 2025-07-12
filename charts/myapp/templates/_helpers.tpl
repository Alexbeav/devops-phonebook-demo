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
