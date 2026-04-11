// Türkçe Açıklama:
// Bildirim merkezi için yardımcı fonksiyonlar. Tüm insert'ler idempotent:
// dedupe_key UNIQUE constraint üzerinden garantilenir, aynı olay tekrar
// tetiklense bile ikinci insert Supabase tarafından reddedilir (23505).
//
// Tetik fonksiyonları client-side çalışır; App.tsx data fetch'i sonrasında
// bir kez çağrılır. Yeni bildirim düşerse notifications state'i refresh
// edilir.

import { supabase } from './supabaseClient';
import {
    Account, AccountType, Budget, Category, Notification,
    NotificationType, RecurringTransaction, Transaction, TransactionType,
} from '../types';
import { formatCurrency } from './currency';

declare const __APP_VERSION__: string;

// -----------------------------------------------------------------------------
// Temel CRUD
// -----------------------------------------------------------------------------

export async function fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('but_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) {
        console.error('[notifications] fetch error', error);
        return [];
    }
    return (data || []) as Notification[];
}

export async function markAsRead(id: number) {
    const { error } = await supabase
        .from('but_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    if (error) console.error('[notifications] markAsRead error', error);
}

export async function markAllAsRead(userId: string) {
    const { error } = await supabase
        .from('but_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
    if (error) console.error('[notifications] markAllAsRead error', error);
}

export async function deleteNotification(id: number) {
    const { error } = await supabase
        .from('but_notifications')
        .delete()
        .eq('id', id);
    if (error) console.error('[notifications] delete error', error);
}

export async function clearAllNotifications(userId: string) {
    const { error } = await supabase
        .from('but_notifications')
        .delete()
        .eq('user_id', userId);
    if (error) console.error('[notifications] clearAll error', error);
}

// -----------------------------------------------------------------------------
// Idempotent insert
// -----------------------------------------------------------------------------

type CreateArgs = {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    dedupeKey: string;
    relatedId?: number | null;
    metadata?: Record<string, any> | null;
};

/**
 * Bildirimi idempotent şekilde ekler. Aynı dedupe_key ile tekrar çağrılırsa
 * Supabase UNIQUE constraint nedeniyle 23505 döner — sessizce yutarız.
 * Return: yeni bildirim eklendiyse true, zaten varsa false.
 */
async function insertNotification(args: CreateArgs): Promise<boolean> {
    const { error } = await supabase.from('but_notifications').insert({
        user_id: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        dedupe_key: args.dedupeKey,
        related_id: args.relatedId ?? null,
        metadata: args.metadata ?? null,
    });
    if (error) {
        // 23505 = unique violation → zaten mevcut, sessizce geç
        if ((error as any).code === '23505') return false;
        console.error('[notifications] insert error', error);
        return false;
    }
    return true;
}

// -----------------------------------------------------------------------------
// Tetikler — çağıranlar App.tsx veya ilgili screen hook'ları
// -----------------------------------------------------------------------------

// Tarih yardımcıları
const todayIso = () => new Date().toISOString().split('T')[0];
const monthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * 1) Yeni versiyon yüklendi
 * APP_VERSION her sürümde değişir, dedupe_key version içerir → tek kez düşer.
 */
export async function triggerVersionUpdateNotification(userId: string) {
    const version = __APP_VERSION__;
    await insertNotification({
        userId,
        type: 'version_update',
        title: 'Yeni sürüm yüklendi',
        body: `SpendMe v${version} başarıyla yüklendi. Yeniliklerin tadını çıkar! 🎉`,
        dedupeKey: `version_update:${version}`,
        metadata: { version },
    });
}

/**
 * 2) Bütçe uyarı / aşımı
 * Her kategori için ayın ilgili dedupe_key'i kullanılır (kategori:ay:severity).
 * Severity 'warning' (%80+) veya 'overshoot' (%100+) olabilir. Bir kez düşer.
 */
export async function triggerBudgetNotifications(
    userId: string,
    budgets: Budget[],
    transactions: Transaction[],
    categories: Category[],
) {
    const month = monthKey();
    const firstDay = `${month}-01`;
    const flatCategories = categories.flatMap(c => [c, ...(c.subcategories || [])]);

    // Kategori → alt kategoriler dahil harcama hesabı
    const spentFor = (categoryId: number): number => {
        const parent = flatCategories.find(c => c.id === categoryId);
        if (!parent) return 0;
        const ids = new Set<number>([parent.id, ...(parent.subcategories?.map(sc => sc.id) || [])]);
        return transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.date >= firstDay && t.category_id && ids.has(t.category_id))
            .reduce((sum, t) => sum + t.amount, 0);
    };

    for (const b of budgets) {
        if (!b.limit || b.limit <= 0) continue;
        if (b.month && b.month !== month) continue;

        const category = flatCategories.find(c => c.id === b.category_id);
        if (!category) continue;

        const spent = spentFor(b.category_id);
        const ratio = spent / b.limit;

        if (ratio >= 1) {
            await insertNotification({
                userId,
                type: 'budget_overshoot',
                title: `${category.name} bütçesi aşıldı`,
                body: `Limit ${formatCurrency(b.limit)} — harcanan ${formatCurrency(spent)} (%${Math.round(ratio * 100)})`,
                dedupeKey: `budget_overshoot:${b.category_id}:${month}`,
                relatedId: b.category_id,
                metadata: { limit: b.limit, spent, categoryName: category.name, month },
            });
        } else if (ratio >= 0.8) {
            await insertNotification({
                userId,
                type: 'budget_warning',
                title: `${category.name} bütçesine yaklaşıyorsun`,
                body: `${formatCurrency(spent)} / ${formatCurrency(b.limit)} (%${Math.round(ratio * 100)})`,
                dedupeKey: `budget_warning:${b.category_id}:${month}`,
                relatedId: b.category_id,
                metadata: { limit: b.limit, spent, categoryName: category.name, month },
            });
        }
    }
}

