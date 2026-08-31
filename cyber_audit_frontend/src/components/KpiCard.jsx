const TONE_STYLES = {
  neutral: "border-l-border-strong",
  danger: "border-l-danger",
  warning: "border-l-warning",
  success: "border-l-success",
};

const DOT_STYLES = {
  neutral: "bg-ink-muted",
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
};

export default function KpiCard({ label, value, suffix, tone = "neutral" }) {
  return (
    <div
      className={`rounded border border-border border-l-[3px] bg-surface px-5 py-4 shadow-card ${TONE_STYLES[tone]}`}
    >
      <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[tone]}`} />
        {label}
      </p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none text-ink-primary">
        {value}
        {suffix && (
          <span className="ml-1 text-[14px] font-normal text-ink-muted">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
