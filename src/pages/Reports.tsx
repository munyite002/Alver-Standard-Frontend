import { useEffect, useState } from "react";
import { 
  FileText, TrendingUp, Users, Zap, Filter, 
  Download, ChevronDown, BarChart3, ArrowUpRight, 
  Calendar, Layers, RefreshCw, Table2 
} from "lucide-react";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
    getTariffReport,
    getRevenueSummary,
    getTariffsForReports,
} from "@/../api/reports.api";
import type {
    TariffForReports,
    TariffReport,
    RevenueSummary,
    MeterBreakdown
} from "@/../api/reports.api";
import * as XLSX from 'xlsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const fmt = (n: number) => formatCurrency(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

// ─── Sub-components ──────────────────────────────────────────────────────────
interface MetricCardProps {
    label: string;
    value: string;
    icon: any;
    color: "blue" | "green" | "amber" | "violet";
    sub?: string;
}

function MetricCard({ label, value, icon: Icon, color, sub }: MetricCardProps) {
    const colors = {
        blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500", border: "border-blue-100" },
        green: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", border: "border-emerald-100" },
        amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500", border: "border-amber-100" },
        violet: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-500", border: "border-violet-100" },
    };
    const c = colors[color] || colors.blue;
    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-widest ${c.text} opacity-70`}>{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
            </div>
            <div>
                <p className={`text-2xl font-bold ${c.text} leading-none`}>{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function RevenueBreakdown({ report }: { report: TariffReport }) {
    const rate = report.tariff.ratePerUnit;
    const virtualUnits = report.summary.totalRevenue / rate;
    const serviceCharge = virtualUnits * 3;
    const payable = report.summary.totalRevenue - serviceCharge;

    const pct = (v: number) => report.summary.totalRevenue > 0 
        ? ((v / report.summary.totalRevenue) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-800">Revenue Breakdown</h4>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Gross Revenue", value: report.summary.totalRevenue, pct: "100%", color: "bg-violet-500" },
                    { label: "Service Charge", value: serviceCharge, pct: `${pct(serviceCharge)}%`, color: "bg-rose-400" },
                    { label: "Payable to Client", value: payable, pct: `${pct(payable)}%`, color: "bg-emerald-500" },
                ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{fmt(item.value)}</p>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: item.pct }} />
                        </div>
                        <span className="text-xs text-gray-400">{item.pct} of gross</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MeterTable({ report }: { report: TariffReport }) {
    const [sortField, setSortField] = useState<keyof MeterBreakdown>("totalRevenue");
    const sorted = [...report.meterBreakdown].sort((a, b) => (b[sortField] as number) - (a[sortField] as number));
    const rate = report.tariff.ratePerUnit;

    const cols = [
        { key: "meterNumber", label: "Meter", sortable: false },
        { key: "transactionCount", label: "Txns", sortable: true },
        { key: "totalUnits", label: "Units", sortable: true },
        { key: "totalRevenue", label: "Revenue", sortable: true },
        { key: "serviceCharge", label: "Service Charge", sortable: false },
    ];

    return (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-800">Meter Breakdown</h4>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                        {report.meterBreakdown.length} meters
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Sort by:</span>
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="text-xs text-gray-600 border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="totalRevenue">Revenue</option>
                        <option value="totalUnits">Units</option>
                        <option value="transactionCount">Transactions</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {cols.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sorted.map((meter, idx) => {
                            const svc = (meter.totalRevenue / rate) * 3;
                            return (
                                <tr key={meter.meterNumber} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors`}>
                                    <td className="px-6 py-3.5 font-mono text-xs text-gray-700 font-medium whitespace-nowrap">
                                        {meter.meterNumber}
                                    </td>
                                    <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{fmtNum(meter.transactionCount)}</td>
                                    <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{meter.totalUnits.toFixed(2)}</td>
                                    <td className="px-6 py-3.5 font-medium text-gray-800 whitespace-nowrap">{fmt(meter.totalRevenue)}</td>
                                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">{fmt(svc)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                            <td className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Totals</td>
                            <td className="px-6 py-3 text-xs font-bold text-gray-600">
                                {fmtNum(sorted.reduce((s, m) => s + m.transactionCount, 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold text-gray-600">
                                {sorted.reduce((s, m) => s + m.totalUnits, 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold text-gray-800">
                                {fmt(sorted.reduce((s, m) => s + m.totalRevenue, 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold text-gray-600">
                                {fmt(sorted.reduce((s, m) => s + (m.totalRevenue / rate) * 3, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReportsPage() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    // State management
    const [tariffs, setTariffs] = useState<TariffForReports[]>([]);
    const [selectedTariff, setSelectedTariff] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [tariffReport, setTariffReport] = useState<TariffReport | null>(null);
    const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
    const [activeTab, setActiveTab] = useState<"tariff" | "revenue">("tariff");

    // Loading states
    const [isLoadingTariffs, setIsLoadingTariffs] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);

    // Fetch tariffs on component mount
    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        try {
            setIsLoadingTariffs(true);
            const response = await getTariffsForReports(axiosInstance);
            if (user?.role === "manager" && user?.account?.tarrifId) {
                const managerTariffs = response.data.filter((t: TariffForReports) => t.id === user.account.tarrifId);
                setTariffs(managerTariffs);
                if (managerTariffs.length > 0) {
                    setSelectedTariff(managerTariffs[0].id);
                }
            } else {
                setTariffs(response.data);
            }
        } catch (err) {
            console.error("Error fetching tariffs:", err);
        } finally {
            setIsLoadingTariffs(false);
        }
    };

    const handleGenerateTariffReport = async () => {
        if (!selectedTariff) {
            alert("Please select a tariff");
            return;
        }

        try {
            setIsLoadingReport(true);
            const response = await getTariffReport(
                axiosInstance,
                selectedTariff,
                startDate || undefined,
                endDate || undefined
            );
            setTariffReport(response.data);
            setFiltersOpen(false);
        } catch (error) {
            console.error("Error generating tariff report:", error);
            alert("Failed to generate report");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleGenerateRevenueSummary = async () => {
        try {
            setIsLoadingRevenue(true);
            const response = await getRevenueSummary(
                axiosInstance,
                startDate || undefined,
                endDate || undefined
            );
            setRevenueSummary(response.data);
            setFiltersOpen(false);
        } catch (error) {
            console.error("Error generating revenue summary:", error);
            alert("Failed to generate revenue summary");
        } finally {
            setIsLoadingRevenue(false);
        }
    };

    const handleDownloadTariffReport = () => {
        if (!tariffReport) {
            alert("Please generate a tariff report first");
            return;
        }
        generateTariffReportPDF(tariffReport);
    };

    const handleDownloadTariffReportCSV = () => {
        if (!tariffReport) {
            alert("Please generate a tariff report first");
            return;
        }

        const dateRange = tariffReport.dateRange.startDate && tariffReport.dateRange.endDate
            ? `${tariffReport.dateRange.startDate} to ${tariffReport.dateRange.endDate}`
            : tariffReport.dateRange.startDate
                ? `from ${tariffReport.dateRange.startDate}`
                : tariffReport.dateRange.endDate
                    ? `until ${tariffReport.dateRange.endDate}`
                    : 'All Time';

        const filename = `Tariff_Report_${tariffReport.tariff.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

        let csvContent = 'Alver Power Systems - Tariff Report\n';
        csvContent += `Generated on: ${new Date().toLocaleDateString('en-KE', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}\n\n`;

        csvContent += 'Report Information\n';
        csvContent += `Tariff Name,${tariffReport.tariff.name}\n`;
        csvContent += `Provider,${tariffReport.tariff.provider}\n`;
        csvContent += `Rate per Unit,${formatCurrency(tariffReport.tariff.ratePerUnit)}\n`;
        csvContent += `Report Period,${dateRange}\n\n`;

        csvContent += 'Summary\n';
        csvContent += `Total Meters,${tariffReport.summary.totalMeters}\n`;
        csvContent += `Total Transactions,${tariffReport.summary.totalTransactions}\n`;
        csvContent += `Total Units,${tariffReport.summary.totalUnits.toFixed(2)}\n`;
        csvContent += `Total Revenue,${formatCurrency(tariffReport.summary.totalRevenue)}\n`;

        const virtualUnits = tariffReport.summary.totalRevenue / tariffReport.tariff.ratePerUnit;
        const serviceCharge = virtualUnits * 3;
        const payableToClient = tariffReport.summary.totalRevenue - serviceCharge;

        csvContent += `Service Charge,${formatCurrency(serviceCharge)}\n`;
        csvContent += `Payable to Client,${formatCurrency(payableToClient)}\n\n`;

        if (tariffReport.meterBreakdown.length > 0) {
            csvContent += 'Meter Breakdown\n';
            csvContent += 'Meter Number,Transactions,Total Units,Total Revenue,Service Charge\n';
            tariffReport.meterBreakdown.forEach((meter: MeterBreakdown) => {
                const meterVirtualUnits = meter.totalRevenue / tariffReport.tariff.ratePerUnit;
                const meterServiceCharge = meterVirtualUnits * 3;
                csvContent += `${meter.meterNumber},${meter.transactionCount},${meter.totalUnits.toFixed(2)},${formatCurrency(meter.totalRevenue)},${formatCurrency(meterServiceCharge)}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateTariffReportPDF = (report: TariffReport) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to download the PDF');
            return;
        }

        const dateRange = report.dateRange.startDate && report.dateRange.endDate
            ? `${report.dateRange.startDate} to ${report.dateRange.endDate}`
            : report.dateRange.startDate
                ? `from ${report.dateRange.startDate}`
                : report.dateRange.endDate
                    ? `until ${report.dateRange.endDate}`
                    : 'All Time';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tariff Report - ${report.tariff.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                    .report-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                    .report-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
                    .info-item { margin-bottom: 10px; }
                    .info-label { font-weight: bold; color: #64748b; }
                    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .summary-card { background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #2563eb; }
                    .summary-card h3 { margin: 0 0 10px 0; color: #2563eb; font-size: 14px; text-transform: uppercase; }
                    .summary-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                    th { background-color: #f1f5f9; font-weight: bold; color: #475569; }
                    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Alver Power Systems</div>
                    <div class="report-title">Tariff Report</div>
                    <div style="color: #64748b; font-size: 14px;">Generated on ${new Date().toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</div>
                </div>
                <div class="report-info">
                    <div>
                        <div class="info-item"><span class="info-label">Tariff Name:</span> ${report.tariff.name}</div>
                        <div class="info-item"><span class="info-label">Provider:</span> ${report.tariff.provider}</div>
                        <div class="info-item"><span class="info-label">Rate per Unit:</span> ${formatCurrency(report.tariff.ratePerUnit)}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Report Period:</span> ${dateRange}</div>
                    </div>
                </div>
                <div class="summary-cards">
                    <div class="summary-card"><h3>Total Meters</h3><div class="value">${report.summary.totalMeters}</div></div>
                    <div class="summary-card"><h3>Transactions</h3><div class="value">${report.summary.totalTransactions}</div></div>
                    <div class="summary-card"><h3>Total Units</h3><div class="value">${report.summary.totalUnits.toFixed(2)}</div></div>
                    <div class="summary-card"><h3>Total Revenue</h3><div class="value">${formatCurrency(report.summary.totalRevenue)}</div></div>
                </div>
                ${report.meterBreakdown.length > 0 ? `
                <div class="section-title">Meter Breakdown</div>
                <table>
                    <thead>
                        <tr>
                            <th>Meter Number</th>
                            <th>Transactions</th>
                            <th>Total Units</th>
                            <th>Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.meterBreakdown.map((meter: MeterBreakdown) => `
                            <tr>
                                <td>${meter.meterNumber}</td>
                                <td>${meter.transactionCount}</td>
                                <td>${meter.totalUnits.toFixed(2)}</td>
                                <td>${formatCurrency(meter.totalRevenue)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                <div class="footer">
                    <div>Alver Power Systems Admin Panel - Tariff Report</div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleDownloadTransactionsExcel = (transactions: any[]) => {
        if (!transactions || transactions.length === 0) {
            alert("No transactions available to download");
            return;
        }

        try {
            const excelData = transactions.map(transaction => ({
                'Transaction ID': transaction.transId,
                'Date & Time': formatDate(transaction.transTime),
                'Meter Number': transaction.meterNumber,
                'Amount (KES)': transaction.transAmount,
                'Units': transaction.units,
                'Phone': transaction.msisdn,
                'Rate (KES)': transaction.rate,
                'Token': transaction.token,
                'Transaction Type': transaction.transactionType
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

            const dateRange = tariffReport?.dateRange.startDate && tariffReport?.dateRange.endDate
                ? `${tariffReport.dateRange.startDate}_to_${tariffReport.dateRange.endDate}`
                : tariffReport?.dateRange.startDate
                    ? `from_${tariffReport.dateRange.startDate}`
                    : tariffReport?.dateRange.endDate
                        ? `until_${tariffReport.dateRange.endDate}`
                        : 'All_Time';

            const tariffName = tariffReport?.tariff.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Tariff';
            const filename = `Transactions_${tariffName}_${dateRange}.xlsx`;

            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('Failed to download Excel file');
        }
    };

    const tabs = [
        { id: "tariff", label: "Tariff Report", icon: FileText },
        { id: "revenue", label: "Revenue Summary", icon: TrendingUp },
    ];

    const selectedTariffObj = tariffs.find((t) => t.id === selectedTariff);

    return (
        <div className="min-h-screen bg-gray-50/60 font-sans">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono-custom { font-family: 'DM Mono', monospace; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.35s ease both; }
        .animate-delay-1 { animation-delay: 0.05s; }
        .animate-delay-2 { animation-delay: 0.1s; }
        .animate-delay-3 { animation-delay: 0.15s; }
        .animate-delay-4 { animation-delay: 0.2s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Analytics</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Reports</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Generate detailed reports across tariffs and revenue</p>
                    </div>
                    {tariffReport && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadTariffReport}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                PDF
                            </button>
                            <button
                                onClick={handleDownloadTariffReportCSV}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Filters Panel ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in animate-delay-1">
                    <button
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Filter className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800">Filters</span>
                            {selectedTariffObj && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                                    {selectedTariffObj.name}
                                </span>
                            )}
                            {(startDate || endDate) && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {startDate || "…"} → {endDate || "…"}
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {filtersOpen && (
                        <div className="px-6 pb-5 border-t border-gray-100">
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                                {/* Start Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Tariff Select */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tariff</label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={selectedTariff}
                                            onChange={(e) => setSelectedTariff(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="">Select a tariff…</option>
                                            {tariffs.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name} — {t.provider}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleGenerateTariffReport}
                                        disabled={isLoadingReport || isLoadingRevenue || !selectedTariff}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
                                    >
                                        {isLoadingReport ? (
                                            <RefreshCw className="w-4 h-4 spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        {isLoadingReport ? "Generating…" : "Generate Report"}
                                    </button>
                                    {user?.role === "admin" && (
                                        <button
                                            onClick={handleGenerateRevenueSummary}
                                            disabled={isLoadingReport || isLoadingRevenue}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
                                        >
                                            {isLoadingRevenue ? (
                                                <RefreshCw className="w-4 h-4 spin" />
                                            ) : (
                                                <TrendingUp className="w-4 h-4" />
                                            )}
                                            {isLoadingRevenue ? "Calculating…" : "Revenue Summary"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in animate-delay-2">
                    {/* Tab Bar */}
                    <div className="flex border-b border-gray-100 px-2 pt-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all relative
                    ${active
                                            ? "text-blue-600 bg-blue-50/60 border-b-2 border-blue-500"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-blue-500" : "text-gray-400"}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "tariff" && (
                            <div>
                                {tariffReport ? (
                                    <div className="space-y-6 animate-in">
                                        {/* Report Context Badge */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                                                    <Zap className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                                        {tariffReport.tariff.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        {tariffReport.tariff.provider} · Rate: {fmt(tariffReport.tariff.ratePerUnit)}/unit
                                                        {(tariffReport.dateRange.startDate || tariffReport.dateRange.endDate) && (
                                                            <> · <span className="text-blue-400">{tariffReport.dateRange.startDate || "—"} → {tariffReport.dateRange.endDate || "—"}</span></>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                                Report Ready
                                            </span>
                                        </div>

                                        {/* KPI Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <MetricCard label="Total Meters" value={fmtNum(tariffReport.summary.totalMeters)} icon={Users} color="blue" sub="Active meters in period" />
                                            <MetricCard label="Transactions" value={fmtNum(tariffReport.summary.totalTransactions)} icon={ArrowUpRight} color="green" sub="Completed transactions" />
                                            <MetricCard label="Total Units (kWh)" value={tariffReport.summary.totalUnits.toFixed(1)} icon={Zap} color="amber" sub="Energy dispensed" />
                                            <MetricCard label="Gross Revenue" value={fmt(tariffReport.summary.totalRevenue)} icon={TrendingUp} color="violet" sub="Before deductions" />
                                        </div>

                                        {/* Revenue Breakdown */}
                                        <RevenueBreakdown report={tariffReport} />

                                        {/* Meter Table */}
                                        <MeterTable report={tariffReport} />

                                        {/* Transactions Download Strip */}
                                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Transaction Data</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Export full transaction log as Excel spreadsheet</p>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadTransactionsExcel(tariffReport.transactions)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                <Download className="w-4 h-4 text-emerald-500" />
                                                Download Excel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Empty State */
                                    <div className="py-16 text-center animate-in">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-1">No report generated yet</h3>
                                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                            Select a tariff from the filters above and click <span className="font-medium text-gray-600">Generate Report</span> to view analytics.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "revenue" && (
                            <div className="space-y-6 animate-in">
                                {revenueSummary ? (
                                    <>
                                        {/* Overall Summary KPIs */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <MetricCard
                                                label="Global Revenue"
                                                value={fmt(revenueSummary.overallTotals.totalRevenue)}
                                                icon={TrendingUp}
                                                color="violet"
                                                sub="Across all tariffs"
                                            />
                                            <MetricCard
                                                label="Total Units"
                                                value={fmtNum(revenueSummary.overallTotals.totalUnits)}
                                                icon={Zap}
                                                color="amber"
                                                sub="Total energy (kWh)"
                                            />
                                            <MetricCard
                                                label="Total Txns"
                                                value={fmtNum(revenueSummary.overallTotals.totalTransactions)}
                                                icon={ArrowUpRight}
                                                color="green"
                                                sub="Across all meters"
                                            />
                                            <MetricCard
                                                label="Active Meters"
                                                value={fmtNum(revenueSummary.overallTotals.totalMeters)}
                                                icon={Users}
                                                color="blue"
                                                sub="Network-wide"
                                            />
                                        </div>

                                        {/* Tariff Breakdown Table */}
                                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4 text-gray-400" />
                                                    <h4 className="text-sm font-semibold text-gray-800">Comparison by Tariff</h4>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-100">
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Tariff</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Rate</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Meters</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Txns</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Revenue</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Avg/Meter</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {revenueSummary.tariffBreakdown.map((item, idx) => (
                                                            <tr key={item.tariff.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-gray-50 transition-colors`}>
                                                                <td className="px-6 py-3.5">
                                                                    <p className="font-semibold text-gray-900">{item.tariff.name}</p>
                                                                    <p className="text-xs text-gray-400">{item.tariff.provider}</p>
                                                                </td>
                                                                <td className="px-6 py-3.5 text-gray-600">{fmt(item.tariff.ratePerUnit)}</td>
                                                                <td className="px-6 py-3.5 text-gray-600">{fmtNum(item.meterCount)}</td>
                                                                <td className="px-6 py-3.5 text-gray-600">{fmtNum(item.transactionCount)}</td>
                                                                <td className="px-6 py-3.5 font-bold text-gray-900">{fmt(item.totalRevenue)}</td>
                                                                <td className="px-6 py-3.5 text-right font-medium text-gray-600">
                                                                    {fmt(item.totalRevenue / (item.meterCount || 1))}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-16 text-center animate-in">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-800 mb-1">No revenue summary generated</h3>
                                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                            Set a date range and click <span className="font-medium text-gray-600">Revenue Summary</span> to compare performance across all tariffs.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;