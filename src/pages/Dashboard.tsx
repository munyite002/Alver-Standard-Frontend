/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { TransactionTable } from "@/components/Transactions/transactions-table";
import { TransactionModal } from "@/components/Transactions/transactions-modal";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";
import { DashboardStats } from "@/components/Dashboard/dashboard-stats";
import type { Payment } from "@/lib/types";
import {
    getDashboardMetrics,
    getAllTransactions
} from "@/../api/transactions.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";

export function DashboardPage() {
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedTransaction, setSelectedTransaction] =
        useState<Payment | null>(null);

    const [metrics, setMetrics] = useState<any>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [transactions, setTransactions] = useState<any>(null);

    const handleViewTransaction = (transaction: Payment) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    async function fetchDashboardMetrics() {
        try {
            const response = await getDashboardMetrics(axiosInstance);
            setMetrics(response.data);
        } catch (error) {
            console.error("Error: ", error);
            setMetrics(null);
        }
    }

    async function fetchTransactions() {
        try {
            const response = await getAllTransactions(axiosInstance);
            setTransactions(response.data);
        } catch (error) {
            console.error("Error: ", error);
            setMetrics(null);
        }
    }

    useEffect(() => {
        fetchDashboardMetrics();
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions
        ? transactions.filter((transaction: Payment) => {
              const query = searchQuery.toLowerCase();
              return (
                  transaction.transId?.toLowerCase().includes(query) ||
                  transaction.billRefNumber?.toLowerCase().includes(query) ||
                  transaction.firstName?.toLowerCase().includes(query) ||
                  transaction.lastName?.toLowerCase().includes(query) ||
                  transaction.msisdn?.includes(query) ||
                  transaction.middleName?.toLowerCase().includes(query)
              );
          })
        : [];

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
            <main className="flex-1 space-y-6 p-6 pt-4 md:p-8 md:pt-6">
                <DashboardStats metrics={metrics} />
                <TransactionTable
                    onViewTransaction={handleViewTransaction}
                    transactions={filteredTransactions}
                />
                {isModalOpen && (
                    <TransactionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        transaction={selectedTransaction}
                    />
                )}
            </main>
        </div>
    );
}
