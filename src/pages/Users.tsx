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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, X, LoaderIcon, UserCheck, UserMinus } from "lucide-react";
import { getAllUsers, createUserForAccount, adminUpdateUser, toggleUserStatus, adminDeleteUser } from '../../api/users.api';
import { getAccounts } from '../../api/accounts.api';
import { toast, Toaster } from 'sonner';
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { cn } from "@/lib/utils";

interface User {
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

interface Account {
    id: string;
    name: string;
}

const UsersPage: React.FC = () => {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API)
    const [users, setUsers] = useState<User[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const itemsPerPage = 10;
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        phone: '',
        role: 'manager',
        accountId: '',
    });

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
            result = result.filter(user =>
                (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.account?.name && user.account.name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        setFilteredUsers(result);
        setCurrentPage(1);
    }, [searchQuery, users]);

    const handleOpen = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                name: user.name || '',
                phone: user.phone,
                role: user.role,
                accountId: user.accountId || '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                name: '',
                phone: '',
                role: 'manager',
                accountId: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            handleClose();
            fetchData();
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast.error(`${error?.response?.data?.error || 'Error saving user'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await toggleUserStatus(axiosInstance, user.id);
            toast.success(`User ${user.isActive ? 'suspended' : 'activated'} successfully`);
            fetchData();
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update user status');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await adminDeleteUser(axiosInstance, id);
                toast.success('User deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Users</h1>
                <Button onClick={() => handleOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users by name, email, phone or account..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <X
                            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer"
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-gray-100">
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Name</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Email</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Phone</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Role</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Account</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Status</TableHead>
                            <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    {isLoading ? (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center">
                                        <LoaderIcon className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                                        <p className="text-gray-500 text-sm">Loading users...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : (
                        <TableBody>
                            {currentUsers.length > 0 ? (
                                currentUsers.map((user, index) => (
                                    <TableRow
                                        key={user.id}
                                        className={`border-b border-gray-50 hover:bg-gray-25 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                                    >
                                        <TableCell className="py-4 px-6">
                                            <span className="font-medium text-gray-900">{user.name || '-'}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-gray-700">{user.email}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-gray-700">{user.phone}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="capitalize text-gray-700">{user.role}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-gray-700">{user.account?.name || '-'}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            )}>
                                                {user.isActive ? "Active" : "Suspended"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpen(user)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-150"
                                                    title="Edit User"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={cn(
                                                        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150",
                                                        user.isActive ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                                    )}
                                                    title={user.isActive ? "Suspend User" : "Activate User"}
                                                >
                                                    {user.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-150"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center">
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
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
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Update the user details below.' : 'Fill in the user details below. A random password will be generated and sent to the user via SMS.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="name">Full Name</label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="phone">Phone (with country code, e.g., 254...)</label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="role">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className='bg-white'>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="accountId">Account</label>
                                <Select
                                    value={formData.accountId}
                                    onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent className='bg-white'>
                                        {accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
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

export default UsersPage;
