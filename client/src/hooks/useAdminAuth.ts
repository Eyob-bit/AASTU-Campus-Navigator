import { useState } from "react";

/**
 * Placeholder auth hook.
 * Sprint 1: hardcoded — authenticated after calling login().
 * Will be replaced with real JWT auth in a later sprint.
 */

const AUTH_KEY = "admin_authed";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem(AUTH_KEY) === "true"
  );

  function login() {
    sessionStorage.setItem(AUTH_KEY, "true");
    setIsAuthenticated(true);
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
