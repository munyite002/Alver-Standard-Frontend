/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { paymentTimeZone } from "@/lib/payment-time";
import {
    ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight,
    SlidersHorizontal, Receipt, MailCheck
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
    getDashboardMetrics,
    getAllTransactions
} from "@/../api/transactions.api";
import { resendSms } from "@/../api/users.api";
import type { Payment } from "@/lib/types";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

const fmtDate = (s: string | Date, transactionType?: string | null) => {
    if (!s) return "—";

    const date = new Date(s);
    if (isNaN(date.getTime())) return "—";

    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: paymentTimeZone(transactionType),
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const map: Record<string, string> = {};
    parts.forEach(p => {
        if (p.type !== "literal") map[p.type] = p.value;
    });

    return `${map.day} ${map.month}, ${map.hour}:${map.minute}`;
};

const getMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return {
        startDate: formatDate(start),
        endDate: formatDate(end),
    };
};

// ─── Change against last month ────────────────────────────────────────────────
function Delta({ change }: { change: any }) {
    if (change === undefined || change === null) return null;
    const isPositive = change >= 0;
    return (
        <span className={`av-num inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-ok-text" : "text-danger-text"}`}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {Math.abs(change)}%
            <span className="font-normal text-muted-foreground">vs last month</span>
        </span>
    );
}

// ─── A supporting figure in the metrics strip ─────────────────────────────────
function Metric({ label, value, change, loading }: { label: string; value: string; change?: any; loading: boolean }) {
    return (
        <div className="flex min-w-0 flex-col justify-between gap-3 p-5">
            <p className="av-label text-[10.5px] text-muted-foreground">{label}</p>
            {loading ? (
                <div className="space-y-2.5">
                    <div className="skeleton h-7 w-28" />
                    <div className="skeleton h-3.5 w-24" />
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="av-display av-num text-xl font-semibold sm:text-2xl tracking-[-0.02em] text-foreground">{value}</p>
                    <div className="min-h-4"><Delta change={change} /></div>
                </div>
            )}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
    const map: any = {
        completed: { label: "Completed", dot: "bg-ok", text: "text-ok-text" },
        pending: { label: "Pending", dot: "bg-warn", text: "text-warn-text" },
        failed: { label: "Failed", dot: "bg-danger", text: "text-danger-text" },
    };
    // Default to completed for real data unless status is specified
    const key = status || "completed";
    const { label, dot, text } = map[key] || map.completed;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
            {label}
        </span>
    );
}

