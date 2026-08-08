import axios from "axios";
import { getApiUrl } from "./apiUrl";

const TOKEN_KEY = "token";
const REQUEST_TIMEOUT_MS = 30000;

export const getStoredToken = () => {
  const direct = localStorage.getItem(TOKEN_KEY);
  if (direct) return direct;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.token || null;
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getNetworkErrorMessage = (error) => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.status) {
    return `Server error (${error.response.status})`;
  }

  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Check your internet connection and try again.";
  }

  if (!error?.response) {
    return `Cannot reach server at ${getApiUrl()}. Check your internet connection and ensure the backend is running.`;
  }

  return error.message || "No server response";
};

const instance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
});

instance.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();

  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredToken();
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default instance;
