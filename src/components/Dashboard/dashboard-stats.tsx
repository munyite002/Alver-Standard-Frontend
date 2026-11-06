/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowUp, ArrowDown, CreditCard, DollarSign, Users, Loader } from "lucide-react";

const Card = ({ children, className = "" }: any) => (
  <div className={`av-panel hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: any) => (
  <div className={`p-6 pb-3 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`text-sm font-semibold text-text-secondary uppercase tracking-wide ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);

export function DashboardStats({ metrics, isLoading = false }: any) {
    const statsConfig = [
        {
            title: "Total Payments",
            icon: CreditCard,
            value: metrics?.totalPayments?.count,
            change: metrics?.totalPayments?.percentageChange,
            color: "blue",
            prefix: ""
        },
        {
            title: "Total Revenue",
            icon: DollarSign,
            value: metrics?.totalRevenue?.amount,
            change: metrics?.totalRevenue?.percentageChange,
            color: "blue",
            prefix: "Ksh "
        },
        {
            title: "Total Units",
            icon: DollarSign,
            value: metrics?.totalUnits,
            color: "red",
        },
        {
            title: "Service Charge",
            icon: DollarSign,
            value: metrics?.serviceFee,
            color: "blue",
            prefix: "Ksh "
        }
    ];

    const getColorClasses = (color: any, isPositive = true) => {
        if (color === "blue") {
            return {
                icon: "text-accent-text",
                iconBg: "bg-signal-soft",
                change: isPositive ? "text-accent-text bg-signal-soft" : "text-danger-text bg-danger-soft",
                gradient: "from-primary to-primary"
            };
        } else {
            return {
                icon: "text-danger-text",
                iconBg: "bg-danger-soft",
                change: isPositive ? "text-ok-text bg-ok-soft" : "text-danger-text bg-danger-soft",
                gradient: "from-danger to-danger"
            };
        }
    };

    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return value;
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((stat, index) => {
                const IconComponent = stat.icon;
                const isPositive = stat.change >= 0;
                const colors = getColorClasses(stat.color, isPositive);
                
                return (
                    <Card key={index} className="relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient}`}></div>
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${colors.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                                <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                            </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                            <div className="mb-3">
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <div className="h-8 w-24 bg-accent rounded animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-bold text-foreground tracking-tight">
                                        {stat.prefix}{formatValue(stat.value) || 0}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {isLoading ? (
                                    <div className="flex items-center space-x-1">
                                        <Loader className="h-3 w-3 animate-spin text-muted-foreground" />
                                        <div className="h-4 w-16 bg-accent rounded animate-pulse"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colors.change}`}>
                                            {isPositive ? (
                                                <ArrowUp className="h-3 w-3 mr-1" />
                                            ) : (
                                                <ArrowDown className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(stat.change) || 0}%
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            vs last month
                                        </span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}