export default function CategoryScoreList({ scores }) {
  if (!scores || scores.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        Aucun score par catégorie disponible pour cet audit.
      </p>
    );
  }

  return (
    <div className="space-y-3.5">
      {scores.map((item) => {
        const percentage = Number(item.percentage);
        return (
          <div key={item.category__name}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[13.5px] text-ink-primary">
                {item.category__name}
              </span>
              <span className="font-mono text-[13px] text-ink-secondary">
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-brand-700"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
