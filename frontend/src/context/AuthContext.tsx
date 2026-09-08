import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/axios";

export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  monthlyIncome: number;
  savingsGoalAmount: number;
  preferredCategories: string[];
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    persistSession(res.data.data);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, email, password });
    persistSession(res.data.data);
  }

  function persistSession(data: { user: User; accessToken: string; refreshToken: string }) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    api.post("/auth/logout").catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
