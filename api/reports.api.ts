/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TariffForReports {
    id: string;
    name: string;
    provider: "KPLC" | "ALVER_POWER";
    ratePerUnit: number;
    meterCount: number;
    paymentCount: number;
    meters: {
        id: string;
        meterNumber: string;
        location: string;
    }[];
}

export interface TariffReportSummary {
    totalMeters: number;
    totalTransactions: number;
    totalUnits: number;
    totalRevenue: number;
    averageTransactionAmount: number;
}

export interface MeterBreakdown {
    meterNumber: string;
    transactionCount: number;
    totalRevenue: number;
    totalUnits: number;
    averageAmount: number;
}

export interface ReportTransaction {
    id: string;
    transId: string;
    transTime: string;
    transAmount: number;
    meterNumber: string;
    msisdn: string;
    units: string;
    rate: string;
    token: string;
    transactionType: string;
}

export interface TariffReport {
    tariff: {
        id: string;
        name: string;
        provider: string;
        ratePerUnit: number;
    };
    dateRange: {
        startDate: string | null;
        endDate: string | null;
    };
    summary: TariffReportSummary;
    meterBreakdown: MeterBreakdown[];
    transactions: ReportTransaction[];
}

export interface RevenueSummary {
    dateRange: {
        startDate: string | null;
        endDate: string | null;
    };
    overallTotals: {
        totalRevenue: number;
        totalUnits: number;
        totalTransactions: number;
        totalMeters: number;
    };
    tariffBreakdown: {
        tariff: {
            id: string;
            name: string;
            provider: string;
            ratePerUnit: number;
        };
        totalRevenue: number;
        totalUnits: number;
        transactionCount: number;
        meterCount: number;
    }[];
}

// Get all tariffs with basic stats for report selection
export async function getTariffsForReports(axiosInstance: any): Promise<{ data: TariffForReports[] }> {
    const response = await axiosInstance.get("reports/tariffs");
    return response;
}

// Get tariff-based report with date range filtering
export async function getTariffReport(
    axiosInstance: any,
    tariffId: string,
    startDate?: string,
    endDate?: string
): Promise<{ data: TariffReport }> {
    const params = new URLSearchParams({ tariffId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axiosInstance.get(`reports/tariff?${params.toString()}`);
    return response;
}

// Get revenue summary across all tariffs
export async function getRevenueSummary(
    axiosInstance: any,
    startDate?: string,
    endDate?: string
): Promise<{ data: RevenueSummary }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `reports/revenue-summary?${queryString}` : 'reports/revenue-summary';
    
    const response = await axiosInstance.get(url);
    return response;
}
