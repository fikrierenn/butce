import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, Account, Category } from '../types';

interface ExportImportProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    onImport?: (transactions: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => void;
}

const ExportImport: React.FC<ExportImportProps> = ({
    transactions,
    accounts,
    categories,
    onImport,
}) => {
    const [importPreview, setImportPreview] = useState<string[][]>([]);
    const [importCount, setImportCount] = useState<number>(0);
    const [parsedTransactions, setParsedTransactions] = useState<
        Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]
    >([]);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [importFileName, setImportFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Helper functions ---

    const getCategoryName = (id: number | null): string => {
        if (id === null) return '';
        // Search flat list
        for (const cat of categories) {
            if (cat.id === id) return cat.name;
            // Search subcategories
            if (cat.subcategories) {
                for (const sub of cat.subcategories) {
                    if (sub.id === id) return `${cat.name} / ${sub.name}`;
                }
            }
        }
        return '';
    };

    const getAccountName = (id: number | null): string => {
        if (id === null) return '';
        const account = accounts.find((a) => a.id === id);
        return account ? account.name : '';
    };

    const getTypeLabel = (type: TransactionType): string => {
        switch (type) {
            case TransactionType.INCOME:
                return 'Gelir';
            case TransactionType.EXPENSE:
                return 'Gider';
            case TransactionType.TRANSFER:
                return 'Transfer';
            default:
                return '';
        }
    };

    const formatDate = (): string => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    };

    const downloadFile = (content: string, filename: string, type: string): void => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateCSV = (): string => {
        const BOM = '\uFEFF';
        const headers = ['Tarih', 'Tür', 'Açıklama', 'Tutar', 'Kategori', 'Hesap'];
        const rows = transactions.map((t) => {
            const accountName =
                t.type === TransactionType.TRANSFER
                    ? `${getAccountName(t.from_account_id ?? null)} → ${getAccountName(t.to_account_id ?? null)}`
                    : getAccountName(t.account_id);
            return [
                t.date,
                getTypeLabel(t.type),
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.amount.toFixed(2),
                getCategoryName(t.category_id),
                accountName,
            ].join(',');
        });
        return BOM + [headers.join(','), ...rows].join('\n');
    };

    const handleExportCSV = (): void => {
        const csv = generateCSV();
        const filename = `spendme_islemler_${formatDate()}.csv`;
        downloadFile(csv, filename, 'text/csv;charset=utf-8');
        setStatusMessage(`${transactions.length} işlem CSV olarak indirildi.`);
    };

    const handleExportJSON = (): void => {
        const json = JSON.stringify(transactions, null, 2);
        const filename = `spendme_islemler_${formatDate()}.json`;
        downloadFile(json, filename, 'application/json;charset=utf-8');
        setStatusMessage(`${transactions.length} işlem JSON olarak indirildi.`);
    };

    const parseCSVFile = (file: File): void => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text
                .replace(/^\uFEFF/, '') // strip BOM
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

            if (lines.length < 2) {
                setStatusMessage('CSV dosyası geçerli veri içermiyor.');
                return;
            }

            // Skip header row
            const dataLines = lines.slice(1);
            const preview = dataLines.slice(0, 5).map((line) => parseCSVLine(line));
            setImportPreview(preview);
            setImportCount(dataLines.length);
            setImportFileName(file.name);

            // Parse into transaction objects
            const parsed = dataLines.map((line) => {
                const cols = parseCSVLine(line);
                const typeStr = (cols[1] || '').toLowerCase();
                let type: TransactionType = TransactionType.EXPENSE;
                if (typeStr === 'gelir' || typeStr === 'income') type = TransactionType.INCOME;
                else if (typeStr === 'transfer') type = TransactionType.TRANSFER;

                return {
                    date: cols[0] || formatDate(),
                    type,
                    description: cols[2] || '',
                    amount: parseFloat(cols[3]) || 0,
                    category_id: null,
                    account_id: null,
                } as Omit<Transaction, 'id' | 'user_id' | 'created_at'>;
            });
            setParsedTransactions(parsed);
            setStatusMessage(`${dataLines.length} işlem bulundu.`);
        };
        reader.readAsText(file, 'utf-8');
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (inQuotes) {
                if (char === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
        }
        result.push(current.trim());
        return result;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) parseCSVFile(file);
        // Reset input so re-selecting same file fires change
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImportConfirm = (): void => {
        if (onImport && parsedTransactions.length > 0) {
            onImport(parsedTransactions);
            setStatusMessage(`${parsedTransactions.length} işlem içe aktarıldı.`);
            setImportPreview([]);
            setImportCount(0);
            setParsedTransactions([]);
            setImportFileName('');
        }
    };

    const handleClearImport = (): void => {
        setImportPreview([]);
        setImportCount(0);
        setParsedTransactions([]);
        setImportFileName('');
        setStatusMessage('');
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-slate-100/60 p-5">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📤</span>
                <h2 className="text-base font-semibold text-slate-800">
                    Dışa / İçe Aktarım
                </h2>
            </div>

            {/* Export Section */}
            <div className="mb-4">
                <p className="text-sm font-medium text-slate-600 mb-3">Dışa Aktar</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        CSV Olarak İndir
                    </button>
                    <button
                        onClick={handleExportJSON}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        JSON Olarak İndir
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-4" />

            {/* Import Section */}
            <div>
                <p className="text-sm font-medium text-slate-600 mb-3">İçe Aktar</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {importPreview.length === 0 ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors cursor-pointer"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                        </svg>
                        <span className="text-sm font-medium">CSV İçe Aktar</span>
                        <span className="text-xs text-slate-400">
                            .csv dosyası seçin
                        </span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        {/* File info */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">{importFileName}</span>
                                {' — '}
                                <span className="text-brand-600 font-semibold">
                                    {importCount} işlem bulundu
                                </span>
                            </p>
                            <button
                                onClick={handleClearImport}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Temizle
                            </button>
                        </div>

                        {/* Preview table */}
                        <div className="overflow-x-auto rounded-lg border border-slate-100">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500">
                                        <th className="px-3 py-2 text-left font-medium">Tarih</th>
                                        <th className="px-3 py-2 text-left font-medium">Tür</th>
                                        <th className="px-3 py-2 text-left font-medium">Açıklama</th>
                                        <th className="px-3 py-2 text-right font-medium">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importPreview.map((row, i) => (
                                        <tr
                                            key={i}
                                            className="border-t border-slate-50 text-slate-700"
                                        >
                                            <td className="px-3 py-1.5">{row[0] || '-'}</td>
                                            <td className="px-3 py-1.5">{row[1] || '-'}</td>
                                            <td className="px-3 py-1.5 max-w-[160px] truncate">
                                                {row[2] || '-'}
                                            </td>
                                            <td className="px-3 py-1.5 text-right">
                                                {row[3] || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {importCount > 5 && (
                            <p className="text-xs text-slate-400 text-center">
                                ve {importCount - 5} işlem daha...
                            </p>
                        )}

                        {/* Import confirm */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleImportConfirm}
                                disabled={!onImport}
                                className="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                İçe Aktar
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Farklı Dosya Seç
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status message */}
            {statusMessage && (
                <p className="mt-3 text-xs text-brand-600 font-medium">{statusMessage}</p>
            )}
        </div>
    );
};

export default ExportImport;
