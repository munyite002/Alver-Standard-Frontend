/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { StatTile as StatCard } from "@/components/ui/stat-tile";
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function QueueStatusBadge({ status }: { status: QueueStatus }) {
    const map: Record<QueueStatus, { icon: any; label: string; cls: string }> = {
        pending: { icon: Clock, label: "Pending", cls: "bg-warn-soft text-warn-text border-warn-edge" },
        processing: { icon: Loader2, label: "Processing", cls: "bg-info-soft text-info-text border-info-edge" },
        completed: { icon: CheckCircle2, label: "Completed", cls: "bg-ok-soft text-ok-text border-ok-edge" },
        failed: { icon: XCircle, label: "Failed", cls: "bg-danger-soft text-danger-text border-danger-edge" },
        retry_wait: { icon: RotateCcw, label: "Retry Wait", cls: "bg-info-soft text-info-text border-info-edge" },
    };
    const { icon: Icon, label, cls } = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
            <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
            {label}
        </span>
    );
}

// ─── Source Badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
    const isStk = source === "stk";
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${isStk ? "bg-info-soft text-info-text border border-info-edge" : "bg-muted text-text-secondary border border-border"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
            <div
                className="av-panel shadow-2xl w-full max-w-lg animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                            <ListOrdered className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-sm leading-tight">Queue Item Detail</h3>
                            <p className="text-xs text-muted-foreground font-mono-custom">{item.id.slice(0, 8)}…</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <QueueStatusBadge status={item.status} />
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors">
                            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map(([label, val]) => (
                        <div key={label as string}>
                            <p className="av-label text-[10.5px] text-muted-foreground mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-foreground break-all">{val ?? "—"}</p>
                        </div>
                    ))}
                </div>

                {/* Error details */}
                {item.errorMessage && (
                    <div className="mx-6 mb-4 p-3 rounded-lg bg-danger-soft border border-danger-edge">
                        <p className="av-label text-[10.5px] text-danger-text mb-1">Error</p>
                        <p className="text-xs text-danger-text font-mono-custom break-all">{item.errorMessage}</p>
                        {item.errorDetails && (
                            <details className="mt-2">
                                <summary className="text-xs text-danger-text cursor-pointer hover:text-danger-text">Stack trace</summary>
                                <pre className="mt-1 text-xs text-danger-text whitespace-pre-wrap font-mono-custom max-h-32 overflow-y-auto">{item.errorDetails}</pre>
                            </details>
                        )}
                    </div>
                )}

                {/* Next retry */}
                {item.nextRetryAt && (
                    <div className="mx-6 mb-4 p-3 rounded-lg bg-info-soft border border-info-edge">
                        <p className="text-xs text-info-text">
                            <span className="font-semibold">Next retry:</span> {fmtDate(item.nextRetryAt)} ({timeAgo(item.nextRetryAt)})
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {canRetry && (
                            <button
                                onClick={() => onRetry(item.id)}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-info-soft text-info-text border border-info-edge rounded-lg hover:bg-info-soft transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className={`w-3 h-3 ${actionLoading === item.id ? "animate-spin" : ""}`} />
                                Retry
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => onCancel(item.id)}
                                disabled={actionLoading === item.id}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-danger-soft text-danger-text border border-danger-edge rounded-lg hover:bg-danger-soft transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" />
                                Cancel
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-accent text-text-secondary rounded-lg hover:bg-accent transition-colors"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onCancel}>
            <div className="av-panel shadow-2xl w-full max-w-sm animate-in p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${confirmColor === "red" ? "bg-danger-soft" : "bg-info-soft"} flex items-center justify-center`}>
                        {confirmColor === "red"
                            ? <Trash2 className="w-5 h-5 text-danger-text" />
                            : <RotateCcw className="w-5 h-5 text-info-text" />
                        }
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium bg-accent text-text-secondary rounded-lg hover:bg-accent transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${confirmColor === "red" ? "bg-danger hover:bg-danger" : "bg-info hover:bg-info"
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
        <div className="min-h-full">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Operations</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Payment Queue<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Auto-refresh Toggle */}
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-md shadow-sm text-xs font-medium transition-colors ${autoRefresh
                                ? "bg-ok-soft border-ok-edge text-ok-text"
                                : "bg-card border-border text-text-secondary hover:bg-muted"
                                }`}
                        >
                            <span className="relative flex h-2 w-2">
                                {autoRefresh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? "bg-ok" : "bg-border-strong"}`}></span>
                            </span>
                            {autoRefresh ? "Live" : "Paused"}
                        </button>
                        {/* Manual Refresh */}
                        <button
                            onClick={refreshAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-md shadow-sm text-xs font-medium text-text-secondary hover:bg-muted transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="av-label text-[10.5px] text-muted-foreground">Queue Status</span>
                        <span className="flex-1 h-px bg-accent" />
                        <span className="text-xs text-muted-foreground">Real-time</span>
                    </div>
                    {isLoadingStats ? (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="av-panel p-5 space-y-3">
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
                                sub="Awaiting processing"
                                icon={Clock}
                                color="amber"
                                delay={0}
                            />
                            <StatCard
                                label="Processing"
                                value={fmtNum(stats?.counts?.processing || 0)}
                                sub="Currently active"
                                icon={Loader2}
                                color="blue"
                                delay={60}
                            />
                            <StatCard
                                label="Completed Today"
                                value={fmtNum(stats?.totalToday || 0)}
                                sub={`Avg: ${fmtDuration(stats?.avgProcessingTimeMs)}`}
                                icon={CheckCircle2}
                                color="green"
                                delay={120}
                            />
                            <StatCard
                                label="Failed"
                                value={fmtNum(stats?.counts?.failed || 0)}
                                sub="Require attention"
                                icon={XCircle}
                                color="red"
                                delay={180}
                            />
                            <StatCard
                                label="Retry Wait"
                                value={fmtNum(stats?.counts?.retry_wait || 0)}
                                sub={stats?.oldestPending ? `Oldest: ${timeAgo(stats.oldestPending.createdAt)}` : "None pending"}
                                icon={RotateCcw}
                                color="violet"
                                delay={240}
                            />
                        </div>
                    )}
                </div>

                {/* ── Queue Table ── */}
                <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "300ms" }}>

                    {/* Section Header  */}
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                    <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Queue Items</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {fmtNum(pagination.total)} total · page {pagination.page} of {fmtNum(pagination.totalPages || 1)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search queue…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:ring-1 focus:ring-ring transition-all w-48"
                                    />
                                </div>
                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen
                                        ? "bg-signal-soft border-signal-edge text-accent-text"
                                        : "bg-card border-border text-text-secondary hover:bg-muted"
                                        }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-xs font-bold leading-none">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-end gap-3 animate-in">
                                {/* Status filter */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Status</label>
                                    <div className="relative">
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange({ status: e.target.value })}
                                            className="pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all appearance-none"
                                        >
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                            <option value="retry_wait">Retry Wait</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Meter search */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Meter Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 37000..."
                                        value={filters.billRefNumber}
                                        onChange={(e) => handleFilterChange({ billRefNumber: e.target.value })}
                                        className="px-3 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all w-36"
                                    />
                                </div>

                                {/* Date range */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                                            className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                                            className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Clear filters */}
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => handleFilterChange({ status: "", billRefNumber: "", startDate: "", endDate: "" })}
                                        className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
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
                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3">
                                <ListOrdered className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-text-secondary">No queue items found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        {["Transaction ID", "Meter", "Customer", "Amount", "Source", "Status", "Retries", "Created", "Actions"].map((h) => (
                                            <th key={h} className="av-th px-5 py-3 text-left">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((item: QueueItem) => {
                                        const canRetry = ["failed", "retry_wait"].includes(item.status);
                                        const canCancel = ["pending", "retry_wait"].includes(item.status);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`av-row group cursor-pointer`}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="font-mono-custom text-xs text-text-secondary bg-accent px-1.5 py-0.5 rounded">
                                                        {item.transId}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-xs text-text-secondary font-mono-custom">{item.billRefNumber}</span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {`${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-foreground">{fmt(item.transAmount)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <SourceBadge source={item.source} />
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <QueueStatusBadge status={item.status} />
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-text-secondary">{item.retryCount}/{item.maxRetries}</span>
                                                        {item.retryCount > 0 && (
                                                            <AlertTriangle className="w-3 h-3 text-warn-text" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                                                    {fmtDate(item.createdAt)}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent-text transition-all p-1 rounded"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        {canRetry && (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: "retry", id: item.id })}
                                                                disabled={actionLoading === item.id}
                                                                className="flex items-center gap-1 text-xs font-medium text-info-text hover:text-info-text transition-all p-1 rounded disabled:opacity-50"
                                                                title="Retry"
                                                            >
                                                                <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === item.id ? "animate-spin" : ""}`} />
                                                            </button>
                                                        )}
                                                        {canCancel && (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
                                                                disabled={actionLoading === item.id}
                                                                className="flex items-center gap-1 text-xs font-medium text-danger-text hover:text-danger-text transition-all p-1 rounded disabled:opacity-50"
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
                    <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            Showing{" "}
                            <span className="font-medium text-text-secondary">
                                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                            </span>
                            –
                            <span className="font-medium text-text-secondary">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>
                            {" "}of{" "}
                            <span className="font-medium text-text-secondary">{fmtNum(pagination.total)}</span> items
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-text-secondary border border-border bg-card hover:bg-muted"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {pagination.totalPages > 5 && (
                                <span className="text-xs text-muted-foreground px-1">…</span>
                            )}

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={!pagination.hasNextPage}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
