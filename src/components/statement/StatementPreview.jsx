import React, { forwardRef } from "react";
import { useApp } from "@/lib/AppContext";
import { buildRetailerStatement } from "@/lib/analysis";
import SummarySection from "./SummarySection";
import BreakdownSection from "./BreakdownSection";
import ActivationSummarySection from "./ActivationSummarySection";
import ActivationSection from "./ActivationSection";
import RenewalSection from "./RenewalSection";
import { UsageSection, PortOutSection } from "./UsagePortOutSection";
import InsightsSection from "./InsightsSection";
import StatementCharts from "./StatementCharts";

const LOGO_URL = "/logo.png";

function SectionTitle({ children, color }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <span className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
      <h2 className="text-base font-bold text-slate-800">{children}</h2>
    </div>);

}

const StatementPreview = forwardRef(({ row }, ref) => {
  const { t, lang, scheme } = useApp();
  const statement = buildRetailerStatement(row, lang, scheme);
  const today = new Date().toLocaleDateString(lang === "it" ? "it-IT" : "en-GB");

  return (
    <div ref={ref} className="bg-white" style={{ width: "100%" }}>
      {/* Section 1: header + summary + breakdown (first page) */}
      <div data-pdf-section>
        <div className="px-8 py-6 flex items-center justify-between" style={{ backgroundColor: "#21264e" }}>
          <img src="/logo.png" alt="Logo" crossOrigin="anonymous" className="h-9" />
          <div className="text-right text-white">
            <p className="text-xs uppercase tracking-widest text-white/60">{t("appSubtitle")}</p>
            <p className="text-sm font-semibold">{t("retailer_incentive_statement")}</p>
          </div>
        </div>
        <div className="px-8 py-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
            <InfoBlock label={t("retailer_id")} value={statement.retailerId} />
            <InfoBlock label="ACCMGRID" value={statement.accmgId} />
            <InfoBlock label="HOTSPOTID" value={statement.hotspotId} />
            <InfoBlock label={t("statement_period")} value={statement.month} />
            <InfoBlock label={t("scheme_type")} value={scheme === "special" ? t("scheme_special") : t("scheme_normal")} />
          </div>
          <p className="text-xs text-slate-400 mb-4">{t("generation_date")}: {today}</p>
          <SectionTitle color="#21264e">{t("activation_summary")}</SectionTitle>
          <ActivationSummarySection statement={statement} />
          <SectionTitle color="#21264e">{t("incentive_summary")}</SectionTitle>
          <SummarySection statement={statement} />
          <SectionTitle color="#006AE0">{t("detailed_breakdown")}</SectionTitle>
          <BreakdownSection statement={statement} />
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Section 2: activation + renewal + usage + port-out (same page) */}
        <div data-pdf-section>
          <SectionTitle color="#006AE0">{t("activation_analysis")}</SectionTitle>
          <ActivationSection statement={statement} />
          <SectionTitle color="#08dc7d">{t("renewal_analysis")}</SectionTitle>
          <RenewalSection statement={statement} />
          <SectionTitle color="#00D7FF">{t("usage_analysis")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UsageSection statement={statement} />
            <PortOutSection statement={statement} />
          </div>
        </div>

        {/* Section 5: charts */}
        <div data-pdf-section>
          <SectionTitle color="#46286e">{t("chart_activation_performance").replace("Activation", "Visual")}</SectionTitle>
          <StatementCharts row={row} statement={statement} />
        </div>

        {/* Section 6: insights + disclaimer + footer */}
        <div data-pdf-section>
          <SectionTitle color="#00D7FF">{t("automated_analysis")}</SectionTitle>
          <InsightsSection statement={statement} />
          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1">{t("disclaimer_title")}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{t("disclaimer_text")}</p>
            <p className="text-xs text-slate-400 mt-2">{t("data_note")}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">{t("footer_support")}: <span className="text-[#006AE0] font-medium">{t("footer_email")}</span></p>
            <img src="https://cms-assets.ldsvcplatform.com/IT/s3fs-public/2023-09/home_logo.png" alt="Logo" crossOrigin="anonymous" className="h-6" />
          </div>
        </div>
      </div>
    </div>);

});

function InfoBlock({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</p>
    </div>);

}

export default StatementPreview;