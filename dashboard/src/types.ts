// ============================================================
// Data types for Maharashtra Motor Insurance Intelligence Platform
// ============================================================

export interface MonthlyReg {
  month_id: string;
  date: string;
  total: number;
  Petrol: number;
  'Petrol-E20': number;
  Diesel: number;
  'Pure EV': number;
  'Electric-BOV': number;
  'Petrol-CNG': number;
  CNG: number;
  'Petrol-Hybrid': number;
  'Strong Hybrid EV': number;
  'Diesel-Hybrid': number;
  'Petrol-E20-CNG': number;
  'Petrol-E20-Hybrid': number;
  PHEV: number;
  LPG: number;
  'Not Applicable': number;
  Solar: number;
  Ethanol: number;
  'Flex-Fuel (Ethanol)': number;
  [key: string]: number | string;
}

export interface GDPIRow {
  fy_id: string;
  segment: string;
  premium_crore: number;
}

export interface RollingOriginRow {
  date: string;
  actual: number;
  snaive: number;
  sarima: number;
  snaive_err: number;
  sarima_err: number;
}

export interface ForecastMetricRow {
  series: string;
  model: string;
  val_mae: number;
  val_wape: number;
  test_mae: number;
  test_wape: number;
  overall_mae: number;
  overall_wape: number;
}

export interface TimeSeriesDiagRow {
  month_id: string;
  date: string;
  reporting_window: string;
  count: number;
  yoy_growth: number | null;
  trend: number | null;
  seasonal: number | null;
}

export interface RTOMonthlyRow {
  month_id: string;
  date: string;
  location_id: string;
  total: number;
}

export interface RTOAnnualRow {
  location_id: string;
  year: number;
  total: number;
  ev: number;
  e20: number;
  petrol: number;
  diesel: number;
}

export interface GDPISegmentRow {
  period: string;
  fy_id: string;
  insurer: string;
  motor_od: number;
  motor_tp: number;
  motor_total: number;
  grand_total: number;
}

export interface AppData {
  registrations: MonthlyReg[];
  gdpi: GDPIRow[];
  rollingOrigin: RollingOriginRow[];
  forecastMetrics: ForecastMetricRow[];
  timeseriesDiag: TimeSeriesDiagRow[];
  rtoMonthly: RTOMonthlyRow[];
  rtoAnnual: RTOAnnualRow[];
  gdpiSegment: GDPISegmentRow[];
}

// Filter state
export interface FilterState {
  geography: string;   // 'MH-ALL' or RTO id
  dateFrom: string;    // YYYYMM
  dateTo: string;      // YYYYMM
}

// RTO display names
export const RTO_NAMES: Record<string, string> = {
  'MH-ALL':       'Maharashtra (Statewide)',
  'MH-MUMBAI':    'Mumbai Central (MH-01)',
  'MH-THANE':     'Thane (MH-04)',
  'MH-PUNE':      'Pune (MH-12)',
  'MH-NASHIK':    'Nashik (MH-15)',
  'MH-AURANGABAD':'Aurangabad / Chhatrapati Sambhajinagar (MH-20)',
  'MH-PIMPRI':    'Pimpri-Chinchwad (MH-14)',
  'MH-VASHI':     'Vashi / Navi Mumbai (MH-43)',
};

export const ALL_RTOS = Object.keys(RTO_NAMES);
