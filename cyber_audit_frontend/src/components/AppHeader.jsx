import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell.jsx";
import { useSession } from "../context/SessionContext.jsx";

function navItemsForRole(role) {
  const common = [{ to: "/dashboard", label: "Tableau de bord" }];

  if (role === "ADMIN") {
    return [
      ...common,
      { to: "/audits", label: "Audits" },
      { to: "/organizations", label: "Organisations" },
      { to: "/users", label: "Utilisateurs" },
      { to: "/risk-templates", label: "Modèles de risque" },
    ];
  }
  if (role === "AUDITOR") {
    return [
      ...common,
      { to: "/audits", label: "Audits" },
      { to: "/organizations", label: "Organisations" },
      { to: "/risk-templates", label: "Modèles de risque" },
    ];
  }
  return [...common, { to: "/audits", label: "Audits" }];
}

function Mark() {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      <span className="h-2 w-[3px] bg-brand-700" />
      <span className="h-3.5 w-[3px] bg-brand-700" />
      <span className="h-2.5 w-[3px] bg-accent" />
    </span>
  );
}

export default function AppHeader() {
  const { accessToken, userLabel, currentUser, logout } = useSession();
  const navItems = navItemsForRole(currentUser?.role);

  return (
    <>
      <div className="h-[3px] w-full bg-brand-900" />
      <header className="border-b border-border bg-surface">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 font-mono text-[13px] font-medium tracking-[0.14em] text-brand-900">
              <Mark />
              CYBERAUDIT
            </span>
            <nav className="flex items-center gap-5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `border-b-2 pb-1 text-[13.5px] transition-colors ${
                      isActive
                        ? "border-brand-700 font-medium text-ink-primary"
                        : "border-transparent text-ink-secondary hover:text-ink-primary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {accessToken && <NotificationBell accessToken={accessToken} />}
            {userLabel && (
              <span className="text-[13px] text-ink-secondary">{userLabel}</span>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-[13px] text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary active:scale-[0.97]"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
