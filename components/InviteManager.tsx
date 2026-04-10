import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Invite {
    code: string;
    invited_email: string | null;
    is_used: boolean;
    used_at: string | null;
    expires_at: string;
    notes: string | null;
    created_at: string;
    invite_url: string;
}

const inputClass = "w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

const InviteManager: React.FC = () => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [newInviteEmail, setNewInviteEmail] = useState('');
    const [newInviteNotes, setNewInviteNotes] = useState('');
    const [newInviteDays, setNewInviteDays] = useState(7);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        loadInvites();
    }, []);

    const loadInvites = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_my_invites');
        if (error) {
            console.error('Davetler yüklenirken hata:', error);
        } else {
            setInvites(data || []);
        }
        setLoading(false);
    };

    const createInvite = async () => {
        const { data, error } = await supabase.rpc('create_invite_code', {
            invited_email_param: newInviteEmail || null,
            notes_param: newInviteNotes || null,
            days_valid: newInviteDays
        });

        if (error) {
            setStatusMessage('Hata: ' + error.message);
            setTimeout(() => setStatusMessage(null), 3000);
        } else if (data && data.length > 0) {
            copyToClipboard(data[0].invite_url);
            setStatusMessage(`Davet kodu: ${data[0].invite_code} - Kopyalandı!`);
            setTimeout(() => setStatusMessage(null), 4000);
            setNewInviteEmail('');
            setNewInviteNotes('');
            loadInvites();
        }
    };

    const deleteInvite = async (code: string) => {
        const { data, error } = await supabase.rpc('delete_invite', {
            code_param: code
        });

        if (error) {
            setStatusMessage('Silme hatası: ' + error.message);
        } else if (data) {
            setStatusMessage('Davet kodu silindi');
            loadInvites();
        } else {
            setStatusMessage('Davet kodu bulunamadı');
        }
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const copyToClipboard = (inviteUrl: string) => {
        const fullUrl = window.location.origin + inviteUrl;
        navigator.clipboard.writeText(fullUrl).then(() => {
            const code = inviteUrl.split('invite=')[1];
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    if (loading) {
        return <div className="p-4 text-sm text-slate-400">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Yeni Davet Oluştur */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">🎟</span>
                    Yeni Davet Kodu
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Email (Opsiyonel)</label>
                        <input
                            type="email"
                            value={newInviteEmail}
                            onChange={(e) => setNewInviteEmail(e.target.value)}
                            className={inputClass}
                            placeholder="ornek@gmail.com"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Notlar (Opsiyonel)</label>
                        <input
                            type="text"
                            value={newInviteNotes}
                            onChange={(e) => setNewInviteNotes(e.target.value)}
                            className={inputClass}
                            placeholder="Arkadaşım Ali"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Geçerlilik Süresi (Gün)</label>
                        <input
                            type="number"
                            value={newInviteDays}
                            onChange={(e) => setNewInviteDays(parseInt(e.target.value))}
                            min="1"
                            max="365"
                            className={inputClass}
                        />
                    </div>

                    <button
                        onClick={createInvite}
                        className="w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm"
                    >
                        Davet Kodu Oluştur
                    </button>

                    {statusMessage && (
                        <div className={`mt-3 p-3 rounded-xl text-sm font-medium text-center animate-fade-in ${
                            statusMessage.startsWith('Hata') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                            {statusMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Mevcut Davetler */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">📋</span>
                    Davetler
                </h3>

                {invites.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                        Henüz davet kodu oluşturmadınız.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div
                                key={invite.code}
                                className={`border rounded-xl p-4 transition-colors ${
                                    invite.is_used
                                        ? 'bg-emerald-50/50 border-emerald-200'
                                        : isExpired(invite.expires_at)
                                        ? 'bg-slate-50/50 border-slate-200'
                                        : 'bg-white border-slate-200'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-base text-slate-800">
                                                {invite.code}
                                            </span>
                                            {invite.is_used && (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                                    Kullanıldı
                                                </span>
                                            )}
                                            {!invite.is_used && isExpired(invite.expires_at) && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                                    Süresi doldu
                                                </span>
                                            )}
                                        </div>
                                        {invite.invited_email && (
                                            <p className="text-xs text-slate-500 mt-1">{invite.invited_email}</p>
                                        )}
                                        {invite.notes && (
                                            <p className="text-xs text-slate-400 mt-0.5">{invite.notes}</p>
                                        )}
                                    </div>

                                    {!invite.is_used && !isExpired(invite.expires_at) && (
                                        <button
                                            onClick={() => deleteInvite(invite.code)}
                                            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                                        >
                                            Sil
                                        </button>
                                    )}
                                </div>

                                <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                                    <p>Oluşturulma: {formatDate(invite.created_at)}</p>
                                    <p>Son Kullanım: {formatDate(invite.expires_at)}</p>
                                    {invite.is_used && invite.used_at && (
                                        <p className="text-emerald-600 font-medium">
                                            Kullanıldı: {formatDate(invite.used_at)}
                                        </p>
                                    )}
                                </div>

                                {!invite.is_used && !isExpired(invite.expires_at) && (
                                    <button
                                        onClick={() => copyToClipboard(invite.invite_url)}
                                        className="mt-3 w-full bg-brand-50 text-brand-700 py-2 px-3 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
                                    >
                                        {copiedCode === invite.code ? 'Kopyalandı!' : 'Linki Kopyala'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InviteManager;
