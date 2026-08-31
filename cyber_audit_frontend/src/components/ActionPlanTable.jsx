const STATUS_OPTIONS = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "BLOCKED", label: "Bloquée" },
  { value: "COMPLETED", label: "Terminée" },
];

export default function ActionPlanTable({ actions, onStatusChange }) {
  if (!actions || actions.length === 0) {
    return <p className="text-[13px] text-ink-muted">Aucune action planifiée.</p>;
  }

  return (
    <div className="overflow-hidden rounded border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Action
            </th>
            <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Échéance
            </th>
            <th className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {actions.map((action) => (
            <tr key={action.id}>
              <td className="px-4 py-2.5 text-[13px] text-ink-primary">{action.title}</td>
              <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink-secondary">
                {action.due_date || "—"}
              </td>
              <td className="px-4 py-2.5">
                <select
                  value={action.status}
                  onChange={(e) => onStatusChange(action.id, e.target.value)}
                  className="rounded-sm border border-border bg-white px-2 py-1 text-[12.5px] text-ink-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
