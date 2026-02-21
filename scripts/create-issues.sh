#!/bin/bash
set -e

REPO="stbtyx747/daily-report"
GH="${HOME}/.local/bin/gh"
[ -x "$GH" ] || GH="gh"

echo "=== gh auth check ==="
$GH auth status || { echo "Run: gh auth login"; exit 1; }

# ===========================
# Labels
# ===========================
echo ""
echo "=== Creating labels ==="
create_label() {
  $GH label create "$1" --color "$2" --description "$3" --repo "$REPO" 2>/dev/null \
    && echo "  created : $1" \
    || echo "  exists  : $1"
}
create_label "setup"  "0075ca" "初期設定・環境構築"
create_label "auth"   "e4e669" "認証・認可"
create_label "api"    "d93f0b" "API実装"
create_label "ui"     "0052cc" "画面・UIコンポーネント実装"
create_label "db"     "1d76db" "データベース・マイグレーション"
create_label "test"   "2ea44f" "テスト実装"
create_label "infra"  "6f42c1" "インフラ・CI/CD"

# ===========================
# Milestones
# ===========================
echo ""
echo "=== Creating milestones ==="
create_milestone() {
  local title="$1"
  $GH api "repos/$REPO/milestones" --method POST -f title="$title" -f state="open" > /dev/null 2>&1 || true
  $GH api "repos/$REPO/milestones" --jq ".[] | select(.title==\"$title\") | .title"
}
M1=$(create_milestone "Phase 1: 基盤構築")
M2=$(create_milestone "Phase 2: 認証")
M3=$(create_milestone "Phase 3: マスタ管理")
M4=$(create_milestone "Phase 4: 日報機能")
M5=$(create_milestone "Phase 5: コメント機能")
M6=$(create_milestone "Phase 6: テスト")
echo "  milestones: $M1 | $M2 | $M3 | $M4 | $M5 | $M6"

# ===========================
# Issues helper
# ===========================
new_issue() {
  local title="$1" body="$2" labels="$3" milestone="$4"
  if [ -n "$milestone" ]; then
    $GH issue create --repo "$REPO" --title "$title" --body "$body" \
      --label "$labels" --milestone "$milestone" > /dev/null
  else
    $GH issue create --repo "$REPO" --title "$title" --body "$body" \
      --label "$labels" > /dev/null
  fi
  echo "  ✓ $title"
  sleep 0.5
}

echo ""
echo "=== Creating issues ==="

# ===========================
# Phase 1: 基盤構築
# ===========================
new_issue \
"[setup] Next.js App Router 初期ファイル構成の作成" \
'## 概要
Next.js App Router の初期ファイル構成を作成する。

## 実装内容
- `app/layout.tsx` — RootLayout（html, body, フォント設定）
- `app/page.tsx` — トップページ（`/reports` へリダイレクト）
- `app/globals.css` — Tailwind CSS ディレクティブ（@tailwind base/components/utilities）
- `public/` — favicon などの静的ファイル配置

## 関連仕様
画面定義書 S02（日報一覧）がデフォルト遷移先

## 完了条件
- [ ] `npm run dev` でエラーなく起動できる
- [ ] `http://localhost:3000` にアクセスすると `/reports` にリダイレクトされる' \
"setup" "$M1"

new_issue \
"[setup] shadcn/ui の導入と基本コンポーネントの追加" \
'## 概要
shadcn/ui を初期化し、本プロジェクトで使用する基本コンポーネントを追加する。

## 実装内容
```bash
npx shadcn@latest init
```
- style: default / baseColor: slate / CSS variables: yes

追加するコンポーネント:
`button` `input` `label` `form` `textarea` `card` `badge` `separator` `table` `dialog` `dropdown-menu` `select` `checkbox` `toast`

## 完了条件
- [ ] `components/ui/` 配下にコンポーネントが生成されている
- [ ] Button コンポーネントが正常に描画できる' \
"setup" "$M1"

new_issue \
"[db] .env.example の作成と環境変数設定" \
'## 概要
必要な環境変数を `.env.example` に定義し、開発環境セットアップを明確にする。

