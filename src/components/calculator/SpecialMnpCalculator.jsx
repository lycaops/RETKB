import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { calcSpecialMnp } from "@/lib/calculatorLogic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function fmt(n) { return `\u20ac${n.toFixed(2)}`; }

export default function SpecialMnpCalculator() {
  const { lang } = useApp();
  const [planType, setPlanType] = useState("lte");
  const [count, setCount] = useState(10);
  const [garaOp, setGaraOp] = useState("40");
  const [result, setResult] = useState(null);

  const calculate = () => { setResult(calcSpecialMnp(planType, Number(count) || 0, Number(garaOp) || 0)); };

  const premiumLabel = lang === "it" ? "Premium (Iliad/Fastweb/CoopVoce/PosteMobile) +\u20ac40" : "Premium (Iliad/Fastweb/CoopVoce/PosteMobile) +\u20ac40";
  const otherLabel = lang === "it" ? "Altri MNO/MVNO +\u20ac20" : "Other MNO/MVNO +\u20ac20";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{lang === "it" ? "Calcola i guadagni MNP totali incluso incentivo normale + GARA Extra Boost." : "Calculate your total MNP earnings including normal incentive + GARA Extra Boost."}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Tipo Piano" : "Plan Type"}</label>
          <select value={planType} onChange={(e) => setPlanType(e.target.value)} className="w-full mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="lte">{lang === "it" ? "Piano \u2264 \u20ac6,99" : "Plan \u2264 \u20ac6.99"}</option>
            <option value="gt">{lang === "it" ? "Piano &gt; \u20ac6,99" : "Plan &gt; \u20ac6.99"}</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Numero Port-In" : "Number of Port-Ins"}</label>
          <Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Tipo Operatore / GARA" : "Operator / GARA Type"}</label>
        <select value={garaOp} onChange={(e) => setGaraOp(e.target.value)} className="w-full mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="40">{premiumLabel}</option>
          <option value="20">{otherLabel}</option>
        </select>
      </div>
      {Number(count) < 15 && (
        <p className="text-xs text-red-500 rounded-md bg-red-50 border border-red-200 p-2.5">
          {"\u26a0"} {lang === "it" ? "Il bonus GARA richiede un minimo di 15 attivazioni MNP al mese. GARA impostato a \u20ac0." : "GARA bonus requires a minimum of 15 MNP activations per month. GARA set to \u20ac0."}
        </p>
      )}
      <p className="text-xs text-amber-600 rounded-md bg-amber-50 border-l-4 border-amber-400 p-2.5">
        {"\u23f1"} {lang === "it" ? "Il bonus MNP viene accreditato dopo 60 giorni, con uso continuato e rinnovo (minimo 6 mesi)." : "MNP activation bonus is credited after 60 days, subject to continuous use & renewal (minimum 6 months)."}
      </p>
      <Button onClick={calculate} className="w-full" style={{ backgroundColor: "#08dc7d", color: "#21264e" }}>{lang === "it" ? "Calcola Guadagni" : "Calculate Earnings"}</Button>
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{lang === "it" ? "Riepilogo Guadagni" : "Earnings Breakdown"}</p>
          <div className="flex justify-between text-sm"><span>{lang === "it" ? "Incentivo MNP Standard" : "Standard MNP Incentive"} ({count} {"\u00d7"} {fmt(result.stdRate)}, {lang === "it" ? "fascia" : "tier"} {result.tierLabel})</span><span className="font-semibold text-emerald-600">{fmt(result.stdTotal)}</span></div>
          <div className="flex justify-between text-sm"><span>{lang === "it" ? "GARA Extra Boost" : "GARA Extra Boost"} {result.garaBonus > 0 ? `(${count} \u00d7 ${fmt(result.garaBonus)})` : `\u2014 ${lang === "it" ? "min. 15 MNP non raggiunto" : "min. 15 MNP not reached"}`}</span><span className="font-semibold text-blue-600">{result.garaBonus > 0 ? fmt(result.garaTotal) : "\u20ac0"}</span></div>
          <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="font-semibold text-slate-700">{lang === "it" ? "Guadagni Totali" : "Total Earnings"}</span><span className="text-xl font-bold text-emerald-600">{fmt(result.grand)}</span></div>
        </div>
      )}
    </div>
  );
}