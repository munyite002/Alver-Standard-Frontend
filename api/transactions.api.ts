/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "../utils/Auth";

export async function getDashboardMetrics(axiosInstance: any) {
    const response = axiosInstance.get(
        //@ts-ignore
        `/payments/metrics`,
        {
            headers: { Authorization: getAuthHeaders() }
        }
    );

    return response;
}

export async function getAllTransactions(axiosInstance: any) {
    const response = axiosInstance.get("/payments/transactions", {
        headers: { Authorization: getAuthHeaders() }
    });

    return response;
}
