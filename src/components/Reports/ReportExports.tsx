import * as XLSX from 'xlsx';
import type { TariffReport, MeterBreakdown } from '@/../api/reports.api';

// ─── Theme Constants ─────────────────────────────────────────────────────────
const THEME = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  emerald: '#059669',
  emeraldLight: '#d1fae5',
  amber: '#d97706',
  amberLight: '#fef3c7',
  rose: '#e11d48',
  roseLight: '#ffe4e6',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
  white: '#ffffff',
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('en-KE').format(n);

const fmtDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDateShort = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

function getDateRange(report: TariffReport): string {
  const { startDate, endDate } = report.dateRange;
  if (startDate && endDate) return `${fmtDateShort(startDate)} – ${fmtDateShort(endDate)}`;
  if (startDate) return `From ${fmtDateShort(startDate)}`;
  if (endDate) return `Until ${fmtDateShort(endDate)}`;
  return 'All Time';
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
export function generateTariffReportPDF(report: TariffReport): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const dateRange = getDateRange(report);
  const basePrice = 28;
    const rate = report.tariff.ratePerUnit;

    const servicePercent = (rate - basePrice) / basePrice; // 0.08
    const servicePercentDisplay = servicePercent * 100;    // 8

    const serviceCharge = servicePercent * report.summary.totalRevenue;
    const payable = report.summary.totalRevenue - serviceCharge;

  const generatedOn = new Date().toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const meterRows = report.meterBreakdown
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((m: MeterBreakdown, i: number) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `
        <tr style="background:${bg};">
          <td style="padding:10px 14px; font-family:'DM Mono',monospace; font-size:11px; color:#334155; border-bottom:1px solid #f1f5f9;">${m?.meterNumber}</td>
          <td style="padding:10px 14px; text-align:right; font-size:11px; color:#64748b; border-bottom:1px solid #f1f5f9;">${fmtNum(m?.transactionCount)}</td>
          <td style="padding:10px 14px; text-align:right; font-size:11px; color:#64748b; border-bottom:1px solid #f1f5f9;">${m?.totalUnits?.toFixed(2)}</td>
          <td style="padding:10px 14px; text-align:right; font-size:11px; font-weight:600; color:#0f172a; border-bottom:1px solid #f1f5f9;">${fmt(m?.totalRevenue)}</td>
        </tr>`;
    })
    .join('');

  const totals = {
    txns: report.meterBreakdown.reduce((s, m) => s + m.transactionCount, 0),
    units: report.meterBreakdown.reduce((s, m) => s + m.totalUnits, 0),
    revenue: report.meterBreakdown.reduce((s, m) => s + m.totalRevenue, 0),
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Tariff Report — ${report.tariff.name}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4 portrait;
    margin: 0;
  }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }

  /* ── Watermark ── */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 72px;
    font-weight: 700;
    color: rgba(37, 99, 235, 0.04);
    letter-spacing: 8px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%);
    padding: 32px 36px 28px;
    position: relative;
    overflow: hidden;
  }

  .header::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }

  .header::before {
    content: '';
    position: absolute;
    right: 60px;
    bottom: -60px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  .logo-block {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-icon svg {
    width: 22px;
    height: 22px;
    fill: white;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .company-name {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.3px;
    line-height: 1;
  }

  .company-tagline {
    font-size: 10px;
    color: rgba(255,255,255,0.65);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-top: 3px;
  }

  .header-right {
    text-align: right;
  }

  .report-title {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .report-subtitle {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    margin-top: 6px;
    line-height: 1.5;
  }

  /* Meta strip below header */
  .meta-strip {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .meta-items {
    display: flex;
    gap: 28px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
  }

  .meta-value {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    margin-top: 2px;
  }

  .meta-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 10px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #bfdbfe;
  }

  .meta-badge::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #2563eb;
    flex-shrink: 0;
  }

  /* ── Content Area ── */
  .content {
    padding: 28px 36px;
    position: relative;
    z-index: 1;
  }

  /* ── Section Headers ── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .section-dot {
    width: 3px;
    height: 16px;
    background: #2563eb;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #64748b;
  }

  /* ── KPI Cards ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .kpi-card {
    border-radius: 10px;
    padding: 16px;
    position: relative;
    overflow: hidden;
  }

  .kpi-card.blue { background: #eff6ff; border: 1px solid #bfdbfe; }
  .kpi-card.green { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .kpi-card.amber { background: #fffbeb; border: 1px solid #fde68a; }
  .kpi-card.violet { background: #f5f3ff; border: 1px solid #ddd6fe; }

  .kpi-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .kpi-card.blue .kpi-label { color: #1d4ed8; }
  .kpi-card.green .kpi-label { color: #15803d; }
  .kpi-card.amber .kpi-label { color: #b45309; }
  .kpi-card.violet .kpi-label { color: #6d28d9; }

  .kpi-value {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .kpi-card.blue .kpi-value { color: #1e40af; }
  .kpi-card.green .kpi-value { color: #166534; }
  .kpi-card.amber .kpi-value { color: #92400e; }
  .kpi-card.violet .kpi-value { color: #4c1d95; }

  .kpi-sub {
    font-size: 9px;
    margin-top: 5px;
    opacity: 0.6;
  }

  .kpi-card.blue .kpi-sub { color: #1d4ed8; }
  .kpi-card.green .kpi-sub { color: #15803d; }
  .kpi-card.amber .kpi-sub { color: #b45309; }
  .kpi-card.violet .kpi-sub { color: #6d28d9; }

  /* ── Revenue Breakdown ── */
  .revenue-section {
    margin-bottom: 28px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .revenue-inner {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .rev-item {
    padding: 20px 22px;
    position: relative;
  }

  .rev-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 16px;
    bottom: 16px;
    width: 1px;
    background: #e2e8f0;
  }

  .rev-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-bottom: 8px;
  }

  .rev-dot.violet { background: #7c3aed; }
  .rev-dot.rose { background: #e11d48; }
  .rev-dot.emerald { background: #059669; }

  .rev-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .rev-value {
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .rev-bar-bg {
    height: 3px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .rev-bar { height: 100%; border-radius: 2px; }
  .rev-bar.violet { background: #7c3aed; }
  .rev-bar.rose { background: #e11d48; }
  .rev-bar.emerald { background: #059669; }

  .rev-pct {
    font-size: 9px;
    color: #94a3b8;
  }

  /* ── Table ── */
  .table-section {
    margin-bottom: 28px;
  }

  .table-wrap {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: #f1f5f9;
  }

  thead th {
    padding: 10px 14px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  thead th.right { text-align: right; }

  tfoot tr {
    background: #f1f5f9;
    border-top: 2px solid #e2e8f0;
  }

  tfoot td {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    color: #334155;
  }

  tfoot td.right { text-align: right; color: #0f172a; }

  /* ── Footer ── */
  .footer {
    margin-top: auto;
    border-top: 1px solid #e2e8f0;
    padding: 16px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
  }

  .footer-left {
    font-size: 9px;
    color: #94a3b8;
  }

  .footer-left strong {
    color: #64748b;
    font-weight: 600;
  }

  .footer-right {
    font-size: 9px;
    color: #94a3b8;
  }

  @media print {
    body { margin: 0; }
    .page { width: 100%; }
    .watermark { position: fixed; }
  }
</style>
</head>
<body>
<div class="watermark">CONFIDENTIAL</div>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-inner">
      <div class="logo-block">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H13.5L13 2Z"/>
          </svg>
        </div>
        <div class="logo-text">
          <div class="company-name">Alver Power Systems</div>
          <div class="company-tagline">Smart Metering &amp; Energy Management</div>
        </div>
      </div>
      <div class="header-right">
        <div class="report-title">Tariff Report</div>
        <div class="report-subtitle">
          Generated on ${generatedOn}
        </div>
      </div>
    </div>
  </div>

  <!-- Meta Strip -->
  <div class="meta-strip">
    <div class="meta-items">
      <div class="meta-item">
        <div class="meta-label">Tariff</div>
        <div class="meta-value">${report.tariff.name}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Provider</div>
        <div class="meta-value">${report.tariff.provider}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Rate / Unit</div>
        <div class="meta-value">${fmt(rate)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Period</div>
        <div class="meta-value">${dateRange}</div>
      </div>
    </div>
    <div class="meta-badge">Report Ready</div>
  </div>

  <!-- Content -->
  <div class="content">

    <!-- KPIs -->
    <div class="section-header">
      <div class="section-dot"></div>
      <div class="section-title">Key Metrics</div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-label">Total Meters</div>
        <div class="kpi-value">${fmtNum(report.summary.totalMeters)}</div>
        <div class="kpi-sub">Active in period</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Transactions</div>
        <div class="kpi-value">${fmtNum(report.summary.totalTransactions)}</div>
        <div class="kpi-sub">Completed</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Total Units (kWh)</div>
        <div class="kpi-value">${report.summary.totalUnits.toFixed(1)}</div>
        <div class="kpi-sub">Energy dispensed</div>
      </div>
      <div class="kpi-card violet">
        <div class="kpi-label">Gross Revenue</div>
        <div class="kpi-value">${fmt(report.summary.totalRevenue)}</div>
        <div class="kpi-sub">Before deductions</div>
      </div>
    </div>

    <!-- Revenue Breakdown -->
    <div class="section-header">
      <div class="section-dot"></div>
      <div class="section-title">Revenue Breakdown</div>
    </div>
    <div class="revenue-section" style="margin-bottom:28px;">
      <div class="revenue-inner">
        <div class="rev-item">
          <div class="rev-dot violet"></div>
          <div class="rev-label">Gross Revenue</div>
          <div class="rev-value">${fmt(report.summary.totalRevenue)}</div>
          <div class="rev-bar-bg"><div class="rev-bar violet" style="width:100%"></div></div>
          <div class="rev-pct">100% of gross</div>
        </div>
        <div class="rev-item">
          <div class="rev-dot rose"></div>
          <div class="rev-label">Service Charge</div>
          <div class="rev-value">${fmt(serviceCharge)}</div>
          <div class="rev-bar-bg"><div class="rev-bar rose" style="width:${report.summary.totalRevenue > 0 ? ((serviceCharge / report.summary.totalRevenue) * 100).toFixed(1) : 0}%"></div></div>
          <div class="rev-pct">${report.summary.totalRevenue > 0 ? ((serviceCharge / report.summary.totalRevenue) * 100).toFixed(1) : '0.0'}% of gross</div>
        </div>
        <div class="rev-item">
          <div class="rev-dot emerald"></div>
          <div class="rev-label">Payable to Client</div>
          <div class="rev-value">${fmt(payable)}</div>
          <div class="rev-bar-bg"><div class="rev-bar emerald" style="width:${report.summary.totalRevenue > 0 ? ((payable / report.summary.totalRevenue) * 100).toFixed(1) : 0}%"></div></div>
          <div class="rev-pct">${report.summary.totalRevenue > 0 ? ((payable / report.summary.totalRevenue) * 100).toFixed(1) : '0.0'}% of gross</div>
        </div>
      </div>
    </div>

    <!-- Meter Table -->
    ${report.meterBreakdown.length > 0 ? `
    <div class="section-header">
      <div class="section-dot"></div>
      <div class="section-title">Meter Breakdown (${report.meterBreakdown.length} meters)</div>
    </div>
    <div class="table-section">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Meter Number</th>
              <th class="right">Transactions</th>
              <th class="right">Units (kWh)</th>
              <th class="right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${meterRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="font-size:10px;font-weight:700;color:#334155;padding:10px 14px;">Totals</td>
              <td class="right">${fmtNum(totals.txns)}</td>
              <td class="right">${totals.units.toFixed(2)}</td>
              <td class="right">${fmt(totals.revenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    ` : ''}

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>Alver Power Systems</strong> — Confidential · For internal and authorized use only
    </div>
    <div class="footer-right">
      Tariff: ${report.tariff.name} · ${dateRange}
    </div>
  </div>

</div>
<script>
  window.onload = function () {
    window.print();
    window.onafterprint = function () { window.close(); };
  };
</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────

/** Helper: make an XLSX cell style */
function makeStyle(opts: {
  bold?: boolean;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  italic?: boolean;
  wrapText?: boolean;
  hAlign?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'center' | 'bottom';
  border?: boolean;
  borderColor?: string;
  numFmt?: string;
  underline?: boolean;
}): any {
  const style: any = {};

  if (opts.bold || opts.fontSize || opts.color || opts.italic || opts.underline) {
    style.font = {};
    if (opts.bold) style.font.bold = true;
    if (opts.italic) style.font.italic = true;
    if (opts.underline) style.font.underline = true;
    if (opts.fontSize) style.font.sz = opts.fontSize;
    if (opts.color) style.font.color = { rgb: opts.color.replace('#', '') };
    style.font.name = 'Calibri';
  }

  if (opts.bgColor) {
    style.fill = { fgColor: { rgb: opts.bgColor.replace('#', '') }, patternType: 'solid' };
  }

  if (opts.hAlign || opts.vAlign || opts.wrapText) {
    style.alignment = {};
    if (opts.hAlign) style.alignment.horizontal = opts.hAlign;
    if (opts.vAlign) style.alignment.vertical = opts.vAlign;
    if (opts.wrapText) style.alignment.wrapText = true;
  }

  if (opts.border) {
    const bc = (opts.borderColor || '#e2e8f0').replace('#', '');
    const side = { style: 'thin', color: { rgb: bc } };
    style.border = { top: side, bottom: side, left: side, right: side };
  }

  if (opts.numFmt) style.numFmt = opts.numFmt;

  return style;
}

/** Set cell with style */
function setCell(ws: any, address: string, value: any, style?: any): void {
  ws[address] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
}

/** Set numeric cell */
function setNum(ws: any, address: string, value: number, style?: any): void {
  ws[address] = { v: value, t: 'n', s: style };
}

/** Merge cells helper */
function addMerge(ws: any, range: string): void {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push(XLSX.utils.decode_range(range));
}

export function generateTariffReportExcel(report: TariffReport): void {
  const wb = XLSX.utils.book_new();
  const rate = report.tariff.ratePerUnit;
  const virtualUnits = report.summary.totalRevenue / rate;
  const serviceCharge = virtualUnits * 3;
  const payable = report.summary.totalRevenue - serviceCharge;
  const dateRange = getDateRange(report);
  const generatedOn = new Date().toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    // Header banner
    bannerTitle: makeStyle({ bold: true, fontSize: 18, color: THEME.white, bgColor: THEME.primary, hAlign: 'left', vAlign: 'center' }),
    bannerSub: makeStyle({ fontSize: 10, color: '#bfdbfe', bgColor: THEME.primary, hAlign: 'left', vAlign: 'center' }),
    bannerRight: makeStyle({ fontSize: 9, color: 'rgba(255,255,255,0.7)', bgColor: THEME.primary, hAlign: 'right', vAlign: 'center' }),
    bannerBg: makeStyle({ bgColor: THEME.primary }),

    // Meta row
    metaLabel: makeStyle({ fontSize: 8, color: THEME.gray400, bgColor: THEME.gray50, hAlign: 'left', bold: false }),
    metaValue: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.gray50, bold: true, hAlign: 'left' }),

    // Section header
    sectionHeader: makeStyle({ bold: true, fontSize: 9, color: THEME.primary, bgColor: THEME.primaryLight, hAlign: 'left' }),

    // KPI cards
    kpiLabel: makeStyle({ fontSize: 8, color: THEME.gray500, bgColor: THEME.gray50, hAlign: 'center', bold: true }),
    kpiValueBlue: makeStyle({ bold: true, fontSize: 14, color: THEME.primary, bgColor: '#eff6ff', hAlign: 'center', vAlign: 'center' }),
    kpiValueGreen: makeStyle({ bold: true, fontSize: 14, color: THEME.emerald, bgColor: '#f0fdf4', hAlign: 'center', vAlign: 'center' }),
    kpiValueAmber: makeStyle({ bold: true, fontSize: 14, color: THEME.amber, bgColor: '#fffbeb', hAlign: 'center', vAlign: 'center' }),
    kpiValueViolet: makeStyle({ bold: true, fontSize: 14, color: '#6d28d9', bgColor: '#f5f3ff', hAlign: 'center', vAlign: 'center' }),

    // Revenue breakdown
    revLabel: makeStyle({ fontSize: 9, color: THEME.gray500, bgColor: THEME.gray50, hAlign: 'left', bold: true }),
    revGross: makeStyle({ bold: true, fontSize: 12, color: '#6d28d9', bgColor: '#f5f3ff', numFmt: '"KES"#,##0.00', hAlign: 'right' }),
    revCharge: makeStyle({ bold: true, fontSize: 12, color: THEME.rose, bgColor: '#fff1f2', numFmt: '"KES"#,##0.00', hAlign: 'right' }),
    revPayable: makeStyle({ bold: true, fontSize: 12, color: THEME.emerald, bgColor: '#f0fdf4', numFmt: '"KES"#,##0.00', hAlign: 'right' }),

    // Table header
    tableHeader: makeStyle({ bold: true, fontSize: 9, color: THEME.white, bgColor: THEME.primary, hAlign: 'center', vAlign: 'center', border: true, borderColor: THEME.primaryDark }),
    tableHeaderRight: makeStyle({ bold: true, fontSize: 9, color: THEME.white, bgColor: THEME.primary, hAlign: 'right', vAlign: 'center', border: true, borderColor: THEME.primaryDark }),

    // Table rows
    rowEven: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.white, border: true, borderColor: THEME.gray100 }),
    rowOdd: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.gray50, border: true, borderColor: THEME.gray100 }),
    rowEvenRight: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.white, border: true, borderColor: THEME.gray100, hAlign: 'right' }),
    rowOddRight: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.gray50, border: true, borderColor: THEME.gray100, hAlign: 'right' }),
    rowEvenMono: makeStyle({ fontSize: 9, color: THEME.gray700, bgColor: THEME.white, border: true, borderColor: THEME.gray100 }),
    rowOddMono: makeStyle({ fontSize: 9, color: THEME.gray700, bgColor: THEME.gray50, border: true, borderColor: THEME.gray100 }),
    rowEvenKES: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.white, border: true, borderColor: THEME.gray100, hAlign: 'right', numFmt: '"KES "#,##0.00' }),
    rowOddKES: makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: THEME.gray50, border: true, borderColor: THEME.gray100, hAlign: 'right', numFmt: '"KES "#,##0.00' }),

    // Totals row
    totalLabel: makeStyle({ bold: true, fontSize: 10, color: THEME.white, bgColor: THEME.primary }),
    totalNum: makeStyle({ bold: true, fontSize: 10, color: THEME.white, bgColor: THEME.primary, hAlign: 'right' }),
    totalKES: makeStyle({ bold: true, fontSize: 10, color: THEME.white, bgColor: THEME.primary, hAlign: 'right', numFmt: '"KES "#,##0.00' }),

    // Spacer / empty
    spacer: makeStyle({ bgColor: THEME.white }),
    grayBg: makeStyle({ bgColor: THEME.gray100 }),
  };

  // ── Sheet 1: Summary ───────────────────────────────────────────────────────
  const ws1: any = {};
  ws1['!ref'] = 'A1:H50';
  ws1['!merges'] = [];
  ws1['!rows'] = [];
  ws1['!cols'] = [
    { wpx: 130 }, // A
    { wpx: 130 }, // B
    { wpx: 130 }, // C
    { wpx: 130 }, // D
    { wpx: 20 },  // E (spacer)
    { wpx: 120 }, // F
    { wpx: 120 }, // G
    { wpx: 120 }, // H
  ];

  // Row heights
  const setRowH = (r: number, h: number) => { while (ws1['!rows'].length <= r) ws1['!rows'].push({}); ws1['!rows'][r] = { hpx: h }; };
  setRowH(0, 48); // Row 1 - banner title
  setRowH(1, 20); // Row 2 - banner sub
  setRowH(2, 16); // Row 3 - spacer
  setRowH(3, 18); // Row 4 - meta labels
  setRowH(4, 22); // Row 5 - meta values
  setRowH(5, 14); // Row 6 - spacer
  setRowH(6, 18); // Row 7 - section header KPIs
  setRowH(7, 18); // Row 8 - KPI labels
  setRowH(8, 38); // Row 9 - KPI values
  setRowH(9, 14); // spacer
  setRowH(10, 18); // section header
  setRowH(11, 18); // revenue labels
  setRowH(12, 34); // revenue values
  setRowH(13, 14); // spacer

  // ── Banner (rows 1-2) ──
  // Fill entire banner area blue
  for (let c = 0; c <= 7; c++) {
    const col = String.fromCharCode(65 + c);
    setCell(ws1, `${col}1`, '', S.bannerBg);
    setCell(ws1, `${col}2`, '', S.bannerBg);
    setCell(ws1, `${col}3`, '', S.spacer);
  }

  addMerge(ws1, 'A1:F1');
  addMerge(ws1, 'A2:F2');
  addMerge(ws1, 'G1:H1');
  addMerge(ws1, 'G2:H2');

  setCell(ws1, 'A1', '⚡ Alver Power Systems — Tariff Report', S.bannerTitle);
  setCell(ws1, 'A2', 'Smart Metering & Energy Management Platform', S.bannerSub);
  setCell(ws1, 'G1', `Generated: ${generatedOn}`, S.bannerRight);
  setCell(ws1, 'G2', 'CONFIDENTIAL', { ...S.bannerRight, font: { ...S.bannerRight.font, bold: true } });

  // ── Meta Row ──
  const metaLabels = ['TARIFF', 'PROVIDER', 'RATE/UNIT', 'PERIOD'];
  const metaValues = [report.tariff.name, report.tariff.provider, `KES ${rate.toFixed(2)}`, dateRange];
  ['A', 'B', 'C', 'D'].forEach((col, i) => {
    setCell(ws1, `${col}4`, metaLabels[i], S.metaLabel);
    setCell(ws1, `${col}5`, metaValues[i], S.metaValue);
  });
  // fill gray spacer for E-H in meta rows
  for (let c = 4; c <= 7; c++) {
    const col = String.fromCharCode(65 + c);
    setCell(ws1, `${col}4`, '', S.grayBg);
    setCell(ws1, `${col}5`, '', S.grayBg);
  }

  // Spacer row 6
  for (let c = 0; c <= 7; c++) setCell(ws1, `${String.fromCharCode(65+c)}6`, '', S.spacer);

  // ── KPI Section Header ──
  addMerge(ws1, 'A7:H7');
  setCell(ws1, 'A7', '  KEY METRICS', S.sectionHeader);

  // ── KPI Cards (rows 8-9) ──
  const kpiCols = ['A', 'B', 'C', 'D'];
  const kpiLabels = ['TOTAL METERS', 'TRANSACTIONS', 'TOTAL UNITS (kWh)', 'GROSS REVENUE'];
  const kpiValues = [
    report.summary.totalMeters,
    report.summary.totalTransactions,
    report.summary.totalUnits,
    report.summary.totalRevenue,
  ];
  const kpiStyles = [S.kpiValueBlue, S.kpiValueGreen, S.kpiValueAmber, S.kpiValueViolet];
  const kpiNumFmts = ['#,##0', '#,##0', '#,##0.0', '"KES "#,##0.00'];

  kpiCols.forEach((col, i) => {
    setCell(ws1, `${col}8`, kpiLabels[i], S.kpiLabel);
    const valStyle = { ...kpiStyles[i], numFmt: kpiNumFmts[i] };
    setNum(ws1, `${col}9`, kpiValues[i], valStyle);
  });

  // fill E-H in KPI rows
  for (let c = 4; c <= 7; c++) {
    setCell(ws1, `${String.fromCharCode(65+c)}8`, '', S.spacer);
    setCell(ws1, `${String.fromCharCode(65+c)}9`, '', S.spacer);
  }

  // Spacer row 10
  for (let c = 0; c <= 7; c++) setCell(ws1, `${String.fromCharCode(65+c)}10`, '', S.spacer);

  // ── Revenue Section Header ──
  addMerge(ws1, 'A11:H11');
  setCell(ws1, 'A11', '  REVENUE BREAKDOWN', S.sectionHeader);

  // Revenue labels row 12
  const revLabels = ['GROSS REVENUE', '', 'SERVICE CHARGE', '', 'PAYABLE TO CLIENT'];
  ['A', 'B', 'C', 'D', 'E'].forEach((col, i) => {
    setCell(ws1, `${col}12`, revLabels[i], S.revLabel);
  });

  // Revenue values row 13
  setNum(ws1, 'A13', report.summary.totalRevenue, { ...S.revGross, numFmt: '"KES "#,##0.00' });
  setCell(ws1, 'B13', '', S.spacer);
  setNum(ws1, 'C13', serviceCharge, { ...S.revCharge, numFmt: '"KES "#,##0.00' });
  setCell(ws1, 'D13', '', S.spacer);
  setNum(ws1, 'E13', payable, { ...S.revPayable, numFmt: '"KES "#,##0.00' });
  for (let c = 5; c <= 7; c++) setCell(ws1, `${String.fromCharCode(65+c)}12`, '', S.spacer);
  for (let c = 5; c <= 7; c++) setCell(ws1, `${String.fromCharCode(65+c)}13`, '', S.spacer);

  // Spacer row 14
  for (let c = 0; c <= 7; c++) setCell(ws1, `${String.fromCharCode(65+c)}14`, '', S.spacer);

  // ── Notes / Info ──
  addMerge(ws1, 'A15:H15');
  setCell(ws1, 'A15', '  REPORT DETAILS', S.sectionHeader);

  const noteRows = [
    ['Report Type', 'Tariff Revenue Report'],
    ['Tariff Name', report.tariff.name],
    ['Provider', report.tariff.provider],
    ['Rate per Unit', `KES ${rate.toFixed(2)}`],
    ['Report Period', dateRange],
    ['Total Meters', String(report.summary.totalMeters)],
    ['Total Transactions', String(report.summary.totalTransactions)],
    ['Total Units Dispensed', `${report.summary.totalUnits.toFixed(2)} kWh`],
    ['Generated', generatedOn],
  ];

  noteRows.forEach(([label, value], i) => {
    const row = 16 + i;
    const bg = i % 2 === 0 ? THEME.white : THEME.gray50;
    setCell(ws1, `A${row}`, label, makeStyle({ fontSize: 9, bold: true, color: THEME.gray500, bgColor: bg }));
    setCell(ws1, `B${row}`, value, makeStyle({ fontSize: 10, color: THEME.gray700, bgColor: bg }));
    addMerge(ws1, `B${row}:H${row}`);
    for (let c = 2; c <= 7; c++) {
      if (c > 1) setCell(ws1, `${String.fromCharCode(65+c)}${row}`, '', makeStyle({ bgColor: bg }));
    }
    setRowH(row - 1, 18);
  });

  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // ── Sheet 2: Meter Breakdown ───────────────────────────────────────────────
  const ws2: any = {};
  const sorted = [...report.meterBreakdown].sort((a, b) => b.totalRevenue - a.totalRevenue);

  ws2['!cols'] = [
    { wpx: 160 }, // Meter Number
    { wpx: 100 }, // Transactions
    { wpx: 110 }, // Total Units
    { wpx: 130 }, // Revenue
  ];

  ws2['!rows'] = [];
  const setRow2H = (r: number, h: number) => { while (ws2['!rows'].length <= r) ws2['!rows'].push({}); ws2['!rows'][r] = { hpx: h }; };
  ws2['!merges'] = [];

  // Banner
  setRow2H(0, 38);
  setRow2H(1, 18);
  addMerge(ws2, 'A1:E1');
  addMerge(ws2, 'A2:E2');
  setCell(ws2, 'A1', '⚡ Alver Power Systems — Meter Breakdown', S.bannerTitle);
  setCell(ws2, 'A2', `${report.tariff.name} · ${dateRange} · Generated: ${generatedOn}`, S.bannerSub);
  for (let c = 1; c <= 4; c++) {
    setCell(ws2, `${String.fromCharCode(65+c)}1`, '', S.bannerBg);
    setCell(ws2, `${String.fromCharCode(65+c)}2`, '', S.bannerBg);
  }

  // Spacer
  setRow2H(2, 10);
  for (let c = 0; c <= 4; c++) setCell(ws2, `${String.fromCharCode(65+c)}3`, '', S.spacer);

  // Table Header
  setRow2H(3, 24);
  const h2Cols = ['METER NUMBER', 'TRANSACTIONS', 'UNITS (kWh)', 'REVENUE (KES)'];
  h2Cols.forEach((label, i) => {
    const style = i === 0 ? S.tableHeader : S.tableHeaderRight;
    setCell(ws2, `${String.fromCharCode(65+i)}4`, label, style);
  });

  // Enable filters
  ws2['!autofilter'] = { ref: 'A4:E4' };

  // Data rows
  sorted.forEach((m, i) => {
    const r = 5 + i;
    const even = i % 2 === 0;

    setRow2H(r - 1, 20);
    setCell(ws2, `A${r}`, m.meterNumber, even ? S.rowEvenMono : S.rowOddMono);
    setNum(ws2, `B${r}`, m.transactionCount, { ...(even ? S.rowEvenRight : S.rowOddRight), numFmt: '#,##0' });
    setNum(ws2, `C${r}`, m.totalUnits, { ...(even ? S.rowEvenRight : S.rowOddRight), numFmt: '#,##0.00' });
    setNum(ws2, `D${r}`, m.totalRevenue, even ? S.rowEvenKES : S.rowOddKES);
  });

  // Totals
  const totRow = 5 + sorted.length;
  setRow2H(totRow - 1, 24);
  const totalTxns = sorted.reduce((s, m) => s + m.transactionCount, 0);
  const totalUnits = sorted.reduce((s, m) => s + m.totalUnits, 0);
  const totalRev = sorted.reduce((s, m) => s + m.totalRevenue, 0);

  setCell(ws2, `A${totRow}`, 'TOTALS', S.totalLabel);
  setNum(ws2, `B${totRow}`, totalTxns, { ...S.totalNum, numFmt: '#,##0' });
  setNum(ws2, `C${totRow}`, totalUnits, { ...S.totalNum, numFmt: '#,##0.00' });
  setNum(ws2, `D${totRow}`, totalRev, S.totalKES);

  ws2['!ref'] = `A1:E${totRow}`;
  XLSX.utils.book_append_sheet(wb, ws2, 'Meter Breakdown');

  // ── Sheet 3: Transactions ──────────────────────────────────────────────────
  if (report.transactions && report.transactions.length > 0) {
    const ws3: any = {};

    ws3['!cols'] = [
      { wpx: 140 }, // Trans ID
      { wpx: 140 }, // Date
      { wpx: 130 }, // Meter
      { wpx: 110 }, // Amount
      { wpx: 90 },  // Units
      { wpx: 110 }, // Phone
      { wpx: 90 },  // Rate
      { wpx: 180 }, // Token
      { wpx: 110 }, // Type
    ];

    ws3['!rows'] = [];
    ws3['!merges'] = [];
    const setRow3H = (r: number, h: number) => { while (ws3['!rows'].length <= r) ws3['!rows'].push({}); ws3['!rows'][r] = { hpx: h }; };

    // Banner
    setRow3H(0, 38);
    setRow3H(1, 18);
    addMerge(ws3, 'A1:I1');
    addMerge(ws3, 'A2:I2');
    setCell(ws3, 'A1', '⚡ Alver Power Systems — Transaction Log', S.bannerTitle);
    setCell(ws3, 'A2', `${report.tariff.name} · ${dateRange} · ${report.transactions.length} records`, S.bannerSub);
    for (let c = 1; c <= 8; c++) {
      setCell(ws3, `${String.fromCharCode(65+c)}1`, '', S.bannerBg);
      setCell(ws3, `${String.fromCharCode(65+c)}2`, '', S.bannerBg);
    }

    setRow3H(2, 10);
    for (let c = 0; c <= 8; c++) setCell(ws3, `${String.fromCharCode(65+c)}3`, '', S.spacer);

    // Header
    setRow3H(3, 24);
    const txnHeaders = [
      'TRANSACTION ID', 'DATE & TIME', 'METER NUMBER',
      'AMOUNT (KES)', 'UNITS', 'PHONE',
      'RATE (KES)', 'TOKEN', 'TYPE'
    ];
    txnHeaders.forEach((label, i) => {
      setCell(ws3, `${String.fromCharCode(65+i)}4`, label, i < 3 ? S.tableHeader : S.tableHeaderRight);
    });

    // Freeze header + autofilter
    ws3['!freeze'] = { xSplit: 0, ySplit: 4 };
    ws3['!autofilter'] = { ref: 'A4:I4' };

    // Data
    report.transactions.forEach((tx: any, i: number) => {
      const r = 5 + i;
      const even = i % 2 === 0;
      const rowStyle = even ? S.rowEven : S.rowOdd;
      const rowRight = even ? S.rowEvenRight : S.rowOddRight;
      const rowKES = even ? S.rowEvenKES : S.rowOddKES;

      setRow3H(r - 1, 20);
      setCell(ws3, `A${r}`, tx.transId, rowStyle);
      setCell(ws3, `B${r}`, fmtDate(tx.transTime), rowStyle);
      setCell(ws3, `C${r}`, tx.meterNumber, rowStyle);
      setNum(ws3, `D${r}`, tx.transAmount, rowKES);
      setNum(ws3, `E${r}`, tx.units, { ...rowRight, numFmt: '#,##0.00' });
      setCell(ws3, `F${r}`, tx.msisdn || '', rowRight);
      setNum(ws3, `G${r}`, tx.rate, rowKES);
      setCell(ws3, `H${r}`, tx.token || '', { ...rowStyle, alignment: { wrapText: true } });
      setCell(ws3, `I${r}`, tx.transactionType || '', rowStyle);
    });

    ws3['!ref'] = `A1:I${4 + report.transactions.length}`;
    XLSX.utils.book_append_sheet(wb, ws3, 'Transactions');
  }

  // ── Write File ─────────────────────────────────────────────────────────────
  const tariffName = report.tariff.name.replace(/[^a-zA-Z0-9]/g, '_');
  const rangeSuffix = dateRange.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Alver_Tariff_Report_${tariffName}_${rangeSuffix}.xlsx`;

  XLSX.writeFile(wb, filename);
}

// ─── CSV Export (unchanged, kept as utility) ──────────────────────────────────
export function generateTariffReportCSV(report: TariffReport): void {
  const rate = report.tariff.ratePerUnit;
  const basePrice = 28;
  const servicePercent = (rate - basePrice) / basePrice; // 0.08
  const serviceCharge = servicePercent * report.summary.totalRevenue;
  const payable = report.summary.totalRevenue - serviceCharge;
  const dateRange = getDateRange(report);

  let csv = `Alver Power Systems — Tariff Report\n`;
  csv += `Generated:,${new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`;
  csv += `REPORT INFORMATION\n`;
  csv += `Tariff,${report.tariff.name}\nProvider,${report.tariff.provider}\nRate/Unit,KES ${rate.toFixed(2)}\nPeriod,${dateRange}\n\n`;
  csv += `SUMMARY\n`;
  csv += `Total Meters,${report.summary.totalMeters}\nTransactions,${report.summary.totalTransactions}\nTotal Units,${report.summary.totalUnits.toFixed(2)}\n`;
  csv += `Gross Revenue,${fmt(report.summary.totalRevenue)}\nService Charge,${fmt(serviceCharge)}\nPayable to Client,${fmt(payable)}\n\n`;

  if (report.meterBreakdown.length > 0) {
    csv += `METER BREAKDOWN\nMeter Number,Transactions,Units,Revenue\n`;
    report.meterBreakdown.forEach((m: MeterBreakdown) => {
      csv += `${m.meterNumber},${m.transactionCount},${m.totalUnits.toFixed(2)},${fmt(m.totalRevenue)}\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Tariff_Report_${report.tariff.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
