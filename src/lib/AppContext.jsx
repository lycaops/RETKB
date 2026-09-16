import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { t as translate } from './translations';
import supabase from '@/api/supabaseClient';
import { getText, getNumber } from './csvUtils';

export const SNAKE_TO_DISPLAY = {
  retailer_id: 'RETAILER ID',
  accmgrid: 'ACCMGRID',
  hotspotid: 'HOTSPOTID',
  month: 'MONTH',
  payment_mood: 'PAYMENT MOOD',
  total_noofactivations: 'TOTAL_NOOFACTIVATIONS',
  total_topup_less_6_portin: 'TOTAL_TOPUP_LESS_6_PORTIN',
  total_topup_great_6_portin: 'TOTAL_TOPUP_GREAT_6_PORTIN',
  total_topup_less_6: 'TOTAL_TOPUP_LESS_6',
  total_topup_great_6: 'TOTAL_TOPUP_GREAT_6',
  blocked_noofactivations: 'BLOCKED_NOOFACTIVATIONS',
  total_portout: 'TOTAL_PORTOUT',
  bundle1_comm: 'BUNDLE1_COMM',
  quality_bonus_m_1: 'QUALITY_BONUS M-1',
  volume_bonus_m_1: 'VOLUME_BONUS M-1',
  portout_deduction: 'PORTOUT DEDUCTION',
  portin_comm: 'PORTIN_COMM',
  onboarding_comm: 'ONBOARDING_COMM',
  nonhp_comm: 'NONHP_COMM',
  gara_comm: 'GARA_COMM',
  usage_clawback: 'USAGE_CLAWBACK',
  usage_refund: 'USAGE_REFUND',
  t3ren_bonus: 'T3REN_BONUS',
  total_comm: 'TOTAL_COMM',
  opening_balance: 'OPENING BALANCE',
  total_paid_sbt_bt_vou: 'TOTAL PAID (SBT+BT+VOU)',
  new_act_cnt: 'NEW_ACT_CNT',
  new_act_renewal_cnt: 'NEW_ACT_RENEWAL_CNT',
  new_activations: 'NEW ACTIVATIONS',
  portin_act_cnt: 'PORTIN_ACT_CNT',
  portin_act_renewal_cnt: 'PORTIN_ACT_RENEWAL_CNT',
  port_in: 'PORT IN',
  total_bundle_act: 'TOTAL_BUNDLE_ACT',
  bundle_act_not_eligible: 'BUNDLE ACT NOT ELIGIBLE',
  usage_percentage: 'USAGE_PERCENTAGE',
  t1_bonus: 'T1 BONUS',
  t2_bonus: 'T2 BONUS',
  t1_renewal: 'T1 RENEWAL',
  t2_renewal: 'T2 RENEWAL',
  incentive_group: 'INCENTIVE GROUP',
  fake_port_out_pct: 'FAKE PORT OUT %',
  branch: 'BRANCH',
  zone: 'ZONE',
};

export const DISPLAY_TO_SNAKE = Object.fromEntries(
  Object.entries(SNAKE_TO_DISPLAY).map(([k, v]) => [v, k]),
);

export function toDisplayRow(snakeRow) {
  if (!snakeRow) return {};
  const out = { ...snakeRow };
  for (const [snake, display] of Object.entries(SNAKE_TO_DISPLAY)) {
    if (snake in snakeRow && !(display in out)) {
      out[display] = snakeRow[snake];
    }
  }
  return out;
}

const AppContext = globalThis.__APP_CONTEXT__ || (globalThis.__APP_CONTEXT__ = createContext(null));

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [scheme, setScheme] = useState('special');
  const [records, setRecords] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState(null);

  const t = useCallback((key) => translate(lang, key), [lang]);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      let mapped = [];
      if (url && anonKey && url !== 'http://localhost') {
        const { data, error } = await supabase
          .from('retailer_incentives')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5000);
        if (error) throw error;
        mapped = (data || []).map((r) => {
          const display = toDisplayRow(r);
          const incentiveGroup =
            getText(display, 'INCENTIVE GROUP') ||
            r.incentive_group ||
            (r.scheme === 'normal' ? 'NOR_RET' : 'SPL_RET');
          const derivedScheme =
            r.scheme ||
            (incentiveGroup === 'NOR_RET'
              ? 'normal'
              : incentiveGroup === 'SPL_RET'
                ? 'special'
                : 'special');
          return {
            ...display,
            _id: r.id,
            _scheme: derivedScheme,
            _incentiveGroup: incentiveGroup,
          };
        });
      }
      setRecords(mapped);
      if (mapped.length > 0) {
        setHeaders(Object.keys(mapped[0]));
      } else {
        setHeaders([]);
      }
    } catch (e) {
      console.error('Failed to load records:', e);
      setRecordsError(e?.message || 'Failed to load incentive data');
      setRecords([]);
      setHeaders([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      scheme,
      setScheme,
      t,
      records,
      setRecords,
      headers,
      setHeaders,
      selectedRetailer,
      setSelectedRetailer,
      loadRecords,
      loadingRecords,
      recordsError,
    }),
    [
      lang,
      scheme,
      t,
      records,
      headers,
      selectedRetailer,
      loadRecords,
      loadingRecords,
      recordsError,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
