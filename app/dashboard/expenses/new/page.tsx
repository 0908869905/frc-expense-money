import React from "react";
import { ExpenseForm } from "@/components/expense-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Expense Report | Ultimate Expense",
  description: "Submit a new expense report for approval.",
};

export default function NewExpensePage() {
  return (
    <div className="container mx-auto max-w-5xl">
      <ExpenseForm />
    </div>
  );
}
