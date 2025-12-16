"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { approveReport, rejectReport } from "@/app/actions/approvals"
import { Check, X, Eye, Loader2 } from "lucide-react"
import { useTransition, useState } from "react"

export type Report = {
  id: string
  title: string
  totalAmount: number
  status: string
  createdAt: Date
  submitter: {
    name: string | null
    email: string | null
  }
}

// Helper component for action buttons to manage transition state
const ActionCell = ({ report, userRole }: { report: Report; userRole: string }) => {
  const [isPending, startTransition] = useTransition()
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveReport(report.id)
      } catch (error) {
        alert("Failed to approve")
      }
    })
  }

  const handleReject = () => {
    if (!rejectReason) return
    startTransition(async () => {
      try {
        await rejectReport(report.id, rejectReason)
        setShowRejectInput(false)
      } catch (error) {
        alert("Failed to reject")
      }
    })
  }

  const canApprove =
    (report.status === "PENDING_MANAGER" && (userRole === "MANAGER" || userRole === "ADMIN")) ||
    (report.status === "PENDING_FINANCE" && (userRole === "FINANCE" || userRole === "ADMIN"))

  const canReject =
    (report.status === "PENDING_MANAGER" && (userRole === "MANAGER" || userRole === "ADMIN")) ||
    (report.status === "PENDING_FINANCE" && (userRole === "FINANCE" || userRole === "ADMIN"))

  if (!canApprove && !canReject) {
     return <div className="text-muted-foreground text-xs italic">Read Only</div>
  }

  if (showRejectInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason..."
          className="h-8 w-32 rounded border bg-background px-2 text-xs"
          autoFocus
        />
        <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending || !rejectReason} className="h-8 w-8 p-0">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)} className="h-8 w-8 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-green-200 hover:bg-green-100 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-900/30"
          onClick={handleApprove}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Approve
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-destructive hover:bg-destructive/10"
          onClick={() => setShowRejectInput(true)}
          disabled={isPending}
        >
          <X className="h-3 w-3 mr-1" />
          Reject
        </Button>
      )}
    </div>
  )
}

export const getColumns = (userRole: string): ColumnDef<Report>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
  },
  {
    accessorKey: "submitter",
    header: "Submitted By",
    cell: ({ row }) => {
      const submitter = row.original.submitter
      return <span>{submitter.name || submitter.email}</span>
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"))
      return <span className="font-bold">{formatCurrency(amount)}</span>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue("createdAt"))}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "PAID"
              ? "success"
              : status === "REJECTED"
              ? "destructive"
              : status === "DRAFT"
              ? "secondary"
              : "default"
          }
        >
          {status.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionCell report={row.original} userRole={userRole} />,
  },
]
