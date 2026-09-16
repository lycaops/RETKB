import React from "react";
import { useApp } from "@/lib/AppContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getNumber, normalizePercent } from "@/lib/csvUtils";

const COLORS = ["#21264e", "#006AE0", "#08dc7d", "#FFDD64", "#00D7FF", "#46286e", "#ffc8b2"];

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
      <div style={{ width: "100%", height: 220 }}>{children}</div>
    </div>
  );
}

export default function StatementCharts({ row, statement }) {
  const { t, lang } = useApp();

  // Incentive composition (credit components)
  const composition = [
    { name: "BUNDLE1_COMM", value: getNumber(row, "BUNDLE1_COMM") },
    { name: "QUALITY_BONUS M-1", value: getNumber(row, "QUALITY_BONUS M-1") },
    { name: "VOLUME_BONUS M-1", value: getNumber(row, "VOLUME_BONUS M-1") },
    { name: "ONBOARDING_COMM", value: getNumber(row, "ONBOARDING_COMM") },
    { name: "NONHP_COMM", value: getNumber(row, "NONHP_COMM") },
    { name: "PORTIN_COMM", value: getNumber(row, "PORTIN_COMM") },
    { name: "GARA_COMM", value: getNumber(row, "GARA_COMM") },
  ].filter((d) => d.value !== null && d.value !== 0);

  // Earnings vs deductions
  const earnDeduct = [
    { name: t("earnings_credits"), value: (statement.summary.credits + statement.summary.bonuses) || 0, color: "#08dc7d" },
    { name: t("deductions_adjustments"), value: statement.summary.deductions || 0, color: "#b04a30" },
    { name: t("total_refund"), value: statement.summary.refund || 0, color: "#006AE0" },
  ];

  // Activation performance
  const activation = [
    { name: t("topup_less_6"), value: getNumber(row, "TOTAL_TOPUP_LESS_6") || 0 },
    { name: t("topup_great_6"), value: getNumber(row, "TOTAL_TOPUP_GREAT_6") || 0 },
    { name: t("topup_less_6_portin"), value: getNumber(row, "TOTAL_TOPUP_LESS_6_PORTIN") || 0 },
    { name: t("topup_great_6_portin"), value: getNumber(row, "TOTAL_TOPUP_GREAT_6_PORTIN") || 0 },
  ];

  // Renewal performance
  const renewal = [
    { name: "T1", value: getNumber(row, "T1 RENEWAL") || 0 },
    { name: "T2", value: getNumber(row, "T2 RENEWAL") || 0 },
    { name: "T3", value: getNumber(row, "T3REN_BONUS") || 0 },
  ];

  // Usage & port-out
  const usagePortout = [
    { name: t("usage_percentage"), value: normalizePercent(getNumber(row, "USAGE_PERCENTAGE")) || 0 },
    { name: t("total_portouts"), value: getNumber(row, "TOTAL_PORTOUT") || 0 },
  ];

  const tooltipStyle = { fontSize: 12, borderRadius: 8 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {composition.length > 0 && (
        <ChartCard title={t("chart_incentive_composition")}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={composition} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                {composition.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title={t("chart_earnings_vs_deductions")}>
        <ResponsiveContainer>
          <BarChart data={earnDeduct}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {earnDeduct.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("chart_activation_performance")}>
        <ResponsiveContainer>
          <BarChart data={activation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#006AE0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("chart_renewal_performance")}>
        <ResponsiveContainer>
          <BarChart data={renewal}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#08dc7d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("chart_usage_portout")}>
        <ResponsiveContainer>
          <BarChart data={usagePortout}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#46286e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}