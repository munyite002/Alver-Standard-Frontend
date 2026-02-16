/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { getAllLogs } from "@/../api/logs.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { toast } from "sonner";
import {
  ScrollText, AlertTriangle, Info, CheckCircle2, XCircle,
  Search, X, RefreshCw, Eye, ChevronLeft, ChevronRight,
  Clock, Tag, Hash, Server, ChevronDown, Filter,
  AlertCircle, Layers
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-KE", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

// ─── Log level config ─────────────────────────────────────────────────────────
const LEVELS: Record<string, {
  icon: React.ElementType;
  label: string;
  badge: string;
  row: string;
  dot: string;
}> = {
  error: {
    icon: XCircle,
    label: "Error",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    row:   "hover:bg-rose-50/30",
    dot:   "bg-rose-500",
  },
  warn: {
    icon: AlertTriangle,
    label: "Warning",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    row:   "hover:bg-amber-50/20",
    dot:   "bg-amber-400",
  },
  info: {
    icon: Info,
    label: "Info",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    row:   "hover:bg-blue-50/20",
    dot:   "bg-blue-400",
  },
  debug: {
    icon: CheckCircle2,
    label: "Debug",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    row:   "hover:bg-gray-50",
    dot:   "bg-gray-400",
  },
};

const getLevel = (level: string) => LEVELS[level?.toLowerCase()] ?? LEVELS.info;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sub
}: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  const colors: Record<string, string> = {
    rose:  "bg-rose-50 border-rose-100 text-rose-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    blue:  "bg-blue-50 border-blue-100 text-blue-700",
    slate: "bg-slate-50 border-slate-100 text-slate-700",
  };
  const icons: Record<string, string> = {
    rose:  "text-rose-500 bg-rose-100",
    amber: "text-amber-500 bg-amber-100",
    blue:  "text-blue-500 bg-blue-100",
    slate: "text-slate-500 bg-slate-100",
  };

  return (
    <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${colors[color]}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${icons[color]}`}>
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

// ─── Level badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const cfg = getLevel(level);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Log Detail Modal ─────────────────────────────────────────────────────────
function LogModal({ log, isOpen, onClose }: { log: any | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !log) return null;
  const cfg = getLevel(log.level || "info");
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              log.level === "error" ? "bg-rose-100" :
              log.level === "warn"  ? "bg-amber-100" :
              log.level === "debug" ? "bg-gray-100" : "bg-blue-100"
            }`}>
              <Icon className={`w-4 h-4 ${
                log.level === "error" ? "text-rose-600" :
                log.level === "warn"  ? "text-amber-600" :
                log.level === "debug" ? "text-gray-500" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">Log Entry</h3>
              <p className="text-xs text-gray-400 font-mono">{log.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge level={log.level || "info"} />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Message */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Message</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
              {log.message || (log as any).details}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Clock,  label: "Timestamp", value: fmtDate(log.timestamp || (log as any).createdAt) },
              { icon: Server, label: "Service",   value: log.service || (log as any).event || "—"      },
            ].map(({ icon: FieldIcon, label, value }) => (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                  <FieldIcon className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Metadata / payload */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Metadata</p>
              <pre className="text-xs font-mono text-gray-700 bg-gray-900 text-green-400 rounded-xl px-4 py-3 overflow-x-auto leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Logs Page ───────────────────────────────────────────────────────────
export default function LogsPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

  const [logs, setLogs]               = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [search, setSearch]       = useState("");
  const [levelFilter, setLevel]   = useState<string>("all");
  const [serviceFilter, setService] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const LIMIT = 8;

  async function fetchLogs() {
    try {
      setIsLoading(true);
      const response = await getAllLogs(axiosInstance);
      const rawLogs = response.data || [];
      
      // Map API fields (event, details, user, createdAt) to UI fields (level, message, service, timestamp)
      const mappedLogs = rawLogs.map((l: any) => {
        const event = l.event?.toLowerCase() || "";
        let level = "info";
        if (event.includes("error") || event.includes("fail")) level = "error";
        else if (event.includes("warn")) level = "warn";
        else if (event.includes("debug")) level = "debug";

        return {
          id: l.id,
          level,
          message: l.details || "No details",
          service: l.event || "System",
          timestamp: l.createdAt,
          metadata: {
            user: l.user,
            updatedAt: l.updatedAt,
            ...l.metadata
          }
        };
      });

      setLogs(mappedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  // Derived stats
  const errors   = logs?.filter((l) => l.level?.toLowerCase() === "error").length  ?? 0;
  const warnings = logs?.filter((l) => l.level?.toLowerCase() === "warn").length   ?? 0;
  const infos    = logs?.filter((l) => l.level?.toLowerCase() === "info").length    ?? 0;
  const total    = logs?.length ?? 0;

  // Unique services for filter
  const services = Array.from(new Set(logs?.map((l) => l.service).filter(Boolean) ?? [])) as string[];

  // Filtering
  const filtered = (logs ?? []).filter((log) => {
    const q = search.toLowerCase();
    const matchSearch = !q || log.message?.toLowerCase().includes(q) || log.service?.toLowerCase().includes(q) || log.id?.toLowerCase().includes(q);
    const matchLevel  = levelFilter   === "all" || log.level?.toLowerCase()  === levelFilter;
    const matchService = serviceFilter === "all" || log.service === serviceFilter;
    return matchSearch && matchLevel && matchService;
  });

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const activeFilters = (levelFilter !== "all" ? 1 : 0) + (serviceFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono-custom { font-family: 'DM Mono', monospace; }
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
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">System Logs</h1>
            <p className="text-sm text-gray-400 mt-0.5">Monitor system activity for debugging and auditing</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in" style={{ animationDelay: "60ms" }}>
          <StatCard label="Total Logs"  value={fmtNum(total)}    icon={ScrollText}     color="slate" sub="All levels" />
          <StatCard label="Errors"      value={fmtNum(errors)}   icon={XCircle}        color="rose"  sub="Needs attention" />
          <StatCard label="Warnings"    value={fmtNum(warnings)} icon={AlertTriangle}  color="amber" sub="Review recommended" />
          <StatCard label="Info"        value={fmtNum(infos)}    icon={Info}           color="blue"  sub="Informational" />
        </div>

        {/* ── Logs Table Card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <ScrollText className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Log Entries</h2>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                  {fmtNum(filtered.length)}{filtered.length !== total ? " filtered" : " total"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search logs…"
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                               transition-all placeholder:text-gray-400"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    filtersOpen || activeFilters > 0
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
                {/* Level filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Level</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={levelFilter}
                      onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                      className="pl-9 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                                 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                 transition-all appearance-none"
                    >
                      <option value="all">All levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Service filter */}
                {services.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Service</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <select
                        value={serviceFilter}
                        onChange={(e) => { setService(e.target.value); setPage(1); }}
                        className="pl-9 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                                   focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                   transition-all appearance-none"
                      >
                        <option value="all">All services</option>
                        {services.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Clear filters */}
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setSearch(""); setLevel("all"); setService("all"); setPage(1); }}
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
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton h-5 w-16" />
                  <div className="skeleton h-4 flex-1" />
                  <div className="skeleton h-4 w-20" />
                  <div className="skeleton h-4 w-28" />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ScrollText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No logs found</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeFilters > 0 ? "Try adjusting your filters" : "No log entries available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Level", "Message", "Service", "Timestamp", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((log, idx) => {
                    const cfg = getLevel(log.level);
                    return (
                      <tr
                        key={log.id}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} ${cfg.row} transition-colors group`}
                      >
                        {/* Level */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <LevelBadge level={log.level} />
                        </td>

                        {/* Message */}
                        <td className="px-5 py-3.5 max-w-xs lg:max-w-sm xl:max-w-lg">
                          <p className="text-sm text-gray-800 truncate" title={log.message}>
                            {log.message}
                          </p>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {log.service ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono-custom font-medium border border-slate-200">
                              <Server className="w-3 h-3" />
                              {log.service}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {fmtDate(log.timestamp)}
                          </div>
                        </td>

                        {/* View action */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}
                            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-blue-600
                                       opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
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
              <span className="font-medium text-gray-600">{fmtNum(((page - 1) * LIMIT) + 1)}</span>–
              <span className="font-medium text-gray-600">{fmtNum(Math.min(page * LIMIT, filtered.length))}</span>
              {" "}of{" "}
              <span className="font-medium text-gray-600">{fmtNum(filtered.length)}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
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
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${
                      page === p
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      <LogModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedLog(null); }}
      />
    </div>
  );
}