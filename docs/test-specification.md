# 営業日報システム テスト仕様書

## 1. テスト方針

### テスト種別

| 種別 | 目的 | 対象 |
|---|---|---|
| APIテスト | エンドポイントの正常系・異常系・権限を検証 | 全APIエンドポイント |
| E2Eテスト | 画面操作を通じた主要業務フローを検証 | 主要シナリオ |
| 権限テスト | sales / manager ごとのアクセス制御を横断検証 | 全操作 |

### テスト観点

- **正常系**: 正しい入力で期待通りの結果が返ること
- **異常系**: 不正な入力・操作でエラーが返ること
- **境界値**: 必須項目の欠損・重複などの境界条件
- **権限**: 役割に応じた操作制限が正しく機能すること
- **ステータス遷移**: 日報ステータスが正しく遷移・拒否されること

---

## 2. テスト環境・前提データ

### テストユーザー

| ユーザーID | 氏名 | 役割 | 備考 |
|---|---|---|---|
| 1 | 鈴木 部長 | manager | |
| 2 | 山田 太郎 | sales | |
| 3 | 田中 花子 | sales | 別営業担当 |

### テスト顧客

| 顧客ID | 顧客名 | 会社名 |
|---|---|---|
| 1 | 佐藤商事 | 佐藤商事株式会社 |
| 2 | 鈴木工業 | 鈴木工業株式会社 |

---

## 3. APIテスト仕様

---

### 3.1 認証API

#### POST /auth/login

| テストID | テスト観点 | 入力 | 期待結果 |
|---|---|---|---|
| AUTH-001 | 正常ログイン（sales） | 正しいメール・パスワード（山田） | 200, token と user 情報を返す |
| AUTH-002 | 正常ログイン（manager） | 正しいメール・パスワード（鈴木） | 200, role: "manager" を返す |
| AUTH-003 | パスワード不正 | 正しいメール + 誤ったパスワード | 401, UNAUTHORIZED |
| AUTH-004 | メールアドレス不正 | 存在しないメールアドレス | 401, UNAUTHORIZED |
| AUTH-005 | メールアドレス未入力 | email: null | 422, VALIDATION_ERROR |
| AUTH-006 | パスワード未入力 | password: null | 422, VALIDATION_ERROR |

#### POST /auth/logout

| テストID | テスト観点 | 前提条件 | 期待結果 |
|---|---|---|---|
| AUTH-007 | 正常ログアウト | 有効なトークンでリクエスト | 204 |
| AUTH-008 | ログアウト後のAPI呼び出し | ログアウト済みトークンで `/reports` にリクエスト | 401, UNAUTHORIZED |
| AUTH-009 | 未認証でリクエスト | Authorization ヘッダーなし | 401, UNAUTHORIZED |

---

### 3.2 日報API

#### GET /reports

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| RPT-001 | sales は自分の日報のみ取得 | 山田（sales） | 山田・田中それぞれに日報あり | 200, 山田の日報のみ返る |
| RPT-002 | manager は全件取得 | 鈴木（manager） | 山田・田中それぞれに日報あり | 200, 全員の日報が返る |
| RPT-003 | 日付フィルタ | 山田（sales） | 複数日の日報あり | `date_from`〜`date_to` 範囲内のみ返る |
| RPT-004 | ステータスフィルタ | 鈴木（manager） | draft / submitted 混在 | 指定ステータスのみ返る |
| RPT-005 | user_id フィルタ（manager） | 鈴木（manager） | 複数担当者の日報あり | 指定担当者の日報のみ返る |
| RPT-006 | user_id フィルタ（sales は無効） | 山田（sales） | `user_id=3` を指定 | 自分の日報のみ返る（フィルタ無視） |
| RPT-007 | ページネーション | 鈴木（manager） | 日報が25件ある | `page=1&per_page=20` で20件, meta.total=25 |

#### POST /reports

