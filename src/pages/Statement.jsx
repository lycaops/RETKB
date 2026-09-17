import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import StatementPreview from "@/components/statement/StatementPreview";
import { useApp } from "@/lib/AppContext";
import { exportStatementPDF } from "@/lib/pdfExport";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

export default function Statement() {
  const { t, lang, selectedRetailer, setLang } = useApp();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handlePDF = async () => {
    if (!previewRef.current || !selectedRetailer) return;
    setExporting(true);
    try {
      const id = (selectedRetailer["RETAILER ID"] || selectedRetailer.retailerId || "retailer");
      await exportStatementPDF(previewRef.current, id, lang);
    } finally {
      setExporting(false);
    }
  };

  if (!selectedRetailer) {
    return (
      <Layout>
        <div className="p-8 max-w-3xl mx-auto text-center">
          <h2 className="text-lg font-semibold text-slate-700">{t("no_data_title")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("no_data_desc")}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "#21264e" }}
          >
            {t("go_to_dashboard")}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> {t("back_to_dashboard")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "it" : "en")}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              {t("change_language")}: {lang === "en" ? "EN" : "IT"}
            </button>
            <button
              onClick={handlePDF}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "#08dc7d" }}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? t("downloading") : t("generate_pdf")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <StatementPreview ref={previewRef} row={selectedRetailer} />
        </div>
      </div>
    </Layout>
  );
}