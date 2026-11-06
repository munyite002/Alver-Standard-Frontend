/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useEscape } from "@/lib/use-escape";
import { useOutletContext } from "react-router-dom";
import {
  Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
  Pencil, Trash2, Eye, X, Zap, MapPin, Building2,
  AlertCircle, CheckCircle2, Gauge, ArrowUpDown,
  ChevronDown, Loader2, CreditCard, ShieldAlert,
  Copy, Check, Calendar, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
  getAllMeters,
  createMeter,
  updateMeter,
  deleteMeterApi,
  generateMeterCredit,
  generateTamperCode
} from "../api/meters.api";
import type { Meter } from "../api/meters.api";
import { getAccounts } from "../../api/accounts.api";
import type { Account } from "../../api/accounts.api";
import { getTariffs } from "../../api/tariffs.api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

const getMonthDates = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
};

const EMPTY_FORM = { meterNumber: "", location: "", openingDeficit: 0, make: "", tariffId: "", email: "", SGC: "", TI: "", KRN: "", accountId: "" };

// ─── Reusable: Form Field ─────────────────────────────────────────────────────
function Field({ label, required, children, hint }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="av-label text-[10.5px] text-muted-foreground">
        {label}{required && <span className="text-danger-text ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = "", type = "text", required, ...rest }: any) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
      {...rest}
    />
  );
}

