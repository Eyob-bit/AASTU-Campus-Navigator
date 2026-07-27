import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects admin routes. Redirects to /login if not authenticated.
 * Authentication logic will be wired to the real backend in a later sprint.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
