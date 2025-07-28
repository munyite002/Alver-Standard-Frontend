/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, MessageSquare, Hash } from "lucide-react";

interface LogsStatsProps {
    logs: any;
}

export function LogsStats({ logs }: LogsStatsProps) {
    if (!logs || logs.length === 0) {
        return null;
    }

    // Group logs by event type
    const eventCounts = logs.reduce((acc: any, log: any) => {
        acc[log.event] = (acc[log.event] || 0) + 1;
        return acc;
    }, {});

    // Get top 4 most common events
    const topEvents = Object.entries(eventCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 4);

    const getEventIcon = (event: string) => {
        const eventIcons: { [key: string]: any } = {
            'tariff_updated': Activity,
            'user_login': User,
            'payment_processed': MessageSquare,
            'meter_created': Hash,
            'system_error': Activity,
            'data_export': Activity,
            'user_logout': User,
            'settings_changed': Activity,
            'backup_created': Activity,
            'report_generated': Activity
        };
        
        return eventIcons[event] || Activity;
    };

    const getEventBadge = (event: string) => {
        const eventVariants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
            'tariff_updated': "default",
            'user_login': "secondary",
            'payment_processed': "default",
            'meter_created': "secondary",
            'system_error': "destructive",
            'data_export': "outline",
            'user_logout': "secondary",
            'settings_changed': "default",
            'backup_created': "outline",
            'report_generated': "outline"
        };

        return eventVariants[event] || "outline";
    };

    const getPercentage = (count: number) => {
        return ((count / logs.length) * 100).toFixed(1);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{logs.length}</div>
                    <p className="text-xs text-muted-foreground">
                        All system logs
                    </p>
                </CardContent>
            </Card>

            {topEvents.map(([event, count]: [string, any], index) => {
                const EventIcon = getEventIcon(event);
                const badgeVariant = getEventBadge(event);
                
                return (
                    <Card key={event}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {event.replace(/_/g, ' ').toUpperCase()}
                            </CardTitle>
                            <EventIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{count}</div>
                            <p className="text-xs text-muted-foreground">
                                {getPercentage(count)}% of total
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
} 