| テストID | テスト観点 | 実行ユーザー | 入力 | 期待結果 |
|---|---|---|---|---|
| RPT-008 | 正常作成（訪問記録複数） | 山田（sales） | 訪問記録2件、problem・plan あり | 201, status: "draft", visit_records が2件 |
| RPT-009 | 正常作成（problem・plan 省略） | 山田（sales） | 訪問記録1件のみ | 201, problem・plan が null |
| RPT-010 | manager は作成不可 | 鈴木（manager） | 正常なリクエストボディ | 403, FORBIDDEN |
| RPT-011 | 同日付の重複作成 | 山田（sales） | 既存日報と同じ report_date | 409, CONFLICT |
| RPT-012 | report_date 未入力 | 山田（sales） | report_date: null | 422, VALIDATION_ERROR |
| RPT-013 | 訪問記録の customer_id 未入力 | 山田（sales） | visit_records[0].customer_id: null | 422, VALIDATION_ERROR |
| RPT-014 | 訪問記録の content 未入力 | 山田（sales） | visit_records[0].content: null | 422, VALIDATION_ERROR |
| RPT-015 | sort_order が正しく保存される | 山田（sales） | sort_order: 2, 1 の順で入力 | レスポンスの visit_records が sort_order 順 |

#### GET /reports/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| RPT-016 | 自分の日報を取得（sales） | 山田（sales） | 山田の日報あり | 200, visit_records・comments を含む |
| RPT-017 | 他人の日報を取得（sales） | 山田（sales） | 田中の日報あり | 403, FORBIDDEN |
| RPT-018 | 全日報を取得（manager） | 鈴木（manager） | 田中の日報あり | 200 |
| RPT-019 | 存在しない ID | 山田（sales） | 該当日報なし | 404, NOT_FOUND |
| RPT-020 | コメントが含まれる | 山田（sales） | 日報にコメント2件あり | 200, comments に2件含まれる |

#### PUT /reports/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| RPT-021 | draft の日報を正常更新 | 山田（sales） | 山田の draft 日報 | 200, 内容が更新される |
| RPT-022 | 訪問記録を追加 | 山田（sales） | 山田の draft 日報（1件） | 200, visit_records が2件になる |
| RPT-023 | 訪問記録を削除 | 山田（sales） | 山田の draft 日報（2件） | 200, visit_records が1件になる |
| RPT-024 | submitted の日報は更新不可 | 山田（sales） | 山田の submitted 日報 | 422, INVALID_STATUS_TRANSITION |
| RPT-025 | 他人の日報は更新不可（sales） | 山田（sales） | 田中の draft 日報 | 403, FORBIDDEN |
| RPT-026 | manager は更新不可 | 鈴木（manager） | 任意の日報 | 403, FORBIDDEN |

#### PATCH /reports/:id/submit

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| RPT-027 | 正常提出 | 山田（sales） | 訪問記録1件以上の draft 日報 | 200, status: "submitted" |
| RPT-028 | 訪問記録0件で提出 | 山田（sales） | 訪問記録なしの draft 日報 | 422, VALIDATION_ERROR |
| RPT-029 | submitted の日報を再提出 | 山田（sales） | submitted 日報 | 422, INVALID_STATUS_TRANSITION |
| RPT-030 | reviewed の日報を提出 | 山田（sales） | reviewed 日報 | 422, INVALID_STATUS_TRANSITION |
| RPT-031 | 他人の日報を提出（sales） | 山田（sales） | 田中の draft 日報 | 403, FORBIDDEN |
| RPT-032 | manager は提出不可 | 鈴木（manager） | 任意の draft 日報 | 403, FORBIDDEN |

#### PATCH /reports/:id/review

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| RPT-033 | 正常確認済み | 鈴木（manager） | submitted 日報 | 200, status: "reviewed" |
| RPT-034 | draft を確認済みにする | 鈴木（manager） | draft 日報 | 422, INVALID_STATUS_TRANSITION |
| RPT-035 | reviewed を再確認 | 鈴木（manager） | reviewed 日報 | 422, INVALID_STATUS_TRANSITION |
| RPT-036 | sales は確認済みにできない | 山田（sales） | submitted 日報 | 403, FORBIDDEN |
| RPT-037 | 存在しない ID | 鈴木（manager） | 該当日報なし | 404, NOT_FOUND |

---

### 3.3 コメントAPI

