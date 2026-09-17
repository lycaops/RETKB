import { getNumber, getText, getField, normalizePercent } from "./csvUtils";
import { schemes, componentExplanations, componentLabels } from "./schemeReference";
import { getTierKey, getTierLabel } from "./calculatorLogic";

const MNP_RATES_LTE = { 1: 8, 6: 17, 15: 20, 35: 23 };
const MNP_RATES_GT = { 1: 12, 6: 27, 15: 31, 35: 38 };
const NEW_RATES_LTE = { 1: 3, 6: 5, 15: 6, 35: 7 };
const NEW_RATES_GT = { 1: 5, 6: 6, 15: 7, 35: 9 };

// Earnings / credits used in reconciliation (excludes RETAILER_COMM).
const EARNING_FIELDS = [
  "BUNDLE1_COMM",
  "PORTIN_COMM",
  "GARA_COMM",
  "ONBOARDING_COMM",
  "NONHP_COMM",
];
// Bonuses used in reconciliation (excludes T1 BONUS and T2 BONUS duplicates).
const BONUS_REC_FIELDS = [
  "QUALITY_BONUS M-1",
  "VOLUME_BONUS M-1",
  "T3REN_BONUS",
];
// Bonus fields shown in the detailed breakdown (includes T1/T2 bonus rows).
const BREAKDOWN_BONUS_FIELDS = [
  "QUALITY_BONUS M-1",
  "VOLUME_BONUS M-1",
  "T3REN_BONUS",
  "T1 BONUS",
  "T2 BONUS",
];
const DEDUCTION_FIELDS = ["PORTOUT DEDUCTION", "USAGE_CLAWBACK"];
const REFUND_FIELDS = ["USAGE_REFUND"];

function sum(row, fields) {
  let total = 0;
  let any = false;
  for (const f of fields) {
    const v = getNumber(row, f);
    if (v !== null) {
      total += v;
      any = true;
    }
  }
  return any ? total : null;
}

export function computeSummary(row, scheme = "special") {
  const totalCommissionSource = getNumber(row, "TOTAL_COMM");
  const openingBalance = getNumber(row, "OPENING BALANCE");
  const totalPaid = getNumber(row, "TOTAL PAID (SBT+BT+VOU)");

  const credits = sum(row, EARNING_FIELDS) ?? 0;
  const bonuses = sum(row, BONUS_REC_FIELDS) ?? 0;

  const portoutDeduction = getNumber(row, "PORTOUT DEDUCTION");
  const usageClawback = getNumber(row, "USAGE_CLAWBACK");
  const refund = getNumber(row, "USAGE_REFUND");

  // Special scheme: no usage clawback. Normal scheme: clawback applies.
  const appliesClawback = scheme !== "special";
  const deductions =
    (portoutDeduction ?? 0) + (appliesClawback ? usageClawback ?? 0 : 0);

  const bundle1Comm = getNumber(row, "BUNDLE1_COMM");
  const qualityBonus = getNumber(row, "QUALITY_BONUS M-1");
  const volumeBonus = getNumber(row, "VOLUME_BONUS M-1");
  const portinCommVal = getNumber(row, "PORTIN_COMM");
  const garaCommVal = getNumber(row, "GARA_COMM");
  const portInBonus =
    portinCommVal !== null || garaCommVal !== null
      ? (portinCommVal ?? 0) + (garaCommVal ?? 0)
      : null;

  const calculatedTotal = credits + bonuses - deductions + (refund ?? 0);
  const discrepancy =
    totalCommissionSource !== null &&
    Math.abs(calculatedTotal - totalCommissionSource) > 0.01;

  const netPosition =
    (totalCommissionSource !== null ? totalCommissionSource : calculatedTotal) +
    (openingBalance ?? 0) - (totalPaid ?? 0);

  return {
    totalCommissionSource,
    openingBalance,
    totalPaid,
    credits,
    bonuses,
    portoutDeduction,
    usageClawback,
    appliesClawback,
    deductions,
    clawback: appliesClawback ? usageClawback : null,
    refund,
    bundle1Comm,
    qualityBonus,
    volumeBonus,
    portInBonus,
    calculatedTotal,
    discrepancy,
    netPosition,
  };
}

