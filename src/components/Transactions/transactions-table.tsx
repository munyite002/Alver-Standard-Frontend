/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    ArrowDownUp,
    LoaderIcon
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Meter Number</TableHead>
                                <TableHead className="w-[80px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        {isLoading ? (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <div className="w-full flex items-center justify-center py-6">
                                            <LoaderIcon className="h-10 w-10 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        ) : (
                            <TableBody>
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((transaction: any) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                {transaction?.transId?.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                {new Date(transaction.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                Ksh {transaction.transAmount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>{transaction.firstName}</TableCell>
                                            <TableCell>{transaction.billRefNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onViewTransaction(transaction)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View details</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        )}

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
