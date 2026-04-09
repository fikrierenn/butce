import React, { useState, useEffect, FormEvent } from 'react';
import { RecurringTransaction, RecurringFrequency, TransactionType, Category, Account } from '../types';
import CloseIcon from './icons/CloseIcon';

interface AddRecurringModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (recurring: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
    categories: Category[];
    accounts: Account[];
}

const DAY_OF_WEEK_LABELS = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 0, label: 'Pazar' },
];

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
    [RecurringFrequency.DAILY]: 'Günlük',
    [RecurringFrequency.WEEKLY]: 'Haftalık',
    [RecurringFrequency.MONTHLY]: 'Aylık',
    [RecurringFrequency.YEARLY]: 'Yıllık',
};

function calculateNextRunDate(startDate: string, frequency: RecurringFrequency, dayOfMonth?: number | null, dayOfWeek?: number | null): string {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let next = new Date(start);

    if (next >= today) {
        // If start date is in the future or today, use it as-is (adjusted for day_of_month/week)
        if (frequency === RecurringFrequency.MONTHLY && dayOfMonth) {
            next.setDate(dayOfMonth);
            if (next < today) {
                next.setMonth(next.getMonth() + 1);
                next.setDate(dayOfMonth);
            }
        } else if (frequency === RecurringFrequency.WEEKLY && dayOfWeek !== undefined && dayOfWeek !== null) {
            const currentDay = next.getDay();
            const diff = (dayOfWeek - currentDay + 7) % 7;
            next.setDate(next.getDate() + (diff === 0 ? 0 : diff));
            if (next < today) {
                next.setDate(next.getDate() + 7);
            }
        }
        return next.toISOString().split('T')[0];
    }

    // Start date is in the past, advance to next occurrence
    switch (frequency) {
        case RecurringFrequency.DAILY:
            return today.toISOString().split('T')[0];
        case RecurringFrequency.WEEKLY: {
            const targetDay = dayOfWeek ?? start.getDay();
            const currentDay = today.getDay();
            const diff = (targetDay - currentDay + 7) % 7;
            const result = new Date(today);
            result.setDate(today.getDate() + (diff === 0 ? 0 : diff));
            return result.toISOString().split('T')[0];
        }
        case RecurringFrequency.MONTHLY: {
            const targetDate = dayOfMonth ?? start.getDate();
            const result = new Date(today.getFullYear(), today.getMonth(), targetDate);
            if (result < today) {
                result.setMonth(result.getMonth() + 1);
            }
            return result.toISOString().split('T')[0];
        }
        case RecurringFrequency.YEARLY: {
            const result = new Date(today.getFullYear(), start.getMonth(), start.getDate());
            if (result < today) {
                result.setFullYear(result.getFullYear() + 1);
            }
            return result.toISOString().split('T')[0];
        }
        default:
            return startDate;
    }
}

