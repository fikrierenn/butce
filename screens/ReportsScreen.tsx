import React, { useState } from 'react';
import { Budget, Transaction, Category, Account } from '../types';
import { useI18n } from '../lib/i18n';
import BudgetStatus from '../components/BudgetStatus';
import BudgetChart from '../components/BudgetChart';
import SpendingTrendChart from '../components/SpendingTrendChart';
import CategoryComparisonChart from '../components/CategoryComparisonChart';
import IncomeExpenseTrendChart from '../components/IncomeExpenseTrendChart';
import BudgetAdherenceScore from '../components/BudgetAdherenceScore';
import SpendingPrediction from '../components/SpendingPrediction';

interface ReportsScreenProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    onUpdateBudget: (id: number, limit: number) => Promise<void>;
    onDeleteBudget: (id: number) => Promise<void>;
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({
    budgets,
    transactions,
    categories,
    accounts,
    selectedMonth,
    setSelectedMonth,
    onUpdateBudget,
    onDeleteBudget,
}) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'budgets' | 'reports'>('reports');

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-1.5">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                            activeTab === 'reports'
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t('reports.reports')}
                    </button>
                    <button
                        onClick={() => setActiveTab('budgets')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                            activeTab === 'budgets'
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t('reports.budgets')}
                    </button>
                </div>
            </div>

            {/* Bütçeler Tab */}
            {activeTab === 'budgets' && (
                <div className="space-y-4">
                    {/* Ay seçici */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('reports.selectMonth')}:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3.5 py-2 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
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
            )}

            {/* Raporlar Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    {/* Üst Özet Kartları */}
                    <div className="grid grid-cols-2 gap-3">
                        <BudgetAdherenceScore budgets={budgets} transactions={transactions} categories={categories} />
                        <SpendingPrediction transactions={transactions} />
                    </div>

                    {/* Gelir vs Gider Trendi */}
                    <IncomeExpenseTrendChart transactions={transactions} />

                    {/* Aylık Harcama Trendi */}
                    <SpendingTrendChart transactions={transactions} />

                    {/* Kategori Karşılaştırma */}
                    <CategoryComparisonChart transactions={transactions} categories={categories} />
                </div>
            )}
        </div>
    );
};

export default ReportsScreen;
