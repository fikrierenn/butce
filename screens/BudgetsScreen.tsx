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
    onUpdateBudget: (id: number, limit: number) => Promise<void>;
    onDeleteBudget: (id: number) => Promise<void>;
}

const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
    budgets,
    transactions,
    categories,
    onUpdateBudget,
    onDeleteBudget,
}) => {
    return (
        <div className="space-y-6">
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
