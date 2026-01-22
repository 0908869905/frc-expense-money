"use client";

/**
 * 資料匯出工具（CSV / Excel）
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type DataRow = Record<string, any>;

const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_COLUMN_WIDTH = 50;
const CSV_BOM = "\uFEFF";

function hasNoData(data: DataRow[]): boolean {
    if (data.length === 0) {
        alert("沒有資料可匯出");
        return true;
    }
    return false;
}

function escapeCsvValue(value: unknown): string {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function calculateColumnWidths(data: DataRow[]): XLSX.ColInfo[] {
    const headers = Object.keys(data[0]);
    return headers.map((key) => {
        const maxLen = Math.max(
            key.length,
            ...data.map((row) => String(row[key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 2, MAX_COLUMN_WIDTH) };
    });
}

export function exportToCSV(data: DataRow[], filename: string): void {
    if (hasNoData(data)) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(",")),
    ].join("\n");

    const blob = new Blob([CSV_BOM + csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
}

export function exportToExcel(data: DataRow[], filename: string, sheetName = "Sheet1"): void {
    if (hasNoData(data)) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = calculateColumnWidths(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: EXCEL_MIME_TYPE }), `${filename}.xlsx`);
}

export function exportToExcelMultiSheet(
    sheets: { name: string; data: DataRow[] }[],
    filename: string
): void {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        if (sheet.data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        }
    }

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: EXCEL_MIME_TYPE }), `${filename}.xlsx`);
}
