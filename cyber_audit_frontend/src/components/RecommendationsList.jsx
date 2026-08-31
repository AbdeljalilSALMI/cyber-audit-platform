const PRIORITY_LABEL = {
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Faible",
};

export default function RecommendationsList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        Aucune recommandation prioritaire en attente.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {recommendations.map((reco) => (
        <li key={reco.id} className="flex items-center justify-between py-2.5">
          <span className="text-[13.5px] text-ink-primary">{reco.title}</span>
          <span className="ml-4 flex-shrink-0 rounded-sm border border-danger-border bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">
            {PRIORITY_LABEL[reco.priority] || reco.priority}
          </span>
        </li>
      ))}
    </ul>
  );
}
