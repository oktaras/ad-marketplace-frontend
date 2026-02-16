import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuthStore } from "@/features/auth/model/auth.store";

export type UserRole = "advertiser" | "publisher";

interface RoleContextValue {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (role?: UserRole) => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem("tg-ads-role");
    return saved === "advertiser" || saved === "publisher" ? saved : null;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("tg-ads-onboarded") === "true";
  });

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("tg-ads-role", newRole);
  }, []);

  const completeOnboarding = useCallback(async (roleOverride?: UserRole) => {
    const resolvedRole = roleOverride ?? role;

    if (!resolvedRole) {
      throw new Error("Please select a role to continue");
    }

    await useAuthStore.getState().completeOnboarding({
      isAdvertiser: resolvedRole === "advertiser",
      isChannelOwner: resolvedRole === "publisher",
    });

    setHasCompletedOnboarding(true);
    localStorage.setItem("tg-ads-onboarded", "true");
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, hasCompletedOnboarding, completeOnboarding }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
