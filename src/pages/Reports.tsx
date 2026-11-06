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
import {
    generateTariffReportPDF,
    generateTariffReportExcel,
    generateTariffReportCSV,
} from '../components/Reports/ReportExports';

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
        blue: { bg: "bg-card", text: "text-foreground", icon: "text-muted-foreground", border: "border-border" },
        green: { bg: "bg-card", text: "text-foreground", icon: "text-muted-foreground", border: "border-border" },
        amber: { bg: "bg-card", text: "text-foreground", icon: "text-muted-foreground", border: "border-border" },
        violet: { bg: "bg-card", text: "text-foreground", icon: "text-muted-foreground", border: "border-border" },
    };
    const c = colors[color] || colors.blue;
    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <span className={`av-label text-[10.5px] ${c.text} opacity-70`}>{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-card shadow-sm`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
            </div>
            <div>
                <p className={`text-2xl font-bold ${c.text} leading-none`}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function RevenueBreakdown({ report }: { report: TariffReport }) {
    const basePrice = 28;
    const rate = report.tariff.ratePerUnit;

    const servicePercent = (rate - basePrice) / basePrice; // 0.08
    const servicePercentDisplay = servicePercent * 100;    // 8

    const serviceCharge = servicePercent * report.summary.totalRevenue;
    const payable = report.summary.totalRevenue - serviceCharge;

    const pct = (v: number) => report.summary.totalRevenue > 0
        ? ((v / report.summary.totalRevenue) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="av-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">Revenue Breakdown</h4>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Gross Revenue", value: report.summary.totalRevenue, pct: "100%", color: "bg-info" },
                    { label: "Service Charge", value: serviceCharge, pct: `${pct(serviceCharge)}%`, color: "bg-muted-foreground" },
                    { label: "Payable to Client", value: payable, pct: `${pct(payable)}%`, color: "bg-ok" },
                ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{fmt(item.value)}</p>
                        <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: item.pct }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{item.pct} of gross</span>
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
    ];

    return (
        <div className="av-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">Meter Breakdown</h4>
                    <span className="ml-1 px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                        {report.meterBreakdown.length} meters
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Sort by:</span>
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="text-xs text-text-secondary border border-border rounded-md px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
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
                        <tr className="border-b border-border">
                            {cols.map((col) => (
                                <th
                                    key={col.key}
                                    className="av-th px-6 py-3 text-left"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.map((meter) => {
                            const svc = (meter.totalRevenue / rate) * 3;
                            return (
                                <tr key={meter.meterNumber} className={`av-row`}>
                                    <td className="px-6 py-3.5 font-mono text-xs text-text-secondary font-medium whitespace-nowrap">
                                        {meter?.meterNumber}
                                    </td>
                                    <td className="px-6 py-3.5 text-text-secondary whitespace-nowrap">{fmtNum(meter?.transactionCount)}</td>
                                    <td className="px-6 py-3.5 text-text-secondary whitespace-nowrap">{meter?.totalUnits?.toFixed(2)}</td>
                                    <td className="px-6 py-3.5 font-medium text-foreground whitespace-nowrap">{fmt(meter?.totalRevenue)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-border bg-muted">
                            <td className="av-label text-[10.5px] px-6 py-3 text-text-secondary">Totals</td>
                            <td className="px-6 py-3 text-xs font-bold text-text-secondary">
                                {fmtNum(sorted.reduce((s, m) => s + m.transactionCount, 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold text-text-secondary">
                                {sorted.reduce((s, m) => s + m.totalUnits, 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold text-foreground">
                                {fmt(sorted.reduce((s, m) => s + m.totalRevenue, 0))}
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
            alert('Please generate a tariff report first');
            return;
        }
        generateTariffReportPDF(tariffReport);
    };

    const handleDownloadTariffReportCSV = () => {
        if (!tariffReport) {
            alert('Please generate a tariff report first');
            return;
        }
        generateTariffReportCSV(tariffReport);
    };

    const handleDownloadTransactionsExcel = (_transactions: any[]) => {
        // The new Excel export includes ALL three sheets (Summary, Meter Breakdown, Transactions)
        // in one beautiful workbook — so we just pass the full report.
        if (!tariffReport) {
            alert('Please generate a tariff report first');
            return;
        }
        generateTariffReportExcel(tariffReport);
    };

    const tabs = [
        { id: "tariff", label: "Tariff Report", icon: FileText },
        // { id: "revenue", label: "Revenue Summary", icon: TrendingUp },
    ];

    const selectedTariffObj = tariffs.find((t) => t.id === selectedTariff);

    return (
        <div className="min-h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Analytics</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Reports<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Generate detailed reports across tariffs and revenue</p>
                    </div>
                    {tariffReport && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadTariffReport}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted transition-colors shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                PDF
                            </button>
                            <button
                                onClick={handleDownloadTariffReportCSV}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Filters Panel ── */}
                <div className="av-panel overflow-hidden animate-in animate-delay-1">
                    <button
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/60 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">Filters</span>
                            {selectedTariffObj && (
                                <span className="px-2 py-0.5 rounded-md bg-accent text-text-secondary text-xs font-medium border border-border">
                                    {selectedTariffObj.name}
                                </span>
                            )}
                            {(startDate || endDate) && (
                                <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {startDate || "…"} → {endDate || "…"}
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {filtersOpen && (
                        <div className="px-6 pb-5 border-t border-border">
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                                {/* Start Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Tariff Select */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Tariff</label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <select
                                            value={selectedTariff}
                                            onChange={(e) => setSelectedTariff(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all appearance-none"
                                        >
                                            <option value="">Select a tariff…</option>
                                            {tariffs.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name} — {t.provider}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleGenerateTariffReport}
                                        disabled={isLoadingReport || isLoadingRevenue || !selectedTariff}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/10"
                                    >
                                        {isLoadingReport ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        {isLoadingReport ? "Generating…" : "Generate Report"}
                                    </button>
                                    {/* {user?.role === "admin" && (
                                        <button
                                            onClick={handleGenerateRevenueSummary}
                                            disabled={isLoadingReport || isLoadingRevenue}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ok text-white text-sm font-semibold rounded-lg hover:bg-ok disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/10"
                                        >
                                            {isLoadingRevenue ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <TrendingUp className="w-4 h-4" />
                                            )}
                                            {isLoadingRevenue ? "Calculating…" : "Revenue Summary"}
                                        </button>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="av-panel overflow-hidden animate-in animate-delay-2">
                    {/* Tab Bar */}
                    <div className="flex border-b border-border px-2 pt-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all relative
                    ${active
                                            ? "text-accent-text bg-signal-soft/60 border-b-2 border-signal"
                                            : "text-muted-foreground hover:text-text-secondary hover:bg-muted"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-accent-text" : "text-muted-foreground"}`} />
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
                                                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                                                    <Zap className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground text-base leading-tight">
                                                        {tariffReport.tariff.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tariffReport.tariff.provider} · Rate: {fmt(tariffReport.tariff.ratePerUnit)}/unit
                                                        {(tariffReport.dateRange.startDate || tariffReport.dateRange.endDate) && (
                                                            <> · <span className="text-accent-text">{tariffReport.dateRange.startDate || "—"} → {tariffReport.dateRange.endDate || "—"}</span></>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-1 text-xs text-ok-text bg-ok-soft border border-ok-edge px-2.5 py-1 rounded-md font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
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
                                        <div className="flex items-center justify-between bg-muted border border-border rounded-xl px-5 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Transaction Data</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Export full transaction log as Excel spreadsheet</p>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadTransactionsExcel(tariffReport.transactions)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg text-text-secondary hover:bg-muted transition-colors shadow-sm"
                                            >
                                                <Download className="w-4 h-4 text-ok-text" />
                                                Download Full Report (.xlsx)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Empty State */
                                    <div className="py-16 text-center animate-in">
                                        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground mb-1">No report generated yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            Select a tariff from the filters above and click <span className="font-medium text-text-secondary">Generate Report</span> to view analytics.
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
                                        <div className="av-panel overflow-hidden">
                                            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                                    <h4 className="text-sm font-semibold text-foreground">Comparison by Tariff</h4>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="border-b border-border">
                                                            <th className="av-th px-6 py-3">Tariff</th>
                                                            <th className="av-th px-6 py-3">Rate</th>
                                                            <th className="av-th px-6 py-3">Meters</th>
                                                            <th className="av-th px-6 py-3">Txns</th>
                                                            <th className="av-th px-6 py-3">Revenue</th>
                                                            <th className="av-th px-6 py-3 text-right">Avg/Meter</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {revenueSummary.tariffBreakdown.map((item) => (
                                                            <tr key={item.tariff.id} className={`av-row hover:bg-muted transition-colors`}>
                                                                <td className="px-6 py-3.5">
                                                                    <p className="font-semibold text-foreground">{item.tariff.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.tariff.provider}</p>
                                                                </td>
                                                                <td className="px-6 py-3.5 text-text-secondary">{fmt(item.tariff.ratePerUnit)}</td>
                                                                <td className="px-6 py-3.5 text-text-secondary">{fmtNum(item.meterCount)}</td>
                                                                <td className="px-6 py-3.5 text-text-secondary">{fmtNum(item.transactionCount)}</td>
                                                                <td className="px-6 py-3.5 font-bold text-foreground">{fmt(item.totalRevenue)}</td>
                                                                <td className="px-6 py-3.5 text-right font-medium text-text-secondary">
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
                                        <div className="w-14 h-14 rounded-xl bg-ok-soft border border-ok-edge flex items-center justify-center mx-auto mb-4">
                                            <TrendingUp className="w-6 h-6 text-ok-text" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground mb-1">No revenue summary generated</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            Set a date range and click <span className="font-medium text-text-secondary">Revenue Summary</span> to compare performance across all tariffs.
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
