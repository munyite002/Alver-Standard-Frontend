/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getSmsDeliveryReports(axiosInstance: any, params?: any) {
    return axiosInstance.get("/sms-delivery-reports", { params });
}

export async function getSmsDeliveryReportStats(axiosInstance: any) {
    return axiosInstance.get("/sms-delivery-reports/stats");
}
