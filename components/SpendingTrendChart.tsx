import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Transaction, TransactionType } from '../types';

interface SpendingTrendChartProps {
    transactions: Transaction[];
    monthsBack?: number;
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ transactions, monthsBack = 6 }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const months: string[] = [];
        const data: number[] = [];

        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-CA').slice(0, 7);
            const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
            months.push(label);

            const total = transactions
                .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(key))
                .reduce((sum, t) => sum + t.amount, 0);
            data.push(total);
        }

        return {
            labels: months,
            datasets: [{
                label: 'Harcama (₺)',
                data,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }],
        };
    }, [transactions, monthsBack]);

    return (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-card border border-slate-100/60">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">📈</span>
                Aylık Harcama Trendi
            </h3>
            {chartData.datasets[0].data.some(d => d > 0) ? (
                <div className="h-56">
                    <Line data={chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value: any) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)
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

export default SpendingTrendChart;
