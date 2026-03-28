export interface Payment {
    id: string;
    transactionType: string;
    transId: string;
    transTime: string | Date;
    transAmount: number;
    businessShortCode: string;
    billRefNumber?: string | null;
    invoiceNumber?: string | null;
    orgAccountBalance?: number | null;
    thirdPartyTransId?: string | null;
    msisdn: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    token?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    rate: string | number;
    units: string | number;
}

export interface Log {
    id: string;
    event: string;
    details: string;
    user: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export type QueueStatus = "pending" | "processing" | "completed" | "failed" | "retry_wait";

export interface QueueItem {
    id: string;
    transId: string;
    transTime: string | Date;
    transAmount: number;
    businessShortCode: string;
    billRefNumber: string;
    invoiceNumber?: string | null;
    orgAccountBalance?: number | null;
    thirdPartyTransId?: string | null;
    msisdn: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    transactionType?: string | null;
    source: string;
    status: QueueStatus;
    priority: number;
    retryCount: number;
    maxRetries: number;
    lastRetryAt?: string | Date | null;
    nextRetryAt?: string | Date | null;
    lockedBy?: string | null;
    lockedAt?: string | Date | null;
    processingDuration?: number | null;
    token?: string | null;
    units?: string | null;
    rate?: number | null;
    errorMessage?: string | null;
    errorDetails?: string | null;
    paymentId?: string | null;
    stkPaymentId?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    processedAt?: string | Date | null;
}

export interface QueueStats {
    counts: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        retry_wait: number;
        total: number;
    };
    avgProcessingTimeMs: number;
    oldestPending: {
        id: string;
        createdAt: string | Date;
        retryCount: number;
    } | null;
    totalToday: number;
}
