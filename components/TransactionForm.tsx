import React, { useState, FormEvent, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '../types';
import CloseIcon from './icons/CloseIcon';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
    categories: Category[];
    accounts: Account[];
    initialTransaction?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, categories, accounts, initialTransaction }) => {
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [parentCategoryId, setParentCategoryId] = useState<string>('');
    const [subCategoryId, setSubCategoryId] = useState<string>('');
    const [accountId, setAccountId] = useState<string>('');
    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [toAccountId, setToAccountId] = useState<string>('');

    const resetForm = () => {
        setType(TransactionType.EXPENSE);
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setParentCategoryId('');
        setSubCategoryId('');
        setAccountId('');
        setFromAccountId('');
        setToAccountId('');
    };
    
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);
    
    useEffect(() => {
        setParentCategoryId('');
        setSubCategoryId('');
    }, [type]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        let transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>;
        const finalCategoryId = subCategoryId ? parseInt(subCategoryId) : (parentCategoryId ? parseInt(parentCategoryId) : null);

        if (type === TransactionType.TRANSFER) {
            transactionData = {
                type, amount: parseFloat(amount), description, date,
                from_account_id: parseInt(fromAccountId), to_account_id: parseInt(toAccountId),
                category_id: null, account_id: null,
            };
        } else {
            transactionData = {
                type, amount: parseFloat(amount), description, date,
                category_id: finalCategoryId, account_id: parseInt(accountId),
            };
        }
        onSubmit(transactionData);
        onClose();
    };

    if (!isOpen) return null;

    const filteredParentCategories = categories.filter(c => c.type === type);
    const selectedParent = categories.find(c => c.id === parseInt(parentCategoryId));
    const subcategories = selectedParent?.subcategories || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Yeni İşlem</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
                        {Object.values(TransactionType).map(t => (
                            <button key={t} type="button" onClick={() => setType(t)}
                                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${type === t ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                                {t === 'expense' ? 'Gider' : t === 'income' ? 'Gelir' : 'Transfer'}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tutar</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" />
                    </div>
                    {type !== TransactionType.TRANSFER ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Kategori</label>
                                <select value={parentCategoryId} onChange={e => {setParentCategoryId(e.target.value); setSubCategoryId('')}} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                                    <option value="">Seçiniz...</option>
                                    {filteredParentCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            {subcategories.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Alt Kategori</label>
                                    <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                                        <option value="">Seçiniz...</option>
                                        {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Hesap</label>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                                    <option value="">Seçiniz...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                         <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Gönderen Hesap</label>
                                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                                    <option value="">Seçiniz...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Alan Hesap</label>
                                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
                                    <option value="">Seçiniz...</option>
                                    {accounts.filter(a => a.id !== parseInt(fromAccountId)).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Açıklama</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tarih</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" />
                    </div>
                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md">İptal</button>
                        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;
