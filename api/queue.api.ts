/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getQueueItems(axiosInstance: any, params?: any) {
    const response = axiosInstance.get("/payments/queue", { params });
    return response;
}

export async function getQueueStats(axiosInstance: any) {
    const response = axiosInstance.get("/payments/queue/stats");
    return response;
}

export async function retryQueueItem(axiosInstance: any, id: string) {
    const response = axiosInstance.post(`/payments/queue/${id}/retry`);
    return response;
}

export async function cancelQueueItem(axiosInstance: any, id: string) {
    const response = axiosInstance.delete(`/payments/queue/${id}`);
    return response;
}
