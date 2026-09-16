import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatCurrency, formatPercent } from "@/lib/csvUtils";

function RenewalBar({ rate, threshold }) {
  if (rate === null) return null;
  const pct = Math.min(Math.max(rate, 0), 100);
  const achieved = threshold !== null && rate >= threshold;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: achieved ? "#08dc7d" : "#fbbf24" }}
        />
        {threshold !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
            style={{ left: `${Math.min(threshold, 100)}%` }}
            title={`Threshold ${threshold}%`}
          />
        )}
      </div>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: achieved ? "#087a4a" : "#b45309" }}>
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const map = {
    eligible: { bg: "#e3faf0", text: "#087a4a", label: t("eligible") },
    not_eligible: { bg: "#fdeae3", text: "#b04a30", label: t("not_eligible") },
    achieved: { bg: "#e3faf0", text: "#087a4a", label: t("threshold_achieved") },
    not_achieved: { bg: "#fdeae3", text: "#b04a30", label: t("threshold_not_achieved") },
    unknown: { bg: "#eef0f7", text: "#64748b", label: t("insufficient_data") },
  };
  const m = map[status] || map.unknown;
  return <span className="inline-flex items-center justify-center text-center rounded-full text-xs font-medium" style={{ backgroundColor: m.bg, color: m.text, padding: "2px 12px" }}>{m.label}</span>;
}

function RenewalRow({ label, rate, threshold, bonus, status, t, lang }) {
  const cfmt = (v) => (v === null ? "—" : formatCurrency(v, lang));
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2.5 font-medium text-slate-700">{label}</td>
      <td className="px-4 py-2.5 text-slate-800 font-semibold align-top">
        {formatPercent(rate)}
        <RenewalBar rate={rate} threshold={threshold} />
      </td>
      <td className="px-4 py-2.5 text-slate-500 text-xs">{threshold ? `≥ ${threshold}%` : "—"}</td>
      <td className="px-4 py-2.5 text-slate-800 font-semibold">{cfmt(bonus)}</td>
      <td className="px-4 py-2.5"><StatusBadge status={status} t={t} /></td>
    </tr>
  );
}

export default function RenewalSection({ statement }) {
  const { t, lang } = useApp();
  const r = statement.performance.renewal;
  const e = statement.eligibility;
  const isSpecial = statement.scheme === "special";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ borderLeft: "3px solid #08dc7d", paddingLeft: 8 }}>
        {t("renewal_analysis")}
      </h3>

      {isSpecial ? (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-xs text-slate-500 uppercase">
              <th className="text-left px-4 py-2 font-medium">{t("component")}</th>
              <th className="text-left px-4 py-2 font-medium">{t("renewal_rate")}</th>
              <th className="text-left px-4 py-2 font-medium">{t("threshold")}</th>
              <th className="text-left px-4 py-2 font-medium">{t("amount")}</th>
              <th className="text-left px-4 py-2 font-medium">{t("eligible")}</th>
            </tr>
          </thead>
          <tbody>
            <RenewalRow label={t("t1_renewal")} rate={r.t1RenewalRate} threshold={e.t1Threshold} bonus={r.t1Bonus} status={e.t1Status} t={t} lang={lang} />
            <RenewalRow label={t("t2_renewal")} rate={r.t2RenewalRate} threshold={e.t2Threshold} bonus={r.t2Bonus} status={e.t2Status} t={t} lang={lang} />
            <RenewalRow label={t("t3_renewal_bonus")} rate={null} threshold={null} bonus={r.t3Bonus} status="unknown" t={t} lang={lang} />
          </tbody>
        </table>
      ) : (
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: "#f0e9f7" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500">{t("renewal_pct_standard_scheme")}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{formatPercent(r.newActRenewalRate)}</p>
              <RenewalBar rate={r.newActRenewalRate} threshold={30} />
              <p className="text-xs text-slate-500 mt-2">{t("renewal_threshold_label")}: 30%</p>
            </div>
            <div className="text-right shrink-0">
              {r.newActRenewalRate === null ? (
                <StatusBadge status="unknown" t={t} />
              ) : r.newActRenewalRate < 30 ? (
                <span className="inline-flex items-center justify-center text-center rounded-full text-sm font-semibold" style={{ backgroundColor: "#fdeae3", color: "#b04a30", padding: "6px 14px" }}>
                  {t("reduced_rate_applies")}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center text-center rounded-full text-sm font-semibold" style={{ backgroundColor: "#e3faf0", color: "#087a4a", padding: "6px 14px" }}>
                  {t("standard_rate")}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">{t("renewal_rate")} — {t("new_activations")}</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{formatPercent(r.newActRenewalRate)}</p>
          <RenewalBar rate={r.newActRenewalRate} threshold={e.nationalMin} />
          <div className="mt-1"><StatusBadge status={e.nationalRenewalStatus} t={t} /></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">{t("renewal_rate")} — {t("portin")}</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{formatPercent(r.portinRenewalRate)}</p>
          <RenewalBar rate={r.portinRenewalRate} threshold={e.portinMin} />
          <div className="mt-1"><StatusBadge status={e.portinRenewalStatus} t={t} /></div>
        </div>
      </div>
    </div>
  );
}