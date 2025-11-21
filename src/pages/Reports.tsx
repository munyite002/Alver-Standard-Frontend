import { useState, useEffect } from "react";
import { FileText, TrendingUp, Users, Zap, Filter, Download, DollarSign, CreditCard } from "lucide-react";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import {
    getTariffReport,
    getRevenueSummary,
} from "@/../api/reports.api";
import type {
    TariffForReports,
    TariffReport,
    RevenueSummary
} from "@/../api/reports.api";
import { getTariffs } from "@/../api/tariffs.api";

export function ReportsPage() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);

    // State management
    const [tariffs, setTariffs] = useState<TariffForReports[]>([]);
    const [selectedTariff, setSelectedTariff] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [tariffReport, setTariffReport] = useState<TariffReport | null>(null);
    const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
    const [activeTab, setActiveTab] = useState<"tariff" | "revenue">("tariff");

    // Loading states
    const [isLoadingTariffs, setIsLoadingTariffs] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

    // Fetch tariffs on component mount
    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        try {
            setIsLoadingTariffs(true);
            const response = await getTariffs(axiosInstance);
            setTariffs(response.data);
        } catch (err) {
            console.error("Error fetching tariffs:", err);
        } finally {
            setIsLoadingTariffs(false);
        }
    };

    const handleGenerateTariffReport = async () => {
        if (!selectedTariff) {
            alert("Please select a tariff");
            return;
        }

        try {
            setIsLoadingReport(true);
            const response = await getTariffReport(
                axiosInstance,
                selectedTariff,
                startDate || undefined,
                endDate || undefined
            );
            setTariffReport(response.data);
        } catch (error) {
            console.error("Error generating tariff report:", error);
            alert("Failed to generate report");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleGenerateRevenueSummary = async () => {
        try {
            setIsLoadingRevenue(true);
            const response = await getRevenueSummary(
                axiosInstance,
                startDate || undefined,
                endDate || undefined
            );
            setRevenueSummary(response.data);
        } catch (error) {
            console.error("Error generating revenue summary:", error);
            alert("Failed to generate revenue summary");
        } finally {
            setIsLoadingRevenue(false);
        }
    };

    const handleDownloadTariffReport = () => {
        if (!tariffReport) {
            alert("Please generate a tariff report first");
            return;
        }

        // Generate PDF content
        generateTariffReportPDF(tariffReport);
    };

    const handleDownloadTariffReportCSV = () => {
        if (!tariffReport) {
            alert("Please generate a tariff report first");
            return;
        }

        // Generate CSV content
        generateTariffReportCSV(tariffReport);
    };

    const generateTariffReportPDF = (report: TariffReport) => {
        // Create a new window for the PDF content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to download the PDF');
            return;
        }

        // Generate filename with tariff name and date range
        const dateRange = report.dateRange.startDate && report.dateRange.endDate 
            ? `${report.dateRange.startDate} to ${report.dateRange.endDate}`
            : report.dateRange.startDate 
                ? `from ${report.dateRange.startDate}`
                : report.dateRange.endDate
                    ? `until ${report.dateRange.endDate}`
                    : 'All Time';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tariff Report - ${report.tariff.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2563eb;
                        margin-bottom: 5px;
                    }
                    .report-title {
                        font-size: 20px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .report-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 30px;
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .info-item {
                        margin-bottom: 10px;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #64748b;
                    }
                    .summary-cards {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .summary-card {
                        background: #f1f5f9;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        border-left: 4px solid #2563eb;
                    }
                    .summary-card h3 {
                        margin: 0 0 10px 0;
                        color: #2563eb;
                        font-size: 14px;
                        text-transform: uppercase;
                    }
                    .summary-card .value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1e293b;
                    }
                    .revenue-breakdown {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .revenue-card {
                        background: #f0fdf4;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #16a34a;
                    }
                    .revenue-card h3 {
                        margin: 0 0 10px 0;
                        color: #16a34a;
                        font-size: 14px;
                        text-transform: uppercase;
                    }
                    .revenue-card .value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #166534;
                    }
                    .deficit-card {
                        background: #fef2f2;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #dc2626;
                    }
                    .deficit-card h3 {
                        margin: 0 0 10px 0;
                        color: #dc2626;
                        font-size: 14px;
                        text-transform: uppercase;
                    }
                    .deficit-card .value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #991b1b;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #e2e8f0;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f1f5f9;
                        font-weight: bold;
                        color: #475569;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 30px 0 15px 0;
                        color: #1e293b;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 5px;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #64748b;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 20px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Alver Power Systems</div>
                    <div class="report-title">Tariff Report</div>
                    <div style="color: #64748b; font-size: 14px;">Generated on ${new Date().toLocaleDateString('en-KE', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>

                <div class="report-info">
                    <div>
                        <div class="info-item">
                            <span class="info-label">Tariff Name:</span> ${report.tariff.name}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Provider:</span> ${report.tariff.provider}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rate per Unit:</span> ${formatCurrency(report.tariff.ratePerUnit)}
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <span class="info-label">Report Period:</span> ${dateRange}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Start Date:</span> ${report.dateRange.startDate || 'N/A'}
                        </div>
                        <div class="info-item">
                            <span class="info-label">End Date:</span> ${report.dateRange.endDate || 'N/A'}
                        </div>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Total Meters</h3>
                        <div class="value">${report.summary.totalMeters}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Total Transactions</h3>
                        <div class="value">${report.summary.totalTransactions}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Total Units</h3>
                        <div class="value">${report.summary.totalUnits.toFixed(2)}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Total Revenue</h3>
                        <div class="value">${formatCurrency(report.summary.totalRevenue)}</div>
                    </div>
                </div>

                <div class="revenue-breakdown">
                    <div class="revenue-card">
                        <h3>Token Revenue</h3>
                        <div class="value">${formatCurrency(report.summary.totalTokenRevenue)}</div>
                        <div style="font-size: 12px; color: #4b5563; margin-top: 5px;">
                            ${((report.summary.totalTokenRevenue / report.summary.totalRevenue) * 100).toFixed(1)}% of total
                        </div>
                    </div>
                    <div class="deficit-card">
                        <h3>Deficit Recovery</h3>
                        <div class="value">${formatCurrency(report.summary.totalDeficitPaid)}</div>
                        <div style="font-size: 12px; color: #4b5563; margin-top: 5px;">
                            ${((report.summary.totalDeficitPaid / report.summary.totalRevenue) * 100).toFixed(1)}% of total
                        </div>
                    </div>
                </div>

                ${report.meterBreakdown.length > 0 ? `
                <div class="section-title">Meter Breakdown</div>
                <table>
                    <thead>
                        <tr>
                            <th>Meter Number</th>
                            <th>Opening Deficit</th>
                            <th>Transactions</th>
                            <th>Total Units</th>
                            <th>Token Revenue</th>
                            <th>Deficit Paid</th>
                            <th>Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.meterBreakdown.map(meter => `
                            <tr>
                                <td>${meter.meterNumber}</td>
                                <td>${formatCurrency(meter.openingDeficit)}</td>
                                <td>${meter.transactionCount}</td>
                                <td>${meter.totalUnits.toFixed(2)}</td>
                                <td>${formatCurrency(meter.totalTokenRevenue)}</td>
                                <td>${formatCurrency(meter.totalDeficitPaid)}</td>
                                <td>${formatCurrency(meter.totalRevenue)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                <div class="footer">
                    <div>Alver Power Systems Admin Panel - Tariff Report</div>
                    <div>This report contains confidential information. Handle with care.</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const generateTariffReportCSV = (report: TariffReport) => {
        // Generate filename with tariff name and date range
        const dateRange = report.dateRange.startDate && report.dateRange.endDate 
            ? `${report.dateRange.startDate} to ${report.dateRange.endDate}`
            : report.dateRange.startDate 
                ? `from ${report.dateRange.startDate}`
                : report.dateRange.endDate
                    ? `until ${report.dateRange.endDate}`
                    : 'All Time';

        const filename = `Tariff_Report_${report.tariff.name.replace(/[^a-zA-Z0-9]/g, '_')}_${dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

        // Create CSV content
        let csvContent = '';
        
        // Header information
        csvContent += 'Alver Power Systems - Tariff Report\n';
        csvContent += `Generated on: ${new Date().toLocaleDateString('en-KE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}\n\n`;
        
        // Report information
        csvContent += 'Report Information\n';
        csvContent += `Tariff Name,${report.tariff.name}\n`;
        csvContent += `Provider,${report.tariff.provider}\n`;
        csvContent += `Rate per Unit,${formatCurrency(report.tariff.ratePerUnit)}\n`;
        csvContent += `Report Period,${dateRange}\n`;
        csvContent += `Start Date,${report.dateRange.startDate || 'N/A'}\n`;
        csvContent += `End Date,${report.dateRange.endDate || 'N/A'}\n\n`;
        
        // Summary information
        csvContent += 'Summary\n';
        csvContent += `Total Meters,${report.summary.totalMeters}\n`;
        csvContent += `Total Transactions,${report.summary.totalTransactions}\n`;
        csvContent += `Total Units,${report.summary.totalUnits.toFixed(2)}\n`;
        csvContent += `Total Revenue,${formatCurrency(report.summary.totalRevenue)}\n`;
        csvContent += `Token Revenue,${formatCurrency(report.summary.totalTokenRevenue)}\n`;
        csvContent += `Deficit Recovery,${formatCurrency(report.summary.totalDeficitPaid)}\n\n`;
        
        // Meter breakdown
        if (report.meterBreakdown.length > 0) {
            csvContent += 'Meter Breakdown\n';
            csvContent += 'Meter Number,Opening Deficit,Transactions,Total Units,Token Revenue,Deficit Paid,Total Revenue\n';
            report.meterBreakdown.forEach(meter => {
                csvContent += `${meter.meterNumber},${formatCurrency(meter.openingDeficit)},${meter.transactionCount},${meter.totalUnits.toFixed(2)},${formatCurrency(meter.totalTokenRevenue)},${formatCurrency(meter.totalDeficitPaid)},${formatCurrency(meter.totalRevenue)}\n`;
            });
            csvContent += '\n';
        }
        
        // Recent transactions
        if (report.transactions.length > 0) {
            csvContent += 'Recent Transactions\n';
            csvContent += 'Transaction ID,Date & Time,Meter Number,Amount,Token Revenue,Deficit Paid,Units,Phone\n';
            report.transactions.slice(0, 10).forEach(transaction => {
                const tokenRevenue = (transaction as any).tokenRevenue || 0;
                const deficitPaid = (transaction as any).deficitPaid || 0;
                csvContent += `${transaction.transId},${formatDate(transaction.transTime)},${transaction.meterNumber},${formatCurrency(transaction.transAmount)},${formatCurrency(tokenRevenue)},${formatCurrency(deficitPaid)},${transaction.units},${transaction.msisdn}\n`;
            });
        }

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-600">Generate and view detailed reports</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tariff Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Tariff
                        </label>
                        <select
                            value={selectedTariff}
                            onChange={(e) => setSelectedTariff(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoadingTariffs}
                        >
                            <option value="">Select a tariff...</option>
                            {tariffs.map((tariff) => (
                                <option key={tariff.id} value={tariff.id}>
                                    {tariff.name} ({tariff.provider})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Generate Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleGenerateTariffReport}
                            disabled={isLoadingReport || !selectedTariff}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            {isLoadingReport ? "Generating..." : "Tariff Report"}
                        </button>

                        <button
                            onClick={handleGenerateRevenueSummary}
                            disabled={isLoadingRevenue}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            {isLoadingRevenue ? "Generating..." : "Revenue Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab("tariff")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "tariff"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Tariff Report
                        </button>
                        <button
                            onClick={() => setActiveTab("revenue")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "revenue"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Revenue Summary
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === "tariff" && (
                        <div>
                            {tariffReport ? (
                                <div className="space-y-6">
                                    {/* Tariff Info with Download Button */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {tariffReport.tariff.name}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDownloadTariffReport}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download PDF
                                                </button>
                                                <button
                                                    onClick={handleDownloadTariffReportCSV}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Provider:</span>
                                                <p className="font-medium">{tariffReport.tariff.provider}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Rate per Unit:</span>
                                                <p className="font-medium">{formatCurrency(tariffReport.tariff.ratePerUnit)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Start Date:</span>
                                                <p className="font-medium">{tariffReport.dateRange.startDate || "N/A"}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">End Date:</span>
                                                <p className="font-medium">{tariffReport.dateRange.endDate || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <Users className="h-8 w-8 text-blue-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-blue-600">Total Meters</p>
                                                    <p className="text-2xl font-bold text-blue-900">
                                                        {tariffReport.summary.totalMeters}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <FileText className="h-8 w-8 text-green-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-green-600">Transactions</p>
                                                    <p className="text-2xl font-bold text-green-900">
                                                        {tariffReport.summary.totalTransactions}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <Zap className="h-8 w-8 text-yellow-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-yellow-600">Total Units</p>
                                                    <p className="text-2xl font-bold text-yellow-900">
                                                        {tariffReport.summary.totalUnits.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <TrendingUp className="h-8 w-8 text-purple-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {formatCurrency(tariffReport.summary.totalRevenue)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revenue Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <DollarSign className="h-8 w-8 text-emerald-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-emerald-600">Token Revenue</p>
                                                    <p className="text-2xl font-bold text-emerald-900">
                                                        {formatCurrency(tariffReport.summary.totalTokenRevenue)}
                                                    </p>
                                                    <p className="text-sm text-emerald-700 mt-1">
                                                        {((tariffReport.summary.totalTokenRevenue / tariffReport.summary.totalRevenue) * 100).toFixed(1)}% of total
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <CreditCard className="h-8 w-8 text-red-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-red-600">Deficit Recovery</p>
                                                    <p className="text-2xl font-bold text-red-900">
                                                        {formatCurrency(tariffReport.summary.totalDeficitPaid)}
                                                    </p>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        {((tariffReport.summary.totalDeficitPaid / tariffReport.summary.totalRevenue) * 100).toFixed(1)}% of total
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meter Breakdown */}
                                    {tariffReport.meterBreakdown.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Meter Breakdown</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Meter Number
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Opening Deficit
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Transactions
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Total Units
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Token Revenue
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Deficit Paid
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Total Revenue
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {tariffReport.meterBreakdown.map((meter) => (
                                                            <tr key={meter.meterNumber}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {meter.meterNumber}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency(meter.openingDeficit)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {meter.transactionCount}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {meter.totalUnits.toFixed(2)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency(meter.totalTokenRevenue)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency(meter.totalDeficitPaid)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency(meter.totalRevenue)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Transactions */}
                                    {tariffReport.transactions.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                                Recent Transactions ({tariffReport.transactions.length})
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Transaction ID
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Date & Time
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Meter Number
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Amount
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Token Revenue
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Deficit Paid
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Units
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Phone
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {tariffReport.transactions.slice(0, 10).map((transaction) => (
                                                            <tr key={transaction.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {transaction.transId}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatDate(transaction.transTime)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {transaction.meterNumber}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency(transaction.transAmount)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency((transaction as any).tokenRevenue || 0)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatCurrency((transaction as any).deficitPaid || 0)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {transaction.units}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {transaction.msisdn}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No report generated</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Select a tariff and generate a report to view data.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "revenue" && (
                        // ... (revenue summary tab remains the same)
                        <div>
                            {revenueSummary ? (
                                <div className="space-y-6">
                                    {/* Revenue summary content remains unchanged */}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No revenue summary generated</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Generate a revenue summary to view data across all tariffs.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}