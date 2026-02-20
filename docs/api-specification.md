# 営業日報システム API仕様書

## 1. 共通仕様

### ベースURL

```
/api/v1
```

### 認証方式

JWTベアラートークンを使用する。ログイン後に取得したトークンを `Authorization` ヘッダーに付与する。

```
Authorization: Bearer <token>
```

### コンテンツタイプ

リクエスト・レスポンスともに `application/json`

### レスポンス形式

#### 成功（単件）

```json
{
  "data": { ... }
}
```

#### 成功（一覧）

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

#### エラー

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      { "field": "フィールド名", "message": "エラー詳細" }
    ]
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

### エラーコード一覧

| コード | 説明 |
|---|---|
| UNAUTHORIZED | 未認証 |
| FORBIDDEN | 権限なし |
| NOT_FOUND | リソースが存在しない |
| VALIDATION_ERROR | バリデーションエラー |
| CONFLICT | 重複エラー |
| INVALID_STATUS_TRANSITION | 不正なステータス遷移 |

---

## 2. API一覧

| # | メソッド | パス | 説明 | sales | manager |
|---|---|---|---|---|---|
| 1 | POST | /auth/login | ログイン | o | o |
| 2 | POST | /auth/logout | ログアウト | o | o |
| 3 | GET | /reports | 日報一覧 | o（自分のみ） | o（全件） |
| 4 | POST | /reports | 日報作成 | o | - |
| 5 | GET | /reports/:id | 日報詳細 | o（自分のみ） | o（全件） |
| 6 | PUT | /reports/:id | 日報更新 | o（draft のみ） | - |
| 7 | PATCH | /reports/:id/submit | 日報提出 | o（draft のみ） | - |
| 8 | PATCH | /reports/:id/review | 日報確認済み | - | o（submitted のみ） |
| 9 | POST | /reports/:id/comments | コメント投稿 | - | o |
| 10 | PUT | /reports/:id/comments/:commentId | コメント編集 | - | o（自分のみ） |
| 11 | DELETE | /reports/:id/comments/:commentId | コメント削除 | - | o（自分のみ） |
| 12 | GET | /master/users | ユーザー一覧 | - | o |
| 13 | POST | /master/users | ユーザー作成 | - | o |
| 14 | GET | /master/users/:id | ユーザー詳細 | - | o |
| 15 | PUT | /master/users/:id | ユーザー更新 | - | o |
| 16 | DELETE | /master/users/:id | ユーザー削除 | - | o |
| 17 | GET | /master/customers | 顧客一覧 | o | o |
| 18 | POST | /master/customers | 顧客作成 | - | o |
| 19 | GET | /master/customers/:id | 顧客詳細 | o | o |
| 20 | PUT | /master/customers/:id | 顧客更新 | - | o |
| 21 | DELETE | /master/customers/:id | 顧客削除 | - | o |

---

## 3. 認証API

### POST /auth/login

ログイン。メールアドレスとパスワードで認証し、JWTトークンを返す。

**認証**: 不要

**リクエストボディ**

```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス 200**

```json
{
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "山田 太郎",
      "email": "yamada@example.com",
      "role": "sales",
      "department": "東京営業部"
    }
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 401 | UNAUTHORIZED | メールアドレスまたはパスワードが不正 |

---

### POST /auth/logout

ログアウト。トークンを無効化する。

**認証**: 必須

**リクエストボディ**: なし

**レスポンス 204**: なし

---

## 4. 日報API

### GET /reports

日報一覧を取得する。

- sales: 自分の日報のみ返す
- manager: 全件返す

**認証**: 必須

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| date_from | date `YYYY-MM-DD` | - | 報告日の開始 |
| date_to | date `YYYY-MM-DD` | - | 報告日の終了 |
| status | string | - | `draft` / `submitted` / `reviewed` |
| user_id | int | - | 担当者ID（manager のみ有効） |
| page | int | - | ページ番号（デフォルト: 1） |
| per_page | int | - | 1ページあたりの件数（デフォルト: 20） |

