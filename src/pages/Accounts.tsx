/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Button } from "../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, LoaderIcon } from "lucide-react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accounts.api';
import type { Account } from '../../api/accounts.api';
import { toast, Toaster } from 'sonner';
import { getTariffs } from '../../api/tariffs.api';
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { useOutletContext } from 'react-router-dom';

const Accounts: React.FC = () => {
    const { searchQuery, setSearchQuery } = useOutletContext<{
        searchQuery: string;
        setSearchQuery: (value: string) => void;
    }>();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API)
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
    const [open, setOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingTariffs, setIsLoadingTariffs] = useState(false);
    const [tariffs, setTariffs] = useState<any[]>([]);

    const itemsPerPage = 10;
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        tarrifId: ''
    });

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

    useEffect(() => {
        fetchAccounts();
        fetchTariffs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let result = accounts;
        if (searchQuery) {
            result = result.filter(account =>
                account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (account.email && account.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (account.phone && account.phone.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        setFilteredAccounts(result);
        setCurrentPage(1);
    }, [searchQuery, accounts]);

    const handleOpen = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                email: account.email || '',
                phone: account.phone || '',
                tarrifId: account.tarrifId || '',
            });
        } else {
            setEditingAccount(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                tarrifId: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingAccount(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAccount) {
                await updateAccount(axiosInstance, editingAccount.id, formData);
                toast.success('Account updated successfully');
            } else {
                await createAccount(axiosInstance, formData);
                toast.success('Account created successfully');
            }
            handleClose();
            fetchAccounts();
        } catch (error: any) {
            console.error('Error saving account:', error);
            toast.error(`Error saving account: ${error?.response?.data?.error || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                await deleteAccount(axiosInstance, id);
                toast.success('Account deleted successfully');
                fetchAccounts();
            } catch (error) {
                console.error('Error deleting account:', error);
                toast.error('Failed to delete account');
            }
        }
    };

    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Accounts</h1>
                <Button onClick={() => handleOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-gray-100">
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Name</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Email</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Phone</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Meters</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    {isLoading ? (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center">
                                        <LoaderIcon className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                                        <p className="text-gray-500 text-sm">Loading accounts...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : (
                        <TableBody>
                            {currentAccounts.length > 0 ? (
                                currentAccounts.map((account, index) => (
                                    <TableRow
                                        key={account.id}
                                        className={`border-b border-gray-50 hover:bg-gray-25 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                                    >
                                        <TableCell className="py-4 px-6">
                                            <span className="font-medium text-gray-900">{account.name}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-gray-700">{account.email || '-'}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-gray-700">{account.phone || '-'}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {account._count?.meters || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpen(account)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-150"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-150"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center">
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No accounts found</h3>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    )}
                </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length} entries
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='bg-white'>
                    <DialogHeader>
                        <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                        <DialogDescription>
                            {editingAccount ? 'Update the account details below.' : 'Fill in the account details below.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="name">Account Name</label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="phone">Phone</label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="tariff">Tariff</label>
                                <select
                                    id="tariff"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.tarrifId || ''}
                                    onChange={(e) => setFormData({ ...formData, tarrifId: e.target.value })}
                                >
                                    <option value="">Select Tariff</option>
                                    {tariffs.map(tariff => (
                                        <option key={tariff.id} value={tariff.id}>{tariff.name}</option>
                                    ))}
                                </select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <Toaster position='top-right' richColors />
        </div>
    );
};

export default Accounts;
