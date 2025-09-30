import React from 'react';
// Fix: Corrected import path for types
import { Account, AccountType } from '../types';
import PlusIcon from './icons/PlusIcon';
import BankIcon from './icons/BankIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import WalletIcon from './icons/WalletIcon';
import TrashIcon from './icons/TrashIcon';

interface AccountManagerProps {
    accounts: Account[];
    onAddAccount: () => void;
    onDeleteAccount: (id: number) => Promise<void>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

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
        if(window.confirm(`'${name}' hesabını silmek istediğinizden emin misiniz? Bu hesaba bağlı tüm işlemler de silinecektir.`)){
            onDeleteAccount(id);
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-700">Hesapları Yönet</h2>
                 <button
                    onClick={onAddAccount}
                    className="flex items-center text-sm text-indigo-600 font-semibold hover:text-indigo-800"
                >
                    <PlusIcon />
                    <span className="ml-1">Yeni Hesap</span>
                </button>
            </div>
            {accounts.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                    {accounts.map(account => (
                        <li key={account.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600">
                                    {getAccountIcon(account.type)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{account.name}</p>
                                    <p className={`text-sm ${account.balance >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                                        {formatCurrency(account.balance)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(account.id, account.name)}
                                className="text-slate-400 hover:text-red-600"
                            >
                                <TrashIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-10">
                    <p className="text-slate-500">Henüz hesap eklenmemiş.</p>
                </div>
            )}
        </div>
    );
};

export default AccountManager;