/**
 * 3) Ekstre kesim / son ödeme yaklaşıyor
 * Kredi kartının statement_date veya payment_due_date'ine 3 gün veya daha az
 * kalmışsa bildirim düşer. dedupe_key ay bazlı → her ay tekrar tetiklenir.
 */
export async function triggerCreditCardDueNotifications(userId: string, accounts: Account[]) {
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const month = monthKey();

    const daysUntil = (targetDay: number) => {
        // Hedef gün bu ayın içinde; geçmişse bir sonraki ayda olacak (basit yaklaşım)
        if (targetDay >= today) return targetDay - today;
        // Bu ayı geçmiş — bir sonraki ay için beklet, bildirim zaten sonra düşer
        return (daysInMonth - today) + targetDay;
    };

    for (const acc of accounts) {
        if (acc.type !== AccountType.CREDIT_CARD) continue;

        if (acc.statement_date && acc.statement_date >= 1 && acc.statement_date <= 31) {
            const diff = daysUntil(acc.statement_date);
            if (diff <= 3 && diff >= 0) {
                await insertNotification({
                    userId,
                    type: 'credit_statement',
                    title: `${acc.name} ekstre kesim yaklaşıyor`,
                    body: diff === 0
                        ? `Bugün ekstre kesim günü`
                        : `${diff} gün sonra (ayın ${acc.statement_date}.'i) ekstresi kesilecek`,
                    dedupeKey: `credit_statement:${acc.id}:${month}`,
                    relatedId: acc.id,
                    metadata: { accountName: acc.name, statementDate: acc.statement_date, daysUntil: diff },
                });
            }
        }

        if (acc.payment_due_date && acc.payment_due_date >= 1 && acc.payment_due_date <= 31) {
            const diff = daysUntil(acc.payment_due_date);
            if (diff <= 3 && diff >= 0) {
                await insertNotification({
                    userId,
                    type: 'credit_payment_due',
                    title: `${acc.name} son ödeme yaklaşıyor`,
                    body: diff === 0
                        ? `Bugün son ödeme günü!`
                        : `${diff} gün sonra (ayın ${acc.payment_due_date}.'i) son ödeme tarihi`,
                    dedupeKey: `credit_payment_due:${acc.id}:${month}`,
                    relatedId: acc.id,
                    metadata: { accountName: acc.name, paymentDueDate: acc.payment_due_date, daysUntil: diff },
                });
            }
        }
    }
}

/**
 * 4) Tekrarlayan işlem otomatik eklendi
 * App.tsx'te recurring processing sonrası çağrılır: hangi işlemler yeni
 * oluşturulmuşsa onların ID'leri ile. dedupe_key = transaction_id.
 */
export async function triggerRecurringAppliedNotification(
    userId: string,
    recurring: RecurringTransaction,
    createdTransactionId: number,
) {
    const isIncome = recurring.type === TransactionType.INCOME;
    await insertNotification({
        userId,
        type: 'recurring_applied',
        title: isIncome ? 'Düzenli gelir eklendi' : 'Düzenli ödeme eklendi',
        body: `${recurring.description} — ${formatCurrency(recurring.amount)}`,
        dedupeKey: `recurring_applied:${createdTransactionId}`,
        relatedId: createdTransactionId,
        metadata: {
            amount: recurring.amount,
            description: recurring.description,
            type: recurring.type,
        },
    });
}

/**
 * 5) Yaklaşan taksit hatırlatması
 * Transactions içinde is_installment=true olan kayıtlar arasında
 * bugünden itibaren 3 gün içinde gelenler için bildirim oluşturur.
 * dedupe_key = transaction.id (her taksit ayrı id'li kayıt olduğu için).
 */
export async function triggerInstallmentUpcomingNotifications(
    userId: string,
    transactions: Transaction[],
) {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const todayStr = todayIso();
    const limitStr = threeDaysLater.toISOString().split('T')[0];

    const upcoming = transactions.filter(t =>
        t.is_installment &&
        t.installment_current &&
        t.installment_count &&
        t.date >= todayStr &&
        t.date <= limitStr
    );

    for (const tx of upcoming) {
        const diffDays = Math.max(0, Math.round(
            (new Date(tx.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ));
        await insertNotification({
            userId,
            type: 'installment_upcoming',
            title: `Taksit yaklaşıyor: ${tx.description.split(' (')[0]}`,
            body: diffDays === 0
                ? `Bugün ${tx.installment_current}/${tx.installment_count}. taksit — ${formatCurrency(tx.amount)}`
                : `${diffDays} gün sonra ${tx.installment_current}/${tx.installment_count}. taksit — ${formatCurrency(tx.amount)}`,
            dedupeKey: `installment_upcoming:${tx.id}`,
            relatedId: tx.id,
            metadata: {
                amount: tx.amount,
                current: tx.installment_current,
                count: tx.installment_count,
                date: tx.date,
            },
        });
    }
}
