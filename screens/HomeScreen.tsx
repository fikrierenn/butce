import React, { useMemo, useState, useRef } from 'react';
import { Account, Transaction, Category, Budget, TransactionType, AccountType } from '../types';
import TransactionList from '../components/TransactionList';
import BankIcon from '../components/icons/BankIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import WalletIcon from '../components/icons/WalletIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import { formatCurrency } from '../lib/currency';
import { useI18n } from '../lib/i18n';

interface HomeScreenProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    onDeleteTransaction: (id: number) => void;
    onEditTransaction?: (transaction: Transaction) => void;
    onAddTransactionClick?: (type?: TransactionType) => void;
    setActiveScreen?: (screen: string) => void;
}

const getAccountIcon = (type: AccountType) => {
    switch (type) {
        case AccountType.BANK: return <BankIcon />;
        case AccountType.CREDIT_CARD: return <CreditCardIcon />;
        case AccountType.CASH: return <WalletIcon />;
        default: return <WalletIcon />;
    }
};

const HomeScreen: React.FC<HomeScreenProps> = ({
    accounts,
    transactions,
    categories,
    budgets,
    onDeleteTransaction,
    onEditTransaction,
    onAddTransactionClick,
    setActiveScreen,
}) => {
    const { t } = useI18n();
    const [balanceHidden, setBalanceHidden] = useState(false);

    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    const { income, expense, balance, cashTotal, bankTotal, creditTotal, cashCount, bankCount, creditCount } = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const thisMonthTransactions = transactions.filter(tx => tx.date >= firstDayOfMonth);
        const income = thisMonthTransactions
            .filter(tx => tx.type === TransactionType.INCOME)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const expense = thisMonthTransactions
            .filter(tx => tx.type === TransactionType.EXPENSE)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        const cashAccounts = accounts.filter(a => a.type === AccountType.CASH);
        const bankAccounts = accounts.filter(a => a.type === AccountType.BANK);
        const creditAccounts = accounts.filter(a => a.type === AccountType.CREDIT_CARD);

        return {
            income,
            expense,
            balance,
            cashTotal: cashAccounts.reduce((s, a) => s + a.balance, 0),
            bankTotal: bankAccounts.reduce((s, a) => s + a.balance, 0),
            creditTotal: creditAccounts.reduce((s, a) => s + a.balance, 0),
            cashCount: cashAccounts.length,
            bankCount: bankAccounts.length,
            creditCount: creditAccounts.length,
        };
    }, [transactions, accounts]);

    // Balance slider
    const sliderRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    const balanceSlides = [
        {
            key: 'total',
            label: 'Toplam Bakiye',
            value: balance,
            subtitle: `${accounts.length} hesap`,
            gradient: 'from-brand-300 via-brand-400 to-brand-500',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            key: 'cash',
            label: 'Nakit',
            value: cashTotal,
            subtitle: `${cashCount} hesap`,
            gradient: 'from-emerald-300 via-emerald-400 to-brand-500',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            key: 'bank',
            label: 'Banka',
            value: bankTotal,
            subtitle: `${bankCount} hesap`,
            gradient: 'from-sky-300 via-brand-300 to-brand-400',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-1m0 0V5a2 2 0 012-2h2.945M12 20a2 2 0 01-2-2v-3.5h4V18a2 2 0 01-2 2zM3 21h18M3 10l9-6 9 6M5 10v10h14V10" />
                </svg>
            ),
        },
        {
            key: 'credit',
            label: 'Kredi Kartı',
            value: creditTotal,
            subtitle: `${creditCount} kart`,
            gradient: 'from-amber-300 via-brand-400 to-brand-500',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
    ];

    const handleSliderScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        if (idx !== activeSlide) setActiveSlide(idx);
    };

    const goToSlide = (i: number) => {
        if (!sliderRef.current) return;
        sliderRef.current.scrollTo({ left: i * sliderRef.current.clientWidth, behavior: 'smooth' });
    };

    const hideMask = '••••••';

    const quickActions = [
        {
            label: 'Gider Ekle',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            ),
            onClick: () => onAddTransactionClick?.(TransactionType.EXPENSE),
            bg: 'bg-red-100',
            iconColor: 'text-red-600',
        },
        {
            label: 'Gelir Ekle',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            ),
            onClick: () => onAddTransactionClick?.(TransactionType.INCOME),
            bg: 'bg-brand-100',
            iconColor: 'text-brand-700',
        },
        {
            label: 'Transfer',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            onClick: () => onAddTransactionClick?.(TransactionType.TRANSFER),
            bg: 'bg-sky-100',
            iconColor: 'text-sky-700',
        },
        {
            label: 'Raporlar',
            icon: <ChartBarIcon />,
            onClick: () => setActiveScreen?.('reports'),
            bg: 'bg-amber-100',
            iconColor: 'text-amber-700',
        },
    ];

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Balance Slider */}
            <div>
                <div
                    ref={sliderRef}
                    onScroll={handleSliderScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 gap-3 pb-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {balanceSlides.map((slide) => (
                        <div
                            key={slide.key}
                            className={`relative shrink-0 w-full snap-center bg-gradient-to-br ${slide.gradient} rounded-3xl p-6 shadow-card-hover overflow-hidden`}
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-white/5 rounded-full" />

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-surface-dark/80">
                                        {slide.icon}
                                        <p className="text-sm font-bold">{slide.label}</p>
                                    </div>
                                    <div className="bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                                        <span className="text-[11px] font-semibold text-surface-dark">
                                            {slide.subtitle}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-3">
                                    <p className="text-3xl font-bold text-surface-dark tracking-tight">
                                        {balanceHidden ? hideMask : formatCurrency(slide.value)}
                                    </p>
                                    {slide.key === 'total' && (
                                        <button
                                            type="button"
                                            onClick={() => setBalanceHidden(h => !h)}
                                            className="text-surface-dark/70 hover:text-surface-dark transition-colors"
                                            aria-label="Bakiyeyi gizle/göster"
                                        >
                                            {balanceHidden ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Gider/Gelir mini cards — sadece Toplam slide'ında */}
                                {slide.key === 'total' && (
                                    <div className="flex gap-3 mt-5">
                                        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                                                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-500 font-semibold">Bu Ay Gider</p>
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {balanceHidden ? hideMask : formatCurrency(expense)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-500 font-semibold">Bu Ay Gelir</p>
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {balanceHidden ? hideMask : formatCurrency(income)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Diğer slide'lar için alt bilgi */}
                                {slide.key !== 'total' && (
                                    <div className="mt-5 bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                                        <p className="text-[11px] font-semibold text-surface-dark/70">
                                            {slide.key === 'cash' && 'Elindeki nakit toplamı'}
                                            {slide.key === 'bank' && 'Banka hesaplarının toplamı'}
                                            {slide.key === 'credit' && (creditTotal < 0 ? 'Toplam kredi kartı borcu' : 'Kredi kartı bakiyesi')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Slider dots */}
                <div className="flex items-center justify-center gap-2 mt-3">
                    {balanceSlides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goToSlide(i)}
                            aria-label={`${i + 1}. slide'a git`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === activeSlide ? 'w-6 bg-brand-600' : 'w-1.5 bg-brand-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className="bg-white dark:bg-slate-800 rounded-2xl py-4 px-2 flex flex-col items-center gap-2 shadow-card border border-brand-100 dark:border-slate-700 hover:shadow-card-hover active:scale-95 transition-all"
                    >
                        <div className={`w-11 h-11 rounded-2xl ${action.bg} ${action.iconColor} flex items-center justify-center`}>
                            {action.icon}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Accounts */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {t('home.accounts')}
                    </h3>
                </div>
                {accounts.length > 0 ? (
                    <ul className="divide-y divide-brand-50 dark:divide-slate-700">
                        {accounts.map((account) => (
                            <li key={account.id} className="flex items-center gap-3 py-3">
                                <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
                                    {getAccountIcon(account.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{account.name}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        {account.type === AccountType.CREDIT_CARD ? t('accounts.creditCard')
                                            : account.type === AccountType.BANK ? t('accounts.bankAccount')
                                                : account.type === AccountType.CASH ? t('accounts.cash') : ''}
                                    </p>
                                </div>
                                <p className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-red-500'}`}>
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

            {/* Recent Transactions */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {t('list.recentTransactions')}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setActiveScreen?.('transactions')}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                    >
                        Tümü
                    </button>
                </div>
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