export function computeBreakdown(row, lang, scheme = "special") {
  const allFields = [
    ...EARNING_FIELDS,
    ...BREAKDOWN_BONUS_FIELDS,
    ...DEDUCTION_FIELDS,
    ...REFUND_FIELDS,
    "TOTAL_COMM",
    "OPENING BALANCE",
    "TOTAL PAID (SBT+BT+VOU)",
  ];
  const typeMap = {
    BUNDLE1_COMM: "credit",
    PORTIN_COMM: "credit",
    ONBOARDING_COMM: "credit",
    NONHP_COMM: "credit",
    GARA_COMM: "credit",
    "QUALITY_BONUS M-1": "credit",
    "VOLUME_BONUS M-1": "credit",
    "T1 BONUS": "credit",
    "T2 BONUS": "credit",
    T3REN_BONUS: "credit",
    "PORTOUT DEDUCTION": "deduction",
    USAGE_CLAWBACK: "deduction",
    USAGE_REFUND: "refund",
    TOTAL_COMM: "info",
    "OPENING BALANCE": "payment",
    "TOTAL PAID (SBT+BT+VOU)": "payment",
  };

  const fields = scheme === "normal"
    ? allFields.filter((field) => field !== "T1 BONUS" && field !== "T2 BONUS")
    : allFields;

  return fields
    .map((f) => {
      const value = getNumber(row, f);
      if (value === null || value === 0) return null;
      const expl = componentExplanations[f] || { en: "", it: "" };
      const lbl = componentLabels[f] || { en: f, it: f };
      return {
        field: f,
        label: lbl[lang] || lbl.en || f,
        amount: value,
        type: typeMap[f] || "info",
        explanation: expl[lang] || expl.en || "",
      };
    })
    .filter(Boolean);
}

export function computeActivationSummary(row) {
  const totalActivations = getNumber(row, "TOTAL_NOOFACTIVATIONS");
  const mnpLess6 = getNumber(row, "TOTAL_TOPUP_LESS_6_PORTIN") ?? 0;
  const mnpGreat6 = getNumber(row, "TOTAL_TOPUP_GREAT_6_PORTIN") ?? 0;
  const newLess6 = getNumber(row, "TOTAL_TOPUP_LESS_6") ?? 0;
  const newGreat6 = getNumber(row, "TOTAL_TOPUP_GREAT_6") ?? 0;
  const blocked = getNumber(row, "BLOCKED_NOOFACTIVATIONS") ?? 0;

  // Eligible = sum of all four topup/activation categories
  const eligible = mnpLess6 + mnpGreat6 + newLess6 + newGreat6;

  const mnpTotal = mnpLess6 + mnpGreat6;

  const newTotal = newLess6 + newGreat6;
  const newTier = getTierKey(newTotal);
  const newRateLTE = NEW_RATES_LTE[newTier];
  const newRateGT = NEW_RATES_GT[newTier];
  const newEarningsLTE = newLess6 * newRateLTE;
  const newEarningsGT = newGreat6 * newRateGT;

  return {
    totalActivations,
    blocked,
    eligible,
    mnp: {
      less6: getNumber(row, "TOTAL_TOPUP_LESS_6_PORTIN"),
      great6: getNumber(row, "TOTAL_TOPUP_GREAT_6_PORTIN"),
      total: mnpTotal,
    },
    newActivations: {
      less6: getNumber(row, "TOTAL_TOPUP_LESS_6"),
      great6: getNumber(row, "TOTAL_TOPUP_GREAT_6"),
      total: newTotal,
      tier: newTier,
      tierLabel: getTierLabel(newTotal),
      rateLTE: newRateLTE,
      rateGT: newRateGT,
      earningsLTE: newEarningsLTE,
      earningsGT: newEarningsGT,
      earnings: newEarningsLTE + newEarningsGT,
    },
  };
}

