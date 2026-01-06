# 🎨 Figma 設計提示詞 - FRC 報帳系統 UI 重設計

## 專案背景

| 項目 | 內容 |
|------|------|
| **產品名稱** | FRC 6998 UNIPARDS 報帳系統 |
| **產品類型** | 企業級財務管理 SaaS 儀表板 |
| **目標用戶** | FRC 機器人競賽團隊成員（副組長、組長、財務、管理員） |
| **現有技術** | Next.js 14 + TailwindCSS + shadcn/ui（Radix UI） |

---

## 📐 需要設計的頁面

| 頁面 | 路由 | 功能描述 |
|------|------|---------|
| **首頁/Landing** | `/` | 產品介紹、登入入口、功能亮點展示 |
| **登入頁** | `/login` | 帳號密碼登入表單 |
| **註冊頁** | `/register` | 新用戶註冊表單（姓名、Email、密碼、組別選擇） |
| **儀表板首頁** | `/dashboard` | 總覽卡片（餘額、待審批、本月支出）、快速操作 |
| **報帳單列表** | `/dashboard/expenses` | 表格列表、搜尋篩選、狀態標籤 |
| **新增/編輯報帳單** | `/dashboard/expenses/new` | 多步驟表單、收據上傳、OCR 擷取按鈕 |
| **報帳單詳情** | `/dashboard/expenses/[id]` | 完整資訊、審核歷程、審批按鈕 |
| **待審核列表** | `/dashboard/approvals` | 待組長/財務審批的報帳單 |
| **組別預算管理** | `/dashboard/budget` | 6 組預算卡片、進度條、編輯功能 |
| **資金記錄** | `/dashboard/funding` | 贊助/捐款列表、新增記錄表單 |
| **庫存管理** | `/dashboard/inventory` | 零件卡片/表格、庫存數量、補貨警示 |
| **用戶管理** | `/dashboard/users` | 成員列表、角色指派、組別分配 |
| **審計日誌** | `/dashboard/audit-logs` | 操作紀錄時間線 |
| **個人設定** | `/dashboard/settings` | 修改密碼、語言切換 |

---

## 🎨 視覺風格指引

```
設計風格：現代極簡企業風 + 科技感
主色調：深藍色 (#1E3A8A) 搭配亮橘色 (#F97316) 作為強調色
背景：淺灰漸層 (#F8FAFC → #F1F5F9) 或深色模式 (#0F172A → #1E293B)
圓角：中等圓角 (8-12px)
陰影：柔和投影，呈現卡片層次
字體：Noto Sans TC（繁中）+ Inter（英數）
圖示風格：Lucide Icons 或類似的線條風格
動畫：微互動（hover 縮放、loading 骨架屏）
```

---

## 🧱 核心元件清單

### 基礎元件
- Button（Primary / Secondary / Outline / Ghost / Destructive）
- Input / Textarea / Select / Checkbox / Radio
- Card / CardHeader / CardContent / CardFooter
- Dialog / AlertDialog / Sheet（側邊抽屜）
- Table / DataTable（含排序、篩選、分頁）
- Badge（狀態標籤：草稿/待審/已付款/退回/拒絕）
- Avatar / AvatarGroup
- Tabs / Accordion
- Toast / Notification
- Dropdown Menu / Context Menu
- Progress Bar（預算使用百分比）
- Skeleton（載入中骨架屏）

### 業務元件
- **統計卡片**：金額 + 變化趨勢箭頭
- **報帳單卡片**：標題、金額、狀態、日期、提交者頭像
- **收據預覽卡片**：縮圖 + OCR 結果 + 匹配分數圓環
- **審核結果對話框**：分數儀表盤 + 比對明細 + 警告/錯誤列表
- **審批流程時間線**：垂直步驟條
- **組別預算卡片**：組別圖示 + 預算 + 已使用 + 進度條
- **庫存項目卡片**：零件圖 + 數量 + 低庫存警示

---

## 📱 響應式規格

| 斷點 | 寬度 | 佈局 |
|------|------|------|
| Desktop | ≥1280px | 側邊導覽 (240px) + 主內容區 |
| Tablet | 768-1279px | 可收合側邊導覽 + 自適應卡片網格 |
| Mobile | <768px | 底部導覽 + 單欄佈局 |

