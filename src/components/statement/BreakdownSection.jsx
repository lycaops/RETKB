import React from "react";
import { useApp } from "@/lib/AppContext";
import { formatCurrency } from "@/lib/csvUtils";

const TYPE_COLORS = {
  credit: { bg: "#e3faf0", text: "#087a4a", label: "credit" },
  deduction: { bg: "#fdeae3", text: "#b04a30", label: "deduction" },
  refund: { bg: "#e6f1fd", text: "#006AE0", label: "refund" },
  payment: { bg: "#eef0f7", text: "#21264e", label: "payment" },
  info: { bg: "#f0e9f7", text: "#46286e", label: "info" },
};

export default function BreakdownSection({ statement }) {
  const { t, lang } = useApp();
  const fmt = (v) => formatCurrency(v, lang);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3" style={{ backgroundColor: "#21264e" }}>
        <h3 className="text-sm font-semibold text-white">{t("detailed_breakdown")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">{t("component")}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t("amount")}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t("type")}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t("explanation")}</th>
            </tr>
          </thead>
          <tbody>
            {statement.breakdown.map((c, i) => {
              const tc = TYPE_COLORS[c.type] || TYPE_COLORS.info;
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.label}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(c.amount)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center justify-center text-center rounded-full text-xs font-medium" style={{ backgroundColor: tc.bg, color: tc.text, padding: "2px 12px" }}>
                      {t(tc.label)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-md">{c.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}