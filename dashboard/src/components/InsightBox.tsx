/* ============================================================
   InsightBox — theory-grounded analytical inference panel
   Appears beneath charts to explain what the data means
   ============================================================ */

interface InsightItem {
  icon: string;
  label: string;
  text: string;
  accent?: 'blue' | 'green' | 'pink' | 'amber' | 'purple' | 'cyan';
}

interface InsightBoxProps {
  title?: string;
  items: InsightItem[];
  style?: React.CSSProperties;
}

const ACCENT_COLORS: Record<string, string> = {
  blue:   'var(--blue)',
  green:  'var(--green)',
  pink:   'var(--pink)',
  amber:  'var(--amber)',
  purple: 'var(--purple)',
  cyan:   'var(--cyan)',
};

export function InsightBox({ title, items, style }: InsightBoxProps) {
  return (
    <div
      style={{
        background: 'rgba(94,162,255,0.03)',
        border: '1px solid rgba(94,162,255,0.12)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginTop: 12,
        ...style,
      }}
    >
      {title && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
          🔍 {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: ACCENT_COLORS[item.accent ?? 'blue'],
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginRight: 6,
                }}
              >
                {item.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {item.text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FormulaBox: inline formula display ── */
interface FormulaBoxProps {
  formula: string;
  description: string;
  variables?: { sym: string; def: string }[];
}

export function FormulaBox({ formula, description, variables }: FormulaBoxProps) {
  return (
    <div style={{
      background: 'rgba(167,139,250,0.04)',
      border: '1px solid rgba(167,139,250,0.15)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      marginTop: 10,
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--purple)', marginBottom: 6, fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Formula
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em', marginBottom: 4 }}>
        {formula}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginBottom: variables?.length ? 6 : 0 }}>
        {description}
      </div>
      {variables?.length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {variables.map(v => (
            <div key={v.sym} style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
              <strong style={{ color: 'var(--purple)' }}>{v.sym}</strong> = {v.def}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── FindingBadge: standalone numbered finding ── */
interface FindingBadgeProps {
  number: number;
  title: string;
  body: string;
  color?: string;
}

export function FindingBadge({ number, title, body, color = 'var(--blue)' }: FindingBadgeProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '12px 16px',
      background: 'var(--bg-app)',
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: color, color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  );
}
