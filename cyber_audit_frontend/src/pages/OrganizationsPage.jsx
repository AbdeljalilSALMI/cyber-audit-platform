import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import AppHeader from "../components/AppHeader.jsx";
import NewOrganizationPanel from "../components/NewOrganizationPanel.jsx";
import { fetchOrganizations, deleteOrganization, ApiError } from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

export default function OrganizationsPage() {
  const { accessToken, logout } = useSession();
  const [organizations, setOrganizations] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  async function load() {
    setStatus("loading");
    try {
      const result = await fetchOrganizations(accessToken);
      setOrganizations(result);
      setStatus(result.length === 0 ? "empty" : "ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setErrorMessage(
        err instanceof ApiError ? err.message : "Une erreur inattendue est survenue."
      );
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function handleCreated() {
    setIsPanelOpen(false);
    load();
  }

  async function handleDelete(org) {
    if (!window.confirm(`Supprimer "${org.name}" ? Tous ses audits seront également supprimés.`)) {
      return;
    }
    try {
      await deleteOrganization(accessToken, org.id);
      load();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Impossible de supprimer.");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-semibold text-ink-primary">
            Organisations
          </h1>
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="flex h-9 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white hover:bg-brand-600 active:scale-[0.98]"
          >
            Nouvelle organisation
          </button>
        </div>

        {status === "loading" && (
          <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
            <p className="text-[13px] text-danger">{errorMessage}</p>
          </div>
        )}

        {status === "empty" && (
          <div className="mt-6 rounded border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
            <p className="text-[14px] text-ink-primary">
              Aucune organisation pour l'instant.
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">
              Créez une organisation pour pouvoir démarrer un audit.
            </p>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 overflow-hidden rounded border border-border bg-surface shadow-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Nom
                  </th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Secteur
                  </th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Ville
                  </th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Contact
                  </th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="px-5 py-3 text-[13.5px] text-ink-primary">
                      {org.name}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-ink-secondary">
                      {org.sector || "—"}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-ink-secondary">
                      {org.city || "—"}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-secondary">
                      {org.contact_email || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(org)}
                        className="text-ink-muted hover:text-danger"
                        aria-label={`Supprimer ${org.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
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
        <NewOrganizationPanel
          accessToken={accessToken}
          onClose={() => setIsPanelOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
