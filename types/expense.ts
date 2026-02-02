export interface BankAccountView {
    bankName: string
    branchName: string | null
    accountNumber: string
    isActive: boolean
    [key: string]: unknown
}

export interface ExpenseItemView {
    id: string
    date: string | Date
    category: string
    description: string
    amount: number | string
    receiptUrl: string | null
    audit?: { isValid: boolean } | null
    [key: string]: unknown
}

export interface ExpenseReportView {
    id: string
    title: string
    description: string | null
    department: string | null
    status: string
    totalAmount: number | string
    createdAt: string | Date
    items: ExpenseItemView[]
    bankAccount: BankAccountView | null
    [key: string]: unknown
}
