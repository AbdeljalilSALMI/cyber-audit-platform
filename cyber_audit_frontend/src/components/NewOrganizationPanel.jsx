import { useState } from "react";
import { X } from "lucide-react";
import { createOrganization, ApiError } from "../lib/api.js";

const COMPANY_SIZES = [
  { value: "MICRO", label: "Micro (< 10 employés)" },
  { value: "SMALL", label: "Petite (10 à 49 employés)" },
  { value: "MEDIUM", label: "Moyenne (50 à 249 employés)" },
  { value: "LARGE", label: "Grande (250 employés et plus)" },
];

const EMPTY_FORM = {
  name: "",
  sector: "",
  company_size: "",
  country: "Maroc",
  city: "",
  contact_email: "",
  phone: "",
  website: "",
};

export default function NewOrganizationPanel({ accessToken, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Le nom de l'organisation est requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const org = await createOrganization(accessToken, form);
      onCreated?.(org);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer l'organisation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center bg-ink-primary/30 px-6 py-16">
      <div className="w-full max-w-[460px] rounded border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-[15px] font-semibold text-ink-primary">
            Nouvelle organisation
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

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-primary">
                Nom
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="ex. TechnoPME SARL"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Secteur
                </label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => update("sector", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="ex. Services IT"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Taille
                </label>
                <select
                  value={form.company_size}
                  onChange={(e) => update("company_size", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Non précisée</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Pays
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Ville
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="ex. Casablanca"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink-primary">
                Email de contact
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="contact@entreprise.ma"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="+212 5XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink-primary">
                  Site web
                </label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3 text-[14px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="flex h-10 items-center justify-center rounded-sm bg-brand-700 px-4 text-[13.5px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-700/60"
            >
              {isSubmitting ? "Création…" : "Créer l'organisation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
