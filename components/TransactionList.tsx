import React from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import TrashIcon from './icons/TrashIcon';
import TransferIcon from './icons/TransferIcon';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[]; // Hierarchical categories
  onDeleteTransaction: (id: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const TransactionItem: React.FC<{
  transaction: Transaction;
  accountName?: string;
  fromAccountName?: string;
  toAccountName?: string;
  categoryPath?: string;
  onDelete: (id: number) => void;
}> = ({ transaction, accountName, fromAccountName, toAccountName, categoryPath, onDelete }) => {
  const { id, type, description, amount, date } = transaction;

  const getIcon = () => {
    if (type === TransactionType.TRANSFER) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <TransferIcon />
        </div>
      );
    }
    const isIncome = type === TransactionType.INCOME;
    const bgColor = isIncome ? 'bg-green-100' : 'bg-red-100';
    const textColor = isIncome ? 'text-green-600' : 'text-red-600';
    
    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor} ${textColor} font-bold`}>
            {categoryPath?.charAt(0).toUpperCase() || '?'}
        </div>
    )
  };

  const getTitle = () => {
    if (type === TransactionType.TRANSFER) {
      return `Transfer: ${fromAccountName} -> ${toAccountName}`;
    }
    return description;
  };

  const getSubtitle = () => {
    if (type === TransactionType.TRANSFER) {
      return description || "Hesaplar arası transfer";
    }
    return `${categoryPath || 'Kategorisiz'} · ${accountName || 'Hesap Yok'}`;
  };

  const amountColor = type === TransactionType.INCOME ? 'text-green-600' : type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-slate-500';
  const amountPrefix = type === TransactionType.INCOME ? '+' : type === TransactionType.EXPENSE ? '-' : '';

  return (
    <li className="flex items-center justify-between py-4 group">
      <div className="flex items-center space-x-4">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">{getTitle()}</p>
          <p className="text-sm text-slate-500">{getSubtitle()}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-right">
          <p className={`text-sm font-semibold ${amountColor}`}>{amountPrefix}{formatCurrency(amount)}</p>
          <p className="text-xs text-slate-400">{formatDate(date)}</p>
        </div>
        <button onClick={() => onDelete(id)} className="ml-4 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <TrashIcon />
        </button>
      </div>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, accounts, categories, onDeleteTransaction }) => {

  const getCategoryPath = (categoryId: number | null): string => {
    if (!categoryId) return 'Kategorisiz';
    for (const parent of categories) {
        if (parent.id === categoryId) return parent.name;
        if (parent.subcategories) {
            for (const sub of parent.subcategories) {
                if (sub.id === categoryId) return `${parent.name} / ${sub.name}`;
            }
        }
    }
    return 'Bilinmeyen';
  };
  
  const getAccountName = (accountId: number | null | undefined): string | undefined => {
      return accounts.find(a => a.id === accountId)?.name;
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Son İşlemler</h3>
      </div>
      {transactions.length > 0 ? (
        <ul className="divide-y divide-slate-200 px-6">
          {transactions.map(t => (
            <TransactionItem
              key={t.id}
              transaction={t}
              accountName={getAccountName(t.account_id)}
              fromAccountName={getAccountName(t.from_account_id)}
              toAccountName={getAccountName(t.to_account_id)}
              categoryPath={getCategoryPath(t.category_id)}
              onDelete={onDeleteTransaction}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 px-6">
          <p className="text-slate-500">Henüz işlem bulunmuyor.</p>
          <p className="text-sm text-slate-400 mt-2">İlk işleminizi eklemek için '+' düğmesine dokunun.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
