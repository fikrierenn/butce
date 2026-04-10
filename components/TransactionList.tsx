import React, { useState } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import TrashIcon from './icons/TrashIcon';
import TransferIcon from './icons/TransferIcon';
import { formatCurrency, formatDate } from '../lib/currency';
import { useI18n } from '../lib/i18n';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDeleteTransaction: (id: number) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}



const TransactionItem: React.FC<{
  transaction: Transaction;
  accountName?: string;
  fromAccountName?: string;
  toAccountName?: string;
  categoryPath?: string;
  onDelete: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
}> = ({ transaction, accountName, fromAccountName, toAccountName, categoryPath, onDelete, onEdit }) => {
  const { t } = useI18n();
  const { id, type, description, amount, date } = transaction;

  const getIcon = () => {
    if (type === TransactionType.TRANSFER) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <TransferIcon />
        </div>
      );
    }
    const isIncome = type === TransactionType.INCOME;
    const bgColor = isIncome ? 'bg-brand-100' : 'bg-red-50';
    const textColor = isIncome ? 'text-brand-700' : 'text-red-500';

    return (
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bgColor} ${textColor} font-bold`}>
            {categoryPath?.charAt(0).toUpperCase() || '?'}
        </div>
    )
  };

  const getTitle = () => {
    if (type === TransactionType.TRANSFER) {
      return `Transfer: ${fromAccountName} -> ${toAccountName}`;
    }
    
    // Description zaten taksit bilgisi içeriyorsa tekrar ekleme
    return description;
  };

  const getSubtitle = () => {
    if (type === TransactionType.TRANSFER) {
      return description || "Hesaplar arası transfer";
    }
    
    // Taksitli işlem için özel subtitle
    if (transaction.is_installment && transaction.installment_count && transaction.installment_current) {
      return `${categoryPath || t('list.uncategorized')} · ${accountName || t('list.noAccount')} · ${t('list.installments')}`;
    }

    return `${categoryPath || t('list.uncategorized')} · ${accountName || t('list.noAccount')}`;
  };

  const amountColor = type === TransactionType.INCOME ? 'text-brand-700 font-bold' : type === TransactionType.EXPENSE ? 'text-red-500 font-bold' : 'text-slate-500';
  const amountPrefix = type === TransactionType.INCOME ? '+' : type === TransactionType.EXPENSE ? '-' : '';

  // Taksitli işlem için özel styling
  const isInstallment = transaction.is_installment && transaction.installment_count && transaction.installment_current;
  const installmentBorder = isInstallment ? 'border-l-4 border-l-brand-500' : '';

  return (
    <li className={`flex items-center justify-between py-3.5 group ${installmentBorder}`}>
      <div className="flex items-center space-x-4">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{getTitle()}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{getSubtitle()}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-right">
          <p className={`text-sm ${amountColor}`}>{amountPrefix}{formatCurrency(amount)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(date)}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-150">
          {onEdit && (
            <button
              onClick={() => onEdit(transaction)}
              className="text-slate-400 hover:text-brand-600"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="text-slate-400 hover:text-red-600"
            title={t('common.delete')}
          >
            <TrashIcon />
        </button>
        </div>
      </div>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, accounts, categories, onDeleteTransaction, onEditTransaction }) => {
  const { t } = useI18n();
  const [expandedInstallments, setExpandedInstallments] = useState<Set<number>>(new Set());

  const getCategoryPath = (categoryId: number | null): string => {
    if (!categoryId) return t('list.uncategorized');
    for (const parent of categories) {
        if (parent.id === categoryId) return parent.name;
        if (parent.subcategories) {
            for (const sub of parent.subcategories) {
                if (sub.id === categoryId) return `${parent.name} / ${sub.name}`;
            }
        }
    }
    return t('list.uncategorized');
  };
  
  const getAccountName = (accountId: number | null | undefined): string | undefined => {
      return accounts.find(a => a.id === accountId)?.name;
  };

  // Taksitli işlemleri grupla
  const groupInstallmentTransactions = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    const standalone: Transaction[] = [];
    const processedIds = new Set<number>();

    transactions.forEach(transaction => {
      // Zaten işlenmişse atla
      if (processedIds.has(transaction.id)) return;

      if (transaction.is_installment) {
        // Taksitli işlem - aynı seriyi bul
        const baseDescription = transaction.description.split(' (')[0];
        const series = transactions.filter(t => 
          t.is_installment && 
          t.installment_count === transaction.installment_count &&
          t.description.split(' (')[0] === baseDescription
        );
        
        if (series.length > 1) {
          // Seriyi parent ID'sine göre grupla (ilk taksit parent olur)
          const firstInstallment = series.find(t => t.installment_current === 1) || series[0];
          const parentKey = firstInstallment.id.toString();
          
          // Seriyi sırala
          series.sort((a, b) => (a.installment_current || 0) - (b.installment_current || 0));
          grouped[parentKey] = series;
          
          // İşlenmiş olarak işaretle
          series.forEach(t => processedIds.add(t.id));
        } else {
          // Tek taksit - standalone olarak ekle
          standalone.push(transaction);
          processedIds.add(transaction.id);
        }
      } else {
        // Normal işlem
        standalone.push(transaction);
        processedIds.add(transaction.id);
      }
    });

    return { grouped, standalone };
  };

// Akordiyon taksit grubu bileşeni
const InstallmentGroup: React.FC<{
  transactions: Transaction[];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  getAccountName: (id: number | null | undefined) => string | undefined;
  getCategoryPath: (id: number | null) => string;
}> = ({ transactions, isExpanded, onToggle, onDelete, onEdit, getAccountName, getCategoryPath }) => {
  const { t } = useI18n();
  if (transactions.length === 0) return null;
  
  const mainTransaction = transactions[0];
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  return (
    <li className="border-l-4 border-l-brand-500">
      <div
        className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-brand-50/50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 font-bold">
            {getCategoryPath(mainTransaction.category_id)?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {mainTransaction.description.split(' (')[0]}
              <span className="text-brand-600 ml-1.5 text-xs font-medium">({transactions.length} {t('list.installments')})</span>
            </p>
            <p className="text-xs text-slate-400">
              {getCategoryPath(mainTransaction.category_id)} · {getAccountName(mainTransaction.account_id)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="text-right">
            <p className="text-sm font-semibold text-red-500">-{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-slate-400">{t('list.total')}</p>
          </div>
          <div className="ml-3">
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-14 pb-3 space-y-1">
          {transactions.map(transaction => (
            <div key={transaction.id} className="group flex items-center justify-between py-2 border-l-2 border-l-slate-200 dark:border-l-slate-600 pl-4 rounded-r-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{transaction.description}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(transaction.date)}</p>
              </div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mr-3">-{formatCurrency(transaction.amount)}</p>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                      className="text-slate-400 hover:text-brand-600 p-1"
                      title={t('common.edit')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title={t('common.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </li>
  );
};

  const toggleInstallment = (parentId: number) => {
    const newExpanded = new Set(expandedInstallments);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedInstallments(newExpanded);
  };

  const { grouped, standalone } = groupInstallmentTransactions();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 overflow-hidden">
      {(Object.keys(grouped).length > 0 || standalone.length > 0) ? (
        <ul className="divide-y divide-brand-50 dark:divide-slate-700 px-5">
          {/* Taksitli işlem grupları */}
          {Object.entries(grouped).map(([parentId, groupTransactions]) => (
            <InstallmentGroup
              key={parentId}
              transactions={groupTransactions}
              isExpanded={expandedInstallments.has(parseInt(parentId))}
              onToggle={() => toggleInstallment(parseInt(parentId))}
              onDelete={onDeleteTransaction}
              onEdit={onEditTransaction}
              getAccountName={getAccountName}
              getCategoryPath={getCategoryPath}
            />
          ))}
          
          {/* Tekil işlemler */}
          {standalone.map(t => (
            <TransactionItem
              key={t.id}
              transaction={t}
              accountName={getAccountName(t.account_id)}
              fromAccountName={getAccountName(t.from_account_id)}
              toAccountName={getAccountName(t.to_account_id)}
              categoryPath={getCategoryPath(t.category_id)}
              onDelete={onDeleteTransaction}
              onEdit={onEditTransaction}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 px-5">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('list.noTransactions')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('list.addTransactionHint')}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
