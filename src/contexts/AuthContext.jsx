import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/api";
import { toast } from "sonner";

const AuthContext = createContext(null);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /* ================= AUTH ================= */

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });

    const { access_token, user } = res.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    toast.success("Login successful");

    return user; // 👈 caller decides navigation
  };

  const register = async (data) => {
    const res = await api.post("/api/auth/register", data);

    const { access_token, user } = res.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    toast.success("Registration successful");

    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  /* ================= CONTEXT ================= */

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
