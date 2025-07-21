/* eslint-disable @typescript-eslint/no-explicit-any */
// import { getAuthHeaders } from "../utils/Auth";

export interface Tariff {
    id: string;
    name: string;
    provider: "KPLC" | "ALVER_POWER";
    ratePerUnit: number;
    createdAt: string;
    updatedAt: string;
}

export async function getTariffs(axiosInstance: any) {
    const response = await axiosInstance.get("/tarrif");
    return response;
}

export async function createTariff(axiosInstance: any, data: Omit<Tariff, "id" | "createdAt" | "updatedAt">) {
    const response = await axiosInstance.post("/tarrif", data);
    return response;
}

export async function updateTariff(axiosInstance: any, id: string, data: Tariff) {
    const response = await axiosInstance.put(`/tarrif/${id}`, data);
    return response;
} 