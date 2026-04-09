import React, { useState, FormEvent, useEffect } from 'react';
import { AccountType, Account } from '../types';
import CloseIcon from './icons/CloseIcon';

interface EditAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (account: Omit<Account, 'id' | 'user_id'>) => void;
    account: Account | null;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, onSubmit, account }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.BANK);
    const [balance, setBalance] = useState('');

    // Kredi kartı özel alanları
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [statementDate, setStatementDate] = useState('');
    const [paymentDueDate, setPaymentDueDate] = useState('');
    const [creditLimit, setCreditLimit] = useState('');

    // Account değiştiğinde form'u güncelle
    useEffect(() => {
        if (account) {
            setName(account.name);
            setType(account.type);
            setBalance(account.balance.toString());
            setCardNumber(account.card_number || '');
            setExpiryDate(account.expiry_date || '');
            setStatementDate(account.statement_date?.toString() || '');
            setPaymentDueDate(account.payment_due_date?.toString() || '');
            setCreditLimit(account.credit_limit?.toString() || '');
        }
    }, [account]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const accountData: Omit<Account, 'id' | 'user_id'> = {
            name,
            type,
            balance: parseFloat(balance) || 0,
            // Kredi kartı bilgileri
            card_number: type === AccountType.CREDIT_CARD ? cardNumber : null,
            expiry_date: type === AccountType.CREDIT_CARD ? expiryDate : null,
            statement_date: type === AccountType.CREDIT_CARD ? parseInt(statementDate) || null : null,
            payment_due_date: type === AccountType.CREDIT_CARD ? parseInt(paymentDueDate) || null : null,
            credit_limit: type === AccountType.CREDIT_CARD ? parseFloat(creditLimit) || null : null,
            available_credit: type === AccountType.CREDIT_CARD ? parseFloat(creditLimit) || null : null,
        };

        onSubmit(accountData);
        onClose();
    };

    if (!isOpen || !account) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up p-5">
                 <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-semibold text-slate-800">Hesap Düzenle</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-slate-700 mb-1.5">Hesap Adı</label>
                        <input
                            id="accountName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-slate-700 mb-1.5">Hesap Tipi</label>
                        <select
                            id="accountType"
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        >
                            <option value={AccountType.BANK}>Banka Hesabı</option>
                            <option value={AccountType.CREDIT_CARD}>Kredi Kartı</option>
                            <option value={AccountType.CASH}>Nakit</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-slate-700 mb-1.5">
                            {type === AccountType.CREDIT_CARD ? 'Kullanılabilir Kredi' : 'Başlangıç Bakiyesi'}
                        </label>
                         <input
                            id="initialBalance"
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            required
                            placeholder="0"
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>

                    {/* Kredi kartı özel alanları */}
                    {type === AccountType.CREDIT_CARD && (
                        <div className="bg-slate-50/80 rounded-xl p-4 space-y-4 border border-slate-100">
                            <div>
                                <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Kart Numarası (Son 4 Hane)</label>
                                <input
                                    id="cardNumber"
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="**** **** **** 1234"
                                    maxLength={4}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 mb-1.5">Son Kullanma Tarihi</label>
                                <input
                                    id="expiryDate"
                                    type="text"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="statementDate" className="block text-sm font-medium text-slate-700 mb-1.5">Ekstre Kesim Tarihi</label>
                                    <select
                                        id="statementDate"
                                        value={statementDate}
                                        onChange={(e) => setStatementDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="paymentDueDate" className="block text-sm font-medium text-slate-700 mb-1.5">Ödeme Vadesi</label>
                                    <select
                                        id="paymentDueDate"
                                        value={paymentDueDate}
                                        onChange={(e) => setPaymentDueDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="creditLimit" className="block text-sm font-medium text-slate-700 mb-1.5">Kredi Limiti</label>
                                <input
                                    id="creditLimit"
                                    type="number"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-5">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm">
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAccountModal;
