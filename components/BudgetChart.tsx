import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Transaction, TransactionType, Category } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface BudgetChartProps {
  transactions: Transaction[];
  categories: Category[]; // Can be hierarchical or flat
}

const BudgetChart: React.FC<BudgetChartProps> = ({ transactions, categories }) => {
  const chartData = useMemo(() => {
    // Flatten categories to handle hierarchical structure
    const flatCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);
    
    const expenseByCategory: { [key: string]: number } = {};
    const getCategoryName = (id: number | null | undefined) => flatCategories.find(c => c.id === id)?.name || 'Diğer';

    transactions
      .filter((t) => t.type === TransactionType.EXPENSE && t.category_id)
      .forEach((t) => {
        const categoryName = getCategoryName(t.category_id);
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + t.amount;
      });

    const labels = Object.keys(expenseByCategory);
    const data = Object.values(expenseByCategory);

    return {
      labels,
      datasets: [
        {
          label: 'Giderler',
          data,
          backgroundColor: [
            '#4F46E5', '#EF4444', '#10B981', '#F59E0B',
            '#6366F1', '#F87171', '#34D399', '#FBBF24',
            '#818CF8', '#FCA5A5', '#6EE7B7', '#FCD34D',
          ],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    };
  }, [transactions, categories]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Kategoriye Göre Gider Dağılımı',
        font: {
          size: 18,
        },
        padding: {
            top: 10,
            bottom: 20
        }
      },
    },
    cutout: '60%',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
        {chartData.labels.length > 0 ? (
            <Doughnut data={chartData} options={options} />
        ) : (
            <div className="text-center py-10">
                <p className="text-slate-500">Gider verisi bulunamadı.</p>
            </div>
        )}
    </div>
  );
};

export default BudgetChart;