export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  HOUSING = 'Housing',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  HEALTH = 'Health',
  SALARY = 'Salary', // Income
  INVESTMENT = 'Investment', // Income
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: ExpenseCategory;
  description: string;
  type: TransactionType;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

