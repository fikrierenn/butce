import React, { useMemo } from 'react';
import { Account, Transaction, Category, TransactionType } from '../types';
import BalanceSummary from '../components/BalanceSummary';
import AccountSummary from '../components/AccountSummary';
import TransactionList from '../components/TransactionList';
import BudgetChart from '../components/BudgetChart';

interface HomeScreenProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    onDeleteTransaction: (id: number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    accounts,
    transactions,
    categories,
    onDeleteTransaction,
}) => {
    const recentTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [transactions]);

    const { income, expense, balance } = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const thisMonthTransactions = transactions.filter(t => t.date >= firstDayOfMonth);

        const income = thisMonthTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = thisMonthTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        return { income, expense, balance };
    }, [transactions, accounts]);

    return (
        <div className="space-y-6">
            <BalanceSummary income={income} expense={expense} balance={balance} />
            <AccountSummary accounts={accounts} />
            <BudgetChart transactions={transactions} categories={categories} />
            <TransactionList
                transactions={recentTransactions}
                accounts={accounts}
                categories={categories}
                onDeleteTransaction={onDeleteTransaction}
            />
        </div>
    );
};

export default HomeScreen;