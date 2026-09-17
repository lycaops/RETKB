import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatCurrency, formatNumber } from "@/lib/csvUtils";
import { Clock, Info } from "lucide-react";

function TierBadge({ label }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "#eef0f7", color: "#21264e", padding: "2px 10px" }}>
      {label}
    </span>
  );
}

function EarningsRow({ label, qty, rate, amount, lang }) {
  const cfmt = (v) => (v === null ? "—" : formatCurrency(v, lang));
  const nfmt = (v) => (v === null ? "—" : formatNumber(v, lang));
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{nfmt(qty)} × €{rate}</span>
        <span className="text-sm font-semibold text-emerald-600 w-20 text-right">{cfmt(amount)}</span>
      </div>
    </div>
  );
}

export default function ActivationSummarySection({ statement }) {
  const { t, lang } = useApp();
  const a = statement.activationSummary;
  const nfmt = (v) => (v === null ? "—" : formatNumber(v, lang));
  const cfmt = (v) => (v === null ? "—" : formatCurrency(v, lang));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ borderLeft: "3px solid #21264e", paddingLeft: 8 }}>
        {t("activation_summary")}
      </h3>

      {/* Total Activations */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg p-3" style={{ backgroundColor: "#eef0f7" }}>
          <p className="text-xs text-slate-500">{t("total_noofactivations")}</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{nfmt(a.totalActivations)}</p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: "#fdeae3" }}>
          <p className="text-xs text-slate-500">{t("blocked_noofactivations")}</p>
          <p className="text-2xl font-bold" style={{ color: "#b04a30", marginTop: 2 }}>{nfmt(a.blocked)}</p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: "#e3faf0" }}>
          <p className="text-xs text-slate-500">{t("total_eligible_activations")}</p>
          <p className="text-2xl font-bold" style={{ color: "#087a4a", marginTop: 2 }}>
            {nfmt(a.eligible)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MNP Section */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">{t("mnp_portin")}</h4>
          </div>
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">{t("portin_less_6")}</span>
              <span className="text-sm font-semibold text-slate-800">{nfmt(a.mnp.less6)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">{t("portin_great_6")}</span>
              <span className="text-sm font-semibold text-slate-800">{nfmt(a.mnp.great6)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm font-medium text-slate-700">{t("total_portins")}</span>
              <span className="text-sm font-bold text-slate-800">{nfmt(a.mnp.total)}</span>
            </div>
          </div>
          {a.mnp.total > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("portin_60_day_note")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* New Activations Section */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">{t("new_activations")}</h4>
            {a.newActivations.total > 0 && <TierBadge label={`${t("tier")} ${a.newActivations.tierLabel}`} />}
          </div>
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">{t("new_act_less_6")}</span>
              <span className="text-sm font-semibold text-slate-800">{nfmt(a.newActivations.less6)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">{t("new_act_great_6")}</span>
              <span className="text-sm font-semibold text-slate-800">{nfmt(a.newActivations.great6)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm font-medium text-slate-700">{t("total_new_activations")}</span>
              <span className="text-sm font-bold text-slate-800">{nfmt(a.newActivations.total)}</span>
            </div>
          </div>
          {statement.scheme !== "special" && a.newActivations.total > 0 && (
            <div className="rounded-md bg-emerald-50/50 border border-emerald-100 p-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">{t("earnings_by_threshold")}</p>
              <EarningsRow label={t("new_act_less_6")} qty={a.newActivations.less6} rate={a.newActivations.rateLTE} amount={a.newActivations.earningsLTE} lang={lang} />
              <EarningsRow label={t("new_act_great_6")} qty={a.newActivations.great6} rate={a.newActivations.rateGT} amount={a.newActivations.earningsGT} lang={lang} />
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-emerald-200">
                <span className="text-sm font-semibold text-slate-700">{t("total_new_act_earnings")}</span>
                <span className="text-base font-bold text-emerald-600">{cfmt(a.newActivations.earnings)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}