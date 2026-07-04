// Runtime configuration must be in place before any app module evaluates
// (some modules read it at import time), so the app is loaded via dynamic
// import only after /env-config.json has been fetched. Containers render
// that file from environment variables at startup; local dev serves the
// empty stub from public/, leaving the VITE_* values from .env in effect
// through the import.meta.env fallbacks.
const loadRuntimeEnv = async (): Promise<void> => {
  try {
    const response = await fetch('/env-config.json', { cache: 'no-store' });
    if (response.ok) {
      window.__ENV__ = (await response.json()) as Window['__ENV__'];
    }
  } catch {
    // No runtime config available; import.meta.env fallbacks apply.
  }
};

void loadRuntimeEnv().then(() => import('./appRoot'));
