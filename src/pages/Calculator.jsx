import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useApp } from "@/lib/AppContext";
import SpecialNewCalculator from "@/components/calculator/SpecialNewCalculator";
import NormalNewCalculator from "@/components/calculator/NormalNewCalculator";
import NormalMnpCalculator from "@/components/calculator/NormalMnpCalculator";

export default function Calculator() {
  const { lang, scheme } = useApp();
  const [tab, setTab] = useState("new");

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: "#21264e" }}>
          <h1 className="text-xl font-bold text-white">{lang === "it" ? "Calcolatore Incentivi" : "Incentive Calculator"}</h1>
          <p className="text-sm text-white/70 mt-1">
            {lang === "it" ? `Schema ${scheme === "special" ? "Speciale" : "Normale"}` : `${scheme === "special" ? "Special" : "Normal"} Scheme`}
            {" — "}
            {lang === "it" ? "stimata incentivi" : "estimate incentive"}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTab("new")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "new" ? "bg-[#21264e] text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{lang === "it" ? "Nuove Attivazioni" : "New Activations"}</button>
          <button onClick={() => setTab("mnp")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "mnp" ? "bg-[#21264e] text-white" : "bg-white text-slate-600 border border-slate-200"}`}>MNP Port-In</button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {scheme === "special" ? (
            tab === "new" ? <SpecialNewCalculator /> : <NormalMnpCalculator />
          ) : (
            tab === "new" ? <NormalNewCalculator /> : <NormalMnpCalculator />
          )}
        </div>
      </div>
    </Layout>
  );
}