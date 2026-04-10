import React from 'react';
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

    const handleDelete = (id: number, name: string) => {
        if(window.confirm(`'${name}' hesabını silmek istediğinizden emin misiniz?`)){
            onDeleteAccount(id);
        }
    }

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
                <ul className="divide-y divide-slate-100">
                    {accounts.map(account => (
                        <li key={account.id} className="group flex items-center justify-between py-3 -mx-2 px-2 rounded-xl hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 text-brand-600">
                                    {getAccountIcon(account.type)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{account.name}</p>
                                    <p className={`text-xs ${account.balance >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}`}>
                                        {formatCurrency(account.balance)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(account.id, account.name)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-150"
                            >
                                <TrashIcon />
                            </button>
                        </li>
                    ))}
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
