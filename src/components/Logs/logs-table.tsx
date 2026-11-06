/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowDownUp,
    Calendar,
    Hash,
    MessageSquare,
    User,
    Search,
    Activity
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
import { Badge } from "@/components/ui/badge";
import type { Log } from "@/lib/types";
import { Eye } from "lucide-react";

interface LogsTableProps {
    logs: any;
    isLoading: boolean;
    onViewLog: (log: Log) => void;
}

export function LogsTable({ logs, isLoading, onViewLog }: LogsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(logs?.length / itemsPerPage);
    const [sort, setSort] = useState<{
        key?: string;
        direction?: "asc" | "desc";
    }>({});
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Sort logs based on sort value
    const sortedLogs = [...(logs || [])].sort((a, b) => {
        if (!sort.key || !sort.direction) return 0;
        const { key, direction } = sort;
        let aValue = a[key];
        let bValue = b[key];

        // Handle date sorting
        if (key === "createdAt" || key === "updatedAt") {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const currentLogs = sortedLogs.slice(startIndex, endIndex);

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
                minute: '2-digit',
                second: '2-digit'
            })
        };
    };

    const getEventIcon = (event: string) => {
        // Map common events to icons
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
        // Map events to badge variants
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

        return (
            <Badge variant={eventVariants[event] || "outline"}>
                {event.replace(/_/g, ' ').toUpperCase()}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>System Logs</CardTitle>
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
                                        : sort.key === "event"
                                            ? sort.direction === "asc"
                                                ? "Event (A-Z)"
                                                : "Event (Z-A)"
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
                                        key: "event",
                                        direction: "asc"
                                    })
                                }
                            >
                                Event (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setSort({
                                        key: "event",
                                        direction: "desc"
                                    })
                                }
                            >
                                Event (Z-A)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="border-b border-border">
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                        Event
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        Details
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        User
                                    </div>
                                </TableHead>
                                <TableHead className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Date & Time
                                    </div>
                                </TableHead>
                                <TableHead className="text-center py-4 px-6 text-sm font-semibold text-foreground w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal"></div>
                                            <p className="text-sm text-muted-foreground">Loading logs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentLogs.length > 0 ? (
                                currentLogs.map((log, index) => {
                                    const { date, time } = formatDate(log.createdAt);
                                    const EventIcon = getEventIcon(log.event);
                                    return (
                                        <TableRow
                                            key={log.id}
                                            className={`border-b border-border hover:bg-muted transition-colors ${index === currentLogs.length - 1 ? 'border-b-0' : ''
                                                }`}
                                        >
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <EventIcon className="h-4 w-4 text-muted-foreground" />
                                                    {getEventBadge(log.event)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="max-w-md">
                                                    <div className="text-sm font-medium text-foreground line-clamp-2">
                                                        {log.details}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-8 w-8 rounded-full bg-signal-soft flex items-center justify-center">
                                                            <span className="text-sm font-medium text-accent-text">
                                                                {log.user.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {log.user}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-foreground">{date}</div>
                                                    <div className="text-xs text-muted-foreground">{time}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => onViewLog(log)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-text-secondary hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View log details</span>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                                                <Search className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">No logs found</p>
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
                            {Math.min(endIndex, logs?.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                            {logs?.length}
                        </span>{" "}
                        logs
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