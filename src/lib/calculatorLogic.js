// Incentive calculator logic — mirrors the HTML scheme calculators exactly.

export function getTierKey(total) {
  if (total >= 35) return 35;
  if (total >= 15) return 15;
  if (total >= 6) return 6;
  return 1;
}

export function getTierLabel(total) {
  if (total >= 35) return "35+";
  if (total >= 15) return "15–34";
  if (total >= 6) return "6–14";
  return "1–5";
}

// Special scheme: activation bonus per plan value
export const SPECIAL_PLAN_BONUSES = [
  { plan: 6.99, bonus: 3.0 },
  { plan: 7.99, bonus: 3.5 },
  { plan: 9.99, bonus: 4.5 },
  { plan: 11.99, bonus: 5.2 },
  { plan: 14.99, bonus: 6.5 },
];

const SPECIAL_MNP_RATES_LTE = { 1: 8, 6: 17, 15: 20, 35: 23 };
const SPECIAL_MNP_RATES_GT = { 1: 12, 6: 27, 15: 31, 35: 38 };
const NORMAL_NEW_RATES_LTE = { 1: 3, 6: 5, 15: 6, 35: 7 };
const NORMAL_NEW_RATES_GT = { 1: 5, 6: 6, 15: 7, 35: 9 };
const NORMAL_MNP_RATES_LTE = { 1: 8, 6: 17, 15: 20, 35: 23 };
const NORMAL_MNP_RATES_GT = { 1: 12, 6: 27, 15: 31, 35: 38 };

const AVG_LTE_NEW = 6.99;
const AVG_GT_NEW = 9.99;
const AVG_LTE_MNP = 5.99;
const AVG_GT_MNP = 9.99;
const SIM_MARGIN = 5;

// Special: New Activations
// entries: [{ bonus, qty }], t1, t2 (eligible renewal counts)
export function calcSpecialNew(entries, t1, t2, withRecharge = false, withMargin = true) {
  const totalActs = entries.reduce((s, e) => s + (Number(e.qty) || 0), 0);
  let actTotal = 0;
  const actRows = [];
  entries.forEach((e) => {
    const qty = Number(e.qty) || 0;
    const sub = qty * e.bonus;
    if (qty > 0) {
      actTotal += sub;
      actRows.push({ qty, bonus: e.bonus, amount: sub });
    }
  });

  // T1 validation: must be > 30% of total activations
  const t1Valid = t1 === 0 || (totalActs > 0 && t1 / totalActs > 0.30);
  const t1Used = t1Valid ? t1 : 0;
  let t1Hint = null;
  if (t1 > 0 && !t1Valid) {
    t1Hint = {
      pct: totalActs > 0 ? ((t1 / totalActs) * 100).toFixed(1) : 0,
      min: Math.ceil(totalActs * 0.30) + 1,
    };
  }

  // T2 validation: must be > 60% of T1
  const t2Valid = t2 === 0 || (t1 > 0 && t2 / t1 > 0.60);
  const t2Used = t2Valid ? t2 : 0;
  let t2Hint = null;
  if (t2 > 0 && !t2Valid) {
    t2Hint = {
      pct: t1 > 0 ? ((t2 / t1) * 100).toFixed(1) : 0,
      min: Math.ceil(t1 * 0.60) + 1,
    };
  }

  const t1Total = t1Used * 4;
  const t2Total = t2Used * 4;
  const rechargeTotal = withRecharge ? totalActs * AVG_LTE_NEW : 0;
  const simMarginTotal = withMargin ? totalActs * SIM_MARGIN : 0;
  const grand = actTotal + t1Total + t2Total + rechargeTotal + simMarginTotal;

  return { totalActs, actRows, actTotal, t1Used, t2Used, t1Total, t2Total, t1Hint, t2Hint, rechargeTotal, simMarginTotal, grand };
}

// Special: MNP Port-In
// planType: 'lte' | 'gt', count, garaOp (40 | 20)
export function calcSpecialMnp(planType, count, garaOp) {
  const garaBonus = count >= 15 ? garaOp : 0;
  const rates = planType === "lte" ? SPECIAL_MNP_RATES_LTE : SPECIAL_MNP_RATES_GT;
  const tier = getTierKey(count);
  const stdRate = rates[tier];
  const tierLabel = getTierLabel(count);
  const stdTotal = count * stdRate;
  const garaTotal = count * garaBonus;
  const grand = stdTotal + garaTotal;
  return { stdRate, tierLabel, stdTotal, garaBonus, garaTotal, grand, garaEligible: count >= 15 };
}

// Normal: New Activations
export function calcNormalNew(qtyLTE, qtyGT, withRecharge, withMargin) {
  const total = qtyLTE + qtyGT;
  if (total === 0) return null;
  const tier = getTierKey(total);
  const rateLTE = NORMAL_NEW_RATES_LTE[tier];
  const rateGT = NORMAL_NEW_RATES_GT[tier];
  const totalLTE = qtyLTE * rateLTE;
  const totalGT = qtyGT * rateGT;
  const rechargeTotal = withRecharge ? qtyLTE * AVG_LTE_NEW + qtyGT * AVG_GT_NEW : 0;
  const simMarginTotal = withMargin ? total * SIM_MARGIN : 0;
  const grand = totalLTE + totalGT + rechargeTotal + simMarginTotal;
  return { total, tier, tierLabel: getTierLabel(total), rateLTE, rateGT, totalLTE, totalGT, rechargeTotal, simMarginTotal, grand };
}

// Normal: MNP Port-In
export function calcNormalMnp(qtyLTE, qtyGT, garaPremium, garaOther, withRecharge, withMargin) {
  const totalMnp = qtyLTE + qtyGT;
  if (totalMnp === 0) return null;
  const garaEligible = totalMnp >= 15;
  const garaSum = garaPremium + garaOther;
  let garaError = null;
  if (garaEligible && garaSum > 0 && garaSum !== totalMnp) {
    garaError = { garaSum, totalMnp };
  }
  const tier = getTierKey(totalMnp);
  const rateLTE = NORMAL_MNP_RATES_LTE[tier];
  const rateGT = NORMAL_MNP_RATES_GT[tier];
  const stdLTE = qtyLTE * rateLTE;
  const stdGT = qtyGT * rateGT;
  const stdTotal = stdLTE + stdGT;
  const garaPremTotal = garaEligible && garaSum === totalMnp ? garaPremium * 40 : 0;
  const garaOthTotal = garaEligible && garaSum === totalMnp ? garaOther * 20 : 0;
  const garaTotal = garaPremTotal + garaOthTotal;
  const rechargeTotal = withRecharge ? qtyLTE * AVG_LTE_MNP + qtyGT * AVG_GT_MNP : 0;
  const simMarginTotal = withMargin ? totalMnp * SIM_MARGIN : 0;
  const grand = stdTotal + garaTotal + rechargeTotal + simMarginTotal;
  return { totalMnp, tier, tierLabel: getTierLabel(totalMnp), rateLTE, rateGT, stdLTE, stdGT, stdTotal, garaEligible, garaSum, garaError, garaPremTotal, garaOthTotal, garaTotal, rechargeTotal, simMarginTotal, grand };
}