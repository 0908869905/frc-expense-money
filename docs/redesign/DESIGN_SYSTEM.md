# BudgetFlow 設計系統 v2 —「工程帳冊 / Shop Ledger」

> 2026-07-03 重設計定案。由 Fable 5 主導設計與實作。
> 目標：徹底去除 AI 生成感（電競 HUD 風），改為「FRC 車隊的精密工程帳冊」。

## 一、設計理念

FRC 6998 UNIPARDS 的真實世界是：機房、CNC、零件料號（REV-21-1650）、pit 區、安全眼鏡、賽季預算表。
這套系統應該像一份**精密的工程文件**——CAD 圖框、datasheet、機械師的量具：可信、精確、克制、耐用。

**一句話**：不是太空船的駕駛艙，是車隊工具牆上那本翻爛了的帳冊。

### 為什麼現況是「AI 味」
深藍底 + 青色漸層 glow + 玻璃擬態 + 滿版浮水印 + 漸層標題字 + sparkle emoji + 預設紫圖表 =
2024-25 年 AI 生成 dashboard 的標準指紋。每個元素都在「表演科技感」，沒有一個在服務「看清楚錢花到哪」。

### 用戶品味信號（來自其上一個專案的迭代記錄）
editorial 排版、非對稱、**減法美學**（主動移除粒子特效）、降低動態侵入感。

## 二、色彩系統

**策略：紙與墨 + 單一信號色。** 琥珀橘 = 豹的顏色 + 車間 safety orange，AI 幾乎從不選它。

### Light「圖紙」(engineering paper)
| Token | HSL | 用途 |
|---|---|---|
| `--background` | `45 30% 96%` | 溫暖紙白底 |
| `--card` | `0 0% 100%` | 卡片/表面 |
| `--foreground` | `220 25% 13%` | 墨色文字 |
| `--muted-foreground` | `220 10% 42%` | 次要文字 |
| `--border` | `220 14% 86%` | hairline 邊框 |
| `--input` | `220 14% 80%` | 輸入框邊框（比 border 深一級） |
| `--primary` | `24 90% 46%` | 琥珀橘（主按鈕/active/焦點） |
| `--primary-foreground` | `0 0% 100%` | |
| `--secondary` | `45 20% 92%` | 次要按鈕底 |
| `--muted` | `45 22% 93%` | 靜音底色 |
| `--accent` | `45 25% 90%` | hover 底色（中性，非青色！） |
| `--destructive` | `4 72% 44%` | 危險 |
| `--ring` | `24 90% 46%` | 焦點環 |
| `--radius` | `0.375rem` (6px) | 卡片圓角基準 |

語意狀態色（css vars，供狀態點/文字使用）：
- `--ok`: `152 45% 32%`（審核通過/已付款，苔綠非螢光綠）
- `--warn`: `40 85% 38%`（待審核，土黃）
- `--danger`: `4 72% 44%`（拒絕/刪除，磚紅）
- `--info`: `215 55% 42%`（一般資訊，鋼藍）

### Dark「石墨車間」(graphite shop)
不是深藍！是暖灰石墨，像 anodized 鋁件。
| Token | HSL |
|---|---|
| `--background` | `220 8% 9%` |
| `--card` | `220 7% 12%` |
| `--foreground` | `40 12% 92%` |
| `--muted-foreground` | `220 6% 62%` |
| `--border` | `220 6% 21%` |
| `--input` | `220 6% 26%` |
| `--primary` | `26 95% 55%`（暗底琥珀微亮） |
| `--primary-foreground` | `220 10% 8%` |
| `--secondary` | `220 6% 16%` |
| `--muted` | `220 6% 15%` |
| `--accent` | `220 6% 17%` |
| `--destructive` | `4 70% 52%` |
| `--ok`: `150 40% 48%`、`--warn`: `40 85% 55%`、`--danger`: `4 70% 55%`、`--info`: `212 55% 60%` |

### 禁令
- ❌ 任何 `linear-gradient` / `bg-gradient-*`（唯一例外：圖表面積圖淡出填色）
- ❌ 任何 glow（`box-shadow` 彩色、`text-shadow`）
- ❌ `backdrop-blur` 玻璃擬態
- ❌ 滿版浮水印（logo 只出現在側欄與登入頁，實際尺寸）
- ❌ 漸層文字（`bg-clip-text`）
- ❌ emoji 當圖標（一律 lucide；文字內容中的 emoji 移除或改 mono 前綴）
- ❌ 漸層捲軸（改中性細捲軸）

## 三、字體系統

| 用途 | 字體 | 備註 |
|---|---|---|
| UI 本文 | **IBM Plex Sans** + **Noto Sans TC** | 拉丁字母用 Plex（工程文件感），中文自動 fallback Noto |
| 數字/金額/日期/SKU/ID/狀態標籤 | **IBM Plex Mono** | 本設計的簽名動作：所有數據皆 mono + `tabular-nums` |
| 標題 | IBM Plex Sans 600/700，`tracking-tight` | 中文標題 Noto Sans TC 700 |

