import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatCurrency, formatPercent } from "@/lib/csvUtils";

function Gauge({ pct }) {
  const v = pct === null ? 0 : Math.min(100, Math.max(0, pct));
  const color = v >= 90 ? "#08dc7d" : v >= 70 ? "#FFDD64" : "#ffc8b2";
  return (
    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, backgroundColor: color }} />
    </div>
  );
}

export function UsageSection({ statement }) {
  const { t, lang } = useApp();
  const u = statement.performance.usage;
  const fmt = (v) => (v === null ? "—" : formatCurrency(v, lang));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ borderLeft: "3px solid #00D7FF", paddingLeft: 8 }}>
        {t("usage_analysis")}
      </h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">{t("usage_percentage")}</span>
            <span className="font-semibold text-slate-800">{formatPercent(u.usagePct)}</span>
          </div>
          <Gauge pct={u.usagePct} />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">{t("usage_clawback")}</p>
            <p className="text-lg font-bold text-[#b04a30] mt-0.5">{fmt(u.usageClawback)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">{t("usage_refund")}</p>
            <p className="text-lg font-bold text-[#006AE0] mt-0.5">{fmt(u.usageRefund)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortOutSection({ statement }) {
  const { t, lang } = useApp();
  const p = statement.performance.portout;
  const fmt = (v) => (v === null ? "—" : formatCurrency(v, lang));
  const nfmt = (v) => (v === null ? "—" : v);
  const pctfmt = (v) => (v === null ? "—" : `${v.toFixed(1)}%`);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ borderLeft: "3px solid #46286e", paddingLeft: 8 }}>
        {t("portout_analysis")}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">{t("total_portouts")}</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{nfmt(p.totalPortouts)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">{t("portout_deduction")}</p>
          <p className="text-lg font-bold text-[#b04a30] mt-0.5">{fmt(p.portoutDeduction)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">Fake port out %</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{pctfmt(p.fakePortOutPct)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">{t("financial_impact")}</p>
    </div>
  );
}