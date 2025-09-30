import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Türkçe Açıklama:
// Davet kodu yönetim bileşeni. Admin kullanıcılar buradan
// yeni davet kodları oluşturabilir ve mevcut davetleri görebilir.

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

const InviteManager: React.FC = () => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [newInviteEmail, setNewInviteEmail] = useState('');
    const [newInviteNotes, setNewInviteNotes] = useState('');
    const [newInviteDays, setNewInviteDays] = useState(7);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
            alert('Davet kodu oluşturulurken hata: ' + error.message);
        } else if (data && data.length > 0) {
            alert(`Davet kodu oluşturuldu: ${data[0].invite_code}`);
            copyToClipboard(data[0].invite_url);
            setNewInviteEmail('');
            setNewInviteNotes('');
            loadInvites();
        }
    };

    const deleteInvite = async (code: string) => {
        if (!confirm(`${code} kodunu silmek istediğinize emin misiniz?`)) return;

        const { data, error } = await supabase.rpc('delete_invite', {
            code_param: code
        });

        if (error) {
            alert('Silme hatası: ' + error.message);
        } else if (data) {
            alert('Davet kodu silindi');
            loadInvites();
        } else {
            alert('Davet kodu bulunamadı veya zaten kullanılmış');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            const code = text.split('invite=')[1];
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
        return <div className="p-4">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Yeni Davet Oluştur */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">🎟️ Yeni Davet Kodu Oluştur</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (Opsiyonel - belirli bir kişi için)
                        </label>
                        <input
                            type="email"
                            value={newInviteEmail}
                            onChange={(e) => setNewInviteEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="ornek@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notlar (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            value={newInviteNotes}
                            onChange={(e) => setNewInviteNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Arkadaşım Ali"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Geçerlilik Süresi (Gün)
                        </label>
                        <input
                            type="number"
                            value={newInviteDays}
                            onChange={(e) => setNewInviteDays(parseInt(e.target.value))}
                            min="1"
                            max="365"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <button
                        onClick={createInvite}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Davet Kodu Oluştur
                    </button>
                </div>
            </div>

            {/* Mevcut Davetler */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">📋 Oluşturduğunuz Davetler</h3>
                    
                    {invites.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            Henüz davet kodu oluşturmadınız.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {invites.map((invite) => (
                                <div
                                    key={invite.code}
                                    className={`border rounded-lg p-4 ${
                                        invite.is_used
                                            ? 'bg-green-50 border-green-200'
                                            : isExpired(invite.expires_at)
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-white border-gray-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-lg">
                                                    {invite.code}
                                                </span>
                                                {invite.is_used && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        ✓ Kullanıldı
                                                    </span>
                                                )}
                                                {!invite.is_used && isExpired(invite.expires_at) && (
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                        ⌛ Süresi doldu
                                                    </span>
                                                )}
                                            </div>
                                            {invite.invited_email && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    📧 {invite.invited_email}
                                                </p>
                                            )}
                                            {invite.notes && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    📝 {invite.notes}
                                                </p>
                                            )}
                                        </div>

                                        {!invite.is_used && !isExpired(invite.expires_at) && (
                                            <button
                                                onClick={() => deleteInvite(invite.code)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Sil
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                                        <p>Oluşturulma: {formatDate(invite.created_at)}</p>
                                        <p>Son Kullanım: {formatDate(invite.expires_at)}</p>
                                        {invite.is_used && invite.used_at && (
                                            <p className="text-green-600 font-medium">
                                                Kullanıldı: {formatDate(invite.used_at)}
                                            </p>
                                        )}
                                    </div>

                                    {!invite.is_used && !isExpired(invite.expires_at) && (
                                        <button
                                            onClick={() => copyToClipboard(invite.invite_url)}
                                            className="mt-3 w-full bg-indigo-50 text-indigo-700 py-2 px-3 rounded text-sm hover:bg-indigo-100 transition-colors"
                                        >
                                            {copiedCode === invite.code ? '✓ Kopyalandı!' : '📋 Linki Kopyala'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteManager;

