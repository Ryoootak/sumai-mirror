-- ============================================================
-- partner_score 追加 / partner_reaction enum 修正 / RLS 追加
-- ============================================================

-- 1. partner_score カラム追加
ALTER TABLE property_logs
  ADD COLUMN IF NOT EXISTS partner_score integer
  CHECK (partner_score BETWEEN 1 AND 3);

-- 2. partner_reaction enum を TypeScript 型と合わせる
--    DB既存: 'great' | 'good' | 'neutral' | 'bad' | 'unknown'
--    新しい: 'best'  | 'good' | 'okay'    |        'unknown'

-- 既存データを新しい値に変換してから enum を作り直す
ALTER TABLE property_logs
  ALTER COLUMN partner_reaction DROP DEFAULT;

ALTER TABLE property_logs
  ALTER COLUMN partner_reaction TYPE text;

UPDATE property_logs SET partner_reaction =
  CASE partner_reaction
    WHEN 'great'   THEN 'best'
    WHEN 'neutral' THEN 'okay'
    WHEN 'bad'     THEN 'okay'
    ELSE partner_reaction
  END;

DROP TYPE IF EXISTS partner_reaction;
CREATE TYPE partner_reaction AS ENUM ('best', 'good', 'okay', 'unknown');

ALTER TABLE property_logs
  ALTER COLUMN partner_reaction TYPE partner_reaction
  USING partner_reaction::partner_reaction;

-- 3. partner_reaction のデフォルト値を再設定
ALTER TABLE property_logs
  ALTER COLUMN partner_reaction SET DEFAULT 'unknown';

-- 4. RLS: パートナー（非登録者）が partner_* フィールドを更新できるポリシー
DROP POLICY IF EXISTS "property_logs: partner can update reaction" ON public.property_logs;
CREATE POLICY "property_logs: partner can update reaction"
  ON public.property_logs FOR UPDATE
  USING (
    public.is_project_member(project_id)
    AND user_id != auth.uid()
  );
