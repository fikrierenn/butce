import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import PlusIcon from './icons/PlusIcon';
import BankIcon from './icons/BankIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import WalletIcon from './icons/WalletIcon';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency } from '../lib/currency';

interface AccountManagerProps {
    accounts: Account[];
    onAddAccount: () => void;
    onDeleteAccount: (id: number) => Promise<void>;
}

const getAccountIcon = (type: AccountType) => {
  switch (type) {
    case AccountType.BANK:
      return <BankIcon />;
    case AccountType.CREDIT_CARD:
      return <CreditCardIcon />;
    case AccountType.CASH:
      return <WalletIcon />;
    default:
      return <WalletIcon />;
  }
};

const AccountManager: React.FC<AccountManagerProps> = ({ accounts, onAddAccount, onDeleteAccount }) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleDelete = (id: number, name: string) => {
        if(window.confirm(`'${name}' hesabını silmek istediğinizden emin misiniz?`)){
            onDeleteAccount(id);
        }
    }

    const toggleExpand = (id: number) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-slate-800">Hesaplar</h2>
                 <button
                    onClick={onAddAccount}
                    className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-brand-50"
                >
                    <PlusIcon />
                    <span>Yeni Hesap</span>
                </button>
            </div>
            {accounts.length > 0 ? (
                <ul className="divide-y divide-brand-50">
                    {accounts.map(account => {
                        const isCredit = account.type === AccountType.CREDIT_CARD;
                        const hasCardDetails = isCredit && (
                            account.card_number || account.expiry_date ||
                            account.statement_date || account.payment_due_date ||
                            account.credit_limit != null
                        );
                        const isExpanded = expandedId === account.id;

                        return (
                            <li key={account.id} className="group py-3 -mx-2 px-2 rounded-2xl hover:bg-brand-50/50 transition-colors">
                                <div
                                    className={`flex items-center justify-between ${hasCardDetails ? 'cursor-pointer' : ''}`}
                                    onClick={hasCardDetails ? () => toggleExpand(account.id) : undefined}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-brand-100 text-brand-700 shrink-0">
                                            {getAccountIcon(account.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{account.name}</p>
                                            <p className={`text-xs ${account.balance >= 0 ? 'text-brand-700 font-bold' : 'text-red-500 font-bold'}`}>
                                                {formatCurrency(account.balance)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {hasCardDetails && (
                                            <svg
                                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(account.id, account.name); }}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1"
                                            aria-label="Sil"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                {/* Akordiyon: kredi kartı detayları */}
                                <div
                                    className={`grid transition-all duration-300 ease-out ${
                                        hasCardDetails && isExpanded
                                            ? 'grid-rows-[1fr] opacity-100 mt-3'
                                            : 'grid-rows-[0fr] opacity-0 mt-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        {hasCardDetails && (
                                            <div className="ml-14 p-3 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-1.5">
                                                {account.card_number && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">Kart No</span>
                                                        <span className="font-mono font-bold text-slate-800 tracking-wider">
                                                            •••• {account.card_number}
                                                        </span>
                                                    </div>
                                                )}
                                                {account.expiry_date && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">Son Kullanma</span>
                                                        <span className="font-bold text-slate-800">{account.expiry_date}</span>
                                                    </div>
                                                )}
                                                {account.statement_date && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">Ekstre Kesim</span>
                                                        <span className="font-bold text-slate-800">Her ayın {account.statement_date}.</span>
                                                    </div>
                                                )}
                                                {account.payment_due_date && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">Son Ödeme</span>
                                                        <span className="font-bold text-slate-800">Her ayın {account.payment_due_date}.</span>
                                                    </div>
                                                )}
                                                {account.credit_limit != null && (
                                                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-brand-100">
                                                        <span className="text-slate-500 font-medium">Limit</span>
                                                        <span className="font-bold text-slate-800">{formatCurrency(account.credit_limit)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                 <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <WalletIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Henüz hesap yok</p>
                    <p className="text-xs text-slate-400 mt-1">Hesap eklemek için yukarıdaki butona tıklayın</p>
                </div>
            )}
        </div>
    );
};

export default AccountManager;
