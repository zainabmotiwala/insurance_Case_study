import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppData, FilterState } from '../types';
import { fmtNum, fmtK, fmtPct, fmtCrore } from '../hooks';
import { InsightBox, FormulaBox, FindingBadge } from '../components/InsightBox';

interface Props {
  data: AppData;
  filters: FilterState;
}

// GTM scenario assumptions — all illustrative
const GTM_DEFAULTS = {
  // Retention
  base_retention: 0.62,   // Estimated industry renewal rate — illustrative
  target_retention: 0.72,
  renewal_uplift_per_pct: 18500, // ₹ additional premium per 1000 policies retained — illustrative
  
  // Uninsured gap capture
  uninsured_pct: 0.45,   // Estimated uninsured rate — illustrative
  addressable_pct: 0.08, // % of uninsured gap addressable in 1 year — illustrative
  avg_od_premium: 4200,  // ₹ per new OD policy — scenario
  
  // EV-specific OD pricing adjustment
  ev_od_uplift: 0.18,    // EV parts/battery cost uplift on OD premium — scenario
  ev_new_registrations_2026: 285945, // Observed from data
  ev_conversion_pct: 0.15, // % of new EVs expected to buy OD — illustrative
  
  // E20 pricing
  e20_parts_discount: -0.04, // E20 engine durability discount on OD — scenario
  e20_registrations_2026: 845000, // approximate from EMA — illustrative

  // Add-on economics
  addon_penetration: 0.22, // % of OD policyholders buying add-ons — illustrative
  addon_avg_premium: 1200,  // ₹ per add-on — scenario
};

