/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
    TrendingUp, Zap, CreditCard, Users, ArrowUpRight,
    ArrowDownRight, Eye, ChevronLeft, ChevronRight,
    Calendar, SlidersHorizontal, Search, ArrowUpDown,
    CheckCircle2, Clock, XCircle, Receipt, ChevronDown,
    Minus, RefreshCw
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
    getDashboardMetrics,
    getAllTransactions
} from "@/../api/transactions.api";
import type { Payment } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

const fmtDate = (s: string | Date) => {
    if (!s) return "—";

    return new Date(s).toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
        startDate: formatDate(start),
        endDate: formatDate(end)
    };
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, icon: Icon, color, prefix = "", suffix = "", delay = 0 }: any) {
    const isPositive = change >= 0;
    const colors: any = {
        blue: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-500", iconBg: "bg-blue-100", text: "text-blue-700" },
        green: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500", iconBg: "bg-emerald-100", text: "text-emerald-700" },
        amber: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-amber-500", iconBg: "bg-amber-100", text: "text-amber-700" },
        slate: { bg: "bg-slate-50", border: "border-slate-100", icon: "text-slate-500", iconBg: "bg-slate-100", text: "text-slate-700" },
    };
    const c = colors[color] || colors.blue;

    return (
        <div
            className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-4 animate-in`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-widest ${c.text} opacity-60`}>{label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
            </div>

            <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">
                    {prefix}{value}{suffix}
                </p>
            </div>

            <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
          ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}
                >
                    {isPositive
                        ? <ArrowUpRight className="w-3 h-3" />
                        : <ArrowDownRight className="w-3 h-3" />
                    }
                    {Math.abs(change)}%
                </div>
                <span className="text-xs text-gray-400">vs last month</span>
            </div>
        </div>
    );
}
// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
    const map: any = {
        completed: { icon: CheckCircle2, label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        pending: { icon: Clock, label: "Pending", cls: "bg-amber-50  text-amber-700  border-amber-100" },
        failed: { icon: XCircle, label: "Failed", cls: "bg-rose-50   text-rose-600   border-rose-100" },
    };
    // Default to completed for real data unless status is specified
    const key = status || "completed";
    const { icon: Icon, label, cls } = map[key] || map.completed;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// ─── Transaction Modal ────────────────────────────────────────────────────────
function TransactionModal({ tx, onClose }: { tx: Payment | null; onClose: () => void }) {
    if (!tx) return null;
    const fields = [
        ["Transaction ID", tx.transId],
        ["Meter Number", tx.billRefNumber],
        ["Reference", tx.billRefNumber],
        ["Customer", `${tx.firstName || ''} ${tx.lastName || ''}`.trim() || '—'],
        ["Phone", tx.msisdn],
        ["Amount", fmt(tx.transAmount)],
        ["Units", `${tx.units} kWh`],
        ["Date & Time", fmtDate(tx.transTime)],
    ];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                            <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">Transaction Detail</h3>
                            <p className="text-xs text-gray-400 font-mono-custom">{tx.transId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge />
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map(([label, val]: any) => (
                        <div key={label}>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-gray-800 break-all">{val}</p>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
    const { searchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string, setSearchQuery: (query: string) => void }>();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    // State
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [transactionsData, setTransactionsData] = useState<any>({
        transactions: [],
        pagination: { total: 0, page: 1, limit: 8, totalPages: 0, hasNextPage: false, hasPrevPage: false }
    });

    const [filters, setFilters] = useState<any>({
        page: 1,
        limit: 8,
        meterNumber: '',
        ...getMonthDates(),
        sort: "latest"
    });

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Payment | null>(null);

    // Fetching
    const fetchDashboardMetrics = async () => {
        try {
            setIsLoadingMetrics(true);
            const response = await getDashboardMetrics(axiosInstance);
            setMetrics(response.data);
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setIsLoadingMetrics(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setIsLoadingTransactions(true);
            const response = await getAllTransactions(axiosInstance, filters);
            setTransactionsData(response.data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchDashboardMetrics();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > transactionsData.pagination.totalPages) return;
        setFilters((prev: any) => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handleSortChange = (val: string) => {
        let sortValue = "latest";
        if (val === "oldest") sortValue = "earliest";
        if (val === "amount_desc") sortValue = "highest";
        if (val === "amount_asc") sortValue = "lowest";
        setFilters((prev: any) => ({ ...prev, sort: sortValue, page: 1 }));
    };

    const filtered = (transactionsData.transactions || []).filter((tx: Payment) => {
        const q = searchQuery.toLowerCase();
        return !q || [tx.transId, tx.billRefNumber, tx.firstName, tx.lastName, tx.msisdn]
            .some((v) => v?.toLowerCase().includes(q));
    });

    const pagination = transactionsData.pagination;
    const today = new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="min-h-screen bg-gray-50/60 font-sans">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono-custom { font-family: 'DM Mono', monospace; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.3s ease both; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Overview</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-gray-600">Live</span>
                    </div>
                </div>

                {/* ── KPI Hero Section ── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Key Metrics</span>
                        <span className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">Month to date</span>
                    </div>
                    {isLoadingMetrics ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
                                    <div className="skeleton h-3 w-24" />
                                    <div className="skeleton h-7 w-32" />
                                    <div className="skeleton h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                label="Gross Revenue"
                                value={fmt(metrics?.totalRevenue?.amount || 0)}
                                change={metrics?.totalRevenue?.percentageChange || 0}
                                icon={TrendingUp}
                                color="blue"
                                delay={0}
                            />
                            <StatCard
                                label="Transactions"
                                value={fmtNum(metrics?.totalPayments?.count || 0)}
                                change={metrics?.totalPayments?.percentageChange || 0}
                                icon={CreditCard}
                                color="green"
                                delay={60}
                            />
                            <StatCard
                                label="Units Dispensed"
                                value={fmtNum(Math.round(metrics?.totalUnits || 0))}
                                change={0}
                                icon={Zap}
                                color="amber"
                                delay={120}
                                suffix=" kWh"
                            />
                            <StatCard
                                label="Service Fee"
                                value={fmt(metrics?.serviceFee)}
                                change={0}
                                icon={CreditCard}
                                color="slate"
                                delay={180}
                            />
                        </div>
                    )}
                </div>

                {/* ── Transactions Section ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "240ms" }}>

                    {/* Section Header */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
                                    <p className="text-xs text-gray-400">
                                        {fmtNum(pagination.total)} total · page {pagination.page} of {fmtNum(pagination.totalPages || 1)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search transactions…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-52 cursor-not-allowed"
                                        title="Use global search in header"
                                    />
                                </div>
                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen
                                            ? "bg-blue-50 border-blue-200 text-blue-600"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filters
                                    {(filters.startDate || filters.endDate) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-end gap-3 animate-in">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sort</label>
                                    <div className="relative">
                                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={filters.sort === "earliest" ? "oldest" : filters.sort === "highest" ? "amount_desc" : filters.sort === "lowest" ? "amount_asc" : "latest"}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="latest">Latest first</option>
                                            <option value="oldest">Oldest first</option>
                                            <option value="amount_desc">Amount: high → low</option>
                                            <option value="amount_asc">Amount: low → high</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                {(filters.startDate || filters.endDate) && (
                                    <button
                                        onClick={() => handleFilterChange({ startDate: "", endDate: "" })}
                                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Clear dates
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {isLoadingTransactions ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="skeleton h-4 flex-1" style={{ animationDelay: `${i * 80}ms` }} />
                                    <div className="skeleton h-4 w-24" style={{ animationDelay: `${i * 80 + 20}ms` }} />
                                    <div className="skeleton h-4 w-20" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <Receipt className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">No transactions found</p>
                            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Transaction ID", "Customer", "Meter", "Date & Time", "Units", "Amount", "Status", "Actions"].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((tx: Payment, idx: number) => (
                                        <tr
                                            key={tx.id}
                                            className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors group`}
                                        >
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="font-mono-custom text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {tx.transId}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{tx.firstName} {tx.lastName}</p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="text-xs text-gray-600 font-mono-custom">{tx.billRefNumber}</span>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                {fmtDate(tx.transTime)}
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                    <span className="text-sm text-gray-700">{tx.units || 'N/A'}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">{fmt(tx.transAmount)}</span>
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <StatusBadge />
                                            </td>

                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-blue-600 group-hover:text-blue-600 transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Showing <span className="font-medium text-gray-600">{pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}</span>–<span className="font-medium text-gray-600">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-600">{fmtNum(pagination.total)}</span> transactions
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Prev
                            </button>

                            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${pagination.page === p
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {pagination.totalPages > 5 && (
                                <span className="text-xs text-gray-400 px-1">…</span>
                            )}

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={!pagination.hasNextPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedTx && (
                <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
            )}
        </div>
    );
}

export default DashboardPage;
