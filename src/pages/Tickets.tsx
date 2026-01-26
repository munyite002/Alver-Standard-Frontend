/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck

import { useEffect, useState } from "react";
import { TicketsTable } from "@/components/Tickets/tickets-table";
import { TicketModal } from "@/components/Tickets/ticket-modal";
import { TicketsStats } from "@/components/Tickets/tickets-stats";
import { getAllTickets, getTicketStats } from "@/../api/tickets.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { toast } from "sonner";

export default function Tickets() {
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );

    const [tickets, setTickets] = useState<any>(null);
    const [ticketStats, setTicketStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        search: '',
        page: 1,
        limit: 10,
    });

    const handleViewTicket = (ticket: any) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleFilterChange = (key: any, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page: any) => {
        setFilters(prev => ({ ...prev, page }));
    };

    async function fetchTickets() {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') params.append(key, value);
            });

            const response = await getAllTickets(axiosInstance, params.toString());
            setTickets(response);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Failed to fetch tickets");
            setTickets(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchTicketStats() {
        try {
            setIsStatsLoading(true);
            const response = await getTicketStats(axiosInstance);
            setTicketStats(response.data);
        } catch (error) {
            console.error("Error fetching ticket stats:", error);
            toast.error("Failed to fetch ticket statistics");
            setTicketStats(null);
        } finally {
            setIsStatsLoading(false);
        }
    }

    useEffect(() => {
        fetchTickets();
        fetchTicketStats();
    }, [filters]);

    const refreshData = () => {
        fetchTickets();
        fetchTicketStats();
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">Support Tickets</h1>
                <p className="text-gray-600">
                    Manage and monitor customer support tickets and requests.
                </p>
            </div>

            <TicketsStats stats={ticketStats} isLoading={isStatsLoading} />

            <TicketsTable
                tickets={tickets}
                isLoading={isLoading}
                onViewTicket={handleViewTicket}
                filters={filters}
                onFilterChange={handleFilterChange}
                onPageChange={handlePageChange}
                onRefresh={refreshData}
                axiosInstance={axiosInstance}
            />

            <TicketModal
                ticket={selectedTicket}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTicketUpdated={refreshData}
                axiosInstance={axiosInstance}
            />
        </div>
    );
}