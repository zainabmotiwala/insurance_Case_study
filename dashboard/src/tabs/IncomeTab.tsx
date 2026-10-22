import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AppData, FilterState } from '../types';
import { fmtNum, fmtPct, fmtK } from '../hooks';
import { InsightBox, FormulaBox, FindingBadge } from '../components/InsightBox';
import ForecastQuery from '../components/ForecastQuery';

interface Props {
  data: AppData;
  filters: FilterState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function IncomeTab({ data, filters: _filters }: Props) {
  const { gdpi, rollingOrigin, forecastMetrics } = data;

  // GDPI historical for Motor OD and TP
  const gdpiMotor = useMemo(() => {
    const fys = ['2014-15','2015-16','2016-17','2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24','2024-25'];
    return fys.map(fy => {
      const od = gdpi.find(r => r.fy_id === fy && r.segment === 'Motor Own Damage')?.premium_crore ?? 0;
      const tp = gdpi.find(r => r.fy_id === fy && r.segment === 'Motor Third Party')?.premium_crore ?? 0;
      const total = gdpi.find(r => r.fy_id === fy && r.segment === 'Grand Total')?.premium_crore ?? 0;
      return { fy: fy, od, tp, motor: od + tp, grand: total };
    });
  }, [gdpi]);

  // Rolling origin — actual vs SARIMA vs SNaive
  const rollingData = useMemo(() => {
    return rollingOrigin.map(r => ({
      date: r.date.slice(0, 7),
      Actual: r.actual,
      SARIMA: Math.round(r.sarima),
      SNaive: r.snaive,
      sarima_err: r.sarima_err,
      snaive_err: r.snaive_err,
      phase: r.date < '2025-01-01' ? 'Validation' : 'Test',
    }));
  }, [rollingOrigin]);

  // Model performance table grouped by series
  const metricsBySeries = useMemo(() => {
    const series = ['Total', 'Petrol_Combined', 'Diesel', 'Electric'];
    return series.map(s => {
      const rows = forecastMetrics.filter(m => m.series === s);
      // find champion per period
      const champVal = rows.reduce((best, r) => r.val_wape < best.val_wape ? r : best, rows[0]);
      const champTest = rows.reduce((best, r) => r.test_wape < best.test_wape ? r : best, rows[0]);
      const champOverall = rows.reduce((best, r) => r.overall_wape < best.overall_wape ? r : best, rows[0]);
      return { series: s, rows, champVal: champVal?.model, champTest: champTest?.model, champOverall: champOverall?.model };
    });
  }, [forecastMetrics]);

  // Absolute error comparison chart
  const errorChart = useMemo(() => {
    return rollingData.map(r => ({
      date: r.date,
      'SARIMA Error': r.sarima_err,
      'SNaive Error': r.snaive_err,
      phase: r.phase,
    }));
  }, [rollingData]);

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
      <ForecastQuery />

      {/* GDPI KPIs */}
      <div className="grid-4" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="kpi-card" style={{ '--accent-color': 'var(--blue)' } as React.CSSProperties}>
          <div className="kpi-label">Motor OD GDPI — FY 2024-25</div>
          <div className="kpi-value">₹{gdpiMotor[gdpiMotor.length-1]?.od.toFixed(0)} <span className="kpi-unit">Cr</span></div>
          <div className="kpi-change pos">▲ +18.1% YoY</div>
          <div className="kpi-sub">Annual · Observed · IRDAI Table 42</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--pink)' } as React.CSSProperties}>
          <div className="kpi-label">Motor TP GDPI — FY 2024-25</div>
          <div className="kpi-value">₹{gdpiMotor[gdpiMotor.length-1]?.tp.toFixed(0)} <span className="kpi-unit">Cr</span></div>
          <div className="kpi-change pos">▲ +18.3% YoY</div>
          <div className="kpi-sub">Tariff-set · Regulator-constrained</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--blue)' } as React.CSSProperties}>
          <div className="kpi-label">SARIMA Test WAPE (Total)</div>
          <div className="kpi-value">6.73<span className="kpi-unit">%</span></div>
          <div className="kpi-change pos">▲ Champion model · Jan–Sep 2026</div>
          <div className="kpi-sub">Out-of-sample test window · Observed</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--green)' } as React.CSSProperties}>
          <div className="kpi-label">SARIMA vs SNaive Error Reduction</div>
          <div className="kpi-value">32.7<span className="kpi-unit">%</span></div>
          <div className="kpi-change pos">Over 33 rolling-origin horizons</div>
          <div className="kpi-sub">Walk-forward validation · Observed</div>
        </div>
      </div>

      <div className="caveat-box info" style={{ marginBottom: 'var(--gap-md)' }}>
        ℹ GDPI data: Annual FY 2014-25 from IRDAI Table 42. Cannot be divided monthly. Jan–Sep 2026 GDPI (insurer segment-wise extracts) is YTD and not comparable to annual figures.
        Forecast models run on VAHAN registrations, not insurance premiums.
      </div>

      {/* GDPI + Registrations dual axis chart concept */}
      <div className="grid-2" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">GDPI — Motor OD vs TP Historical</div>
              <div className="card-subtitle">FY 2014-15 to 2024-25 · ₹ Crore <span className="observed-tag">Observed</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={gdpiMotor}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="fy" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={1} angle={-35} textAnchor="end" height={40} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={50} tickFormatter={v => '₹' + v} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="custom-tooltip">
                      <div className="tt-label">{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.name} className="tt-row">
                          <span style={{ color: p.color }}>{p.name}</span>
                          <strong>₹{fmtNum(p.value, 0)} Cr</strong>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="od" name="Motor OD" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="tp" name="Motor TP" stroke="var(--pink)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="motor" name="Motor Total" stroke="var(--purple)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="legend">
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--blue)' }} />Motor OD (flexible)</div>
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--pink)' }} />Motor TP (regulator-constrained)</div>
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--purple)' }} />Total Motor</div>
          </div>
          <FormulaBox
            formula="YoY GDPI Growth_t = [(GDPI_t - GDPI_{t-1}) / GDPI_{t-1}] \times 100"
            description="Measures annual expansion in Maharashtra motor premium pool across fiscal years (IRDAI Table 42)."
            variables={[
              { sym: 'GDPI_t', def: 'Gross direct premium written in fiscal year t (₹ Crore)' },
              { sym: 'GDPI_{t-1}', def: 'Gross direct premium written in prior fiscal year' },
            ]}
          />
          <InsightBox title="Insurance Premium Growth Inferences" items={[
            { icon: '📈', label: '10-Year Sustained Expansion', accent: 'blue',
              text: 'Motor GDPI grew from ₹4,100 Cr in FY15 to ₹11,500+ Cr in FY25 (>10.8% CAGR), propelled by expanding vehicle parc and higher average insured declared value (IDV).' },
            { icon: '⚖', label: 'OD/TP Parity Convergence', accent: 'purple',
              text: 'Motor OD and TP premium volumes grew in lockstep (~₹5,750 Cr each in FY25), maintaining an OD/TP ratio close to 1.0. This indicates balanced fleet coverage despite TP tariff stagnation.' },
          ]} />
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Rolling-Origin: Actual vs Forecast</div>
              <div className="card-subtitle">33 walk-forward horizons · Jan 2024 – Sep 2026 <span className="observed-tag">Observed vs Forecast</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rollingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={4} />
              <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x="2025-01" stroke="var(--border-light)" strokeDasharray="4 4"
                label={{ value: 'Test →', fill: 'var(--text-muted)', fontSize: 9 }} />
              <Line type="monotone" dataKey="Actual" stroke="var(--text-primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="SARIMA" stroke="var(--blue)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Line type="monotone" dataKey="SNaive" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="3 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="legend">
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--text-primary)' }} />Actual</div>
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--blue)' }} />SARIMA (Champion)</div>
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--text-muted)' }} />Seasonal Naive (Baseline)</div>
          </div>
          <FormulaBox
            formula="(1 - \phi_1 B)(1 - \Phi_1 B^{12})(1 - B)(1 - B^{12}) Y_t = (1 + \theta_1 B)\epsilon_t + \sum \beta_k I_{COVID,k}(t)"
            description="Champion SARIMA(1,1,1)(1,1,0)_12 with exogenous pulse intervention indicators for 2020-2021 lockdown mobility shocks."
            variables={[
              { sym: 'B', def: 'Backshift operator: B^k Y_t = Y_{t-k}' },
              { sym: '(1-B)(1-B^{12})', def: 'Non-seasonal and seasonal differencing for stationary mean' },
              { sym: 'I_{COVID,k}(t)', def: 'Exogenous pulse regressors for March-May 2020 and May 2021 lockdowns' },
            ]}
          />
          <InsightBox title="Walk-Forward Evaluation Inferences" items={[
            { icon: '🏆', label: '32.7% Error Reduction', accent: 'blue',
              text: 'Over 33 rolling-origin test horizons, SARIMA achieved 24,948 units average MAE vs 37,092 units for Seasonal Naive, outperforming the baseline in 29 out of 33 evaluation periods.' },
            { icon: '🛡', label: 'Zero Lookahead Leakage', accent: 'green',
              text: 'At each origin month t, parameters were fitted strictly on history up to t-1. Validation (2024-2025) was used purely for model selection; final test (2026) maintained a 6.73% WAPE.' },
          ]} />
        </div>
      </div>

      {/* Absolute error chart */}
      <div className="card section-gap">
        <div className="card-header">
          <div>
            <div className="card-title">1-Step Ahead Absolute Forecast Error by Month</div>
            <div className="card-subtitle">SARIMA vs Seasonal Naive · Lower is better · Validation (2024) and Test (2026) windows</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="observed-tag">Observed residuals</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={errorChart} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={3} />
            <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={42} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="custom-tooltip">
                    <div className="tt-label">{label}</div>
                    {payload.map((p: any) => (
                      <div key={p.name} className="tt-row">
                        <span style={{ color: p.color }}>{p.name}</span>
                        <strong>{fmtK(p.value)} units</strong>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <ReferenceLine x="2025-01" stroke="var(--border-light)" strokeDasharray="4 4" />
            <Bar dataKey="SARIMA Error" name="SARIMA |Error|" fill="var(--blue)" opacity={0.8} />
            <Bar dataKey="SNaive Error" name="SNaive |Error|" fill="var(--text-muted)" opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
        <FormulaBox
          formula="WAPE = [\sum |Y_t - \hat{Y}_t| / \sum Y_t] \times 100"
          description="Weighted Absolute Percentage Error. Preferred over standard MAPE because it weights errors by volume and avoids division-by-zero during low-volume months."
          variables={[
            { sym: 'Y_t', def: 'Actual observed registrations in month t' },
            { sym: '\hat{Y}_t', def: '1-step ahead out-of-sample forecast generated strictly from history prior to t' },
            { sym: 'MAE', def: '(1/n) \sum |Y_t - \hat{Y}_t|: Mean Absolute Error in unit vehicle registrations' },
          ]}
        />
        <InsightBox title="Residual & Diagnostic Inferences" items={[
          { icon: '🎯', label: 'White-Noise Residual Sequence', accent: 'green',
            text: 'Ljung-Box diagnostic tests on SARIMA residuals yield p=0.684 at lag 6 and p=0.464 at lag 12 (p > 0.05). This confirms the absence of residual autocorrelation, proving all linear structure is captured.' },
          { icon: '📅', label: 'Festive Shift Residual Spikes', accent: 'amber',
            text: 'Residual error spikes occur almost exclusively in October/November, driven by lunar calendar shifts of Diwali between Gregorian months rather than model misspecification.' },
        ]} />
      </div>

      {/* Model performance table */}
      <div className="section-gap">
        <div className="section-title">Model Performance Summary (Authoritative — forecast_metrics_summary.csv)</div>
        <div className="caveat-box info" style={{ marginBottom: 'var(--gap-md)' }}>
          ℹ RMSE figures from FORECAST_AND_FINDINGS_REPORT.md were superseded in audit 2026-10-21. MAE and WAPE reproduced exactly.
          Champion selection uses validation WAPE. Test data kept out of model selection.
        </div>
        {metricsBySeries.map(({ series, rows, champVal }) => (
          <div key={series} className="card" style={{ marginBottom: 'var(--gap-md)' }}>
            <div className="card-header">
              <div>
                <div className="card-title">{series.replace('_', ' ')} Series</div>
                <div className="card-subtitle">Champion (val): <span style={{ color: 'var(--blue)' }}>{champVal}</span></div>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="num">Val MAE</th>
                  <th className="num">Val WAPE</th>
                  <th className="num">Test MAE</th>
                  <th className="num">Test WAPE</th>
                  <th className="num">Overall MAE</th>
                  <th className="num">Overall WAPE</th>
                </tr>
              </thead>
              <tbody>
                {rows.sort((a,b) => a.overall_wape - b.overall_wape).map(r => (
                  <tr key={r.model}>
                    <td className={r.model === champVal ? 'champion' : ''}>
                      {r.model === champVal && '★ '}{r.model}
                    </td>
                    <td className="num">{fmtNum(r.val_mae, 0)}</td>
                    <td className="num">{fmtPct(r.val_wape)}</td>
                    <td className="num">{fmtNum(r.test_mae, 0)}</td>
                    <td className="num">{fmtPct(r.test_wape)}</td>
                    <td className="num">{fmtNum(r.overall_mae, 0)}</td>
                    <td className={`num ${r.model === champVal ? 'champion' : ''}`}>{fmtPct(r.overall_wape)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Time-Series & Forecasting Analytical Findings */}
      <div className="section-title" style={{ marginTop: 'var(--gap-lg)' }}>Forecasting & Econometric Benchmark Findings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gap-md)', marginBottom: 'var(--gap-md)' }}>
        <FindingBadge
          number={1}
          color="var(--blue)"
          title="SARIMA(1,1,1)(1,1,0)12 Dominance"
          body="For Total Registrations, SARIMA with COVID intervention conditioning delivered 9.05% overall WAPE and 6.73% test WAPE, reducing error by 32.7% over the Seasonal Naive baseline."
        />
        <FindingBadge
          number={2}
          color="var(--pink)"
          title="Unadjusted Holt-Winters Parameter Bias"
          body="Standard Holt-Winters triple exponential smoothing without intervention adjustments suffered a 34.06% validation WAPE because the 2020 lockdown severely biased its trend slope downward."
        />
        <FindingBadge
          number={3}
          color="var(--green)"
          title="Gradient Boosting Superiority in Non-Linear Regimes"
          body="On Electric registrations, Lagged Gradient Boosting outperformed all parametric models (21.53% overall WAPE), as recursive tree partitions naturally accommodated exponential EV S-curve adoption."
        />
        <FindingBadge
          number={4}
          color="var(--amber)"
          title="Seasonal Persistence in Mature Diesel Fleets"
          body="For Diesel registrations, the Seasonal-Naive baseline achieved champion accuracy (15.24% WAPE), proving that commercial diesel fleet renewals follow highly predictable 12-month cyclical repetition."
        />
      </div>
    </div>
  );
}
