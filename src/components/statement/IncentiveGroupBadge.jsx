import React from "react";

export default function IncentiveGroupBadge({ group }) {
  if (!group) return <span className="text-sm text-slate-400">—</span>;
  const isNormal = group === "NOR_RET";
  const style = isNormal
    ? { backgroundColor: "#e8f5e9", color: "#1b5e20" }
    : { backgroundColor: "#f3e8ff", color: "#6b21a8" };
  return (
    <span
      className="inline-flex items-center justify-center text-center rounded-full text-xs font-semibold"
      style={{ ...style, padding: "4px 14px" }}
    >
      {group}
    </span>
  );
}