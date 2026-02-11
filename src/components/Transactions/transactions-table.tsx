/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    ArrowDownUp,
    DollarSign,
    Calendar,
    Hash,
    User,
    Search
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Payment } from "@/lib/types";

interface TransactionTableProps {
    onViewTransaction: (transaction: Payment) => void;
    transactions: any;
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    filters: {
        page: number;
        limit: number;
        startDate: string;
        endDate: string;
        sort: string;
    };
    onFilterChange: (newFilters: any) => void;
}

export function TransactionTable({
    onViewTransaction,
    transactions,
    isLoading,
    pagination,
    filters,
    onFilterChange
}: TransactionTableProps) {
    // Helper to format date as 'Aug 1st 2025'
    function formatFancyDate(dateStr: string) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const day = date.getDate();
        const daySuffix =
            day % 10 === 1 && day !== 11 ? "st" :
                day % 10 === 2 && day !== 12 ? "nd" :
                    day % 10 === 3 && day !== 13 ? "rd" : "th";
        return `${date.toLocaleString('en-US', { month: 'short' })} ${day}${daySuffix} ${date.getFullYear()}`;
    }

    const formatDate = (dateString: any) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const handleSortChange = (sortValue: string) => {
        onFilterChange({ sort: sortValue, page: 1 });
    };

    const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
        onFilterChange({ [type]: value, page: 1 });
    };

    const handlePageChange = (newPage: number) => {
        onFilterChange({ page: newPage });
    };

    const handleLimitChange = (newLimit: number) => {
        onFilterChange({ limit: newLimit, page: 1 });
    };

    const currentSortLabel = () => {
        switch (filters.sort) {
            case 'latest': return "Date (Newest)";
            case 'earliest': return "Date (Oldest)";
            case 'highest': return "Amount (High to Low)";
            case 'lowest': return "Amount (Low to High)";
            default: return "Sort";
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <CardTitle>Recent Transactions</CardTitle>
                    <div className="flex gap-2 items-center ml-0 md:ml-6">
                        <label className="text-sm text-gray-700">Start Date:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={e => handleDateChange('startDate', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        />
                        <label className="text-sm text-gray-700">End Date:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={e => handleDateChange('endDate', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                onFilterChange({ startDate: "", endDate: "", page: 1 });
                            }}
                            className="ml-2 px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 border"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Rows:</label>
                        <select
                            value={filters.limit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm bg-white"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={filters.sort ? "default" : "outline"}
                                size="sm"
                                className="h-8 gap-1"
                            >
                                <ArrowDownUp className="h-3.5 w-3.5" />
                                {currentSortLabel()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSortChange('latest')}>
                                Date (Newest)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('earliest')}>
                                Date (Oldest)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('highest')}>
                                Amount (High to Low)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('lowest')}>
                                Amount (Low to High)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    {(filters.startDate || filters.endDate) && (
                        <div className="text-sm font-medium text-gray-700">
                            Transaction activity
                            {filters.startDate && filters.endDate
                                ? ` between ${formatFancyDate(filters.startDate)} and ${formatFancyDate(filters.endDate)}`
                                : filters.startDate
                                    ? ` from ${formatFancyDate(filters.startDate)}`
                                    : filters.endDate
                                        ? ` up to ${formatFancyDate(filters.endDate)}`
                                        : ''
                            }
                        </div>
                    )}
                </div>
                <div className="rounded-md border">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-200">
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-gray-500" />
                                        Transaction
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Date & Time
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-gray-500" />
                                        Amount
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Customer
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Meter Number
                                    </div>
                                </TableHead>
                                <TableHead className="text-center py-4 px-6 text-sm font-semibold text-gray-900 w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="text-sm text-gray-500">Loading transactions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length > 0 ? (
                                transactions.map((transaction: any, index: number) => {
                                    const { date, time } = formatDate(transaction.createdAt);
                                    return (
                                        <TableRow
                                            key={transaction.id}
                                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === transactions.length - 1 ? 'border-b-0' : ''
                                                }`}
                                        >
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="font-mono text-sm font-medium text-gray-900">
                                                        {transaction.transId}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {transaction.billRefNumber}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">{date}</div>
                                                    <div className="text-xs text-gray-500">{time}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    Ksh {transaction.transAmount.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {transaction?.firstName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction?.firstName || "SYSTEM"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-blue-400">
                                                            {transaction.billRefNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => onViewTransaction(transaction)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View transaction details</span>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Search className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">No transactions found</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">
                            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                        </span> to{" "}
                        <span className="font-medium">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                            {pagination.total}
                        </span>{" "}
                        transactions
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(1)}
                            disabled={!pagination.hasPrevPage}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                            <span className="sr-only">First page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={!pagination.hasPrevPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>
                        <div className="text-sm font-medium">
                            Page {pagination.page} of {pagination.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasNextPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={!pagination.hasNextPage}
                        >
                            <ChevronsRight className="h-4 w-4" />
                            <span className="sr-only">Last page</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
