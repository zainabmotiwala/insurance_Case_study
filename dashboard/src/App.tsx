import { useState, useMemo } from 'react';
import { useAppData } from './hooks';
import type { FilterState } from './types';
import { ALL_RTOS, RTO_NAMES } from './types';
import SummaryTab from './tabs/SummaryTab';
import BalanceTab from './tabs/BalanceTab';
import SpendingTab from './tabs/SpendingTab';
import IncomeTab from './tabs/IncomeTab';
import GTMTab from './tabs/GTMTab';

const TABS = [
  { id: 'summary',    label: '① Summary' },
  { id: 'balance',   label: '② Balance & Registrations' },
  { id: 'spending',  label: '③ Spending & Actuarial' },
  { id: 'income',    label: '④ Income & Forecasting' },
  { id: 'gtm',       label: '⑤ Net Income & GTM' },
];

export default function App() {
  const { data, loading, error } = useAppData();
  const [activeTab, setActiveTab] = useState('summary');

  const [filters, setFilters] = useState<FilterState>({
    geography: 'MH-ALL',
    dateFrom: '201701',
    dateTo: '202609',
  });

  const yearRange = useMemo(() => {
    const years: string[] = [];
    for (let y = 2017; y <= 2026; y++) years.push(String(y));
    return years;
  }, []);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-brand">
          <div className="top-bar-logo">MH</div>
          <div>
            <div className="top-bar-title">Maharashtra Motor Insurance Intelligence Platform</div>
            <div className="top-bar-subtitle">VAHAN 2017–Sep 2026 · IRDAI FY 2014-25 · ATSA Project</div>
          </div>
        </div>
        <div className="top-bar-right">
          <span className="data-badge">Oct 2026 partial excluded</span>
          <span className="data-badge">2026 = Jan–Sep YTD</span>
          <span className="data-badge">IRDAI GDPI annual only</span>
        </div>
      </header>

      <div className="filter-bar">
        <span className="filter-label">Geography</span>
        <select
          className="filter-select"
          value={filters.geography}
          onChange={e => updateFilter('geography', e.target.value)}
        >
          {ALL_RTOS.map(rto => (
            <option key={rto} value={rto}>{RTO_NAMES[rto]}</option>
          ))}
        </select>

        <div className="filter-divider" />

        <span className="filter-label">From Year</span>
        <select
          className="filter-select"
          value={filters.dateFrom.slice(0, 4)}
          onChange={e => updateFilter('dateFrom', e.target.value + '01')}
        >
          {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <span className="filter-label">To</span>
        <select
          className="filter-select"
          value={filters.dateTo.slice(0, 4)}
          onChange={e => updateFilter('dateTo', e.target.value + (e.target.value === '2026' ? '09' : '12'))}
        >
          {yearRange.map(y => <option key={y} value={y}>{y}{y === '2026' ? ' (Sep)' : ''}</option>)}
        </select>

        <div className="filter-divider" />

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {filters.geography === 'MH-ALL'
            ? 'Statewide (MH-ALL) — full forecasting coverage'
            : 'RTO-level — no forecasting models, no GDPI'}
        </span>
      </div>

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {loading && <div className="loading">⬤ Loading project data…</div>}
        {error && (
          <div className="caveat-box" style={{ marginTop: 24 }}>
            ⚠ Error loading data: {error}
          </div>
        )}
        {data && (
          <>
            {activeTab === 'summary'  && <SummaryTab  data={data} filters={filters} />}
            {activeTab === 'balance'  && <BalanceTab  data={data} filters={filters} />}
            {activeTab === 'spending' && <SpendingTab data={data} filters={filters} />}
            {activeTab === 'income'   && <IncomeTab   data={data} filters={filters} />}
            {activeTab === 'gtm'      && <GTMTab      data={data} filters={filters} />}
          </>
        )}
      </main>
    </div>
  );
}
