import { GoogleGenerativeAI } from "@google/generative-ai";
import { Account, Category, TransactionType } from "../types";

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) console.error('GEMINI_API_KEY .env dosyasında tanımlanmalı!');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Gemini yanıtından markdown code block'larını temizle
const cleanJsonResponse = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
};

// Kategori ve hesap bilgilerini Gemini prompt'u için serialize et
const serializeCategories = (categories: Category[]) =>
    JSON.stringify(categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: c.subcategories?.map(sub => ({ id: sub.id, name: sub.name }))
    })));

const serializeAccounts = (accounts: Account[]) =>
    JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, type: a.type })));

export const parseTransactionWithGemini = async (
    prompt: string,
    categories: Category[],
    accounts: Account[]
): Promise<any | null> => {

    const systemInstruction = `You are an expert financial assistant. Convert the user's input into a strict JSON object for a financial transaction.
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

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: systemInstruction + "\n\nUser input: " + prompt }
                    ]
                }
            ]
        });

        const text = result.response.text();
        if (!text) return null;

        const parsed = JSON.parse(cleanJsonResponse(text));
        return parsed;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};

export const parseReceiptWithGemini = async (
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

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: imageBase64 } },
                        { text: systemInstruction }
                    ]
                }
            ]
        });

        const text = result.response.text();
        if (!text) return null;

        return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
        console.error("Error calling Gemini API for receipt:", error);
        return null;
    }
};

export const parseSmsWithGemini = async (
    smsText: string,
    categories: Category[],
    accounts: Account[]
): Promise<any[] | null> => {
    const systemInstruction = `Sen bir Türk bankacılık SMS analiz uzmanısın. Verilen SMS mesajlarını analiz et ve her birini yapılandırılmış JSON formatında döndür.
    Bugünün tarihi: ${new Date().toLocaleDateString('en-CA')}.
    Kategoriler: ${serializeCategories(categories)}
    Hesaplar: ${serializeAccounts(accounts)}

    Türk bankası SMS formatlarını tanı:
    - Garanti BBVA: "X TL tutarında Y'e ödeme yapılmıştır"
    - İş Bankası: "Hesabınıza X TL maaş ödemesi yapılmıştır"
    - Yapı Kredi: "Kredi kartınızdan N taksit X TL Y"
    - Akbank: "X TL işlem gerçekleştirilmiştir"
    - QNB Finansbank: "X TL tutarında işlem yapılmıştır"
    - Ziraat Bankası: "X TL çekim/yatırım işlemi"
    - Halkbank: "X TL tutarında harcama"
    - Denizbank, TEB, ING, HSBC formatları

    İşlem türünü belirle:
    - Gelir: maaş, havale gelen, EFT gelen, iade, para transferi (gelen)
    - Gider: ödeme, harcama, alışveriş, fatura, çekim
    - Transfer: hesaplar arası transfer

    Taksit bilgisini tespit et: "taksit", "X taksit", "N/M taksit" gibi ifadeler

    Çıktı SADECE geçerli JSON olmalıdır (markdown yok, ekstra metin yok):
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
    - Tutar ondalıklı olabilir
    - Türkçe karakterleri doğru oku (ş, ç, ğ, ı, ö, ü)
    - SMS'lerdeki ASCII versiyonlarını da anla (s=ş, c=ç, g=ğ, i=ı, o=ö, u=ü)`;

    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: systemInstruction + "\n\nSMS Mesajları:\n" + smsText }
                    ]
                }
            ]
        });

        const text = result.response.text();
        if (!text) return null;

        const parsed = JSON.parse(cleanJsonResponse(text));
        return parsed.transactions || [parsed];
    } catch (error) {
        console.error("Error calling Gemini API for SMS:", error);
        return null;
    }
};