import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import RetailerTable from '@/components/RetailerTable';
import Dashboard from '@/components/Dashboard';
import { useApp } from '@/lib/AppContext';
import { getText } from '@/lib/csvUtils';
import { Search, Database, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const {
    t,
    records,
    setSelectedRetailer,
    setScheme,
    loadingRecords,
    loadRecords,
    recordsError,
  } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSelect = (row) => {
    if (row?._scheme) setScheme(row._scheme);
    setSelectedRetailer(row);
    navigate('/statement');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRecords();
    } finally {
      setRefreshing(false);
    }
  };

  const branches = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      const b = getText(r, 'BRANCH');
      if (b) set.add(b);
    }
    return Array.from(set).sort();
  }, [records]);

  const zones = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      const z = getText(r, 'ZONE');
      if (z) set.add(z);
    }
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (branchFilter && getText(r, 'BRANCH') !== branchFilter) return false;
      if (zoneFilter && getText(r, 'ZONE') !== zoneFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const id = getText(r, 'RETAILER ID').toLowerCase();
      const acc = getText(r, 'ACCMGRID').toLowerCase();
      const hot = getText(r, 'HOTSPOTID').toLowerCase();
      return id.includes(q) || acc.includes(q) || hot.includes(q);
    });
  }, [records, query, branchFilter, zoneFilter]);

  const hasBranchData = branches.length > 0;
  const hasZoneData = zones.length > 0;
  const showFilters = hasBranchData || hasZoneData;

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {recordsError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-sm text-red-700">
            <Database className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Failed to load data from Supabase</p>
              <p className="text-red-600 mt-0.5">{recordsError}</p>
              <p className="mt-2 text-red-600/80">
                Make sure your <code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> env vars are set correctly and the SQL
                migration has been applied.
              </p>
            </div>
          </div>
        )}

        {loadingRecords && records.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#21264e] rounded-full animate-spin" />
          </div>
        )}

        {!loadingRecords && records.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              {t('db_no_records')}
            </h2>
            <p className="text-sm text-slate-500 mb-5 max-w-xl mx-auto">
              No retailer incentive data was found. Insert rows into the Supabase{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100">retailer_incentives</code> table
              using the SQL Editor or Table Editor in your Supabase dashboard.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/scheme"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#21264e] border border-[#21264e]/30 bg-[#21264e]/5 hover:bg-[#21264e]/10"
              >
                View Scheme Reference
              </Link>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#21264e' }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-6">
              See README.md for column mapping and example INSERT SQL.
            </p>
          </div>
        )}

        {records.length > 0 && (
          <>
            <div className="flex flex-wrap items-stretch gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#006AE0] bg-white"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loadingRecords}
                title="Refresh data"
                className="inline-flex items-center justify-center w-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-600 ${
                    refreshing || loadingRecords ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 px-1">
                  <Filter className="w-4 h-4" /> {t('filter_by')}
                </div>
                {hasBranchData && (
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] bg-white min-w-[140px]"
                  >
                    <option value="">{t('all_branches')}</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
                {hasZoneData && (
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] bg-white min-w-[140px]"
                  >
                    <option value="">{t('all_zones')}</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                )}
                {(branchFilter || zoneFilter) && (
                  <button
                    onClick={() => {
                      setBranchFilter('');
                      setZoneFilter('');
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline ml-auto"
                  >
                    {t('clear_filters')}
                  </button>
                )}
              </div>
            )}

            <Dashboard records={filtered} />
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                {t('search_retailer')} ({filtered.length} / {records.length})
              </h2>
              <RetailerTable records={filtered} onSelect={handleSelect} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
