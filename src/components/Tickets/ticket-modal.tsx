/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Phone,
    Hash,
    MessageSquare,
    User,
    Calendar,
    Edit
} from "lucide-react";
import { format } from "date-fns";
import { updateTicket } from "@/../api/tickets.api";
import { toast } from "sonner";

const getStatusIcon = (status) => {
    switch (status) {
        case 'OPEN': return <Clock className="h-4 w-4" />;
        case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4" />;
        case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
        case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
        case 'CANCELLED': return <XCircle className="h-4 w-4" />;
        default: return <Clock className="h-4 w-4" />;
    }
};

export const TicketModal = ({ ticket, isOpen, onClose, onTicketUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        priority: '',
        assignedTo: '',
        notes: '',
        resolution: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when ticket changes
    useState(() => {
        if (ticket) {
            setFormData({
                status: ticket.status,
                priority: ticket.priority,
                assignedTo: ticket.assignedTo || '',
                notes: ticket.notes || '',
                resolution: ticket.resolution || '',
            });
        }
    }, [ticket]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!ticket) return;

        try {
            setIsSubmitting(true);
            await updateTicket(axiosInstance, ticket.id, formData);
            toast.success("Ticket updated successfully");
            onTicketUpdated?.();
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating ticket:", error);
            toast.error("Failed to update ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!ticket) return null;

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Ticket Details</DialogTitle>
                            <DialogDescription className="font-mono">
                                ID: {ticket.ticketId}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditing ? 'Cancel Edit' : 'Edit'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Hash className="h-4 w-4 text-gray-500" />
                                    <Label className="text-sm font-medium">Meter Number</Label>
                                </div>
                                <p className="text-lg font-semibold">{ticket.meterNumber}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <Label className="text-sm font-medium">Phone Number</Label>
                                </div>
                                <p className="text-lg font-semibold">{ticket.phoneNumber}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Issue Details */}
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <Label className="text-sm font-medium">Issue Details</Label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className="font-medium">{ticket.issueType}</p>
                                </div>
                                {ticket.subIssueType && (
                                    <div>
                                        <p className="text-sm text-gray-500">Sub-Type</p>
                                        <p className="font-medium">{ticket.subIssueType}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Description</p>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Priority */}
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => handleInputChange('priority', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assigned To</Label>
                                <Input
                                    value={formData.assignedTo}
                                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                                    placeholder="Assign to staff member"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(ticket.status)}
                                        <Label className="text-sm font-medium">Status</Label>
                                    </div>
                                    <Badge className={
                                        ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                                            ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                                    ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-red-100 text-red-800'
                                    }>
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-gray-500" />
                                        <Label className="text-sm font-medium">Priority</Label>
                                    </div>
                                    <Badge className={
                                        ticket.priority === 'LOW' ? 'bg-green-100 text-green-800' :
                                            ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                    }>
                                        {ticket.priority}
                                    </Badge>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Additional Fields */}
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label>Resolution Details</Label>
                                <Textarea
                                    value={formData.resolution}
                                    onChange={(e) => handleInputChange('resolution', e.target.value)}
                                    placeholder="Enter resolution details..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Internal Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Add internal notes..."
                                    rows={3}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {ticket.resolution && (
                                <Card>
                                    <CardContent className="p-4">
                                        <Label className="text-sm font-medium mb-2 block">Resolution</Label>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="whitespace-pre-wrap">{ticket.resolution}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {ticket.notes && (
                                <Card>
                                    <CardContent className="p-4">
                                        <Label className="text-sm font-medium mb-2 block">Internal Notes</Label>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="whitespace-pre-wrap">{ticket.notes}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {ticket.assignedTo && (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <Label className="text-sm font-medium">Assigned To</Label>
                                        </div>
                                        <p>{ticket.assignedTo}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Timestamps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <Label className="text-xs font-medium">Created</Label>
                            </div>
                            <p className="text-xs">{formatDate(ticket.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <Label className="text-xs font-medium">Last Updated</Label>
                            </div>
                            <p className="text-xs">{formatDate(ticket.updatedAt)}</p>
                        </div>
                        {ticket.resolvedAt && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-gray-500" />
                                    <Label className="text-xs font-medium">Resolved At</Label>
                                </div>
                                <p className="text-xs">{formatDate(ticket.resolvedAt)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};