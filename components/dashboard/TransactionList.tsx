import React from 'react';
import { Transaction, TransactionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Coffee, Home, Zap, ShoppingBag, Briefcase, Activity } from 'lucide-react';
import { ExpenseCategory } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: ExpenseCategory) => {
  switch (category) {
    case ExpenseCategory.FOOD: return <Coffee className="h-4 w-4" />;
    case ExpenseCategory.HOUSING: return <Home className="h-4 w-4" />;
    case ExpenseCategory.UTILITIES: return <Zap className="h-4 w-4" />;
    case ExpenseCategory.ENTERTAINMENT: return <ShoppingBag className="h-4 w-4" />;
    case ExpenseCategory.SALARY: return <Briefcase className="h-4 w-4" />;
    case ExpenseCategory.HEALTH: return <Activity className="h-4 w-4" />;
    default: return <ArrowUpRight className="h-4 w-4" />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          You have {transactions.length} total transactions this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors group-hover:bg-muted",
                  transaction.type === 'INCOME' 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-primary/5 text-primary border-primary/10"
                )}>
                  {getCategoryIcon(transaction.category)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(transaction.date)} · {transaction.category}</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center text-sm font-medium",
                transaction.type === 'INCOME' ? "text-emerald-500" : "text-foreground"
              )}>
                {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
