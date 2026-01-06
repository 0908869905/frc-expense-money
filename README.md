# FRC 6998 UNIPARDS 報帳系統

<p align="center">
  <img src="public/Gemini_Generated_Image_wkar2twkar2twkar.png" alt="FRC 6998 UNIPARDS Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>專為 FRC 機器人團隊設計的現代化費用報銷、智慧收據審核與財務管理系統</strong>
</p>

<p align="center">
  <a href="#-功能總覽">功能</a> •
  <a href="#-智慧審核-agent">AI 審核</a> •
  <a href="#-角色與權限">角色權限</a> •
  <a href="#-快速開始">快速開始</a> •
  <a href="#-技術規格">技術規格</a>
</p>

---

## ✨ 功能總覽

### 核心功能

| 功能 | 說明 | 可用角色 |
|------|------|---------| 
| 📝 **報帳單管理** | 建立、編輯、提交費用報銷申請 | 副組長以上 |
| 🤖 **智慧收據審核** | AI 自動辨識發票並比對金額、日期 | 全部 |
| ✅ **智慧審核流程** | 依提交者權限自動跳過審核層級 | 組長以上 |
| 💰 **組別預算管理** | 設定各組可用資金，超支即時警告 | 財務/管理員 |
| 💵 **資金記錄追蹤** | 記錄贊助、捐款，追蹤團隊財務餘額 | 財務/管理員 |
| 📦 **零件庫存系統** | 追蹤機器人零件進出、庫存與補貨提醒 | 機構組/財務/管理員 |
| 👥 **用戶與組別管理** | 管理團隊成員、角色、組別指派 | 管理員 |
| 🌐 **多語言支援** | 繁體中文 / English 切換 | 全部 |

---

## 🤖 智慧審核 Agent

### OCR 發票辨識

系統整合 **Google Cloud Vision API**，可自動從上傳的收據/發票中提取：

- 📅 **日期** - 支援西元、民國年格式
- 💲 **金額** - 自動識別總金額
- 🏪 **商家名稱** - 提取發票開立店家
- 🔢 **發票號碼** - 台灣統一發票格式（2 英文 + 8 數字）

### 智慧比對審核

| 審核項目 | 說明 | 嚴重程度 |
|---------|------|---------|
| 金額比對 | 收據金額 vs 報帳金額（容許 5% 或 $10 誤差） | 🔴 Error |
| 日期比對 | 收據日期 vs 報帳日期（容許 ±7 天） | 🟡 Warning |
| 發票重複 | 偵測是否已有相同發票號碼 | 🔴 Error |
| OCR 信心度 | 辨識品質低於 50% 時警告 | 🟡 Warning |

### 審核分數

每筆費用項目會獲得 0-100 的匹配分數：
- **100 分**：完全符合
- **85-99 分**：輕微差異（可接受）
- **60-84 分**：有警告需人工確認
- **0-59 分**：有錯誤需修正

---

## 🔄 智慧審核流程

系統會依據報帳單提交者的角色自動決定審核流程：

```
┌─────────────────────────────────────────────────────────────────┐
│  提交者角色        提交後狀態           說明                      │
├─────────────────────────────────────────────────────────────────┤
│  副組長            PENDING_MANAGER     → 組長審核 → 財務審核     │
│  組長              PENDING_FINANCE     → 財務審核（跳過組長審核）  │
│  財務 / 管理員      PAID               → 直接核准付款              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👤 角色與權限

### 角色階層

| 角色 | 中文名稱 | 權限說明 |
|------|---------|---------| 
| `USER` | 僅檢視 | 僅可查看儀表板，無法建立報帳單 |
| `VICE_LEADER` | 副組長 | 可建立報帳單、查看組別預算 |
| `LEADER` | 組長 | 副組長權限 + 審批報帳單（第一層）、提交時跳過組長審核 |
| `FINANCE` | 財務 | 財務審批 + 資金管理 + 組別預算設定 + 所有組預算可見 |
| `ADMIN` | 管理員 | 所有權限 + 用戶管理 + 系統設定 |

### 功能存取對照表

| 功能 | 僅檢視 | 副組長 | 組長 | 財務 | 管理員 |
|------|:-----:|:-----:|:----:|:----:|:-----:|
| 查看儀表板 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 建立報帳單 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 上傳收據 OCR 辨識 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 審批報帳單 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 查看組別預算 | ❌ | ⚡自己組 | ⚡自己組 | ✅全部 | ✅全部 |
| 編輯組別預算 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 資金記錄管理 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 庫存管理 | ❌ | ⚡機構組 | ⚡機構組 | ✅ | ✅ |
| 用戶管理 | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🏢 組別架構

團隊分為 6 個組別，每個組別有自己的預算額度：

| 代號 | 中文名稱 | 英文名稱 | 圖示 |
|------|---------|---------|------|
| `ELECTRICAL` | 電資組 | Electrical | ⚡ |
| `MECHANICAL` | 機構組 | Mechanical | ⚙️ |
| `DOCUMENTATION` | 文書組 | Documentation | 📝 |
| `PR` | 公關組 | PR | 📣 |
| `FINANCE` | 財管組 | Finance | 💰 |
| `DESIGN` | 意象組 | Design | 🎨 |

---

## 🚀 快速開始

### 環境需求

- Node.js 18+
- PostgreSQL 資料庫（推薦 [Supabase](https://supabase.com)）
- Google Cloud Vision API 金鑰（用於 OCR）
- npm 或 yarn

### 安裝步驟

```bash
# 1. 複製專案
git clone https://github.com/your-repo/frc-expense-system.git
cd frc-expense-system

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 填入資料庫連線和 API 金鑰

