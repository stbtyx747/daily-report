# 営業日報システム

営業担当者の日報管理・上長コメントができる社内 Web アプリケーション。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| 言語 | TypeScript |
| フレームワーク | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| API スキーマ | OpenAPI (Zod による検証) |
| DB ORM | Prisma |
| テスト | Vitest + Testing Library |
| デプロイ | Google Cloud Run |

---

## 開発環境のセットアップ

### 前提条件

- Node.js 22+
- npm 11+
- Docker
- Google Cloud SDK (`gcloud`)

### 手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd daily-report

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数の設定
cp .env.example .env.local
# .env.local を編集して DATABASE_URL などを設定

# 4. DB マイグレーションの実行
npx prisma migrate dev

# 5. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

---

## 環境変数

| 変数名 | 説明 | 例 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 接続 URL | `postgresql://user:pass@localhost:5432/daily_report` |
| `NEXTAUTH_SECRET` | NextAuth.js の署名・暗号化キー | `openssl rand -base64 32` で生成 |
| `NEXTAUTH_URL` | アプリのベース URL | `http://localhost:3000` |

---

## コマンド一覧

### 開発

```bash
npm run dev          # 開発サーバー起動（http://localhost:3000）
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
```

### コード品質

```bash
npm run lint         # ESLint チェック
npm run lint:fix     # ESLint 自動修正
npm run format       # Prettier フォーマット
npm run format:check # Prettier チェックのみ（CI 用）
npx tsc --noEmit     # TypeScript 型チェック
```

### テスト

```bash
npm test             # ウォッチモードで実行
npm run test:run     # 1 回実行して終了
npm run test:coverage # カバレッジレポート付きで実行
```

カバレッジレポートは `coverage/` ディレクトリに出力される。

### データベース

```bash
npx prisma migrate dev          # マイグレーション実行（開発）
npx prisma migrate deploy       # マイグレーション実行（本番）
npx prisma db seed              # シードデータ投入
npx prisma studio               # GUI でデータ確認
npx prisma generate             # Prisma Client 再生成
```

---

## CI/CD

### フロー

```
Pull Request
    └─ CI ワークフロー (.github/workflows/ci.yml)
           ├─ Lint
           ├─ Type Check
           └─ Test

main ブランチへの push
    └─ CD ワークフロー (.github/workflows/cd.yml)
           ├─ CI (Lint / Type Check / Test)
           └─ Deploy
                  ├─ Docker イメージをビルド
                  ├─ Artifact Registry へ push
                  └─ Cloud Run へデプロイ
```

### GitHub Actions シークレットの設定

リポジトリの Settings > Secrets and variables > Actions に以下を登録する。

| シークレット名 | 説明 |
|---|---|
| `WIF_PROVIDER` | Workload Identity プロバイダーのリソース名 |
| `WIF_SERVICE_ACCOUNT` | デプロイ用サービスアカウントのメールアドレス |
| `DATABASE_URL` | 本番 DB の接続 URL |

### Workload Identity Federation のセットアップ

```bash
# 1. Workload Identity プールの作成
gcloud iam workload-identity-pools create github-pool \
  --project=daily-report-488014 \
  --location=global \
  --display-name="GitHub Actions Pool"

# 2. プロバイダーの作成
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=daily-report-488014 \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. サービスアカウントの作成
gcloud iam service-accounts create github-actions-sa \
  --project=daily-report-488014 \
  --display-name="GitHub Actions Service Account"

# 4. 必要なロールを付与
gcloud projects add-iam-policy-binding daily-report-488014 \
  --member="serviceAccount:github-actions-sa@daily-report-488014.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding daily-report-488014 \
  --member="serviceAccount:github-actions-sa@daily-report-488014.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding daily-report-488014 \
  --member="serviceAccount:github-actions-sa@daily-report-488014.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 5. サービスアカウントに Workload Identity の権限を付与
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-sa@daily-report-488014.iam.gserviceaccount.com \
  --project=daily-report-488014 \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-pool/attribute.repository/<GITHUB_ORG>/<REPO_NAME>"

# 6. シークレットに設定する値の確認
# WIF_PROVIDER:
gcloud iam workload-identity-pools providers describe github-provider \
  --project=daily-report-488014 \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)"

# WIF_SERVICE_ACCOUNT:
echo "github-actions-sa@daily-report-488014.iam.gserviceaccount.com"
```

### Artifact Registry リポジトリの作成

```bash
gcloud artifacts repositories create daily-report \
  --project=daily-report-488014 \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Daily Report app images"
```

---

## Docker

### ローカルでのビルド・起動

```bash
# イメージのビルド
docker build -t daily-report .

# コンテナの起動
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  daily-report
```

ブラウザで [http://localhost:8080](http://localhost:8080) を開く。

---

## プロジェクト構成

```
daily-report/
├── .github/workflows/    # CI/CD ワークフロー
├── .husky/               # Git フック
├── app/                  # Next.js App Router
├── components/           # React コンポーネント
├── lib/                  # ユーティリティ・API クライアント
├── prisma/
│   └── schema.prisma     # DB スキーマ定義
├── docs/                 # 各種仕様書
├── Dockerfile
├── next.config.ts
├── vitest.config.ts
├── eslint.config.mjs
└── prettier.config.mjs
```
