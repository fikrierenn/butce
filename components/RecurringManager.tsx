import React from 'react';
import {
    RecurringTransaction,
    RecurringFrequency,
    Category,
    Account,
    TransactionType,
} from '../types';
import { formatCurrency } from '../lib/currency';
import { useI18n } from '../lib/i18n';

interface RecurringManagerProps {
    recurringTransactions: RecurringTransaction[];
    categories: Category[];
    accounts: Account[];
    onAddRecurring: () => void;
    onToggleRecurring: (id: number, isActive: boolean) => Promise<void>;
    onDeleteRecurring: (id: number) => Promise<void>;
}

const frequencyLabels: Record<RecurringFrequency, string> = {
    [RecurringFrequency.DAILY]: 'Günlük',
    [RecurringFrequency.WEEKLY]: 'Haftalık',
    [RecurringFrequency.MONTHLY]: 'Aylık',
    [RecurringFrequency.YEARLY]: 'Yıllık',
};

const formatNextRunDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
    });
};

const typeColorMap: Record<TransactionType, { bg: string; text: string; amount: string }> = {
    [TransactionType.INCOME]: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        amount: 'text-emerald-600',
    },
    [TransactionType.EXPENSE]: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        amount: 'text-red-600',
    },
    [TransactionType.TRANSFER]: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        amount: 'text-slate-600',
    },
};

export default function RecurringManager({
    recurringTransactions,
    categories,
    accounts,
    onAddRecurring,
    onToggleRecurring,
    onDeleteRecurring,
}: RecurringManagerProps) {
    const { t } = useI18n();

    const frequencyLabelsI18n: Record<RecurringFrequency, string> = {
        [RecurringFrequency.DAILY]: t('recurring.daily'),
        [RecurringFrequency.WEEKLY]: t('recurring.weekly'),
        [RecurringFrequency.MONTHLY]: t('recurring.monthly'),
        [RecurringFrequency.YEARLY]: t('recurring.yearly'),
    };
    const getCategoryName = (categoryId: number | null): string => {
        if (!categoryId) return '';
        const findCategory = (cats: Category[]): string => {
            for (const cat of cats) {
                if (cat.id === categoryId) return cat.name;
                if (cat.subcategories) {
                    const found = findCategory(cat.subcategories);
                    if (found) return found;
                }
            }
            return '';
        };
        return findCategory(categories);
    };

    const getAccountName = (accountId: number | null): string => {
        if (!accountId) return '';
        return accounts.find((a) => a.id === accountId)?.name ?? '';
    };

    const getCategoryInitial = (categoryId: number | null): string => {
        const name = getCategoryName(categoryId);
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-slate-100/60 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">
                        🔄
                    </span>
                    <h2 className="text-base font-semibold text-slate-800">
                        {t('recurring.title')}
                    </h2>
                </div>
                <button
                    onClick={onAddRecurring}
                    className="text-xs text-brand-600 font-semibold hover:text-brand-700 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                >
                    {t('recurring.addNew')}
                </button>
            </div>

            {/* List or Empty State */}
            {recurringTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-3">
                        🔄
                    </div>
                    <p className="text-sm text-slate-600 font-medium mb-1">
                        {t('recurring.noRecurring')}
                    </p>
                    <p className="text-xs text-slate-400 text-center">
                        {t('recurring.hint')}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {recurringTransactions.map((item) => {
                        const colors = typeColorMap[item.type];
                        const accountName = getAccountName(item.account_id);
                        const amountPrefix =
                            item.type === TransactionType.INCOME
                                ? '+'
                                : item.type === TransactionType.EXPENSE
                                  ? '-'
                                  : '';

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                {/* Category Icon */}
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}
                                >
                                    <span className={`text-sm font-semibold ${colors.text}`}>
                                        {getCategoryInitial(item.category_id)}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <span className="text-xs text-slate-400">
                                            {frequencyLabelsI18n[item.frequency]}
                                        </span>
                                        {accountName && (
                                            <>
                                                <span className="text-xs text-slate-300">·</span>
                                                <span className="text-xs text-slate-400">
                                                    {accountName}
                                                </span>
                                            </>
                                        )}
                                        {item.next_run_date && (
                                            <>
                                                <span className="text-xs text-slate-300">·</span>
                                                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                                                    {formatNextRunDate(item.next_run_date)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <span
                                    className={`text-sm font-semibold ${colors.amount} flex-shrink-0`}
                                >
                                    {amountPrefix}
                                    {formatCurrency(item.amount)}
                                </span>

                                {/* Toggle Switch */}
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={item.is_active}
                                    onClick={() => onToggleRecurring(item.id, !item.is_active)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                                        item.is_active ? 'bg-brand-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                            item.is_active ? 'translate-x-4' : 'translate-x-0.5'
                                        }`}
                                    />
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={() => onDeleteRecurring(item.id)}
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    aria-label="Sil"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                        />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
