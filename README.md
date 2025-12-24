# FRC 報帳系統 (FRC Money)

<p align="center">
  <strong>專為 FRC 機器人團隊設計的現代化費用報銷管理系統</strong>
</p>

---

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 📝 **報帳單管理** | 建立、編輯、提交費用報銷申請，支援多項目明細 |
| ✅ **多層審核流程** | 經理審批 → 財務審批 → 已付款 的完整流程 |
| 📦 **零件庫存管理** | 追蹤機器人零件庫存、入庫/領用記錄 |
| 👥 **用戶權限管理** | USER / MANAGER / FINANCE / ADMIN 四級角色 |
| 🌐 **多語言支援** | 繁體中文 / English 切換 |
| 📊 **儀表板統計** | 視覺化圖表，一目了然掌握財務狀況 |
| 🔐 **安全認證** | JWT Session + 密碼雜湊存儲 |

---

## 🛠️ 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| **框架** | Next.js (App Router) | 14.2.x |
| **資料庫 ORM** | Prisma | 5.x |
| **資料庫** | PostgreSQL (Supabase) | - |
| **認證** | NextAuth.js (Auth.js) v5 | beta.30 |
| **樣式** | TailwindCSS + tailwindcss-animate | 3.4.x |
| **UI 元件** | shadcn/ui 風格 (Radix UI) | - |
| **表單驗證** | Zod + React Hook Form | - |
| **圖表** | Recharts | 2.12.x |
| **部署** | Vercel + Supabase | - |

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env` 填入以下內容：

```env
# 資料庫連線 (必須)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# NextAuth 認證 (必須)
AUTH_SECRET="your-secret-key"  # 使用 `openssl rand -base64 32` 產生
AUTH_URL="http://localhost:3000"
```

### 3. 產生 Prisma Client

```bash
npx prisma generate
```

### 4. 同步資料庫結構

```bash
npx prisma migrate deploy
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

---

## 📁 專案結構

```
frc報帳/
├── app/                    # Next.js App Router 目錄
│   ├── actions/            # Server Actions
│   │   ├── approvals.ts    # 審批操作
│   │   ├── expenses.ts     # 報帳單 CRUD
│   │   ├── inventory.ts    # 零件庫存操作
│   │   ├── register.ts     # 用戶註冊
│   │   └── users.ts        # 用戶管理
│   ├── api/                # API Routes
│   │   └── auth/           # NextAuth 端點
│   ├── dashboard/          # 儀表板頁面
│   │   ├── expenses/       # 報帳單管理
│   │   ├── inventory/      # 庫存管理
│   │   ├── reports/        # 報表統計
│   │   └── users/          # 用戶管理
│   ├── login/              # 登入頁面
│   ├── register/           # 註冊頁面
│   ├── layout.tsx          # 根 Layout
│   ├── page.tsx            # 首頁
│   └── globals.css         # 全域樣式
├── components/             # React 元件
│   └── ui/                 # 基礎 UI 元件 (shadcn/ui 風格)
├── lib/                    # 工具和配置
│   ├── prisma.ts           # Prisma Client 單例
│   ├── schemas.ts          # Zod 驗證 Schema
│   ├── utils.ts            # 通用工具函數
│   └── language-context.tsx # 多語言上下文
├── prisma/                 # Prisma 配置
│   ├── schema.prisma       # 資料庫 Schema
│   └── seed.ts             # 種子資料
├── types/                  # TypeScript 類型定義
├── auth.ts                 # NextAuth 配置
├── tailwind.config.ts      # Tailwind 配置
└── vercel.json             # Vercel 部署配置
```

---

## 📜 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建構生產版本 |
| `npm run start` | 啟動生產伺服器 |
| `npm run lint` | ESLint 檢查 |
| `npx prisma generate` | 產生 Prisma Client |
| `npx prisma migrate dev` | 開發環境遷移 |
| `npx prisma migrate deploy` | 生產環境遷移 |
| `npx prisma studio` | 開啟視覺化資料庫管理工具 |
| `npm run db:seed` | 執行種子資料 |

---

## 👤 用戶角色

| 角色 | 權限 |
|------|------|
| **USER** | 建立報帳單、查看自己的報帳單 |
| **MANAGER** | USER 權限 + 審批報帳單 (第一層) |
| **FINANCE** | USER 權限 + 財務審批 (第二層) + 標記已付款 |
| **ADMIN** | 所有權限 + 用戶管理 |

---

## 🔒 安全性

- 密碼使用 `bcryptjs` 進行雜湊存儲
- 所有 Server Actions 驗證 Session
- 使用 Zod 進行輸入驗證
- JWT Token 認證策略
- 安全 HTTP Headers (X-Frame-Options, CSP 等)

---

## 📊 資料庫模型

```
User ──┬── ExpenseReport ──── ExpenseItem
       ├── ApprovalAction
       └── AuditLog

InventoryItem ──── InventoryTransaction
```

---

## 🌍 部署

### Vercel 部署

1. 連結 GitHub 倉庫到 Vercel
2. 設定環境變數 (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`)
3. 部署會自動執行 `prisma generate` 和 `next build`

### Supabase 設定

1. 建立新專案
2. 在 SQL Editor 執行 Prisma 遷移 SQL
3. 取得連線字串填入環境變數

---


