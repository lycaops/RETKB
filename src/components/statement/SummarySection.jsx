import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatCurrency, formatNumber } from "@/lib/csvUtils";

function MetricRow({ label, value, color, bold }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-medium"}`} style={{ color: color || "#fff" }}>
        {value}
      </span>
    </div>
  );
}

export default function SummarySection({ statement }) {
  const { t, lang } = useApp();
  const s = statement.summary;
  const fmt = (v) => (v === null ? "—" : formatCurrency(v, lang));
  const moodMap = { SBT: t("payment_mood_sbt"), BT: t("payment_mood_bt"), VOU: t("payment_mood_vou") };
  const moodLabel = statement.paymentMood
    ? `${statement.paymentMood} — ${moodMap[statement.paymentMood] || ""}`.trim()
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Credits */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#21264e" }}>
        <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#08dc7d]" /> {t("earnings_credits")}
        </h3>
        <MetricRow label={t("total_commission_label")} value={fmt(s.totalCommissionSource)} color="#FFDD64" bold />
        <MetricRow label={t("new_activation_bonus")} value={fmt(s.bundle1Comm)} color="#08dc7d" />
        <MetricRow label={t("t1_renewal_bonus")} value={fmt(s.qualityBonus)} color="#08dc7d" />
        <MetricRow label={t("t2_renewal_bonus")} value={fmt(s.volumeBonus)} color="#08dc7d" />
        <MetricRow label={t("port_in_bonus")} value={fmt(s.portInBonus)} color="#08dc7d" />
        <MetricRow label={t("total_refund")} value={fmt(s.refund)} color="#00D7FF" />
      </div>

      {/* Deductions */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#46286e" }}>
        <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffc8b2]" /> {t("deductions_adjustments")}
        </h3>
        <MetricRow label={t("portout_deduction")} value={fmt(s.portoutDeduction)} color="#ffc8b2" />
        <MetricRow label={t("usage_clawback")} value={s.appliesClawback ? fmt(s.usageClawback) : "—"} color="#ffc8b2" />
        <MetricRow label={t("total_deductions_label")} value={fmt(s.deductions)} color="#ffc8b2" bold />
        <MetricRow label={t("calculated_value")} value={fmt(s.calculatedTotal)} color="#fff" bold />
      </div>

      {/* Payments */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#006AE0" }}>
        <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFDD64]" /> {t("payments")}
        </h3>
        <MetricRow label={t("payment_mood")} value={moodLabel} color="#fff" />
        <MetricRow label={t("opening_balance")} value={fmt(s.openingBalance)} color="#fff" />
        <MetricRow label={t("total_paid_label")} value={fmt(s.totalPaid)} color="#FFDD64" bold />
        <MetricRow label={t("net_incentive_position")} value={fmt(s.netPosition)} color="#08dc7d" bold />
      </div>

      {s.discrepancy && (
        <div className="lg:col-span-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex items-center gap-2">
          ⚠ {t("discrepancy_flag")}
        </div>
      )}
    </div>
  );
}