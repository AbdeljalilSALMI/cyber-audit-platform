import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppHeader from "../components/AppHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import QuestionnaireForm from "../components/QuestionnaireForm.jsx";
import RiskTable from "../components/RiskTable.jsx";
import RecommendationsList from "../components/RecommendationsList.jsx";
import ActionPlanTable from "../components/ActionPlanTable.jsx";
import {
  fetchAuditDetail,
  fetchOrganizations,
  fetchRisks,
  fetchAllRecommendations,
  fetchAllActions,
  completeAudit,
  updateActionStatus,
  generateReport,
  ApiError,
} from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

export default function AuditDetailPage() {
  const { accessToken, logout } = useSession();
  const { auditId } = useParams();
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [risks, setRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [actions, setActions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  async function load() {
    setStatus("loading");
    try {
      const [auditData, orgs] = await Promise.all([
        fetchAuditDetail(accessToken, auditId),
        fetchOrganizations(accessToken),
      ]);
      setAudit(auditData);
      const org = orgs.find((o) => o.id === auditData.organization);
      setOrgName(org?.name || `Org #${auditData.organization}`);

      if (auditData.status === "COMPLETED") {
        const [riskData, recoData, actionData] = await Promise.all([
          fetchRisks(accessToken, auditId),
          fetchAllRecommendations(accessToken),
          fetchAllActions(accessToken),
        ]);
        setRisks(riskData);
        const riskIds = new Set(riskData.map((r) => r.id));
        const relevantRecos = recoData.filter((r) => riskIds.has(r.risk));
        setRecommendations(relevantRecos);
        const recoIds = new Set(relevantRecos.map((r) => r.id));
        setActions(actionData.filter((a) => recoIds.has(a.recommendation)));
      }

      setStatus("ready");
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
  }, [accessToken, auditId]);

  async function handleComplete() {
    setIsCompleting(true);
    setErrorMessage(null);
    try {
      await completeAudit(accessToken, auditId);
      await load();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Impossible de terminer l'audit."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleActionStatusChange(actionId, newStatus) {
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a))
    );
    try {
      await updateActionStatus(accessToken, actionId, newStatus);
    } catch {
      load();
    }
  }

  async function handleGenerateReport() {
    setIsGeneratingReport(true);
    setReportMessage(null);
    try {
      const report = await generateReport(accessToken, auditId);
      setReportMessage(null);
      window.open(report.file, "_blank", "noopener,noreferrer");
    } catch (err) {
      setReportMessage(
        err instanceof ApiError ? err.message : "Impossible de générer le rapport."
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-8 py-8">
        <button
          type="button"
          onClick={() => navigate("/audits")}
          className="flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Retour aux audits
        </button>

        {status === "loading" && (
          <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
            <p className="text-[13px] text-danger">{errorMessage}</p>
          </div>
        )}

        {status === "ready" && audit && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h1 className="text-[19px] font-semibold text-ink-primary">
                  {orgName}
                </h1>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={audit.status} />
                  {audit.overall_score !== null && (
                    <span className="font-mono text-[12.5px] text-ink-secondary">
                      {Number(audit.overall_score).toFixed(0)}% ·{" "}
                      {audit.maturity_level_label}
                    </span>
                  )}
                </div>
              </div>

              {audit.status === "COMPLETED" && (
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex h-9 items-center justify-center rounded-sm border border-border px-4 text-[13.5px] font-medium text-ink-primary hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingReport ? "Génération…" : "Télécharger le rapport"}
                </button>
              )}
            </div>

            {reportMessage && (
              <div className="mt-3 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
                <p className="text-[13px] text-danger">{reportMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
                <p className="text-[13px] text-danger">{errorMessage}</p>
              </div>
            )}

            <section className="mt-6">
              <h2 className="text-[14px] font-semibold text-ink-primary">
                Questionnaire
              </h2>
              <div className="mt-3">
                <QuestionnaireForm
                  accessToken={accessToken}
                  audit={audit}
                  disabled={audit.status === "COMPLETED"}
                />
              </div>

              {audit.status !== "COMPLETED" && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="flex h-10 items-center justify-center rounded-sm bg-brand-700 px-5 text-[13.5px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
                  >
                    {isCompleting ? "Finalisation…" : "Terminer l'audit"}
                  </button>
                </div>
              )}
            </section>

            {audit.status === "COMPLETED" && (
              <>
                <section className="mt-8">
                  <h2 className="text-[14px] font-semibold text-ink-primary">Risques</h2>
                  <div className="mt-3">
                    <RiskTable risks={risks} />
                  </div>
                </section>

                <section className="mt-8">
                  <h2 className="text-[14px] font-semibold text-ink-primary">
                    Recommandations
                  </h2>
                  <div className="mt-3 rounded border border-border bg-surface px-5 py-2">
                    <RecommendationsList recommendations={recommendations} />
                  </div>
                </section>

                <section className="mb-10 mt-8">
                  <h2 className="text-[14px] font-semibold text-ink-primary">
                    Plan d'action
                  </h2>
                  <div className="mt-3">
                    <ActionPlanTable
                      actions={actions}
                      onStatusChange={handleActionStatusChange}
                    />
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
