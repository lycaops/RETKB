import React from "react";
import { useApp } from "@/lib/AppContext";
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";

const SEV_STYLE = {
  positive: { icon: TrendingUp, bg: "#e3faf0", text: "#087a4a", label: "positive" },
  negative: { icon: TrendingDown, bg: "#fdeae3", text: "#b04a30", label: "negative" },
  warning: { icon: AlertTriangle, bg: "#fff7e0", text: "#a07020", label: "warning" },
  info: { icon: Info, bg: "#eef0f7", text: "#46286e", label: "info_insight" },
};

export default function InsightsSection({ statement }) {
  const { t } = useApp();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{t("automated_analysis")}</h3>
      <p className="text-xs text-slate-500 mb-4">{t("insights_desc")}</p>
      <div className="space-y-2">
        {statement.insights.map((ins, i) => {
          const st = SEV_STYLE[ins.severity] || SEV_STYLE.info;
          const Icon = st.icon;
          return (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: st.bg }}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: st.text }} />
              <div>
                <span className="text-xs font-semibold uppercase mr-2" style={{ color: st.text }}>{t(st.label)}</span>
                <span className="text-sm text-slate-700">{ins.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}