# 4. 產生 Prisma Client 並同步資料庫
npx prisma generate
npx prisma migrate deploy

# 5. 啟動開發伺服器
npm run dev
```

### 環境變數

```env
# 資料庫連線
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth 認證
AUTH_SECRET="使用 openssl rand -base64 32 產生"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Vision API（OCR 功能）
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建構生產版本 |
| `npm run start` | 啟動生產版本 |
| `npx prisma studio` | 開啟資料庫視覺化管理工具 |
| `npx prisma migrate dev` | 開發環境資料庫遷移 |
| `npx prisma generate` | 重新產生 Prisma Client |

---

## 📖 功能使用說明

### 報帳單建立流程

1. 點擊 `新增報帳單` 按鈕
2. 填寫標題與說明
3. 新增費用明細項目：
   - 選擇日期、類別
   - 填寫說明與金額
   - **上傳收據** → 點擊「✨擷取」自動 OCR 填入金額/日期
4. 點擊 `提交報帳單`
5. 系統自動執行收據審核並顯示匹配分數

### 審核狀態

| 狀態 | 中文 | 說明 |
|------|------|------|
| `DRAFT` | 草稿 | 尚未提交 |
| `PENDING_MANAGER` | 待組長審批 | 等待組長審核 |
| `PENDING_FINANCE` | 待財務審批 | 等待財務審核 |
| `RETURNED` | 退回修改 | 被退回需修改 |
| `PAID` | 已付款 | 審核通過已付款 |
| `REJECTED` | 已拒絕 | 審核被拒絕 |

---

## 🛠️ 技術規格

### 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| **框架** | Next.js (App Router) | 14.2.x |
| **語言** | TypeScript | 5.x |
| **資料庫 ORM** | Prisma | 5.22.x |
| **資料庫** | PostgreSQL | - |
| **認證** | NextAuth.js v5 | beta.15+ |
| **樣式** | TailwindCSS + tailwindcss-animate | 3.4.x |
| **UI 元件** | shadcn/ui 風格 (Radix UI) | - |
| **表單驗證** | Zod + React Hook Form | - |
| **圖表** | Recharts | 2.12.x |
| **OCR** | Google Cloud Vision API | - |
| **部署** | Vercel + Supabase | - |

### 專案結構

```
frc-expense-system/
├── app/                    # Next.js App Router
│   ├── actions/            # Server Actions
│   │   ├── approvals.ts    # 審核相關
│   │   ├── budget.ts       # 組別預算
│   │   ├── expenses.ts     # 報帳單
│   │   ├── funding.ts      # 資金記錄
│   │   ├── inventory.ts    # 庫存管理
│   │   ├── ocr.ts          # OCR 審核 Actions
│   │   └── users.ts        # 用戶管理
│   ├── api/                # API Routes
│   ├── dashboard/          # 儀表板頁面群
│   ├── terms/              # 服務條款
│   ├── privacy/            # 隱私政策
│   └── login/register/     # 認證頁面
├── components/             # React 元件
│   ├── ui/                 # 基礎 UI 元件 (shadcn/ui)
│   ├── expense-form.tsx    # 報帳單表單（含 OCR）
│   ├── audit-result-dialog.tsx  # 審核結果對話框
│   ├── receipt-audit-button.tsx # 收據審核按鈕
│   └── batch-audit-button.tsx   # 批次審核按鈕
├── lib/                    # 工具和配置
│   ├── agents/             # 🤖 AI Agent 模組
│   │   ├── ocr.ts          # OCR 發票辨識服務
│   │   ├── receipt-audit.ts # 智慧收據審核 Agent
│   │   └── index.ts        # 模組匯出
│   ├── prisma.ts           # Prisma Client 單例
│   ├── schemas.ts          # Zod 驗證 Schema
│   ├── money.ts            # 金額處理工具
│   ├── utils.ts            # 通用工具函數
│   └── language-context.tsx # 多語言上下文
├── prisma/                 # Prisma 配置
│   ├── schema.prisma       # 資料庫 Schema
│   └── seed.ts             # 種子資料
├── types/                  # TypeScript 類型定義
│   └── audit.ts            # 審核相關類型
└── auth.ts                 # NextAuth 配置
```

### 資料庫模型

| 模型 | 說明 |
|------|------|
| `User` | 用戶資料（含 role、department） |
| `ExpenseReport` | 報帳單主表 |
| `ExpenseItem` | 報帳單明細項目 |
| `ReceiptAudit` | 收據審核結果（OCR 資料、匹配分數） |
| `ApprovalAction` | 審核紀錄 |
| `AuditLog` | 操作審計日誌 |
| `DepartmentBudget` | 各組別預算設定 |
| `FundingRecord` | 資金記錄（贊助/捐款） |
| `InventoryItem` | 零件庫存 |
| `InventoryTransaction` | 零件異動紀錄 |

---

## 📄 授權

MIT License © 2024-2026 FRC 6998 UNIPARDS

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

<p align="center">
  Made with ❤️ by FRC 6998 UNIPARDS
</p>