export function computePerformance(row) {
  const newActCount = getNumber(row, "NEW_ACT_CNT");
  const newActRenewals = getNumber(row, "NEW_ACT_RENEWAL_CNT");
  const newActivations = getNumber(row, "NEW ACTIVATIONS");
  const portinCount = getNumber(row, "PORTIN_ACT_CNT");
  const portinRenewals = getNumber(row, "PORTIN_ACT_RENEWAL_CNT");
  const portIn = getNumber(row, "PORT IN");
  const totalBundleAct = getNumber(row, "TOTAL_BUNDLE_ACT");
  const bundleNotEligible = getNumber(row, "BUNDLE ACT NOT ELIGIBLE");
  const bundleComm = getNumber(row, "BUNDLE1_COMM");
  const portinComm = getNumber(row, "PORTIN_COMM");

  const t1Renewal = getNumber(row, "T1 RENEWAL");
  const t1Bonus = getNumber(row, "T1 BONUS");
  const t2Renewal = getNumber(row, "T2 RENEWAL");
  const t2Bonus = getNumber(row, "T2 BONUS");
  const t3Bonus = getNumber(row, "T3REN_BONUS");

  const t1RenewalRate = normalizePercent(t1Renewal);
  const t2RenewalRate = normalizePercent(t2Renewal);

  const newActRenewalRate =
    newActRenewals !== null && newActCount !== null && newActCount > 0
      ? (newActRenewals / newActCount) * 100
      : null;
  const portinRenewalRate =
    portinRenewals !== null && portinCount !== null && portinCount > 0
      ? (portinRenewals / portinCount) * 100
      : null;

  const usagePct = normalizePercent(getNumber(row, "USAGE_PERCENTAGE"));
  const usageClawback = getNumber(row, "USAGE_CLAWBACK");
  const usageRefund = getNumber(row, "USAGE_REFUND");

  const totalPortouts = getNumber(row, "TOTAL_PORTOUT");
  const portoutDeduction = getNumber(row, "PORTOUT DEDUCTION");
  const fakePortOutPct = normalizePercent(getNumber(row, "FAKE PORT OUT %"));
  const blockedActivations = getNumber(row, "BLOCKED_NOOFACTIVATIONS");

  return {
    activation: {
      newActCount, newActRenewals, newActivations, newActRenewalRate,
      portinCount, portinRenewals, portIn, portinRenewalRate, portinComm,
      totalBundleAct, bundleNotEligible, bundleComm,
    },
    renewal: {
      t1Renewal, t1RenewalRate, t1Bonus, t2Renewal, t2RenewalRate, t2Bonus, t3Bonus,
      newActRenewalRate, portinRenewalRate,
    },
    usage: { usagePct, usageClawback, usageRefund },
    portout: { totalPortouts, portoutDeduction, fakePortOutPct },
    blocked: { blockedActivations },
  };
}

export function computeEligibility(perf, scheme = "special") {
  const th = schemes[scheme].renewalThresholds;
  const t1Threshold = th.t1BonusThreshold;
  const t2Threshold = th.t2BonusThreshold;
  const nationalMin = th.nationalRenewalMin;
  const portinMin = th.portinRenewalMin;

  const t1Status =
    perf.renewal.t1RenewalRate === null
      ? "unknown"
      : perf.renewal.t1RenewalRate >= t1Threshold
      ? "eligible"
      : "not_eligible";
  const t2Status =
    perf.renewal.t2RenewalRate === null
      ? "unknown"
      : perf.renewal.t2RenewalRate >= t2Threshold
      ? "eligible"
      : "not_eligible";
  const nationalRenewalStatus =
    perf.renewal.newActRenewalRate === null
      ? "unknown"
      : perf.renewal.newActRenewalRate >= nationalMin
      ? "achieved"
      : "not_achieved";
  const portinRenewalStatus =
    perf.renewal.portinRenewalRate === null
      ? "unknown"
      : perf.renewal.portinRenewalRate >= portinMin
      ? "achieved"
      : "not_achieved";

  return { t1Status, t2Status, nationalRenewalStatus, portinRenewalStatus, t1Threshold, t2Threshold, nationalMin, portinMin };
}

