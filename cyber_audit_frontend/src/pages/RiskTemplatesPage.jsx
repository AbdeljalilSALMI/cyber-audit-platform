import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { useSession } from "../context/SessionContext.jsx";
import {
  fetchQuestions,
  fetchRiskTemplates,
  createRiskTemplate,
  fetchRecommendationTemplates,
  createRecommendationTemplate,
  ApiError,
} from "../lib/api.js";

const EMPTY_RISK_FORM = {
  question: "",
  trigger_choice: "",
  risk_name: "",
  risk_description: "",
  default_probability: 3,
  default_impact: 3,
};

const EMPTY_RECO_FORM = {
  risk_template: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  estimated_effort: "MEDIUM",
};

export default function RiskTemplatesPage() {
  const { accessToken, logout: onLogout } = useSession();
  const [questions, setQuestions] = useState([]);
  const [riskTemplates, setRiskTemplates] = useState([]);
  const [recoTemplates, setRecoTemplates] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);

  const [riskForm, setRiskForm] = useState(EMPTY_RISK_FORM);
  const [riskFormError, setRiskFormError] = useState(null);
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false);

  const [recoForm, setRecoForm] = useState(EMPTY_RECO_FORM);
  const [recoFormError, setRecoFormError] = useState(null);
  const [isSubmittingReco, setIsSubmittingReco] = useState(false);

  async function load() {
    setStatus("loading");
    try {
      const [q, rt, ct] = await Promise.all([
        fetchQuestions(accessToken),
        fetchRiskTemplates(accessToken),
        fetchRecommendationTemplates(accessToken),
      ]);
      setQuestions(q);
      setRiskTemplates(rt);
      setRecoTemplates(ct);
      setStatus("ready");
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

  const selectedQuestion = questions.find((q) => q.id === Number(riskForm.question));

  async function handleCreateRiskTemplate(event) {
    event.preventDefault();
    setRiskFormError(null);

    if (!riskForm.question || !riskForm.trigger_choice || !riskForm.risk_name.trim()) {
      setRiskFormError("Question, choix déclencheur et nom du risque sont requis.");
      return;
    }

    setIsSubmittingRisk(true);
    try {
      await createRiskTemplate(accessToken, {
        ...riskForm,
        question: Number(riskForm.question),
        trigger_choice: Number(riskForm.trigger_choice),
      });
      setRiskForm(EMPTY_RISK_FORM);
      load();
    } catch (err) {
      setRiskFormError(err instanceof ApiError ? err.message : "Impossible de créer le modèle.");
    } finally {
      setIsSubmittingRisk(false);
    }
  }

  async function handleCreateRecoTemplate(event) {
    event.preventDefault();
    setRecoFormError(null);

    if (!recoForm.risk_template || !recoForm.title.trim()) {
      setRecoFormError("Modèle de risque et titre sont requis.");
      return;
    }

    setIsSubmittingReco(true);
    try {
      await createRecommendationTemplate(accessToken, {
        ...recoForm,
        risk_template: Number(recoForm.risk_template),
      });
      setRecoForm(EMPTY_RECO_FORM);
      load();
    } catch (err) {
      setRecoFormError(err instanceof ApiError ? err.message : "Impossible de créer la recommandation.");
    } finally {
      setIsSubmittingReco(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-8 py-8">
        <h1 className="text-[19px] font-semibold text-ink-primary">
          Modèles de risque et de recommandation
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Configure la génération automatique des risques et recommandations
          à partir des réponses au questionnaire.
        </p>

        {status === "loading" && <p className="mt-6 text-[13px] text-ink-muted">Chargement…</p>}

        {status === "error" && (
          <div className="mt-6 rounded-sm border border-danger-border bg-danger-bg px-4 py-3">
            <p className="text-[13px] text-danger">{errorMessage}</p>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 space-y-8">
            {/* --- Risk templates --- */}
            <section className="rounded border border-border bg-surface p-5 shadow-card">
              <h2 className="text-[14px] font-semibold text-ink-primary">Modèles de risque</h2>

              <form onSubmit={handleCreateRiskTemplate} className="mt-4 space-y-3">
                {riskFormError && (
                  <div className="rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
                    <p className="text-[13px] text-danger">{riskFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">Question</label>
                    <select
                      value={riskForm.question}
                      onChange={(e) =>
                        setRiskForm((f) => ({ ...f, question: e.target.value, trigger_choice: "" }))
                      }
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Sélectionner…</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.question_text}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">
                      Choix déclencheur
                    </label>
                    <select
                      value={riskForm.trigger_choice}
                      onChange={(e) => setRiskForm((f) => ({ ...f, trigger_choice: e.target.value }))}
                      disabled={!selectedQuestion}
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-bg"
                    >
                      <option value="">Sélectionner…</option>
                      {selectedQuestion?.choices.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-ink-primary">
                    Nom du risque
                  </label>
                  <input
                    type="text"
                    value={riskForm.risk_name}
                    onChange={(e) => setRiskForm((f) => ({ ...f, risk_name: e.target.value }))}
                    className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="ex. Perte de données en cas d'incident"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">
                      Probabilité par défaut (1-5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={riskForm.default_probability}
                      onChange={(e) =>
                        setRiskForm((f) => ({ ...f, default_probability: e.target.value }))
                      }
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">
                      Impact par défaut (1-5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={riskForm.default_impact}
                      onChange={(e) => setRiskForm((f) => ({ ...f, default_impact: e.target.value }))}
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingRisk}
                    className="flex h-9 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
                  >
                    {isSubmittingRisk ? "Création…" : "Ajouter le modèle de risque"}
                  </button>
                </div>
              </form>

              <div className="mt-5 divide-y divide-border border-t border-border">
                {riskTemplates.map((rt) => (
                  <div key={rt.id} className="py-2.5">
                    <p className="text-[13px] text-ink-primary">{rt.risk_name}</p>
                    <p className="text-[12px] text-ink-muted">
                      P{rt.default_probability} × I{rt.default_impact}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* --- Recommendation templates --- */}
            <section className="rounded border border-border bg-surface p-5 shadow-card">
              <h2 className="text-[14px] font-semibold text-ink-primary">
                Modèles de recommandation
              </h2>

              <form onSubmit={handleCreateRecoTemplate} className="mt-4 space-y-3">
                {recoFormError && (
                  <div className="rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
                    <p className="text-[13px] text-danger">{recoFormError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[12.5px] font-medium text-ink-primary">
                    Modèle de risque associé
                  </label>
                  <select
                    value={recoForm.risk_template}
                    onChange={(e) => setRecoForm((f) => ({ ...f, risk_template: e.target.value }))}
                    className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Sélectionner…</option>
                    {riskTemplates.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.risk_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-ink-primary">Titre</label>
                  <input
                    type="text"
                    value={recoForm.title}
                    onChange={(e) => setRecoForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="ex. Mettre en place des sauvegardes automatiques"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">Priorité</label>
                    <select
                      value={recoForm.priority}
                      onChange={(e) => setRecoForm((f) => ({ ...f, priority: e.target.value }))}
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-primary">Effort</label>
                    <select
                      value={recoForm.estimated_effort}
                      onChange={(e) =>
                        setRecoForm((f) => ({ ...f, estimated_effort: e.target.value }))
                      }
                      className="mt-1 block h-10 w-full rounded-sm border border-border bg-white px-2.5 text-[13px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Moyen</option>
                      <option value="HIGH">Élevé</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReco}
                    className="flex h-9 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
                  >
                    {isSubmittingReco ? "Création…" : "Ajouter la recommandation"}
                  </button>
                </div>
              </form>

              <div className="mt-5 divide-y divide-border border-t border-border">
                {recoTemplates.map((ct) => (
                  <div key={ct.id} className="py-2.5">
                    <p className="text-[13px] text-ink-primary">{ct.title}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