- 全部走 `next/font/google` 自託管（CSP `font-src 'self'` 限制）
- weights: Plex Sans [400,500,600,700]、Plex Mono [400,500,600]、Noto Sans TC [400,500,700]
- CSS 變數：`--font-sans`、`--font-mono`
- 金額格式：`$105,801` mono 呈現，負數 danger 色（不加 glow）

## 四、形狀與層次

- **radius**：按鈕/輸入框 4px（`rounded`)、卡片 6px（`rounded-md`）、狀態點圓形；**禁 rounded-2xl/3xl**
- **邊框分層**：用 1px hairline 分區，不用陰影。卡片 = `bg-card border border-border rounded-md`
- **陰影**：只允許 overlay（modal/dropdown/popover）用 `0 8px 24px rgb(0 0 0 / 0.12)`（dark: /0.5）
- **密度**：這是工具不是行銷頁。表格行高 ~40px、卡片 padding 16-20px、頁面最大寬度不設限（跟現況一致）

## 五、質感層（工程圖細節 — 個性的來源，克制使用）

1. **卡片標題列**：`11px` mono 大寫 `tracking-[0.08em]` muted 色，如 `FINANCIAL SUMMARY / 財務摘要`（中文為主標，mono 英文為輔助小標）
2. **章節索引**：頁面標題旁小 mono 註記（如 `01`），像 CAD 圖框的欄位編號 — 只用在 dashboard 首頁區塊
3. **狀態呈現**：4px 實心圓點 + mono 文字標籤（`● 已付款`），極淡語意底色可選；**不用**大色塊藥丸
4. **側欄 active**：左緣 2px 琥珀實線 + 文字變 primary（保留現有機制，去掉漸層底）
5. **表格**：thead = mono 11px 大寫 muted；行 hover = `--accent` 中性底；金額欄右對齊 mono
6. **大數字 stat**：IBM Plex Mono 600 大字 + 下方 12px 標籤；不加任何光暈
7. **豹 = 人味**：
   - loading-cat 影片素材保留用於載入場景
   - 豹爪頁面過渡：**保留機制**，重新上色（琥珀/石墨），**移除紫色 sparkle 粒子**
   - 登入 LoadingScreen 重造為「開機自檢 boot sequence」：mono 步驟清單 + 極簡進度 + 保留雙語趣味提示（去 emoji，改 `//` 前綴）
8. **Empty state**：lucide 線框圖標（20px，muted）+ 主文 + 主按鈕，乾淨置中；不放插畫

## 六、動效

- 一律 100–160ms `ease-out`，只變 color/border/opacity
- ❌ hover 位移（translateY）、hover 縮放、無限 pulse/glow 動畫
- NavigationProgressBar：保留，改為頂部 2px 琥珀實線
- 頁面內容不做進場 stagger（工具要快）

## 七、圖表（recharts，實作時遵循 dataviz skill）

- 主數據：琥珀 `hsl(24 90% 46%)`；次要：石墨 `hsl(220 10% 40%)`；其餘分類：鋼藍/苔綠/土黃/磚紅（去飽和工具色系）
- 網格：hairline 虛線、無外框；軸文字 mono 11px muted
- Tooltip：`bg-card border border-border rounded` mono 數字，無陰影漸層
- 徹底移除 recharts 預設紫 `#8884d8` / 綠 `#82ca9d`

## 八、不可變更（安全網）

1. 所有 route、server actions、表單欄位/驗證、按鈕行為、條件渲染邏輯
2. 所有中文/英文文案與 `t()` 雙語機制（僅移除裝飾性 emoji）
3. ThemeProvider（深淺切換）、LanguageProvider、OrganizationProvider 機制
4. Capacitor：`.capacitor-app` 樣式、safe-area padding、響應式斷點
5. `components/receipt-preview.tsx` 的 MIME 白名單、`expense-form.tsx` 的壓縮/大小限制邏輯
6. CSP 相容：字體僅 next/font 自託管
7. `org.bgColor` 從紫藍漸層改為 `bg-primary`（機制保留，值去漸層）

## 九、實作範圍（樣式核心 → 全域生效）

| 檔案 | 動作 |
|---|---|
| `app/globals.css` | 全面重寫（雙主題 token、base、移除全部科技風 @layer components） |
| `tailwind.config.ts` | 字體/語意色/radius 擴充；**保留** cat/accordion keyframes |
| `app/layout.tsx` | next/font 三字體 |
| `lib/ui-constants.ts` | 按鈕/輸入樣式常數重寫 |
| `lib/organization-context.tsx` | bgColor 去漸層 |
| `components/ui/*` | 逐一重整 |
| 各 page + content 元件 | 逐頁重整 class（邏輯/文案不動） |
