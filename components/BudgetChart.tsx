import React, { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction, TransactionType, Category, Budget } from '../types';

interface BudgetChartProps {
  transactions: Transaction[];
  categories: Category[]; // Can be hierarchical or flat
  budgets: Budget[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ transactions, categories, budgets }) => {
  // Gelir/Gider karşılaştırma grafiği
  const incomeExpenseData = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      labels: ['Gelir', 'Gider'],
      datasets: [
        {
          label: 'Tutar (₺)',
          data: [totalIncome, totalExpense],
          backgroundColor: ['#8fc933', '#EF4444'],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    };
  }, [transactions]);

  // Bütçe vs Harcama karşılaştırması
  const budgetVsSpentData = useMemo(() => {
    const flatCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);
    
    const budgetComparison: { [key: string]: { budget: number, spent: number } } = {};
    
    // Bütçeleri ekle
    budgets.forEach(budget => {
      const category = flatCategories.find(c => c.id === budget.category_id);
      if (category) {
        const categoryName = category.name;
        if (!budgetComparison[categoryName]) {
          budgetComparison[categoryName] = { budget: 0, spent: 0 };
        }
        budgetComparison[categoryName].budget += budget.limit;
      }
    });
    
    // Harcamaları ekle
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category_id)
      .forEach(t => {
        const category = flatCategories.find(c => c.id === t.category_id);
        if (category) {
          const categoryName = category.name;
          if (!budgetComparison[categoryName]) {
            budgetComparison[categoryName] = { budget: 0, spent: 0 };
          }
          budgetComparison[categoryName].spent += t.amount;
        }
      });

    const labels = Object.keys(budgetComparison);
    const budgetValues = Object.values(budgetComparison).map(v => v.budget);
    const spentValues = Object.values(budgetComparison).map(v => v.spent);

    return {
      labels,
      datasets: [
        {
          label: 'Bütçe',
          data: budgetValues,
          backgroundColor: '#8fc933',
          borderColor: '#6fa821',
          borderWidth: 1,
        },
        {
          label: 'Harcama',
          data: spentValues,
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
          borderWidth: 1,
        },
      ],
    };
  }, [transactions, categories, budgets]);

  // Kategoriye göre gider dağılımı (mevcut)
  const expenseByCategoryData = useMemo(() => {
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
            '#8fc933', '#c2e870', '#568318', '#aadd4a',
            '#6fa821', '#d4f09a', '#3f6110', '#e6f7c4',
            '#f97316', '#fbbf24', '#ef4444', '#0ea5e9',
          ],
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    };
  }, [transactions, categories]);

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
    },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Gelir/Gider Karşılaştırması */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">💰</span>
          Gelir vs Gider
        </h3>
        {incomeExpenseData.labels.length > 0 ? (
          <div className="h-64">
            <Doughnut 
              data={incomeExpenseData} 
              options={{
                ...doughnutOptions,
                plugins: {
                  ...doughnutOptions.plugins,
                  title: {
                    ...doughnutOptions.plugins.title,
                    text: 'Aylık Gelir/Gider Dağılımı'
                  }
                }
              }} 
            />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">Gelir/Gider verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Bütçe vs Harcama Karşılaştırması */}
      {budgetVsSpentData.labels.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">📊</span>
            Bütçe vs Harcama
          </h3>
          <div className="h-80">
            <Bar 
              data={budgetVsSpentData} 
              options={{
                ...barOptions,
                plugins: {
                  ...barOptions.plugins,
                  title: {
                    ...barOptions.plugins.title,
                    text: 'Kategori Bazında Bütçe ve Harcama Karşılaştırması'
                  }
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Kategoriye Göre Gider Dağılımı */}
      {expenseByCategoryData.labels.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🎯</span>
            Gider Dağılımı
          </h3>
          <div className="h-64">
            <Doughnut 
              data={expenseByCategoryData} 
              options={{
                ...doughnutOptions,
                plugins: {
                  ...doughnutOptions.plugins,
                  title: {
                    ...doughnutOptions.plugins.title,
                    text: 'Kategori Bazında Gider Analizi'
                  }
                }
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetChart;