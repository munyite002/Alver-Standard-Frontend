/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";
import { StatTile as StatCard } from "@/components/ui/stat-tile";
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
        ? "bg-ok-soft text-ok-text border-ok-edge"
        : pending
            ? "bg-warn-soft text-warn-text border-warn-edge"
            : "bg-danger-soft text-danger-text border-danger-edge";
    const Icon = delivered ? CheckCircle2 : pending ? Clock : XCircle;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
            <Icon className="w-3 h-3" />
            {description}
        </span>
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
        <div className="min-h-full">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Admin</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">SMS Delivery Reports<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Track Advanta delivery callbacks and unmatched message IDs</p>
                    </div>
                    <button
                        onClick={() => { fetchReports(); fetchStats(); }}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border bg-card rounded-lg hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
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

                <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                    <Send className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">Delivery Report Feed</h2>
                                <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                                    {fmtNum(pagination.total)} total
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                                        placeholder="Search message ID"
                                        className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
                                    />
                                    {filters.search && (
                                        <button aria-label="Clear message ID search" onClick={() => handleFilterChange({ search: "" })} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-text-secondary" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen || activeFilters > 0 ? "bg-signal-soft border-signal-edge text-accent-text" : "bg-card border-border text-text-secondary hover:bg-muted"}`}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    Filters
                                    {activeFilters > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center leading-none">
                                            {activeFilters}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-end gap-3 animate-in">
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Status Description</label>
                                    <div className="relative">
                                        <select
                                            value={filters.description}
                                            onChange={(e) => handleFilterChange({ description: e.target.value })}
                                            className="pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all appearance-none"
                                        >
                                            <option value="all">All descriptions</option>
                                            {DESCRIPTIONS.map((description) => (
                                                <option key={description} value={description}>{description}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Sort By</label>
                                    <div className="relative">
                                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <select
                                            value={`${filters.sortBy}:${filters.sortOrder}`}
                                            onChange={(e) => {
                                                const [sortBy, sortOrder] = e.target.value.split(":");
                                                handleFilterChange({ sortBy, sortOrder });
                                            }}
                                            className="pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all appearance-none"
                                        >
                                            <option value="createdAt:desc">Newest created</option>
                                            <option value="createdAt:asc">Oldest created</option>
                                            <option value="timestamp:desc">Newest timestamp</option>
                                            <option value="timestamp:asc">Oldest timestamp</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {activeFilters > 0 && (
                                    <button
                                        onClick={() => handleFilterChange({ description: "all", search: "", sortBy: "createdAt", sortOrder: "desc" })}
                                        className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
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
                            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-text-secondary">No SMS delivery reports found</p>
                            <p className="text-xs text-muted-foreground mt-1">{activeFilters > 0 ? "Try adjusting your filters" : "Advanta callbacks will appear here"}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        {["Message ID", "Description", "Time Taken", "Timestamp", "Linked SMS / Recipient", "Created At"].map((heading) => (
                                            <th key={heading} className="av-th px-5 py-3 text-left">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reports.map((report) => (
                                        <tr key={report.id} className={`av-row`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="font-mono-custom text-xs text-text-secondary bg-accent px-1.5 py-0.5 rounded border border-border">
                                                    {report.messageId}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <StatusBadge description={report.description} />
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-text-secondary">
                                                {report.timeTaken}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {fmtDate(report.reportTimestamp)}
                                            </td>
                                            <td className="px-5 py-3.5 min-w-[220px]">
                                                {report.smsMessage ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-ok-soft border border-ok-edge flex items-center justify-center flex-shrink-0">
                                                            <Link2 className="w-3.5 h-3.5 text-ok-text" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{report.smsMessage.recipient}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{report.smsMessage.message}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-warn-text bg-warn-soft border border-warn-edge rounded-md px-2 py-0.5">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Unmatched message ID
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {fmtDate(report.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-text-secondary">{pagination.total === 0 ? 0 : fmtNum((pagination.page - 1) * pagination.limit + 1)}</span>
                            -<span className="font-medium text-text-secondary">{fmtNum(Math.min(pagination.page * pagination.limit, pagination.total))}</span>
                            {" "}of <span className="font-medium text-text-secondary">{fmtNum(pagination.total)}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                                disabled={!pagination.hasPrevPage}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Prev
                            </button>
                            <button
                                onClick={() => handleFilterChange({ page: pagination.page + 1 })}
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
        </div>
    );
}

export default SmsDeliveryReportsPage;