// ─── Transaction Modal ────────────────────────────────────────────────────────
function TransactionModal({ tx, onClose }: { tx: Payment | null; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_STAGING_API);

    if (!tx) return null;

    // Some payments store a null token or the literal "N/A"; neither is something a customer can use.
    const hasToken = !!tx.token && tx.token !== "N/A";

    const fmt = (amount: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 2
        }).format(amount);
    };

    const fmtDate = (s: string | Date) => {
        if (!s) return "—";
        const date = new Date(s);
        if (isNaN(date.getTime())) return "—";

        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
            timeZone: paymentTimeZone(tx.transactionType),
        }).format(date);
    };

    const handleResendSms = async () => {
        if (!hasToken) return;
        try {
            setIsSubmitting(true);
            const data = {
                phone: tx.msisdn,
                token: tx.token
            };
            await resendSms(axiosInstance, data);
            toast.success("Successfully resent token SMS to user");
        } catch (err) {
            console.log("Error: ", err);
            toast.error("An error occurred, please try again later");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fields = [
        ["Meter Number", tx.billRefNumber, true],
        ["Customer", `${tx.firstName || ''} ${tx.lastName || ''}`.trim() || '—', false],
        ["Amount", fmt(tx.transAmount), true],
        ["Units", `${tx.units} kWh`, true],
        ["Date & Time", fmtDate(tx.transTime), true],
    ];

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md">
                <DialogHeader className="border-b border-border px-6 py-5 pr-12 text-left">
                    <DialogTitle className="av-display text-lg font-semibold tracking-[-0.01em]">Transaction detail</DialogTitle>
                    <DialogDescription className="font-mono text-xs break-all">{tx.transId}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    <div className="rounded-lg border border-border bg-muted p-4">
                        <p className="av-label text-[10.5px] text-muted-foreground">Token</p>
                        <p className="av-num mt-1.5 font-mono text-[15px] font-medium break-all text-foreground">{tx.token || 'N/A'}</p>
                        {!hasToken && <p className="mt-1.5 text-xs text-muted-foreground">No token is recorded for this payment, so there is nothing to resend.</p>}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {fields.map(([label, val, mono]: any) => (
                            <div key={label} className="min-w-0">
                                <dt className="av-label text-[10.5px] text-muted-foreground">{label}</dt>
                                <dd className={`mt-1 text-sm font-medium break-words text-foreground ${mono ? "av-num font-mono text-[13px]" : ""}`}>{val}</dd>
                            </div>
                        ))}
                        <div>
                            <dt className="av-label text-[10.5px] text-muted-foreground">Status</dt>
                            <dd className="mt-1"><StatusBadge status={(tx as any).status} /></dd>
                        </div>
                    </dl>
                </div>

                <DialogFooter className="flex-row justify-between gap-3 border-t border-border px-6 py-4 sm:justify-between">
                    <Button variant="outline" onClick={handleResendSms} disabled={isSubmitting || !hasToken}>
                        <MailCheck aria-hidden />
                        {isSubmitting ? "Sending..." : "Re-Send SMS"}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const FIELD = "av-focus h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/15";

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

    const hasDates = filters.startDate || filters.endDate;

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <Toaster richColors position="top-right" />

            {/* ── Page Header ── */}
            <header className="animate-in">
                <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">
                    Dashboard<span className="text-signal">.</span>
                </h1>
                <p className="mt-1 text-sm text-text-secondary">{today}</p>
            </header>

            {/* ── Key figures, month to date. Revenue leads: it is the number this page exists for. ── */}
            <section aria-label="Key metrics, month to date" className="av-panel animate-in grid overflow-hidden lg:grid-cols-[1.5fr_1fr_1fr_1fr]" style={{ animationDelay: "60ms" }}>
                <div className="relative flex flex-col justify-between gap-5 overflow-hidden border-b border-border p-6 lg:border-r lg:border-b-0">
                    <div className="av-hero-glow" aria-hidden />
                    <p className="av-label relative text-[10.5px] text-muted-foreground">Gross revenue, month to date</p>
                    {isLoadingMetrics ? (
                        <div className="relative space-y-3">
                            <div className="skeleton h-11 w-52" />
                            <div className="skeleton h-3.5 w-28" />
                        </div>
                    ) : (
                        <div className="relative space-y-2">
                            <p className="av-display av-num text-[clamp(32px,3.4vw,44px)] leading-none font-bold tracking-[-0.03em] text-foreground">
                                {fmt(metrics?.totalRevenue?.amount || 0)}
                            </p>
                            <Delta change={metrics?.totalRevenue?.percentageChange || 0} />
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 divide-border max-lg:divide-y sm:grid-cols-3 sm:divide-x lg:col-span-3 max-sm:[&>*:last-child]:col-span-2">
                    <Metric
                        label="Transactions"
                        value={fmtNum(metrics?.totalPayments?.count || 0)}
                        change={metrics?.totalPayments?.percentageChange || 0}
                        loading={isLoadingMetrics}
                    />
                    <Metric
                        label="Units dispensed"
                        value={`${fmtNum(Math.round(metrics?.totalUnits || 0))} kWh`}
                        loading={isLoadingMetrics}
                    />
                    <Metric
                        label="Average amount"
                        value={fmt(metrics?.averageAmount?.amount || 0)}
                        change={metrics?.averageAmount?.percentageChange}
                        loading={isLoadingMetrics}
                    />
                </div>
            </section>

            {/* ── Transactions ── */}
            <section aria-labelledby="transactions-heading" className="av-panel animate-in overflow-hidden" style={{ animationDelay: "120ms" }}>
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h2 id="transactions-heading" className="av-display text-base font-semibold tracking-[-0.01em] text-foreground">Recent transactions</h2>
                            <p className="av-num mt-0.5 text-xs text-muted-foreground">
                                {fmtNum(pagination.total)} total, page {pagination.page} of {fmtNum(pagination.totalPages || 1)}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            aria-expanded={filtersOpen}
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={filtersOpen ? "border-signal-edge text-accent-text" : ""}
                        >
                            <SlidersHorizontal aria-hidden />
                            Filters
                            {hasDates && <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-label="Date filter applied" />}
                        </Button>
                    </div>

                    {filtersOpen && (
                        <div className="animate-in mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="tx-start" className="av-label text-[10.5px] text-text-secondary">Start date</label>
                                <input id="tx-start" type="date" value={filters.startDate} onChange={(e) => handleFilterChange({ startDate: e.target.value })} className={FIELD} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="tx-end" className="av-label text-[10.5px] text-text-secondary">End date</label>
                                <input id="tx-end" type="date" value={filters.endDate} onChange={(e) => handleFilterChange({ endDate: e.target.value })} className={FIELD} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="tx-sort" className="av-label text-[10.5px] text-text-secondary">Sort</label>
                                <select
                                    id="tx-sort"
                                    value={filters.sort === "earliest" ? "oldest" : filters.sort === "highest" ? "amount_desc" : filters.sort === "lowest" ? "amount_asc" : "latest"}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className={FIELD}
                                >
                                    <option value="latest">Latest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="amount_desc">Amount: high to low</option>
                                    <option value="amount_asc">Amount: low to high</option>
                                </select>
                            </div>
                            {hasDates && (
                                <Button variant="ghost" onClick={() => handleFilterChange({ startDate: "", endDate: "" })}>
                                    Clear dates
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {isLoadingTransactions ? (
                    <div className="space-y-4 p-6" aria-label="Loading transactions">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="skeleton h-4 flex-1" style={{ animationDelay: `${i * 80}ms` }} />
                                <div className="skeleton h-4 w-24" style={{ animationDelay: `${i * 80 + 20}ms` }} />
                                <div className="skeleton h-4 w-20" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Receipt className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
                        <p className="text-sm font-medium text-foreground">
                            {searchQuery ? `No transactions match "${searchQuery}"` : "No transactions found"}
                        </p>
                        {searchQuery ? (
                            <Button variant="link" className="mt-1" onClick={() => setSearchQuery("")}>Clear search</Button>
                        ) : (
                            <p className="mt-1 text-xs text-muted-foreground">Try a wider date range in Filters.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {["Transaction ID", "Customer", "Meter", "Date & Time", "Units", "Amount", "Status"].map((h) => (
                                        <th key={h} scope="col" className={`av-th px-5 py-3 ${h === "Amount" || h === "Units" ? "text-right" : "text-left"}`}>
                                            {h}
                                        </th>
                                    ))}
                                    <th scope="col" className="av-th px-5 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((tx: Payment) => (
                                    <tr key={tx.id} className="av-row">
                                        <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-text-secondary">{tx.transId}</td>
                                        <td className="px-5 py-3.5 font-medium whitespace-nowrap text-foreground">{tx.firstName} {tx.lastName}</td>
                                        <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-text-secondary">{tx.billRefNumber}</td>
                                        <td className="av-num px-5 py-3.5 text-xs whitespace-nowrap text-muted-foreground">{fmtDate(tx.transTime, tx.transactionType)}</td>
                                        <td className="av-num px-5 py-3.5 text-right font-mono text-xs whitespace-nowrap text-text-secondary">{tx.units || 'N/A'}</td>
                                        <td className="av-num px-5 py-3.5 text-right font-semibold whitespace-nowrap text-foreground">{fmt(tx.transAmount)}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge /></td>
                                        <td className="px-5 py-2 text-right whitespace-nowrap">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedTx(tx)} aria-label={`View transaction ${tx.transId}`}>
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="av-num text-xs text-muted-foreground">
                        Showing <span className="font-medium text-text-secondary">{pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-text-secondary">{fmtNum(pagination.total)}</span> transactions
                    </p>
                    <nav aria-label="Pagination" className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={!pagination.hasPrevPage}>
                            <ChevronLeft aria-hidden />
                            Prev
                        </Button>

                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                            const p = i + 1;
                            return (
                                <Button
                                    key={p}
                                    variant={pagination.page === p ? "secondary" : "ghost"}
                                    size="icon"
                                    aria-current={pagination.page === p ? "page" : undefined}
                                    onClick={() => handlePageChange(p)}
                                    className="av-num size-8 text-xs"
                                >
                                    {p}
                                </Button>
                            );
                        })}
                        {pagination.totalPages > 5 && (
                            <span className="px-1 text-xs text-muted-foreground">…</span>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={!pagination.hasNextPage}>
                            Next
                            <ChevronRight aria-hidden />
                        </Button>
                    </nav>
                </div>
            </section>

            {selectedTx && (
                <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
            )}
        </div>
    );
}

export default DashboardPage;
