import React, { useState, FormEvent, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account } from '../types';
import CloseIcon from './icons/CloseIcon';
import CameraIcon from './icons/CameraIcon';
import MessageIcon from './icons/MessageIcon';
import SparklesIcon from './icons/SparklesIcon';
import { parseTransactionWithGemini, parseReceiptWithGemini, parseSmsWithGemini } from '../lib/gemini';
import { resizeImage } from '../lib/imageUtils';
import { useI18n } from '../lib/i18n';

const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
);

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
    onSubmitMultiple?: (transactions: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => void;
    categories: Category[];
    accounts: Account[];
    initialTransaction?: Transaction | null;
    initialType?: TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, onSubmitMultiple, categories, accounts, initialTransaction, initialType }) => {
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
    const [aiPrompt, setAiPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiMode, setAiMode] = useState<'text' | 'receipt' | 'sms'>('text');
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [smsText, setSmsText] = useState('');
    const [smsParsedResults, setSmsParsedResults] = useState<any[]>([]);
    const [showSmsResults, setShowSmsResults] = useState(false);

    // AI sonuçlarını form alanlarına uygula
    const applyAiResult = (result: any) => {
        if (!result) return;
        if (result.type) setType(result.type);
        if (result.amount) setAmount(result.amount.toString());
        if (result.description) setDescription(result.description);
        if (result.date) setDate(result.date);
        if (result.category_id) {
            const parentCategory = categories.find(c => c.id === result.category_id);
            if (parentCategory) {
                setParentCategoryId(parentCategory.id.toString());
                setSubCategoryId('');
            } else {
                const subCategory = categories
                    .flatMap(c => c.subcategories || [])
                    .find(sub => sub.id === result.category_id);
                if (subCategory) {
                    const parent = categories.find(c =>
                        c.subcategories?.some(sub => sub.id === result.category_id)
                    );
                    if (parent) {
                        setParentCategoryId(parent.id.toString());
                        setSubCategoryId(subCategory.id.toString());
                    }
                }
            }
        }
        if (result.account_id) setAccountId(result.account_id.toString());
        if (result.from_account_id) setFromAccountId(result.from_account_id.toString());
        if (result.to_account_id) setToAccountId(result.to_account_id.toString());
        if (result.is_installment !== undefined) setIsInstallment(result.is_installment);
        if (result.installment_count) setInstallmentCount(result.installment_count.toString());
    };

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
        setIsInstallment(false);
        setInstallmentCount('');
        setAiMode('text');
        if (receiptPreview) URL.revokeObjectURL(receiptPreview);
        setReceiptPreview(null);
        setIsProcessing(false);
        setSmsText('');
        setSmsParsedResults([]);
        setShowSmsResults(false);
        setAiPrompt('');
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
            if (initialType) setType(initialType);
        }
    }, [isOpen, initialType]);

    useEffect(() => {
        setParentCategoryId('');
        setSubCategoryId('');
    }, [type]);

    const handleAiAnalysis = async () => {
        if (!aiPrompt.trim()) return;

        setIsProcessing(true);
        try {
            const result = await parseTransactionWithGemini(aiPrompt, categories, accounts);
            applyAiResult(result);
            if (result) setAiPrompt('');
        } catch (error) {
            console.error('AI analiz hatası:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReceiptCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (receiptPreview) URL.revokeObjectURL(receiptPreview);
            const previewUrl = URL.createObjectURL(file);
            setReceiptPreview(previewUrl);

            setIsProcessing(true);

            const { base64, mimeType } = await resizeImage(file);
            const result = await parseReceiptWithGemini(base64, mimeType, categories, accounts);
            applyAiResult(result);
        } catch (error) {
            console.error('Fiş tarama hatası:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSmsAnalysis = async () => {
        if (!smsText.trim()) return;

        setIsProcessing(true);
        try {
            const results = await parseSmsWithGemini(smsText, categories, accounts);

            if (results && results.length > 0) {
                if (results.length === 1) {
                    applyAiResult(results[0]);
                    setSmsText('');
                } else {
                    setSmsParsedResults(results);
                    setShowSmsResults(true);
                }
            }
        } catch (error) {
            console.error('SMS analiz hatası:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveBatchSms = () => {
        if (!onSubmitMultiple || smsParsedResults.length === 0) return;

        const transactionsToSave: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[] = smsParsedResults.map(result => ({
            type: result.type || TransactionType.EXPENSE,
            amount: result.amount || 0,
            description: result.description || '',
            date: result.date || new Date().toISOString().split('T')[0],
            category_id: result.category_id || null,
            account_id: result.account_id || null,
            is_installment: result.is_installment || false,
            installment_count: result.installment_count || null,
            installment_current: result.is_installment ? 1 : null,
            installment_parent_id: null,
        }));

        onSubmitMultiple(transactionsToSave);
        setSmsParsedResults([]);
        setShowSmsResults(false);
        setSmsText('');
        onClose();
    };

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

    if (!isOpen) return null;

    const filteredParentCategories = categories.filter(c => c.type === type);
    const selectedParent = categories.find(c => c.id === parseInt(parentCategoryId));
    const subcategories = selectedParent?.subcategories || [];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">{t('form.newTransaction')}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* AI Analiz Bölümü */}
                    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-brand-50 border border-purple-200/60 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <SparklesIcon className="h-4 w-4 text-purple-600" />
                            <h3 className="text-sm font-semibold text-purple-800">{t('ai.title')}</h3>
                        </div>

                        {/* Mod Seçici */}
                        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 mb-3">
                            {([
                                { mode: 'text' as const, icon: <SparklesIcon className="h-3.5 w-3.5" />, label: t('ai.text') },
                                { mode: 'receipt' as const, icon: <CameraIcon className="h-3.5 w-3.5" />, label: t('ai.receipt') },
                                { mode: 'sms' as const, icon: <MessageIcon className="h-3.5 w-3.5" />, label: t('ai.sms') },
                            ] as const).map(({ mode, icon, label }) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setAiMode(mode)}
                                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all ${
                                        aiMode === mode
                                            ? 'rounded-lg bg-white text-brand-700 shadow-sm font-semibold'
                                            : 'rounded-lg text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Metin Modu */}
                        {aiMode === 'text' && (
                            <div className="space-y-2">
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Örn: 'Bugün 150 TL market alışverişi yaptım' veya '3 taksitli 900 TL telefon aldım'"
                                    className="w-full p-2.5 text-sm border border-purple-200 rounded-lg resize-none bg-white/80 placeholder-slate-400 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                                    rows={2}
                                />
                                <button
                                    type="button"
                                    onClick={handleAiAnalysis}
                                    disabled={!aiPrompt.trim() || isProcessing}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-brand-700 disabled:from-purple-300 disabled:to-brand-300 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {isProcessing && aiMode === 'text' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Spinner />
                                            {t('ai.analyzing')}
                                        </span>
                                    ) : t('ai.fillWithAi')}
                                </button>
                            </div>
                        )}

                        {/* Fiş Tarama Modu */}
                        {aiMode === 'receipt' && (
                            <div className="space-y-2">
                                {receiptPreview ? (
                                    <div className="relative">
                                        <img src={receiptPreview} alt="Fiş önizleme" className="w-full h-32 object-cover rounded-lg border border-purple-200" />
                                        <button
                                            type="button"
                                            onClick={() => { if (receiptPreview) URL.revokeObjectURL(receiptPreview); setReceiptPreview(null); }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                                        >
                                            ✕
                                        </button>
                                        {isProcessing && aiMode === 'receipt' && (
                                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                                <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
                                                    <Spinner />
                                                    <span className="text-sm text-purple-700 font-medium">{t('ai.receiptAnalyzing')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white/50 hover:bg-white/80 hover:border-purple-400 transition-all">
                                        <CameraIcon className="h-8 w-8 text-purple-400 mb-1" />
                                        <span className="text-sm text-purple-600 font-medium">{t('ai.receiptCapture')}</span>
                                        <span className="text-xs text-slate-400 mt-0.5">{t('ai.cameraOrGallery')}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleReceiptCapture}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        )}

                        {/* SMS Modu */}
                        {aiMode === 'sms' && !showSmsResults && (
                            <div className="space-y-2">
                                <textarea
                                    value={smsText}
                                    onChange={(e) => setSmsText(e.target.value)}
                                    placeholder={"Banka SMS'lerini buraya yapıştırın...\n\nÖrn: Garanti BBVA: 15.03.2025 tarihinde 250,00 TL tutarında ABC Market'e ödeme yapılmıştır."}
                                    className="w-full p-2.5 text-sm border border-purple-200 rounded-lg resize-none bg-white/80 placeholder-slate-400 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                                    rows={4}
                                />
                                <button
                                    type="button"
                                    onClick={handleSmsAnalysis}
                                    disabled={!smsText.trim() || isProcessing}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-brand-700 disabled:from-purple-300 disabled:to-brand-300 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {isProcessing && aiMode === 'sms' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Spinner />
                                            {t('ai.smsAnalyzing')}
                                        </span>
                                    ) : t('ai.smsAnalyze')}
                                </button>
                            </div>
                        )}

                        {/* SMS Batch Sonuçları */}
                        {aiMode === 'sms' && showSmsResults && smsParsedResults.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-purple-700">
                                        {smsParsedResults.length} {t('ai.detected')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => { setShowSmsResults(false); setSmsParsedResults([]); }}
                                        className="text-xs text-slate-500 hover:text-red-500"
                                    >
                                        {t('ai.clear')}
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1.5">
                                    {smsParsedResults.map((result, index) => (
                                        <div key={index} className="bg-white rounded-lg p-2.5 border border-purple-100 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{result.description}</p>
                                                    <p className="text-xs text-slate-500">{result.date}</p>
                                                </div>
                                                <span className={`text-sm font-bold ml-2 ${result.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.type === 'income' ? '+' : '-'}₺{result.amount?.toLocaleString('tr-TR')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveBatchSms}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm"
                                >
                                    {t('ai.saveAll')} ({smsParsedResults.length})
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                        {Object.values(TransactionType).map(tt => (
                            <button key={tt} type="button" onClick={() => setType(tt)}
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${type === tt ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {tt === 'expense' ? t('type.expense') : tt === 'income' ? t('type.income') : t('type.transfer')}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.amount')}</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                    </div>

                    {type !== TransactionType.TRANSFER && (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isInstallment"
                                    checked={isInstallment}
                                    onChange={(e) => setIsInstallment(e.target.checked)}
                                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                                />
                                <label htmlFor="isInstallment" className="text-sm font-medium text-slate-700">
                                    {t('form.installment')}
                                </label>
                            </div>

                            {isInstallment && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.installmentCount')}</label>
                                    <select
                                        value={installmentCount}
                                        onChange={(e) => setInstallmentCount(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    >
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
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.category')}</label>
                                <select value={parentCategoryId} onChange={e => {setParentCategoryId(e.target.value); setSubCategoryId('')}} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                                    <option value="">{t('form.select')}</option>
                                    {filteredParentCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            {subcategories.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.subCategory')}</label>
                                    <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                                        <option value="">{t('form.select')}</option>
                                        {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.account')}</label>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                                    <option value="">{t('form.select')}</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                         <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.fromAccount')}</label>
                                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                                    <option value="">{t('form.select')}</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.toAccount')}</label>
                                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                                    <option value="">{t('form.select')}</option>
                                    {accounts.filter(a => a.id !== parseInt(fromAccountId)).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.description')}</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form.date')}</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">{t('form.cancel')}</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm">{t('form.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;
