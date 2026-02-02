import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ExpenseForm } from "@/components/expense-form"
import { getBankAccounts } from "@/app/actions/bank-accounts"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Expense Report | Ultimate Expense",
  description: "Submit a new expense report for approval.",
};

export default async function NewExpensePage(): Promise<React.JSX.Element> {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const bankAccounts = await getBankAccounts()

  return (
    <div className="container mx-auto max-w-5xl">
      <ExpenseForm bankAccounts={bankAccounts} />
    </div>
  )
}