#### POST /reports/:id/comments

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| CMT-001 | 正常投稿 | 鈴木（manager） | submitted 日報 | 201, content・commenter を返す |
| CMT-002 | draft 日報にもコメント可能 | 鈴木（manager） | draft 日報 | 201 |
| CMT-003 | sales はコメント投稿不可 | 山田（sales） | submitted 日報 | 403, FORBIDDEN |
| CMT-004 | content 未入力 | 鈴木（manager） | submitted 日報 | 422, VALIDATION_ERROR |
| CMT-005 | 存在しない日報ID | 鈴木（manager） | 該当日報なし | 404, NOT_FOUND |
| CMT-006 | 複数コメント投稿 | 鈴木（manager） | 既にコメント1件ある日報 | 201, 2件目が作成される |

#### PUT /reports/:id/comments/:commentId

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| CMT-007 | 自分のコメントを編集 | 鈴木（manager） | 鈴木が投稿したコメント | 200, content が更新される |
| CMT-008 | 他の manager のコメントを編集 | 別 manager | 鈴木が投稿したコメント | 403, FORBIDDEN |
| CMT-009 | sales はコメント編集不可 | 山田（sales） | 任意のコメント | 403, FORBIDDEN |
| CMT-010 | content 未入力 | 鈴木（manager） | 自分のコメント | 422, VALIDATION_ERROR |
| CMT-011 | 存在しない commentId | 鈴木（manager） | 該当コメントなし | 404, NOT_FOUND |

#### DELETE /reports/:id/comments/:commentId

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| CMT-012 | 自分のコメントを削除 | 鈴木（manager） | 鈴木が投稿したコメント | 204 |
| CMT-013 | 他の manager のコメントを削除 | 別 manager | 鈴木が投稿したコメント | 403, FORBIDDEN |
| CMT-014 | sales はコメント削除不可 | 山田（sales） | 任意のコメント | 403, FORBIDDEN |
| CMT-015 | 存在しない commentId | 鈴木（manager） | 該当コメントなし | 404, NOT_FOUND |

---

### 3.4 ユーザーマスタAPI

#### GET /master/users

| テストID | テスト観点 | 実行ユーザー | 期待結果 |
|---|---|---|---|
| USR-001 | manager が一覧取得 | 鈴木（manager） | 200, ユーザー一覧を返す |
| USR-002 | sales はアクセス不可 | 山田（sales） | 403, FORBIDDEN |

#### POST /master/users

| テストID | テスト観点 | 実行ユーザー | 入力 | 期待結果 |
|---|---|---|---|---|
| USR-003 | 正常作成（sales） | 鈴木（manager） | 全項目入力、role: "sales" | 201, ユーザー情報を返す |
| USR-004 | 正常作成（manager） | 鈴木（manager） | 全項目入力、role: "manager" | 201 |
| USR-005 | sales は作成不可 | 山田（sales） | 正常ボディ | 403, FORBIDDEN |
| USR-006 | メールアドレス重複 | 鈴木（manager） | 既存メールアドレス | 409, CONFLICT |
| USR-007 | name 未入力 | 鈴木（manager） | name: null | 422, VALIDATION_ERROR |
| USR-008 | email 未入力 | 鈴木（manager） | email: null | 422, VALIDATION_ERROR |
| USR-009 | 不正な role | 鈴木（manager） | role: "admin" | 422, VALIDATION_ERROR |

#### PUT /master/users/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| USR-010 | 正常更新 | 鈴木（manager） | 既存ユーザー | 200, 内容が更新される |
| USR-011 | sales は更新不可 | 山田（sales） | 任意ユーザー | 403, FORBIDDEN |
| USR-012 | 存在しない ID | 鈴木（manager） | 該当ユーザーなし | 404, NOT_FOUND |

#### DELETE /master/users/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| USR-013 | 正常削除 | 鈴木（manager） | 既存ユーザー | 204 |
| USR-014 | sales は削除不可 | 山田（sales） | 任意ユーザー | 403, FORBIDDEN |
| USR-015 | 存在しない ID | 鈴木（manager） | 該当ユーザーなし | 404, NOT_FOUND |

---

### 3.5 顧客マスタAPI

#### GET /master/customers

