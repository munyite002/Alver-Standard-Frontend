/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowUpIcon, CreditCard, DollarSign, Users, LoaderIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardStats({ metrics, isLoading }: { metrics: any, isLoading?: boolean }) {
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
                        {isLoading ? (
                            <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            metrics?.totalPayments?.count
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isLoading ? (
                            <LoaderIcon className="h-3 w-3 animate-spin inline-block mr-1 text-emerald-500" />
                        ) : (
                            <span className="text-emerald-500 flex items-center gap-1">
                                <ArrowUpIcon className="h-3 w-3" />
                                {metrics?.totalPayments?.percentageChange}%
                            </span>
                        )}{" "}
                        {!isLoading && "from last month"}
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
                        {
                            isLoading ? (
                                <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                `Ksh ${metrics?.totalRevenue?.amount}`
                            )
                        }
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isLoading ? (
                            <LoaderIcon className="h-3 w-3 animate-spin inline-block mr-1 text-emerald-500" />
                        ) : (
                            <span className="text-emerald-500 flex items-center gap-1">
                                <ArrowUpIcon className="h-3 w-3" />
                                {metrics?.totalRevenue?.percentageChange}%
                            </span>
                        )}{" "}
                        {!isLoading && "from last month"}
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
                    <div className="text-2xl font-bold">
                        {isLoading ? (
                            <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground"/>
                        ) : (
                            `Ksh ${metrics?.averageAmount?.amount}`
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isLoading ? (
                            <LoaderIcon className="h-3 w-3 animate-spin inline-block mr-1 text-emerald-500" />
                        ) : (
                            <span className="text-emerald-500 flex items-center gap-1">
                                <ArrowUpIcon className="h-3 w-3" />
                                {metrics?.averageAmount?.percentageChange}%
                            </span>
                        )}
                        {!isLoading && "from last month"}
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
                    <div className="text-2xl font-bold">
                        {
                            isLoading ? (
                                <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                metrics?.uniqueCustomers?.count
                            )
                        }
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isLoading ? (
                            <LoaderIcon className="h-3 w-3 animate-spin inline-block mr-1 text-emerald-500" />
                        ) : (
                            <span className="text-emerald-500 flex items-center gap-1">
                                <ArrowUpIcon className="h-3 w-3" />
                                {metrics?.uniqueCustomers?.percentageChange}%
                            </span>
                        )}
                        {!isLoading && "from last month"}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
