import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth";
import { usersApi } from "../api/endpoints";
import { api } from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Re-check token periodically or at start
  const fetchUser = async () => {
    try {
      if (localStorage.getItem("accessToken")) {
        const res = await usersApi.getProfile();
        if (res.success) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      }
    } catch (e) {
      // clear user if failed
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (data) => {
    const res = await authApi.login(data);
    if (res.success) {
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    if (res.success) {
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
