/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getTariffs,
  createTariff,
  updateTariff,
  type Tariff
} from "@/../api/tariffs.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
  Zap, Plus, Pencil, Check, Loader2,
  Tag, Building2, AlertCircle, RefreshCw
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(n);

// ─── Shared field/input primitives (matches SettingsPage) ─────────────────────
function Field({
  label, children, hint
}: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function StyledInput({
  value, onChange, placeholder = "", type = "text", required = false, ...rest
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  [key: string]: any;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                 transition-all placeholder:text-gray-400"
      {...rest}
    />
  );
}

// ─── Individual tariff row ────────────────────────────────────────────────────
function TariffRow({
  tariff, onUpdate, isSaving
}: {
  tariff: Tariff;
  onUpdate: (tariff: Tariff, rate: number) => Promise<void>;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(tariff.ratePerUnit);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(tariff, rate);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group">
      {/* Left — tariff identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{tariff.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-400">{tariff.provider}</span>
          </div>
        </div>
      </div>

      {/* Right — rate + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {editing ? (
          <>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none select-none">
                KES
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                autoFocus
                className="w-full pl-10 pr-3 py-2 text-sm border border-blue-400 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600
                         rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
            >
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setRate(tariff.ratePerUnit); }}
              className="px-3 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{fmt(tariff.ratePerUnit)}</p>
              <p className="text-xs text-gray-400">per kWh</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white
                         border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300
                         opacity-0 group-hover:opacity-100 transition-all"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TariffConfiguration() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

  const [isSaving, setIsSaving]               = useState(false);
  const [tariffs, setTariffs]                 = useState<Tariff[]>([]);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

  const [newTariff, setNewTariff] = useState<{
    name: string; provider: any; ratePerUnit: number;
  }>({ name: "", provider: "", ratePerUnit: 0 });

  const fetchTariffs = async () => {
    try {
      setIsLoadingTariffs(true);
      const response = await getTariffs(axiosInstance);
      setTariffs(response.data);
    } catch (err) {
      console.error("Error fetching tariffs:", err);
      toast.error("Failed to fetch tariffs");
    } finally {
      setIsLoadingTariffs(false);
    }
  };

  useEffect(() => { fetchTariffs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await createTariff(axiosInstance, newTariff);
      toast.success("Tariff created successfully");
      setNewTariff({ name: "", provider: "", ratePerUnit: 0 });
      fetchTariffs();
    } catch (err) {
      //@ts-ignore
      toast.error(`Error creating tariff: ${err?.response?.data?.error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (tariff: any, ratePerUnit: number) => {
    try {
      await updateTariff(axiosInstance, tariff.id, { ...tariff, ratePerUnit });
      toast.success("Tariff updated");
      fetchTariffs();
    } catch (err) {
      //@ts-ignore
      toast.error(`Error updating tariff: ${err?.response?.data?.error}`);
    }
  };

  return (
    <div className="space-y-6 animate-in">

      {/* ── Existing Tariffs ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Tariffs</p>
            <p className="text-xs text-gray-400 mt-0.5">Click Edit on any tariff to update its rate</p>
          </div>
          <button
            onClick={fetchTariffs}
            disabled={isLoadingTariffs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingTariffs ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isLoadingTariffs ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : tariffs.length > 0 ? (
          <div className="space-y-2">
            {tariffs.map((tariff) => (
              <TariffRow
                key={tariff.id}
                tariff={tariff}
                onUpdate={handleUpdate}
                isSaving={isSaving}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No tariffs yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first tariff below</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Create New Tariff ── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Create New Tariff</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tariff Name">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={newTariff.name}
                  onChange={(e) => setNewTariff((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Standard Plan"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             transition-all placeholder:text-gray-400"
                />
              </div>
            </Field>

            <Field label="Provider">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={newTariff.provider}
                  onChange={(e) => setNewTariff((p) => ({ ...p, provider: e.target.value }))}
                  placeholder="e.g. KPLC"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             transition-all placeholder:text-gray-400"
                />
              </div>
            </Field>

            <Field label="Rate per Unit (KES/kWh)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 select-none pointer-events-none">
                  KES
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTariff.ratePerUnit}
                  onChange={(e) => setNewTariff((p) => ({ ...p, ratePerUnit: parseFloat(e.target.value) }))}
                  required
                  className="w-full pl-11 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             transition-all"
                />
              </div>
            </Field>
          </div>

          {/* Inline preview */}
          {newTariff.name && newTariff.provider && newTariff.ratePerUnit > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Creating <span className="font-semibold">{newTariff.name}</span> via{" "}
                <span className="font-semibold">{newTariff.provider}</span> at{" "}
                <span className="font-semibold">{fmt(newTariff.ratePerUnit)}/kWh</span>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600
                         rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all shadow-sm shadow-blue-200"
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Plus className="w-3.5 h-3.5" />
              }
              {isSaving ? "Creating…" : "Create Tariff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}