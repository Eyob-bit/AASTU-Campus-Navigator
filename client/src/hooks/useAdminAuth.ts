import { useState, useCallback } from "react";
import { apiClient, JWT_STORAGE_KEY } from "@/api/client";

interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface LoginResponse {
  success: boolean;
  token: string;
  expiresIn: number;
  profile: AdminProfile;
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    // Decode payload (no verification — server verifies on protected requests)
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    // Check expiry (exp is in seconds, Date.now() in ms)
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    return isTokenValid(token);
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<LoginResponse>("/auth/login", { email, password });
      const { token } = res.data;
      localStorage.setItem(JWT_STORAGE_KEY, token);
      setIsAuthenticated(true);
      return true;
    } catch (err: unknown) {
      // Prefer the server's error message, fall back to generic
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        "Login failed. Check your credentials.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return { isAuthenticated, login, logout, error, isLoading };
}
