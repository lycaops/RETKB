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
  const [months, setMonths] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ branches: [], zones: [] });

  const t = useCallback((key) => translate(lang, key), [lang]);

  const loadMonths = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_incentive_months');
    if (error) throw error;
    setMonths((data || []).map((row) => row.month).filter(Boolean));
  }, []);

  const loadFilterOptions = useCallback(async (month) => {
    if (!month) {
      setFilterOptions({ branches: [], zones: [] });
      return;
    }
    const { data, error } = await supabase.rpc('get_incentive_filter_options', { p_month: month });
    if (error) throw error;
    const branches = new Set();
    const zones = new Set();
    for (const row of data || []) {
      if (row.accmgrid) branches.add(row.accmgrid);
      if (row.hotspotid) zones.add(row.hotspotid);
    }
    setFilterOptions({
      branches: Array.from(branches).sort(),
      zones: Array.from(zones).sort(),
    });
  }, []);

  const loadRecords = useCallback(async (filters = {}) => {
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      let mapped = [];
      if (url && anonKey && url !== 'http://localhost' && filters.month) {
        const { data, error } = await supabase.rpc('search_incentive_records', {
          p_month: filters.month,
          p_retailer_id: filters.retailerId || null,
          p_accmgrid: filters.branch || null,
          p_hotspotid: filters.zone || null,
          p_limit: 1000,
        });
        if (error) throw error;
        mapped = (data || []).map((r) => {
          const display = toDisplayRow(r);
          const rawGroup = r.incentive_group || 'special';
          const incentiveGroup =
            rawGroup === 'NOR_RET' ? 'normal' :
            rawGroup === 'SPL_RET' ? 'special' :
            rawGroup;
          const derivedScheme = incentiveGroup === 'normal' ? 'normal' : 'special';
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
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      loadMonths().catch((e) => {
        console.error('Failed to load incentive months:', e);
        setRecordsError(e?.message || 'Failed to load incentive months');
      });
    }
  }, [loadMonths]);

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
      months,
      filterOptions,
      loadMonths,
      loadFilterOptions,
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
      months,
      filterOptions,
      loadMonths,
      loadFilterOptions,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
