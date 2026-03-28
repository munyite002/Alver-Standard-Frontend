/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import {
    Clock, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Trash2,
    ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, Search,
    ChevronDown, Minus, Eye, ListOrdered, RefreshCw,
    Loader2
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { getQueueItems, getQueueStats, retryQueueItem, cancelQueueItem } from "@/../api/queue.api";
import type { QueueItem, QueueStats, QueueStatus } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);
const fmtDate = (s: string | Date | null | undefined) => {
    if (!s) return "—";
    return new Date(s as string).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const fmtDuration = (ms: number | null | undefined) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};
const timeAgo = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    const seconds = Math.floor((Date.now() - new Date(d as string).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, icon: Icon, color, delay = 0 }: any) {
    const colors: any = {
        amber: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-amber-500", iconBg: "bg-amber-100", text: "text-amber-700" },
        blue: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-500", iconBg: "bg-blue-100", text: "text-blue-700" },
        green: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500", iconBg: "bg-emerald-100", text: "text-emerald-700" },
        red: { bg: "bg-rose-50", border: "border-rose-100", icon: "text-rose-500", iconBg: "bg-rose-100", text: "text-rose-700" },
        slate: { bg: "bg-slate-50", border: "border-slate-100", icon: "text-slate-500", iconBg: "bg-slate-100", text: "text-slate-700" },
        violet: { bg: "bg-violet-50", border: "border-violet-100", icon: "text-violet-500", iconBg: "bg-violet-100", text: "text-violet-700" },
    };
    const c = colors[color] || colors.blue;

    return (
        <div
            className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3 animate-in`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-widest ${c.text} opacity-60`}>{label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            {sublabel && (
                <span className="text-xs text-gray-400">{sublabel}</span>
            )}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function QueueStatusBadge({ status }: { status: QueueStatus }) {
    const map: Record<QueueStatus, { icon: any; label: string; cls: string }> = {
        pending: { icon: Clock, label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-100" },
        processing: { icon: Loader2, label: "Processing", cls: "bg-blue-50 text-blue-700 border-blue-100" },
        completed: { icon: CheckCircle2, label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        failed: { icon: XCircle, label: "Failed", cls: "bg-rose-50 text-rose-600 border-rose-100" },
        retry_wait: { icon: RotateCcw, label: "Retry Wait", cls: "bg-violet-50 text-violet-700 border-violet-100" },
    };
    const { icon: Icon, label, cls } = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
            {label}
        </span>
    );
}

// ─── Source Badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
    const isStk = source === "stk";
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${isStk ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}>
            {isStk ? "STK" : "C2B"}
        </span>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function QueueDetailModal({ item, onClose, onRetry, onCancel, actionLoading }: {
    item: QueueItem | null;
    onClose: () => void;
    onRetry: (id: string) => void;
    onCancel: (id: string) => void;
    actionLoading: string | null;
}) {
    if (!item) return null;

    const fields: [string, string | number | null | undefined][] = [
        ["Transaction ID", item.transId],
        ["Meter Number", item.billRefNumber],
        ["Customer", `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"],
        ["Phone", item.msisdn],
        ["Amount", fmt(item.transAmount)],
        ["Source", item.source.toUpperCase()],
        ["Token", item.token || "—"],
        ["Units", item.units ? `${item.units} kWh` : "—"],
        ["Retries", `${item.retryCount} / ${item.maxRetries}`],
        ["Processing Time", fmtDuration(item.processingDuration)],
        ["Created", fmtDate(item.createdAt)],
        ["Processed", fmtDate(item.processedAt)],
    ];

    const canRetry = ["failed", "retry_wait"].includes(item.status);
    const canCancel = ["pending", "retry_wait"].includes(item.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                            <ListOrdered className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">Queue Item Detail</h3>
                            <p className="text-xs text-gray-400 font-mono-custom">{item.id.slice(0, 8)}…</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <QueueStatusBadge status={item.status} />
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map(([label, val]) => (
                        <div key={label as string}>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-gray-800 break-all">{val ?? "—"}</p>
                        </div>
                    ))}
                </div>

                {/* Error details */}
                {item.errorMessage && (
                    <div className="mx-6 mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100">
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">Error</p>
                        <p className="text-xs text-rose-700 font-mono-custom break-all">{item.errorMessage}</p>
                        {item.errorDetails && (
                            <details className="mt-2">
                                <summary className="text-xs text-rose-400 cursor-pointer hover:text-rose-600">Stack trace</summary>
                                <pre className="mt-1 text-xs text-rose-600 whitespace-pre-wrap font-mono-custom max-h-32 overflow-y-auto">{item.errorDetails}</pre>
                            </details>
                        )}
                    </div>
                )}

                {/* Next retry */}
                {item.nextRetryAt && (
                    <div className="mx-6 mb-4 p-3 rounded-lg bg-violet-50 border border-violet-100">
                        <p className="text-xs text-violet-600">
                            <span className="font-semibold">Next retry:</span> {fmtDate(item.nextRetryAt)} ({timeAgo(item.nextRetryAt)})
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {canRetry && (
                            <button
                                onClick={() => onRetry(item.id)}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className={`w-3 h-3 ${actionLoading === item.id ? "animate-spin" : ""}`} />
                                Retry
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => onCancel(item.id)}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" />
                                Cancel
                            </button>
                        )}
                    </div>
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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, confirmColor, onConfirm, onCancel }: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-sm animate-in p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${confirmColor === "red" ? "bg-rose-100" : "bg-violet-100"} flex items-center justify-center`}>
                        {confirmColor === "red"
                            ? <Trash2 className="w-5 h-5 text-rose-500" />
                            : <RotateCcw className="w-5 h-5 text-violet-500" />
                        }
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${confirmColor === "red" ? "bg-rose-500 hover:bg-rose-600" : "bg-violet-500 hover:bg-violet-600"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export function PaymentQueuePage() {
    const { searchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string; setSearchQuery: (query: string) => void }>();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    // State
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [queueData, setQueueData] = useState<any>({
        items: [],
        pagination: { total: 0, page: 1, limit: 15, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    const [filters, setFilters] = useState<any>({
        page: 1,
        limit: 15,
        status: "",
        billRefNumber: "",
        startDate: "",
        endDate: "",
    });

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: "retry" | "cancel"; id: string } | null>(null);
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Fetching ─────────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            setIsLoadingStats(true);
            const response = await getQueueStats(axiosInstance);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching queue stats:", error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const fetchItems = useCallback(async () => {
        try {
            setIsLoadingItems(true);
            const cleanFilters: any = {};
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== "" && val !== null && val !== undefined) cleanFilters[key] = val;
            });
            const response = await getQueueItems(axiosInstance, cleanFilters);
            setQueueData(response.data);
        } catch (error) {
            console.error("Error fetching queue items:", error);
        } finally {
            setIsLoadingItems(false);
        }
    }, [filters]);

    const refreshAll = useCallback(() => {
        fetchStats();
        fetchItems();
    }, [fetchStats, fetchItems]);

    // Initial load
    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [filters]);

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh) {
            autoRefreshRef.current = setInterval(refreshAll, 10000);
        } else if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
            autoRefreshRef.current = null;
        }
        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
        };
    }, [autoRefresh, refreshAll]);

    // ─── Actions ──────────────────────────────────────────────────────────────
    const handleRetry = async (id: string) => {
        try {
            setActionLoading(id);
            await retryQueueItem(axiosInstance, id);
            setSelectedItem(null);
            setConfirmAction(null);
            refreshAll();
        } catch (error: any) {
            console.error("Error retrying item:", error);
            alert(error?.response?.data?.error || "Failed to retry item");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            setActionLoading(id);
            await cancelQueueItem(axiosInstance, id);
            setSelectedItem(null);
            setConfirmAction(null);
            refreshAll();
        } catch (error: any) {
            console.error("Error cancelling item:", error);
            alert(error?.response?.data?.error || "Failed to cancel item");
        } finally {
            setActionLoading(null);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > queueData.pagination.totalPages) return;
        setFilters((prev: any) => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters((prev: any) => ({ ...prev, ...newFilters, page: 1 }));
    };

    // Client-side search filter
    const filtered = (queueData.items || []).filter((item: QueueItem) => {
        const q = searchQuery.toLowerCase();
        return !q || [item.transId, item.billRefNumber, item.firstName, item.lastName, item.msisdn]
            .some((v) => v?.toLowerCase().includes(q));
    });

    const pagination = queueData.pagination;
    const today = new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const activeFilterCount = [filters.status, filters.billRefNumber, filters.startDate, filters.endDate].filter(Boolean).length;

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
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Operations</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Payment Queue</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Auto-refresh Toggle */}
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full shadow-sm text-xs font-medium transition-colors ${autoRefresh
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="relative flex h-2 w-2">
                                {autoRefresh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? "bg-emerald-500" : "bg-gray-300"}`}></span>
                            </span>
                            {autoRefresh ? "Live" : "Paused"}
                        </button>
                        {/* Manual Refresh */}
                        <button
                            onClick={refreshAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Queue Status</span>
                        <span className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">Real-time</span>
                    </div>
                    {isLoadingStats ? (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
                                    <div className="skeleton h-3 w-24" />
                                    <div className="skeleton h-7 w-16" />
                                    <div className="skeleton h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard
                                label="Pending"
                                value={fmtNum(stats?.counts?.pending || 0)}
                                sublabel="Awaiting processing"
                                icon={Clock}
                                color="amber"
                                delay={0}
                            />
                            <StatCard
                                label="Processing"
                                value={fmtNum(stats?.counts?.processing || 0)}
                                sublabel="Currently active"
                                icon={Loader2}
                                color="blue"
                                delay={60}
                            />
                            <StatCard
                                label="Completed Today"
                                value={fmtNum(stats?.totalToday || 0)}
                                sublabel={`Avg: ${fmtDuration(stats?.avgProcessingTimeMs)}`}
                                icon={CheckCircle2}
                                color="green"
                                delay={120}
                            />
                            <StatCard
                                label="Failed"
                                value={fmtNum(stats?.counts?.failed || 0)}
                                sublabel="Require attention"
                                icon={XCircle}
                                color="red"
                                delay={180}
                            />
                            <StatCard
                                label="Retry Wait"
                                value={fmtNum(stats?.counts?.retry_wait || 0)}
                                sublabel={stats?.oldestPending ? `Oldest: ${timeAgo(stats.oldestPending.createdAt)}` : "None pending"}
                                icon={RotateCcw}
                                color="violet"
                                delay={240}
                            />
                        </div>
                    )}
                </div>

                {/* ── Queue Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "300ms" }}>

                    {/* Section Header  */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">Queue Items</h2>
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
                                        placeholder="Search queue…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-48"
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
                                    {activeFilterCount > 0 && (
                                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-xs font-bold leading-none">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-end gap-3 animate-in">
                                {/* Status filter */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
                                    <div className="relative">
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange({ status: e.target.value })}
                                            className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                                        >
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                            <option value="retry_wait">Retry Wait</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Meter search */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meter Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 37000..."
                                        value={filters.billRefNumber}
                                        onChange={(e) => handleFilterChange({ billRefNumber: e.target.value })}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all w-36"
                                    />
                                </div>

                                {/* Date range */}
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

                                {/* Clear filters */}
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => handleFilterChange({ status: "", billRefNumber: "", startDate: "", endDate: "" })}
                                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {isLoadingItems ? (
                        <div className="p-6 space-y-3">
                            {[...Array(8)].map((_, i) => (
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
                                <ListOrdered className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">No queue items found</p>
                            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Transaction ID", "Meter", "Customer", "Amount", "Source", "Status", "Retries", "Created", "Actions"].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((item: QueueItem, idx: number) => {
                                        const canRetry = ["failed", "retry_wait"].includes(item.status);
                                        const canCancel = ["pending", "retry_wait"].includes(item.status);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors group cursor-pointer`}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="font-mono-custom text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {item.transId}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-xs text-gray-600 font-mono-custom">{item.billRefNumber}</span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {`${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-gray-900">{fmt(item.transAmount)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <SourceBadge source={item.source} />
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <QueueStatusBadge status={item.status} />
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-600">{item.retryCount}/{item.maxRetries}</span>
                                                        {item.retryCount > 0 && (
                                                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                    {fmtDate(item.createdAt)}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-blue-600 transition-all p-1 rounded"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        {canRetry && (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: "retry", id: item.id })}
                                                                disabled={actionLoading === item.id}
                                                                className="flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-600 transition-all p-1 rounded disabled:opacity-50"
                                                                title="Retry"
                                                            >
                                                                <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === item.id ? "animate-spin" : ""}`} />
                                                            </button>
                                                        )}
                                                        {canCancel && (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
                                                                disabled={actionLoading === item.id}
                                                                className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-600 transition-all p-1 rounded disabled:opacity-50"
                                                                title="Cancel"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Showing{" "}
                            <span className="font-medium text-gray-600">
                                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                            </span>
                            –
                            <span className="font-medium text-gray-600">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>
                            {" "}of{" "}
                            <span className="font-medium text-gray-600">{fmtNum(pagination.total)}</span> items
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

            {/* Modals */}
            {selectedItem && (
                <QueueDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onRetry={(id) => setConfirmAction({ type: "retry", id })}
                    onCancel={(id) => setConfirmAction({ type: "cancel", id })}
                    actionLoading={actionLoading}
                />
            )}

            {confirmAction && (
                <ConfirmDialog
                    title={confirmAction.type === "retry" ? "Retry Queue Item" : "Cancel Queue Item"}
                    message={confirmAction.type === "retry"
                        ? "This will reset the item to pending and the worker will pick it up for reprocessing."
                        : "This will permanently mark the item as failed. This action cannot be undone."
                    }
                    confirmLabel={confirmAction.type === "retry" ? "Retry" : "Cancel Item"}
                    confirmColor={confirmAction.type === "retry" ? "violet" : "red"}
                    onConfirm={() => {
                        if (confirmAction.type === "retry") handleRetry(confirmAction.id);
                        else handleCancel(confirmAction.id);
                    }}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
}

export default PaymentQueuePage;
