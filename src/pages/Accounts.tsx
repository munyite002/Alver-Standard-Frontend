/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
    Pencil, Trash2, Building2, User, Mail, Phone,
    Loader2, X, ArrowUpDown, ChevronDown, ListFilter,
    CreditCard
} from "lucide-react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accounts.api';
import type { Account } from '../../api/accounts.api';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
            <div
                className="av-panel shadow-2xl w-full max-w-lg animate-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-sm leading-tight">
                                {editing ? "Edit Account" : "Add New Account"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {editing ? `Editing ${editing.name}` : "Fill in the details below"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
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
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/60 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="account-form"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/10"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
            <div className="av-panel shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-danger-soft flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-5 h-5 text-danger-text" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground text-center mb-1">Delete account?</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        <span className="font-semibold text-text-secondary">{account.name}</span> and all associated data will be permanently removed.
                    </p>
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-accent hover:bg-accent rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(account.id)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-danger rounded-lg transition-colors">
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
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 160; // w-40 = 160px
            const dropdownHeight = 120; // Approximate height of dropdown
            
            let left = rect.left + window.scrollX - (dropdownWidth - rect.width);
            let top = rect.bottom + window.scrollY;
            
            // Check if dropdown would go off the right edge
            if (left + dropdownWidth > window.innerWidth + window.scrollX) {
                left = window.innerWidth + window.scrollX - dropdownWidth - 8;
            }
            
            // Check if dropdown would go off the bottom edge
            if (top + dropdownHeight > window.innerHeight + window.scrollY) {
                top = rect.top + window.scrollY - dropdownHeight - 4;
            }
            
            setPosition({ top, left });
        }
    }, [open]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-text-secondary hover:bg-accent transition-colors"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    {ReactDOM.createPortal(
                        <div 
                            ref={dropdownRef}
                            className="fixed z-50 w-40 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in"
                            style={{
                                top: position.top,
                                left: position.left,
                            }}
                        >
                            <div className="p-1">
                                <button
                                    onClick={() => { setOpen(false); onEdit(account); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-muted rounded-lg transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    Edit Account
                                </button>
                            </div>
                            <div className="border-t border-border p-1">
                                <button
                                    onClick={() => { setOpen(false); onDelete(account); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger-text hover:bg-danger-soft rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>,
                        document.body
                    )}
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
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
        return sortOrder === "asc"
            ? <ChevronDown className="w-3 h-3 text-accent-text rotate-180" />
            : <ChevronDown className="w-3 h-3 text-accent-text" />;
    };

    return (
        <div className="min-h-full">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between animate-in">
                    <div>
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Organization</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Accounts<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{fmtNum(accounts.length)} property accounts managed</p>
                    </div>
                    <button
                        onClick={() => { setEditingAccount(null); setFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm shadow-black/10"
                    >
                        <Plus className="w-4 h-4" />
                        New Account
                    </button>
                </div>

                {/* ── Table Card ── */}
                <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <h2 className="text-sm font-semibold text-foreground">Account Registry</h2>
                            <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                                {fmtNum(filteredAccounts.length)} total
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">Sorting by {sortField}</span>
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
                                    <tr className="border-b border-border">
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
                                                className={`av-label text-[10.5px] px-5 py-3 text-left text-muted-foreground whitespace-nowrap
                                                ${sortable ? "cursor-pointer hover:text-text-secondary select-none" : ""}`}
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
                                <tbody className="divide-y divide-border">
                                    {paginated.map((acc) => (
                                        <tr key={acc.id} className={`av-row group`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                                                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-semibold text-foreground">{acc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-text-secondary">
                                                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{acc.email || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-text-secondary">
                                                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{acc.phone || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-warn-text" />
                                                    <span className="text-sm text-text-secondary">
                                                        {tariffs.find(t => t.id === acc.tarrifId)?.name || acc.tarrifId || "Default"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-accent text-text-secondary">
                                                    {acc._count?.meters || 0} Meters
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
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
                                                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                                    <Building2 className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-semibold text-text-secondary">No accounts found</p>
                                                <p className="text-xs text-muted-foreground mt-1">
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
                    <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-text-secondary">{fmtNum(startIndex + 1)}</span>–<span className="font-medium text-text-secondary">{fmtNum(Math.min(startIndex + itemsPerPage, filteredAccounts.length))}</span> of <span className="font-medium text-text-secondary">{fmtNum(filteredAccounts.length)}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Previous
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${currentPage === i + 1 ? "bg-primary text-white shadow-sm" : "text-text-secondary border border-border bg-card hover:bg-muted"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
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
