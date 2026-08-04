import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch, apiPost } from "@/api/client";

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  updatedAt: string;
}

const DEFAULT_PROFILE: AdminProfile = {
  id: "admin-singleton",
  fullName: "Admin User",
  email: "admin@aastu.edu.et",
  role: "Super Admin",
  avatarUrl: null,
  updatedAt: new Date().toISOString(),
};

// Global module-level cache & custom event for real-time cross-component sync
let globalProfileCache: AdminProfile | null = null;
const PROFILE_EVENT = "aastu_admin_profile_updated";

function broadcastProfileChange(updated: AdminProfile) {
  globalProfileCache = updated;
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: updated }));
}

export function useAdminProfile() {
  const [profile, setProfileState] = useState<AdminProfile>(() => {
    return globalProfileCache || DEFAULT_PROFILE;
  });
  const [loading, setLoading] = useState(!globalProfileCache);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<AdminProfile>("/admin-profile");
      broadcastProfileChange(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const evt = e as CustomEvent<AdminProfile>;
      if (evt.detail) {
        setProfileState(evt.detail);
      }
    };

    window.addEventListener(PROFILE_EVENT, handleCustomEvent);

    if (!globalProfileCache) {
      fetchProfile();
    } else {
      setProfileState(globalProfileCache);
    }

    return () => {
      window.removeEventListener(PROFILE_EVENT, handleCustomEvent);
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<AdminProfile, "fullName" | "email" | "role" | "avatarUrl">>) => {
      const updated = await apiPatch<AdminProfile>("/admin-profile", updates);
      broadcastProfileChange(updated);
      return updated;
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await apiPost("/admin-profile/password", { currentPassword, newPassword });
    },
    []
  );

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    changePassword,
  };
}