| テストID | テスト観点 | 実行ユーザー | 入力 | 期待結果 |
|---|---|---|---|---|
| CST-001 | manager が一覧取得 | 鈴木（manager） | - | 200, 顧客一覧を返す |
| CST-002 | sales が一覧取得 | 山田（sales） | - | 200, 顧客一覧を返す |
| CST-003 | キーワード検索 | 山田（sales） | q=佐藤 | 顧客名・会社名に"佐藤"を含む顧客のみ |
| CST-004 | 業種フィルタ | 鈴木（manager） | industry=製造業 | 製造業の顧客のみ |

#### POST /master/customers

| テストID | テスト観点 | 実行ユーザー | 入力 | 期待結果 |
|---|---|---|---|---|
| CST-005 | 正常作成 | 鈴木（manager） | 全項目入力 | 201, 顧客情報を返す |
| CST-006 | 必須項目のみ作成 | 鈴木（manager） | name・company_name のみ | 201 |
| CST-007 | sales は作成不可 | 山田（sales） | 正常ボディ | 403, FORBIDDEN |
| CST-008 | name 未入力 | 鈴木（manager） | name: null | 422, VALIDATION_ERROR |
| CST-009 | company_name 未入力 | 鈴木（manager） | company_name: null | 422, VALIDATION_ERROR |

#### PUT /master/customers/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| CST-010 | 正常更新 | 鈴木（manager） | 既存顧客 | 200, 内容が更新される |
| CST-011 | sales は更新不可 | 山田（sales） | 任意顧客 | 403, FORBIDDEN |
| CST-012 | 存在しない ID | 鈴木（manager） | 該当顧客なし | 404, NOT_FOUND |

#### DELETE /master/customers/:id

| テストID | テスト観点 | 実行ユーザー | 前提条件 | 期待結果 |
|---|---|---|---|---|
| CST-013 | 正常削除 | 鈴木（manager） | 既存顧客 | 204 |
| CST-014 | sales は削除不可 | 山田（sales） | 任意顧客 | 403, FORBIDDEN |
| CST-015 | 存在しない ID | 鈴木（manager） | 該当顧客なし | 404, NOT_FOUND |

---

## 4. E2Eテスト仕様

### シナリオ E2E-001: 営業が日報を作成・提出するフロー

**対象ユーザー**: 山田（sales）

| ステップ | 操作 | 期待結果 |
|---|---|---|
| 1 | S01: メールアドレス・パスワードを入力してログイン | S02（日報一覧）に遷移する |
| 2 | S02: 「新規作成」ボタンをクリック | S03（日報作成）に遷移する |
| 3 | S03: 報告日に本日の日付が自動入力されていることを確認 | 本日の日付が入力済み |
| 4 | S03: 顧客を選択し、訪問時刻・訪問内容を入力 | 入力欄に値が反映される |
| 5 | S03: 「行を追加」をクリックし、2件目の訪問記録を入力 | 2行目の入力欄が追加される |
| 6 | S03: Problem・Plan を入力 | 入力欄に値が反映される |
| 7 | S03: 「下書き保存」をクリック | S02 に遷移し、一覧に status: draft の日報が表示される |
| 8 | S02: 作成した日報をクリック | S04（日報詳細）に遷移し、入力内容が正しく表示される |
| 9 | S04: 「編集」ボタンをクリック | S03 に遷移し、既存内容が入力済み |
| 10 | S03: 訪問内容を修正して「提出」をクリック | S02 に遷移し、status: submitted に変わっている |
| 11 | S02: 提出済み日報の「編集」ボタンが表示されないことを確認 | 編集ボタンが非表示 |

---

### シナリオ E2E-002: 上長が日報を確認・コメントするフロー

**対象ユーザー**: 鈴木（manager）
**前提**: 山田の submitted 日報が存在する

| ステップ | 操作 | 期待結果 |
|---|---|---|
| 1 | S01: manager としてログイン | S02 に遷移する |
| 2 | S02: 担当者フィルタで「山田 太郎」を選択 | 山田の日報のみ表示される |
| 3 | S02: submitted の日報をクリック | S04 に遷移し、日報内容が表示される |
| 4 | S04: コメント入力欄にコメントを入力して「投稿」をクリック | コメント一覧に投稿内容が追加される |
| 5 | S04: 「確認済みにする」ボタンをクリック | ステータスが reviewed に変わり、ボタンが非表示になる |

---

### シナリオ E2E-003: 営業がコメントを閲覧するフロー

