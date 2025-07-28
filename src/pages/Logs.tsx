/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { LogsTable } from "@/components/Logs/logs-table";
import { LogModal } from "@/components/Logs/logs-modal";
import { LogsStats } from "@/components/Logs/logs-stats";
import { getAllLogs } from "@/../api/logs.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { toast } from "sonner";
import type { Log } from "@/lib/types";

export default function Logs() {
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );

    const [logs, setLogs] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewLog = (log: Log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    async function fetchLogs() {
        try {
            setIsLoading(true);
            const response = await getAllLogs(axiosInstance);
            setLogs(response.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to fetch logs");
            setLogs(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">System Logs</h1>
                <p className="text-gray-600">
                    View and monitor system activity logs for debugging and auditing purposes.
                </p>
            </div>
            
            <LogsStats logs={logs} />
            
            <LogsTable logs={logs} isLoading={isLoading} onViewLog={handleViewLog} />
            
            <LogModal 
                log={selectedLog} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}