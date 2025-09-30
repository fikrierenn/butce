import React, { useState, FormEvent } from 'react';
// Fix: Corrected import path for types
import { AccountType, Account } from '../types';
import CloseIcon from './icons/CloseIcon';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (account: Omit<Account, 'id' | 'user_id'>) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.BANK);
    const [balance, setBalance] = useState('');
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            type,
            balance: parseFloat(balance) || 0
        });
        setName('');
        setType(AccountType.BANK);
        setBalance('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Yeni Hesap Ekle</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-slate-700">Hesap Adı</label>
                        <input
                            id="accountName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-slate-700">Hesap Tipi</label>
                        <select
                            id="accountType"
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value={AccountType.BANK}>Banka Hesabı</option>
                            <option value={AccountType.CREDIT_CARD}>Kredi Kartı</option>
                            <option value={AccountType.CASH}>Nakit</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-slate-700">Başlangıç Bakiyesi</label>
                         <input
                            id="initialBalance"
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            required
                            placeholder="0"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                     <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Hesap Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;
