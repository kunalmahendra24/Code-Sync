const PRODUCTION_API =
  "https://code-sync-production-2882.up.railway.app";

const isLocalHostname = (hostname) => {
  if (!hostname) return false;

  if (hostname.endsWith(".vercel.app") || hostname.endsWith(".railway.app")) {
    return false;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;

  return false;
};

export function getApiUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const { hostname, protocol } = window.location;

  if (isLocalHostname(hostname)) {
    return `${protocol}//${hostname}:5001`;
  }

  return PRODUCTION_API;
}
