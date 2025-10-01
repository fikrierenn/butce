import React from 'react';
import { User } from '@supabase/supabase-js';

// Türkçe Açıklama:
// Kullanıcı profil bilgilerini gösteren bileşen
// Email, kullanıcı ID gibi bilgileri gösterir

interface UserProfileProps {
    user: User | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    if (!user) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                👤 Kullanıcı Bilgileri
            </h3>
            
            <div className="space-y-3">
                <div className="flex items-start">
                    <div className="w-24 text-sm text-gray-600 font-medium">Email:</div>
                    <div className="flex-1 text-sm break-all">{user.email}</div>
                </div>
                
                {user.user_metadata?.full_name && (
                    <div className="flex items-start">
                        <div className="w-24 text-sm text-gray-600 font-medium">İsim:</div>
                        <div className="flex-1 text-sm">{user.user_metadata.full_name}</div>
                    </div>
                )}
                
                <div className="flex items-start">
                    <div className="w-24 text-sm text-gray-600 font-medium">Kullanıcı ID:</div>
                    <div className="flex-1 text-xs text-gray-500 break-all font-mono">{user.id}</div>
                </div>
                
                <div className="flex items-start">
                    <div className="w-24 text-sm text-gray-600 font-medium">Kayıt Tarihi:</div>
                    <div className="flex-1 text-sm">
                        {new Date(user.created_at!).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
                
                {user.last_sign_in_at && (
                    <div className="flex items-start">
                        <div className="w-24 text-sm text-gray-600 font-medium">Son Giriş:</div>
                        <div className="flex-1 text-sm">
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

            {/* Profil resmi varsa göster */}
            {user.user_metadata?.avatar_url && (
                <div className="mt-4 pt-4 border-t">
                    <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profil" 
                        className="w-16 h-16 rounded-full"
                    />
                </div>
            )}
        </div>
    );
};

export default UserProfile;

