import React from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/lib/AppContext";
import { schemes as schemesMap } from "@/lib/schemeReference";

export default function SchemeReference() {
  const { t, lang, scheme, setScheme } = useApp();
  const s = schemesMap[scheme] || schemesMap.special;

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: "#21264e" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: scheme === "special" ? "#08dc7d" : "#006AE0", color: "#21264e" }}
                >
                  {scheme === "special" ? t("scheme_special") : t("scheme_normal")}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">{s.title[lang]}</h1>
              <p className="text-sm text-white/70 mt-1">{s.subtitle[lang]}</p>
              {!s.usageCheck && (
                <p className="text-xs text-[#08dc7d] mt-2 font-medium">{t("scheme_no_usage_check")}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/20">
              <button
                onClick={() => setScheme("special")}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                  scheme === "special"
                    ? "bg-[#08dc7d] text-[#21264e]"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {lang === "it" ? "Speciale" : "Special"}
              </button>
              <button
                onClick={() => setScheme("normal")}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                  scheme === "normal"
                    ? "bg-[#006AE0] text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {lang === "it" ? "Normale" : "Normal"}
              </button>
            </div>
          </div>
        </div>

        {/* Activation bonus (Special) */}
        {s.bonusAttivazione && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-3">{t("scheme_activation_bonus")}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#08a35e" }} className="text-white">
                  <th className="text-left px-4 py-2 font-medium">{lang === "it" ? "Valore Piano" : "Plan Value"}</th>
                  <th className="text-left px-4 py-2 font-medium">{lang === "it" ? "Bonus Attivazione" : "Activation Bonus"}</th>
                </tr>
              </thead>
              <tbody>
                {s.bonusAttivazione.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700 font-medium">€{r.plan.toFixed(2)}</td>
                    <td className="px-4 py-2 text-[#08dc7d] font-semibold">€{r.bonus.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Renewal bonuses (Special) */}
        {s.renewalBonuses && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-3">{t("scheme_renewal_bonuses")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.renewalBonuses.map((rb) => (
                <div key={rb.key} className="rounded-lg p-4" style={{ backgroundColor: rb.key === "t1" ? "#e6f1fd" : "#fff8e6" }}>
                  <p className="text-sm font-semibold text-slate-800">{rb.label[lang]}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: rb.key === "t1" ? "#006AE0" : "#b8860b" }}>€{rb.amount}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === "it" ? "Tasso di rinnovo" : "Renewal rate"} &gt; {rb.threshold}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MNP / Activation commission */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-3">{t("scheme_mnp_commission")}</h2>
          {s.compensiMNP.plans ? (
            <div className="space-y-4">
              {s.compensiMNP.plans.map((plan, pi) => (
                <div key={pi}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{plan.planLabel[lang]}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#21264e" }} className="text-white">
                        {s.compensiMNP.headers[lang].map((h, i) => (
                          <th key={i} className="text-left px-4 py-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {plan.rows.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-700">{r.type[lang]}</td>
                          {r.values.map((v, j) => (
                            <td key={j} className="px-4 py-2 text-[#08dc7d] font-semibold">€{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#21264e" }} className="text-white">
                  {s.compensiMNP.headers[lang].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.compensiMNP.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{r.type[lang]}</td>
                    {r.values.map((v, j) => (
                      <td key={j} className="px-4 py-2 text-[#08dc7d] font-semibold">€{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* GARA */}
        {s.garaBoost && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-1">{t("scheme_gara_boost")}</h2>
            <p className="text-xs text-slate-500 mb-3">{s.garaBoost.minRequirement[lang]}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.garaBoost.incentives.map((g, i) => (
                <div key={i} className="rounded-lg p-4" style={{ backgroundColor: i === 0 ? "#e3faf0" : "#eef0f7" }}>
                  <p className="text-2xl font-bold" style={{ color: i === 0 ? "#087a4a" : "#006AE0" }}>+€{g.amount}</p>
                  <p className="text-xs text-slate-600 mt-1">{g.carriers[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            {lang === "it" ? "Soglie di Rinnovo" : "Renewal Thresholds"}
          </h2>
          <div className={`grid grid-cols-2 ${scheme === "special" ? "md:grid-cols-4" : "md:grid-cols-2"} gap-3 text-sm`}>
            <Threshold label={lang === "it" ? "Rinnovo Nazionale min." : "National Renewal min."} value={`${s.renewalThresholds.nationalRenewalMin}%`} />
            <Threshold label={lang === "it" ? "Rinnovo Port-in min." : "Port-in Renewal min."} value={`${s.renewalThresholds.portinRenewalMin}%`} />
            {scheme === "special" && (
              <>
                <Threshold label="T1 Bonus" value={`> ${s.renewalThresholds.t1BonusThreshold}%`} />
                <Threshold label="T2 Bonus" value={`> ${s.renewalThresholds.t2BonusThreshold}%`} />
              </>
            )}
          </div>
        </div>

        {/* Reduced incentive table (Normal) */}
        {s.reducedIncentiveTable && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-3">{t("scheme_reduced_renewal")}</h2>
            <p className="text-xs text-slate-500 mb-3">
              {lang === "it"
                ? "Se il rinnovo nazionale (T1) è <30% o il rinnovo port-in è <50%, si applica un incentivo ridotto."
                : "If national renewal (T1) is <30% or port-in renewal is <50%, a reduced incentive applies."}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#21264e" }} className="text-white">
                  {s.reducedIncentiveTable.headers[lang].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.reducedIncentiveTable.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{r.label[lang]}</td>
                    <td className="px-4 py-2 text-[#006AE0] font-semibold">€{r.portin}</td>
                    <td className="px-4 py-2 text-[#006AE0] font-semibold">€{r.newAct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Auto recharge (Normal) */}
        {s.autoRecharge && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-2">{t("scheme_auto_recharge")}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{s.autoRecharge.desc[lang]}</p>
          </div>
        )}

        {/* Malus (Normal) */}
        {s.malus && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-2">{t("scheme_malus")}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === "it"
                ? `Malus fino al ${s.malus.maxPct}% se il tasso di rinnovo è inferiore al ${s.malus.renewalThreshold}%. Recupero totale per frode o non conformità.`
                : `Malus up to ${s.malus.maxPct}% if renewal rate is below ${s.malus.renewalThreshold}%. Full clawback for fraud or non-compliance.`}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">{t("scheme_terms")}</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {s.terms[lang].map((term, i) => (
              <li key={i} className="text-sm text-slate-600 leading-relaxed">{term}</li>
            ))}
          </ol>
        </div>
      </div>
    </Layout>
  );
}

function Threshold({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}