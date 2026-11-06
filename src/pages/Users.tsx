/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
    Pencil, Trash2, User, Mail, Phone, Shield, Building2,
    UserCheck, UserMinus, X, Loader2, ListFilter,
    ChevronDown, ArrowUpDown, ShieldCheck, ShieldAlert
} from "lucide-react";
import { getAllUsers, createUserForAccount, adminUpdateUser, toggleUserStatus, adminDeleteUser } from '../../api/users.api';
import { getAccounts } from '../../api/accounts.api';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { cn } from "@/lib/utils";
import { useOutletContext } from 'react-router-dom';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    phone: string;
    role: string;
    isActive: boolean;
    isDeleted: boolean;
    accountId: string | null;
    account?: {
        name: string;
    };
}

interface AccountData {
    id: string;
    name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

const EMPTY_FORM = { email: '', name: '', phone: '', role: 'manager', accountId: '' };

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

// ─── User Form Dialog ─────────────────────────────────────────────────────────
function UserFormDialog({ open, onClose, editing, accounts, onSubmit, isSaving }: any) {
    const [form, setForm] = useState<any>(EMPTY_FORM);
    const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

    useEffect(() => {
        if (editing) {
            setForm({
                email: editing.email || '',
                name: editing.name || '',
                phone: editing.phone || '',
                role: editing.role || 'manager',
                accountId: editing.accountId || '',
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
                            <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-sm leading-tight">
                                {editing ? "Edit User" : "Add New User"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {editing ? `Editing Profile` : "System access and role assignment"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                    {!editing && (
                        <div className="mb-6 p-4 bg-info-soft border border-info-edge rounded-xl">
                            <p className="text-xs text-info-text font-medium leading-relaxed">
                                <span className="font-bold flex items-center gap-1.5 mb-1"><ShieldCheck className="w-3 h-3" /> Security Note</span>
                                New users will receive their temporary access credentials via SMS once the account is created.
                            </p>
                        </div>
                    )}

                    <form id="user-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
                        <Field label="Full Name" required>
                            <TextInput value={form.name} onChange={(e: any) => set("name", e.target.value)} placeholder="e.g. John Doe" required />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Email Address" required>
                                <TextInput type="email" value={form.email} onChange={(e: any) => set("email", e.target.value)} placeholder="john@company.com" required />
                            </Field>
                            <Field label="Phone Number" required hint="With country code, e.g. 254...">
                                <TextInput value={form.phone} onChange={(e: any) => set("phone", e.target.value)} placeholder="254700..." required />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="System Role" required>
                                <SelectInput value={form.role} onChange={(e: any) => set("role", e.target.value)}>
                                    <option value="admin">Administrator</option>
                                    <option value="manager">Manager</option>
                                    <option value="staff">Field Staff</option>
                                </SelectInput>
                            </Field>
                            <Field label="Associated Account" required>
                                <SelectInput value={form.accountId} onChange={(e: any) => set("accountId", e.target.value)}>
                                    <option value="">Select account…</option>
                                    {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </SelectInput>
                            </Field>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/60 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/10"
                    >
                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isSaving ? "Saving…" : editing ? "Update User" : "Create User"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteDialog({ user, onConfirm, onClose }: any) {
    if (!user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" onClick={onClose}>
            <div className="av-panel shadow-2xl w-full max-w-sm animate-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-danger-soft flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-5 h-5 text-danger-text" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground text-center mb-1">Delete user?</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        <span className="font-semibold text-text-secondary">{user.name || user.email}</span> will lose all system access immediately.
                    </p>
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-accent hover:bg-accent rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(user.id)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-danger rounded-lg transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
function RowMenu({ user, onEdit, onToggle, onDelete }: any) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX - 160, // Adjust based on dropdown width
            });
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
                            className="fixed z-50 w-44 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in"
                            style={{
                                top: position.top,
                                left: position.left,
                            }}
                        >
                            <div className="p-1">
                                <button
                                    onClick={() => { setOpen(false); onEdit(user); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-muted rounded-lg transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => { setOpen(false); onToggle(user); }}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                                        user.isActive ? "text-warn-text hover:bg-warn-soft" : "text-ok-text hover:bg-ok-soft"
                                    )}
                                >
                                    {user.isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                    {user.isActive ? "Suspend Access" : "Restore Access"}
                                </button>
                            </div>
                            <div className="border-t border-border p-1">
                                <button
                                    onClick={() => { setOpen(false); onDelete(user); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger-text hover:bg-danger-soft rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Permanent Delete
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
const UsersPage: React.FC = () => {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);
    const { searchQuery } = useOutletContext<{
        searchQuery: string;
        setSearchQuery: (value: string) => void;
    }>();

    // State
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deleteUserRef, setDeleteUserRef] = useState<UserData | null>(null);

    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersData, accountsData] = await Promise.all([
                getAllUsers(axiosInstance),
                getAccounts(axiosInstance)
            ]);
            setUsers(usersData);
            setFilteredUsers(usersData);
            setAccounts(accountsData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch users or accounts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let result = users.filter(user => !user.isDeleted);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(user =>
                (user.name && user.name.toLowerCase().includes(q)) ||
                user.email.toLowerCase().includes(q) ||
                user.phone.toLowerCase().includes(q) ||
                (user.account?.name && user.account.name.toLowerCase().includes(q))
            );
        }

        // Sorting
        result.sort((a: any, b: any) => {
            const av = a[sortField] || "";
            const bv = b[sortField] || "";
            const res = av > bv ? 1 : -1;
            return sortOrder === "asc" ? res : -res;
        });

        setFilteredUsers(result);
        setCurrentPage(1);
    }, [searchQuery, users, sortField, sortOrder]);

    const handleSubmit = async (formData: any) => {
        setIsSaving(true);
        try {
            if (editingUser) {
                await adminUpdateUser(axiosInstance, {
                    userId: editingUser.id,
                    ...formData
                });
                toast.success('User updated successfully');
            } else {
                await createUserForAccount(axiosInstance, formData);
                toast.success('User created successfully. Credentials sent via SMS.');
            }
            setFormOpen(false);
            setEditingUser(null);
            fetchData();
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast.error(`${error?.response?.data?.error || 'Error saving user'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (user: UserData) => {
        try {
            await toggleUserStatus(axiosInstance, user.id);
            toast.success(`User ${user.isActive ? 'suspended' : 'activated'} successfully`);
            fetchData();
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update user status');
        }
    };

    const handleConfirmDelete = async (id: string) => {
        try {
            await adminDeleteUser(axiosInstance, id);
            toast.success('User deleted successfully');
            setDeleteUserRef(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("asc"); }
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

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
                        <p className="av-label text-[10.5px] text-accent-text mb-1">Access Management</p>
                        <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Users<span className="text-signal">.</span></h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{fmtNum(users.length)} active system users</p>
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm shadow-black/10"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                </div>

                {/* ── Table Card ── */}
                <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <h2 className="text-sm font-semibold text-foreground">User Directory</h2>
                            <span className="px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs font-medium">
                                {fmtNum(filteredUsers.length)} identified
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
                                            { label: "Name", field: "name", sortable: true },
                                            { label: "Contact", field: "email", sortable: true },
                                            { label: "Role", field: "role", sortable: true },
                                            { label: "Account", field: null, sortable: false },
                                            { label: "Status", field: "isActive", sortable: true },
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
                                    {paginated.map((user) => (
                                        <tr key={user.id} className={`av-row group`}>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{user.name || "Unnamed User"}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono tracking-tight">{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-text-secondary">
                                                        <Mail className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-xs">{user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-text-secondary">
                                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-xs">{user.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className={cn(
                                                        "w-3.5 h-3.5",
                                                        user.role === 'admin' ? "text-accent-text" : "text-muted-foreground"
                                                    )} />
                                                    <span className="capitalize font-medium text-text-secondary">{user.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-text-secondary">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm">{user.account?.name || "No Account"}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
                                                    user.isActive
                                                        ? "bg-ok-soft text-ok-text border-ok-edge"
                                                        : "bg-warn-soft text-warn-text border-warn-edge"
                                                )}>
                                                    <div className={cn("w-1 h-1 rounded-full", user.isActive ? "bg-ok" : "bg-warn")} />
                                                    {user.isActive ? "Active" : "Suspended"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
                                                    <RowMenu
                                                        user={user}
                                                        onEdit={(u: any) => { setEditingUser(u); setFormOpen(true); }}
                                                        onToggle={handleToggleStatus}
                                                        onDelete={(u: any) => setDeleteUserRef(u)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                                    <User className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-semibold text-text-secondary">No users found</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {searchQuery ? "Try a different search term" : "Add your first system user to get started"}
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
                            Showing <span className="font-medium text-text-secondary">{fmtNum(startIndex + 1)}</span>–<span className="font-medium text-text-secondary">{fmtNum(Math.min(startIndex + itemsPerPage, filteredUsers.length))}</span> of <span className="font-medium text-text-secondary">{fmtNum(filteredUsers.length)}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-lg bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            <UserFormDialog
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditingUser(null); }}
                editing={editingUser}
                accounts={accounts}
                onSubmit={handleSubmit}
                isSaving={isSaving}
            />
            <DeleteDialog
                user={deleteUserRef}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteUserRef(null)}
            />
            <Toaster position='top-right' richColors />
        </div>
    );
};

export default UsersPage;
