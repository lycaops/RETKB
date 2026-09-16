import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatNumber, formatCurrency, formatPercent, normalizePercent } from "@/lib/csvUtils";

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

export default function ActivationSection({ statement }) {
  const { t, lang } = useApp();
  const a = statement.performance.activation;
  const nfmt = (v) => (v === null ? "—" : formatNumber(v, lang));
  const cfmt = (v) => (v === null ? "—" : formatCurrency(v, lang));
  const pfmt = (v) => formatPercent(normalizePercent(v));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ borderLeft: "3px solid #006AE0", paddingLeft: 8 }}>
        {t("activation_analysis")}
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("act_sub_new_activations")}</p>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label={t("past_month_total_activations")} value={nfmt(a.newActCount)} />
            <MiniStat label={t("renewal_out_of_past_month")} value={nfmt(a.newActRenewals)} />
            <MiniStat label={t("new_activation_renewal_pct")} value={pfmt(a.newActivations)} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("act_sub_portin")}</p>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label={t("portin_count")} value={nfmt(a.portinCount)} />
            <MiniStat label={t("portin_renewals")} value={nfmt(a.portinRenewals)} />
            <MiniStat label={t("portin_renewal_pct")} value={formatPercent(a.portinRenewalRate)} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("act_sub_bundle")}</p>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label={t("total_sim_activation_past_month")} value={nfmt(a.totalBundleAct)} />
            <MiniStat label={t("minimum_usage_not_met")} value={nfmt(a.bundleNotEligible)} />
            <MiniStat label={t("usage_percentage")} value={formatPercent(statement.performance.usage.usagePct)} />
          </div>
        </div>
      </div>
    </div>
  );
}