export function computeInsights(row, summary, perf, lang, scheme = "special", activationSummary = null) {
  const th = schemes[scheme].renewalThresholds;
  const insights = [];
  const add = (severity, text) => insights.push({ severity, text });

  if (summary.credits > 0) {
    const top = EARNING_FIELDS
      .map((f) => ({ f, v: getNumber(row, f) }))
      .filter((x) => x.v !== null && x.v > 0)
      .sort((a, b) => b.v - a.v)[0];
    if (top) {
      add("positive", lang === "it"
        ? `Il principale contributo agli incentivi è ${top.f} (${top.v.toFixed(2)} €).`
        : `The main contributor to incentives is ${top.f} (€${top.v.toFixed(2)}).`);
    }
  }
  if (summary.bonuses > 0) {
    add("positive", lang === "it"
      ? `Bonus totali di ${summary.bonuses.toFixed(2)} € riconosciuti nel periodo.`
      : `Total bonuses of €${summary.bonuses.toFixed(2)} recognised in the period.`);
  }
  if (summary.deductions > 0) {
    add("negative", lang === "it"
      ? `Detrazioni totali di ${summary.deductions.toFixed(2)} € applicate.`
      : `Total deductions of €${summary.deductions.toFixed(2)} applied.`);
  }
  if (summary.appliesClawback && summary.clawback && summary.clawback > 0) {
    add("warning", lang === "it"
      ? `Clawback utilizzo di ${summary.clawback.toFixed(2)} € per SIM non conformi ai criteri di utilizzo.`
      : `Usage clawback of €${summary.clawback.toFixed(2)} for SIMs not meeting usage criteria.`);
  }
  if (perf.activation.newActCount !== null && perf.activation.newActCount > 0) {
    add("positive", lang === "it"
      ? `Performance attivazioni: ${perf.activation.newActCount} nuove attivazioni nel periodo.`
      : `Activation performance: ${perf.activation.newActCount} new activations in the period.`);
  }
  if (perf.renewal.newActRenewalRate !== null) {
    const r = perf.renewal.newActRenewalRate;
    const t = th.t1BonusThreshold;
    add(r >= t ? "positive" : "warning", lang === "it"
      ? `Tasso di rinnovo nuove attivazioni: ${r.toFixed(1)}% (soglia T1 ${t}%).`
      : `New-activation renewal rate: ${r.toFixed(1)}% (T1 threshold ${t}%).`);
  }
  if (perf.portout.totalPortouts !== null && perf.portout.totalPortouts > 0) {
    add("negative", lang === "it"
      ? `${perf.portout.totalPortouts} port-out registrati con detrazione di ${(perf.portout.portoutDeduction ?? 0).toFixed(2)} €.`
      : `${perf.portout.totalPortouts} port-outs recorded with a deduction of €${(perf.portout.portoutDeduction ?? 0).toFixed(2)}.`);
  }
  if (perf.blocked.blockedActivations !== null && perf.blocked.blockedActivations > 0) {
    add("negative", lang === "it"
      ? `${perf.blocked.blockedActivations} attivazioni bloccate (non idonee per alcun incentivo).`
      : `${perf.blocked.blockedActivations} blocked activations (not eligible for any incentive).`);
  }
  if (perf.usage.usagePct !== null) {
    add(perf.usage.usagePct >= 90 ? "positive" : "warning", lang === "it"
      ? `Percentuale utilizzo: ${perf.usage.usagePct.toFixed(1)}%.`
      : `Usage percentage: ${perf.usage.usagePct.toFixed(1)}%.`);
  }
  if (summary.discrepancy) {
    add("warning", lang === "it"
      ? `Discrepanza tra totale sorgente (${(summary.totalCommissionSource ?? 0).toFixed(2)} €) e riconciliazione calcolata (${summary.calculatedTotal.toFixed(2)} €).`
      : `Discrepancy between source total (€${(summary.totalCommissionSource ?? 0).toFixed(2)}) and calculated reconciliation (€${summary.calculatedTotal.toFixed(2)}).`);
  }
  const newActivationEarnings = activationSummary?.newActivations?.earnings;
  const newActivationBonus = summary.bundle1Comm;
  if (
    newActivationEarnings !== null &&
    newActivationEarnings !== undefined &&
    newActivationBonus !== null &&
    newActivationBonus !== undefined &&
    Math.abs(newActivationEarnings - newActivationBonus) > 0.01
  ) {
    const difference = newActivationEarnings - newActivationBonus;
    const differenceText = difference >= 0
      ? `€${difference.toFixed(2)} higher`
      : `€${Math.abs(difference).toFixed(2)} lower`;
    const reason = scheme === "special"
      ? "because this retailer belongs to the special category and uses the special activation incentive rules"
      : "because the source bonus and calculated activation earnings use different statement inputs";
    add("info", lang === "it"
      ? `Differenza bonus nuove attivazioni: ${differenceText} rispetto al bonus registrato, ${reason}.`
      : `New activation earnings differ by ${differenceText} from the recorded New Activation Bonus ${reason}.`);
  }
  if (insights.length === 0) {
    add("info", lang === "it"
      ? "Dati insufficienti per generare insight significativi."
      : "Insufficient data to generate meaningful insights.");
  }
  return insights;
}

