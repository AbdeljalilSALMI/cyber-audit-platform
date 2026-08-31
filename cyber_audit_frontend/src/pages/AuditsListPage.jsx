import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import NewAuditPanel from "../components/NewAuditPanel.jsx";
import {
  fetchAudits,
  fetchOrganizations,
  fetchFrameworks,
  ApiError,
} from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AuditsListPage() {
  const { accessToken, logout } = useSession();
  const navigate = useNavigate();

  const [audits, setAudits] = useState([]);
  const [orgNames, setOrgNames] = useState({});
  const [frameworkNames, setFrameworkNames] = useState({});
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  async function load() {
    setStatus("loading");
    try {
      const [auditList, orgs, frameworks] = await Promise.all([
        fetchAudits(accessToken),
        fetchOrganizations(accessToken),
        fetchFrameworks(accessToken),
      ]);
      setOrgNames(Object.fromEntries(orgs.map((o) => [o.id, o.name])));
      setFrameworkNames(Object.fromEntries(frameworks.map((f) => [f.id, f.name])));
      setAudits(auditList);
      setStatus(auditList.length === 0 ? "empty" : "ready");
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

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-semibold text-ink-primary">Audits</h1>
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="flex h-9 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white transition-transform hover:bg-brand-600 active:scale-[0.98]"
          >
            Nouvel audit
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
            <p className="text-[14px] text-ink-primary">Aucun audit pour l'instant.</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              Créez un audit pour démarrer une évaluation de maturité cybersécurité.
            </p>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 overflow-hidden rounded border border-border bg-surface shadow-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Organisation
                  </th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Référentiel
                  </th>
                  <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Statut
                  </th>
                  <th className="px-5 py-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Score
                  </th>
                  <th className="px-5 py-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Créé le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((audit) => (
                  <tr
                    key={audit.id}
                    onClick={() => navigate(`/audits/${audit.id}`)}
                    className="cursor-pointer transition-colors hover:bg-bg/60"
                  >
                    <td className="px-5 py-3 text-[13.5px] text-ink-primary">
                      {orgNames[audit.organization] || `Org #${audit.organization}`}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-ink-secondary">
                      {frameworkNames[audit.framework] || `Référentiel #${audit.framework}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] text-ink-primary">
                      {audit.overall_score !== null && audit.overall_score !== undefined
                        ? `${Number(audit.overall_score).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12.5px] text-ink-muted">
                      {formatDate(audit.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isPanelOpen && (
        <NewAuditPanel
          accessToken={accessToken}
          onClose={() => setIsPanelOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
