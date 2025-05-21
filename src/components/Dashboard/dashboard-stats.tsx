/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowUpIcon, CreditCard, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardStats({ metrics }: { metrics: any }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Payments
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {metrics?.totalPayments?.count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <span className="text-emerald-500 flex items-center gap-1">
                            <ArrowUpIcon className="h-3 w-3" />{" "}
                            {metrics?.totalPayments?.percentageChange}%
                        </span>{" "}
                        from last month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        Ksh {metrics?.totalRevenue?.amount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <span className="text-emerald-500 flex items-center gap-1">
                            <ArrowUpIcon className="h-3 w-3" /> +
                            {metrics?.totalRevenue?.percentageChange}%
                        </span>{" "}
                        from last month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Average Amount
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {metrics?.averageAmount?.amount}</div>
                    <p className="text-xs text-muted-foreground">
                        <span className="text-emerald-500 flex items-center gap-1">
                            <ArrowUpIcon className="h-3 w-3" /> +{metrics?.averageAmount?.percentageChange}%
                        </span>{" "}
                        from last month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Unique Customers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics?.uniqueCustomers?.count}</div>
                    <p className="text-xs text-muted-foreground">
                        <span className="text-emerald-500 flex items-center gap-1">
                            <ArrowUpIcon className="h-3 w-3" /> +{metrics?.uniqueCustomers?.percentageChange}%
                        </span>{" "}
                        from last month
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
