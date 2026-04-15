# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**SUMAI MIRROR** — 家探しの「好み」を言語化するモバイルファーストWebアプリ。
物件データは保存せず、ユーザーの反応データ（スコア・タグ・メモ）のみを記録してAIで優先度を分析する。

- **Stack**: Next.js 14 App Router / Tailwind CSS v4 / Supabase / Gemini API (`gemini-2.5-flash`)
- **Target**: iPhone / タブレット専用（PCレイアウト不要）
- **Design**: モバイルファースト、`max-w-md`中央寄せ、アンバー暖色系、iOS風タブバー

## Architecture

```
/log        → 物件ログ一覧（メイン）
/log/new    → 記録フォーム
/log/[id]   → 詳細
/mirror     → AI優先度分析（鏡1〜3）
/pair       → ペア管理
/settings   → 設定・希望条件
```

- プロジェクト概念はユーザーに非表示（`getOrCreateProject()` でサーバー側自動作成）
- 認証: Supabase Auth + `src/middleware.ts` でルート保護
- AI分析: `/api/analyze`, `/api/analyze/alignment`, `/api/analyze/timeline`

## Key Conventions

- Server Components をデフォルト。インタラクションが必要な場合のみ `'use client'`
- Supabase クライアント: サーバー側 `@/lib/supabase/server`、クライアント側 `@/lib/supabase/client`
- スコアは 1〜3（ありかな/いいな/最高）、5段階ではない
- パートナー反応: `best | good | okay | unknown`
- 物件タイプ: `mansion | house | land`

## Workflow Best Practices

- 複雑なタスクはまず `/plan` で設計してから実装する
- コンテキストが〜50%になったら手動で `/compact` する
- 複数ファイルの変更は依存順に行う（型定義 → API → コンポーネント）

## Git Commit Rules

**ファイルごとに個別コミットを作成する**。複数ファイルをまとめてコミットしない。

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY       # Service role（サーバーサイドのみ）
GOOGLE_AI_API_KEY               # Gemini API key（サーバーサイドのみ）
```

`GOOGLE_AI_API_KEY` は `NEXT_PUBLIC_` をつけない（クライアントに露出させない）。

## Database Schema (主要テーブル)

- `users_profile` — ユーザー名・希望条件(preferences JSON)
- `projects` — 自動作成・ユーザーに非表示
- `project_members` — user_id / project_id / role
- `property_logs` — score(1-3) / property_type / tags_good / tags_bad / memo / partner_reaction
- `analyses` — type(priority|alignment|timeline) / result JSON / feedback
