import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import SpendMeLogo from './icons/SpendMeLogo';
import { useI18n } from '../lib/i18n';

const Auth: React.FC = () => {
    const { t } = useI18n();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!email || !password) {
            setError('E-posta ve şifre gerekli.');
            setLoading(false);
            return;
        }

        if (isSignUp) {
            if (password !== confirmPassword) {
                setError('Şifreler eşleşmiyor.');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('Şifre en az 6 karakter olmalı.');
                setLoading(false);
                return;
            }
            if (!inviteCode.trim()) {
                setError('Davet kodu gerekli.');
                setLoading(false);
                return;
            }

            // Önce kayıt ol
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            // Davet kodunu doğrula ve kullan
            if (signUpData.user) {
                const { data: isValid, error: inviteError } = await supabase.rpc('validate_and_use_invite', {
                    code_param: inviteCode.trim().toUpperCase(),
                    user_email_param: email
                });

                if (inviteError || !isValid) {
                    setError('Davet kodu geçersiz veya süresi dolmuş.');
                    // Kayıt oldu ama davet kodu geçersiz - kullanıcıyı bilgilendir
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }
            }

            setMessage('Hesabınız oluşturuldu! Giriş yapabilirsiniz.');
            setIsSignUp(false);
            setPassword('');
            setConfirmPassword('');
            setInviteCode('');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message);
            }
        }
        setLoading(false);
    };

    const inputClass = "w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all";

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4">
            <div className="absolute top-20 -left-20 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl" />

            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-modal p-8 w-full max-w-sm animate-scale-in">
                <div className="flex items-center justify-center mx-auto mb-4">
                    <SpendMeLogo size={56} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 text-center">SpendMe</h1>
                <p className="text-sm text-slate-400 text-center mt-1">{t('auth.tagline')}</p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 mt-6">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl border border-emerald-100 mt-6">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.email')}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" className={inputClass} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" className={inputClass} required />
                    </div>
                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.confirmPassword')}</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Şifreyi tekrar girin" className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Davet Kodu</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="XXXX XXXX"
                                    maxLength={8}
                                    className={`${inputClass} text-center font-mono text-base tracking-widest`}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Mevcut bir kullanıcıdan davet kodu alın</p>
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '...' : isSignUp ? t('auth.register') : t('auth.login')}
                    </button>
                </form>

                <div className="text-sm text-center mt-6">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                            setConfirmPassword('');
                            setInviteCode('');
                        }}
                        className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                        {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
