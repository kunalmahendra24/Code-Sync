import axios from "axios";
import { getApiUrl } from "./apiUrl";

const instance = axios.create({
  baseURL: getApiUrl(),
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
