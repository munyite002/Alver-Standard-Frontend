/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
    Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
    Pencil, Trash2, Building2, User, Mail, Phone,
    Loader2, X, ArrowUpDown, ChevronDown, ListFilter,
    CreditCard
} from "lucide-react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accounts.api';
import type { Account } from '../../api/accounts.api';
import { toast, Toaster } from 'sonner';
import { getTariffs } from '../../api/tariffs.api';
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { useOutletContext } from 'react-router-dom';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

const EMPTY_FORM = { name: '', email: '', phone: '', tarrifId: '' };

// ─── Reusable: Form Field ─────────────────────────────────────────────────────
function Field({ label, required, children, hint }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
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
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
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
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none pr-8"
            >
                {children}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
    );
}

// ─── Account Form Dialog ──────────────────────────────────────────────────────
function AccountFormDialog({ open, onClose, editing, tariffs, onSubmit, isSaving }: any) {
    const [form, setForm] = useState<any>(EMPTY_FORM);
    const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

    useEffect(() => {
        if (editing) {
            setForm({
                name: editing.name || '',
                email: editing.email || '',
                phone: editing.phone || '',
                tarrifId: editing.tarrifId || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [editing, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {editing ? "Edit Account" : "Add New Account"}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {editing ? `Editing ${editing.name}` : "Fill in the details below"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <form id="account-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
                        <Field label="Account Name" required>
                            <TextInput value={form.name} onChange={(e: any) => set("name", e.target.value)} placeholder="e.g. Westlands Estate" required />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Email Address">
                                <TextInput type="email" value={form.email} onChange={(e: any) => set("email", e.target.value)} placeholder="admin@estate.com" />
                            </Field>
                            <Field label="Phone Number">
                                <TextInput value={form.phone} onChange={(e: any) => set("phone", e.target.value)} placeholder="0712 345 678" />
                            </Field>
                        </div>

                        <Field label="Default Tariff">
                            <SelectInput value={form.tarrifId} onChange={(e: any) => set("tarrifId", e.target.value)}>
                                <option value="">Select a tariff…</option>
                                {tariffs.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </SelectInput>
                        </Field>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/60 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="account-form"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
                    >
                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isSaving ? "Saving…" : editing ? "Update Account" : "Create Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteDialog({ account, onConfirm, onClose }: any) {
    if (!account) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete account?</h3>
                    <p className="text-sm text-gray-500 text-center">
                        <span className="font-semibold text-gray-700">{account.name}</span> and all associated data will be permanently removed.
                    </p>
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(account.id)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
function RowMenu({ account, onEdit, onDelete }: any) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in">
                        <div className="p-1">
                            <button
                                onClick={() => { setOpen(false); onEdit(account); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                Edit Account
                            </button>
                        </div>
                        <div className="border-t border-gray-100 p-1">
                            <button
                                onClick={() => { setOpen(false); onDelete(account); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Accounts: React.FC = () => {
    const { searchQuery } = useOutletContext<{
        searchQuery: string;
        setSearchQuery: (value: string) => void;
    }>();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    // State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
    const [tariffs, setTariffs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deleteAccountRef, setDeleteAccountRef] = useState<Account | null>(null);

    const itemsPerPage = 10;

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await getAccounts(axiosInstance);
            setAccounts(response.data);
            setFilteredAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch accounts');
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

    useEffect(() => {
        fetchAccounts();
        fetchTariffs();
    }, []);

    useEffect(() => {
        let result = [...accounts];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(acc =>
                acc.name.toLowerCase().includes(q) ||
                (acc.email && acc.email.toLowerCase().includes(q)) ||
                (acc.phone && acc.phone.toLowerCase().includes(q))
            );
        }

        // Sorting
        result.sort((a: any, b: any) => {
            const av = a[sortField] || "";
            const bv = b[sortField] || "";
            const res = av > bv ? 1 : -1;
            return sortOrder === "asc" ? res : -res;
        });

        setFilteredAccounts(result);
        setCurrentPage(1);
    }, [searchQuery, accounts, sortField, sortOrder]);

    const handleSubmit = async (formData: any) => {
        setIsSaving(true);
        try {
            if (editingAccount) {
                await updateAccount(axiosInstance, editingAccount.id, formData);
                toast.success('Account updated successfully');
            } else {
                await createAccount(axiosInstance, formData);
                toast.success('Account created successfully');
            }
            setFormOpen(false);
            setEditingAccount(null);
            fetchAccounts();
        } catch (error: any) {
            console.error('Error saving account:', error);
            toast.error(`Error saving account: ${error?.response?.data?.error || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async (id: string) => {
        try {
            await deleteAccount(axiosInstance, id);
            toast.success('Account deleted successfully');
            setDeleteAccountRef(null);
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("asc"); }
    };

    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
        return sortOrder === "asc"
            ? <ChevronDown className="w-3 h-3 text-blue-500 rotate-180" />
            : <ChevronDown className="w-3 h-3 text-blue-500" />;
    };

    return (
        <div className="min-h-screen bg-gray-50/60 font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
                * { font-family: 'DM Sans', sans-serif; }
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: fadeInUp 0.3s ease both; }
                @keyframes shimmer { to { background-position: -200% 0; } }
                .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Organization</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Accounts</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{fmtNum(accounts.length)} property accounts managed</p>
                    </div>
                    <button
                        onClick={() => { setEditingAccount(null); setFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        New Account
                    </button>
                </div>

                {/* ── Table Card ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">Account Registry</h2>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                {fmtNum(filteredAccounts.length)} total
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">Sorting by {sortField}</span>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="skeleton h-4 w-32" /><div className="skeleton h-4 flex-1" /><div className="skeleton h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {[
                                            { label: "Account Name", field: "name", sortable: true },
                                            { label: "Contact", field: "email", sortable: true },
                                            { label: "Phone", field: "phone", sortable: true },
                                            { label: "Tariff", field: "tarrifId", sortable: true },
                                            { label: "Meters", field: null, sortable: false },
                                        ].map(({ label, field, sortable }) => (
                                            <th
                                                key={label}
                                                onClick={() => sortable && field && handleSort(field)}
                                                className={`px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap
                                                ${sortable ? "cursor-pointer hover:text-gray-600 select-none" : ""}`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {label}
                                                    {sortable && field && <SortIcon field={field} />}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-5 py-3 w-12" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((acc, idx) => (
                                        <tr key={acc.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors group`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{acc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{acc.email || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{acc.phone || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {tariffs.find(t => t.id === acc.tarrifId)?.name || acc.tarrifId || "Default"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    {acc._count?.meters || 0} Meters
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <RowMenu
                                                        account={acc}
                                                        onEdit={(a: any) => { setEditingAccount(a); setFormOpen(true); }}
                                                        onDelete={(a: any) => setDeleteAccountRef(a)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                    <Building2 className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">No accounts found</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {searchQuery ? "Try a different search term" : "Add your first property account to get started"}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Pagination Footer ── */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <p className="text-xs text-gray-400">
                            Showing <span className="font-medium text-gray-600">{fmtNum(startIndex + 1)}</span>–<span className="font-medium text-gray-600">{fmtNum(Math.min(startIndex + itemsPerPage, filteredAccounts.length))}</span> of <span className="font-medium text-gray-600">{fmtNum(filteredAccounts.length)}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Previous
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AccountFormDialog
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditingAccount(null); }}
                editing={editingAccount}
                tariffs={tariffs}
                onSubmit={handleSubmit}
                isSaving={isSaving}
            />
            <DeleteDialog
                account={deleteAccountRef}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteAccountRef(null)}
            />
            <Toaster position='top-right' richColors />
        </div>
    );
};

export default Accounts;
