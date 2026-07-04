#!/bin/sh
# Renders the SPA's runtime configuration from environment variables into a
# JSON file the app fetches at startup (see src/main.tsx). Runs before nginx
# starts via the base image's /docker-entrypoint.d mechanism.
set -eu

escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

config_path=/usr/share/nginx/html/env-config.json

cat > "$config_path" <<EOF
{
  "VITE_API_BASE_URL": "$(escape "${VITE_API_BASE_URL:-}")",
  "VITE_API_BASE_NODE_URL": "$(escape "${VITE_API_BASE_NODE_URL:-}")",
  "VITE_API_BASE_URL_FRONTEND": "$(escape "${VITE_API_BASE_URL_FRONTEND:-}")",
  "VITE_API_AUTHTOKEN": "$(escape "${VITE_API_AUTHTOKEN:-}")",
  "VITE_IIIF_MANIFESTS_BASEURL": "$(escape "${VITE_IIIF_MANIFESTS_BASEURL:-}")",
  "VITE_SUPABASE_URL": "$(escape "${VITE_SUPABASE_URL:-}")",
  "VITE_SUPABASE_ANON_KEY": "$(escape "${VITE_SUPABASE_ANON_KEY:-}")"
}
EOF

echo "env-config: rendered $config_path"
