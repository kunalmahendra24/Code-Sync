import axios from "axios";
import { getApiUrl } from "./apiUrl";

const TOKEN_KEY = "token";

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

const instance = axios.create({
  baseURL: getApiUrl(),
});

instance.interceptors.request.use((config) => {
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
