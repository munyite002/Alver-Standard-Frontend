/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getAllLogs(axiosInstance: any) {
    const response = axiosInstance.get("/logs");
    return response;
} 