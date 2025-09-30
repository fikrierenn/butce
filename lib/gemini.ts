// Fix: Updated for official Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Account, Category, TransactionType } from "../types";

// Türkçe Açıklama:
// Bu dosya Google Gemini (Generative AI) SDK'sını kullanarak doğal dil girdisini
// yapılandırılmış bir işlem nesnesine dönüştürür.
// Güvenlik uyarısı: API anahtarını kodda saklamak önerilmez; sadece hızlı test içindir.
const genAI = new GoogleGenerativeAI("AIzaSyCJqJHQLNX5tyKyCCtnWWZJgkK-eAXGiQY");

// Türkçe Açıklama:
// Model seçimi: hızlı ve uygun maliyetli cevaplar için "gemini-1.5-flash" tercih edildi.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const parseTransactionWithGemini = async (
    prompt: string,
    categories: Category[],
    accounts: Account[]
): Promise<any | null> => {

    // Türkçe Açıklama:
    // Modelden JSON üretmesini istiyoruz; şema doğrulamasını istemci tarafında JSON.parse ile yapıyoruz.
    const systemInstruction = `You are an expert financial assistant. Convert the user's input into a strict JSON object for a financial transaction.
    Today is ${new Date().toLocaleDateString('en-CA')}.
    Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
    Accounts: ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, type: a.type })))}
    Output MUST be valid JSON only (no markdown, no extra text) with fields:
    {
      "type": "${TransactionType.INCOME}|${TransactionType.EXPENSE}|${TransactionType.TRANSFER}",
      "amount": number,
      "description": string,
      "date": "YYYY-MM-DD",
      "category_id": number?,
      "account_id": number?,
      "from_account_id": number?,
      "to_account_id": number?
    }
    Rules:
    - For income/expense: provide category_id and account_id (category type must match transaction type).
    - For transfer: provide from_account_id and to_account_id.
    - Keep description short. If uncertain about a field, omit it.`;

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

        // Türkçe Açıklama:
        // Model yanıtını JSON'a dönüştürüyoruz. Başarısız olursa null döner.
        return JSON.parse(text);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};