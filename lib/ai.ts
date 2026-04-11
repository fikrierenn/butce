// Türkçe Açıklama:
// AI provider abstraction. Primary = Grok (xAI), fallback = Gemini.
// Grok OpenAI-uyumlu endpoint sağladığı için fetch ile doğrudan çağırılır,
// ekstra SDK gerekmez. Gemini hâlâ @google/generative-ai paketiyle.
//
// Model isimleri env'den override edilebilir — deprecate olduğunda
// .env dosyasını değiştirmek yeterli, kod dokunulmaz.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Account, Category, TransactionType } from '../types';

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------

const xaiKey = process.env.XAI_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

// Default modeller — src'de hardcode değil, env override'lanabilir.
// Nisan 2026 itibarıyla stable sürümler:
//   Grok: grok-4-1-fast-non-reasoning (hızlı, JSON extraction için yeterli)
//   Gemini: gemini-2.5-flash (stable, multimodal)
const XAI_MODEL = (process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning') as string;
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash') as string;
const GEMINI_VISION_MODEL = (process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash') as string;

const XAI_BASE_URL = 'https://api.x.ai/v1';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const cleanJsonResponse = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
};

const serializeCategories = (categories: Category[]) =>
    JSON.stringify(categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: c.subcategories?.map(sub => ({ id: sub.id, name: sub.name }))
    })));

const serializeAccounts = (accounts: Account[]) =>
    JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, type: a.type })));

// -----------------------------------------------------------------------------
// Grok (xAI) — OpenAI-compatible chat completions
// -----------------------------------------------------------------------------

type GrokMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
    >;
};

async function callGrok(messages: GrokMessage[]): Promise<string> {
    if (!xaiKey) throw new Error('XAI_API_KEY tanımlı değil');

    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${xaiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: XAI_MODEL,
            messages,
            temperature: 0.1,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Grok API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Grok: boş cevap');
    return content;
}

// -----------------------------------------------------------------------------
// Gemini fallback
// -----------------------------------------------------------------------------

const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

async function callGemini(
    systemInstruction: string,
    userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
    useVisionModel = false,
): Promise<string> {
    if (!genAI) throw new Error('GEMINI_API_KEY tanımlı değil');
    const model = genAI.getGenerativeModel({
        model: useVisionModel ? GEMINI_VISION_MODEL : GEMINI_MODEL,
    });
    const result = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [{ text: systemInstruction }, ...userParts],
        }],
    });
    const text = result.response.text();
    if (!text) throw new Error('Gemini: boş cevap');
    return text;
}

// -----------------------------------------------------------------------------
// Provider router — Grok dene, hata olursa Gemini'ye düş
// -----------------------------------------------------------------------------

type AIProvider = 'grok' | 'gemini';
type LastUsed = { provider: AIProvider; error?: string };

export const lastAIUsed: LastUsed = { provider: 'grok' };

async function tryGrokThenGemini(
    grokMessages: GrokMessage[],
    geminiSystemInstruction: string,
    geminiUserParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
    opts?: { visionRequired?: boolean },
): Promise<string> {
    const visionRequired = !!opts?.visionRequired;

    // Vision gerekli ise Grok'u atla (güvenli yol — Grok vision endpoint ayrı)
    if (!visionRequired && xaiKey) {
        try {
            const text = await callGrok(grokMessages);
            lastAIUsed.provider = 'grok';
            lastAIUsed.error = undefined;
            return text;
        } catch (e: any) {
            console.warn('[ai] Grok başarısız, Gemini\'ye düşülüyor:', e?.message || e);
            lastAIUsed.error = e?.message || String(e);
        }
    }

    if (genAI) {
        const text = await callGemini(geminiSystemInstruction, geminiUserParts, visionRequired);
        lastAIUsed.provider = 'gemini';
        return text;
    }

    throw new Error('Hiçbir AI provider yapılandırılmamış (XAI_API_KEY veya GEMINI_API_KEY gerekli)');
}

// -----------------------------------------------------------------------------
// Public API — TransactionForm bunları kullanır
// -----------------------------------------------------------------------------

function buildTransactionPrompt(categories: Category[], accounts: Account[]): string {
    return `You are an expert financial assistant. Convert the user's input into a strict JSON object for a financial transaction.
Today is ${new Date().toLocaleDateString('en-CA')}.
Categories: ${serializeCategories(categories)}
Accounts: ${serializeAccounts(accounts)}
Output MUST be valid JSON only (no markdown, no extra text) with fields:
{
  "type": "${TransactionType.INCOME}|${TransactionType.EXPENSE}|${TransactionType.TRANSFER}",
  "amount": number,
  "description": string,
  "date": "YYYY-MM-DD",
  "category_id": number?,
  "account_id": number?,
  "from_account_id": number?,
  "to_account_id": number?,
  "is_installment": boolean?,
  "installment_count": number?
}
Rules:
- For income/expense: provide category_id and account_id (category type must match transaction type).
- For transfer: provide from_account_id and to_account_id.
- Keep description short. If uncertain about a field, omit it.
- For installment transactions: set is_installment=true and installment_count=number of installments.
- Turkish language support: understand "taksit", "aylık", "3 taksit", "6 ay" etc.
- Category selection: prefer specific subcategories over parent categories when available.
- For clothing: use "Giyim" subcategory if available, not just "Giyim" parent category.`;
}

