// Türkçe Açıklama:
// AI çağrıları artık doğrudan client'tan değil, Supabase Edge Function
// üzerinden yapılır. API key'ler Edge Function'ın secrets'inde tutulur,
// bundle'a gömülmez — key leak sorunu tamamen çözülmüştür.
//
// Edge Function: ai-proxy (POST)
// Body: { mode: "text"|"receipt"|"sms", payload: string, categories: [...], accounts: [...] }

import { supabase } from './supabaseClient';
import { Category, Account } from '../types';

// 30 saniye timeout — kullanıcıyı sonsuza kadar bekletmemek için
const AI_TIMEOUT_MS = 30_000;

async function callAIProxy(
    mode: 'text' | 'receipt' | 'sms',
    payload: string,
    categories: Category[],
    accounts: Account[],
    mimeType?: string,
): Promise<any> {
    const cats = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: c.subcategories?.map(s => ({ id: s.id, name: s.name })),
    }));
    const accs = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: { mode, payload, categories: cats, accounts: accs, mimeType },
        });

        if (error) {
            throw new Error(error.message || 'AI proxy çağrısı başarısız');
        }
        if (data?.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (e: any) {
        if (e.name === 'AbortError' || controller.signal.aborted) {
            throw new Error('AI yanıt vermedi (30sn zaman aşımı). Tekrar deneyin.');
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

// Public API — TransactionForm ve diğer bileşenler bunları kullanır

export const parseTransactionWithAI = async (
    prompt: string,
    categories: Category[],
    accounts: Account[],
): Promise<any | null> => {
    return callAIProxy('text', prompt, categories, accounts, undefined);
};

export const parseReceiptWithAI = async (
    imageBase64: string,
    mimeType: string,
    categories: Category[],
    accounts: Account[],
): Promise<any | null> => {
    // Receipt: Groq Llama 4 Scout vision modeli ile fiş fotoğrafı analiz edilir
    const cats = categories.map(c => ({
        id: c.id, name: c.name, type: c.type,
        subcategories: c.subcategories?.map(s => ({ id: s.id, name: s.name })),
    }));
    const accs = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

    const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { mode: 'receipt', payload: imageBase64, categories: cats, accounts: accs, mimeType },
    });

    if (error) throw new Error(error.message || 'Fiş analiz hatası');
    if (data?.error) throw new Error(data.error);
    return data;
};

export const parseSmsWithAI = async (
    smsText: string,
    categories: Category[],
    accounts: Account[],
): Promise<any[] | null> => {
    const result = await callAIProxy('sms', smsText, categories, accounts);
    return result?.transactions || [result];
};

// Backward compatibility — eski import'lar bozulmasın
export const parseTransactionWithGemini = parseTransactionWithAI;
export const parseReceiptWithGemini = parseReceiptWithAI;
export const parseSmsWithGemini = parseSmsWithAI;
