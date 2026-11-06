/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Filter,
    Eye,
    RefreshCw,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { updateTicketStatus } from "@/../api/tickets.api";
import { toast } from "sonner";

const getStatusBadge = (status: any) => {
    const variants = {
        OPEN: {
            className: "bg-signal-soft text-accent-text hover:bg-signal-soft",
            icon: <Clock className="h-3 w-3 mr-1" />
        },
        IN_PROGRESS: {
            className: "bg-warn-soft text-warn-text hover:bg-warn-soft",
            icon: <AlertCircle className="h-3 w-3 mr-1" />
        },
        RESOLVED: {
            className: "bg-ok-soft text-ok-text hover:bg-ok-soft",
            icon: <CheckCircle className="h-3 w-3 mr-1" />
        },
        CLOSED: {
            className: "bg-accent text-foreground hover:bg-accent",
            icon: <CheckCircle className="h-3 w-3 mr-1" />
        },
        CANCELLED: {
            className: "bg-danger-soft text-danger-text hover:bg-danger-soft",
            icon: <XCircle className="h-3 w-3 mr-1" />
        },
    };

    const variant = variants[status] || variants.OPEN;
    return (
        <Badge className={`${variant.className} flex items-center gap-1`}>
            {variant.icon}
            {status.replace('_', ' ')}
        </Badge>
    );
};

const getPriorityBadge = (priority) => {
    const variants = {
        LOW: "bg-ok-soft text-ok-text hover:bg-ok-soft",
        MEDIUM: "bg-warn-soft text-warn-text hover:bg-warn-soft",
        HIGH: "bg-warn-soft text-warn-text hover:bg-warn-soft",
        URGENT: "bg-danger-soft text-danger-text hover:bg-danger-soft",
    };

    return <Badge className={variants[priority]}>{priority}</Badge>;
};

export const TicketsTable = ({
    tickets,
    isLoading,
    onViewTicket,
    filters,
    onFilterChange,
    onPageChange,
    onRefresh,
    axiosInstance
}) => {
    const [updatingTicketId, setUpdatingTicketId] = useState(null);

    const handleQuickStatusUpdate = async (ticketId, status) => {
        try {
            setUpdatingTicketId(ticketId);
            await updateTicketStatus(axiosInstance, ticketId, { status });
            toast.success(`Ticket status updated to ${status.toLowerCase().replace('_', ' ')}`);
            onRefresh?.();
        } catch (error) {
            console.error("Error updating ticket status:", error);
            toast.error("Failed to update ticket status");
        } finally {
            setUpdatingTicketId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-md border">
                <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading tickets...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tickets?.data?.length) {
        return (
            <div className="rounded-md border">
                <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No tickets found</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            className="mt-2"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by meter, phone, or description..."
                            className="pl-10"
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select
                        value={filters.status}
                        onValueChange={(value) => onFilterChange('status', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.priority}
                        onValueChange={(value) => onFilterChange('priority', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={onRefresh}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Meter Number</TableHead>
                            <TableHead>Issue Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.data.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-mono text-sm">
                                    {ticket.ticketId?.substring(0, 8)}...
                                </TableCell>
                                <TableCell>{ticket.meterNumber}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                    {ticket.issueType}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(ticket.status)}
                                </TableCell>
                                <TableCell>
                                    {getPriorityBadge(ticket.priority)}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onViewTicket(ticket)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleQuickStatusUpdate(ticket.id, 'IN_PROGRESS')}
                                                    disabled={ticket.status === 'IN_PROGRESS' || updatingTicketId === ticket.id}
                                                >
                                                    <AlertCircle className="h-4 w-4 mr-2" />
                                                    Mark as In Progress
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleQuickStatusUpdate(ticket.id, 'RESOLVED')}
                                                    disabled={ticket.status === 'RESOLVED' || updatingTicketId === ticket.id}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Mark as Resolved
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleQuickStatusUpdate(ticket.id, 'CLOSED')}
                                                    disabled={ticket.status === 'CLOSED' || updatingTicketId === ticket.id}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Mark as Closed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleQuickStatusUpdate(ticket.id, 'CANCELLED')}
                                                    disabled={ticket.status === 'CANCELLED' || updatingTicketId === ticket.id}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Cancel Ticket
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {tickets.pagination?.pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {((tickets.pagination.page - 1) * tickets.pagination.limit) + 1} to{' '}
                        {Math.min(tickets.pagination.page * tickets.pagination.limit, tickets.pagination.total)} of{' '}
                        {tickets.pagination.total} tickets
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(tickets.pagination.page - 1)}
                            disabled={tickets.pagination.page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(tickets.pagination.page + 1)}
                            disabled={tickets.pagination.page === tickets.pagination.pages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};