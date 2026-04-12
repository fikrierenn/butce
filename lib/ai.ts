// AI çağrıları Supabase Edge Function proxy üzerinden.
// API key'ler Edge Function secrets'te, bundle'da yok.

import { supabase } from './supabaseClient';
import { Category, Account } from '../types';

const AI_TIMEOUT_MS = 30_000;

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

    const { data, error } = await withTimeout(
        supabase.functions.invoke('ai-proxy', {
            body: { mode, payload, categories: cats, accounts: accs, mimeType },
        }),
        AI_TIMEOUT_MS,
    );

    if (error) throw new Error(error.message || 'AI proxy çağrısı başarısız');
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
    return callAIProxy('receipt', imageBase64, categories, accounts, mimeType);
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
