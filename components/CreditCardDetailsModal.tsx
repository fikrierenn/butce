import React from 'react';
import { Account, AccountType } from '../types';
import CloseIcon from './icons/CloseIcon';
import { formatCurrency } from '../lib/currency';

interface CreditCardDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
}

// Türkçe Açıklama:
// Home ekranındaki "Kredi Kartı" slide'ına tıklanınca açılan modal.
// Tüm kredi kartı tipindeki hesapları VISA-stili koyu kartlar halinde
// yatay kaydırmalı olarak gösterir. Kart üzerinde: son 4 hane, son
// kullanma tarihi, bakiye, ekstre kesim ve son ödeme günleri.

const CreditCardDetailsModal: React.FC<CreditCardDetailsModalProps> = ({ isOpen, onClose, accounts }) => {
    if (!isOpen) return null;

    const creditCards = accounts.filter(a => a.type === AccountType.CREDIT_CARD);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-brand-50 rounded-t-3xl sm:rounded-3xl shadow-modal w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-brand-50/90 backdrop-blur-lg z-10 flex justify-between items-center px-5 pt-5 pb-3 border-b border-brand-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kredi Kartlarım</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{creditCards.length} kart</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-2xl bg-white hover:bg-brand-100 flex items-center justify-center transition-colors text-slate-600"
                        aria-label="Kapat"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {creditCards.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-2">💳</div>
                            <p className="text-sm font-semibold text-slate-700">Henüz kredi kartı eklemediniz</p>
                            <p className="text-xs text-slate-500 mt-1">Ayarlar → Hesaplar'dan yeni kart ekleyebilirsiniz</p>
                        </div>
                    ) : (
                        creditCards.map((card) => (
                            <div
                                key={card.id}
                                className="relative bg-gradient-to-br from-surface-dark via-[#142015] to-[#1a2a1a] rounded-3xl p-5 text-white shadow-card-hover overflow-hidden"
                            >
                                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-500/10" />
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-brand-500/5 to-transparent" />

                                <div className="relative">
                                    {/* Üst: chip + VISA */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
                                            <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M1.5 7.5a1.5 1.5 0 013 0v9a1.5 1.5 0 01-3 0v-9zM7 4a1 1 0 011 1v14a1 1 0 01-2 0V5a1 1 0 011-1z" />
                                            </svg>
                                        </div>
                                        <span className="text-lg font-black italic tracking-tight text-white">VISA</span>
                                    </div>

                                    {/* Kart adı */}
                                    <p className="mt-5 text-sm font-semibold text-white/80 truncate">
                                        {card.name}
                                    </p>

                                    {/* Kart numarası */}
                                    <p className="mt-2 text-lg font-mono font-bold tracking-[0.2em] text-white">
                                        {card.card_number
                                            ? `•••• •••• •••• ${card.card_number}`
                                            : '•••• •••• •••• ••••'}
                                    </p>

                                    {/* Alt: kart sahibi + son kullanma */}
                                    <div className="mt-5 flex items-end justify-between">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Bakiye</p>
                                            <p className={`text-base font-bold mt-0.5 ${
                                                card.balance >= 0 ? 'text-brand-300' : 'text-red-400'
                                            }`}>
                                                {formatCurrency(card.balance)}
                                            </p>
                                        </div>
                                        {card.expiry_date && (
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Son Kull.</p>
                                                <p className="text-sm font-bold text-white mt-0.5">{card.expiry_date}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ekstre / Ödeme günleri */}
                                    {(card.statement_date || card.payment_due_date) && (
                                        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                            {card.statement_date && (
                                                <div>
                                                    <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Ekstre Kesim</p>
                                                    <p className="text-sm font-bold text-white mt-0.5">
                                                        Her ayın {card.statement_date}.
                                                    </p>
                                                </div>
                                            )}
                                            {card.payment_due_date && (
                                                <div>
                                                    <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Son Ödeme</p>
                                                    <p className="text-sm font-bold text-white mt-0.5">
                                                        Her ayın {card.payment_due_date}.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Kredi limiti */}
                                    {card.credit_limit != null && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Kredi Limiti</p>
                                                <p className="text-sm font-bold text-white">{formatCurrency(card.credit_limit)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreditCardDetailsModal;
