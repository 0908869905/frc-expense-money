import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { Transaction } from './types';
import { Button } from './components/ui/Button';
import { cn } from './lib/utils';
import { LayoutDashboard, Receipt, Settings, Plus, Sun, Moon, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-6 h-14 flex items-center border-b">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
              U
            </div>
            UltimateExpense
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab('transactions')}
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </nav>
        <div className="p-4 border-t">
           <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-card/50 backdrop-blur px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-semibold capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              className="gap-2"
              onClick={() => window.location.href = '/dashboard/expenses/new'}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
            
            {activeTab === 'transactions' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">History</h2>
                </div>
                {transactions.length > 0 ? (
                  <TransactionList transactions={transactions} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <p className="mb-2">No transactions yet.</p>
                    <Button variant="link" onClick={() => window.location.href = '/dashboard/expenses/new'}>
                      Create your first expense report
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}