import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';
import type { ForecastAnswer } from '../types';
import { fmtNum, fmtK, fmtPct } from '../hooks';

const EXAMPLES = [
  'What would demand for diesel vehicles look like in Aug 2028?',
  'Electric vehicles in March 2027',
  'Petrol registrations in Dec 2027',
  'CNG vehicles in Oct 2028',
  'Total registrations in 2028',
];

export default function ForecastQuery() {
  const [query, setQuery] = useState(EXAMPLES[0]);
  const [answer, setAnswer] = useState<ForecastAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast?q=' + encodeURIComponent(q));
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        throw new Error(body?.error ?? `Forecast API returned ${res.status}. Is scripts/forecast_service.py running?`);
      }
      setAnswer(body);
    } catch (e) {
      const msg = e instanceof TypeError
        ? 'Could not reach the forecast API. Start it with: .venv/bin/python scripts/forecast_service.py'
        : String((e as Error).message ?? e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(query);
  };

  // History + forecast path on one axis; the 80% band is a range Area
  const chartData = useMemo(() => {
    if (!answer) return [];
    const rows: Record<string, unknown>[] = answer.history.map(h => ({ date: h.date, Actual: h.actual }));
    // Join forecast to the last actual so the lines connect
    if (rows.length && answer.path.length) {
      const last = rows[rows.length - 1];
      last.Forecast = last.Actual;
      last.band = [last.Actual, last.Actual];
    }
    for (const p of answer.path) {
      rows.push({ date: p.date, Forecast: Math.round(p.forecast), band: [Math.round(p.lower80), Math.round(p.upper80)] });
    }
    return rows;
  }, [answer]);

  const targetDate = answer?.target_month
    ? `${answer.target_year}-${String(answer.target_month).padStart(2, '0')}`
    : null;
  const r = answer?.result;

  return (
    <div className="card" style={{ marginBottom: 'var(--gap-md)' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Ask the Forecast — SARIMA Demand Projection</div>
          <div className="card-subtitle">
            Ask about a vehicle type and a target month/year · model refit on all observed data
            <span className="scenario-tag" style={{ marginLeft: 8 }}>Forecast</span>
          </div>
        </div>
      </div>

      <form className="forecast-query-form" onSubmit={onSubmit}>
        <input
          className="forecast-query-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. What would demand for diesel vehicles look like in Aug 2028?"
          aria-label="Forecast question"
        />
        <button className="forecast-query-btn" type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Forecasting…' : 'Forecast'}
        </button>
      </form>
      <div className="forecast-query-examples">
        {EXAMPLES.map(ex => (
          <button key={ex} type="button" className="forecast-chip" onClick={() => { setQuery(ex); ask(ex); }}>
            {ex}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
        Vehicle types: diesel · petrol (incl. E20) · electric / EV · CNG · total. Month formats: “Aug 2028”, “2028-08”, “08/2028”; a year alone gives the Jan–Dec total.
      </div>

      {error && <div className="caveat-box" style={{ marginTop: 'var(--gap-md)' }}>⚠ {error}</div>}

      {answer && r && (
        <div style={{ marginTop: 'var(--gap-md)' }}>
          <div className="forecast-answer">
            {r.observed ? 'Observed' : 'Forecast'} registrations for <strong>{answer.series_label}</strong> in{' '}
            <strong>{answer.period_label}</strong>:{' '}
            <strong style={{ color: 'var(--blue)' }}>{fmtNum(r.value)}</strong>
            {r.lower80 !== undefined && r.upper80 !== undefined && (
              <> (80% interval {fmtNum(r.lower80)} – {fmtNum(r.upper80)})</>
            )}
            {answer.yoy_pct !== null && (
              <>, {answer.yoy_pct >= 0 ? 'up' : 'down'} {fmtPct(Math.abs(answer.yoy_pct))} on the same period a year earlier</>
            )}.
          </div>

          <div className="grid-4" style={{ marginBottom: 'var(--gap-md)' }}>
            <div className="kpi-card" style={{ '--accent-color': 'var(--blue)' } as React.CSSProperties}>
              <div className="kpi-label">{r.observed ? 'Observed' : 'Point forecast'}</div>
              <div className="kpi-value">{fmtK(Math.round(r.value))}</div>
              <div className="kpi-sub">{answer.period_label}</div>
            </div>
            <div className="kpi-card" style={{ '--accent-color': 'var(--purple)' } as React.CSSProperties}>
              <div className="kpi-label">80% / 95% interval</div>
              <div className="kpi-value" style={{ fontSize: 18 }}>
                {r.lower80 !== undefined ? `${fmtK(Math.round(r.lower80))} – ${fmtK(Math.round(r.upper80!))}` : '—'}
              </div>
              <div className="kpi-sub">
                {r.lower95 !== undefined ? `95%: ${fmtK(Math.round(r.lower95))} – ${fmtK(Math.round(r.upper95!))}` : 'Monthly intervals only'}
              </div>
            </div>
            <div className="kpi-card" style={{ '--accent-color': 'var(--green)' } as React.CSSProperties}>
              <div className="kpi-label">vs same period prior year</div>
              <div className="kpi-value">{answer.yoy_pct !== null ? fmtPct(answer.yoy_pct) : '—'}</div>
              <div className="kpi-sub">
                {answer.prior_year ? `${fmtK(Math.round(answer.prior_year.value))} ${answer.prior_year.observed ? 'observed' : 'forecast'}` : 'No prior-year data'}
              </div>
            </div>
            <div className="kpi-card" style={{ '--accent-color': 'var(--amber)' } as React.CSSProperties}>
              <div className="kpi-label">Horizon</div>
              <div className="kpi-value">{answer.horizon_months}<span className="kpi-unit">months</span></div>
              <div className="kpi-sub">past last observed ({answer.last_observed})</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={46} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="custom-tooltip">
                      <div className="tt-label">{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.name} className="tt-row">
                          <span style={{ color: p.color || 'var(--text-secondary)' }}>{p.name}</span>
                          <strong>
                            {Array.isArray(p.value) ? `${fmtNum(p.value[0])} – ${fmtNum(p.value[1])}` : fmtNum(p.value)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <ReferenceLine x={answer.last_observed} stroke="var(--border-light)" strokeDasharray="4 4"
                label={{ value: 'Forecast →', fill: 'var(--text-muted)', fontSize: 9, position: 'insideTopLeft' }} />
              <Area dataKey="band" name="80% interval" stroke="none" fill="var(--blue)" fillOpacity={0.15} isAnimationActive={false} />
              <Line type="monotone" dataKey="Actual" stroke="var(--text-primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Forecast" name="SARIMA forecast" stroke="var(--blue)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              {targetDate && !r.observed && (
                <ReferenceDot x={targetDate} y={Math.round(r.value)} r={5} fill="var(--pink)" stroke="none" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="legend">
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--text-primary)' }} />Actual (last 36 months)</div>
            <div className="legend-item"><span className="legend-line" style={{ background: 'var(--blue)' }} />SARIMA forecast</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--blue)', opacity: 0.35 }} />80% interval</div>
            {targetDate && <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--pink)' }} />Target month</div>}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Model: {answer.model}</div>
          {answer.warnings.map(w => (
            <div key={w} className="caveat-box scenario" style={{ marginTop: 8 }}>⚠ {w}</div>
          ))}
        </div>
      )}
    </div>
  );
}