## 実装内容
`.env.example`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/daily_report
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 完了条件
- [ ] `.env.example` が作成されている
- [ ] README 手順通りに設定すれば Prisma が DB に接続できる' \
"db" "$M1"

new_issue \
"[db] Prisma 初回マイグレーションとシードデータの実装" \
'## 概要
Prisma の初回マイグレーションを実行し、開発用シードデータを用意する。

## 実装内容
```bash
npx prisma migrate dev --name init
```

`prisma/seed.ts`:
- 初期 manager ユーザー（admin@example.com / password）
- 初期 sales ユーザー（sales@example.com / password）
- サンプル顧客データ 5 件

`package.json` に prisma seed 設定追加:
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```

## 完了条件
- [ ] `npx prisma migrate dev` が完了する
- [ ] `npx prisma db seed` でシードデータが投入できる
- [ ] `npx prisma studio` でデータが確認できる' \
"db" "$M1"

new_issue \
"[setup] 認証後共通レイアウト（ヘッダー・サイドバー）の実装" \
'## 概要
ログイン後に表示される共通レイアウトを実装する。

## 実装内容
- `app/(dashboard)/layout.tsx` — 認証後レイアウト（Route Group）
- `components/layout/header.tsx` — ログインユーザー名・ロール表示、ログアウトボタン
- `components/layout/sidebar.tsx` — 日報一覧（全員）/ ユーザー管理（manager のみ）/ 顧客管理（全員、編集は manager のみ）

## 関連仕様
画面定義書: 権限マトリクス

## 完了条件
- [ ] ヘッダーにログインユーザー名とロールが表示される
- [ ] sales ログイン時はユーザー管理メニューが非表示になる
- [ ] ログアウトボタンでログイン画面に戻る' \
"setup,ui" "$M1"

new_issue \
"[setup] エラーハンドリング基盤の実装（error.tsx / not-found.tsx / loading.tsx）" \
'## 概要
Next.js App Router のエラーハンドリングとローディング UI を実装する。

## 実装内容
- `app/error.tsx` — 予期せぬエラー時のフォールバック UI
- `app/not-found.tsx` — 404 ページ
- `app/(dashboard)/loading.tsx` — 認証後ページのローディングスピナー
- `lib/api-response.ts` — Route Handler 共通レスポンスヘルパー（success / error）

## 完了条件
- [ ] 存在しないパスにアクセスすると not-found.tsx が表示される
- [ ] API エラー時に適切なステータスコードが返る' \
"setup" "$M1"

# ===========================
# Phase 2: 認証
# ===========================
new_issue \
"[auth] 認証基盤の実装（NextAuth.js v5 + Credentials Provider）" \
'## 概要
NextAuth.js v5 を使用してメールアドレス・パスワード認証を実装する。

## 実装内容
```bash
npm install next-auth@beta bcrypt
npm install -D @types/bcrypt
```

- `auth.ts` — NextAuth 設定（Credentials Provider、JWT セッション）
- `app/api/auth/[...nextauth]/route.ts` — Route Handler
- パスワードハッシュ化に `bcrypt` を使用
- セッションに `id`, `name`, `email`, `role` を含める

## 関連仕様
API仕様書: POST /auth/login, POST /auth/logout

## 完了条件
- [ ] 正しい認証情報でログインできる
- [ ] 不正な認証情報で 401 エラーが返る
- [ ] セッションに role 情報が含まれる' \
"auth" "$M2"

new_issue \
"[auth] ログイン画面 (S01) の実装" \
'## 概要
ログイン画面を実装する（画面定義書 S01 に対応）。

## 実装内容
- `app/(auth)/login/page.tsx`
- react-hook-form + zod バリデーション
  - email: 必須・メール形式
  - password: 必須
- 認証失敗時のエラーメッセージ表示
- ログイン成功後 `/reports` へリダイレクト
- 認証済みの場合は `/reports` へリダイレクト

## 関連仕様
画面定義書: S01 ログイン画面

## 完了条件
- [ ] 正常ログインで日報一覧画面に遷移する
- [ ] 不正な認証情報でエラーメッセージが表示される
- [ ] 必須項目未入力でバリデーションエラーが表示される' \
"auth,ui" "$M2"

new_issue \
"[auth] 認証・権限ミドルウェアの実装" \
'## 概要
未認証ユーザーのリダイレクトと role ベースのアクセス制御を実装する。

## 実装内容
`middleware.ts`:
- 未認証ユーザーが `/login` 以外にアクセス → `/login` リダイレクト
- 認証済みユーザーが `/login` にアクセス → `/reports` リダイレクト
- sales が `/master/users` にアクセス → `/reports` リダイレクト

`lib/auth-utils.ts`:
- `requireAuth()` — Route Handler 内認証チェック
- `requireRole(role)` — Route Handler 内権限チェック

## 関連仕様
画面定義書: 権限マトリクス / API仕様書: 各エンドポイント権限欄

## 完了条件
- [ ] 未認証でのアクセスが `/login` にリダイレクトされる
- [ ] sales が `/master/users` にアクセスすると弾かれる
- [ ] manager が全ての画面にアクセスできる' \
"auth" "$M2"

new_issue \
"[setup] API 共通レスポンス型と Zod スキーマの定義" \
'## 概要
全 API で使用する共通型定義と Zod バリデーションスキーマを定義する。

## 実装内容
`lib/types/api.ts`:
- `ApiResponse<T>` / `ApiListResponse<T>` / `ApiError` 型

`lib/api-response.ts`:
- `successResponse<T>()` / `listResponse<T>()` / `errorResponse()` ヘルパー

`lib/schemas/` 配下:
- `report.schema.ts` / `user.schema.ts` / `customer.schema.ts` / `comment.schema.ts`

## 関連仕様
API仕様書: 共通仕様（レスポンス形式・エラーコード一覧）

## 完了条件
- [ ] 共通レスポンス型が全 Route Handler で使用されている
- [ ] Zod エラー時に `VALIDATION_ERROR` コードと詳細が返る' \
"setup,api" "$M2"

# ===========================
# Phase 3: マスタ管理
# ===========================
new_issue \
"[api] GET/POST /api/master/users - ユーザー一覧・作成 API の実装" \
'## 概要
ユーザーマスタの一覧取得・作成 API を実装する。

## 実装内容
`app/api/master/users/route.ts`

**GET** (manager のみ):
- クエリ: `page`(default:1), `per_page`(default:20)
- レスポンス: `{ data: User[], meta: { total, page, per_page } }`

**POST** (manager のみ):
- Zod バリデーション: `name`(必須), `email`(必須・UNIQUE), `password`(必須), `role`(sales|manager)
- bcrypt でパスワードをハッシュ化
- 重複メール → 409 CONFLICT
- レスポンス: 201（パスワード除く）

## 関連仕様
API仕様書: #12 #13 / テスト仕様書: USR-001〜009

## 完了条件
- [ ] sales で GET すると 403 が返る
- [ ] 重複メールで POST すると 409 が返る
- [ ] レスポンスにパスワードが含まれない' \
"api" "$M3"

new_issue \
"[api] GET/PUT/DELETE /api/master/users/[id] - ユーザー詳細・更新・削除 API の実装" \
'## 概要
ユーザーマスタの詳細取得・更新・削除 API を実装する。

## 実装内容
`app/api/master/users/[id]/route.ts`

**GET**: manager のみ、404 対応
**PUT**: manager のみ、メール重複 → 409、404 対応
**DELETE**: manager のみ、404 対応

## 関連仕様
API仕様書: #14 #15 #16 / テスト仕様書: USR-010〜015

## 完了条件
- [ ] 存在しない ID で 404 が返る
- [ ] sales でアクセスすると 403 が返る
- [ ] PUT でメール重複時に 409 が返る' \
"api" "$M3"

new_issue \
"[ui] ユーザー一覧画面 (S05) の実装" \
'## 概要
ユーザーマスタの一覧画面を実装する（画面定義書 S05 に対応）。

## 実装内容
`app/(dashboard)/master/users/page.tsx`
- 一覧テーブル（氏名、メールアドレス、役割バッジ、部署）
- 新規登録ボタン → `/master/users/new`
- 編集ボタン → `/master/users/[id]/edit`
- ページネーション

## 関連仕様
画面定義書: S05

## 完了条件
- [ ] ユーザー一覧が正常に表示される
- [ ] 新規登録ボタンで S06 に遷移する
- [ ] 編集ボタンで S06（編集モード）に遷移する' \
"ui" "$M3"

new_issue \
"[ui] ユーザー登録・編集画面 (S06) の実装" \
'## 概要
ユーザーの登録・編集フォーム画面を実装する（画面定義書 S06 に対応）。

## 実装内容
- `app/(dashboard)/master/users/new/page.tsx`
- `app/(dashboard)/master/users/[id]/edit/page.tsx`
- `components/master/user-form.tsx`（新規・編集共通コンポーネント）

フォーム項目（react-hook-form + zod）:
- 氏名（必須）/ メールアドレス（必須）/ パスワード（新規: 必須、編集: 任意）/ 役割 / 部署

保存成功 → S05 + Toast 通知 / キャンセル → S05

## 関連仕様
画面定義書: S06

## 完了条件
- [ ] 新規登録・編集が正常に動作する
- [ ] バリデーションエラーが適切に表示される
- [ ] 保存後に一覧画面へ遷移する' \
"ui" "$M3"

new_issue \
"[api] GET/POST /api/master/customers - 顧客一覧・作成 API の実装" \
'## 概要
顧客マスタの一覧取得・作成 API を実装する。

## 実装内容
`app/api/master/customers/route.ts`

**GET** (sales/manager 両方可):
- クエリ: `q`(顧客名・会社名 部分一致), `industry`, `page`, `per_page`

**POST** (manager のみ):
- Zod バリデーション: `name`(必須), `company_name`(必須)
- レスポンス: 201

## 関連仕様
API仕様書: #17 #18 / テスト仕様書: CST-001〜009

## 完了条件
- [ ] キーワード検索が顧客名・会社名に機能する
- [ ] sales で GET ができる
- [ ] sales で POST すると 403 が返る' \
"api" "$M3"

new_issue \
"[api] GET/PUT/DELETE /api/master/customers/[id] - 顧客詳細・更新・削除 API の実装" \
'## 概要
顧客マスタの詳細取得・更新・削除 API を実装する。

## 実装内容
`app/api/master/customers/[id]/route.ts`

**GET**: sales/manager 両方可、404 対応
**PUT**: manager のみ、全フィールド更新、404 対応
**DELETE**: manager のみ、404 対応

## 関連仕様
API仕様書: #19 #20 #21 / テスト仕様書: CST-010〜015

## 完了条件
- [ ] sales で GET が成功する
- [ ] sales で PUT/DELETE すると 403 が返る
- [ ] 存在しない ID で 404 が返る' \
"api" "$M3"

new_issue \
"[ui] 顧客一覧画面 (S07) の実装" \
'## 概要
顧客マスタの一覧画面を実装する（画面定義書 S07 に対応）。

## 実装内容
`app/(dashboard)/master/customers/page.tsx`
- 一覧テーブル（顧客名、会社名、業種、担当者名、取引規模）
- キーワード検索・業種フィルタ
- 新規登録・編集ボタン（manager のみ表示）
- ページネーション

## 関連仕様
画面定義書: S07

## 完了条件
- [ ] sales でアクセスでき、登録・編集ボタンが非表示になる
- [ ] キーワード検索・業種フィルタで絞り込みができる' \
"ui" "$M3"

new_issue \
"[ui] 顧客登録・編集画面 (S08) の実装" \
'## 概要
顧客の登録・編集フォーム画面を実装する（画面定義書 S08 に対応）。

## 実装内容
- `app/(dashboard)/master/customers/new/page.tsx`
- `app/(dashboard)/master/customers/[id]/edit/page.tsx`
- `components/master/customer-form.tsx`

フォーム項目（react-hook-form + zod）:
- 顧客名（必須）/ 会社名（必須）/ 部署 / 業種 / 担当者名 / 取引規模 / 電話番号 / 住所

## 関連仕様
画面定義書: S08

## 完了条件
- [ ] 新規登録・編集が正常に動作する
- [ ] 必須項目（顧客名・会社名）未入力でエラーが表示される' \
"ui" "$M3"

# ===========================
# Phase 4: 日報機能
# ===========================
new_issue \
"[api] GET/POST /api/reports - 日報一覧・作成 API の実装" \
'## 概要
日報の一覧取得・作成 API を実装する。

## 実装内容
`app/api/reports/route.ts`

**GET**:
- sales: 自分の日報のみ（userId で自動フィルタ）
- manager: 全件
- クエリ: `date_from`, `date_to`, `status`, `user_id`(manager のみ有効), `page`, `per_page`

**POST** (sales のみ):
- Zod バリデーション: `report_date`(必須), `visit_records[].customer_id`(必須), `visit_records[].content`(必須), `visit_records[].sort_order`(必須)
- 同一 userId + report_date の重複 → 409 CONFLICT
- visit_records を一括作成

## 関連仕様
API仕様書: #3 #4 / テスト仕様書: RPT-001〜015

## 完了条件
- [ ] sales で自分の日報のみ取得できる
- [ ] manager で全件取得できる
- [ ] 同日付の重複作成で 409 が返る
- [ ] 訪問記録が複数件正常に保存される' \
"api" "$M4"

new_issue \
"[api] GET/PUT /api/reports/[id] - 日報詳細・更新 API の実装" \
'## 概要
日報の詳細取得・更新 API を実装する。

## 実装内容
`app/api/reports/[id]/route.ts`

**GET**:
- sales: 自分のみ（他人 → 403）
- manager: 全件
- レスポンス: 日報 + `visit_records[]` + `comments[]`（commenter 情報含む）

**PUT** (sales の draft のみ):
- draft 以外 → 422 INVALID_STATUS_TRANSITION
- 他人の日報 / manager → 403
- `visit_records` は全件置き換え（削除・追加・並び替え含む）

## 関連仕様
API仕様書: #5 #6 / テスト仕様書: RPT-016〜026

## 完了条件
- [ ] レスポンスに visit_records と comments が含まれる
- [ ] submitted 日報の PUT で 422 が返る
- [ ] 他人の日報アクセスで 403 が返る' \
"api" "$M4"

new_issue \
"[api] PATCH /api/reports/[id]/submit - 日報提出 API の実装" \
'## 概要
日報のステータスを draft → submitted に変更する提出 API を実装する。

## 実装内容
`app/api/reports/[id]/submit/route.ts`
- sales（自分の draft のみ）
- 訪問記録 0 件 → 422 VALIDATION_ERROR
- draft 以外 → 422 INVALID_STATUS_TRANSITION
- 他人の日報 / manager → 403
- レスポンス: `{ id, status: "submitted", updated_at }`

## 関連仕様
API仕様書: #7 / テスト仕様書: RPT-027〜032

## 完了条件
- [ ] draft → submitted に正常遷移する
- [ ] 訪問記録 0 件での提出で 422 が返る
- [ ] submitted/reviewed 日報への提出で 422 が返る' \
"api" "$M4"

new_issue \
"[api] PATCH /api/reports/[id]/review - 日報確認済み API の実装" \
'## 概要
日報のステータスを submitted → reviewed に変更する確認済み API を実装する。

## 実装内容
`app/api/reports/[id]/review/route.ts`
- manager のみ（sales → 403）
- submitted 以外 → 422 INVALID_STATUS_TRANSITION
- レスポンス: `{ id, status: "reviewed", updated_at }`

## 関連仕様
API仕様書: #8 / テスト仕様書: RPT-033〜037

## 完了条件
- [ ] submitted → reviewed に正常遷移する
- [ ] draft/reviewed 日報への確認済み操作で 422 が返る
- [ ] sales での操作で 403 が返る' \
"api" "$M4"

new_issue \
"[ui] 日報一覧画面 (S02) の実装" \
'## 概要
日報の一覧画面を実装する（画面定義書 S02 に対応）。

## 実装内容
`app/(dashboard)/reports/page.tsx`
- 一覧テーブル（報告日降順 / 担当者名[manager のみ] / ステータスバッジ / コメント件数）
- フィルタ: 報告日 From/To / ステータス / 担当者[manager のみ]
- 新規作成ボタン（sales のみ）→ `/reports/new`
- 行クリック → `/reports/[id]`

## 関連仕様
画面定義書: S02

## 完了条件
- [ ] sales で自分の日報のみ表示される
- [ ] manager で全員の日報が表示される
- [ ] フィルタが正常に機能する' \
"ui" "$M4"

new_issue \
"[ui] 日報作成・編集画面 (S03) の実装" \
'## 概要
日報の作成・編集フォーム画面を実装する（画面定義書 S03 に対応）。

## 実装内容
- `app/(dashboard)/reports/new/page.tsx`
- `app/(dashboard)/reports/[id]/edit/page.tsx`
- `components/report/report-form.tsx`（新規・編集共通）

フォーム（react-hook-form + zod）:
- 報告日（当日を初期値）
- 訪問記録セクション（VisitRecordList コンポーネント）
- Problem / Plan テキストエリア
- 下書き保存 / 提出 / キャンセルボタン

## 関連仕様
画面定義書: S03

## 完了条件
- [ ] 新規作成が正常に完了する
- [ ] 下書き保存でステータスが draft になる
- [ ] 提出でステータスが submitted になる
- [ ] 編集時に既存データが初期値として表示される' \
"ui" "$M4"

new_issue \
"[ui] 訪問記録動的行入力コンポーネントの実装" \
'## 概要
日報作成・編集画面で使用する訪問記録の動的行入力コンポーネントを実装する。

## 実装内容
`components/report/visit-record-list.tsx`

機能:
- 行の追加・削除
- ドラッグ&ドロップによる並び替え（@dnd-kit/core 使用）
- 顧客選択セレクトボックス（/api/master/customers から取得）
- 訪問時刻 / 訪問内容の入力

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 関連仕様
画面定義書: S03 訪問記録セクション

## 完了条件
- [ ] 行を追加・削除できる
- [ ] ドラッグ&ドロップで並び替えができる
- [ ] sort_order が正しく保存される' \
"ui" "$M4"

new_issue \
"[ui] 日報詳細画面 (S04) の実装" \
'## 概要
日報の詳細閲覧画面を実装する（画面定義書 S04 に対応）。

## 実装内容
`app/(dashboard)/reports/[id]/page.tsx`

表示内容:
- ヘッダー: 報告日 / 担当者名 / ステータスバッジ
- 訪問記録一覧（sort_order 順）
- Problem / Plan
- コメントセクション（CommentSection コンポーネント）

アクション:
- 「編集」: sales かつ draft のみ表示 → `/reports/[id]/edit`
- 「確認済みにする」: manager かつ submitted のみ表示
- 「戻る」→ `/reports`

## 関連仕様
画面定義書: S04

## 完了条件
- [ ] 訪問記録が sort_order 順に表示される
- [ ] draft 日報に sales でアクセスすると編集ボタンが表示される
- [ ] submitted 日報に manager でアクセスすると確認済みボタンが表示される
- [ ] reviewed 日報には確認済みボタンが表示されない' \
"ui" "$M4"

# ===========================
# Phase 5: コメント機能
# ===========================
new_issue \
"[api] POST /api/reports/[id]/comments - コメント投稿 API の実装" \
'## 概要
日報へのコメント投稿 API を実装する。

## 実装内容
`app/api/reports/[id]/comments/route.ts`

**POST** (manager のみ):
- Zod バリデーション: `content`(必須)
- 存在しない reportId → 404
- レスポンス: 201 + `{ id, content, commenter: { id, name }, created_at, updated_at }`

## 関連仕様
API仕様書: #9 / テスト仕様書: CMT-001〜006

## 完了条件
- [ ] manager でコメントを投稿できる
- [ ] sales でコメントを投稿すると 403 が返る
- [ ] content 未入力で 422 が返る' \
"api" "$M5"

new_issue \
"[api] PUT/DELETE /api/reports/[id]/comments/[commentId] - コメント編集・削除 API の実装" \
'## 概要
コメントの編集・削除 API を実装する。

## 実装内容
`app/api/reports/[id]/comments/[commentId]/route.ts`

**PUT** (manager・自分のコメントのみ):
- 他人のコメント → 403、存在しない commentId → 404

**DELETE** (manager・自分のコメントのみ):
- 他人のコメント → 403、存在しない commentId → 404
- レスポンス: 204

## 関連仕様
API仕様書: #10 #11 / テスト仕様書: CMT-007〜015

## 完了条件
- [ ] 自分のコメントを編集・削除できる
- [ ] 他人のコメントへの操作で 403 が返る' \
"api" "$M5"

new_issue \
"[ui] 日報詳細画面のコメントセクションの実装" \
'## 概要
日報詳細画面に表示するコメントセクションコンポーネントを実装する。

## 実装内容
`components/report/comment-section.tsx`

**manager**:
- コメント投稿欄 + 投稿ボタン
- コメント編集（インライン）・削除（確認ダイアログ）は自分のコメントのみ

**sales**:
- コメント閲覧のみ（投稿欄を表示しない）

コメント一覧: 投稿者名 / 投稿日時 / 本文

## 関連仕様
画面定義書: S04 コメントセクション / 要件定義書: 3.3 コメント機能

## 完了条件
- [ ] manager でコメントの投稿・編集・削除ができる
- [ ] sales でコメントが閲覧でき、投稿欄が表示されない
- [ ] 投稿後にコメント一覧が更新される' \
"ui" "$M5"

# ===========================
# Phase 6: テスト
# ===========================
new_issue \
"[test] 認証 API テストの実装（AUTH-001〜009）" \
'## 概要
テスト仕様書の認証 API テストケースを Vitest で実装する。

## 対象テストケース
| ID | 内容 | 期待結果 |
|---|---|---|
| AUTH-001 | 正常ログイン（sales） | 200, token |
| AUTH-002 | 正常ログイン（manager） | 200, role: manager |
| AUTH-003 | パスワード不正 | 401 |
| AUTH-004 | メールアドレス不正 | 401 |
| AUTH-005 | メールアドレス未入力 | 422 |
| AUTH-006 | パスワード未入力 | 422 |
| AUTH-007 | 正常ログアウト | 204 |
| AUTH-008 | ログアウト後のAPI呼び出し | 401 |
| AUTH-009 | 未認証でリクエスト | 401 |

## 実装内容
`tests/api/auth.test.ts`

## 完了条件
- [ ] 全 9 テストケースが pass する' \
"test" "$M6"

new_issue \
"[test] 日報 API テストの実装（RPT-001〜037）" \
'## 概要
テスト仕様書の日報 API テストケースを Vitest で実装する。

## 対象テストケース（計37件）
- RPT-001〜007: 一覧取得・フィルタ・権限
- RPT-008〜015: 作成（正常系・バリデーション・権限）
- RPT-016〜020: 詳細取得・権限
- RPT-021〜026: 更新・ステータス制御
- RPT-027〜032: 提出（draft→submitted）
- RPT-033〜037: 確認済み（submitted→reviewed）

## 実装内容
`tests/api/reports.test.ts`

重点テストケース:
- RPT-001: sales は自分の日報のみ返る
- RPT-011: 同日重複作成 → 409
- RPT-024: submitted 日報の更新 → 422
- RPT-028: 訪問記録 0 件での提出 → 422

## 完了条件
- [ ] 全 37 テストケースが pass する' \
"test" "$M6"

new_issue \
"[test] コメント・マスタ API テストの実装（CMT / USR / CST）" \
'## 概要
テスト仕様書のコメント・ユーザーマスタ・顧客マスタ API テストケースを実装する。

## 対象テストケース
**コメント (CMT-001〜015)**: 投稿・編集・削除
**ユーザーマスタ (USR-001〜015)**: 一覧・作成・詳細・更新・削除
**顧客マスタ (CST-001〜015)**: 一覧・作成・詳細・更新・削除

## 実装内容
- `tests/api/comments.test.ts`
- `tests/api/master-users.test.ts`
- `tests/api/master-customers.test.ts`

## 完了条件
- [ ] 全 45 テストケースが pass する' \
"test" "$M6"

new_issue \
"[test] 権限テストの実装（SEC-001〜020）" \
'## 概要
テスト仕様書の権限横断テスト（SEC-001〜020）を実装する。

## 対象
全 API エンドポイントについて sales / manager の権限制御を検証する。
（テスト仕様書 5章 権限テスト横断マトリクス参照）

## 実装内容
`tests/security/permissions.test.ts`

各エンドポイントに対して:
- sales でのリクエスト結果（200 or 403）
- manager でのリクエスト結果

## 完了条件
- [ ] 全 20 テストケースが pass する
- [ ] 権限違反で必ず 403 が返ることが確認できる' \
"test" "$M6"

new_issue \
"[test] E2E テストの実装（E2E-001〜005）" \
'## 概要
テスト仕様書の E2E テストシナリオ 5 件を Playwright で実装する。

## 対象シナリオ
| ID | シナリオ |
|---|---|
| E2E-001 | 営業が日報を作成・提出するフロー（11ステップ） |
| E2E-002 | 上長が日報を確認・コメントするフロー（5ステップ） |
| E2E-003 | 営業がコメントを閲覧するフロー（4ステップ） |
| E2E-004 | 顧客マスタ管理フロー（4ステップ） |
| E2E-005 | 訪問記録の並び替えフロー（3ステップ） |

## 実装内容
```bash
npm install -D @playwright/test
npx playwright install
```
`tests/e2e/*.spec.ts`

## 完了条件
- [ ] 全 5 シナリオが pass する' \
"test" "$M6"

# ===========================
# Infrastructure
# ===========================
new_issue \
"[infra] Workload Identity Federation の設定と GitHub Secrets の登録" \
'## 概要
GitHub Actions から Cloud Run へデプロイするための Workload Identity Federation を設定する。

## 実装内容
README の「Workload Identity Federation のセットアップ」コマンドを実行:

1. Workload Identity プールの作成
2. GitHub OIDC プロバイダーの作成
3. サービスアカウントの作成
   - 付与ロール: `roles/run.admin` / `roles/artifactregistry.writer` / `roles/iam.serviceAccountUser`
4. GitHub Secrets 登録:
   - `WIF_PROVIDER`
   - `WIF_SERVICE_ACCOUNT`
   - `DATABASE_URL`

## 完了条件
- [ ] `gh secret list` で 3 つの Secrets が確認できる
- [ ] main ブランチへの push で CD ワークフローが成功する' \
"infra" ""

new_issue \
"[infra] Artifact Registry リポジトリの作成と Cloud Run 初回デプロイ" \
'## 概要
Docker イメージのプッシュ先 Artifact Registry リポジトリを作成し、Cloud Run サービスを初期設定する。

## 実装内容
```bash
# Artifact Registry リポジトリ作成
gcloud artifacts repositories create daily-report \
  --project=daily-report-488014 \
  --repository-format=docker \
  --location=asia-northeast1

# Cloud Run 環境変数設定
gcloud run services update daily-report \
  --region asia-northeast1 \
  --set-env-vars DATABASE_URL=...,NEXTAUTH_SECRET=...,NEXTAUTH_URL=...
```

## 完了条件
- [ ] Artifact Registry にリポジトリが作成されている
- [ ] Cloud Run サービスの URL が発行されている
- [ ] サービスに正常にアクセスできる' \
"infra" ""

echo ""
echo "========================================="
echo "  All issues created successfully!"
echo "  https://github.com/$REPO/issues"
echo "========================================="
