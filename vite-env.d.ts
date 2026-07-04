/// <reference types="vite/client" />

// Populated by src/main.tsx from /env-config.json before the app loads.
// Consumers read `window.__ENV__?.X || import.meta.env.X` so containers can
// configure the app at runtime while local dev keeps using .env values.
interface RuntimeEnv {
  VITE_API_BASE_URL?: string;
  VITE_API_BASE_NODE_URL?: string;
  VITE_API_BASE_URL_FRONTEND?: string;
  VITE_API_AUTHTOKEN?: string;
  VITE_IIIF_MANIFESTS_BASEURL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface Window {
  __ENV__?: RuntimeEnv;
}
