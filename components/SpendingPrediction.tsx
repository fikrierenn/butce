import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface SpendingPredictionProps {
    transactions: Transaction[];
    monthsBack?: number;
}

const SpendingPrediction: React.FC<SpendingPredictionProps> = ({ transactions, monthsBack = 6 }) => {
    const prediction = useMemo(() => {
        const now = new Date();
        const monthlyData: number[] = [];

        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-CA').slice(0, 7);
            const total = transactions
                .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(key))
                .reduce((sum, t) => sum + t.amount, 0);
            monthlyData.push(total);
        }

        // En az 2 ay veri gerekli
        if (monthlyData.filter(d => d > 0).length < 2) return null;

        const n = monthlyData.length;
        const x = monthlyData.map((_, i) => i);
        const y = monthlyData;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
        const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const predicted = Math.max(0, slope * n + intercept);

        const lastMonth = monthlyData[monthlyData.length - 1];
        const diff = predicted - lastMonth;
        const diffPercent = lastMonth > 0 ? ((diff / lastMonth) * 100).toFixed(0) : '0';

        return {
            predicted: Math.round(predicted),
            lastMonth: Math.round(lastMonth),
            diff: Math.round(diff),
            diffPercent,
            isIncrease: diff > 0,
        };
    }, [transactions, monthsBack]);

    if (!prediction) return null;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-sm">🔮</span>
                Harcama Tahmini
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-slate-800">
                    ₺{prediction.predicted.toLocaleString('tr-TR')}
                </span>
                <span className="text-sm text-slate-400">gelecek ay tahmini</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    prediction.isIncrease
                        ? 'bg-red-50 text-red-600'
                        : 'bg-green-50 text-green-600'
                }`}>
                    {prediction.isIncrease ? '↑' : '↓'} %{Math.abs(parseInt(prediction.diffPercent))}
                </span>
                <span className="text-xs text-slate-400">
                    bu aya göre ({prediction.isIncrease ? '+' : ''}₺{prediction.diff.toLocaleString('tr-TR')})
                </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-3 italic">* Son {monthsBack} aya dayalı lineer regresyon tahmini</p>
        </div>
    );
};

export default SpendingPrediction;
