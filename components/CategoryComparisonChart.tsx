import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Transaction, TransactionType, Category } from '../types';

interface CategoryComparisonChartProps {
    transactions: Transaction[];
    categories: Category[];
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];

const CategoryComparisonChart: React.FC<CategoryComparisonChartProps> = ({ transactions, categories }) => {
    const chartData = useMemo(() => {
        const flatCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);
        const categoryMap = new Map(flatCategories.map(c => [c.id, c.name]));
        const categorySpend: { [key: string]: number } = {};

        transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.category_id)
            .forEach(t => {
                const name = categoryMap.get(t.category_id!) || 'Diğer';
                categorySpend[name] = (categorySpend[name] || 0) + t.amount;
            });

        const sorted = Object.entries(categorySpend)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        return {
            labels: sorted.map(([name]) => name),
            datasets: [{
                label: 'Harcama (₺)',
                data: sorted.map(([, amount]) => amount),
                backgroundColor: sorted.map((_, i) => COLORS[i % COLORS.length]),
                borderRadius: 8,
                borderSkipped: false,
            }],
        };
    }, [transactions, categories]);

    if (chartData.labels.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-sm">🏷️</span>
                En Çok Harcanan Kategoriler
            </h3>
            <div className="h-56">
                <Bar data={chartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y' as const,
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value: any) => '₺' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)
                            },
                            grid: { color: 'rgba(0,0,0,0.04)' }
                        },
                        y: { grid: { display: false } }
                    },
                }} />
            </div>
        </div>
    );
};

export default CategoryComparisonChart;
