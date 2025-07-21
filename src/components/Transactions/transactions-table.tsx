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
    isLoading: boolean
}

export function TransactionTable({
    onViewTransaction,
    transactions,
    isLoading
}: TransactionTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(transactions?.length / itemsPerPage);
    const [sort, setSort] = useState<{
        key?: string;
        direction?: "asc" | "desc";
    }>({});
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Sort transactions based on sort value
    const sortedTransactions = [...(transactions || [])].sort((a, b) => {
        if (!sort.key || !sort.direction) return 0;
        const { key, direction } = sort;
        let aValue = a[key];
        let bValue = b[key];

        // Handle date sorting
        if (key === "createdAt") {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={sort.key ? "default" : "outline"}
                                size="sm"
                                className="h-8 gap-1"
                            >
                                <ArrowDownUp className="h-3.5 w-3.5" />
                                {sort.key
                                    ? sort.key === "createdAt"
                                        ? sort.direction === "asc"
                                            ? "Date (Oldest)"
                                            : "Date (Newest)"
                                        : sort.key === "transAmount"
                                            ? sort.direction === "asc"
                                                ? "Amount (Low to High)"
                                                : "Amount (High to Low)"
                                            : "Sort"
                                    : "Sort"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() =>
                                    setSort({
                                        key: "createdAt",
                                        direction: "desc"
                                    })
                                }
                            >
                                Date (Newest)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setSort({
                                        key: "createdAt",
                                        direction: "asc"
                                    })
                                }
                            >
                                Date (Oldest)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setSort({
                                        key: "transAmount",
                                        direction: "desc"
                                    })
                                }
                            >
                                Amount (High to Low)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setSort({
                                        key: "transAmount",
                                        direction: "asc"
                                    })
                                }
                            >
                                Amount (Low to High)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
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
                            ) : currentTransactions.length > 0 ? (
                                currentTransactions.map((transaction, index) => {
                                    const { date, time } = formatDate(transaction.createdAt);
                                    return (
                                        <TableRow
                                            key={transaction.id}
                                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === currentTransactions.length - 1 ? 'border-b-0' : ''
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
                                                                {transaction.firstName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction.firstName}
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
                        <span className="font-medium">{startIndex + 1}</span> to{" "}
                        <span className="font-medium">
                            {Math.min(endIndex, transactions?.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                            {transactions?.length}
                        </span>{" "}
                        transactions
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                            <span className="sr-only">First page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
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
