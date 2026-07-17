const PRODUCTION_API =
  "https://code-sync-production-2882.up.railway.app";

export function getApiUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (window.location.hostname === "localhost") {
    return "http://localhost:5001";
  }

  return PRODUCTION_API;
}
