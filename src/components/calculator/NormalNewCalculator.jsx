import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useApp } from "@/lib/AppContext";
import { calcNormalNew, getTierLabel } from "@/lib/calculatorLogic";
import { Input } from "@/components/ui/input";

function fmt(n) { return `€${n.toFixed(2)}`; }

const NormalNewCalculator = forwardRef(function NormalNewCalculator({ onResult, withRecharge = false, withMargin = true, showResult = true }, ref) {
  const { lang } = useApp();
  const [qtyLTE, setQtyLTE] = useState(0);
  const [qtyGT, setQtyGT] = useState(0);
  const [result, setResult] = useState(null);

  const total = (Number(qtyLTE) || 0) + (Number(qtyGT) || 0);
  const calculate = () => {
    const nextResult = calcNormalNew(Number(qtyLTE) || 0, Number(qtyGT) || 0, withRecharge, withMargin);
    setResult(nextResult);
    onResult?.(nextResult);
  };

  useImperativeHandle(ref, () => ({ calculate }), [calculate]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{lang === "it" ? "Inserisci il numero di nuove attivazioni per ogni fascia di piano. La fascia è determinata dal totale combinato." : "Enter the number of new activations for each plan tier. The tier is determined by total activations combined."}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Piani ≤ €6,99" : "Plans ≤ €6.99"}</label>
          <Input type="number" min="0" value={qtyLTE} onChange={(e) => setQtyLTE(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Piani > €6,99" : "Plans > €6.99"}</label>
          <Input type="number" min="0" value={qtyGT} onChange={(e) => setQtyGT(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
        <span className="text-slate-500">{lang === "it" ? "Totale Attivazioni:" : "Total Activations:"}</span>
        <span className="font-bold text-slate-800">{total}</span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-500">{lang === "it" ? "Fascia:" : "Tier:"}</span>
        <span className="font-bold text-[#08dc7d]">{total > 0 ? getTierLabel(total) : "—"}</span>
      </div>
      {showResult && result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{lang === "it" ? "Riepilogo Guadagni" : "Earnings Breakdown"}</p>
          {result.totalLTE > 0 && <div className="flex justify-between text-sm"><span>{lang === "it" ? "Bonus ≤ €6,99" : "≤ €6.99 Bonus"} ({qtyLTE} × €{result.rateLTE})</span><span className="font-semibold text-emerald-600">{fmt(result.totalLTE)}</span></div>}
          {result.totalGT > 0 && <div className="flex justify-between text-sm"><span>{lang === "it" ? "Bonus > €6,99" : "> €6.99 Bonus"} ({qtyGT} × €{result.rateGT})</span><span className="font-semibold text-blue-600">{fmt(result.totalGT)}</span></div>}
          {withRecharge && <div className="flex justify-between text-sm"><span>{lang === "it" ? "Cashback Ricarica Automatica" : "Auto Recharge Cashback"}</span><span className="font-semibold text-amber-600">{fmt(result.rechargeTotal)}</span></div>}
          {withMargin && <div className="flex justify-between text-sm"><span>{lang === "it" ? "Margine SIM" : "SIM Margin"} ({result.total} × €5)</span><span className="font-semibold text-slate-600">{fmt(result.simMarginTotal)}</span></div>}
          <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="font-semibold text-slate-700">{lang === "it" ? "Guadagni Totali" : "Total Earnings"}</span><span className="text-xl font-bold text-emerald-600">{fmt(result.grand)}</span></div>
        </div>
      )}
    </div>
  );
});

export default NormalNewCalculator;