function SelectInput({ value, onChange, children }: any) {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={onChange}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all appearance-none pr-8"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Meter Form Dialog ────────────────────────────────────────────────────────
function MeterFormDialog({ open, onClose, editing, tariffs, accounts, onSubmit, isSaving }: any) {
  useEscape(onClose, open);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (editing) {
      setForm({
        meterNumber: editing.meterNumber || "",
        location: editing.location || "",
        openingDeficit: editing.openingDeficit || 0,
        make: editing.make || "",
        tariffId: editing.tariffId || "",
        email: editing.email || "",
        SGC: editing.SGC || "",
        TI: editing.TI || "",
        KRN: editing.KRN || "",
        accountId: editing.accountId || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="av-panel shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Gauge className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">
                {editing ? "Edit Meter" : "Add New Meter"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {editing ? `Editing ${editing.meterNumber}` : "Fill in the details below"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="meter-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">

            {/* Core Details */}
            <div>
              <p className="av-label text-[10.5px] text-muted-foreground mb-3">Core Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Meter Number" required>
                  <TextInput value={form.meterNumber} onChange={(e: any) => set("meterNumber", e.target.value)} placeholder="e.g. KPL-001-A" required />
                </Field>
                <Field label="Opening Deficit (KES)" required>
                  <TextInput type="number" value={form.openingDeficit} onChange={(e: any) => set("openingDeficit", parseFloat(e.target.value))} placeholder="0" required />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Location" required>
                  <TextInput value={form.location} onChange={(e: any) => set("location", e.target.value)} placeholder="e.g. Westlands, Block A" required />
                </Field>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Assignment */}
            <div>
              <p className="av-label text-[10.5px] text-muted-foreground mb-3">Assignment</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tariff">
                  <SelectInput value={form.tariffId} onChange={(e: any) => set("tariffId", e.target.value)}>
                    <option value="">No tariff</option>
                    {tariffs.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Account">
                  <SelectInput value={form.accountId} onChange={(e: any) => set("accountId", e.target.value)}>
                    <option value="">No account</option>
                    {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </SelectInput>
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Email" hint="Optional — for token delivery notifications">
                  <TextInput type="text" value={form.email} onChange={(e: any) => set("email", e.target.value)} placeholder="user@example.com" />
                </Field>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Hardware */}
            <div>
              <p className="av-label text-[10.5px] text-muted-foreground mb-3">Hardware</p>
              <Field label="Meter Make" required>
                <SelectInput value={form.make} onChange={(e: any) => set("make", e.target.value)}>
                  <option value="">Select make…</option>
                  <option value="STRON">STRON</option>
                  <option value="HES">HES</option>
                </SelectInput>
              </Field>

              {form.make === "HES" && (
                <div className="mt-4 p-4 rounded-xl bg-muted border border-border space-y-3">
                  <p className="av-label text-[10.5px] text-text-secondary flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    HES Configuration
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="SGC">
                      <TextInput value={form.SGC} onChange={(e: any) => set("SGC", e.target.value)} placeholder="123456" />
                    </Field>
                    <Field label="TI">
                      <TextInput value={form.TI} onChange={(e: any) => set("TI", e.target.value)} placeholder="78" />
                    </Field>
                    <Field label="KRN">
                      <TextInput value={form.KRN} onChange={(e: any) => set("KRN", e.target.value)} placeholder="2" />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 flex-shrink-0 bg-muted/60">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            form="meter-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/10"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? "Saving…" : editing ? "Save Changes" : "Create Meter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Token Display ────────────────────────────────────────────────────────────
function TokenDisplay({ label, code, color = "gray" }: any) {
  const [copied, setCopied] = useState(false);
  const colors: any = {
    blue: "bg-accent border-border text-foreground",
    green: "bg-ok-soft border-ok-edge text-ok-text",
    gray: "bg-accent border-border text-foreground",
  };
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="av-label text-[10.5px] opacity-60">{label}</p>
        <button onClick={copy} className="flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono-custom text-lg font-semibold tracking-[0.15em] break-all">{code}</p>
    </div>
  );
}

// ─── Meter Actions Dialog ─────────────────────────────────────────────────────
function MeterActionsDialog({ open, onClose, meter, axiosInstance }: any) {
  useEscape(onClose, open);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [tamperCode, setTamperCode] = useState<string | null>(null);
  const [creditCode, setCreditCode] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => {
    if (!open) {
      setTamperCode(null);
      setCreditCode(null);
      setCreditAmount("");
    }
  }, [open]);

  if (!open || !meter) return null;

  const handleTamper = async () => {
    setTamperLoading(true);
    setTamperCode(null);
    try {
      const response = await generateTamperCode(axiosInstance, {
        meterNumber: meter.meterNumber
      });
      if (response && response.token) {
        setTamperCode(response.token === "N/A" ? response.rawResponse : response.token);
        toast.success("Clear tamper code generated successfully");
      } else {
        toast.error("Failed to generate clear tamper code");
      }
    } catch (err) {
      console.error("Failed To Generate Clear Tamper Code:", err);
      toast.error("Failed to generate clear tamper code");
    } finally {
      setTamperLoading(false);
    }
  };

  const handleCredit = async (e: any) => {
    e.preventDefault();
    setCreditLoading(true);
    setCreditCode(null);
    try {
      const response = await generateMeterCredit(axiosInstance, {
        meterId: meter.id,
        meterNumber: meter.meterNumber,
        amount: Number(creditAmount),
      });
      if (response && response.token) {
        setCreditCode(response.token);
        toast.success("Credit generated successfully");
      } else {
        toast.error("Failed to generate credit code");
      }
    } catch (err) {
      console.error("Error generating credit:", err);
      toast.error("Failed to generate credit code");
    } finally {
      setCreditLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="av-panel shadow-2xl w-full max-w-md animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Gauge className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">Meter Actions</h3>
              <p className="font-mono-custom text-xs text-muted-foreground">{meter.meterNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Meter Info Strip */}
        <div className="px-6 py-4 bg-muted border-b border-border">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wide mb-1">Location</p>
              <p className="text-text-secondary font-medium">{meter.location}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wide mb-1">Make</p>
              <p className="text-text-secondary font-medium">{meter.make || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-semibold uppercase tracking-wide mb-1">Deficit</p>
              <p className={`font-semibold ${meter.openingDeficit > 0 ? "text-danger-text" : "text-ok-text"}`}>
                {meter.openingDeficit > 0 ? fmt(meter.openingDeficit) : "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Body */}
        <div className="p-6 space-y-5">

          {/* Clear Tamper */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warn-text" />
                <p className="text-sm font-semibold text-foreground">Clear Tamper</p>
              </div>
              <button
                onClick={handleTamper}
                disabled={tamperLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-warn-soft text-warn-text border border-warn-edge rounded-lg hover:bg-warn-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tamperLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                {tamperLoading ? "Generating…" : "Generate Code"}
              </button>
            </div>
            {tamperCode && <TokenDisplay label="Tamper Clear Code" code={tamperCode} color="gray" />}
          </div>

          <div className="border-t border-border" />

          {/* Generate Credit */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-accent-text" />
              <p className="text-sm font-semibold text-foreground">Generate Credit</p>
            </div>
            <form onSubmit={handleCredit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">KES</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full pl-11 pr-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={creditLoading || !creditAmount}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-black/10 whitespace-nowrap"
              >
                {creditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                {creditLoading ? "Generating…" : "Generate"}
              </button>
            </form>
            {creditCode && (
              <div className="mt-3">
                <TokenDisplay label="Credit Token" code={creditCode} color="green" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/60">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteDialog({ meter, onConfirm, onClose }: any) {
  useEscape(onClose, !!meter);
  if (!meter) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
      <div className="av-panel shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-danger-soft flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-danger-text" />
          </div>
          <h3 className="text-base font-semibold text-foreground text-center mb-1">Delete meter?</h3>
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-mono-custom font-medium text-text-secondary">{meter.meterNumber}</span> will be permanently removed. This action cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-accent hover:bg-accent rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(meter.id)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-danger rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
interface RowMenuProps {
  meter: Meter;
  onEdit: (meter: Meter) => void;
  onView: (meter: Meter) => void;
  onDelete: (meter: Meter) => void;
}

function RowMenu({ meter, onEdit, onView, onDelete }: RowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-accent-text hover:bg-signal-soft transition-all focus:outline-none">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5">
        <DropdownMenuItem
          onClick={() => onEdit(meter)}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary cursor-pointer rounded-md"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
          Edit Meter
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onView(meter)}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary cursor-pointer rounded-md"
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
          View Actions
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={() => onDelete(meter)}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-danger-text focus:text-danger-text focus:bg-danger-soft cursor-pointer rounded-md"
        >
          <Trash2 className="w-4 h-4" />
          Delete Meter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MetersPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  // State
  const [metersData, setMetersData] = useState<any>({
    meters: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false }
  });
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    meterNumber: '',
    sortField: "createdAt",
    sortOrder: "desc",
    ...getMonthDates()
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useOutletContext<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [actionsMeter, setActionsMeter] = useState<Meter | null>(null);
  const [deleteMeter, setDeleteMeter] = useState<Meter | null>(null);

  // Fetching
  const fetchMeters = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMeters(axiosInstance, filters);
      setMetersData({
        meters: data.meters || [],
        pagination: data.pagination || metersData.pagination
      });
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Failed to fetch meters');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTariffs = async () => {
    try {
      const response = await getTariffs(axiosInstance);
      setTariffs(response.data);
    } catch (err) {
      console.error("Error fetching tariffs:", err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await getAccounts(axiosInstance);
      setAccounts(response.data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [filters]);

  useEffect(() => {
    fetchTariffs();
    fetchAccounts();
  }, []);

  const handleSort = (field: string) => {
    const isAsc = filters.sortField === field && filters.sortOrder === 'asc';
    setFilters((prev: any) => ({
      ...prev,
      meterNumber: '',
      sortField: field,
      sortOrder: isAsc ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > metersData.pagination.totalPages) return;
    setFilters((prev: any) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev: any) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleMeterNumberChange = (newMeterNumber: string) => {
    setSearchQuery(newMeterNumber);
    setFilters((prev: any) => ({ ...prev, meterNumber: newMeterNumber, page: 1 }));
  };


  const handleSubmit = async (form: any) => {
    setIsSaving(true);
    try {
      if (editingMeter) {
        await updateMeter(axiosInstance, editingMeter.id, form);
        toast.success('Meter updated successfully');
      } else {
        await createMeter(axiosInstance, form);
        toast.success('Meter created successfully');
      }
      setFormOpen(false);
      setEditingMeter(null);
      fetchMeters();
    } catch (error: any) {
      console.error('Error saving meter:', error);
      toast.error(`Error saving meter: ${error?.response?.data?.error || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteMeterApi(axiosInstance, id);
      toast.success("Meter deleted successfully");
      setDeleteMeter(null);
      fetchMeters();
    } catch (error) {
      console.error('Error deleting meter:', error);
      toast.error("Failed to delete meter");
    }
  };

  // Derived
  const filteredMeters = metersData.meters.filter((m: Meter) => {
    const q = searchQuery.toLowerCase();
    return !q || m.meterNumber.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
  });

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    return filters.sortOrder === "asc"
      ? <ChevronDown className="w-3 h-3 text-accent-text rotate-180" />
      : <ChevronDown className="w-3 h-3 text-accent-text" />;
  };

  return (
    <div className="min-h-full">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between animate-in">
          <div>
            <p className="av-label text-[10.5px] text-accent-text mb-1">Infrastructure</p>
            <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Meters<span className="text-signal">.</span></h1>
            <p className="text-sm text-muted-foreground mt-0.5">{fmtNum(metersData.pagination.total)} total meters registered</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditingMeter(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm shadow-black/10"
            >
              <Plus className="w-4 h-4" />
              Add Meter
            </button>
          )}
        </div>

        {/* ── Table Card ── */}
        <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Meter Registry</h2>
              <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                {fmtNum(filteredMeters.length)} {filteredMeters.length !== metersData.meters.length ? "filtered" : "total"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleMeterNumberChange(e.target.value)}
                  placeholder="Search meter or location…"
                  className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-text-secondary" />
                  </button>
                )}
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
                {(filters.startDate || filters.endDate) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
              <button
                onClick={fetchMeters}
                className="p-2 text-muted-foreground hover:text-accent-text hover:bg-signal-soft rounded-lg transition-colors border border-border"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {filtersOpen && (
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-wrap items-end gap-4 animate-in">
              <div className="flex flex-col gap-1.5">
                <label className="av-label text-[10.5px] text-muted-foreground">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, startDate: e.target.value, page: 1 }))}
                    className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
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
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, endDate: e.target.value, page: 1 }))}
                    className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all"
                  />
                </div>
              </div>
              {(filters.startDate || filters.endDate) && (
                <button
                  onClick={() => setFilters((prev: any) => ({ ...prev, startDate: "", endDate: "", page: 1 }))}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-text-secondary border border-border rounded-lg hover:bg-card transition-colors h-[38px]"
                >
                  Clear dates
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton h-4 w-32" /><div className="skeleton h-4 flex-1" /><div className="skeleton h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredMeters.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">No meters found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Add your first meter to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { label: "Meter", field: "meterNumber", sortable: true },
                      { label: "Location", field: "location", sortable: true },
                      { label: "Account", field: null, sortable: false },
                      { label: "Deficit", field: "openingDeficit", sortable: true },
                      { label: "Total Revenue", field: "totalAmount", sortable: true },
                      { label: "Total Units", field: "totalUnits", sortable: true },
                    ].map(({ label, field, sortable }) => (
                      <th
                        key={label}
                        onClick={() => sortable && field && handleSort(field)}
                        className={`av-label text-[10.5px] px-4 py-3 text-left text-muted-foreground whitespace-nowrap
                          ${sortable ? "cursor-pointer hover:text-text-secondary select-none" : ""}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {label}
                          {sortable && field && <SortIcon field={field} />}
                        </div>
                      </th>
                    ))}
                    {isAdmin && <th className="av-th sticky right-0 bg-card px-4 py-3 text-right" >
                      Actions
                    </th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMeters.map((meter: Meter) => {
                    const account = accounts.find((a: Account) => a.id === meter.accountId);
                    return (
                      <tr
                        key={meter.id}
                        className={`av-row group`}
                      >
                        {/* Meter Number */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono-custom text-xs font-medium text-foreground bg-accent px-2 py-0.5 rounded">
                              {meter.meterNumber}
                            </span>
                            {meter.make && (
                              <span className="text-xs text-muted-foreground font-medium">{meter.make}</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-text-secondary">
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{meter.location}</span>
                          </div>
                        </td>

                        {/* Account */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {account ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-text-secondary">{account.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No account</span>
                          )}
                        </td>

                        {/* Deficit */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {meter.openingDeficit > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-danger-soft text-danger-text border border-danger-edge">
                              <AlertCircle className="w-3 h-3" />
                              {fmt(meter.openingDeficit)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-ok-soft text-ok-text border border-ok-edge">
                              <CheckCircle2 className="w-3 h-3" />
                              Clear
                            </span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-foreground">{fmt(meter.totalAmount || 0)}</span>
                        </td>

                        {/* Total Units */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-warn-text" />
                            <span className="text-sm text-text-secondary">{(meter.totalUnits || 0).toFixed(2)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="sticky right-0 bg-card px-4 py-3.5 whitespace-nowrap text-right">
                            <div className="text-muted-foreground group-hover:text-accent-text transition-all">
                              <RowMenu
                                meter={meter}
                                onEdit={(m: any) => { setEditingMeter(m); setFormOpen(true); }}
                                onView={(m: any) => setActionsMeter(m)}
                                onDelete={(m: any) => setDeleteMeter(m)}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination Footer ── */}
          <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-text-secondary">{fmtNum(((metersData.pagination.page - 1) * metersData.pagination.limit) + 1)}</span>–<span className="font-medium text-text-secondary">{fmtNum(Math.min(metersData.pagination.page * metersData.pagination.limit, metersData.pagination.total))}</span> of <span className="font-medium text-text-secondary">{fmtNum(metersData.pagination.total)}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Rows:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="text-xs border border-border rounded-md px-1.5 py-1 bg-card text-text-secondary focus:outline-none"
                >
                  {[10, 20, 50, 100].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(metersData.pagination.page - 1)}
                disabled={!metersData.pagination.hasPrevPage || isLoading}
                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              {[...Array(Math.min(5, metersData.pagination.totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${metersData.pagination.page === p ? "bg-primary text-white shadow-sm" : "text-text-secondary border border-border bg-card hover:bg-muted"}`}
                  >
                    {p}
                  </button>
                );
              })}
              {metersData.pagination.totalPages > 5 && <span className="text-xs text-muted-foreground px-1">…</span>}
              <button
                onClick={() => handlePageChange(metersData.pagination.page + 1)}
                disabled={!metersData.pagination.hasNextPage || isLoading}
                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MeterFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingMeter(null); }}
        editing={editingMeter}
        tariffs={tariffs}
        accounts={accounts}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
      {actionsMeter && (
        <MeterActionsDialog
          open={!!actionsMeter}
          onClose={() => setActionsMeter(null)}
          meter={actionsMeter}
          axiosInstance={axiosInstance}
        />
      )}
      {deleteMeter && (
        <DeleteDialog
          meter={deleteMeter}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteMeter(null)}
        />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default MetersPage;
