import React, { useState, useMemo } from 'react';
import { Account, Transaction, Category, TransactionType, AccountType } from '../types';
import TransactionList from '../components/TransactionList';
import { formatCurrency } from '../lib/currency';
import { useI18n } from '../lib/i18n';

interface TransactionsScreenProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    onDeleteTransaction: (id: number) => void;
    onEditTransaction?: (transaction: Transaction) => void;
}

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
    accounts,
    transactions,
    categories,
    onDeleteTransaction,
    onEditTransaction,
}) => {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [cashFlowMode, setCashFlowMode] = useState<'expense' | 'income'>('expense');
    const [filterAccountId, setFilterAccountId] = useState<string>('');
    const [filterCategoryId, setFilterCategoryId] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const flatCategories = useMemo(() =>
        categories.flatMap(c => [c, ...(c.subcategories || [])]),
        [categories]
    );

    // Cash Flow toggle'a bağlı tür filtresi
    const filterType = cashFlowMode === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME;

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (tx.type !== filterType) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchDesc = tx.description.toLowerCase().includes(q);
                const matchAmount = tx.amount.toString().includes(q);
                const catName = flatCategories.find(c => c.id === tx.category_id)?.name?.toLowerCase() || '';
                const accName = accounts.find(a => a.id === tx.account_id)?.name?.toLowerCase() || '';
                if (!matchDesc && !matchAmount && !catName.includes(q) && !accName.includes(q)) return false;
            }
            if (filterAccountId && tx.account_id !== parseInt(filterAccountId)) return false;
            if (filterCategoryId && tx.category_id !== parseInt(filterCategoryId)) return false;
            if (dateFrom && tx.date < dateFrom) return false;
            if (dateTo && tx.date > dateTo) return false;
            return true;
        });
    }, [transactions, filterType, searchQuery, filterAccountId, filterCategoryId, dateFrom, dateTo, flatCategories, accounts]);

    // Bu ayın toplamı
    const monthlyTotal = useMemo(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        return transactions
            .filter(tx => tx.type === filterType && tx.date >= firstDay)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }, [transactions, filterType]);

    // Öne çıkan hesap: en fazla işlemi olan veya ilk hesap
    const featuredAccount = useMemo(() => {
        if (accounts.length === 0) return null;
        const counts = new Map<number, number>();
        transactions.forEach(tx => {
            if (tx.account_id) counts.set(tx.account_id, (counts.get(tx.account_id) || 0) + 1);
        });
        const mostUsed = accounts
            .slice()
            .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))[0];
        return mostUsed || accounts[0];
    }, [accounts, transactions]);

    const accountTypeLabel = (type: AccountType) => {
        switch (type) {
            case AccountType.CREDIT_CARD: return 'Kredi Kartı';
            case AccountType.BANK: return 'Banka Hesabı';
            case AccountType.CASH: return 'Nakit';
            default: return '';
        }
    };

    const activeFilterCount = [
        filterAccountId !== '',
        filterCategoryId !== '',
        dateFrom !== '',
        dateTo !== '',
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterAccountId('');
        setFilterCategoryId('');
        setDateFrom('');
        setDateTo('');
    };

    const inputClass = "w-full px-3.5 py-2 bg-brand-50/50 dark:bg-slate-700/50 border border-brand-100 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500 transition-all";

    // Bu hesaba ait toplam işlem sayısı
    const featuredTxCount = useMemo(() => {
        if (!featuredAccount) return 0;
        return transactions.filter(tx => tx.account_id === featuredAccount.id).length;
    }, [featuredAccount, transactions]);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Gider / Gelir Toggle */}
            <div className="bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-card border border-brand-100 dark:border-slate-700 flex">
                <button
                    type="button"
                    onClick={() => setCashFlowMode('expense')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                        cashFlowMode === 'expense'
                            ? 'bg-brand-400 text-surface-dark shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Gider
                </button>
                <button
                    type="button"
                    onClick={() => setCashFlowMode('income')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                        cashFlowMode === 'income'
                            ? 'bg-brand-400 text-surface-dark shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Gelir
                </button>
            </div>

            {/* Aylık Toplam */}
            <div className="flex items-baseline justify-between px-1">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {cashFlowMode === 'expense' ? 'Bu Ay Gider' : 'Bu Ay Gelir'}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                        {formatCurrency(monthlyTotal)}
                    </p>
                </div>
            </div>

            {/* Öne çıkan hesap kartı */}
            {featuredAccount && (
                <div className="relative bg-gradient-to-br from-surface-dark via-[#142015] to-[#1a2a1a] rounded-3xl p-5 text-white shadow-card-hover overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-500/10" />
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-brand-500/5 to-transparent" />

                    <div className="relative">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">En Aktif Hesap</p>
                                <p className="text-lg font-bold text-white mt-0.5 truncate">
                                    {featuredAccount.name}
                                </p>
                            </div>
                            <div className="bg-brand-400/20 border border-brand-400/40 rounded-full px-3 py-1 shrink-0">
                                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">
                                    {accountTypeLabel(featuredAccount.type)}
                                </span>
                            </div>
                        </div>

                        {/* Kart numarası + son kullanma (sadece kredi kartı için) */}
                        {featuredAccount.type === AccountType.CREDIT_CARD && (featuredAccount.card_number || featuredAccount.expiry_date) && (
                            <div className="mt-5 flex items-center gap-4">
                                {featuredAccount.card_number && (
                                    <p className="text-base font-mono font-bold tracking-wider text-white/90">
                                        •••• •••• •••• {featuredAccount.card_number}
                                    </p>
                                )}
                                {featuredAccount.expiry_date && (
                                    <div className="ml-auto">
                                        <p className="text-[9px] text-white/50 uppercase tracking-wider">Son Kull.</p>
                                        <p className="text-xs font-bold text-white">{featuredAccount.expiry_date}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-5">
                            <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Bakiye</p>
                            <p className={`text-2xl font-bold tracking-tight mt-0.5 ${
                                featuredAccount.balance >= 0 ? 'text-brand-300' : 'text-red-400'
                            }`}>
                                {formatCurrency(featuredAccount.balance)}
                            </p>
                        </div>

                        {/* Kredi kartı için ekstre/ödeme günleri */}
                        {featuredAccount.type === AccountType.CREDIT_CARD && (featuredAccount.statement_date || featuredAccount.payment_due_date) && (
                            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                {featuredAccount.statement_date && (
                                    <div>
                                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Ekstre Kesim</p>
                                        <p className="text-sm font-bold text-white mt-0.5">
                                            Her ayın {featuredAccount.statement_date}.
                                        </p>
                                    </div>
                                )}
                                {featuredAccount.payment_due_date && (
                                    <div>
                                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Son Ödeme</p>
                                        <p className="text-sm font-bold text-white mt-0.5">
                                            Her ayın {featuredAccount.payment_due_date}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">Toplam İşlem</p>
                                <p className="text-sm font-bold text-white mt-0.5">{featuredTxCount}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFilterAccountId(String(featuredAccount.id))}
                                className="text-xs font-semibold text-brand-300 hover:text-brand-200 flex items-center gap-1"
                            >
                                Bu hesabı filtrele
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Geçmiş başlığı */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {cashFlowMode === 'expense' ? 'Gider Geçmişi' : 'Gelir Geçmişi'}
                </h3>
                <span className="text-xs text-slate-400">
                    {filteredTransactions.length} kayıt
                </span>
            </div>

            {/* Search + Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search.placeholder')}
                            className="w-full pl-9 pr-3.5 py-2.5 bg-brand-50/50 dark:bg-slate-700/50 border border-brand-100 dark:border-slate-600 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2.5 rounded-2xl border text-sm font-semibold transition-all flex items-center gap-1.5 ${
                            showFilters || activeFilterCount > 0
                                ? 'bg-brand-100 border-brand-200 text-brand-800'
                                : 'border-brand-100 text-slate-500 hover:bg-brand-50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {activeFilterCount > 0 && (
                            <span className="w-5 h-5 bg-brand-500 text-surface-dark text-xs rounded-full flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-3 pt-3 border-t border-brand-100 dark:border-slate-700 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={filterAccountId}
                                onChange={(e) => setFilterAccountId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">{t('search.allAccounts')}</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterCategoryId}
                                onChange={(e) => setFilterCategoryId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">{t('search.allCategories')}</option>
                                {flatCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{t('search.dateFrom')}</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{t('search.dateTo')}</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold">
                                {t('search.clearFilters')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <TransactionList
                transactions={filteredTransactions}
                accounts={accounts}
                categories={categories}
                onDeleteTransaction={onDeleteTransaction}
                onEditTransaction={onEditTransaction}
            />
        </div>
    );
};

export default TransactionsScreen;
