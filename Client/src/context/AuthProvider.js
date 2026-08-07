import { createContext, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  clearStoredToken,
  setStoredToken,
} from "../utils/axiosConfig";

const AuthContext = createContext({});

const readInitialAuth = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token") || stored?.token || null;

    if (!token) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }

    localStorage.setItem("token", token);
    return stored?.token ? stored : { ...stored, token };
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [, setLocalUser] = useLocalStorage("user", null);
  const [auth, setAuthState] = useState(readInitialAuth);

  const setAuth = (value) => {
    if (value?.token) {
      setStoredToken(value.token);
      setAuthState(value);
      setLocalUser(value);
      return;
    }

    clearStoredToken();
    setAuthState(null);
    setLocalUser(null);
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
