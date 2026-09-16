// Authoritative incentive scheme reference for LycaMobile Italy.
// Two schemes are supported: "special" (April 2026, selected retailers) and
// "normal" (standard retailer programme). The selected scheme drives thresholds,
// labels and whether usage clawback applies.

export const schemes = {
  special: {
    id: "special",
    title: { en: "Special Incentive Scheme", it: "Schema Incentivi Speciali" },
    subtitle: {
      en: "April 2026 — Selected authorised retailers",
      it: "Aprile 2026 — Rivenditori autorizzati selezionati",
    },
    usageCheck: false, // no usage check for special retailers
    minPlanValue: { portin: 5.99, newActivation: 6.99 },
    renewalThresholds: {
      t1BonusThreshold: 30,
      t2BonusThreshold: 60,
      nationalRenewalMin: 30,
      portinRenewalMin: 50,
    },
    bonusAttivazione: [
      { plan: 6.99, bonus: 3.0 },
      { plan: 7.99, bonus: 3.5 },
      { plan: 9.99, bonus: 4.5 },
      { plan: 11.99, bonus: 5.2 },
      { plan: 14.99, bonus: 6.5 },
    ],
    renewalBonuses: [
      { key: "t1", label: { en: "T1 Renewal Bonus", it: "Bonus Rinnovo T1" }, amount: 4, threshold: 30 },
      { key: "t2", label: { en: "T2 Renewal Bonus", it: "Bonus Rinnovo T2" }, amount: 4, threshold: 60 },
    ],
    compensiMNP: {
      headers: {
        en: ["Port-In Type", "From 1", "From 6", "From 15", "From 35"],
        it: ["Tipo Port-In", "Da 1", "Da 6", "Da 15", "Da 35"],
      },
      rows: [
        { type: { en: "MNP Plan ≤ €6.99", it: "MNP Piano ≤ €6.99" }, values: [8, 17, 20, 23] },
        { type: { en: "MNP Plan > €6.99", it: "MNP Piano > €6.99" }, values: [12, 27, 31, 38] },
      ],
    },
    garaBoost: {
      minRequirement: { en: "15+ MNP per month", it: "15+ MNP al mese" },
      incentives: [
        { amount: 40, carriers: { en: "Iliad · Fastweb · CoopVoce · PosteMobile", it: "Iliad · Fastweb · CoopVoce · PosteMobile" } },
        { amount: 20, carriers: { en: "Other MNO & MVNO", it: "Altri MNO e MVNO" } },
      ],
    },
    terms: {
      en: [
        "No usage check applies to selected retailers. Standard fraud prevention rules remain fully applicable.",
        "Activation bonus applies to all new activations with eligible plans (minimum plan value €6.99).",
        "T1 Bonus: €4 per eligible renewed number when the first renewal rate exceeds 30%.",
        "T2 Bonus: €4 per eligible renewed number when the second renewal rate exceeds 60% (calculated on first renewals).",
        "Incentives apply only to numbers renewed with plan values equal to or greater than €6.99.",
        "Minimum plan value for port-in is €5.99.",
        "MNP incentive is paid after 60 days, subject to continuous use and renewal (min 6 months).",
        "GARA Extra Boost: +€40/MNP (Iliad, Fastweb, CoopVoce, PosteMobile) or +€20/MNP (other MNO/MVNO), requires 15+ MNP/month.",
        "Blocked, recycled, or fraudulent activations are not eligible for any incentive.",
        "Only unique customers (unique tax code) + IMEI verification per activation.",
      ],
      it: [
        "Nessun controllo utilizzo si applica ai rivenditori selezionati. Le regole standard di prevenzione frodi rimangono pienamente applicabili.",
        "Il bonus attivazione si applica a tutte le nuove attivazioni con piani idonei (valore minimo €6,99).",
        "Bonus T1: €4 per numero idoneo rinnovato quando il tasso di primo rinnovo supera il 30%.",
        "Bonus T2: €4 per numero idoneo rinnovato quando il tasso di secondo rinnovo supera il 60% (calcolato sui primi rinnovi).",
        "Gli incentivi si applicano solo ai numeri rinnovati con valori di piano pari o superiori a €6,99.",
        "Il valore minimo del piano per il port-in è €5,99.",
        "L'incentivo MNP è pagato dopo 60 giorni, con uso continuativo e rinnovo (min 6 mesi).",
        "GARA Extra Boost: +€40/MNP (Iliad, Fastweb, CoopVoce, PosteMobile) o +€20/MNP (altri MNO/MVNO), richiede 15+ MNP/mese.",
        "Le attivazioni bloccate, riciclate o fraudolente non sono idonee per alcun incentivo.",
        "Solo clienti unici (codice fiscale univoco) + verifica IMEI per ogni attivazione.",
      ],
    },
  },

  normal: {
    id: "normal",
    title: { en: "Normal Incentive Scheme", it: "Schema Incentivi Normale" },
    subtitle: {
      en: "Standard retailer incentive programme",
      it: "Programma incentivi rivenditori standard",
    },
    usageCheck: true,
    minPlanValue: { portin: 5.99, newActivation: 6.99 },
    renewalThresholds: {
      t1BonusThreshold: 30,
      t2BonusThreshold: 60,
      nationalRenewalMin: 30,
      portinRenewalMin: 50,
      malusRenewalThreshold: 65,
    },
    compensiMNP: {
      headers: {
        en: ["Type", "From 1", "From 6", "From 15", "From 35"],
        it: ["Tipo", "Da 1", "Da 6", "Da 15", "Da 35"],
      },
      plans: [
        {
          planLabel: { en: "Plans ≤ €6.99", it: "Piani ≤ €6.99" },
          rows: [
            { type: { en: "MNP", it: "MNP" }, values: [8, 17, 20, 23] },
            { type: { en: "New Act.", it: "Nuove Att." }, values: [3, 5, 6, 7] },
          ],
        },
        {
          planLabel: { en: "Plans > €6.99", it: "Piani > €6.99" },
          rows: [
            { type: { en: "MNP", it: "MNP" }, values: [12, 27, 31, 38] },
            { type: { en: "New Act.", it: "Nuove Att." }, values: [5, 6, 7, 9] },
          ],
        },
      ],
    },
    garaBoost: {
      minRequirement: { en: "15+ MNP per month", it: "15+ MNP al mese" },
      incentives: [
        { amount: 40, carriers: { en: "Iliad · Fastweb · CoopVoce · PosteMobile", it: "Iliad · Fastweb · CoopVoce · PosteMobile" } },
        { amount: 20, carriers: { en: "Other MNO & MVNO", it: "Altri MNO e MVNO" } },
      ],
    },
    autoRecharge: {
      label: { en: "Auto Recharge Cashback", it: "Cashback Ricarica Automatica" },
      desc: {
        en: "Activate via CPOS with Credit/Debit Card + QR Code scan. Earn the full plan value as cashback. POS only — not valid for APP/ONLINE. First plan per MSISDN.",
        it: "Attiva tramite CPOS con Carta di Credito/Debito + scansione QR. Guadagna il valore del piano come cashback. Solo POS — non valido per APP/ONLINE. Primo piano per MSISDN.",
      },
    },
    reducedIncentiveTable: {
      headers: { en: ["", "Portability (MNP)", "New Activations"], it: ["", "Portabilità (MNP)", "Nuove Attivazioni"] },
      rows: [
        { label: { en: "Plan ≤ €6.99", it: "Piano ≤ €6.99" }, portin: 3, newAct: 2 },
        { label: { en: "Plan > €6.99", it: "Piano > €6.99" }, portin: 4, newAct: 3 },
      ],
    },
    nonHPBonus: { perSim: 5, max: 100 },
    malus: { maxPct: 50, renewalThreshold: 65 },
    terms: {
      en: [
        "Minimum 1 SIM with FCA each month. Calculation period: 1st to last day of the month.",
        "Min plan for port-in: €5.99 | New activations: €6.99. MNP and new activations counted separately.",
        "SIM must complete FCA. Activations must be correct and compliant.",
        "Port-in incentives credited after 60 days subject to administrative verification.",
        "≥10 activations with >5% without use: deduction. >5% port-out within 30 days: deduction. €10 penalty per abuse + incentive recovery.",
        "+€5 for NON-HP SIM via POS (max €100). POS inactive 90 days: balance suspended.",
        "Port-out deductions: without FCA/plan/use; within 7 days (except plans >€9.99); port-in + port-out within 60 days = false activation.",
        "If national renewal (T1) <30% or port-in renewal <50%, a reduced incentive applies.",
        "Malus up to 50% if renewal rate <65%. Verification checks may apply on activation regularity.",
        "GARA Extra Boost: +€40/MNP (Iliad, Fastweb, CoopVoce, PosteMobile) or +€20/MNP (other MNO/MVNO), requires 15+ MNP/month.",
      ],
      it: [
        "Minimo 1 SIM con FCA ogni mese. Calcolo: 1° - ultimo giorno del mese.",
        "Piano minimo port-in: €5,99 | Nuove attivazioni: €6,99. MNP e nuove attivazioni contate separatamente.",
        "La SIM deve completare la FCA. Attivazioni corrette e conformi.",
        "Incentivi port-in accreditati dopo 60 giorni previa verifica amministrativa.",
        "≥10 attivazioni con >5% senza uso: detrazione. >5% port-out entro 30gg: detrazione. €10 per abuso + recupero incentivi.",
        "+€5 SIM NON-HP via POS (max €100). POS inattivo 90gg: saldo sospeso.",
        "Detrazioni port-out: senza FCA/piano/utilizzo; entro 7gg (eccetto piani >€9,99); port-in + port-out entro 60gg = falso.",
        "Se rinnovo nazionale (T1) <30% o rinnovo port-in <50%, si applica un incentivo ridotto.",
        "Malus fino al 50% se tasso di rinnovo <65%. Possibili verifiche sulla regolarità delle attivazioni.",
        "GARA Extra Boost: +€40/MNP (Iliad, Fastweb, CoopVoce, PosteMobile) o +€20/MNP (altri MNO/MVNO), richiede 15+ MNP/mese.",
      ],
    },
  },
};

