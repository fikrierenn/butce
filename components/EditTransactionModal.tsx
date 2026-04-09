import React, { useState, FormEvent, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '../types';
import CloseIcon from './icons/CloseIcon';
import { useI18n } from '../lib/i18n';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
    transaction: Transaction | null;
    categories: Category[];
    accounts: Account[];
}

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen, onClose, onSubmit, transaction, categories, accounts
}) => {
    const { t } = useI18n();
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [parentCategoryId, setParentCategoryId] = useState<string>('');
    const [subCategoryId, setSubCategoryId] = useState<string>('');
    const [accountId, setAccountId] = useState<string>('');
    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [toAccountId, setToAccountId] = useState<string>('');

    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentCount, setInstallmentCount] = useState('');

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setDescription(transaction.description.replace(/ \(\d+\/\d+\)$/, ''));
            setDate(transaction.date);
            setParentCategoryId(transaction.category_id?.toString() || '');
            setSubCategoryId('');
            setAccountId(transaction.account_id?.toString() || '');
            setFromAccountId(transaction.from_account_id?.toString() || '');
            setToAccountId(transaction.to_account_id?.toString() || '');
            setIsInstallment(transaction.is_installment || false);
            setInstallmentCount(transaction.installment_count?.toString() || '');
        }
    }, [transaction]);

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
                is_installment: isInstallment,
                installment_count: isInstallment ? parseInt(installmentCount) : null,
                installment_current: isInstallment ? 1 : null,
                installment_parent_id: null,
            };
        }

        onSubmit(transactionData);
        onClose();
    };

    if (!isOpen || !transaction) return null;

    const filteredParentCategories = categories.filter(c => c.type === type);
    const selectedParent = categories.find(c => c.id === parseInt(parentCategoryId));
    const subcategories = selectedParent?.subcategories || [];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up p-5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-semibold text-slate-800">{t('form.editTransaction')}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                        {Object.values(TransactionType).map(tt => (
                            <button key={tt} type="button" onClick={() => setType(tt)}
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${type === tt ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {tt === 'expense' ? t('type.expense') : tt === 'income' ? t('type.income') : t('type.transfer')}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className={labelClass}>{t('form.amount')}</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className={inputClass} />
                    </div>

                    {type !== TransactionType.TRANSFER && (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="editIsInstallment"
                                    checked={isInstallment}
                                    onChange={(e) => setIsInstallment(e.target.checked)}
                                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                                />
                                <label htmlFor="editIsInstallment" className="text-sm font-medium text-slate-700">
                                    {t('form.installment')}
                                </label>
                            </div>

                            {isInstallment && (
                                <div>
                                    <label className={labelClass}>{t('form.installmentCount')}</label>
                                    <select value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} required className={inputClass}>
                                        <option value="">{t('form.select')}</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num} Taksit</option>
                                        ))}
                                    </select>
                                    {installmentCount && amount && (
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            {t('form.monthlyInstallment')}: ₺{(parseFloat(amount) / parseInt(installmentCount)).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {type !== TransactionType.TRANSFER ? (
                        <>
                            <div>
                                <label className={labelClass}>{t('form.category')}</label>
                                <select value={parentCategoryId} onChange={e => {setParentCategoryId(e.target.value); setSubCategoryId('')}} required className={inputClass}>
                                    <option value="">{t('form.select')}</option>
                                    {filteredParentCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            {subcategories.length > 0 && (
                                <div>
                                    <label className={labelClass}>{t('form.subCategory')}</label>
                                    <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} required className={inputClass}>
                                        <option value="">{t('form.select')}</option>
                                        {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>{t('form.account')}</label>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className={inputClass}>
                                    <option value="">{t('form.select')}</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                         <>
                            <div>
                                <label className={labelClass}>{t('form.fromAccount')}</label>
                                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className={inputClass}>
                                    <option value="">{t('form.select')}</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('form.toAccount')}</label>
                                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className={inputClass}>
                                    <option value="">{t('form.select')}</option>
                                    {accounts.filter(a => a.id !== parseInt(fromAccountId)).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className={labelClass}>{t('form.description')}</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('form.date')}</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">{t('form.cancel')}</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm">{t('form.update')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
