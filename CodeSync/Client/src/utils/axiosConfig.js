import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const instance = axios.create({
  baseURL: API_URL,
});

instance.interceptors.request.use((config) => {
  const stored = localStorage.getItem("user");
  if (stored && stored !== "null") {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {
      // ignore malformed local storage
    }
  }
  return config;
});

export default instance;
