import { useState } from "react";
import { TransactionTable } from "@/components/Transactions/transactions-table";
import { TransactionModal } from "@/components/Transactions/transactions-modal";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";
import { DashboardStats } from "@/components/Dashboard/dashboard-stats";
import type { Payment } from "@/lib/types";

export function DashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Payment | null>(null);

    const handleViewTransaction = (transaction: Payment) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader />
            <main className="flex-1 space-y-6 p-6 pt-4 md:p-8 md:pt-6">
                <DashboardStats />
                <TransactionTable onViewTransaction={handleViewTransaction} />
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    transaction={selectedTransaction}
                />
            </main>
        </div>
    );
}
