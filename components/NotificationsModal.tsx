import React from 'react';
import { Notification, NotificationType } from '../types';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import { markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../lib/notifications';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    notifications: Notification[];
    onRefresh: () => void;
}

// Türkçe Açıklama:
// Header'daki zil ikonu tıklanınca açılan modal. Bildirimleri listeler,
// okundu işaretler, tekil veya toplu silme yapılır. Her bildirim tipi
// kendi ikonu + rengini taşır.

const typeMeta: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
    version_update: {
        bg: 'bg-sky-100', color: 'text-sky-700',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
    budget_warning: {
        bg: 'bg-amber-100', color: 'text-amber-700',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    },
    budget_overshoot: {
        bg: 'bg-red-100', color: 'text-red-600',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },
    credit_statement: {
        bg: 'bg-purple-100', color: 'text-purple-700',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 00-4-4H3m12 6v-2a4 4 0 014-4h2M9 7V5a4 4 0 00-4-4H3m12 6V5a4 4 0 014-4h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1" />
            </svg>
        ),
    },
    credit_payment_due: {
        bg: 'bg-orange-100', color: 'text-orange-600',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    recurring_applied: {
        bg: 'bg-brand-100', color: 'text-brand-700',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    },
    installment_upcoming: {
        bg: 'bg-indigo-100', color: 'text-indigo-700',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
};

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Şimdi';
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, userId, notifications, onRefresh }) => {
    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const handleItemClick = async (n: Notification) => {
        if (!n.read_at) {
            await markAsRead(n.id);
            onRefresh();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteNotification(id);
        onRefresh();
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        await markAllAsRead(userId);
        onRefresh();
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm('Tüm bildirimler silinsin mi?')) return;
        await clearAllNotifications(userId);
        onRefresh();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-brand-50 rounded-t-3xl sm:rounded-3xl shadow-modal w-full sm:max-w-md max-h-[90vh] flex flex-col animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bildirimler</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {notifications.length === 0
                                ? 'Bildirim yok'
                                : `${notifications.length} toplam${unreadCount > 0 ? ` · ${unreadCount} okunmamış` : ''}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-2xl bg-white hover:bg-brand-100 flex items-center justify-center transition-colors text-slate-600"
                        aria-label="Kapat"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Actions */}
                {notifications.length > 0 && (
                    <div className="px-5 py-2 border-b border-brand-100 flex items-center gap-3 text-xs">
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            Tümünü okundu işaretle
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="font-semibold text-red-500 hover:text-red-600"
                        >
                            Tümünü sil
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="text-center py-16 px-5">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-brand-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">Henüz bildirim yok</p>
                            <p className="text-xs text-slate-500 mt-1">Bütçe aşımı, ekstre günü ve diğer hatırlatmalar burada görünecek</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-brand-100">
                            {notifications.map((n) => {
                                const meta = typeMeta[n.type];
                                return (
                                    <li
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className={`group px-5 py-4 cursor-pointer transition-colors ${
                                            n.read_at ? 'hover:bg-brand-100/40' : 'bg-white hover:bg-white/80'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`shrink-0 w-10 h-10 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
                                                {meta.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-tight ${n.read_at ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.read_at && (
                                                        <span className="shrink-0 mt-1 w-2 h-2 bg-brand-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {relativeTime(n.created_at)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, n.id)}
                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        aria-label="Bildirimi sil"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