---

## 🌓 深色/淺色模式

- 對比度符合 WCAG AA 標準
- 深色模式使用深灰而非純黑 (#0F172A)
- 強調色在兩種模式下保持一致

---

## 🏷️ 狀態標籤配色

| 狀態 | 中文 | 淺色模式 | 深色模式 |
|------|------|---------|---------|
| `DRAFT` | 草稿 | 灰底灰字 | 深灰底淺灰字 |
| `PENDING_MANAGER` | 待組長審批 | 黃底深黃字 | 深黃底亮黃字 |
| `PENDING_FINANCE` | 待財務審批 | 藍底深藍字 | 深藍底亮藍字 |
| `RETURNED` | 退回修改 | 橘底深橘字 | 深橘底亮橘字 |
| `PAID` | 已付款 | 綠底深綠字 | 深綠底亮綠字 |
| `REJECTED` | 已拒絕 | 紅底深紅字 | 深紅底亮紅字 |

---

## 🤖 AI 功能視覺呈現

### OCR 擷取按鈕
- 帶有 ✨ 閃爍動畫的「智慧擷取」按鈕
- 處理中顯示 AI 風格的載入動畫（脈衝光環）

### 審核結果儀表盤
- 0-100 分圓環進度條（綠/黃/紅漸變）
- 比對項目列表（✓ 符合 / ⚠ 警告 / ✗ 錯誤）
- 信心度指示器

---

## 📊 圖表需求

- 月度支出趨勢折線圖
- 各組支出佔比圓餅圖
- 預算使用堆疊長條圖
- 審核狀態分布環形圖

---

## 🧩 額外設計元素

| 元素 | 說明 |
|------|------|
| **Empty State** | 列表為空時的插圖和引導文字 |
| **Error State** | 404、500 錯誤頁面 |
| **Onboarding** | 首次使用引導流程（可選） |
| **Logo 使用** | 現有 Logo 為圓形隊徽，需設計系統內的品牌呈現 |

---

## 📦 交付格式

### 1. Figma 設計稿
- 包含所有頁面的 Desktop / Tablet / Mobile 三種尺寸
- 元件庫（Component Library）獨立頁面
- 設計系統頁面（顏色、字體、間距、圓角規範）

### 2. 命名規範
```
頁面：Page / [頁面名稱] / [斷點]
元件：Component / [類別] / [元件名稱] / [狀態]
```

### 3. 開發交接
- 標註好間距、字級、顏色變數
- 提供 TailwindCSS 相容的 Design Token（可選）

---

## 🔗 參考資源

| 資源 | 連結 | 說明 |
|------|------|------|
| shadcn/ui | https://ui.shadcn.com | 目前使用的元件風格 |
| Radix UI | https://www.radix-ui.com | 底層元件庫 |
| Lucide Icons | https://lucide.dev | 建議圖示庫 |

---

## 🏢 組別架構

| 代號 | 中文名稱 | 英文名稱 | 圖示 |
|------|---------|---------|------|
| `ELECTRICAL` | 電資組 | Electrical | ⚡ |
| `MECHANICAL` | 機構組 | Mechanical | ⚙️ |
| `DOCUMENTATION` | 文書組 | Documentation | 📝 |
| `PR` | 公關組 | PR | 📣 |
| `FINANCE` | 財管組 | Finance | 💰 |
| `DESIGN` | 意象組 | Design | 🎨 |

---

## 👤 角色與權限

| 角色 | 中文名稱 | 權限說明 |
|------|---------|---------| 
| `USER` | 僅檢視 | 僅可查看儀表板，無法建立報帳單 |
| `VICE_LEADER` | 副組長 | 可建立報帳單、查看組別預算 |
| `LEADER` | 組長 | 副組長權限 + 審批報帳單（第一層） |
| `FINANCE` | 財務 | 財務審批 + 資金管理 + 組別預算設定 |
| `ADMIN` | 管理員 | 所有權限 + 用戶管理 + 系統設定 |
