import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchMe, login as apiLogin, refreshAccessToken } from "../lib/api.js";

const SessionContext = createContext(null);

// Rafraîchit l'access token avant son expiration (durée de vie par défaut :
// 30 min côté backend, voir ACCESS_TOKEN_LIFETIME_MINUTES). Simplification
// assumée pour cette version : rafraîchissement proactif sur un minuteur,
// pas d'intercepteur retry-on-401 générique sur chaque appel API.
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

export function SessionProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const refreshTimerRef = useRef(null);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
  }, []);

  const login = useCallback(async (username, password) => {
    const tokens = await apiLogin(username, password);
    setAccessToken(tokens.access);
    setRefreshToken(tokens.refresh);
    const me = await fetchMe(tokens.access);
    setCurrentUser(me);
    return me;
  }, []);

  useEffect(() => {
    if (!refreshToken) return undefined;

    refreshTimerRef.current = setInterval(async () => {
      try {
        const { access } = await refreshAccessToken(refreshToken);
        setAccessToken(access);
      } catch {
        logout();
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshTimerRef.current);
  }, [refreshToken, logout]);

  const userLabel = currentUser
    ? `${currentUser.username} · ${ROLE_LABELS[currentUser.role] || currentUser.role || "—"}`
    : null;

  return (
    <SessionContext.Provider
      value={{
        accessToken,
        currentUser,
        userLabel,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  AUDITOR: "Auditeur",
  COMPANY_ADMIN: "Admin. PME",
  COMPANY_USER: "Utilisateur PME",
};

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession doit être utilisé sous SessionProvider");
  return ctx;
}
