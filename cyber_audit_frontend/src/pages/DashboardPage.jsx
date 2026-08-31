import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import KpiCard from "../components/KpiCard.jsx";
import CategoryScoreList from "../components/CategoryScoreList.jsx";
import ScoreEvolutionChart from "../components/ScoreEvolutionChart.jsx";
import RecommendationsList from "../components/RecommendationsList.jsx";
import { fetchDashboard, fetchDashboardOverview, ApiError } from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// --- Vue plateforme (ADMIN / AUDITOR) : agrégée sur toutes les organisations ---
function PlatformOverview({ accessToken, onSelectOrganization }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const result = await fetchDashboardOverview(accessToken);
        if (cancelled) return;
        setData(result);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue.");
        setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (status === "loading") return <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>;
  if (status === "error") {
    return (
      <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
        <p className="text-[13px] text-danger">{errorMessage}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Organisations" value={data.organizations_count} />
        <KpiCard label="Audits" value={data.audits_count} />
        <KpiCard label="Audits terminés" value={data.completed_audits_count} />
        <KpiCard
          label="Score moyen"
          value={data.average_score !== null ? data.average_score.toFixed(0) : "—"}
          suffix={data.average_score !== null ? "/100" : undefined}
        />
        <KpiCard
          label="Risques critiques"
          value={data.critical_risks_count}
          tone={data.critical_risks_count > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Actions en retard"
          value={data.overdue_actions_count}
          tone={data.overdue_actions_count > 0 ? "warning" : "success"}
        />
      </div>

      <section className="rounded border border-border bg-surface shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-[14px] font-semibold text-ink-primary">Organisations</h2>
        </div>
        {data.organizations.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-ink-muted">Aucune organisation pour l'instant.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Organisation
                </th>
                <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Dernier audit
                </th>
                <th className="px-5 py-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Score
                </th>
                <th className="px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Maturité
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.organizations.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => onSelectOrganization(org.id)}
                  className="cursor-pointer transition-colors hover:bg-bg/60"
                >
                  <td className="px-5 py-3 text-[13.5px] text-ink-primary">{org.name}</td>
                  <td className="px-5 py-3 font-mono text-[12.5px] text-ink-muted">
                    {formatDate(org.last_audit_date)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[13px] text-ink-primary">
                    {org.last_audit_score !== null ? `${Number(org.last_audit_score).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-ink-secondary">
                    {org.last_audit_maturity || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// --- Vue par organisation (COMPANY_*, ou drill-down depuis la vue plateforme) ---
function OrganizationDashboard({ accessToken, organizationId, onLogout }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const result = await fetchDashboard(accessToken, organizationId);
        if (cancelled) return;
        if (result === null) {
          setStatus("empty");
        } else {
          setData(result);
          setStatus("ready");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onLogout();
          return;
        }
        setErrorMessage(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue.");
        setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, organizationId, onLogout]);

  if (status === "loading") return <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>;

  if (status === "error") {
    return (
      <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
        <p className="text-[13px] text-danger">{errorMessage}</p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="mt-6 rounded border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
        <p className="text-[14px] text-ink-primary">Aucun audit terminé pour l'instant.</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Lancez un audit et complétez le questionnaire pour voir vos résultats apparaître ici.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Score global"
          value={Number(data.last_audit.overall_score ?? 0).toFixed(0)}
          suffix="/100"
        />
        <KpiCard label="Niveau de maturité" value={data.last_audit.maturity_level || "—"} />
        <KpiCard
          label="Risques critiques"
          value={data.critical_risks_count}
          tone={data.critical_risks_count > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Actions en retard"
          value={data.overdue_actions_count}
          tone={data.overdue_actions_count > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="rounded border border-border bg-surface p-5 shadow-card lg:col-span-3">
          <h2 className="text-[14px] font-semibold text-ink-primary">Score par domaine</h2>
          <div className="mt-4">
            <CategoryScoreList scores={data.scores_by_category} />
          </div>
        </section>

        <section className="rounded border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-[14px] font-semibold text-ink-primary">Recommandations prioritaires</h2>
          <div className="mt-3">
            <RecommendationsList recommendations={data.priority_recommendations} />
          </div>
        </section>
      </div>

      <section className="rounded border border-border bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold text-ink-primary">Évolution du score</h2>
          <span className="font-mono text-[11px] text-ink-muted">
            {data.completed_actions_count} action(s) terminée(s)
          </span>
        </div>
        <div className="mt-3">
          <ScoreEvolutionChart data={data.score_evolution} />
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { accessToken, currentUser, logout } = useSession();
  const isPlatformRole = currentUser?.role === "ADMIN" || currentUser?.role === "AUDITOR";
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex items-center gap-3">
          {isPlatformRole && selectedOrgId && (
            <button
              type="button"
              onClick={() => setSelectedOrgId(null)}
              className="text-[13px] text-ink-secondary hover:text-ink-primary"
            >
              ← Vue d'ensemble
            </button>
          )}
          <h1 className="text-[19px] font-semibold text-ink-primary">
            {isPlatformRole && !selectedOrgId ? "Vue d'ensemble" : "Tableau de bord"}
          </h1>
        </div>

        {isPlatformRole && !selectedOrgId ? (
          <PlatformOverview accessToken={accessToken} onSelectOrganization={setSelectedOrgId} />
        ) : (
          <OrganizationDashboard
            accessToken={accessToken}
            organizationId={isPlatformRole ? selectedOrgId : undefined}
            onLogout={logout}
          />
        )}
      </main>
    </div>
  );
}
