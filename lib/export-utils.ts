"use client";

/**
 * 資料匯出工具（CSV / Excel）
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type CellValue = string | number | boolean | null | undefined;
type DataRow = Record<string, CellValue>;

const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_COLUMN_WIDTH = 50;
const CSV_BOM = "\uFEFF";

function validateData(data: DataRow[]): boolean {
    if (data.length === 0) {
        alert("沒有資料可匯出");
        return false;
    }
    return true;
}

function escapeCsvValue(value: CellValue): string {
    if (value == null) return "";
    const str = String(value);
    return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function calculateColumnWidth(key: string, data: DataRow[]): number {
    const maxLen = Math.max(key.length, ...data.map((row) => String(row[key] ?? "").length));
    return Math.min(maxLen + 2, MAX_COLUMN_WIDTH);
}

function createWorksheet(data: DataRow[]): XLSX.WorkSheet {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const headers = Object.keys(data[0]);
    worksheet["!cols"] = headers.map((key) => ({ wch: calculateColumnWidth(key, data) }));
    return worksheet;
}

function saveWorkbook(workbook: XLSX.WorkBook, filename: string): void {
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: EXCEL_MIME_TYPE }), `${filename}.xlsx`);
}

export function exportToCSV(data: DataRow[], filename: string): void {
    if (!validateData(data)) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(",")),
    ];

    saveAs(new Blob([CSV_BOM + csvRows.join("\n")], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

export function exportToExcel(data: DataRow[], filename: string, sheetName = "Sheet1"): void {
    if (!validateData(data)) return;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, createWorksheet(data), sheetName);
    saveWorkbook(workbook, filename);
}

export function exportToExcelMultiSheet(sheets: { name: string; data: DataRow[] }[], filename: string): void {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        if (sheet.data.length > 0) {
            XLSX.utils.book_append_sheet(workbook, createWorksheet(sheet.data), sheet.name);
        }
    }

    saveWorkbook(workbook, filename);
}