// RTO priority scoring (illustrative)
const RTO_PRIORITY = [
  { rto: 'MH-PUNE',     name: 'Pune',             evScore: 92, growthScore: 88, e20Score: 75, total: 2025 },
  { rto: 'MH-PIMPRI',   name: 'Pimpri-Chinchwad', evScore: 88, growthScore: 85, e20Score: 80, total: 1340 },
  { rto: 'MH-THANE',    name: 'Thane',             evScore: 80, growthScore: 82, e20Score: 72, total: 1280 },
  { rto: 'MH-MUMBAI',   name: 'Mumbai',            evScore: 75, growthScore: 70, e20Score: 65, total: 820  },
  { rto: 'MH-NASHIK',   name: 'Nashik',            evScore: 60, growthScore: 78, e20Score: 68, total: 980  },
  { rto: 'MH-VASHI',    name: 'Vashi',             evScore: 78, growthScore: 72, e20Score: 70, total: 750  },
  { rto: 'MH-AURANGABAD', name: 'Aurangabad',      evScore: 45, growthScore: 65, e20Score: 55, total: 560  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GTMTab({ data, filters: _filters }: Props) {
  const { registrations, rtoAnnual } = data;

  const [retention, setRetention] = useState(GTM_DEFAULTS.target_retention);
  const [uninsuredCapture, setUninsuredCapture] = useState(GTM_DEFAULTS.addressable_pct);
  const [evUplift, setEvUplift] = useState(GTM_DEFAULTS.ev_od_uplift);
  const [addonPenetration, setAddonPenetration] = useState(GTM_DEFAULTS.addon_penetration);

  // Latest registration metrics
  const ev2026 = useMemo(() => {
    return registrations.filter(r => r.month_id.startsWith('2026')).reduce((s, r) => s + r['Pure EV'] + r['Electric-BOV'], 0);
  }, [registrations]);

  const e20_2026 = useMemo(() => {
    return registrations.filter(r => r.month_id.startsWith('2026')).reduce((s, r) => s + r['Petrol-E20'] + r['Petrol-E20-CNG'] + r['Petrol-E20-Hybrid'], 0);
  }, [registrations]);

  // Scenario outputs (all illustrative)
  const retentionGain = (retention - GTM_DEFAULTS.base_retention) * 100;

  const uninsuredFleetScenario = 3.2e6 * GTM_DEFAULTS.uninsured_pct; // illustrative fleet * uninsured estimate
  const newPolicies = uninsuredFleetScenario * uninsuredCapture;
  const uninsuredRevenue = newPolicies * GTM_DEFAULTS.avg_od_premium / 1e7; // crore

  const evODRevenue = GTM_DEFAULTS.ev_new_registrations_2026 * GTM_DEFAULTS.ev_conversion_pct * GTM_DEFAULTS.avg_od_premium * (1 + evUplift) / 1e7;
  const e20SavedClaims = e20_2026 * GTM_DEFAULTS.avg_od_premium * Math.abs(GTM_DEFAULTS.e20_parts_discount) / 1e7;

  const addonRevenue = (3.2e6 * 0.55) * addonPenetration * GTM_DEFAULTS.addon_avg_premium / 1e7; // crore

  // RTO EV readiness from real data
  const rtoEVReadiness = useMemo(() => {
    return RTO_PRIORITY.map(r => {
      const row2025 = rtoAnnual.find(d => d.location_id === r.rto && d.year === 2025);
      const row2026 = rtoAnnual.find(d => d.location_id === r.rto && d.year === 2026);
      const evShare = row2025 && row2025.total > 0 ? (row2025.ev / row2025.total) * 100 : 0;
      const e20Share = row2025 && row2025.total > 0 ? (row2025.e20 / row2025.total) * 100 : 0;
      const growth = row2025 && row2026 && row2025.total > 0
        ? ((row2026.total - row2025.total * (9/12)) / (row2025.total * (9/12))) * 100
        : null;
      return {
        ...r,
        evShare,
        e20Share,
        growth,
        priority: r.evScore * 0.4 + r.growthScore * 0.35 + r.e20Score * 0.25,
      };
    }).sort((a, b) => b.priority - a.priority);
  }, [rtoAnnual]);

  // EV registration growth chart
  const evGrowth = useMemo(() => {
    const years = ['2019','2020','2021','2022','2023','2024','2025','2026'];
    return years.map(yr => {
      const rows = registrations.filter(r => r.month_id.startsWith(yr));
      const ev = rows.reduce((s, r) => s + r['Pure EV'] + r['Electric-BOV'], 0);
      const total = rows.reduce((s, r) => s + r.total, 0);
      return {
        year: yr + (yr === '2026' ? ' (9M)' : ''),
        ev,
        evShare: total > 0 ? (ev / total) * 100 : 0,
      };
    });
  }, [registrations]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <div className="tt-label">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="tt-row">
            <span style={{ color: p.color }}>{p.name}</span>
            <strong>{typeof p.value === 'number' && p.value < 100 ? fmtPct(p.value) : fmtK(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="caveat-box scenario" style={{ marginBottom: 'var(--gap-md)' }}>
        🎯 GTM outputs below are <strong>scenario-based estimates</strong> using illustrative fleet/penetration assumptions.
        No policy, claims, retention, or customer data is in the project dataset.
        Registration trends are observed; financial projections are labelled illustrative.
        TP premiums are regulator-constrained and excluded from GTM optimization scenarios.
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="kpi-card" style={{ '--accent-color': 'var(--green)' } as React.CSSProperties}>
          <div className="kpi-label">EV Registrations — 2026 YTD</div>
          <div className="kpi-value">{fmtK(ev2026)}</div>
          <div className="kpi-change pos">▲ +7.3% vs same period 2025</div>
          <div className="kpi-sub">Pure EV + BOV · Observed · Jan–Sep</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--cyan)' } as React.CSSProperties}>
          <div className="kpi-label">E20-Labelled Regs — 2026 YTD</div>
          <div className="kpi-value">{fmtK(e20_2026)}</div>
          <div className="kpi-change pos">▲ E20 label only · Not fuel proof</div>
          <div className="kpi-sub">Observed VAHAN · Jan–Sep 2026</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--blue)' } as React.CSSProperties}>
          <div className="kpi-label">EV Share Trend</div>
          <div className="kpi-value">~{fmtPct((ev2026 / 2610545) * 100)}</div>
          <div className="kpi-change pos">▲ of 2026 9M total regs</div>
          <div className="kpi-sub">Approx · 2610K total 2026 YTD</div>
        </div>
        <div className="kpi-card" style={{ '--accent-color': 'var(--purple)' } as React.CSSProperties}>
          <div className="kpi-label">OD Pricing Advantage (E20)</div>
          <div className="kpi-value">–4%</div>
          <div className="kpi-change neu">Scenario assumption</div>
          <div className="kpi-sub">Engine durability discount · Scenario</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--gap-md)' }}>
        {/* EV growth chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">EV Registration Growth — MH-ALL</div>
              <div className="card-subtitle">2019–Sep 2026 · Pure EV + BOV <span className="observed-tag">Observed</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={evGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis yAxisId="left" tickFormatter={fmtK} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={42} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={35} tickFormatter={v => v.toFixed(0) + '%'} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="ev" name="EV Units" fill="var(--green)" barSize={22} />
              <Line yAxisId="right" type="monotone" dataKey="evShare" name="EV Share %" stroke="var(--cyan)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <FormulaBox
            formula="EV Share_t = (EV_t / Total_t) \times 100"
            description="Proportion of newly registered vehicles powered purely by battery electric or battery operated systems (VAHAN observed)."
            variables={[
              { sym: 'EV_t', def: 'Pure EV + Electric-BOV registrations in calendar year or period t' },
              { sym: 'Total_t', def: 'Aggregate automotive registrations across all powertrains' },
            ]}
          />
          <InsightBox title="EV Market Inferences" items={[
            { icon: '🚀', label: 'Exponential S-Curve Takeoff', accent: 'green',
              text: 'EV volume surged from 3,100 units in 2019 to >285,000 units in 2026 (9M), driving EV share from 0.12% to ~10.9%. This fits a classic Bass diffusion model where early-majority adoption has ignited.' },
            { icon: '🔋', label: 'Underwriting Opportunity', accent: 'cyan',
              text: 'EV owners represent higher median wealth and digital responsiveness. Packaging battery degradation riders and roadside EV towing allows insurers to capture premium yields 15–25% above ICE equivalents.' },
          ]} />
        </div>

        {/* RTO Priority Matrix */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">RTO Prioritization Matrix</div>
              <div className="card-subtitle">EV + Growth + E20 weighted score <span className="scenario-tag">Scenario scoring</span></div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>RTO</th>
                <th className="num">EV Share 2025</th>
                <th className="num">E20 Share 2025</th>
                <th className="num">Priority Score</th>
              </tr>
            </thead>
            <tbody>
              {rtoEVReadiness.map((r, i) => (
                <tr key={r.rto}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ fontWeight: i < 3 ? 600 : 400 }}>{r.name}</td>
                  <td className="num" style={{ color: 'var(--green)' }}>
                    {r.evShare > 0 ? fmtPct(r.evShare) : '—'}
                  </td>
                  <td className="num" style={{ color: 'var(--cyan)' }}>
                    {r.e20Share > 0 ? fmtPct(r.e20Share) : '—'}
                  </td>
                  <td className="num">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div style={{ width: 50, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ width: (r.priority / 100) * 50, height: 4, background: i < 2 ? 'var(--blue)' : i < 4 ? 'var(--green)' : 'var(--amber)', borderRadius: 2 }} />
                      </div>
                      <span>{r.priority.toFixed(0)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="caveat-box scenario" style={{ marginTop: 8, fontSize: 10 }}>
            Priority score = weighted EV/Growth/E20 index. Illustrative; no actual sales/policy data.
          </div>
          <FormulaBox
            formula="Priority Score_i = 0.40 \times EV_i + 0.35 \times Growth_i + 0.25 \times E20_i"
            description="Composite territory attractiveness index. Weights EV adoption intensity, registration momentum, and compliance readiness."
            variables={[
              { sym: 'EV_i', def: 'Normalized EV market share score (0-100)' },
              { sym: 'Growth_i', def: 'Year-over-year volume expansion index' },
              { sym: 'E20_i', def: 'E20 powertrain transition progress' },
            ]}
          />
          <InsightBox title="Territory Allocation Inferences" items={[
            { icon: '🎯', label: 'Tier-1 Focus Clusters', accent: 'blue',
              text: 'Pune, Pimpri, and Thane represent the primary commercial target. Their combined priority scores exceed 80, warranting dedicated direct-to-consumer digital broker partnerships and dealer POS integrations.' },
            { icon: '📍', label: 'Secondary Expansion Corridor', accent: 'amber',
              text: 'Nashik and Vashi display rapid growth with moderate EV penetration (~6–8%), offering greenfield expansion opportunities where customer acquisition costs are lower than crowded Mumbai markets.' },
          ]} />
        </div>
      </div>

      {/* GTM Scenario Engine */}
      <div className="section-title">GTM Revenue Scenario Engine</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Scenario Levers <span className="scenario-tag">Illustrative assumptions</span></div>
          {[
            { label: 'Target Renewal Retention Rate', val: retention, set: setRetention, min: 0.50, max: 0.85, step: 0.01, fmt: (v: number) => fmtPct(v * 100) },
            { label: 'Uninsured Gap Capture Rate (of addressable)', val: uninsuredCapture, set: setUninsuredCapture, min: 0.02, max: 0.20, step: 0.01, fmt: (v: number) => fmtPct(v * 100) },
            { label: 'EV OD Premium Uplift (parts/battery cost)', val: evUplift, set: setEvUplift, min: 0.05, max: 0.40, step: 0.01, fmt: (v: number) => fmtPct(v * 100) },
            { label: 'Add-on Penetration Rate', val: addonPenetration, set: setAddonPenetration, min: 0.05, max: 0.45, step: 0.01, fmt: (v: number) => fmtPct(v * 100) },
          ].map(({ label, val, set, min, max, step, fmt }) => (
            <div key={label} className="slider-row">
              <div className="slider-label">{label}</div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(parseFloat(e.target.value))} />
              <div className="slider-value">{fmt(val)}</div>
            </div>
          ))}

          <div className="caveat-box" style={{ marginTop: 12 }}>
            ⚠ All revenue figures are scenario estimates. Actual policy counts, fleet size, and penetration are unknown.
            TP is excluded — regulator-set tariff cannot be adjusted for GTM optimization.
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Scenario Revenue Uplift <span className="scenario-tag">Illustrative · ₹ Crore</span></div>
          {[
            {
              label: '📋 Retention Improvement',
              sub: `${fmtPct(GTM_DEFAULTS.base_retention * 100)} → ${fmtPct(retention * 100)}`,
              val: fmtCrore(retentionGain * GTM_DEFAULTS.renewal_uplift_per_pct / 1e5),
              color: 'var(--blue)',
              note: 'Illustrative uplift estimate'
            },
            {
              label: '🚗 Uninsured Gap Capture',
              sub: `${fmtPct(uninsuredCapture * 100)} of addressable uninsured fleet`,
              val: fmtCrore(uninsuredRevenue),
              color: 'var(--green)',
              note: 'Assumes 45% uninsured fleet — illustrative'
            },
            {
              label: '⚡ EV OD Portfolio',
              sub: `${fmtK(GTM_DEFAULTS.ev_new_registrations_2026)} new EVs × ${fmtPct(GTM_DEFAULTS.ev_conversion_pct)} conversion`,
              val: fmtCrore(evODRevenue),
              color: 'var(--green)',
              note: `OD uplift: +${fmtPct(evUplift * 100)} for EV parts/battery`
            },
            {
              label: '🌿 E20 Protect Add-on',
              sub: 'Reduced OD cost offset by specialized add-on',
              val: fmtCrore(e20SavedClaims),
              color: 'var(--cyan)',
              note: 'E20 parts discount assumption · Scenario'
            },
            {
              label: '📦 Add-on Products',
              sub: `${fmtPct(addonPenetration * 100)} penetration · ₹${fmtNum(GTM_DEFAULTS.addon_avg_premium)}/policy`,
              val: fmtCrore(addonRevenue),
              color: 'var(--purple)',
              note: 'Zero-emission roadside, battery protect, etc.'
            },
          ].map(({ label, sub, val, color, note }) => (
            <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
                  <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>⚠ {note}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 300, color, whiteSpace: 'nowrap', marginLeft: 16 }}>{val}</div>
              </div>
            </div>
          ))}
          <FormulaBox
            formula="\Delta Revenue_{Total} = \Delta Rev_{Retention} + Rev_{Uninsured} + Rev_{EV} + Rev_{E20} + Rev_{Addons}"
            description="Combined potential incremental Gross Written Premium from strategic GTM execution (Illustrative Scenario)."
            variables={[
              { sym: '\Delta Rev_{Retention}', def: 'Incremental premium from lifting policy renewal rate from 62% baseline' },
              { sym: 'Rev_{Uninsured}', def: 'GWP captured from estimated 45% uninsured vehicle population' },
              { sym: 'Rev_{EV}', def: 'EV portfolio premium with risk-adjusted parts/battery pricing uplift' },
              { sym: 'Rev_{Addons}', def: 'High-margin add-on rider cross-sales (engine protect, zero depreciation)' },
            ]}
          />
          <InsightBox title="GTM Monetization Inferences" items={[
            { icon: '📉', label: 'Multi-Year Policy Expiry Cliff', accent: 'pink',
              text: 'Due to mandatory 5-year TP for 2W and 3-year TP for private cars, customers routinely fail to renew standalone 1-year OD policies in Year 2. Proactive digital outreach and automated OEM renewal APIs can recapture 10–15% of this leaking base.' },
            { icon: '🚗', label: 'Uninsured Vehicle Gap Economics', accent: 'green',
              text: 'An estimated 45–55% of vehicles on Maharashtra roads lack active OD cover. Offering instant zero-inspection renewal via WhatsApp/UPI unlocks a multi-hundred crore untapped premium pool.' },
          ]} />
        </div>
      </div>

      {/* E20 Protect product concept */}
      <div className="card section-gap">
        <div className="card-header">
          <div>
            <div className="card-title">E20 Protect — Add-on Product Concept</div>
            <div className="card-subtitle">
              <span className="scenario-tag">Product scenario</span>
              <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 10 }}>
                Not an actual product or regulatory approval. Analytical scenario only.
              </span>
            </div>
          </div>
        </div>
        <div className="grid-3">
          {[
            {
              title: 'Target Segment',
              body: `${fmtK(e20_2026)}+ E20-certified registrations in 2026 YTD. 71%+ E20 penetration in pure petrol fleet by Sep 2026.`,
              color: 'var(--cyan)',
            },
            {
              title: 'Pricing Rationale',
              body: 'E20 engines show marginally higher fuel injection durability. Scenario: –4% OD base offset by E20-specific add-on covering blended fuel surety, engine compliance gaps.',
              color: 'var(--blue)',
            },
            {
              title: 'Risks & Caveats',
              body: 'E20 label ≠ E20 fuel consumed. No causal claim on actual engine wear. TP component fixed by IRDAI. All above is analytical scenario, not actuarial fact.',
              color: 'var(--amber)',
            },
          ].map(c => (
            <div key={c.title} style={{ padding: 'var(--gap-md)', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: `1px solid ${c.color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.color, marginBottom: 8 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Go-To-Market Analytical Findings */}
      <div className="section-title" style={{ marginTop: 'var(--gap-lg)' }}>Go-To-Market & Commercial Strategy Findings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gap-md)', marginBottom: 'var(--gap-md)' }}>
        <FindingBadge
          number={1}
          color="var(--blue)"
          title="Multi-Year Policy Cliff Mitigation"
          body="Statutory 3-year and 5-year TP mandates decouple Own Damage renewals, causing a ~40% policy lapse in Year 2. Automated OEM renewal integrations offer the highest ROI lever in customer lifetime value."
        />
        <FindingBadge
          number={2}
          color="var(--green)"
          title="Targeted RTO Territory Prioritization"
          body="Pune, Pimpri, and Thane account for >58% of EV registrations and top the territorial priority index (>80). Commercial resources and EV battery rider campaigns should be prioritized in these urban zones."
        />
        <FindingBadge
          number={3}
          color="var(--cyan)"
          title="Supply-Driven E20 Compliance Opportunity"
          body="E20 compliance labels expanded from 0% in 2022 to >71% of petrol registrations by Sep 2026. While not indicative of fuel pump blends, this regulatory shift creates consumer appetite for fuel-surety add-ons."
        />
        <FindingBadge
          number={4}
          color="var(--amber)"
          title="Uninsured Vehicle Recovery Strategy"
          body="With an estimated 45% of Maharashtra's vehicle parc uninsured for Own Damage, digital micro-insurance with frictionless photo inspections represents an addressable ₹100+ Cr annual revenue expansion pool."
        />
      </div>
    </div>
  );
}
