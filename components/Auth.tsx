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
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                setMessage('Hesabınız oluşturuldu! E-posta adresinizi doğrulayın veya giriş yapın.');
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4">
            {/* Decorative background orbs */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl" />

            {/* Login card */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-modal p-8 w-full max-w-sm animate-scale-in">
                {/* App branding */}
                <div className="flex items-center justify-center mx-auto mb-4">
                    <SpendMeLogo size={56} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 text-center">SpendMe</h1>
                <p className="text-sm text-slate-400 text-center mt-1">{t('auth.tagline')}</p>

                {/* Alerts */}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="En az 6 karakter"
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            required
                        />
                    </div>
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Şifreyi tekrar girin"
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                required
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '...' : isSignUp ? t('auth.register') : t('auth.login')}
                    </button>
                </form>

                {/* Toggle link */}
                <div className="text-sm text-center mt-6">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                            setConfirmPassword('');
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
