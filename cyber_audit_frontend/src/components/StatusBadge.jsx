const STATUS_CONFIG = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  IN_PROGRESS: { label: "En cours", tone: "accent" },
  SUBMITTED: { label: "Soumis", tone: "accent" },
  UNDER_REVIEW: { label: "En revue", tone: "warning" },
  COMPLETED: { label: "Terminé", tone: "success" },
  ARCHIVED: { label: "Archivé", tone: "neutral" },
};

const TONE_STYLES = {
  neutral: "border-border-strong bg-bg text-ink-secondary",
  accent: "border-accent/40 bg-accent/[0.06] text-accent",
  warning: "border-warning-border bg-warning-bg text-warning",
  success: "border-success/30 bg-success/[0.06] text-success",
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, tone: "neutral" };
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-[11.5px] font-medium ${TONE_STYLES[config.tone]}`}
    >
      {config.label}
    </span>
  );
}
