import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import RetailerTable from '@/components/RetailerTable';
import Dashboard from '@/components/Dashboard';
import { useApp } from '@/lib/AppContext';
import { Search, Database, Filter } from 'lucide-react';

export default function Home() {
  const {
    t,
    records,
    setRecords,
    setSelectedRetailer,
    setScheme,
    loadingRecords,
    loadRecords,
    recordsError,
    months,
    filterOptions,
    loadFilterOptions,
  } = useApp();
  const navigate = useNavigate();
  const [month, setMonth] = useState('');
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  const handleSelect = (row) => {
    if (row?._scheme) setScheme(row._scheme);
    setSelectedRetailer(row);
    navigate('/statement');
  };

  useEffect(() => {
    loadFilterOptions(month, branchFilter).catch((e) => console.error('Failed to load filter options:', e));
  }, [month, branchFilter, loadFilterOptions]);

  const runSearch = async () => {
    if (!month) return;
    await loadRecords({ month, retailerId: query, branch: branchFilter, zone: zoneFilter });
  };

  const hasBranchData = filterOptions.branches.length > 0;
  const hasZoneData = filterOptions.zones.length > 0;
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

        <>
          <>
            <div className="flex flex-wrap items-stretch gap-3">
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setRecords([]);
                  setQuery('');
                  setBranchFilter('');
                  setZoneFilter('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#006AE0] bg-white min-w-[180px]"
              >
                <option value="">{t('select_incentive_month')}</option>
                {months.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search_retailer_id_placeholder')}
                  onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#006AE0] bg-white"
                />
              </div>
              <button
                onClick={runSearch}
                disabled={!month || loadingRecords}
                className="inline-flex items-center gap-2 justify-center px-4 rounded-lg text-sm font-medium text-white bg-[#006AE0] disabled:opacity-50"
              >
                <Search className="w-4 h-4" /> {t('search_retailer')}
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
                    onChange={(e) => {
                      setBranchFilter(e.target.value);
                      setZoneFilter('');
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] bg-white min-w-[140px]"
                  >
                    <option value="">{t('all_branches')}</option>
                    {filterOptions.branches.map((b) => (
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
                    {filterOptions.zones.map((z) => (
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

            {records.length > 0 && (
              <>
                <Dashboard records={records} />
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">
                    {t('search_retailer')} ({records.length} / 1000)
                  </h2>
                  <RetailerTable records={records} onSelect={handleSelect} />
                </div>
              </>
            )}
          </>
        </>
      </div>
    </Layout>
  );
}
