import React, { useMemo } from 'react';
import { Account, Transaction, Category, Budget, TransactionType, AccountType } from '../types';
import TransactionList from '../components/TransactionList';
import BudgetChart from '../components/BudgetChart';
import BankIcon from '../components/icons/BankIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import WalletIcon from '../components/icons/WalletIcon';
import { formatCurrency } from '../lib/currency';
import { useI18n } from '../lib/i18n';

interface HomeScreenProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    onDeleteTransaction: (id: number) => void;
    onEditTransaction?: (transaction: Transaction) => void;
}

const getAccountIcon = (type: AccountType) => {
    switch (type) {
        case AccountType.BANK:
            return <BankIcon />;
        case AccountType.CREDIT_CARD:
            return <CreditCardIcon />;
        case AccountType.CASH:
            return <WalletIcon />;
        default:
            return <WalletIcon />;
    }
};

const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
        case AccountType.CREDIT_CARD:
            return 'Kredi Kartı';
        case AccountType.BANK:
            return 'Banka Hesabı';
        case AccountType.CASH:
            return 'Nakit';
        default:
            return '';
    }
};

const HomeScreen: React.FC<HomeScreenProps> = ({
    accounts,
    transactions,
    categories,
    budgets,
    onDeleteTransaction,
    onEditTransaction,
}) => {
    const { t } = useI18n();
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
        <div className="space-y-4 animate-fade-in">
            {/* Balance Summary - Hero Card */}
            <div className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-xs text-brand-200 font-medium uppercase tracking-wider">{t('home.totalBalance')}</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(balance)}</p>
                <div className="flex gap-3 mt-5">
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span className="text-emerald-300 font-semibold text-sm">{formatCurrency(income)}</span>
                        </div>
                        <p className="text-xs text-brand-200 mt-1">{t('home.monthlyIncome')}</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span className="text-red-300 font-semibold text-sm">{formatCurrency(expense)}</span>
                        </div>
                        <p className="text-xs text-brand-200 mt-1">{t('home.monthlyExpense')}</p>
                    </div>
                </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-5">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('home.accounts')}</h3>
                {accounts.length > 0 ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                        {accounts.map((account) => (
                            <li key={account.id} className="flex items-center gap-3 py-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                    {getAccountIcon(account.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{account.name}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">{account.type === AccountType.CREDIT_CARD ? t('accounts.creditCard') : account.type === AccountType.BANK ? t('accounts.bankAccount') : account.type === AccountType.CASH ? t('accounts.cash') : ''}</p>
                                </div>
                                <p className={`${account.balance >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'} text-sm`}>
                                    {formatCurrency(account.balance)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">👛</div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{t('home.noAccounts')}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('home.addAccountHint')}</p>
                    </div>
                )}
            </div>

            {/* Budget Chart */}
            <BudgetChart transactions={transactions} categories={categories} budgets={budgets} />

            {/* Recent Transactions */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-5">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('list.recentTransactions')}</h3>
                <TransactionList
                    transactions={recentTransactions}
                    accounts={accounts}
                    categories={categories}
                    onDeleteTransaction={onDeleteTransaction}
                    onEditTransaction={onEditTransaction}
                />
            </div>
        </div>
    );
};

export default HomeScreen;
