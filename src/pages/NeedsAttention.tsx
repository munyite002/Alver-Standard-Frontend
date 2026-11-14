/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { getAttention, retryQueueItem, cancelQueueItem, confirmValidation } from "@/../api/queue.api";
import { resendSms } from "@/../api/users.api";
import { useEscape } from "@/lib/use-escape";

const kes = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" });
const fmtAmount = (n: unknown) => (n !== null && n !== undefined && n !== "" && Number.isFinite(Number(n)) ? kes.format(Number(n)) : "—");
const fmtDate = (s?: string | null) => {
    const d = s ? new Date(s) : null;
    return d && !isNaN(d.getTime())
        ? d.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        : "—";
};
const apiMessage = (e: any, fallback: string) => e?.response?.data?.error || e?.response?.data?.message || fallback;

const btn = "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnInfo = `${btn} bg-info-soft border-info-edge text-info-text hover:bg-info-soft/70`;
const btnWarn = `${btn} bg-warn-soft border-warn-edge text-warn-text hover:bg-warn-soft/70`;
const btnDanger = `${btn} bg-danger-soft border-danger-edge text-danger-text hover:bg-danger-soft/70`;

function CopyCode({ code }: { code?: string | null }) {
    const [done, setDone] = useState(false);
    if (!code) return <span>—</span>;
    return (
        <button
            className="inline-flex items-center gap-1 font-mono-custom text-xs text-text-secondary bg-accent px-1.5 py-0.5 rounded hover:text-foreground"
            title="Copy M-Pesa code"
            aria-label={`Copy M-Pesa code ${code}`}
            onClick={() => navigator.clipboard.writeText(code).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
        >
            {code}
            {done ? <Check className="w-3 h-3 text-ok-text" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>
    );
}

type Action = { title: string; message: string; check?: string; label: string; tone: "info" | "warn" | "danger"; run: () => Promise<any>; ok: string; reload?: boolean };

// The checkbox makes the person say they looked, so a click alone can't buy a token for money that never arrived.
function ActionDialog({ action, busy, onConfirm, onCancel }: { action: Action; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
    const [checked, setChecked] = useState(!action.check);
    useEscape(onCancel);
    const tone = { info: "bg-info hover:bg-info", warn: "bg-warn hover:bg-warn", danger: "bg-danger hover:bg-danger" }[action.tone];
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onCancel}>
            <div role="dialog" aria-modal="true" aria-labelledby="attention-dialog-title" className="av-panel shadow-2xl w-full max-w-md animate-in p-6" onClick={(e) => e.stopPropagation()}>
                <h3 id="attention-dialog-title" className="font-semibold text-foreground text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{action.message}</p>
                {action.check && (
                    <label className="mt-4 flex items-start gap-2.5 text-xs text-foreground cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                        <span>{action.check}</span>
                    </label>
                )}
                <div className="flex items-center gap-2 justify-end mt-5">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium bg-accent text-text-secondary rounded-lg">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={!checked || busy}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${tone}`}
                    >
                        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {action.label}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ title, hint, rows, extraHeader, renderActions, delay }: {
    title: string; hint: string; rows: any[]; extraHeader?: string; renderActions?: (r: any) => React.ReactNode; delay: number;
}) {
    return (
        <section className="av-panel overflow-hidden animate-in" style={{ animationDelay: `${delay}ms` }}>
            <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                    {title} <span className="text-muted-foreground font-normal">({rows.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            </div>
            {rows.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">Nothing here</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                {["M-Pesa code", "Meter", "Amount", "Date", ...(extraHeader ? [extraHeader] : [])].map((h) => (
                                    <th key={h} className="av-th px-5 py-3 text-left">{h}</th>
                                ))}
                                {renderActions && <th className="av-th sticky right-0 bg-card px-5 py-3 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((r, i) => (
                                <tr key={r?.id ?? r?.transId ?? i} className="av-row align-top">
                                    <td className="px-5 py-3 whitespace-nowrap"><CopyCode code={r?.transId} /></td>
                                    <td className="px-5 py-3 whitespace-nowrap text-xs text-text-secondary font-mono-custom">{r?.billRefNumber || "—"}</td>
                                    <td className="px-5 py-3 whitespace-nowrap font-semibold text-foreground">{fmtAmount(r?.transAmount)}</td>
                                    <td className="px-5 py-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r?.createdAt)}</td>
                                    {extraHeader && (
                                        <td className="px-5 py-3 text-xs text-text-secondary break-words max-w-xs">
                                            {[r?.status ?? r?.paymentStatus, r?.errorMessage].filter(Boolean).join(": ") || "—"}
                                        </td>
                                    )}
                                    {renderActions && <td className="sticky right-0 bg-card px-5 py-3 text-right whitespace-nowrap">{renderActions(r)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export function NeedsAttentionPage() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);
    const [days, setDays] = useState(30);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [action, setAction] = useState<Action | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAttention(axiosInstance, days);
            if (!res?.data || typeof res.data !== "object") throw new Error("Unexpected response");
            setData(res.data);
        } catch (e: any) {
            setData(null);
            setError(apiMessage(e, "Could not load payments needing attention."));
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { load(); }, [load]);

    const confirmAction = async () => {
        if (!action) return;
        setBusy(true);
        try {
            await action.run();
            toast.success(action.ok);
            setAction(null);
            if (action.reload !== false) load();
        } catch (e: any) {
            toast.error(apiMessage(e, "Action failed"));
        } finally {
            setBusy(false);
        }
    };

    const confirm = (r: any) => setAction({
        title: `Confirm ${r.transId}?`,
        message: "Safaricom checked this payment with us but never sent the confirmation. Confirming queues a token for the validated amount and texts it to the customer, the same as a normal payment.",
        check: `I found ${r.transId} for ${fmtAmount(r.transAmount)} in the M-Pesa portal, and it completed.`,
        label: "Confirm and buy token", tone: "info", ok: "Confirmed. The token is being bought.",
        run: () => confirmValidation(axiosInstance, r.transId),
    });
    const retry = (r: any, held: boolean) => setAction({
        title: `Retry ${r.transId}?`,
        message: held
            ? "We couldn't tell whether a token was bought. Retrying buys another one, so check the token server first."
            : "This queues the token purchase again.",
        check: held ? "I checked the M-Pesa portal and the token server, and no token was bought." : undefined,
        label: "Retry", tone: "warn", ok: "Retry queued",
        run: () => retryQueueItem(axiosInstance, r.id, held),
    });
    const cancel = (r: any) => setAction({
        title: `Cancel ${r.transId}?`, message: "It won't be retried.", label: "Cancel payment", tone: "danger", ok: "Cancelled",
        run: () => cancelQueueItem(axiosInstance, r.id),
    });
    const resend = (r: any) => setAction({
        title: `Resend the token for ${r.transId}?`, message: "Texts the token already bought to the customer again.", label: "Resend", tone: "info",
        ok: "Token SMS resent", reload: false,
        run: () => resendSms(axiosInstance, { phone: r.msisdn, token: r.token }),
    });

    const list = (k: string): any[] => (Array.isArray(data?.[k]) ? data[k] : []);
    const total = ["held", "failed", "paidNoToken", "problemPayments", "unconfirmed"].reduce((n, k) => n + list(k).length, 0);

    return (
        <div className="min-h-full">
            <Toaster position="top-right" richColors />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3 animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Operations</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Needs Attention<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Payments a person has to check or finish</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            aria-label="Period"
                            className="text-xs font-medium border border-border rounded-md px-3 py-1.5 bg-card text-text-secondary"
                        >
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={365}>Last 365 days</option>
                        </select>
                        <button
                            onClick={load}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-md shadow-sm text-xs font-medium text-text-secondary hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => <div key={i} className="av-panel h-28 animate-pulse" />)}
                    </div>
                )}
                {!loading && error && (
                    <div role="alert" className="rounded-lg border border-danger-edge bg-danger-soft text-danger-text text-sm px-4 py-3">
                        {error} <button className="underline ml-2" onClick={load}>Try again</button>
                    </div>
                )}
                {!loading && !error && data && total === 0 && (
                    <div className="av-panel px-6 py-10 text-center animate-in">
                        <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-text-secondary">Nothing needs attention</p>
                        <p className="text-xs text-muted-foreground mt-1">Held, failed and unconfirmed payments show up here.</p>
                    </div>
                )}
                {!loading && !error && data && total > 0 && (
                    <>
                        <Section
                            delay={0}
                            title="Validated, no confirmation"
                            hint="Safaricom checked these with us but never confirmed them. Find the code in the M-Pesa portal: if it completed, confirm it here to buy the token."
                            rows={list("unconfirmed")}
                            renderActions={(r) => <button className={btnInfo} onClick={() => confirm(r)}>Confirm</button>}
                        />
                        <Section
                            delay={60}
                            title="Held"
                            hint="We couldn't confirm a token was bought. Check the token server, then Retry or Cancel."
                            rows={list("held")}
                            extraHeader="Error"
                            renderActions={(r) => (
                                <div className="flex gap-2 justify-end">
                                    {r?.token
                                        ? <button className={btnInfo} onClick={() => resend(r)}>Resend</button>
                                        : <button className={btnWarn} onClick={() => retry(r, true)}>Retry</button>}
                                    <button className={btnDanger} onClick={() => cancel(r)}>Cancel</button>
                                </div>
                            )}
                        />
                        <Section
                            delay={120}
                            title="Failed"
                            hint="The token purchase failed. Retry once the cause is fixed."
                            rows={list("failed")}
                            extraHeader="Error"
                            renderActions={(r) => <button className={btnWarn} onClick={() => retry(r, false)}>Retry</button>}
                        />
                        <Section
                            delay={180}
                            title="Paid, no token"
                            hint="Check the token server, then issue a token by hand."
                            rows={list("paidNoToken")}
                            extraHeader="Status"
                        />
                        <Section
                            delay={240}
                            title="Other problem payments"
                            hint="For information only."
                            rows={list("problemPayments")}
                            extraHeader="Status"
                        />
                    </>
                )}
            </div>
            {action && <ActionDialog action={action} busy={busy} onConfirm={confirmAction} onCancel={() => !busy && setAction(null)} />}
        </div>
    );
}

export default NeedsAttentionPage;
