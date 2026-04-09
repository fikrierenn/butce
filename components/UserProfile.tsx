import React from 'react';
import { User } from '@supabase/supabase-js';

interface UserProfileProps {
    user: User | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    if (!user) return null;

    const initial = (user.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card border border-slate-100/60 p-5">
            <div className="flex items-center gap-4 mb-4">
                {user.user_metadata?.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt="Profil"
                        className="w-12 h-12 rounded-xl"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold">
                        {initial}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                        {user.user_metadata?.full_name || user.email}
                    </p>
                    {user.user_metadata?.full_name && (
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-start">
                    <div className="w-24 text-xs text-slate-400 font-medium pt-0.5">Kullanıcı ID</div>
                    <div className="flex-1 text-xs text-slate-500 break-all font-mono">{user.id}</div>
                </div>

                <div className="flex items-start">
                    <div className="w-24 text-xs text-slate-400 font-medium pt-0.5">Kayıt Tarihi</div>
                    <div className="flex-1 text-sm text-slate-700">
                        {new Date(user.created_at!).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                {user.last_sign_in_at && (
                    <div className="flex items-start">
                        <div className="w-24 text-xs text-slate-400 font-medium pt-0.5">Son Giriş</div>
                        <div className="flex-1 text-sm text-slate-700">
                            {new Date(user.last_sign_in_at).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
