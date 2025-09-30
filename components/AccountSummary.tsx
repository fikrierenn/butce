import React from 'react';
// Fix: Corrected import path for types
import { Account, AccountType } from '../types';
import BankIcon from './icons/BankIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import WalletIcon from './icons/WalletIcon';

interface AccountSummaryProps {
  accounts: Account[];
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

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">Hesaplar</h3>
      </div>
      {accounts.length > 0 ? (
        <ul className="space-y-4">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600">
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <p className="font-medium text-slate-700">{account.name}</p>
                  <p className="text-sm text-slate-500">
                    {account.type === AccountType.CREDIT_CARD ? 'Kredi Kartı' : account.type === AccountType.BANK ? 'Banka Hesabı' : 'Nakit'}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {formatCurrency(account.balance)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <p className="text-slate-500">Henüz hesap eklenmemiş.</p>
           <p className="text-sm text-slate-400 mt-2">Ayarlar sekmesinden yeni hesap ekleyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
};

export default AccountSummary;
