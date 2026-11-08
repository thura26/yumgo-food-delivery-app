import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMMK } from "@/lib/utils";

const axisStyle = {
  fontSize: 9,
  fontFamily: "inherit",
  fill: "#7c7c7c",
};

function ChartTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { value?: number | string; name?: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-lg">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-extrabold text-ink">
        {money ? formatMMK(value) : value.toLocaleString()}
      </p>
    </div>
  );
}

export function RevenueAreaChart({
  data,
  height = 220,
}: {
  data: { label: string; revenue: number }[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00B14F" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#00B14F" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="#f1e7df" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
            }
            width={46}
          />
          <Tooltip content={<ChartTooltip money />} cursor={{ stroke: "#f1e7df" }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#00B14F"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#00B14F", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersBarChart({
  data,
  height = 200,
  dataKey = "orders",
  color = "#171717",
}: {
  data: { label: string; orders: number; revenue?: number }[];
  height?: number;
  dataKey?: "orders" | "revenue";
  color?: string;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#f1e7df" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value) =>
              dataKey === "revenue" && value >= 1000
                ? `${Math.round(value / 1000)}k`
                : `${value}`
            }
          />
          <Tooltip
            content={<ChartTooltip money={dataKey === "revenue"} />}
            cursor={{ fill: "rgba(0, 177, 79,0.06)" }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({
  data,
  height = 200,
  totalLabel,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  totalLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-extrabold tracking-tight">{total}</p>
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
          {totalLabel ?? "Orders"}
        </p>
      </div>
    </div>
  );
}
