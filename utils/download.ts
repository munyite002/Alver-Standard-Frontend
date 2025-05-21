/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";

export const downloadExcelList = (title: string, data: any[]) => {
    if (data.length === 0) {
        alert("No data available to download");
        return;
    }

    // Transform data into an array of arrays
    const header = Object.keys(data[0]).map((key) => key.toUpperCase());
    const rows = data.map(
        (item: { [s: string]: unknown } | ArrayLike<unknown>) =>
            Object.values(item)
    );

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([
        [title.toUpperCase()],
        [],
        header,
        ...rows
    ]);

    // Apply formatting: bold headers
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
            font: { bold: true },
            alignment: { horizontal: "center" }
        };
    }

    // Auto column width for better readability
    ws["!cols"] = header.map(() => ({ wch: 30 })); // Adjust width as needed

    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Download the file with a unique title
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}.xlsx`);
};

export const downloadExcelList2 = (title: string, data: any[]) => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = Object.keys(data[0]);

    // Create a worksheet with the title row, empty row, and data rows
    const worksheetData = [
        [title], // Title row
        [], // Empty row for spacing
        headers, // Header row
        ...data.map((obj) => headers.map((key) => obj[key])) // Data rows
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge the title row across all columns
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Apply styling to title row
    ws["A1"].s = {
        font: { bold: true, sz: 16 }, // Bold and larger font size
        alignment: { horizontal: "center", vertical: "center" }
    };

    // Apply bold styling to the headers
    const range = XLSX.utils.decode_range(ws["!ref"]!);
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cell_address = XLSX.utils.encode_cell({ r: 2, c: C }); // Header row (index 2)
        if (!ws[cell_address]) continue;
        ws[cell_address].s = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" }
        };
    }

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${title}.xlsx`);
};
