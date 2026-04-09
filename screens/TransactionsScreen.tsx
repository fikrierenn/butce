import React, { useState, useMemo } from 'react';
import { Account, Transaction, Category, TransactionType } from '../types';
import TransactionList from '../components/TransactionList';
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
    const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
    const [filterAccountId, setFilterAccountId] = useState<string>('');
    const [filterCategoryId, setFilterCategoryId] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const flatCategories = useMemo(() =>
        categories.flatMap(c => [c, ...(c.subcategories || [])]),
        [categories]
    );

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Metin arama
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchDesc = t.description.toLowerCase().includes(q);
                const matchAmount = t.amount.toString().includes(q);
                const catName = flatCategories.find(c => c.id === t.category_id)?.name?.toLowerCase() || '';
                const accName = accounts.find(a => a.id === t.account_id)?.name?.toLowerCase() || '';
                if (!matchDesc && !matchAmount && !catName.includes(q) && !accName.includes(q)) return false;
            }
            // Tip filtresi
            if (filterType !== 'all' && t.type !== filterType) return false;
            // Hesap filtresi
            if (filterAccountId && t.account_id !== parseInt(filterAccountId) && t.from_account_id !== parseInt(filterAccountId) && t.to_account_id !== parseInt(filterAccountId)) return false;
            // Kategori filtresi
            if (filterCategoryId && t.category_id !== parseInt(filterCategoryId)) return false;
            // Tarih filtresi
            if (dateFrom && t.date < dateFrom) return false;
            if (dateTo && t.date > dateTo) return false;
            return true;
        });
    }, [transactions, searchQuery, filterType, filterAccountId, filterCategoryId, dateFrom, dateTo, flatCategories, accounts]);

    const activeFilterCount = [
        filterType !== 'all',
        filterAccountId !== '',
        filterCategoryId !== '',
        dateFrom !== '',
        dateTo !== '',
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterType('all');
        setFilterAccountId('');
        setFilterCategoryId('');
        setDateFrom('');
        setDateTo('');
    };

    const inputClass = "w-full px-3.5 py-2 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all";

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Arama Barı */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-4">
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
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
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
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
                            showFilters || activeFilterCount > 0
                                ? 'bg-brand-50 border-brand-200 text-brand-700'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {t('search.filter')}
                        {activeFilterCount > 0 && (
                            <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filtreler */}
                {showFilters && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3 animate-fade-in">
                        {/* Tip Filtresi */}
                        <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 p-1">
                            {[
                                { value: 'all' as const, label: t('search.all') },
                                { value: TransactionType.EXPENSE, label: t('type.expense') },
                                { value: TransactionType.INCOME, label: t('type.income') },
                                { value: TransactionType.TRANSFER, label: t('type.transfer') },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setFilterType(value)}
                                    className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        filterType === value
                                            ? 'bg-white dark:bg-slate-600 text-brand-700 dark:text-brand-300 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Hesap + Kategori */}
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

                        {/* Tarih Aralığı */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{t('search.dateFrom')}</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">{t('search.dateTo')}</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Temizle */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                                {t('search.clearFilters')}
                            </button>
                        )}
                    </div>
                )}

                {/* Sonuç sayısı */}
                {(searchQuery || activeFilterCount > 0) && (
                    <p className="mt-2 text-xs text-slate-400">
                        {filteredTransactions.length} / {transactions.length} {t('search.showing')}
                    </p>
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
