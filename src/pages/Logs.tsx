/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { StatTile as StatCard } from "@/components/ui/stat-tile";
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
    badge: "bg-danger-soft text-danger-text border-danger-edge",
    row:   "hover:bg-danger-soft/30",
    dot:   "bg-danger",
  },
  warn: {
    icon: AlertTriangle,
    label: "Warning",
    badge: "bg-warn-soft text-warn-text border-warn-edge",
    row:   "",
    dot:   "bg-warn",
  },
  info: {
    icon: Info,
    label: "Info",
    badge: "bg-info-soft text-info-text border-info-edge",
    row:   "",
    dot:   "bg-info",
  },
  debug: {
    icon: CheckCircle2,
    label: "Debug",
    badge: "bg-accent text-text-secondary border-border",
    row:   "hover:bg-muted",
    dot:   "bg-muted-foreground",
  },
};

const getLevel = (level: string) => LEVELS[level?.toLowerCase()] ?? LEVELS.info;

// ─── Stat card ────────────────────────────────────────────────────────────────

// ─── Level badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const cfg = getLevel(level);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${cfg.badge}`}>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="av-panel shadow-2xl w-full max-w-lg animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              log.level === "error" ? "bg-danger-soft" :
              log.level === "warn"  ? "bg-warn-soft" :
              log.level === "debug" ? "bg-accent" : "bg-info-soft"
            }`}>
              <Icon className={`w-4 h-4 ${
                log.level === "error" ? "text-danger-text" :
                log.level === "warn"  ? "text-warn-text" :
                log.level === "debug" ? "text-muted-foreground" : "text-info-text"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">Log Entry</h3>
              <p className="text-xs text-muted-foreground font-mono">{log.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge level={log.level || "info"} />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Message */}
          <div>
            <p className="av-label text-[10.5px] text-muted-foreground mb-1.5">Message</p>
            <p className="text-sm text-foreground leading-relaxed bg-muted rounded-lg px-4 py-3 border border-border">
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
                <p className="av-label text-[10.5px] text-muted-foreground mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                  <FieldIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium text-text-secondary">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Metadata / payload */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="av-label text-[10.5px] text-muted-foreground mb-1.5">Metadata</p>
              <pre className="text-xs font-mono text-text-secondary bg-muted text-foreground rounded-xl px-4 py-3 overflow-x-auto leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors"
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
    <div className="min-h-full">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between animate-in">
          <div>
            <p className="av-label text-[10.5px] text-accent-text mb-1">Admin</p>
            <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">System Logs<span className="text-signal">.</span></h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor system activity for debugging and auditing</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border bg-card rounded-lg hover:bg-muted disabled:opacity-50 transition-colors shadow-sm"
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
        <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "120ms" }}>

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                  <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Log Entries</h2>
                <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                  {fmtNum(filtered.length)}{filtered.length !== total ? " filtered" : " total"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search logs…"
                    className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-muted
                               focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                               transition-all placeholder:text-muted-foreground"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-text-secondary" />
                    </button>
                  )}
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    filtersOpen || activeFilters > 0
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
                {/* Level filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="av-label text-[10.5px] text-muted-foreground">Level</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <select
                      value={levelFilter}
                      onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                      className="pl-9 pr-7 py-2 text-sm border border-border rounded-lg bg-muted
                                 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                                 transition-all appearance-none"
                    >
                      <option value="all">All levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Service filter */}
                {services.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="av-label text-[10.5px] text-muted-foreground">Service</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <select
                        value={serviceFilter}
                        onChange={(e) => { setService(e.target.value); setPage(1); }}
                        className="pl-9 pr-7 py-2 text-sm border border-border rounded-lg bg-muted
                                   focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
                                   transition-all appearance-none"
                      >
                        <option value="all">All services</option>
                        {services.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Clear filters */}
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setSearch(""); setLevel("all"); setService("all"); setPage(1); }}
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
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <ScrollText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">No logs found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeFilters > 0 ? "Try adjusting your filters" : "No log entries available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Level", "Message", "Service", "Timestamp", ""].map((h) => (
                      <th
                        key={h}
                        className="av-th px-5 py-3 text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((log) => {
                    const cfg = getLevel(log.level);
                    return (
                      <tr
                        key={log.id}
                        className={`av-row ${cfg.row} transition-colors group`}
                      >
                        {/* Level */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <LevelBadge level={log.level} />
                        </td>

                        {/* Message */}
                        <td className="px-5 py-3.5 max-w-xs lg:max-w-sm xl:max-w-lg">
                          <p className="text-sm text-foreground truncate" title={log.message}>
                            {log.message}
                          </p>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {log.service ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-text-secondary text-xs font-mono-custom font-medium border border-border">
                              <Server className="w-3 h-3" />
                              {log.service}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {fmtDate(log.timestamp)}
                          </div>
                        </td>

                        {/* View action */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent-text
                                       opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
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
          <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-text-secondary">{fmtNum(((page - 1) * LIMIT) + 1)}</span>–
              <span className="font-medium text-text-secondary">{fmtNum(Math.min(page * LIMIT, filtered.length))}</span>
              {" "}of{" "}
              <span className="font-medium text-text-secondary">{fmtNum(filtered.length)}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
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
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${
                      page === p
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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