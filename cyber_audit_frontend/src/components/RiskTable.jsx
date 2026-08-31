import SeverityBadge from "./SeverityBadge.jsx";

export default function RiskTable({ risks }) {
  if (!risks || risks.length === 0) {
    return <p className="text-[13px] text-ink-muted">Aucun risque identifié.</p>;
  }

  return (
    <div className="overflow-hidden rounded border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Risque
            </th>
            <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Probabilité
            </th>
            <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Impact
            </th>
            <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Score
            </th>
            <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Sévérité
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {risks.map((risk) => (
            <tr key={risk.id}>
              <td className="px-4 py-2.5 text-[13px] text-ink-primary">{risk.name}</td>
              <td className="px-4 py-2.5 text-right font-mono text-[12.5px] text-ink-secondary">
                {risk.probability}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-[12.5px] text-ink-secondary">
                {risk.impact}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-[12.5px] font-medium text-ink-primary">
                {risk.risk_score}
              </td>
              <td className="px-4 py-2.5">
                <SeverityBadge severity={risk.severity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