export const parseTransactionWithAI = async (
    prompt: string,
    categories: Category[],
    accounts: Account[]
): Promise<any | null> => {
    const systemInstruction = buildTransactionPrompt(categories, accounts);
    try {
        const text = await tryGrokThenGemini(
            [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt },
            ],
            systemInstruction,
            [{ text: '\n\nUser input: ' + prompt }],
        );
        return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
        console.error('[ai] parseTransaction hatası:', error);
        throw error;
    }
};

export const parseReceiptWithAI = async (
    imageBase64: string,
    mimeType: string,
    categories: Category[],
    accounts: Account[]
): Promise<any | null> => {
    const systemInstruction = `Sen bir finansal fiş/makbuz analiz uzmanısın. Verilen fiş/makbuz fotoğrafını analiz et ve yapılandırılmış JSON formatında döndür.
Bugünün tarihi: ${new Date().toLocaleDateString('en-CA')}.
Kategoriler: ${serializeCategories(categories)}
Hesaplar: ${serializeAccounts(accounts)}

Fiş/makbuzdan şu bilgileri çıkar:
- Mağaza/işyeri adı (description olarak kullan)
- Toplam tutar (KDV dahil, TOPLAM satırı)
- Tarih (fiş üzerindeki tarih, yoksa bugünün tarihi)
- Ödeme yöntemi (kredi kartı ise credit_card tipindeki hesabı, nakit ise cash tipindeki hesabı seç)

Çıktı SADECE geçerli JSON olmalıdır (markdown yok, ekstra metin yok):
{
  "type": "${TransactionType.EXPENSE}",
  "amount": number,
  "description": string,
  "date": "YYYY-MM-DD",
  "category_id": number,
  "account_id": number
}

Kurallar:
- Tür her zaman expense olacak (fiş = harcama)
- Açıklama kısa olsun: "Market Alışverişi - [mağaza adı]" formatında
- En uygun kategoriyi seç (alt kategoriler varsa onları tercih et)
- Tutar ondalıklı olabilir (örn: 125.50)
- Tarih formatı: YYYY-MM-DD
- Türkçe fiş formatlarını anla: TOPLAM, KDV, GENEL TOPLAM, ARA TOPLAM`;

    // Receipt için vision gerekli — Grok vision desteği belirsiz,
    // güvenli yol: direkt Gemini'ye git.
    try {
        const text = await tryGrokThenGemini(
            [],
            systemInstruction,
            [{ inlineData: { mimeType, data: imageBase64 } }],
            { visionRequired: true },
        );
        return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
        console.error('[ai] parseReceipt hatası:', error);
        throw error;
    }
};

export const parseSmsWithAI = async (
    smsText: string,
    categories: Category[],
    accounts: Account[]
): Promise<any[] | null> => {
    const systemInstruction = `Sen bir Türk bankacılık SMS analiz uzmanısın. Verilen SMS mesajlarını analiz et ve her birini yapılandırılmış JSON formatında döndür.
Bugünün tarihi: ${new Date().toLocaleDateString('en-CA')}.
Kategoriler: ${serializeCategories(categories)}
Hesaplar: ${serializeAccounts(accounts)}

Türk bankası SMS formatlarını tanı (Garanti BBVA, İş Bankası, Yapı Kredi, Akbank, QNB, Ziraat, Halkbank, Denizbank, TEB, ING, HSBC).
İşlem türünü belirle: Gelir (maaş, havale gelen, iade), Gider (ödeme, alışveriş, fatura), Transfer.
Taksit bilgisini tespit et: "taksit", "X taksit", "N/M taksit".

Çıktı SADECE geçerli JSON olmalıdır:
{
  "transactions": [
    {
      "type": "income|expense|transfer",
      "amount": number,
      "description": string,
      "date": "YYYY-MM-DD",
      "category_id": number,
      "account_id": number,
      "is_installment": boolean,
      "installment_count": number | null
    }
  ]
}

Kurallar:
- Birden fazla SMS varsa her biri için ayrı işlem oluştur
- Açıklama kısa olsun
- En uygun kategori ve hesabı seç
- Tarih SMS'te yoksa bugünün tarihini kullan
- Türkçe karakterleri ve ASCII versiyonlarını anla (s=ş, c=ç, g=ğ, i=ı, o=ö, u=ü)`;

    try {
        const text = await tryGrokThenGemini(
            [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: 'SMS Mesajları:\n' + smsText },
            ],
            systemInstruction,
            [{ text: '\n\nSMS Mesajları:\n' + smsText }],
        );
        const parsed = JSON.parse(cleanJsonResponse(text));
        return parsed.transactions || [parsed];
    } catch (error) {
        console.error('[ai] parseSms hatası:', error);
        throw error;
    }
};

// -----------------------------------------------------------------------------
// Backward compatibility — eski isimler lib/gemini.ts üzerinden re-export
// -----------------------------------------------------------------------------

export const parseTransactionWithGemini = parseTransactionWithAI;
export const parseReceiptWithGemini = parseReceiptWithAI;
export const parseSmsWithGemini = parseSmsWithAI;
