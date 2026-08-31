import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-[12px] shadow-card">
      <p className="text-ink-muted">{formatDate(point.created_at)}</p>
      <p className="font-mono font-medium text-ink-primary">
        {Number(point.overall_score).toFixed(1)}%
      </p>
    </div>
  );
}

export default function ScoreEvolutionChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <p className="text-[13px] text-ink-muted">
        L'évolution du score s'affichera à partir du deuxième audit complété.
      </p>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="created_at"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: "#8A94A6", fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#D8DCE3" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#8A94A6", fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="overall_score"
            stroke="#1B3A5C"
            strokeWidth={1.75}
            dot={{ r: 2.5, fill: "#1B3A5C", strokeWidth: 0 }}
            activeDot={{ r: 3.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
