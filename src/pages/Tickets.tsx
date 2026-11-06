/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck

import { useEffect, useState } from "react";
import { StatTile as StatCard } from "@/components/ui/stat-tile";
import { getAllTickets, getTicketStats } from "@/../api/tickets.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { toast } from "sonner";
import {
    FileQuestion, CheckCircle2, Clock, AlertTriangle,
    XCircle, Search, X, RefreshCw, Eye, ChevronLeft,
    ChevronRight, Filter, ChevronDown, MessageSquare,
    User, Calendar, Tag, Zap, Loader2, Send,
    CircleDot, ArrowUpRight, Inbox
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-KE", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n ?? 0);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
    open: { icon: CircleDot, label: "Open", badge: "bg-info-soft text-info-text border-info-edge", dot: "bg-info" },
    in_progress: { icon: Clock, label: "In Progress", badge: "bg-warn-soft text-warn-text border-warn-edge", dot: "bg-warn" },
    resolved: { icon: CheckCircle2, label: "Resolved", badge: "bg-ok-soft text-ok-text border-ok-edge", dot: "bg-ok" },
    closed: { icon: XCircle, label: "Closed", badge: "bg-accent text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const PRIORITY = {
    low: { label: "Low", cls: "bg-accent text-text-secondary border-border" },
    medium: { label: "Medium", cls: "bg-info-soft text-info-text border-info-edge" },
    high: { label: "High", cls: "bg-warn-soft text-warn-text border-warn-edge" },
    urgent: { label: "Urgent", cls: "bg-danger-soft text-danger-text border-danger-edge" },
    critical: { label: "Critical", cls: "bg-danger-soft text-danger-text border-danger-edge" },
};

const getStatus = (s: string) => STATUS[s?.toLowerCase()] ?? STATUS.open;
const getPriority = (p: string) => PRIORITY[p?.toLowerCase()] ?? PRIORITY.medium;

// ─── Stat card ────────────────────────────────────────────────────────────────

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg = getStatus(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${cfg.badge}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
    const cfg = getPriority(priority);
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────
function TicketModal({ ticket, isOpen, onClose, onTicketUpdated, axiosInstance }: any) {
    const [replyBody, setReplyBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        if (ticket) setNewStatus(ticket.status);
    }, [ticket]);

    if (!isOpen || !ticket) return null;

    const handleSendReply = async () => {
        if (!replyBody.trim()) return;
        setIsSending(true);
        // Replace with real API call
        setTimeout(() => {
            toast.success("Reply sent");
            setReplyBody("");
            setIsSending(false);
            onTicketUpdated?.();
        }, 800);
    };

    const handleStatusChange = async (status: string) => {
        setNewStatus(status);
        // Replace with real API call
        toast.success(`Ticket marked as ${getStatus(status).label}`);
        onTicketUpdated?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
            <div
                className="av-panel shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileQuestion className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono text-xs text-muted-foreground mb-1">{ticket.id}</p>
                            <h3 className="font-semibold text-foreground text-sm leading-snug">{ticket.subject}</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <StatusBadge status={newStatus || ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0 ml-3"
                    >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* Customer + meta */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted border border-border">
                        {[
                            { icon: User, label: "Customer", value: ticket.customer?.name || "—" },
                            { icon: Tag, label: "Email", value: ticket.customer?.email || "—" },
                            { icon: Zap, label: "Phone", value: ticket.customer?.phone || "—" },
                            { icon: Calendar, label: "Opened", value: fmtDate(ticket.createdAt) },
                            { icon: Clock, label: "Updated", value: fmtDate(ticket.updatedAt) },
                        ].map(({ icon: FieldIcon, label, value }) => (
                            <div key={label}>
                                <p className="av-label text-[10.5px] text-muted-foreground mb-1">{label}</p>
                                <div className="flex items-center gap-1.5">
                                    <FieldIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    <p className="text-xs font-medium text-text-secondary truncate">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <p className="av-label text-[10.5px] text-muted-foreground mb-2">Description</p>
                        <p className="text-sm text-text-secondary leading-relaxed bg-muted rounded-xl px-4 py-3 border border-border">
                            {ticket.description || "No description provided."}
                        </p>
                    </div>

                    {/* Comments thread */}
                    {ticket.comments?.length > 0 && (
                        <div>
                            <p className="av-label text-[10.5px] text-muted-foreground mb-3">
                                Comments ({ticket.comments.length})
                            </p>
                            <div className="space-y-3">
                                {ticket.comments.map((comment: any, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-xs font-bold text-white">{comment.author?.[0] ?? "?"}</span>
                                        </div>
                                        <div className="flex-1 bg-muted rounded-xl px-4 py-3 border border-border">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-semibold text-text-secondary">{comment.author}</p>
                                                <p className="text-xs text-muted-foreground">{fmtDate(comment.createdAt)}</p>
                                            </div>
                                            <p className="text-sm text-text-secondary leading-relaxed">{comment.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status update */}
                    <div>
                        <p className="av-label text-[10.5px] text-muted-foreground mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const active = (newStatus || ticket.status) === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusChange(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                            ? cfg.badge + " shadow-sm"
                                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                                            }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reply box */}
                    <div>
                        <p className="av-label text-[10.5px] text-muted-foreground mb-2">Add Reply</p>
                        <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Write a reply to the customer…"
                            rows={3}
                            className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-muted
                         focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                         transition-all placeholder:text-muted-foreground resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/60 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSendReply}
                        disabled={!replyBody.trim() || isSending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary
                       rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm shadow-black/10"
                    >
                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isSending ? "Sending…" : "Send Reply"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Tickets Page ────────────────────────────────────────────────────────
export default function TicketsPage() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    const [tickets, setTickets] = useState<any[]>([]);
    const [ticketStats, setTicketStats] = useState<any>(null);
    const [pagination, setPagination] = useState<any>({ page: 1, limit: 10, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: "all", priority: "all", search: "", page: 1, limit: 10
    });

    const handleFilterChange = (key: string, value: any) =>
        setFilters((p) => ({ ...p, [key]: value, page: 1 }));

    async function fetchTickets() {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            // Only append filters that are not "all"
            if (filters.status !== "all") params.append("status", filters.status.toUpperCase());
            if (filters.priority !== "all") params.append("priority", filters.priority.toUpperCase());
            if (filters.search) params.append("search", filters.search);
            params.append("page", String(filters.page));
            params.append("limit", String(filters.limit));

            const response = await getAllTickets(axiosInstance, params.toString());

            if (response && response.data) {
                // Map API fields to UI expected structure
                const mapped = response.data.map((t: any) => ({
                    ...t,
                    subject: t.issueType?.replace(/_/g, ' ') || "No Subject",
                    customer: {
                        name: t.meterNumber || "Unknown Meter",
                        phone: t.phoneNumber,
                        email: t.email
                    },
                    status: t.status?.toLowerCase() === 'completed' ? 'resolved' : t.status?.toLowerCase()
                }));
                setTickets(mapped);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (err) {
            console.error("Error fetching tickets:", err);
            toast.error("Failed to fetch tickets");
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchStats() {
        try {
            setIsStatsLoading(true);
            const response = await getTicketStats(axiosInstance);
            // Handle both { success: true, data: { ... } } and { ...stats }
            setTicketStats(response?.data || response);
        } catch (err) {
            console.error("Error fetching stats:", err);
            // toast.error("Failed to fetch ticket statistics");
        } finally {
            setIsStatsLoading(false);
        }
    }

    useEffect(() => { fetchTickets(); fetchStats(); }, [filters]);

    const refreshData = () => { fetchTickets(); fetchStats(); };

    // Derived pagination
    const totalPages = pagination?.pages || 1;
    const totalItems = pagination?.total || 0;
    const paginated = tickets;

    const activeFilters =
        (filters.status !== "all" ? 1 : 0) +
        (filters.priority !== "all" ? 1 : 0) +
        (filters.search ? 1 : 0);

    const stats = {
        total: ticketStats?.total ?? totalItems,
        open: ticketStats?.open ?? tickets.filter(t => t.status === 'open').length,
        in_progress: ticketStats?.in_progress ?? tickets.filter(t => t.status === 'in_progress').length,
        resolved: ticketStats?.resolved ?? tickets.filter(t => t.status === 'resolved').length,
        urgent: ticketStats?.urgent ?? tickets.filter(t => t.priority?.toLowerCase() === 'urgent').length,
    };

    return (
        <div className="min-h-full">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Admin</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Support Tickets<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage and respond to customer support requests</p>
                    </div>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border bg-card rounded-lg hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in" style={{ animationDelay: "60ms" }}>
                    <StatCard label="Total" value={fmtNum(stats.total)} icon={FileQuestion} color="slate" sub="All tickets" />
                    <StatCard label="Open" value={fmtNum(stats.open)} icon={CircleDot} color="blue" sub="Awaiting action" />
                    <StatCard label="In Progress" value={fmtNum(stats.in_progress)} icon={Clock} color="amber" sub="Being handled" />
                    <StatCard label="Resolved" value={fmtNum(stats.resolved)} icon={CheckCircle2} color="emerald" sub="Completed" />
                    <StatCard label="Urgent" value={fmtNum(stats.urgent)} icon={AlertTriangle} color="rose" sub="Needs priority" />
                </div>

                {/* ── Table Card ── */}
                <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">Ticket Queue</h2>
                                <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                                    {fmtNum(totalItems)} total
                                </span>
                                {stats.urgent > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger-soft border border-danger-edge text-danger-text text-xs font-semibold">
                                        <AlertTriangle className="w-3 h-3" />
                                        {stats.urgent} urgent
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <div className="relative w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange("search", e.target.value)}
                                        placeholder="Search tickets…"
                                        className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-muted
                               focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                               transition-all placeholder:text-muted-foreground"
                                    />
                                    {filters.search && (
                                        <button onClick={() => handleFilterChange("search", "")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-text-secondary" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter toggle */}
                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen || activeFilters > 0
                                        ? "bg-signal-soft border-signal-edge text-accent-text"
                                        : "bg-card border-border text-text-secondary hover:bg-muted"
                                        }`}
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

                        {/* Expandable filters */}
                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-end gap-3 animate-in">
                                {/* Status */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Status</label>
                                    <div className="relative">
                                        <CircleDot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                            className="pl-9 pr-7 py-2 text-sm border border-border rounded-lg bg-muted
                                 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                                 transition-all appearance-none"
                                        >
                                            <option value="all">All statuses</option>
                                            {Object.entries(STATUS).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="av-label text-[10.5px] text-muted-foreground">Priority</label>
                                    <div className="relative">
                                        <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        <select
                                            value={filters.priority}
                                            onChange={(e) => handleFilterChange("priority", e.target.value)}
                                            className="pl-9 pr-7 py-2 text-sm border border-border rounded-lg bg-muted
                                 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                                 transition-all appearance-none"
                                        >
                                            <option value="all">All priorities</option>
                                            {Object.entries(PRIORITY).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {activeFilters > 0 && (
                                    <button
                                        onClick={() => { handleFilterChange("status", "all"); handleFilterChange("priority", "all"); handleFilterChange("search", ""); }}
                                        className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="skeleton h-5 w-20" />
                                    <div className="skeleton h-4 flex-1" />
                                    <div className="skeleton h-5 w-16" />
                                    <div className="skeleton h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-text-secondary">No tickets found</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {activeFilters > 0 ? "Try adjusting your filters" : "No support tickets yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        {["ID", "Subject", "Customer", "Priority", "Status", "Last Updated", ""].map((h) => (
                                            <th key={h} className="av-th px-5 py-3 text-left">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginated.map((ticket, idx) => (
                                        <tr
                                            key={ticket.id}
                                            className={`av-row group cursor-pointer`}
                                            onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                                        >
                                            {/* ID */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="font-mono text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border">
                                                    {ticket.id}
                                                </span>
                                            </td>

                                            {/* Subject */}
                                            <td className="px-5 py-3.5 max-w-xs lg:max-w-sm">
                                                <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                                                {ticket.comments?.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {ticket.comments.length} {ticket.comments.length === 1 ? "reply" : "replies"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold text-text-secondary">
                                                            {ticket.customer?.name?.[0] ?? "?"}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-text-secondary truncate max-w-[120px]">
                                                        {ticket.customer?.name ?? "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <PriorityBadge priority={ticket.priority} />
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <StatusBadge status={ticket.status} />
                                            </td>

                                            {/* Updated */}
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {fmtDate(ticket.updatedAt)}
                                            </td>

                                            {/* View */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-accent-text opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Open
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-text-secondary">{fmtNum(((filters.page - 1) * pagination.limit) + 1)}</span>–
                                <span className="font-medium text-text-secondary">{fmtNum(Math.min(filters.page * pagination.limit, totalItems))}</span>
                                {" "}of{" "}
                                <span className="font-medium text-text-secondary">{fmtNum(totalItems)}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Rows:</span>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                                    className="text-xs border border-border rounded-md px-1.5 py-1 bg-card text-text-secondary focus:outline-none"
                                >
                                    {[10, 20, 50].map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleFilterChange("page", Math.max(1, filters.page - 1))}
                                disabled={filters.page === 1}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Prev
                            </button>
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => handleFilterChange("page", p)}
                                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${filters.page === p
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-text-secondary border border-border bg-card hover:bg-muted"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">…</span>}
                            <button
                                onClick={() => handleFilterChange("page", Math.min(totalPages, filters.page + 1))}
                                disabled={filters.page >= totalPages || totalPages === 0}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Modal */}
            <TicketModal
                ticket={selectedTicket}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedTicket(null); }}
                onTicketUpdated={refreshData}
                axiosInstance={axiosInstance}
            />
        </div>
    );
}