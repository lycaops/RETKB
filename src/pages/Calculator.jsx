import React, { useRef, useState } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/lib/AppContext";
import { Button } from "@/components/ui/button";
import SpecialNewCalculator from "@/components/calculator/SpecialNewCalculator";
import NormalNewCalculator from "@/components/calculator/NormalNewCalculator";
import NormalMnpCalculator from "@/components/calculator/NormalMnpCalculator";

export default function Calculator() {
  const { lang, scheme, setScheme } = useApp();
  const newCalculatorRef = useRef(null);
  const mnpCalculatorRef = useRef(null);
  const [estimateResults, setEstimateResults] = useState({ newActivations: null, mnp: null });
  const [withRecharge, setWithRecharge] = useState(false);
  const [withMargin, setWithMargin] = useState(true);

  const updateEstimate = (key, result) => {
    setEstimateResults((current) => ({ ...current, [key]: result }));
  };

  const generateEstimate = () => {
    newCalculatorRef.current?.calculate();
    mnpCalculatorRef.current?.calculate();
  };

  const totalEstimate = [estimateResults.newActivations, estimateResults.mnp]
    .filter(Boolean)
    .reduce((total, result) => total + (result.grand || 0), 0);
  const hasEstimate = Boolean(estimateResults.newActivations || estimateResults.mnp);

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: "#21264e" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{lang === "it" ? "Calcolatore Incentivi" : "Incentive Calculator"}</h1>
              <p className="text-sm text-white/70 mt-1">
                {lang === "it" ? "Stima incentivi Nuove Attivazioni e MNP Port-In sulla stessa pagina." : "Estimate New Activation & MNP Port-In incentives on the same page."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/20">
              <button
                onClick={() => {
                  setScheme("special");
                  setEstimateResults({ newActivations: null, mnp: null });
                }}
                className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                  scheme === "special"
                    ? "bg-[#08dc7d] text-[#21264e]"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {lang === "it" ? "Speciale" : "Special"}
              </button>
              <button
                onClick={() => {
                  setScheme("normal");
                  setEstimateResults({ newActivations: null, mnp: null });
                }}
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
          <p className="text-xs text-white/50 mt-3">
            {lang === "it"
              ? `Schema Selezionato: ${scheme === "special" ? "Speciale" : "Normale"}`
              : `Selected Scheme: ${scheme === "special" ? "Special" : "Normal"}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006AE0]" />
              {lang === "it" ? "Nuove Attivazioni" : "New Activations"}
            </h2>
            {scheme === "special" ? (
              <SpecialNewCalculator ref={newCalculatorRef} withRecharge={withRecharge} withMargin={withMargin} onResult={(result) => updateEstimate("newActivations", result)} />
            ) : (
              <NormalNewCalculator ref={newCalculatorRef} withRecharge={withRecharge} withMargin={withMargin} showResult={false} onResult={(result) => updateEstimate("newActivations", result)} />
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#08dc7d]" />
              MNP Port-In
            </h2>
            <NormalMnpCalculator ref={mnpCalculatorRef} withRecharge={withRecharge} withMargin={withMargin} showResult={false} onResult={(result) => updateEstimate("mnp", result)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">{lang === "it" ? "Opzioni comuni" : "Shared Options"}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={withRecharge} onChange={(e) => setWithRecharge(e.target.checked)} className="rounded" />
              {lang === "it" ? "Includi Cashback Ricarica Automatica" : "Include Auto Recharge Cashback"}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={withMargin} onChange={(e) => setWithMargin(e.target.checked)} className="rounded" />
              {lang === "it" ? "Margine SIM (€5/SIM)" : "SIM Margin (€5/SIM)"}
            </label>
          </div>
        </div>

        {hasEstimate && (
          <div className="rounded-xl border border-[#08dc7d]/40 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {lang === "it" ? "Riepilogo Guadagni" : "Earnings Summary"}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>{lang === "it" ? "Nuove Attivazioni" : "New Activations"}</span><span className="font-semibold">€{(estimateResults.newActivations?.grand || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>MNP Port-In</span><span className="font-semibold">€{(estimateResults.mnp?.grand || 0).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-emerald-200 pt-2"><span className="font-semibold text-slate-700">{lang === "it" ? "Guadagni Totali" : "Total Earnings"}</span><span className="text-2xl font-bold text-emerald-600">€{totalEstimate.toFixed(2)}</span></div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={generateEstimate}
            className="w-full max-w-md text-base font-semibold"
            style={{ backgroundColor: "#08dc7d", color: "#21264e" }}
          >
            {lang === "it" ? "Genera Stima Totale" : "Generate Total Estimate"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
