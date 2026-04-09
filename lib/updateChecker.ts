const APP_VERSION = '1.1.2';
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/fikrierenn/butce/main/public/version.json';

interface VersionInfo {
    version: string;
    build: number;
    minVersion: string;
    releaseNotes: string;
    apkUrl: string;
    forceUpdate: boolean;
}

const compareVersions = (current: string, remote: string): number => {
    const a = current.split('.').map(Number);
    const b = remote.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((b[i] || 0) > (a[i] || 0)) return 1;
        if ((b[i] || 0) < (a[i] || 0)) return -1;
    }
    return 0;
};

export const checkForUpdate = async (): Promise<{
    hasUpdate: boolean;
    forceUpdate: boolean;
    versionInfo: VersionInfo | null;
}> => {
    try {
        const res = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), {
            cache: 'no-store',
        });
        if (!res.ok) return { hasUpdate: false, forceUpdate: false, versionInfo: null };

        const info: VersionInfo = await res.json();
        const hasUpdate = compareVersions(APP_VERSION, info.version) > 0;
        const forceUpdate = info.forceUpdate || compareVersions(APP_VERSION, info.minVersion) > 0;

        return { hasUpdate, forceUpdate, versionInfo: info };
    } catch (e) {
        return { hasUpdate: false, forceUpdate: false, versionInfo: null };
    }
};

export const getAppVersion = () => APP_VERSION;
