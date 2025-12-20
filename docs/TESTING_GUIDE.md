# 報帳系統功能測試指南

本文件說明如何親自測試所有新功能。

---

## 🚀 啟動專案

```bash
cd d:\frc報帳
npm run dev
```
開啟 http://localhost:3000

---

## Phase 1: 核心功能

### 1. CSV/Excel 匯出
1. 以 **Finance** 或 **Admin** 帳號登入
2. 前往 **所有報表** (`/dashboard/reports`)
3. 右上角點擊 **CSV** 或 **Excel** 按鈕
4. 檔案自動下載

### 2. 數據分析圖表
1. 以 Finance/Admin 登入
2. 側邊欄點擊 **數據分析** (`/dashboard/analytics`)
3. 查看月度趨勢圖、類別圓餅圖、狀態條形圖
4. 卡片顯示總報帳單、總金額等統計

### 3. 退回修改功能
1. 以 Manager 登入
2. 前往 **審核** (`/dashboard/approvals`)
3. 找到待審核報帳單
4. 點擊 **黃色旋轉箭頭** (退回修改)
5. 輸入退回原因
6. 報帳單狀態變為 `RETURNED`
7. 提交者收到通知

---

## Phase 2: UX 優化

### 4. 通知系統
1. 登入任意帳號
2. 右上角看到 **🔔 鈴鐺圖示**
3. 有通知時顯示紅色數字徽章
4. 點擊展開通知列表
5. 可標記已讀或刪除

### 5. UI 元件 (開發者使用)
```tsx
// 日期選擇器
import { DatePicker } from "@/components/ui/date-picker"
<DatePicker value={date} onChange={setDate} />

// 金額輸入 (自動千分位)
import { CurrencyInput } from "@/components/ui/currency-input"
<CurrencyInput value={amount} onChange={setAmount} />

// 動畫 Modal
import { Modal } from "@/components/ui/modal"
<Modal isOpen={open} onClose={() => setOpen(false)} title="標題">
  內容
</Modal>

// Loading 狀態
import { Spinner, LoadingButton, Skeleton } from "@/components/ui/loading"
```

---

## Phase 3: 可靠性

### 6. 離線偵測
1. 開啟 Chrome DevTools (F12)
2. Network → 勾選 **Offline**
3. 頁面底部出現黃色「離線」提示

### 7. 草稿自動儲存 (開發者整合)
```tsx
import { useAutoSave } from "@/hooks/useAutoSave"

const { save, showRestorePrompt, restore, dismiss } = useAutoSave({
  key: "my-form",
  onRestore: (data) => setFormData(data)
})

// 表單變更時
useEffect(() => { save(formData) }, [formData])
```

### 8. Sentry 錯誤監控
1. 在 Vercel 設定環境變數: `NEXT_PUBLIC_SENTRY_DSN`
2. 部署後，前端錯誤自動上報 Sentry

---

## Phase 4: 效能

### 9. ISR 統計頁面
1. 以 Admin/Finance 登入
2. 前往 `/dashboard/stats`
3. 頁面每 60 秒自動更新 (背景 revalidate)

### 10. Session 清理
- Vercel Cron 每天凌晨 4:00 自動呼叫
- 手動測試: `GET /api/cron/cleanup-sessions`
- 需設定 Header: `Authorization: Bearer <CRON_SECRET_KEY>`

---

## Phase 5: 進階功能

### 11. 預算管理 (Server Actions)
```typescript
import { createBudget, checkBudgetForExpense } from "@/app/actions/budgets"

// 建立預算
await createBudget({
  name: "Q1 行銷預算",
  amount: 100000,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-03-31")
})

// 檢查報帳是否超預算
const { warnings } = await checkBudgetForExpense("Travel", 5000)
console.log(warnings) // ["此支出後預算使用率將達 85%"]
```

### 12. 多幣別格式化
```typescript
import { formatCurrencyAmount, SUPPORTED_CURRENCIES } from "@/lib/currency"

formatCurrencyAmount(1234.56, "TWD")  // NT$1,235
formatCurrencyAmount(1234.56, "USD")  // $1,234.56
formatCurrencyAmount(1234.56, "JPY")  // ¥1,235
```

### 13. 組織管理 (多租戶)
```typescript
import { createOrganization, addOrganizationMember } from "@/app/actions/organizations"

// 建立組織 (需 Admin)
await createOrganization({
  name: "FRC Team 1234",
  slug: "frc-1234"
})

// 新增成員
await addOrganizationMember(orgId, userId, "MEMBER")
```

---

## 📋 快速測試清單

| 功能 | 測試路徑 | 需要角色 |
|------|----------|----------|
| CSV/Excel 匯出 | `/dashboard/reports` | Finance/Admin |
| 數據分析 | `/dashboard/analytics` | Finance/Admin |
| 退回修改 | `/dashboard/approvals` | Manager+ |
| 通知系統 | Header 鈴鐺 | 任意 |
| ISR 統計 | `/dashboard/stats` | Finance/Admin |
| 庫存管理 | `/dashboard/inventory` | 任意 |

---

## ⚠️ 部署前必做

1. 執行 Prisma migration SQL (見 walkthrough.md)
2. 設定環境變數:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `CRON_SECRET_KEY`
3. 在 Supabase 啟用每日備份
