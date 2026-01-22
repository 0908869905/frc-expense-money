"use client";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// 匯出為 CSV
export function exportToCSV(data: Record<string, any>[], filename: string) {
    if (data.length === 0) {
        alert("沒有資料可匯出");
        return;
    }

    // ?��?欄�?標�?
    const headers = Object.keys(data[0]);

    // 建�? CSV ?�容
    const csvContent = [
        headers.join(","),
        ...data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                // ?��??�含?��??��?行�???
                if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? "";
            }).join(",")
        ),
    ].join("\n");

    // ?�入 BOM 以支?�中??
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
}

// ?�出??Excel
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName?: string) {
    if (data.length === 0) {
        alert("沒有資料可匯出");
        return;
    }

    // 建立工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // ?��?調整欄寬
    const maxWidth = 50;
    const colWidths = Object.keys(data[0]).map((key) => {
        const maxLen = Math.max(
            key.length,
            ...data.map((row) => String(row[key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // 建�?工�?�?
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

    // ?�出
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${filename}.xlsx`);
}

// ?�出多個工作表
export function exportToExcelMultiSheet(
    sheets: { name: string; data: Record<string, any>[] }[],
    filename: string
) {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
        if (sheet.data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        }
    });

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${filename}.xlsx`);
}

