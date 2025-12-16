"use client"

import { DataTable as BaseDataTable } from "@/components/ui/data-table"
import { getColumns, Report } from "./columns"

interface DashboardTableProps {
    data: Report[]
    userRole: string
}

export function DashboardTable({ data, userRole }: DashboardTableProps) {
    return <BaseDataTable columns={getColumns(userRole)} data={data} />
}