export function buildRetailerStatement(row, lang, scheme = "special") {
  const summary = computeSummary(row, scheme);
  const breakdown = computeBreakdown(row, lang, scheme);
  const performance = computePerformance(row);
  const activationSummary = computeActivationSummary(row);
  const eligibility = computeEligibility(performance, scheme);
  const insights = computeInsights(row, summary, performance, lang, scheme, activationSummary);

  return {
    retailerId: getText(row, "RETAILER ID"),
    accmgId: getText(row, "ACCMGRID"),
    hotspotId: getText(row, "HOTSPOTID"),
    month: getText(row, "MONTH"),
    paymentMood: getText(row, "PAYMENT MOOD"),
    scheme,
    summary,
    breakdown,
    performance,
    activationSummary,
    eligibility,
    insights,
  };
}

// Dataset-level aggregation for dashboard stats
export function computeDatasetStats(records) {
  let totalCommission = 0;
  let totalBonuses = 0;
  let totalDeductions = 0;
  let totalPaid = 0;
  let hasComm = false, hasBonus = false, hasDed = false, hasPaid = false;

  for (const r of records) {
    const c = getNumber(r, "TOTAL_COMM");
    if (c !== null) { totalCommission += c; hasComm = true; }
    const b = (getNumber(r, "QUALITY_BONUS M-1") ?? 0) + (getNumber(r, "VOLUME_BONUS M-1") ?? 0) +
      (getNumber(r, "T3REN_BONUS") ?? 0);
    if (b !== 0) { totalBonuses += b; hasBonus = true; }
    const d = (getNumber(r, "PORTOUT DEDUCTION") ?? 0) + (getNumber(r, "USAGE_CLAWBACK") ?? 0);
    if (d !== 0) { totalDeductions += d; hasDed = true; }
    const p = getNumber(r, "TOTAL PAID (SBT+BT+VOU)");
    if (p !== null) { totalPaid += p; hasPaid = true; }
  }

  return {
    totalRetailers: records.length,
    totalCommission: hasComm ? totalCommission : null,
    totalBonuses: hasBonus ? totalBonuses : null,
    totalDeductions: hasDed ? totalDeductions : null,
    totalPaid: hasPaid ? totalPaid : null,
  };
}