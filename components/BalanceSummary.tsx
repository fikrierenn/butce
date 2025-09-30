import React from 'react';

interface BalanceSummaryProps {
  income: number;
  expense: number;
  balance: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ income, expense, balance }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
        <div>
          <h3 className="text-sm font-medium text-slate-500">Bu Ay Gelir</h3>
          <p className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(income)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Bu Ay Gider</h3>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(expense)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">Toplam Bakiye</h3>
          <p className="mt-1 text-2xl font-semibold text-indigo-600">{formatCurrency(balance)}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSummary;