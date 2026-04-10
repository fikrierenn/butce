#!/usr/bin/env node
// Türkçe Açıklama:
// Tek sürüm kaynağı package.json'daki "version" alanıdır.
// Bu script, o değeri aşağıdaki dosyalara yayar ki hiçbir yerde hardcode kalmasın:
//   1) public/version.json   (remote update manifest)
//   2) android/app/build.gradle (versionName + versionCode)
//
// Kullanım:
//   node scripts/sync-version.mjs           (senkronize et)
//   node scripts/sync-version.mjs --check   (drift var mı kontrol et; varsa exit 1)
//
// npm scripts üzerinden:
//   npm run version:sync  → her build / cap sync öncesi tetiklenir

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkgPath = path.join(root, 'package.json');
const versionJsonPath = path.join(root, 'public', 'version.json');
const buildGradlePath = path.join(root, 'android', 'app', 'build.gradle');

const checkMode = process.argv.includes('--check');

function log(msg) {
    console.log(`[sync-version] ${msg}`);
}

// 1) package.json'dan sürümü oku
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;
if (!version) {
    console.error('[sync-version] HATA: package.json içinde "version" alanı bulunamadı');
    process.exit(1);
}

// Semver'den versionCode üret: 1.2.3 → 10203 (major*10000 + minor*100 + patch)
const [major, minor, patch] = version.split('.').map(Number);
if ([major, minor, patch].some(n => Number.isNaN(n))) {
    console.error(`[sync-version] HATA: Geçersiz semver formatı: ${version}`);
    process.exit(1);
}
const versionCode = major * 10000 + minor * 100 + patch;

log(`package.json version: ${version} (versionCode: ${versionCode})`);

const drift = [];

// 2) public/version.json senkronize et
// releaseNotes içinde {version} placeholder'ı otomatik doldurulur.
// Eski sürüm numarası (vX.Y.Z) içeriyorsa yeni sürümle değiştirilir.
{
    const current = JSON.parse(readFileSync(versionJsonPath, 'utf-8'));

    let nextReleaseNotes = current.releaseNotes || 'SpendMe v{version}';
    nextReleaseNotes = nextReleaseNotes.replace(/\{version\}/g, version);
    // Eski vX.Y.Z pattern'ini yeni sürümle değiştir (sadece tam eşleşme)
    nextReleaseNotes = nextReleaseNotes.replace(/v\d+\.\d+\.\d+/g, `v${version}`);

    const next = {
        ...current,
        version,
        build: versionCode,
        releaseNotes: nextReleaseNotes,
    };
    const currentStr = JSON.stringify(current, null, 2);
    const nextStr = JSON.stringify(next, null, 2) + '\n';
    if (currentStr + '\n' !== nextStr) {
        drift.push(`public/version.json (version: ${current.version} → ${version}, build: ${current.build} → ${versionCode})`);
        if (!checkMode) {
            writeFileSync(versionJsonPath, nextStr);
            log('public/version.json güncellendi');
        }
    } else {
        log('public/version.json zaten güncel');
    }
}

// 3) android/app/build.gradle senkronize et (varsa)
// CI'de npx cap add android çağrılmadan önce android/ klasörü olmayabilir —
// bu durumda sadece uyarı verip geçeriz.
if (!existsSync(buildGradlePath)) {
    log('android/app/build.gradle bulunamadı — atlanıyor (CI\'de cap add öncesi normal)');
} else {
    const gradle = readFileSync(buildGradlePath, 'utf-8');

    // versionCode ve versionName satırlarını regex ile değiştir
    const versionCodeRe = /(versionCode\s+)\d+/;
    const versionNameRe = /(versionName\s+)"[^"]*"/;

    const currentVersionCodeMatch = gradle.match(versionCodeRe);
    const currentVersionNameMatch = gradle.match(versionNameRe);

    if (!currentVersionCodeMatch || !currentVersionNameMatch) {
        console.error('[sync-version] HATA: build.gradle içinde versionCode/versionName satırları bulunamadı');
        process.exit(1);
    }

    const currentCode = currentVersionCodeMatch[0].match(/\d+/)[0];
    const currentName = currentVersionNameMatch[0].match(/"([^"]*)"/)[1];

    if (currentCode !== String(versionCode) || currentName !== version) {
        drift.push(`android/app/build.gradle (versionName: ${currentName} → ${version}, versionCode: ${currentCode} → ${versionCode})`);
        if (!checkMode) {
            const next = gradle
                .replace(versionCodeRe, `$1${versionCode}`)
                .replace(versionNameRe, `$1"${version}"`);
            writeFileSync(buildGradlePath, next);
            log('android/app/build.gradle güncellendi');
        }
    } else {
        log('android/app/build.gradle zaten güncel');
    }
}

if (drift.length === 0) {
    log('✓ Tüm dosyalar package.json ile eşleşiyor');
    process.exit(0);
}

if (checkMode) {
    console.error('[sync-version] ✗ Drift tespit edildi:');
    drift.forEach(d => console.error('  - ' + d));
    console.error('[sync-version] Düzeltmek için: npm run version:sync');
    process.exit(1);
}

log('✓ Senkronizasyon tamamlandı');