const AddRecurringModal: React.FC<AddRecurringModalProps> = ({ isOpen, onClose, onSubmit, categories, accounts }) => {
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
    const [dayOfMonth, setDayOfMonth] = useState<string>('1');
    const [dayOfWeek, setDayOfWeek] = useState<string>('1');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [isIndefinite, setIsIndefinite] = useState(true);
    const [parentCategoryId, setParentCategoryId] = useState<string>('');
    const [subCategoryId, setSubCategoryId] = useState<string>('');
    const [accountId, setAccountId] = useState<string>('');
    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [toAccountId, setToAccountId] = useState<string>('');

    const resetForm = () => {
        setType(TransactionType.EXPENSE);
        setDescription('');
        setAmount('');
        setFrequency(RecurringFrequency.MONTHLY);
        setDayOfMonth('1');
        setDayOfWeek('1');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setIsIndefinite(true);
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

        const finalCategoryId = subCategoryId
            ? parseInt(subCategoryId)
            : parentCategoryId
              ? parseInt(parentCategoryId)
              : null;

        const domVal = frequency === RecurringFrequency.MONTHLY ? parseInt(dayOfMonth) : null;
        const dowVal = frequency === RecurringFrequency.WEEKLY ? parseInt(dayOfWeek) : null;

        const nextRunDate = calculateNextRunDate(startDate, frequency, domVal, dowVal);

        const data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
            type,
            amount: parseFloat(amount),
            description,
            category_id: type === TransactionType.TRANSFER ? null : finalCategoryId,
            account_id: type === TransactionType.TRANSFER ? null : (accountId ? parseInt(accountId) : null),
            from_account_id: type === TransactionType.TRANSFER ? parseInt(fromAccountId) : null,
            to_account_id: type === TransactionType.TRANSFER ? parseInt(toAccountId) : null,
            frequency,
            day_of_month: domVal,
            day_of_week: dowVal,
            start_date: startDate,
            end_date: isIndefinite ? null : (endDate || null),
            next_run_date: nextRunDate,
            last_run_date: null,
            is_active: true,
        };

        onSubmit(data);
        onClose();
    };

    if (!isOpen) return null;

    const filteredParentCategories = categories.filter(c => c.type === type);
    const selectedParent = categories.find(c => c.id === parseInt(parentCategoryId));
    const subcategories = selectedParent?.subcategories || [];

    const inputClass = 'w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all';
    const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Tekrarlayan İşlem Ekle</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Type Switcher */}
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                        {Object.values(TransactionType).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                                    type === t
                                        ? 'bg-white text-brand-700 shadow-sm font-semibold'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {t === 'expense' ? 'Gider' : t === 'income' ? 'Gelir' : 'Transfer'}
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Açıklama</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder="Örn: Kira, Maaş, Netflix..."
                            className={inputClass}
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className={labelClass}>Tutar</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            placeholder="0.00"
                            className={inputClass}
                        />
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className={labelClass}>Tekrar Sıklığı</label>
                        <select
                            value={frequency}
                            onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                            className={inputClass}
                        >
                            {Object.values(RecurringFrequency).map(f => (
                                <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Day of Month (conditional) */}
                    {frequency === RecurringFrequency.MONTHLY && (
                        <div>
                            <label className={labelClass}>Ayın Günü</label>
                            <select
                                value={dayOfMonth}
                                onChange={e => setDayOfMonth(e.target.value)}
                                className={inputClass}
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Day of Week (conditional) */}
                    {frequency === RecurringFrequency.WEEKLY && (
                        <div>
                            <label className={labelClass}>Haftanın Günü</label>
                            <select
                                value={dayOfWeek}
                                onChange={e => setDayOfWeek(e.target.value)}
                                className={inputClass}
                            >
                                {DAY_OF_WEEK_LABELS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Start Date */}
                    <div>
                        <label className={labelClass}>Başlangıç Tarihi</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className={labelClass}>Bitiş Tarihi</label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isIndefinite"
                                    checked={isIndefinite}
                                    onChange={e => setIsIndefinite(e.target.checked)}
                                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                                />
                                <label htmlFor="isIndefinite" className="text-sm font-medium text-slate-700">
                                    Süresiz
                                </label>
                            </div>
                            {!isIndefinite && (
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    min={startDate}
                                    required
                                    className={inputClass}
                                />
                            )}
                        </div>
                    </div>

                    {/* Category (not for transfer) */}
                    {type !== TransactionType.TRANSFER ? (
                        <>
                            <div>
                                <label className={labelClass}>Kategori</label>
                                <select
                                    value={parentCategoryId}
                                    onChange={e => { setParentCategoryId(e.target.value); setSubCategoryId(''); }}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Seçiniz...</option>
                                    {filteredParentCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            {subcategories.length > 0 && (
                                <div>
                                    <label className={labelClass}>Alt Kategori</label>
                                    <select
                                        value={subCategoryId}
                                        onChange={e => setSubCategoryId(e.target.value)}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>Hesap</label>
                                <select
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Seçiniz...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className={labelClass}>Gönderen Hesap</label>
                                <select
                                    value={fromAccountId}
                                    onChange={e => setFromAccountId(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Seçiniz...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Alan Hesap</label>
                                <select
                                    value={toAccountId}
                                    onChange={e => setToAccountId(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Seçiniz...</option>
                                    {accounts.filter(a => a.id !== parseInt(fromAccountId)).map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRecurringModal;