**対象ユーザー**: 山田（sales）
**前提**: 山田の reviewed 日報にコメントが投稿済み

| ステップ | 操作 | 期待結果 |
|---|---|---|
| 1 | S01: sales としてログイン | S02 に遷移する |
| 2 | S02: reviewed の日報をクリック | S04 に遷移する |
| 3 | S04: コメントセクションを確認 | 上長のコメントが表示される |
| 4 | S04: コメント投稿欄が表示されないことを確認 | コメント入力欄が非表示 |

---

### シナリオ E2E-004: 顧客マスタ管理フロー

**対象ユーザー**: 鈴木（manager）

| ステップ | 操作 | 期待結果 |
|---|---|---|
| 1 | S07: 「新規登録」をクリック | S08（顧客登録）に遷移する |
| 2 | S08: 顧客名・会社名を入力して「保存」 | S07 に戻り、登録した顧客が一覧に表示される |
| 3 | S07: 登録した顧客の「編集」をクリック | S08 に遷移し、既存内容が入力済み |
| 4 | S08: 業種を追記して「保存」 | S07 に戻り、更新内容が反映されている |

---

### シナリオ E2E-005: 訪問記録の並び替えフロー

**対象ユーザー**: 山田（sales）

| ステップ | 操作 | 期待結果 |
|---|---|---|
| 1 | S03: 訪問記録を2件入力 | 2行表示される |
| 2 | S03: 2件目の行を1件目の上にドラッグ＆ドロップ | 表示順が入れ替わる |
| 3 | S03: 「下書き保存」をクリック | S04 で並び替え後の順番で表示される |

---

## 5. 権限テスト 横断マトリクス

| テストID | 操作 | sales | manager | 備考 |
|---|---|---|---|---|
| SEC-001 | POST /auth/login | 200 | 200 | |
| SEC-002 | GET /reports | 200（自分のみ） | 200（全件） | |
| SEC-003 | POST /reports | 201 | 403 | |
| SEC-004 | GET /reports/:id（自分） | 200 | 200 | |
| SEC-005 | GET /reports/:id（他人） | 403 | 200 | |
| SEC-006 | PUT /reports/:id（自分 draft） | 200 | 403 | |
| SEC-007 | PATCH /reports/:id/submit | 200 | 403 | |
| SEC-008 | PATCH /reports/:id/review | 403 | 200 | |
| SEC-009 | POST /reports/:id/comments | 403 | 201 | |
| SEC-010 | PUT /reports/:id/comments/:id（自分） | 403 | 200 | |
| SEC-011 | PUT /reports/:id/comments/:id（他人） | 403 | 403 | |
| SEC-012 | DELETE /reports/:id/comments/:id（自分） | 403 | 204 | |
| SEC-013 | GET /master/users | 403 | 200 | |
| SEC-014 | POST /master/users | 403 | 201 | |
| SEC-015 | PUT /master/users/:id | 403 | 200 | |
| SEC-016 | DELETE /master/users/:id | 403 | 204 | |
| SEC-017 | GET /master/customers | 200 | 200 | |
| SEC-018 | POST /master/customers | 403 | 201 | |
| SEC-019 | PUT /master/customers/:id | 403 | 200 | |
| SEC-020 | DELETE /master/customers/:id | 403 | 204 | |

---

## 6. ステータス遷移テスト 横断マトリクス

| テストID | 操作 | draft | submitted | reviewed | 期待結果 |
|---|---|---|---|---|---|
| STS-001 | PUT /reports/:id（sales） | 200 | 422 | 422 | draft のみ更新可 |
| STS-002 | PATCH submit（sales） | 200 | 422 | 422 | draft のみ提出可 |
| STS-003 | PATCH review（manager） | 422 | 200 | 422 | submitted のみ確認済みに変更可 |

---

## 7. テストケース集計

| カテゴリ | 件数 |
|---|---|
| 認証API | 9件 |
| 日報API | 30件 |
| コメントAPI | 15件 |
| ユーザーマスタAPI | 13件 |
| 顧客マスタAPI | 15件 |
| E2Eテスト | 5シナリオ / 25ステップ |
| 権限テスト | 20件 |
| ステータス遷移テスト | 3件 |
| **合計（API + 権限 + 遷移）** | **105件** |
