import React from 'react';
// Fix: Corrected import path for types
import { Account, Transaction, Category } from '../types';
// Fix: Corrected import path for TransactionList
import TransactionList from '../components/TransactionList';

interface TransactionsScreenProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    onDeleteTransaction: (id: number) => void;
}

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
    accounts,
    transactions,
    categories,
    onDeleteTransaction,
}) => {
    return (
        <div className="space-y-6">
            <TransactionList
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                onDeleteTransaction={onDeleteTransaction}
            />
        </div>
    );
};

export default TransactionsScreen;