**レスポンス 200**

```json
{
  "data": [
    {
      "id": 10,
      "report_date": "2026-02-20",
      "status": "submitted",
      "user": {
        "id": 2,
        "name": "山田 太郎"
      },
      "comment_count": 2,
      "created_at": "2026-02-20T09:00:00Z",
      "updated_at": "2026-02-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "per_page": 20
  }
}
```

---

### POST /reports

日報を新規作成する。

**認証**: 必須
**権限**: sales のみ

**リクエストボディ**

```json
{
  "report_date": "2026-02-20",
  "problem": "〇〇社との価格交渉が難航している",
  "plan": "明日は△△社へのフォローアップを行う",
  "visit_records": [
    {
      "customer_id": 5,
      "visit_time": "10:00",
      "content": "新製品の提案を行い、概ね好評だった",
      "sort_order": 1
    },
    {
      "customer_id": 8,
      "visit_time": "14:00",
      "content": "契約更新の相談を受けた",
      "sort_order": 2
    }
  ]
}
```

**バリデーション**

| フィールド | ルール |
|---|---|
| report_date | 必須。同一ユーザー・同一日付の重複不可 |
| visit_records[].customer_id | 必須 |
| visit_records[].content | 必須 |
| visit_records[].sort_order | 必須 |

**レスポンス 201**

