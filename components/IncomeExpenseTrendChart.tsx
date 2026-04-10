import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Transaction, TransactionType } from '../types';

interface IncomeExpenseTrendChartProps {
    transactions: Transaction[];
    monthsBack?: number;
}

const IncomeExpenseTrendChart: React.FC<IncomeExpenseTrendChartProps> = ({ transactions, monthsBack = 6 }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const months: string[] = [];
        const incomeData: number[] = [];
        const expenseData: number[] = [];

        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-CA').slice(0, 7);
            const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
            months.push(label);

            const income = transactions
                .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(key))
                .reduce((sum, t) => sum + t.amount, 0);
            incomeData.push(income);

            const expense = transactions
                .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(key))
                .reduce((sum, t) => sum + t.amount, 0);
            expenseData.push(expense);
        }

        return {
            labels: months,
            datasets: [
                {
                    label: 'Gelir',
                    data: incomeData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                },
                {
                    label: 'Gider',
                    data: expenseData,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                },
            ],
        };
    }, [transactions, monthsBack]);

    const hasData = chartData.datasets.some(ds => ds.data.some(d => d > 0));

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">💰</span>
                Gelir vs Gider Trendi
            </h3>
            {hasData ? (
                <div className="h-56">
                    <Line data={chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top' as const,
                                labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 12 } }
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value: any) => '₺' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)
                                },
                                grid: { color: 'rgba(0,0,0,0.04)' }
                            },
                            x: { grid: { display: false } }
                        },
                    }} />
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8 text-sm">Henüz veri yok</p>
            )}
        </div>
    );
};

export default IncomeExpenseTrendChart;
