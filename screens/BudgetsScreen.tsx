import React from 'react';
// Fix: Corrected import path for types
import { Budget, Transaction, Category } from '../types';
// Fix: Corrected import path for BudgetStatus
import BudgetStatus from '../components/BudgetStatus';
import BudgetChart from '../components/BudgetChart';

interface BudgetsScreenProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    onUpdateBudget: (id: number, limit: number) => Promise<void>;
    onDeleteBudget: (id: number) => Promise<void>;
}

const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
    budgets,
    transactions,
    categories,
    selectedMonth,
    setSelectedMonth,
    onUpdateBudget,
    onDeleteBudget,
}) => {
    return (
        <div className="space-y-6">
            {/* Ay seçici */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
                <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ay Seçin:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2.5 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(selectedMonth + '-01').toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long'
                        })}
                    </span>
                </div>
            </div>

            <BudgetStatus
                budgets={budgets}
                transactions={transactions}
                categories={categories}
                onUpdateBudget={onUpdateBudget}
                onDeleteBudget={onDeleteBudget}
            />
            <BudgetChart transactions={transactions} categories={categories} budgets={budgets} />
        </div>
    );
};

export default BudgetsScreen;
