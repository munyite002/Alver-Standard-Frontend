import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { MailCheck, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { resendSms } from "@/../api/users.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Payment | null;
}

export function TransactionModal({
    isOpen,
    onClose,
    transaction
}: TransactionModalProps) {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_STAGING_API);
    const printRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!transaction) return null;

    const formatToken = (token: string | null | undefined, transaction: Payment | null) => {
        if (!token) return transaction?.transactionType;
        const normalizedToken = token
            .replace(/\D/g, "")
            .padEnd(20, "0")
            .slice(0, 20);
        return normalizedToken.match(/.{1,4}/g)?.join(" ") || normalizedToken;
    };

    const handleResendSms = async () => {
        try {
            setIsSubmitting(true);
            const data = {
                phone: transaction?.msisdn,
                token: transaction?.token || transaction?.transactionType
            };
            await resendSms(axiosInstance, data);
            toast.success("Successfully Resend Token SMS to user");
        } catch (err) {
            console.log("Error: ", err);
            toast.error("An Error occured please try again later");
        }
	finally {
		setIsSubmitting(false);
	}
    };

    const handlePrint = () => {
        if (!printRef.current) return;

        const printContent = printRef.current.innerHTML;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Transaction Receipt</title>
                    <style>
                        @media print {
                            @page {
                                margin: 20mm;
                                size: A4;
                            }
                        }
                        
                        * {
                            box-sizing: border-box;
                        }
                        
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            margin: 0;
                            padding: 30px;
                            color: #2c3e50;
                            background: #ffffff;
                        }
                        
                        .receipt-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                        }
                        
                        .receipt-title {
                            font-size: 28px;
                            font-weight: 700;
                            margin: 15px 0 5px 0;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        
                        .receipt-subtitle {
                            font-size: 14px;
                            opacity: 0.9;
                            font-weight: 300;
                        }
                        
                        .receipt-body {
                            padding: 20px;
                        }
                        
                        .section {
                            margin-bottom: 12px;
                            padding: 8px 12px;
                            background: #f8f9fa;
                            border-left: 3px solid #667eea;
                            border-radius: 4px;
                        }
                        
                        .section.highlight {
                            background: linear-gradient(135deg, #667eea15, #764ba215);
                            border-left: 3px solid #764ba2;
                        }
                        
                        .label {
                            font-size: 12px;
                            color: #6c757d;
                            text-transform: uppercase;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                            margin-bottom: 5px;
                        }
                        
                        .value {
                            font-size: 16px;
                            font-weight: 600;
                            color: #2c3e50;
                            word-break: break-word;
                        }
                        
                        .token-section {
                            text-align: center;
                            background: #2c3e50;
                            color: white;
                            padding: 15px;
                            margin: 15px 0;
                            border-radius: 6px;
                            box-shadow: 0 2px 8px rgba(44, 62, 80, 0.2);
                        }
                        
                        .token-label {
                            font-size: 14px;
                            color: #bdc3c7;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 10px;
                        }
                        
                        .token-value {
                            font-family: 'Courier New', monospace;
                            font-size: 20px;
                            font-weight: 700;
                            letter-spacing: 2px;
                            color: #ffffff;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            padding: 10px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                            border: 1px dashed rgba(255,255,255,0.3);
                        }
                        
                        .amount-section {
                            text-align: center;
                            background: linear-gradient(135deg, #27ae60, #2ecc71);
                            color: white;
                            padding: 15px;
                            border-radius: 6px;
                            margin: 15px 0;
                        }
                        
                        .amount-label {
                            font-size: 14px;
                            opacity: 0.9;
                            margin-bottom: 5px;
                        }
                        
                        .amount-value {
                            font-size: 28px;
                            font-weight: 800;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                        }
                        
                        .customer-info {
                            background: #ffffff;
                            border: 1px solid #e9ecef;
                            border-radius: 4px;
                            padding: 12px;
                        }
                        
                        .divider {
                            height: 1px;
                            background: linear-gradient(90deg, transparent, #667eea, transparent);
                            margin: 15px 0;
                            border: none;
                        }
                        
                        .footer-info {
                            text-align: center;
                            margin-top: 20px;
                            padding: 15px;
                            background: #f8f9fa;
                            border-radius: 4px;
                            border-top: 2px solid #667eea;
                        }
                        
                        .footer-text {
                            font-size: 12px;
                            color: #6c757d;
                            margin: 5px 0;
                        }
                        
                        .reference-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-top: 15px;
                        }
                        
                        @media print {
                            body {
                                padding: 0;
                            }
                            
                            .receipt-container {
                                box-shadow: none;
                                border-radius: 0;
                            }
                            
                            .section {
                                break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <Toaster richColors position="top-right" />
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Transaction Details
                    </DialogTitle>
                </DialogHeader>
                {/* Hidden printable area */}
                <div className="hidden" ref={printRef}>
                    <div className="receipt-container">
                        <div className="receipt-body">
                            <div className="section">
                                <div className="label">
                                    Transaction Date & Time
                                </div>
                                <div className="value">
                                    {new Date(
                                        transaction.createdAt
                                    ).toLocaleString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit"
                                    })}
                                </div>
                            </div>

                            <div className="amount-section">
                                <div className="amount-label">Amount Paid</div>
                                <div className="amount-value">
                                    KSh {transaction.transAmount.toFixed(2)}
                                </div>
                            </div>

                            <div className="token-section">
                                <div className="token-label">
                                    Electricity Token
                                </div>
                                <div className="token-value">
                                    {formatToken(transaction.token, transaction)}
                                </div>
                            </div>

                            <hr className="divider" />

                            {transaction.billRefNumber && (
                                <div className="section">
                                    <div className="label">
                                        Meter Number
                                    </div>
                                    <div className="value">
                                        {transaction.billRefNumber}
                                    </div>
                                </div>
                            )}

                            <div className="section customer-info">
                                <div className="label">
                                    Customer Information
                                </div>
                                <div className="value">
                                    {[
                                        transaction.firstName,
                                        transaction.middleName,
                                        transaction.lastName
                                    ]
                                        .filter(Boolean)
                                        .join(" ") || "N/A"}
                                </div>
                            </div>

                            {transaction.thirdPartyTransId && (
                                <div className="section highlight">
                                    <div className="label">
                                        M-Pesa Reference Number
                                    </div>
                                    <div className="value">
                                        {transaction.thirdPartyTransId}
                                    </div>
                                </div>
                            )}

                            <div className="footer-info">
                                <div className="footer-text">
                                    <strong>Transaction ID:</strong>{" "}
                                    {transaction.transId}
                                </div>
                                <div className="footer-text">
                                    Thank you for your payment. Please keep this
                                    receipt for your records.
                                </div>
                                <div className="footer-text">
                                    For support, please contact our customer
                                    service team.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* MODAL CONTENT */}
                <div>
                    <div className="grid gap-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Transaction ID
                                </p>
                                <p className="font-medium">
                                    {transaction.transId}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                    Date & Time
                                </p>
                                <p className="font-medium">
                                    {new Date(
                                        transaction.createdAt
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Transaction Type
                                </p>
                                <p className="font-medium">
                                    {transaction.transactionType}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Amount
                                </p>
                                <p className="font-medium text-lg">
                                    Ksh {transaction.transAmount.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Business Code
                                </p>
                                <p className="font-medium">
                                    {transaction.businessShortCode}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    MSISDN
                                </p>
                                <p className="font-medium">
                                    {transaction.msisdn.slice(0,20)}...
                                </p>
                            </div>
                            {transaction.billRefNumber && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Meter Number
                                    </p>
                                    <p className="font-medium">
                                        {transaction.billRefNumber}
                                    </p>
                                </div>
                            )}
                            {transaction.invoiceNumber && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Invoice Number
                                    </p>
                                    <p className="font-medium">
                                        {transaction.invoiceNumber}
                                    </p>
                                </div>
                            )}
                            {transaction.orgAccountBalance !== null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Account Balance
                                    </p>
                                    <p className="font-medium">
                                        Ksh{" "}
                                        {(
                                            transaction.orgAccountBalance ?? 0
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm font-medium mb-2">Token</p>
                            <div className="bg-gray-50 p-3 rounded-md font-mono text-lg tracking-wider">
                                {formatToken(transaction.token, transaction)}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm font-medium mb-2">
                                Customer Information
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        First Name
                                    </p>
                                    <p className="font-medium">
                                        {transaction.firstName || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Last Name
                                    </p>
                                    <p className="font-medium">
                                        {transaction.lastName || "N/A"}
                                    </p>
                                </div>
                                {transaction.middleName && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Middle Name
                                        </p>
                                        <p className="font-medium">
                                            {transaction.middleName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {transaction.thirdPartyTransId && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Mpesa Reference No
                                    </p>
                                    <p className="font-medium">
                                        {transaction.thirdPartyTransId}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={handlePrint}
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={handleResendSms}
                            disabled={isSubmitting}
                        >
                            <MailCheck className="h-4 w-4" />
                            {isSubmitting ? "Sending..." : "Re-Send SMS"}
                        </Button>
                    </div>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
