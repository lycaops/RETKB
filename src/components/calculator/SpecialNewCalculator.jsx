import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { calcSpecialNew, SPECIAL_PLAN_BONUSES } from "@/lib/calculatorLogic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function fmt(n) { return `€${n.toFixed(2)}`; }

export default function SpecialNewCalculator() {
  const { lang } = useApp();
  const [entries, setEntries] = useState([{ bonus: "3.00", qty: "" }]);
  const [t1, setT1] = useState(0);
  const [t2, setT2] = useState(0);
  const [result, setResult] = useState(null);

  const updateEntry = (i, field, val) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));
  };
  const addEntry = () => {
    if (entries.length >= 5) return;
    setEntries([...entries, { bonus: "3.00", qty: "" }]);
  };
  const removeEntry = (i) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, idx) => idx !== i));
  };

  const calculate = () => {
    const parsed = entries.map((e) => ({ bonus: Number(e.bonus) || 0, qty: Number(e.qty) || 0 }));
    setResult(calcSpecialNew(parsed, Number(t1) || 0, Number(t2) || 0));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{lang === "it" ? "Calcola i guadagni totali dalle nuove attivazioni e dai bonus rinnovo." : "Calculate your total earnings from new activations and renewal bonuses."}</p>

      {entries.map((e, i) => (
        <div key={i} className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-6">
            <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Piano" : "Plan"}</label>
            <select value={e.bonus} onChange={(ev) => updateEntry(i, "bonus", ev.target.value)} className="w-full mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm">
              {SPECIAL_PLAN_BONUSES.map((p) => (<option key={p.plan} value={p.bonus}>€{p.plan.toFixed(2)} → €{p.bonus.toFixed(2)}</option>))}
            </select>
          </div>
          <div className="col-span-4">
            <label className="text-xs text-slate-500 uppercase tracking-wide">{lang === "it" ? "Attivazioni" : "Activations"}</label>
            <Input type="number" min="0" value={e.qty} onChange={(ev) => updateEntry(i, "qty", ev.target.value)} placeholder="0" className="mt-1" />
          </div>
          <div className="col-span-2 flex justify-end">
            {entries.length > 1 && (<Button variant="ghost" size="sm" onClick={() => removeEntry(i)} className="text-red-500">{lang === "it" ? "Rimuovi" : "Remove"}</Button>)}
          </div>
        </div>
      ))}

      {entries.length < 5 && (<Button variant="outline" size="sm" onClick={addEntry}>+ {lang === "it" ? "Aggiungi Piano" : "Add Plan"}</Button>)}

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">T1 {lang === "it" ? "Rinnovi Idonei" : "Eligible Renewals"}</label>
          <Input type="number" min="0" value={t1} onChange={(e) => setT1(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wide">T2 {lang === "it" ? "Rinnovi Idonei" : "Eligible Renewals"}</label>
          <Input type="number" min="0" value={t2} onChange={(e) => setT2(e.target.value)} className="mt-1" />
        </div>
      </div>

      <Button onClick={calculate} className="w-full" style={{ backgroundColor: "#08dc7d", color: "#21264e" }}>{lang === "it" ? "Calcola Guadagni" : "Calculate Earnings"}</Button>

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{lang === "it" ? "Riepilogo Guadagni" : "Earnings Breakdown"}</p>
          {result.actRows.map((r, i) => (
            <div key={i} className="flex justify-between text-sm"><span>{lang === "it" ? "Bonus Attivazione" : "Activation Bonus"} ({r.qty} × €{r.bonus.toFixed(2)})</span><span className="font-semibold text-emerald-600">{fmt(r.amount)}</span></div>
          ))}
          {result.t1Used > 0 && (<div className="flex justify-between text-sm"><span>T1 {lang === "it" ? "Bonus Rinnovo" : "Renewal Bonus"} ({result.t1Used} × €4)</span><span className="font-semibold text-blue-600">{fmt(result.t1Total)}</span></div>)}
          {result.t2Used > 0 && (<div className="flex justify-between text-sm"><span>T2 {lang === "it" ? "Bonus Rinnovo" : "Renewal Bonus"} ({result.t2Used} × €4)</span><span className="font-semibold text-amber-600">{fmt(result.t2Total)}</span></div>)}
          {result.t1Hint && (<p className="text-xs text-red-500">⚠ T1 {lang === "it" ? "non idoneo" : "not eligible"} — {result.t1Hint.pct}% ({lang === "it" ? "min" : "min"} {result.t1Hint.min})</p>)}
          {result.t2Hint && (<p className="text-xs text-red-500">⚠ T2 {lang === "it" ? "non idoneo" : "not eligible"} — {result.t2Hint.pct}% ({lang === "it" ? "min" : "min"} {result.t2Hint.min})</p>)}
          <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="font-semibold text-slate-700">{lang === "it" ? "Guadagni Totali" : "Total Earnings"}</span><span className="text-xl font-bold text-emerald-600">{fmt(result.grand)}</span></div>
        </div>
      )}
    </div>
  );
}