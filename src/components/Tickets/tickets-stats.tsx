/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { Card, CardContent} from "@/components/ui/card";
import { 
    AlertCircle, 
    CheckCircle, 
    Clock, 
    BarChart3,
    AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ title, value, icon, color, loading }) => {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${color}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const TicketsStats = ({ stats, isLoading }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
                title="Total Tickets"
                value={stats?.totals?.all || 0}
                icon={<BarChart3 className="h-6 w-6 text-accent-text" />}
                color="bg-signal-soft"
                loading={isLoading}
            />
            <StatCard
                title="Open"
                value={stats?.totals?.open || 0}
                icon={<Clock className="h-6 w-6 text-accent-text" />}
                color="bg-signal-soft"
                loading={isLoading}
            />
            <StatCard
                title="In Progress"
                value={stats?.totals?.inProgress || 0}
                icon={<AlertCircle className="h-6 w-6 text-warn-text" />}
                color="bg-warn-soft"
                loading={isLoading}
            />
            <StatCard
                title="Resolved"
                value={stats?.totals?.resolved || 0}
                icon={<CheckCircle className="h-6 w-6 text-ok-text" />}
                color="bg-ok-soft"
                loading={isLoading}
            />
            <StatCard
                title="Closed"
                value={stats?.totals?.closed || 0}
                icon={<CheckCircle className="h-6 w-6 text-text-secondary" />}
                color="bg-accent"
                loading={isLoading}
            />
            <StatCard
                title="Urgent"
                value={stats?.byPriority?.find(p => p.priority === 'URGENT')?._count?.id || 0}
                icon={<AlertTriangle className="h-6 w-6 text-danger-text" />}
                color="bg-danger-soft"
                loading={isLoading}
            />
        </div>
    );
};