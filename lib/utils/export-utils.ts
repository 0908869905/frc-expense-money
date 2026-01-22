"use client";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ?ØÂá∫??CSV
export function exportToCSV(data: Record<string, any>[], filename: string) {
    if (data.length === 0) {
        alert("Ê≤íÊ?Ë≥áÊ??ØÂåØ??);
        return;
    }

    // ?ñÂ?Ê¨Ñ‰?Ê®ôÈ?
    const headers = Object.keys(data[0]);

    // Âª∫Á? CSV ?ßÂÆπ
    const csvContent = [
        headers.join(","),
        ...data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                // ?ïÁ??ÖÂê´?óË??ñÊ?Ë°åÁ???
                if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? "";
            }).join(",")
        ),
    ].join("\n");

    // ?†ÂÖ• BOM ‰ª•ÊîØ?¥‰∏≠??
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
}

// ?ØÂá∫??Excel
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName?: string) {
    if (data.length === 0) {
        alert("Ê≤íÊ?Ë≥áÊ??ØÂåØ??);
        return;
    }

    // Âª∫Á?Â∑•‰?Ë°?
    const worksheet = XLSX.utils.json_to_sheet(data);

    // ?™Â?Ë™øÊï¥Ê¨ÑÂØ¨
    const maxWidth = 50;
    const colWidths = Object.keys(data[0]).map((key) => {
        const maxLen = Math.max(
            key.length,
            ...data.map((row) => String(row[key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // Âª∫Á?Â∑•‰?Á∞?
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

    // ?ØÂá∫
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${filename}.xlsx`);
}

// ?ØÂá∫Â§öÂÄãÂ∑•‰ΩúË°®
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

