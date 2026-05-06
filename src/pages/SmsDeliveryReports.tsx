/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock,
    Filter, Inbox, Link2, MessageSquareText, RefreshCw, Search,
    Send, ShieldAlert, SlidersHorizontal, X, XCircle
} from "lucide-react";
import { toast } from "sonner";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { getSmsDeliveryReports, getSmsDeliveryReportStats } from "@/../api/smsDeliveryReports.api";
import type { SmsDeliveryReport, SmsDeliveryReportStats } from "@/lib/types";

const DESCRIPTIONS = [
    "AbsentSubscriber",
    "DeliveredToTerminal",
    "DeliveryImpossible",
    "SenderName Blacklisted",
    "SentToNetwork",
    "Unknown",
    "Scheduled"
];

const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n ?? 0);
const fmtDate = (s: string | Date | null | undefined) => {
    if (!s) return "-";
    return new Date(s).toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

function StatusBadge({ description }: { description: string }) {
    const delivered = description === "DeliveredToTerminal";
    const pending = ["SentToNetwork", "Scheduled"].includes(description);
    const cls = delivered
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : pending
            ? "bg-amber-50 text-amber-700 border-amber-100"
            : "bg-rose-50 text-rose-700 border-rose-100";
    const Icon = delivered ? CheckCircle2 : pending ? Clock : XCircle;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            <Icon className="w-3 h-3" />
            {description}
        </span>
    );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
        rose: "bg-rose-50 border-rose-100 text-rose-700",
    };
    const iconBg: Record<string, string> = {
        blue: "bg-blue-100 text-blue-500",
        emerald: "bg-emerald-100 text-emerald-500",
        amber: "bg-amber-100 text-amber-500",
        rose: "bg-rose-100 text-rose-500",
    };

    return (
        <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${colors[color]}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60 leading-none">{label}</p>
                <p className="text-2xl font-bold leading-tight mt-1">{value}</p>
                {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export function SmsDeliveryReportsPage() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    const [reports, setReports] = useState<SmsDeliveryReport[]>([]);
    const [stats, setStats] = useState<SmsDeliveryReportStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [filters, setFilters] = useState({
        page: 1,
        limit: 15,
        description: "all",
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    const activeFilters =
        (filters.description !== "all" ? 1 : 0) +
        (filters.search ? 1 : 0) +
        (filters.sortBy !== "createdAt" || filters.sortOrder !== "desc" ? 1 : 0);

    const handleFilterChange = (patch: Partial<typeof filters>) => {
        setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
    };

    const fetchReports = useCallback(async () => {
        try {
            setIsLoading(true);
            const cleanFilters: Record<string, string | number> = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") cleanFilters[key] = value;
            });

            const response = await getSmsDeliveryReports(axiosInstance, cleanFilters);
            setReports(response.data?.reports || []);
            setPagination(response.data?.pagination || pagination);
        } catch (error) {
            console.error("Error fetching SMS delivery reports:", error);
            toast.error("Failed to fetch SMS delivery reports");
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await getSmsDeliveryReportStats(axiosInstance);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching SMS delivery report stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const delivered = stats?.byDescription?.DeliveredToTerminal || 0;
    const pending = (stats?.byDescription?.SentToNetwork || 0) + (stats?.byDescription?.Scheduled || 0);
    const failed = Math.max((stats?.total || 0) - delivered - pending, 0);

    return (
        <div className="min-h-screen bg-gray-50/60 font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
                * { font-family: 'DM Sans', sans-serif; }
                .font-mono-custom { font-family: 'DM Mono', monospace; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-in { animation: fadeInUp 0.3s ease both; }
                @keyframes shimmer { to { background-position: -200% 0; } }
                .skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Admin</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">SMS Delivery Reports</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Track Advanta delivery callbacks and unmatched message IDs</p>
                    </div>
                    <button
                        onClick={() => { fetchReports(); fetchStats(); }}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in" style={{ animationDelay: "60ms" }}>
                    <StatCard label="Total Reports" value={fmtNum(stats?.total || 0)} icon={MessageSquareText} color="blue" sub="All callbacks" />
                    <StatCard label="Delivered" value={fmtNum(delivered)} icon={CheckCircle2} color="emerald" sub="Terminal delivery" />
                    <StatCard label="Pending" value={fmtNum(pending)} icon={Clock} color="amber" sub="Network or scheduled" />
                    <StatCard label="Unmatched" value={fmtNum(stats?.unmatched || 0)} icon={ShieldAlert} color={(stats?.unmatched || 0) > 0 ? "rose" : "blue"} sub={`${fmtNum(failed)} non-delivered`} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Send className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900">Delivery Report Feed</h2>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                    {fmtNum(pagination.total)} total
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                                        placeholder="Search message ID"
                                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
                                    />
                                    {filters.search && (
                                        <button aria-label="Clear message ID search" onClick={() => handleFilterChange({ search: "" })} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen || activeFilters > 0 ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    Filters
                                    {activeFilters > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center leading-none">
                                            {activeFilters}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-end gap-3 animate-in">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status Description</label>
                                    <div className="relative">
                                        <select
                                            value={filters.description}
                                            onChange={(e) => handleFilterChange({ description: e.target.value })}
                                            className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="all">All descriptions</option>
                                            {DESCRIPTIONS.map((description) => (
                                                <option key={description} value={description}>{description}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sort By</label>
                                    <div className="relative">
                                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={`${filters.sortBy}:${filters.sortOrder}`}
                                            onChange={(e) => {
                                                const [sortBy, sortOrder] = e.target.value.split(":");
                                                handleFilterChange({ sortBy, sortOrder });
                                            }}
                                            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="createdAt:desc">Newest created</option>
                                            <option value="createdAt:asc">Oldest created</option>
                                            <option value="timestamp:desc">Newest timestamp</option>
                                            <option value="timestamp:asc">Oldest timestamp</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {activeFilters > 0 && (
                                    <button
                                        onClick={() => handleFilterChange({ description: "all", search: "", sortBy: "createdAt", sortOrder: "desc" })}
                                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="skeleton h-4 w-28" />
                                    <div className="skeleton h-4 w-40" />
                                    <div className="skeleton h-4 flex-1" />
                                    <div className="skeleton h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">No SMS delivery reports found</p>
                            <p className="text-xs text-gray-400 mt-1">{activeFilters > 0 ? "Try adjusting your filters" : "Advanta callbacks will appear here"}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Message ID", "Description", "Time Taken", "Timestamp", "Linked SMS / Recipient", "Created At"].map((heading) => (
                                            <th key={heading} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {reports.map((report, idx) => (
                                        <tr key={report.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/20 transition-colors`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="font-mono-custom text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {report.messageId}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <StatusBadge description={report.description} />
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-gray-600">
                                                {report.timeTaken}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                {fmtDate(report.reportTimestamp)}
                                            </td>
                                            <td className="px-5 py-3.5 min-w-[220px]">
                                                {report.smsMessage ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                                            <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{report.smsMessage.recipient}</p>
                                                            <p className="text-xs text-gray-400 truncate">{report.smsMessage.message}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Unmatched message ID
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                {fmtDate(report.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Showing <span className="font-medium text-gray-600">{pagination.total === 0 ? 0 : fmtNum((pagination.page - 1) * pagination.limit + 1)}</span>
                            -<span className="font-medium text-gray-600">{fmtNum(Math.min(pagination.page * pagination.limit, pagination.total))}</span>
                            {" "}of <span className="font-medium text-gray-600">{fmtNum(pagination.total)}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                                disabled={!pagination.hasPrevPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Prev
                            </button>
                            <button
                                onClick={() => handleFilterChange({ page: pagination.page + 1 })}
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
        </div>
    );
}

export default SmsDeliveryReportsPage;
