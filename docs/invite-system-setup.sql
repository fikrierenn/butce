-- ============================================
-- Türkçe Açıklama:
-- Davet kodu sistemi - Admin kullanıcılar davet linki
-- oluşturabilir ve yeni kullanıcıları davet edebilir.
-- ============================================

-- 1. DAVET KODLARI TABLOSU
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_email text,
    is_used boolean DEFAULT false,
    used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at timestamptz,
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 2. Row Level Security
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılar kendi oluşturdukları davetleri görebilir
CREATE POLICY "Users can view their own invites"
    ON public.invite_codes
    FOR SELECT
    USING (auth.uid() = created_by);

-- Admin kullanıcılar davet oluşturabilir
CREATE POLICY "Users can create invites"
    ON public.invite_codes
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 3. DAVET KODU OLUŞTURMA FONKSİYONU
CREATE OR REPLACE FUNCTION public.create_invite_code(
    invited_email_param text DEFAULT NULL,
    notes_param text DEFAULT NULL,
    days_valid integer DEFAULT 7
)
RETURNS TABLE(invite_code text, invite_url text) AS $$
DECLARE
    new_code text;
    base_url text := 'https://butce.netlify.app'; -- Kendi URL'nizi yazın
BEGIN
    -- Benzersiz 8 karakterlik kod oluştur
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Davet kodunu tabloya ekle
    INSERT INTO public.invite_codes (code, created_by, invited_email, expires_at, notes)
    VALUES (
        new_code,
        auth.uid(),
        invited_email_param,
        now() + make_interval(days => days_valid),
        notes_param
    );
    
    -- Davet kodunu ve tam URL'i döndür
    RETURN QUERY SELECT 
        new_code as invite_code,
        base_url || '?invite=' || new_code as invite_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DAVET KODUNU DOĞRULAMA VE KULLANMA FONKSİYONU
CREATE OR REPLACE FUNCTION public.validate_and_use_invite(
    code_param text,
    user_email_param text
)
RETURNS boolean AS $$
DECLARE
    invite_record RECORD;
    is_valid boolean := false;
BEGIN
    -- Davet kodunu bul
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = upper(code_param)
    AND is_used = false
    AND expires_at > now();
    
    IF FOUND THEN
        -- Eğer email belirtilmişse, eşleşiyor mu kontrol et
        IF invite_record.invited_email IS NOT NULL AND 
           invite_record.invited_email != user_email_param THEN
            RETURN false;
        END IF;
        
        -- Davet kodunu kullanılmış olarak işaretle
        UPDATE public.invite_codes
        SET is_used = true,
            used_by = auth.uid(),
            used_at = now()
        WHERE code = upper(code_param);
        
        -- Kullanıcıyı izinli listeye ekle
        INSERT INTO public.allowed_users (email, notes)
        VALUES (user_email_param, 'Davet kodu ile eklendi: ' || code_param)
        ON CONFLICT (email) DO NOTHING;
        
        is_valid := true;
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DAVET KODLARINI LİSTELEME FONKSİYONU
CREATE OR REPLACE FUNCTION public.get_my_invites()
RETURNS TABLE(
    code text,
    invited_email text,
    is_used boolean,
    used_at timestamptz,
    expires_at timestamptz,
    notes text,
    created_at timestamptz,
    invite_url text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ic.code,
        ic.invited_email,
        ic.is_used,
        ic.used_at,
        ic.expires_at,
        ic.notes,
        ic.created_at,
        'https://butce.netlify.app?invite=' || ic.code as invite_url
    FROM public.invite_codes ic
    WHERE ic.created_by = auth.uid()
    ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. KULLANILMAMIŞ DAVET KODUNU SİLME
CREATE OR REPLACE FUNCTION public.delete_invite(code_param text)
RETURNS boolean AS $$
BEGIN
    DELETE FROM public.invite_codes
    WHERE code = upper(code_param)
    AND created_by = auth.uid()
    AND is_used = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÖRNEK KULLANIM
-- ============================================

-- Davet kodu oluştur (genel)
-- SELECT * FROM public.create_invite_code();

-- Belirli bir email için davet oluştur (7 gün geçerli)
-- SELECT * FROM public.create_invite_code('arkadas@gmail.com', 'Arkadaşım', 7);

-- Kendi davetlerini listele
-- SELECT * FROM public.get_my_invites();

-- Davet kodunu test et (bu fonksiyonu uygulama çağıracak)
-- SELECT public.validate_and_use_invite('ABC12345', 'user@gmail.com');

