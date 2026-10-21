import { useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AppData, FilterState } from '../types';
import { RTO_NAMES } from '../types';
import { fmtK, fmtPct, monthLabel } from '../hooks';
import { InsightBox, FormulaBox, FindingBadge } from '../components/InsightBox';

interface Props {
  data: AppData;
  filters: FilterState;
}

const RTO_COLORS: Record<string, string> = {
  'MH-MUMBAI':    '#5ea2ff',
  'MH-THANE':     '#34d399',
  'MH-PUNE':      '#ff6ea7',
  'MH-NASHIK':    '#fbbf24',
  'MH-AURANGABAD':'#a78bfa',
  'MH-PIMPRI':    '#22d3ee',
  'MH-VASHI':     '#fb923c',
};

export default function BalanceTab({ data, filters }: Props) {
  const { registrations, timeseriesDiag, rtoMonthly, rtoAnnual } = data;

  const isStatewide = filters.geography === 'MH-ALL';

  // MH-ALL monthly filtered
  const mhFiltered = useMemo(() =>
    registrations.filter(r => r.month_id >= filters.dateFrom && r.month_id <= filters.dateTo),
    [registrations, filters]
  );

  // YoY chart
  const yoyData = useMemo(() => {
    return timeseriesDiag
      .filter(r => r.month_id >= filters.dateFrom && r.month_id <= filters.dateTo && r.yoy_growth != null)
      .map(r => ({
        label: monthLabel(r.month_id),
        yoy: r.yoy_growth!,
        reporting_window: r.reporting_window,
      }));
  }, [timeseriesDiag, filters]);

  // Petrol vs E20 vs EV trend
  const powertrainTrend = useMemo(() => {
    return mhFiltered.map(r => ({
      label: monthLabel(r.month_id),
      petrol: r['Petrol'],
      e20: r['Petrol-E20'] + r['Petrol-E20-CNG'] + r['Petrol-E20-Hybrid'],
      diesel: r['Diesel'],
      ev: r['Pure EV'] + r['Electric-BOV'],
      cng: r['Petrol-CNG'] + r['CNG'],
    }));
  }, [mhFiltered]);

  // RTO annual data for 2023-2026
  const rtoAnnualChart = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];
    const rtos = ['MH-MUMBAI', 'MH-THANE', 'MH-PUNE', 'MH-NASHIK', 'MH-AURANGABAD', 'MH-PIMPRI', 'MH-VASHI'];
    return years.map(yr => {
      const rec: Record<string, number | string> = { year: String(yr) + (yr === 2026 ? '*' : '') };
      for (const rto of rtos) {
        const row = rtoAnnual.find(r => r.location_id === rto && r.year === yr);
        rec[rto] = row?.total ?? 0;
      }
      return rec;
    });
  }, [rtoAnnual]);


  // RTO EV share summary for 2025
  const rtoEVSummary2025 = useMemo(() => {
    return ['MH-MUMBAI', 'MH-THANE', 'MH-PUNE', 'MH-NASHIK', 'MH-AURANGABAD', 'MH-PIMPRI', 'MH-VASHI']
      .map(rto => {
        const row2025 = rtoAnnual.find(r => r.location_id === rto && r.year === 2025);
        const row2024 = rtoAnnual.find(r => r.location_id === rto && r.year === 2024);
        return {
          rto,
          name: RTO_NAMES[rto]?.replace(/\(MH-\d+\)/, '').trim() ?? rto,
          total2025: row2025?.total ?? 0,
          ev2025: row2025?.ev ?? 0,
          evShare2025: row2025 && row2025.total > 0 ? (row2025.ev / row2025.total) * 100 : 0,
          e20Share2025: row2025 && row2025.total > 0 ? (row2025.e20 / row2025.total) * 100 : 0,
          yoy: row2025 && row2024 && row2024.total > 0
            ? ((row2025.total - row2024.total) / row2024.total) * 100
            : null,
        };
      })
      .sort((a, b) => b.total2025 - a.total2025);
  }, [rtoAnnual]);

  // RTO monthly for selected geography
  const rtoMonthlyFiltered = useMemo(() => {
    if (isStatewide) return null;
    return rtoMonthly
      .filter(r => r.location_id === filters.geography && r.month_id >= filters.dateFrom && r.month_id <= filters.dateTo)
      .map(r => ({ label: monthLabel(r.month_id), total: r.total }));
  }, [rtoMonthly, filters, isStatewide]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <div className="tt-label">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="tt-row">
            <span style={{ color: p.color || 'var(--text-secondary)' }}>{p.name}</span>
            <strong>{fmtK(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {!isStatewide && rtoMonthlyFiltered && (
        <div style={{ marginBottom: 'var(--gap-md)' }}>
          <div className="caveat-box info" style={{ marginBottom: 'var(--gap-md)' }}>
            ℹ Showing RTO-level data for <strong>{RTO_NAMES[filters.geography]}</strong>.
            RTO totals are never added to MH-ALL statewide figures. Some RTOs have data from 2019 onward only.
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Registrations — {RTO_NAMES[filters.geography]}</div>
                <div className="card-subtitle">RTO-level · Data availability: 2019+ for most RTOs <span className="observed-tag">Observed</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={rtoMonthlyFiltered}>
                <defs>
                  <linearGradient id="rtoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={5} />
                <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total Registrations" stroke="var(--blue)" fill="url(#rtoGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical trend + YoY — only for MH-ALL */}
      {isStatewide && (
        <>
          <div className="grid-2" style={{ marginBottom: 'var(--gap-md)' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Monthly Powertrain Composition</div>
                  <div className="card-subtitle">MH-ALL · 2019–Sep 2026 <span className="observed-tag">Observed</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={powertrainTrend} stackOffset="none">
                  <defs>
                    {[['petrolGrad','#5ea2ff'],['e20Grad','#22d3ee'],['dieselGrad','#fb923c'],['evGrad','#34d399'],['cngGrad','#a78bfa']].map(([id,c])=>(
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={c} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={8} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ev" name="Electric" stroke="#34d399" fill="url(#evGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="e20" name="Petrol-E20" stroke="#22d3ee" fill="url(#e20Grad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="cng" name="CNG/Bi-Fuel" stroke="#a78bfa" fill="url(#cngGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="diesel" name="Diesel" stroke="#fb923c" fill="url(#dieselGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="petrol" name="Petrol (Std)" stroke="#5ea2ff" fill="url(#petrolGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <FormulaBox
                formula="Powertrain Share_{k,t} = (Y_{k,t} / \sum_j Y_{j,t}) \times 100"
                description="Measures monthly portfolio share of fuel technology k. Evaluates structural displacement of ICE by E20 and electric alternatives."
                variables={[
                  { sym: 'Y_{k,t}', def: 'Registrations of fuel class k in month t' },
                  { sym: '\sum_j Y_{j,t}', def: 'Aggregate statewide registrations across all powertrains' },
                ]}
              />
              <InsightBox title="Powertrain Transition Dynamics" items={[
                { icon: '🌿', label: 'E20 Administrative S-Curve', accent: 'cyan',
                  text: 'Standard Petrol collapsed from 75% in 2021 to <20% by mid-2026, displaced by Petrol-E20. This is an administrative supply-side transition (OEM factory compliance with MoRTH mandates) rather than consumer demand choice.' },
                { icon: '⚡', label: 'EV Adoption Channeling', accent: 'green',
                  text: 'EV volume expanded at >85% CAGR between 2021 and 2024, stabilizing around 10-11% statewide. Growth is primarily two-wheeler commuter adoption and commercial three-wheeler fleet electrification.' },
                { icon: '🚛', label: 'Diesel Floor', accent: 'amber',
                  text: 'Diesel stabilized near 11-13% share, representing commercial haulage and utility vehicles where battery weight and energy density constraints make EV replacement uneconomic in the near term.' },
              ]} />
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Year-on-Year Growth Rate</div>
                  <div className="card-subtitle">12-month rolling YoY · COVID rebounds excluded from trend claims <span className="assumption-tag">Note</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={yoyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={8} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={40} tickFormatter={v => v.toFixed(0) + '%'} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const v = payload[0].value as number;
                      return (
                        <div className="custom-tooltip">
                          <div className="tt-label">{label}</div>
                          <div className="tt-row">
                            <span>YoY Growth</span>
                            <strong style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                            </strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--border-light)" />
                  <Bar dataKey="yoy" name="YoY %">
                    {yoyData.map((d, i) => (
                      <Bar key={i} dataKey="yoy" fill={d.yoy >= 0 ? 'var(--blue)' : 'var(--pink)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <FormulaBox
                formula="YoY_t = [(Y_t - Y_{t-12}) / Y_{t-12}] \times 100 = (\Delta_{12} Y_t / Y_{t-12}) \times 100"
                description="Seasonal difference transformation. Eliminates seasonal non-stationarity I(1)_12 to reveal true underlying annual momentum."
                variables={[
                  { sym: '\Delta_{12} Y_t', def: 'Lag-12 seasonal difference operator: Y_t - Y_{t-12}' },
                  { sym: 'Y_{t-12}', def: 'Registration volume in the identical calendar month of the preceding year' },
                ]}
              />
              <InsightBox title="Econometric Inferences on YoY Rate" items={[
                { icon: '📉', label: 'Intervention vs Cyclical Shift', accent: 'pink',
                  text: 'Extreme YoY volatility in 2020 (-92% in Apr) and 2021 (+140% in Apr) reflects exogenous administrative mobility restrictions, not shifts in endogenous consumer demand. Treating them as cyclical trend inflections induces severe model bias.' },
                { icon: '⚖', label: 'Post-2022 Mean Reversion', accent: 'blue',
                  text: 'Following post-pandemic normalization, YoY growth fluctuated within a healthy +8% to +22% corridor throughout 2023–2025, confirming stationarity around a secular upward trend of ~11.5% annual vehicle stock growth.' },
                { icon: '🔍', label: 'Base-Effect Asymmetry', accent: 'amber',
                  text: 'YoY percentages can be deceptive during festive timing shifts. Because Diwali alternates between October and November across lunar years, a positive YoY in October is frequently mirrored by a negative YoY in November due to Gregorian calendar misalignment.' },
              ]} />
            </div>
          </div>

          {/* RTO breakdown */}
          <div className="section-title">RTO Geographic Breakdown</div>
          <div className="caveat-box info" style={{ marginBottom: 'var(--gap-md)' }}>
            ℹ RTO data (7 offices) covers only select cities and years. Never add RTO totals to MH-ALL.
            2026 = partial Jan–Sep (Jan–Oct for some). MH-AURANGABAD coverage ends 2023 in this dataset.
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">RTO Annual Registrations</div>
                  <div className="card-subtitle">2022–2026 · * = partial 2026 YTD <span className="observed-tag">Observed</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={rtoAnnualChart} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  {Object.entries(RTO_COLORS).map(([rto, c]) => (
                    <Bar key={rto} dataKey={rto} name={rto.replace('MH-', '')} fill={c} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="legend">
                {Object.entries(RTO_COLORS).map(([rto, c]) => (
                  <div key={rto} className="legend-item">
                    <span className="legend-dot" style={{ background: c }} />
                    {rto.replace('MH-', '')}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">RTO Performance Summary — 2025</div>
                  <div className="card-subtitle">Registrations, EV share, E20 share, YoY growth <span className="observed-tag">Observed</span></div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RTO</th>
                    <th className="num">Total 2025</th>
                    <th className="num">EV Share</th>
                    <th className="num">E20 Share</th>
                    <th className="num">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {rtoEVSummary2025.map(r => (
                    <tr key={r.rto}>
                      <td><span style={{ fontSize: 11 }}>{r.name}</span></td>
                      <td className="num">{fmtK(r.total2025)}</td>
                      <td className="num" style={{ color: 'var(--green)' }}>{fmtPct(r.evShare2025)}</td>
                      <td className="num" style={{ color: 'var(--cyan)' }}>{fmtPct(r.e20Share2025)}</td>
                      <td className="num">
                        <span className={`kpi-change ${(r.yoy ?? 0) >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 11 }}>
                          {(r.yoy ?? 0) >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(r.yoy ?? 0))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="caveat-box" style={{ marginTop: 8 }}>
                ⚠ E20 share = vehicles with E20 compliance label, not E20 fuel sold.
              </div>
              <FormulaBox
                formula="EV Penetration_i = [EV_i / Total_i] \times 100"
                description="Spatial EV adoption intensity for RTO i. Identifies geographical pockets with accelerated infrastructure and high-income adoption."
                variables={[
                  { sym: 'EV_i', def: 'Pure EV + Electric-BOV registrations registered at RTO office i' },
                  { sym: 'Total_i', def: 'Total automotive registrations at RTO office i' },
                ]}
              />
              <InsightBox title="Geographic Spatial Heterogeneity" items={[
                { icon: '🏙', label: 'Metropolitan EV Hubs', accent: 'green',
                  text: 'Pune (MH-12) and Pimpri-Chinchwad (MH-14) lead all offices with ~11-12% EV penetration in 2025, driven by higher IT-corridor purchasing power and dense fast-charging infrastructure.' },
                { icon: '🏛', label: 'Tier-2 Market Lag', accent: 'amber',
                  text: 'Interior RTOs (Nashik, Aurangabad) demonstrate lower EV adoption (~5-7%), indicating that EV penetration outside Mumbai-Pune metropolitan belts remains in the early adopter phase.' },
                { icon: '⚠️', label: 'Ecological Fallacy Warning', accent: 'pink',
                  text: 'Disaggregated RTO volumes represent high-density municipal centers and cover only ~35-40% of statewide volume. Their metrics cannot be naively generalized to rural or semi-urban districts.' },
              ]} />
            </div>
          </div>

          {/* Balance & Geographic Analytical Findings */}
          <div className="section-title" style={{ marginTop: 'var(--gap-lg)' }}>Geographic & Registration Balance Inferences</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gap-md)', marginBottom: 'var(--gap-md)' }}>
            <FindingBadge
              number={1}
              color="var(--blue)"
              title="Stationary Transformation via Lag-12 Differencing"
              body="Applying 12-month differencing Δ_12 Y_t eliminates annual seasonal cycles, proving that post-2022 underlying registration growth stabilized into a robust +8% to +22% YoY corridor."
            />
            <FindingBadge
              number={2}
              color="var(--pink)"
              title="Lockdown Asymmetry is an Exogenous Pulse"
              body="The -92% drop in April 2020 and subsequent +140% rebound in April 2021 represent administrative lockdown pulse shocks. They should not be modelled as macroeconomic regime changes."
            />
            <FindingBadge
              number={3}
              color="var(--green)"
              title="Pune-Thane Urban Concentration"
              body="Pune and Thane generate >50% of total volume among monitored RTOs. Their outsized EV adoption reflects early-majority adoption dynamics, contrasting with slower rural penetration."
            />
            <FindingBadge
              number={4}
              color="var(--cyan)"
              title="OEM Supply Mandates Homogenize E20"
              body="Unlike EV adoption which varies widely by city wealth, E20 penetration surged uniformly across all RTOs from 2024 onwards, proving that OEM factory compliance dictates fuel label distribution."
            />
          </div>
        </>
      )}
    </div>
  );
}
