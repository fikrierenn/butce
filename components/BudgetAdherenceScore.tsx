import React, { useMemo } from 'react';
import { Budget, Transaction, TransactionType, Category } from '../types';

interface BudgetAdherenceScoreProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
}

const BudgetAdherenceScore: React.FC<BudgetAdherenceScoreProps> = ({ budgets, transactions, categories }) => {
    const score = useMemo(() => {
        if (budgets.length === 0) return null;

        const flatCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);
        let totalWeight = 0;
        let weightedScore = 0;

        budgets.forEach(budget => {
            const spent = transactions
                .filter(t => t.type === TransactionType.EXPENSE && t.category_id === budget.category_id)
                .reduce((sum, t) => sum + t.amount, 0);

            const ratio = budget.limit > 0 ? Math.max(0, (budget.limit - spent) / budget.limit) : 0;
            totalWeight += budget.limit;
            weightedScore += ratio * budget.limit;
        });

        return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    }, [budgets, transactions, categories]);

    if (score === null) return null;

    const color = score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'red';
    const colorClasses = {
        emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
        amber: { bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
        red: { bg: 'bg-red-50', ring: 'ring-red-200', text: 'text-red-700', bar: 'bg-red-500' },
    }[color];

    const label = score >= 80 ? 'Harika!' : score >= 50 ? 'Dikkatli Ol' : 'Bütçe Aşıldı';

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">🎯</span>
                Bütçe Uyum Skoru
            </h3>
            <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-2xl ${colorClasses.bg} ring-2 ${colorClasses.ring} flex flex-col items-center justify-center`}>
                    <span className={`text-2xl font-black ${colorClasses.text}`}>{score}</span>
                    <span className={`text-[10px] font-medium ${colorClasses.text} opacity-70`}>/100</span>
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-semibold ${colorClasses.text} mb-1`}>{label}</p>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colorClasses.bar} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{budgets.length} kategori bütçesi takip ediliyor</p>
                </div>
            </div>
        </div>
    );
};

export default BudgetAdherenceScore;