export function getScheme(id) {
  return schemes[id] || schemes.special;
}

// Friendly display labels for CSV components, in both languages.
export const componentLabels = {
  BUNDLE1_COMM: { en: "New Activation Bonus", it: "Bonus Nuove Attivazioni" },
  PORTIN_COMM: { en: "Port-in Bonus", it: "Bonus Port-in" },
  GARA_COMM: { en: "Gara Bonus", it: "Bonus Gara" },
  ONBOARDING_COMM: { en: "Onboarding Commission", it: "Commissione Onboarding" },
  NONHP_COMM: { en: "Non-HP SIM Commission", it: "Commissione SIM Non-HP" },
  "QUALITY_BONUS M-1": { en: "T1 Renewal Bonus (M-1)", it: "Bonus Rinnovo T1 (M-1)" },
  "VOLUME_BONUS M-1": { en: "T2 Renewal Bonus (M-1)", it: "Bonus Rinnovo T2 (M-1)" },
  T3REN_BONUS: { en: "T3 Renewal Bonus", it: "Bonus Rinnovo T3" },
  "T1 BONUS": { en: "T1 Bonus", it: "Bonus T1" },
  "T2 BONUS": { en: "T2 Bonus", it: "Bonus T2" },
  "PORTOUT DEDUCTION": { en: "Port-out Deduction", it: "Detrazione Port-out" },
  USAGE_CLAWBACK: { en: "Usage Clawback", it: "Clawback Utilizzo" },
  USAGE_REFUND: { en: "Usage Refund", it: "Rimborso Utilizzo" },
  TOTAL_COMM: { en: "Total Commission", it: "Commissione Totale" },
  "OPENING BALANCE": { en: "Opening Balance", it: "Saldo Iniziale" },
  "TOTAL PAID (SBT+BT+VOU)": { en: "Total Paid", it: "Totale Pagato" },
};

