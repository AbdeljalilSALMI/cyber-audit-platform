import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  fetchOrganizations,
  fetchFrameworks,
  createAudit,
  ApiError,
} from "../lib/api.js";

export default function NewAuditPanel({ accessToken, onClose, onCreated }) {
  const [organizations, setOrganizations] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [frameworkId, setFrameworkId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      try {
        const [orgs, fws] = await Promise.all([
          fetchOrganizations(accessToken),
          fetchFrameworks(accessToken),
        ]);
        if (cancelled) return;
        setOrganizations(orgs);
        setFrameworks(fws);
        if (orgs.length === 1) setOrganizationId(String(orgs[0].id));
        if (fws.length === 1) setFrameworkId(String(fws[0].id));
      } catch {
        if (!cancelled) setError("Impossible de charger les organisations et référentiels.");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!organizationId || !frameworkId) {
      setError("Sélectionnez une organisation et un référentiel.");
      return;
    }

    setIsSubmitting(true);
    try {
      const audit = await createAudit(accessToken, {
        organization: Number(organizationId),
        framework: Number(frameworkId),
      });
      onCreated?.(audit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer l'audit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center bg-ink-primary/30 px-6 py-16">
      <div className="w-full max-w-[440px] rounded border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink-primary">
            Nouvel audit
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
              <p className="text-[13px] text-danger">{error}</p>
            </div>
          )}

          {loadingOptions ? (
            <p className="text-[13px] text-ink-muted">Chargement…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Organisation
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Sélectionner…</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Référentiel
                </label>
                <select
                  value={frameworkId}
                  onChange={(e) => setFrameworkId(e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Sélectionner…</option>
                  {frameworks.map((fw) => (
                    <option key={fw.id} value={fw.id}>
                      {fw.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded-sm border border-border px-4 text-[13.5px] font-medium text-ink-secondary hover:border-border-strong hover:text-ink-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingOptions}
              className="flex h-10 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
            >
              {isSubmitting ? "Création…" : "Créer l'audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
