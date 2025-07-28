/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Calendar, Hash, MessageSquare, User } from "lucide-react";
import type { Log } from "@/lib/types";

interface LogModalProps {
    log: Log | null;
    isOpen: boolean;
    onClose: () => void;
}

export function LogModal({ log, isOpen, onClose }: LogModalProps) {
    if (!log) return null;

    const formatDate = (dateString: any) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
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

    const { date, time } = formatDate(log.createdAt);
    const EventIcon = getEventIcon(log.event);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <EventIcon className="h-5 w-5 text-gray-500" />
                        <span>Log Details</span>
                        {getEventBadge(log.event)}
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information about this system log entry
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Log ID */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Hash className="h-4 w-4" />
                            Log ID
                        </div>
                        <div className="font-mono text-sm bg-gray-50 p-3 rounded-md">
                            {log.id}
                        </div>
                    </div>

                    <Separator />

                    {/* Event */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Activity className="h-4 w-4" />
                            Event
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded-md">
                            {log.event.replace(/_/g, ' ').toUpperCase()}
                        </div>
                    </div>

                    <Separator />

                    {/* Details */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MessageSquare className="h-4 w-4" />
                            Details
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded-md">
                            {log.details}
                        </div>
                    </div>

                    <Separator />

                    {/* User */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="h-4 w-4" />
                            User
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded-md">
                            {log.user}
                        </div>
                    </div>

                    <Separator />

                    {/* Timestamp */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar className="h-4 w-4" />
                            Timestamp
                        </div>
                        <div className="text-sm">
                            <div className="font-medium">{date}</div>
                            <div className="text-gray-500">{time}</div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 