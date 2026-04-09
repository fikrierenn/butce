import React, { useState, useEffect } from 'react';
import { checkForUpdate, getAppVersion } from '../lib/updateChecker';

const UpdateBanner: React.FC = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(false);
    const [releaseNotes, setReleaseNotes] = useState('');
    const [newVersion, setNewVersion] = useState('');
    const [apkUrl, setApkUrl] = useState('');

    useEffect(() => {
        const check = async () => {
            const result = await checkForUpdate();
            if (result.hasUpdate && result.versionInfo) {
                setShowBanner(true);
                setForceUpdate(result.forceUpdate);
                setReleaseNotes(result.versionInfo.releaseNotes);
                setNewVersion(result.versionInfo.version);
                setApkUrl(result.versionInfo.apkUrl);
            }
        };
        check();
    }, []);

    if (!showBanner) return null;

    return (
        <>
            {/* Zorunlu güncelleme: arka planı kilitle */}
            {forceUpdate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
            )}

            <div className={`fixed ${forceUpdate ? 'inset-0 flex items-center justify-center z-[61]' : 'top-4 left-4 right-4 z-50'}`}>
                <div className={`bg-white rounded-2xl shadow-modal p-5 ${forceUpdate ? 'w-full max-w-sm mx-4' : 'max-w-2xl mx-auto'} animate-slide-up`}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                            🚀
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-800">
                                {forceUpdate ? 'Güncelleme Zorunlu' : 'Güncelleme Mevcut'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                v{getAppVersion()} → v{newVersion}
                            </p>
                            {releaseNotes && (
                                <p className="text-xs text-slate-400 mt-1">{releaseNotes}</p>
                            )}
                        </div>
                    </div>

                    <div className={`flex gap-2 mt-4 ${forceUpdate ? '' : ''}`}>
                        {!forceUpdate && (
                            <button
                                onClick={() => setShowBanner(false)}
                                className="flex-1 px-3 py-2 border border-slate-200 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Sonra
                            </button>
                        )}
                        <a
                            href={apkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors text-center shadow-sm"
                        >
                            Güncelle
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpdateBanner;
