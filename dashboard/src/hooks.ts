import { useState, useEffect } from 'react';
import type { AppData } from './types';

export function useAppData(): { data: AppData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/registrations_mh_monthly.json').then(r => r.json()),
      fetch('/gdpi_maharashtra.json').then(r => r.json()),
      fetch('/rolling_origin.json').then(r => r.json()),
      fetch('/forecast_metrics.json').then(r => r.json()),
      fetch('/timeseries_diagnostics.json').then(r => r.json()),
      fetch('/rto_monthly.json').then(r => r.json()),
      fetch('/rto_annual.json').then(r => r.json()),
      fetch('/gdpi_segment_wise.json').then(r => r.json()),
    ])
      .then(([registrations, gdpi, rollingOrigin, forecastMetrics, timeseriesDiag, rtoMonthly, rtoAnnual, gdpiSegment]) => {
        setData({ registrations, gdpi, rollingOrigin, forecastMetrics, timeseriesDiag, rtoMonthly, rtoAnnual, gdpiSegment });
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

// Format helpers
export function fmtNum(n: number, dp = 0): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtK(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

export function fmtCrore(n: number): string {
  if (!isFinite(n)) return '—';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K Cr';
  return '₹' + n.toFixed(0) + ' Cr';
}

export function fmtPct(n: number, dp = 1): string {
  if (!isFinite(n)) return '—';
  return n.toFixed(dp) + '%';
}

export function monthLabel(monthId: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yr = monthId.slice(0, 4);
  const mo = parseInt(monthId.slice(4)) - 1;
  return months[mo] + ' ' + yr;
}

export function monthIdToDate(monthId: string): Date {
  return new Date(parseInt(monthId.slice(0, 4)), parseInt(monthId.slice(4)) - 1, 1);
}
