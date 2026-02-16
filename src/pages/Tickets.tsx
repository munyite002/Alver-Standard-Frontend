/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck

import { useEffect, useState } from "react";
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
    open: { icon: CircleDot, label: "Open", badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
    in_progress: { icon: Clock, label: "In Progress", badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
    resolved: { icon: CheckCircle2, label: "Resolved", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
    closed: { icon: XCircle, label: "Closed", badge: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

const PRIORITY = {
    low: { label: "Low", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    medium: { label: "Medium", cls: "bg-blue-50 text-blue-600 border-blue-100" },
    high: { label: "High", cls: "bg-amber-50 text-amber-700 border-amber-100" },
    urgent: { label: "Urgent", cls: "bg-rose-50 text-rose-700 border-rose-100" },
    critical: { label: "Critical", cls: "bg-rose-100 text-rose-800 border-rose-200" },
};

const getStatus = (s: string) => STATUS[s?.toLowerCase()] ?? STATUS.open;
const getPriority = (p: string) => PRIORITY[p?.toLowerCase()] ?? PRIORITY.medium;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: any) {
    const colors: any = {
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
        slate: "bg-slate-50 border-slate-100 text-slate-700",
        rose: "bg-rose-50 border-rose-100 text-rose-700",
    };
    const iconBg: any = {
        blue: "bg-blue-100 text-blue-500",
        amber: "bg-amber-100 text-amber-500",
        emerald: "bg-emerald-100 text-emerald-500",
        slate: "bg-slate-100 text-slate-500",
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

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg = getStatus(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
    const cfg = getPriority(priority);
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileQuestion className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono text-xs text-gray-400 mb-1">{ticket.id}</p>
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{ticket.subject}</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <StatusBadge status={newStatus || ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 ml-3"
                    >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* Customer + meta */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        {[
                            { icon: User, label: "Customer", value: ticket.customer?.name || "—" },
                            { icon: Tag, label: "Email", value: ticket.customer?.email || "—" },
                            { icon: Zap, label: "Phone", value: ticket.customer?.phone || "—" },
                            { icon: Calendar, label: "Opened", value: fmtDate(ticket.createdAt) },
                            { icon: Clock, label: "Updated", value: fmtDate(ticket.updatedAt) },
                        ].map(({ icon: FieldIcon, label, value }) => (
                            <div key={label}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                                <div className="flex items-center gap-1.5">
                                    <FieldIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            {ticket.description || "No description provided."}
                        </p>
                    </div>

                    {/* Comments thread */}
                    {ticket.comments?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Comments ({ticket.comments.length})
                            </p>
                            <div className="space-y-3">
                                {ticket.comments.map((comment: any, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-xs font-bold text-white">{comment.author?.[0] ?? "?"}</span>
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-semibold text-gray-700">{comment.author}</p>
                                                <p className="text-xs text-gray-400">{fmtDate(comment.createdAt)}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{comment.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status update */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
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
                                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
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
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Add Reply</p>
                        <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Write a reply to the customer…"
                            rows={3}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         transition-all placeholder:text-gray-400 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSendReply}
                        disabled={!replyBody.trim() || isSending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm shadow-blue-200"
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
        <div className="min-h-screen bg-gray-50/60 font-sans">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.3s ease both; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .skeleton {
          background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
        }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Admin</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Support Tickets</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Manage and respond to customer support requests</p>
                    </div>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900">Ticket Queue</h2>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                    {fmtNum(totalItems)} total
                                </span>
                                {stats.urgent > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                                        <AlertTriangle className="w-3 h-3" />
                                        {stats.urgent} urgent
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <div className="relative w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange("search", e.target.value)}
                                        placeholder="Search tickets…"
                                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                               transition-all placeholder:text-gray-400"
                                    />
                                    {filters.search && (
                                        <button onClick={() => handleFilterChange("search", "")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter toggle */}
                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen || activeFilters > 0
                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
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

                        {/* Expandable filters */}
                        {filtersOpen && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-end gap-3 animate-in">
                                {/* Status */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
                                    <div className="relative">
                                        <CircleDot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                            className="pl-9 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                                 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                 transition-all appearance-none"
                                        >
                                            <option value="all">All statuses</option>
                                            {Object.entries(STATUS).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Priority</label>
                                    <div className="relative">
                                        <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={filters.priority}
                                            onChange={(e) => handleFilterChange("priority", e.target.value)}
                                            className="pl-9 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                                 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                 transition-all appearance-none"
                                        >
                                            <option value="all">All priorities</option>
                                            {Object.entries(PRIORITY).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {activeFilters > 0 && (
                                    <button
                                        onClick={() => { handleFilterChange("status", "all"); handleFilterChange("priority", "all"); handleFilterChange("search", ""); }}
                                        className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">No tickets found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {activeFilters > 0 ? "Try adjusting your filters" : "No support tickets yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["ID", "Subject", "Customer", "Priority", "Status", "Last Updated", ""].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((ticket, idx) => (
                                        <tr
                                            key={ticket.id}
                                            className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/20 transition-colors group cursor-pointer`}
                                            onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                                        >
                                            {/* ID */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {ticket.id}
                                                </span>
                                            </td>

                                            {/* Subject */}
                                            <td className="px-5 py-3.5 max-w-xs lg:max-w-sm">
                                                <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                                                {ticket.comments?.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {ticket.comments.length} {ticket.comments.length === 1 ? "reply" : "replies"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {ticket.customer?.name?.[0] ?? "?"}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
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
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                {fmtDate(ticket.updatedAt)}
                                            </td>

                                            {/* View */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
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
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-gray-400">
                                Showing{" "}
                                <span className="font-medium text-gray-600">{fmtNum(((filters.page - 1) * pagination.limit) + 1)}</span>–
                                <span className="font-medium text-gray-600">{fmtNum(Math.min(filters.page * pagination.limit, totalItems))}</span>
                                {" "}of{" "}
                                <span className="font-medium text-gray-600">{fmtNum(totalItems)}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">Rows:</span>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                                    className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600 focus:outline-none"
                                >
                                    {[10, 20, 50].map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleFilterChange("page", Math.max(1, filters.page - 1))}
                                disabled={filters.page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && <span className="text-xs text-gray-400 px-1">…</span>}
                            <button
                                onClick={() => handleFilterChange("page", Math.min(totalPages, filters.page + 1))}
                                disabled={filters.page >= totalPages || totalPages === 0}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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