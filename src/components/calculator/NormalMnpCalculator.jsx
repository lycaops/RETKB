import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useApp } from "@/lib/AppContext";
import { calcNormalMnp, getTierLabel } from "@/lib/calculatorLogic";
import { Input } from "@/components/ui/input";

function fmt(n) { return `€${n.toFixed(2)}`; }

const NormalMnpCalculator = forwardRef(function NormalMnpCalculator({ onResult }, ref) {
  const { lang } = useApp();
  const [qtyLTE, setQtyLTE] = useState(0);
  const [qtyGT, setQtyGT] = useState(0);
  const [garaPremium, setGaraPremium] = useState(0);
  const [garaOther, setGaraOther] = useState(0);
  const [withRecharge, setWithRecharge] = useState(false);
  const [withMargin, setWithMargin] = useState(true);
  const [result, setResult] = useState(null);

  const total = (Number(qtyLTE) || 0) + (Number(qtyGT) || 0);
  const garaEligible = total >= 15;
  const calculate = () => {
    const nextResult = calcNormalMnp(Number(qtyLTE) || 0, Number(qtyGT) || 0, Number(garaPremium) || 0, Number(garaOther) || 0, withRecharge, withMargin);
    setResult(nextResult);
    onResult?.(nextResult);
  };

  useImperativeHandle(ref, () => ({ calculate }), [calculate]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{lang === "it" ? "Inserisci il numero di MNP port-in per ogni fascia di piano. GARA richiede 15+ totali." : "Enter the number of MNP port-ins for each plan tier. GARA requires 15+ total."}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "MNP Piani ≤ €6,99" : "MNP Plans ≤ €6.99"}</label>
          <Input type="number" min="0" value={qtyLTE} onChange={(e) => setQtyLTE(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "MNP Piani > €6,99" : "MNP Plans > €6.99"}</label>
          <Input type="number" min="0" value={qtyGT} onChange={(e) => setQtyGT(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3 flex-wrap">
        <span className="text-slate-500">{lang === "it" ? "Totale Port-In:" : "Total Port-Ins:"}</span>
        <span className="font-bold text-slate-800">{total}</span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-500">{lang === "it" ? "Fascia:" : "Tier:"}</span>
        <span className="font-bold text-[#08dc7d]">{total > 0 ? getTierLabel(total) : "—"}</span>
        {garaEligible && <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{lang === "it" ? "GARA SBLOCCATO" : "GARA UNLOCKED"}</span>}
      </div>
      {garaEligible && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Operatori Premium (+€40)" : "Premium Operators (+€40)"}</label>
            <Input type="number" min="0" value={garaPremium} onChange={(e) => setGaraPremium(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Altri MNO/MVNO (+€20)" : "Other MNO/MVNO (+€20)"}</label>
            <Input type="number" min="0" value={garaOther} onChange={(e) => setGaraOther(e.target.value)} className="mt-1" />
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={withRecharge} onChange={(e) => setWithRecharge(e.target.checked)} className="rounded" />
        {lang === "it" ? "Includi Cashback Ricarica Automatica" : "Include Auto Recharge Cashback"}
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={withMargin} onChange={(e) => setWithMargin(e.target.checked)} className="rounded" />
        {lang === "it" ? "Margine SIM (€5/SIM)" : "SIM Margin (€5/SIM)"}
      </label>
      <p className="text-xs text-amber-600 rounded-md bg-amber-50 border-l-4 border-amber-400 p-2.5">{lang === "it" ? "⏱ Gli incentivi MNP vengono accreditati dopo 60 giorni, con uso continuativo e rinnovo (minimo 6 mesi)." : "⏱ MNP incentives are credited after 60 days, subject to continuous use & renewal (minimum 6 months)."}</p>
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          {result.garaError ? (
            <p className="text-sm text-red-500">⚠ {lang === "it" ? `Conteggio operatori GARA (${result.garaError.garaSum}) ≠ Totale MNP (${result.garaError.totalMnp}). Devono essere uguali.` : `GARA operator count (${result.garaError.garaSum}) ≠ Total MNP (${result.garaError.totalMnp}). They must be equal.`}</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{lang === "it" ? "Riepilogo Guadagni" : "Earnings Breakdown"}</p>
              {result.stdLTE > 0 && <div className="flex justify-between text-sm"><span>MNP ≤€6.99 ({qtyLTE} × €{result.rateLTE})</span><span className="font-semibold text-emerald-600">{fmt(result.stdLTE)}</span></div>}
              {result.stdGT > 0 && <div className="flex justify-between text-sm"><span>MNP &gt;€6.99 ({qtyGT} × €{result.rateGT})</span><span className="font-semibold text-blue-600">{fmt(result.stdGT)}</span></div>}
              {result.garaPremTotal > 0 && <div className="flex justify-between text-sm"><span>{lang === "it" ? "GARA Premium" : "GARA Premium"} ({garaPremium} × €40)</span><span className="font-semibold text-emerald-600">{fmt(result.garaPremTotal)}</span></div>}
              {result.garaOthTotal > 0 && <div className="flex justify-between text-sm"><span>{lang === "it" ? "GARA Altri" : "GARA Other"} ({garaOther} × €20)</span><span className="font-semibold text-blue-600">{fmt(result.garaOthTotal)}</span></div>}
              {!result.garaEligible && <div className="flex justify-between text-sm opacity-50"><span>{lang === "it" ? "GARA Extra Boost" : "GARA Extra Boost"} — {lang === "it" ? "min. 15 MNP non raggiunto" : "min. 15 MNP not reached"}</span><span className="text-slate-400">€0</span></div>}
              {withRecharge && <div className="flex justify-between text-sm"><span>{lang === "it" ? "Cashback Ricarica Automatica" : "Auto Recharge Cashback"}</span><span className="font-semibold text-amber-600">{fmt(result.rechargeTotal)}</span></div>}
              <div className="flex justify-between text-sm"><span>{lang === "it" ? "Margine SIM" : "SIM Margin"} ({result.totalMnp} × €5)</span><span className="font-semibold text-slate-600">{withMargin ? fmt(result.simMarginTotal) : "€0"}</span></div>
              <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="font-semibold text-slate-700">{lang === "it" ? "Guadagni Totali" : "Total Earnings"}</span><span className="text-xl font-bold text-emerald-600">{fmt(result.grand)}</span></div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default NormalMnpCalculator;