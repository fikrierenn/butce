// AI çağrıları Supabase Edge Function proxy üzerinden.
// API key'ler Edge Function secrets'te, bundle'da yok.

import { supabase } from './supabaseClient';
import { Category, Account } from '../types';

const AI_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('AI yanıt vermedi (zaman aşımı). Tekrar deneyin.')), ms);
        promise
            .then(val => { clearTimeout(timer); resolve(val); })
            .catch(err => { clearTimeout(timer); reject(err); });
    });
}

async function callAIProxy(
    mode: 'text' | 'receipt' | 'sms',
    payload: string,
    categories: Category[],
    accounts: Account[],
    mimeType?: string,
): Promise<any> {
    const cats = categories.map(c => ({
        id: c.id, name: c.name, type: c.type,
        subcategories: c.subcategories?.map(s => ({ id: s.id, name: s.name })),
    }));
    const accs = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

    const response = await withTimeout(
        supabase.functions.invoke('ai-proxy', {
            body: { mode, payload, categories: cats, accounts: accs, mimeType },
        }),
        AI_TIMEOUT_MS,
    );

    console.log('[ai] response:', JSON.stringify(response).slice(0, 200));

    const { data, error } = response;
    if (error) throw new Error(error.message || 'AI proxy çağrısı başarısız');
    if (!data) throw new Error('AI boş cevap döndü');
    if (data?.error) throw new Error(data.error);
    return data;
}

export const parseTransactionWithAI = async (
    prompt: string, categories: Category[], accounts: Account[],
): Promise<any | null> => {
    return callAIProxy('text', prompt, categories, accounts);
};

export const parseReceiptWithAI = async (
    imageBase64: string, mimeType: string, categories: Category[], accounts: Account[],
): Promise<any | null> => {
    // supabase.functions.invoke base64 body ile takılıyor — fiş için düz fetch
    const cats = categories.map(c => ({
        id: c.id, name: c.name, type: c.type,
        subcategories: c.subcategories?.map(s => ({ id: s.id, name: s.name })),
    }));
    const accs = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

    const { data: { session } } = await supabase.auth.getSession();
    const url = `${(supabase as any).supabaseUrl}/functions/v1/ai-proxy`;
    const key = (supabase as any).supabaseKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
        console.log('[receipt] fetch başlatılıyor, base64 len:', imageBase64.length);
        const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || key}`,
                'apikey': key,
            },
            body: JSON.stringify({ mode: 'receipt', payload: imageBase64, categories: cats, accounts: accs, mimeType }),
        });
        console.log('[receipt] fetch status:', res.status);

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            let msg = `Fiş analiz hatası (${res.status})`;
            try { msg = JSON.parse(errBody).error || msg; } catch {}
            throw new Error(msg);
        }

        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        return data;
    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Fiş analizi zaman aşımı. Tekrar deneyin.');
        throw e;
    } finally {
        clearTimeout(timer);
    }
};

export const parseSmsWithAI = async (
    smsText: string, categories: Category[], accounts: Account[],
): Promise<any[] | null> => {
    const result = await callAIProxy('sms', smsText, categories, accounts);
    return result?.transactions || [result];
};

// Backward compatibility
export const parseTransactionWithGemini = parseTransactionWithAI;
export const parseReceiptWithGemini = parseReceiptWithAI;
export const parseSmsWithGemini = parseSmsWithAI;
