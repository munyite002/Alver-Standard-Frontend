/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getQueueItems(axiosInstance: any, params?: any) {
    const response = axiosInstance.get("/payments/queue", { params });
    return response;
}

export async function getQueueStats(axiosInstance: any) {
    const response = axiosInstance.get("/payments/queue/stats");
    return response;
}

export async function retryQueueItem(axiosInstance: any, id: string, confirmed = false) {
    const response = axiosInstance.post(`/payments/queue/${id}/retry`, { confirmed });
    return response;
}

export async function cancelQueueItem(axiosInstance: any, id: string) {
    const response = axiosInstance.delete(`/payments/queue/${id}`);
    return response;
}

export async function getAttention(axiosInstance: any, days: number) {
    const response = axiosInstance.get("/payments/attention", { params: { days } });
    return response;
}

// Only after the receipt is found in the M-Pesa portal: the API buys a token for Safaricom's validated amount.
export async function confirmValidation(axiosInstance: any, transId: string) {
    const response = axiosInstance.post(`/payments/attention/${encodeURIComponent(transId)}/confirm`, { confirmed: true });
    return response;
}
