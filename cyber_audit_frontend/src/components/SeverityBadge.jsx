const SEVERITY_CONFIG = {
  LOW: { label: "Faible", tone: "neutral" },
  MEDIUM: { label: "Moyen", tone: "warning" },
  HIGH: { label: "Élevé", tone: "warning" },
  CRITICAL: { label: "Critique", tone: "danger" },
};

const TONE_STYLES = {
  neutral: "border-border-strong bg-bg text-ink-secondary",
  warning: "border-warning-border bg-warning-bg text-warning",
  danger: "border-danger-border bg-danger-bg text-danger",
};

export default function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || { label: severity, tone: "neutral" };
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-[11.5px] font-medium ${TONE_STYLES[config.tone]}`}
    >
      {config.label}
    </span>
  );
}
