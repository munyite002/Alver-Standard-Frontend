/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Account {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        users: number;
        meters: number;
    };
}

export async function getAccounts(axiosInstance: any) {
    const response = await axiosInstance.get("/accounts");
    return response;
}

export async function createAccount(axiosInstance: any, data: Omit<Account, "id" | "createdAt" | "updatedAt" | "_count">) {
    const response = await axiosInstance.post("/accounts", data);
    return response;
}

export async function updateAccount(axiosInstance: any, id: string, data: Partial<Account>) {
    const response = await axiosInstance.put(`/accounts/${id}`, data);
    return response;
}

export async function getAccountById(axiosInstance: any, id: string) {
    const response = await axiosInstance.get(`/accounts/${id}`);
    return response;
}

export async function deleteAccount(axiosInstance: any, id: string) {
    const response = await axiosInstance.delete(`/accounts/${id}`);
    return response;
}