```json
{
  "data": {
    "id": 10,
    "report_date": "2026-02-20",
    "status": "draft",
    "problem": "〇〇社との価格交渉が難航している",
    "plan": "明日は△△社へのフォローアップを行う",
    "user": {
      "id": 2,
      "name": "山田 太郎",
      "department": "東京営業部"
    },
    "visit_records": [
      {
        "id": 20,
        "customer": {
          "id": 5,
          "name": "佐藤商事",
          "company_name": "佐藤商事株式会社"
        },
        "visit_time": "10:00",
        "content": "新製品の提案を行い、概ね好評だった",
        "sort_order": 1
      }
    ],
    "comments": [],
    "created_at": "2026-02-20T09:00:00Z",
    "updated_at": "2026-02-20T09:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | manager は作成不可 |
| 409 | CONFLICT | 同一日付の日報が既に存在する |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### GET /reports/:id

日報の詳細を取得する。訪問記録・コメントを含む。

**認証**: 必須
**権限**: 自分の日報（sales）、全件（manager）

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | int | 日報ID |

**レスポンス 200**

```json
{
  "data": {
    "id": 10,
    "report_date": "2026-02-20",
    "status": "submitted",
    "problem": "〇〇社との価格交渉が難航している",
    "plan": "明日は△△社へのフォローアップを行う",
    "user": {
      "id": 2,
      "name": "山田 太郎",
      "department": "東京営業部"
    },
    "visit_records": [
      {
        "id": 20,
        "customer": {
          "id": 5,
          "name": "佐藤商事",
          "company_name": "佐藤商事株式会社"
        },
        "visit_time": "10:00",
        "content": "新製品の提案を行い、概ね好評だった",
        "sort_order": 1
      }
    ],
    "comments": [
      {
        "id": 3,
        "content": "価格交渉については部長に相談してみてください",
        "commenter": {
          "id": 1,
          "name": "鈴木 部長"
        },
        "created_at": "2026-02-20T18:00:00Z",
        "updated_at": "2026-02-20T18:00:00Z"
      }
    ],
    "created_at": "2026-02-20T09:00:00Z",
    "updated_at": "2026-02-20T10:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | 他人の日報に sales がアクセス |
| 404 | NOT_FOUND | 日報が存在しない |

---

### PUT /reports/:id

日報を更新する。`draft` 状態のみ更新可能。

**認証**: 必須
**権限**: sales（自分の `draft` のみ）

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | int | 日報ID |

**リクエストボディ**: `POST /reports` と同形式

**レスポンス 200**: `GET /reports/:id` と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | 他人の日報、または manager |
| 404 | NOT_FOUND | 日報が存在しない |
| 422 | INVALID_STATUS_TRANSITION | `draft` 以外は更新不可 |

---

### PATCH /reports/:id/submit

日報を提出する（`draft` → `submitted`）。

**認証**: 必須
**権限**: sales（自分の `draft` のみ）

**リクエストボディ**: なし

**バリデーション**

| ルール |
|---|
| 訪問記録が1件以上あること |

**レスポンス 200**

```json
{
  "data": {
    "id": 10,
    "status": "submitted",
    "updated_at": "2026-02-20T10:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | 他人の日報、または manager |
| 404 | NOT_FOUND | 日報が存在しない |
| 422 | INVALID_STATUS_TRANSITION | `draft` 以外は提出不可 |
| 422 | VALIDATION_ERROR | 訪問記録が0件 |

---

### PATCH /reports/:id/review

日報を確認済みにする（`submitted` → `reviewed`）。

**認証**: 必須
**権限**: manager のみ

**リクエストボディ**: なし

**レスポンス 200**

```json
{
  "data": {
    "id": 10,
    "status": "reviewed",
    "updated_at": "2026-02-20T18:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | 日報が存在しない |
| 422 | INVALID_STATUS_TRANSITION | `submitted` 以外は確認済みにできない |

---

## 5. コメントAPI

### POST /reports/:id/comments

コメントを投稿する。

**認証**: 必須
**権限**: manager のみ

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | int | 日報ID |

**リクエストボディ**

```json
{
  "content": "価格交渉については部長に相談してみてください"
}
```

**バリデーション**

| フィールド | ルール |
|---|---|
| content | 必須 |

**レスポンス 201**

```json
{
  "data": {
    "id": 3,
    "content": "価格交渉については部長に相談してみてください",
    "commenter": {
      "id": 1,
      "name": "鈴木 部長"
    },
    "created_at": "2026-02-20T18:00:00Z",
    "updated_at": "2026-02-20T18:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は投稿不可 |
| 404 | NOT_FOUND | 日報が存在しない |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### PUT /reports/:id/comments/:commentId

コメントを編集する。自分が投稿したコメントのみ編集可能。

**認証**: 必須
**権限**: manager（自分のコメントのみ）

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | int | 日報ID |
| commentId | int | コメントID |

**リクエストボディ**

```json
{
  "content": "修正後のコメント内容"
}
```

**レスポンス 200**

```json
{
  "data": {
    "id": 3,
    "content": "修正後のコメント内容",
    "commenter": {
      "id": 1,
      "name": "鈴木 部長"
    },
    "created_at": "2026-02-20T18:00:00Z",
    "updated_at": "2026-02-20T18:30:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | 他人のコメント、または sales |
| 404 | NOT_FOUND | コメントが存在しない |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### DELETE /reports/:id/comments/:commentId

コメントを削除する。自分が投稿したコメントのみ削除可能。

**認証**: 必須
**権限**: manager（自分のコメントのみ）

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | int | 日報ID |
| commentId | int | コメントID |

**レスポンス 204**: なし

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | 他人のコメント、または sales |
| 404 | NOT_FOUND | コメントが存在しない |

---

## 6. ユーザーマスタAPI

### GET /master/users

ユーザー一覧を取得する。

**認証**: 必須
**権限**: manager のみ

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| page | int | - | ページ番号（デフォルト: 1） |
| per_page | int | - | 1ページあたりの件数（デフォルト: 20） |

**レスポンス 200**

```json
{
  "data": [
    {
      "id": 1,
      "name": "鈴木 部長",
      "email": "suzuki@example.com",
      "role": "manager",
      "department": "東京営業部",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "per_page": 20
  }
}
```

---

### POST /master/users

ユーザーを作成する。

**認証**: 必須
**権限**: manager のみ

**リクエストボディ**

```json
{
  "name": "田中 花子",
  "email": "tanaka@example.com",
  "password": "initialPassword123",
  "role": "sales",
  "department": "大阪営業部"
}
```

**バリデーション**

| フィールド | ルール |
|---|---|
| name | 必須 |
| email | 必須。メール形式。UNIQUE |
| password | 必須 |
| role | 必須。`sales` または `manager` |

**レスポンス 201**

```json
{
  "data": {
    "id": 5,
    "name": "田中 花子",
    "email": "tanaka@example.com",
    "role": "sales",
    "department": "大阪営業部",
    "created_at": "2026-02-20T09:00:00Z",
    "updated_at": "2026-02-20T09:00:00Z"
  }
}
```

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 409 | CONFLICT | メールアドレスが既に使用されている |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### GET /master/users/:id

ユーザーの詳細を取得する。

**認証**: 必須
**権限**: manager のみ

**レスポンス 200**: `GET /master/users` の data 要素と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | ユーザーが存在しない |

---

### PUT /master/users/:id

ユーザー情報を更新する。

**認証**: 必須
**権限**: manager のみ

**リクエストボディ**

```json
{
  "name": "田中 花子",
  "email": "tanaka@example.com",
  "role": "sales",
  "department": "大阪営業部"
}
```

> パスワード変更は別途エンドポイントの追加を検討（未決定事項）

**レスポンス 200**: `GET /master/users` の data 要素と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | ユーザーが存在しない |
| 409 | CONFLICT | メールアドレスが既に使用されている |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### DELETE /master/users/:id

ユーザーを削除する。

**認証**: 必須
**権限**: manager のみ

**レスポンス 204**: なし

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | ユーザーが存在しない |

---

## 7. 顧客マスタAPI

### GET /master/customers

顧客一覧を取得する。

**認証**: 必須
**権限**: 全員

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| q | string | - | 顧客名・会社名のキーワード検索 |
| industry | string | - | 業種で絞り込み |
| page | int | - | ページ番号（デフォルト: 1） |
| per_page | int | - | 1ページあたりの件数（デフォルト: 20） |

**レスポンス 200**

```json
{
  "data": [
    {
      "id": 5,
      "name": "佐藤商事",
      "company_name": "佐藤商事株式会社",
      "department": "購買部",
      "industry": "製造業",
      "contact_name": "佐藤 一郎",
      "deal_size": "大",
      "phone": "03-1234-5678",
      "address": "東京都千代田区〇〇1-1-1",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 80,
    "page": 1,
    "per_page": 20
  }
}
```

---

### POST /master/customers

顧客を作成する。

**認証**: 必須
**権限**: manager のみ

**リクエストボディ**

```json
{
  "name": "佐藤商事",
  "company_name": "佐藤商事株式会社",
  "department": "購買部",
  "industry": "製造業",
  "contact_name": "佐藤 一郎",
  "deal_size": "大",
  "phone": "03-1234-5678",
  "address": "東京都千代田区〇〇1-1-1"
}
```

**バリデーション**

| フィールド | ルール |
|---|---|
| name | 必須 |
| company_name | 必須 |

**レスポンス 201**: `GET /master/customers` の data 要素と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### GET /master/customers/:id

顧客の詳細を取得する。

**認証**: 必須
**権限**: 全員

**レスポンス 200**: `GET /master/customers` の data 要素と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 404 | NOT_FOUND | 顧客が存在しない |

---

### PUT /master/customers/:id

顧客情報を更新する。

**認証**: 必須
**権限**: manager のみ

**リクエストボディ**: `POST /master/customers` と同形式

**レスポンス 200**: `GET /master/customers` の data 要素と同形式

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | 顧客が存在しない |
| 422 | VALIDATION_ERROR | バリデーションエラー |

---

### DELETE /master/customers/:id

顧客を削除する。

**認証**: 必須
**権限**: manager のみ

**レスポンス 204**: なし

**エラー**

| ステータス | コード | 説明 |
|---|---|---|
| 403 | FORBIDDEN | sales は操作不可 |
| 404 | NOT_FOUND | 顧客が存在しない |

---

## 8. 未決定事項

- パスワード変更APIの設計（`PATCH /master/users/:id/password` など）
- JWTトークンの有効期限とリフレッシュ方式
- ページネーションのデフォルト件数
