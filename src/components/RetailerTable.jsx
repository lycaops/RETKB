import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { getText } from "@/lib/csvUtils";
import { ArrowRight } from "lucide-react";
import IncentiveGroupBadge from "./statement/IncentiveGroupBadge";

export default function RetailerTable({ onSelect, records: recs }) {
  const { t, setSelectedRetailer, records: ctxRecords } = useApp();
  const records = recs || ctxRecords;
  const [limit, setLimit] = useState(25);

  const shown = records.slice(0, limit);

  const select = (row) => {
    setSelectedRetailer(row);
    if (onSelect) onSelect(row);
  };

  if (records.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">{t("retailer_id")}</th>
              <th className="text-left px-4 py-2.5 font-medium">ACCMGRID</th>
              <th className="text-left px-4 py-2.5 font-medium">HOTSPOTID</th>
              <th className="text-left px-4 py-2.5 font-medium">{t("statement_period")}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t("incentive_group")}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r._id || i} className="border-t border-slate-100 hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-800">{getText(r, "RETAILER ID") || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{getText(r, "ACCMGRID") || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{getText(r, "HOTSPOTID") || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{getText(r, "MONTH") || "—"}</td>
                <td className="px-4 py-2.5"><IncentiveGroupBadge group={r._incentiveGroup} /></td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => select(r)} className="inline-flex items-center gap-1 text-xs font-medium text-[#006AE0] hover:underline">
                    {t("view_statement")} <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 && (<div className="p-8 text-center text-sm text-slate-400">{t("no_results")}</div>)}
      {records.length > limit && (
        <div className="p-3 border-t border-slate-100 text-center">
          <button onClick={() => setLimit(limit + 25)} className="text-sm text-[#006AE0] font-medium hover:underline">+25</button>
        </div>
      )}
    </div>
  );
}