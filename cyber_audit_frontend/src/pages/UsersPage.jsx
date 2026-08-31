import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { useSession } from "../context/SessionContext.jsx";
import { fetchUsers, fetchOrganizations, createUser, updateUser, ApiError } from "../lib/api.js";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrateur plateforme" },
  { value: "AUDITOR", label: "Auditeur" },
  { value: "COMPANY_ADMIN", label: "Administrateur PME" },
  { value: "COMPANY_USER", label: "Utilisateur PME" },
];

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  role: "COMPANY_USER",
  organization: "",
};

export default function UsersPage() {
  const { accessToken, logout: onLogout } = useSession();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setStatus("loading");
    try {
      const [userList, orgs] = await Promise.all([
        fetchUsers(accessToken),
        fetchOrganizations(accessToken),
      ]);
      setUsers(userList);
      setOrganizations(orgs);
      setStatus(userList.length === 0 ? "empty" : "ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout?.();
        return;
      }
      setErrorMessage(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue.");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function orgName(id) {
    return organizations.find((o) => o.id === id)?.name || "—";
  }

  async function handleToggleActive(user) {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    );
    try {
      await updateUser(accessToken, user.id, { is_active: !user.is_active });
    } catch {
      load();
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError(null);

    if (!form.username.trim() || !form.password) {
      setFormError("Identifiant et mot de passe sont requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(accessToken, {
        ...form,
        organization: form.organization || null,
      });
      setForm(EMPTY_FORM);
      setIsPanelOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Impossible de créer l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-semibold text-ink-primary">Utilisateurs</h1>
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="flex h-9 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white hover:bg-brand-600"
          >
            Nouvel utilisateur
          </button>
        </div>

        {status === "loading" && <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>}

        {status === "error" && (
          <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
            <p className="text-[13px] text-danger">{errorMessage}</p>
          </div>
        )}

        {status === "empty" && (
          <div className="mt-6 rounded border border-border bg-surface px-6 py-10 text-center">
            <p className="text-[14px] text-ink-primary">Aucun utilisateur pour l'instant.</p>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 overflow-hidden rounded border border-border bg-surface shadow-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">Identifiant</th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">Email</th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">Rôle</th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">Organisation</th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">Actif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 text-[13.5px] text-ink-primary">{u.username}</td>
                    <td className="px-5 py-3 text-[13px] text-ink-secondary">{u.email || "—"}</td>
                    <td className="px-5 py-3 text-[13px] text-ink-secondary">
                      {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role || "—"}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-secondary">
                      {u.organization ? orgName(u.organization) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`rounded-sm border px-2 py-0.5 text-[11.5px] font-medium ${
                          u.is_active
                            ? "border-success/30 bg-success/[0.06] text-success"
                            : "border-border-strong bg-bg text-ink-muted"
                        }`}
                      >
                        {u.is_active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isPanelOpen && (
        <div className="fixed inset-0 z-10 flex items-start justify-center bg-ink-primary/30 px-6 py-16">
          <div className="w-full max-w-[440px] rounded border border-border bg-surface shadow-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-[15px] font-semibold text-ink-primary">Nouvel utilisateur</h2>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5">
              {formError && (
                <div className="mb-4 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
                  <p className="text-[13px] text-danger">{formError}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-ink-primary">Identifiant</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink-primary">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink-primary">Mot de passe</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-ink-primary">Rôle</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-ink-primary">Organisation</label>
                    <select
                      value={form.organization}
                      onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                      className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Aucune</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="flex h-10 items-center justify-center rounded-sm border border-border px-4 text-[13.5px] font-medium text-ink-secondary hover:border-border-strong hover:text-ink-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-10 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
                >
                  {isSubmitting ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
