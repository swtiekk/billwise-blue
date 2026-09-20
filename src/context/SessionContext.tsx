import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { navigationRef } from "../navigation/navigationRef";
import { setSessionExpiredHandler } from "../api/client";
import type { SessionUser } from "../api/auth";

interface SessionValue {
  user: SessionUser | null;
  setUser: React.Dispatch<React.SetStateAction<SessionUser | null>>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  // Refresh token rejected anywhere in the app -> back to Login.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