// Explanation text per CSV component, in both languages.
export const componentExplanations = {
  BUNDLE1_COMM: {
    en: "New activation bonus earned on eligible activations, per the scheme price categories.",
    it: "Bonus nuove attivazioni maturato sulle attivazioni idonee, secondo le categorie di prezzo dello schema.",
  },
  "QUALITY_BONUS M-1": {
    en: "T1 renewal bonus calculated on the previous month's first-renewal performance (>30%).",
    it: "Bonus rinnovo T1 calcolato sulle performance di primo rinnovo del mese precedente (>30%).",
  },
  "VOLUME_BONUS M-1": {
    en: "T2 renewal bonus calculated on the previous month's second-renewal performance (>60%).",
    it: "Bonus rinnovo T2 calcolato sulle performance di secondo rinnovo del mese precedente (>60%).",
  },
  "PORTOUT DEDUCTION": {
    en: "Deduction applied for port-outs exceeding the scheme's threshold within 30 days.",
    it: "Detrazione applicata per port-out superiori alla soglia entro 30 giorni.",
  },
  PORTIN_COMM: {
    en: "Port-in commission, paid after 60 days of continuous renewal and usage per the scheme.",
    it: "Commissione port-in, pagata dopo 60 giorni di rinnovo e utilizzo continuativi.",
  },
  ONBOARDING_COMM: {
    en: "Onboarding commission for new retailer/SIM onboarding activity.",
    it: "Commissione di onboarding per l'attività di onboarding nuovi rivenditori/SIM.",
  },
  NONHP_COMM: {
    en: "Non-HP SIM registration commission via POS (€5 per SIM, max €100 per the scheme).",
    it: "Commissione registrazione SIM NON-HP tramite POS (€5 per SIM, max €100 secondo schema).",
  },
  GARA_COMM: {
    en: "GARA extra boost commission, requires 15+ MNP/month and unique tax-code validation.",
    it: "Commissione GARA extra boost, richiede 15+ MNP/mese e validazione codice fiscale univoco.",
  },
  USAGE_CLAWBACK: {
    en: "Clawback for SIMs not meeting usage criteria. Not applied under the Special scheme.",
    it: "Clawback per SIM non soddisfacenti i criteri di utilizzo. Non applicato nello Schema Speciale.",
  },
  USAGE_REFUND: {
    en: "Refund of previously deducted usage amounts when the customer resumes SIM usage.",
    it: "Rimborso di importi detratti per utilizzo quando il cliente riprende l'utilizzo della SIM.",
  },
  T3REN_BONUS: {
    en: "T3 renewal bonus for eligible renewed numbers beyond the standard renewal cycle.",
    it: "Bonus rinnovo T3 per numeri idonei rinnovati oltre il ciclo di rinnovo standard.",
  },
  TOTAL_COMM: {
    en: "Total commission as reported in the source CSV (authoritative source value).",
    it: "Commissione totale come riportata nel CSV sorgente (valore sorgente autorevole).",
  },
  "OPENING BALANCE": {
    en: "Opening balance carried forward from the previous period.",
    it: "Saldo iniziale riportato dal periodo precedente.",
  },
  "TOTAL PAID (SBT+BT+VOU)": {
    en: "Total paid via SBT + BT + VOU payment channels.",
    it: "Totale pagato tramite canali di pagamento SBT + BT + VOU.",
  },
  "T1 BONUS": {
    en: "T1 bonus for first renewal, eligible when renewal rate exceeds 30%.",
    it: "Bonus T1 per primo rinnovo, idoneo quando il tasso di rinnovo supera il 30%.",
  },
  "T2 BONUS": {
    en: "T2 bonus for second renewal, eligible when renewal rate exceeds 60%.",
    it: "Bonus T2 per secondo rinnovo, idoneo quando il tasso di rinnovo supera il 60%.",
  },
};