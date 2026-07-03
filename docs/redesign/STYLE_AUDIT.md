# 現有樣式基礎設施與視覺模式審計報告

> 審計範圍：`tailwind.config.ts`、`app/globals.css`、`app/layout.tsx`、`lib/ui-constants.ts`、`components/ui/*`、`postcss.config.js`，以及 `app/`、`components/` 全專案的視覺模式 grep 統計。
> 本報告**不修改任何程式碼**，僅供重設計（redesign/ui-v2）規劃使用。

---

## 0. 一句話結論

這個專案裡其實疊了 **三套互不相干的視覺語言**：

1. **Dashboard／後台**：shadcn/ui 預設樣板（未改動的 CSS variables 架構）之上，疊加了一層「科技感／玻璃態／發光」主題（sky-blue 199° → teal 173°），而且這層主題**幾乎不是靠元件的 Tailwind class 做的，是靠 `app/globals.css` 裡對 `h1`、`.text-2xl`、`.text-3xl`、`.text-green-600`、`.bg-primary`、`input/select/textarea`、`.rounded-xl.border`、`[data-sidebar]` 等「原生元素選擇器 / 組合 class / data 屬性」的全域劫持**做的。
2. **行銷／登入頁**（`/`、`/login`、`/register`、載入動畫、頁面轉場）：黑底 + 紫／藍／粉／青「宇宙漸層光暈」通用 AI SaaS 風格，5 個檔案裡幾乎逐字複製貼上同一段裝飾用 markup。
3. **`/about`**：黑底雜誌編輯風格（Playfair Display 襯線字、mix-blend-difference、噪點紋理），跟前兩者完全不共用 token，甚至另外載入了一組字型。

**這代表：重設計不能只是「換元件的 className」**。globals.css 裡的全域選擇器目前決定了大部分視覺效果，元件檔案裡的 Tailwind class 有相當比例其實是「寫了但被 CSS 蓋掉」的裝飾。任何重設計都必須把 globals.css 的劫持規則和元件本身一起處理，否則舊的發光/漸層會透過 class 名稱巧合「借屍還魂」。

---

## 1. 現有設計 Token 總表

### 1.1 色彩（`app/globals.css` CSS variables，HSL 格式）

架構本身是**未經結構性修改的 shadcn/ui 預設樣板**（`border/input/ring/background/foreground/primary(-foreground)/secondary(-foreground)/destructive(-foreground)/muted(-foreground)/accent(-foreground)/popover(-foreground)/card(-foreground)` 這組變數命名、`tailwind.config.ts` 裡對應的 `colors` 映射、`borderRadius: lg/md/sm → var(--radius)` 全部是 shadcn init 的原始輸出），只有 HSL **數值**被換成了品牌色，並在後面追加了一層科技特效變數。

| Token | 深色（預設，`:root, .dark`） | 淺色（`.light`） |
|---|---|---|
| `--background` | `222 47% 11%` | `210 40% 98%` |
| `--foreground` | `210 40% 98%` | `222 47% 11%` |
| `--card` | `222 47% 14%` | `0 0% 100%` |
| `--primary` | `199 89% 48%`（sky blue） | `199 89% 42%` |
| `--secondary` / `--muted` | `217 33% 17%` | `210 40% 96%` / `210 40% 94%` |
| `--accent` | `173 80% 40%`（teal） | `173 80% 35%` |
| `--destructive` | `0 63% 31%` | `0 72% 51%` |
| `--border` | `217 33% 25%` | `214 32% 91%` |
| `--radius` | `0.75rem`（兩主題共用） | 同左 |

追加的「科技特效」變數（無 shadcn 對應，純自訂）：`--glow-primary`、`--glow-accent`、`--gradient-start/end`（=primary→accent）、`--card-glass`、`--card-glass-border`、`--card-glass-hover`。這組變數只在 `app/globals.css` 內部使用，元件層完全沒有直接引用。

**行銷頁另一套色彩**（未進入變數系統，全是寫死的 Tailwind 色階字面值）：`purple-400/500/600`、`blue-400/500/600`、`cyan-400/500`、`pink-400/500`、`emerald-400/500`，背景固定 `bg-black` / `text-white` / `text-gray-400/500/600`，完全不理會 `--background`/`--foreground` token。

**Recharts 圖表色彩**（`components/analytics-content.tsx:33`）：
```ts
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F", "#FFBB28"]
```
這是 **Recharts 官方文件範例的預設色盤**（幾乎所有 Recharts tutorial 都用這組色），從未替換成專案自己的 sky/teal 色系 — 是全專案最明顯的「複製官方範例、忘記改」證據之一。另外 `stroke="#8884d8"` / `fill="#82ca9d"` 等還在 3 處繞過 `COLORS` 陣列直接寫死。

### 1.2 字體

- 全域：`next/font/google` 的 `Inter`（`app/layout.tsx:12`），CSS variable `--font-sans`，套用於 `<body>`。
- Fallback chain（`app/globals.css:88`）：`var(--font-sans), "LXGW WenKai", "Noto Sans TC", sans-serif` — Inter 無中文字形，這條 fallback 是中文顯示品質的關�键。
- `font-feature-settings: "rlig" 1, "calt" 1`（連字/上下文替代字）。
- **`app/about/page.tsx:7,11`** 另外載入 `Playfair_Display`（襯線，400/900）+ 又載入一次 `Inter`（300/400/500，與全域那次不同 weight），定義了全域沒人用的 `--font-serif`。這是第二套獨立字體系統，只服務這一頁。

### 1.3 圓角（border-radius）

- Token 層（`tailwind.config.ts`）：`--radius: 0.75rem` → `rounded-lg`=12px、`rounded-md`=10px、`rounded-sm`=8px。這是**唯一**真正吃 CSS 變數、換主題會跟著變的圓角尺度。`components/ui/Card.tsx` 是少數老實用 `rounded-lg` 的元件。
- 但實際上專案裡壓倒性多數用的是 **Tailwind 原生固定尺度** `rounded-xl`(12px)/`rounded-2xl`(16px)/`rounded-3xl`(24px)/`rounded-full`：`app/` 內 38 處（register 12、login 12、page.tsx 6、about 2、stats 1、inventory/scan 1，另 globals.css 內 4 處），`components/` 內數十處（`transition-button.tsx` 單檔 20 處，多為裝飾用光暈圓球）。
  - **注意**：`rounded-xl`＝12px 目前「碰巧」和 `rounded-lg`（=var(--radius)=12px）視覺相同，但兩者不是同一個 token——未來如果只改 `--radius`，所有寫死的 `rounded-xl/2xl/3xl` 不會跟著變。
- `.bento-card` / `.bento-card-mini`（`app/globals.css:332,355`）又額外寫死 `border-radius: 1rem`，第三種數值來源，同樣不吃 `--radius`。
- 結論：圓角「token」存在，但被大量繞過（Tailwind 固定尺度 + CSS 字面值各用各的），沒有單一事實來源。

### 1.4 陰影

兩套並存、有時互相打架：

1. **Tailwind 標準陰影** `shadow-sm ~ shadow-2xl`：`components/` 15 檔 26 處、`app/` 額外數處（Modal `shadow-2xl`、Sidebar mobile panel `shadow-lg`、按鈕 `shadow-lg shadow-white/10`）。
2. **自訂發光陰影**（純 CSS，rgba 寫死 sky-blue `14,165,233`／紫 `168,85,247` 等）：`.card`/`.bento-card` 的多層 `box-shadow`（外擴光暈 + inset 高光）、`.bg-primary` 的按鈕發光、`.neon-border`、`.glow-animation`/`.border-glow-animation`、`.status-indicator` 系列、`.tech-number`/`.text-2xl`/`.text-3xl` 的 `text-shadow`。

---

## 2. AI 味 Offender 清單（file:line + class 字串）

### 2.1【全域】globals.css 對 Tailwind utility 的「劫持」— 最需要優先處理

這些選擇器不是新增元件 class，而是**重新定義了 Tailwind 原生 utility class 或原生元素**的意義，任何頁面只要用到對應 class/元素就會被動套上科技風，且大多帶 `!important`：

| 選擇器 | 位置 | 效果 |
|---|---|---|
| `h1 { background: linear-gradient(...); -webkit-background-clip: text; }` | `globals.css:613-618` | **全站每一個 `<h1>` 都被強制套上漸層文字**（白→sky blue），包含「儀表板」「系統統計」「服務條款」這類完全不該有漸層標題的地方 |
| `.text-2xl, .text-3xl { text-shadow: 0 0 20px rgba(14,165,233,.3) }` | `globals.css:584-587` | 全站任何用到 Tailwind `text-2xl`/`text-3xl` 的文字（不管是不是金額/標題）都會被加上藍色發光陰影 |
| `.text-green-600 { color: ... !important; text-shadow: ... }` / `.text-red-600 {...}` | `globals.css:621-630` | 全站任何 `text-green-600`/`text-red-600`（原本只是普通金額正負色）都被 `!important` 覆蓋成帶光暈的自訂綠/紅 |
| `input, select, textarea { background:...!important; border:...!important }` + `:focus{box-shadow:...!important}` | `globals.css:162-176`（深色）、`238-253`（淺色） | **蓋掉 `components/ui/input.tsx`／`form-field.tsx` 自己寫的 `bg-background`／focus ring** — 現在輸入框長相其實是這裡決定的，不是元件的 className |
| `.card, .rounded-xl.border { background: gradient; backdrop-filter: blur(12px); box-shadow: 多層發光 }` | `globals.css:137-159` | 用「同時有 `rounded-xl` 又有 `border` 這兩個 class」這種**巧合式複合選擇器**去套玻璃態卡片樣式，非常脆弱、非顯式 |
| `.bg-primary { background: linear-gradient(...); box-shadow:... }` | `globals.css:290-303` | 劫持 Tailwind `bg-primary`，任何用這個 class 的元素（不只按鈕）都變成漸層+發光 |
| `.bg-primary\/10, .bg-muted { background:...!important; border:... }` | `globals.css:311-321` | 同上，劫持透明度變體 class |
| `thead {...}` / `tbody tr:hover {...}` | `globals.css:179-193` | 表格樣式來自原生元素選擇器，不是 `table.tsx` 元件自己的 class |
| `[data-sidebar="sidebar"]`, `[data-sidebar="menu-button"]:hover` | `globals.css:196-208` | Sidebar 視覺靠 `sidebar.tsx` 元件輸出的 `data-sidebar` 屬性被外部 CSS 選中，樣式定義權在元件檔案之外 |

### 2.2 行銷／登入頁「宇宙漸層光暈」模板（5 檔近乎逐字複製）

- `app/page.tsx:44-51,66,71,84-86`
- `app/login/page.tsx:156-163,169,174,182-184,196,211-212`
- `app/register/page.tsx:306-313,322,327,335-337,349,364-365`
- `components/loading/loading-screen.tsx:184-193,259,270,316,321,371`
- `components/transitions/transition-button.tsx:292-293,303,308,316-318,330,346-347,412-413,434,439,452,454`

典型模式（在上述 5 檔重複出現）：
```tsx
<div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/40 via-blue-600/30 to-cyan-500/20 blur-3xl animate-pulse" />
<div className="absolute inset-[100px] rounded-full bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-transparent blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
...
<span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
```
這是教科書等級的「通用 AI 生成 SaaS Landing Page」寫法：模糊漸層光球 + `animate-pulse` + 漸層文字裁切 + `blur-3xl`。而且**同一份 markup 在 5 個檔案裡幾乎字元對字元重複**（login 頁的左側視覺、transition-button 的過場畫面、page.tsx 首頁背景幾乎一樣），是重構／抽共用元件的明顯候選，也是視覺上最該砍掉重練的部份。

### 2.3 過度工程化的裝飾動畫

- `components/transitions/transition-button.tsx`（整檔 641 行）：一個「進入系統」按鈕的頁面轉場，做了「豹爪撕裂螢幕」特效——手刻鋸齒多邊形路徑生成（`generateJaggedDiagonalPath`/`generateJaggedOffset`）、SVG 發光濾鏡＋動畫漸層（`tear-glow-filter`、`tear-edge-gradient`、`electric-gradient`）、25 顆撕裂粒子＋15 顆閃光粒子的物理動畫。對應功能只是「導到 `/login`」，實作複雜度與其目的完全不成比例，是最典型的「Claude/AI 被要求做個轉場，結果做過頭」案例。
- `components/loading/loading-screen.tsx`：480 行的登入載入動畫，含 30 顆隨機粒子系統、8 條「電路線」動畫、字母逐一浮現、`<style jsx>` 內另外定義 7 組 keyframes（`float-particle`/`circuit-extend`/`node-appear`/`logo-glow`/`pulse-glow`/`shimmer`）。其中 `shimmer` 這個 keyframe 名稱**跟 `tailwind.config.ts` 裡已經定義的 `shimmer` 動畫撞名**（各自獨立，互不影響，但容易讓人以為在共用）。
- **趣味小知識輪播**（`loading-screen.tsx:19-33`）：`"💡 你知道嗎？FRC 6998 UNIPARDS 來自台灣！"` 這類 emoji 開頭的「Fun Fact」文案，是典型 AI 聊天機器人式的填充內容，出現在一個「登入中」畫面裡略顯突兀。

### 2.4 Emoji 當圖示，且與 lucide-react 並存不一致

專案裡 **40 個檔案已經在用 `lucide-react`** 作為主要圖示系統，但下列 6 個檔案仍用 emoji 字元做語意圖示，造成同一個系統裡兩套圖示語言並存：

- `components/department-budget-content.tsx:22-27`、`components/reports-content.tsx:65-70`、`components/users-content.tsx:63-82`：**同一份「部門 → emoji」對照表被獨立複製了 3 次**（⚡機構、⚙️機構、📝文書、📣公關、💰財管、🎨意象、👨🏫導師），沒有共用常數，也沒有改用 lucide 圖示。
- `components/qr-scanner.tsx:20,32`：`"🔍 掃描中..."` / `"🔍 Scanning..."` — 狀態文字前綴 emoji，而不是用旁邊的 lucide `<Search>` 之類圖示元件。
- `components/audit-result-dialog.tsx:117`：`{result.isValid ? "✅ 審核通過" : "❌ 審核未通過"}` — 同一個檔案理論上可以直接用 lucide `CheckCircle2`/`XCircle`（專案別處大量使用這兩顆圖示），這裡卻退回 emoji 字元。

### 2.5 色彩使用統計（Tailwind 色階，`bg-`/`text-` 前綴，*不含* CSS 變數 token 色）

- `bg-{indigo,violet,purple,blue,pink,sky,cyan,emerald,teal,fuchsia,rose}-N`：41 處／14 檔，**purple + blue + cyan + pink** 幾乎全部集中在 2.2 節提到的行銷頁/載入/轉場 5 檔，是最大宗色彩來源。
- `text-{...}-N`：28 處／11 檔，同樣以 login/register/loading-screen 的 `text-purple-200/400`、`text-gray-400/500/600` 為主。
- `emerald`（成功/收入語意）與 `amber`（待處理語意）在 dashboard 系元件（`dashboard-content.tsx`、`badge.tsx` 的 `success` variant）裡算是有語意一致性的用法，不算 AI 味，可保留語意但建議重新對應到新色板。

### 2.6 品牌識別檔名洩漏 AI 生成痕跡

- `public/Gemini_Generated_Image_wkar2twkar2twkar.png` 被用作：`app/layout.tsx:25-27` 的 favicon／apple-touch-icon／`html::after` 全站浮水印背景（`app/globals.css:111`）。檔名 `Gemini_Generated_Image_...` 直接暴露這是 AI 生圖工具的預設輸出檔名、從未重新命名，且是目前**唯一的品牌識別圖像**（logo/icon 全站唯一來源）。

---

## 3. 必須保留的技術約束清單（共 19 項，附程式碼引用）

> 這些不是「AI 味」問題，是重設計時**不能因為不知道而不小心弄壞**的既有行為契約。逐項附引用，方便實作時對照。

1. **Capacitor 文字選取封鎖**（`app/globals.css:753-767`）
   ```css
   .capacitor-app {
     -webkit-user-select: none; user-select: none;
     -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;
     overscroll-behavior-y: contain;
   }
   .capacitor-app input, .capacitor-app textarea, .capacitor-app [contenteditable="true"] {
     -webkit-user-select: text; user-select: text;
   }
   ```
   **重要發現**：全專案 grep 不到任何 `classList.add("capacitor-app")` 或等效程式碼——這個 class 目前**沒有被任何 web 端程式碼實際掛到 DOM 上**（`lib/capacitor.ts` 只有 `isNativeApp()`/`isIOSApp()`/`isWebBrowser()` 偵測函式，沒有套 class 的邏輯）。依 `CLAUDE.md` 的 iOS App Status，Phase 3-7（Xcode 設定/原生功能）都還是 TODO，這組樣式應是預留給未來原生整合用。**重設計時規則與 class 名稱本身要保留**，但不必假設它「現在有作用」。

2. **Safe Area padding**（`app/globals.css:746-751`），對 `body` 無條件套用（非 scoped 在 `.capacitor-app` 底下）：
   ```css
   body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
   ```
   桌面瀏覽器 `env()` 解析為 0，無害；iPhone 瀏海/動態島必須靠這個。

3. **`viewport.viewportFit: "cover"`**（`app/layout.tsx:14-19`）與第 2 項成對——沒有這個設定，第 2 項的 `env(safe-area-inset-*)` 在有瀏海的裝置上會直接解析成 0，safe-area 樣式形同虛設。改版時兩者要一起檢查。

4. **`appleWebApp.statusBarStyle: "black-translucent"`**（`app/layout.tsx:31`）與第 2 項的 `padding-top` 是配套設計（透明狀態列疊在內容上）。若重設計把頂部 header 換成不透明淺色底，**必須連動重新評估**這個設定，否則 iOS 狀態列圖示（電量/訊號，白色）會疊在淺色背景上看不清楚——這是需要主動決策的項目，不是可以直接照抄的。

5. **雙 class 深色模式架構**（非 Tailwind 預設 `dark:` 慣例）：`lib/theme-context.tsx` 把 `"light"` 或 `"dark"` class 加到 `document.documentElement`（預設 `"dark"`，讀寫 `localStorage.getItem("theme")`），`app/globals.css` 用 `:root, .dark {...}` vs `.light {...}` 兩組 CSS variable 區塊切換顏色。`tailwind.config.ts` 的 `darkMode: "class"` 與此相容（吃 `.dark` 是否存在），但只有 5 個檔案（`dashboard-content.tsx`、`app/dashboard/columns.tsx`、`balance-card.tsx`、`audit-result-dialog.tsx`、`batch-audit-button.tsx`）直接寫 Tailwind `dark:` utility，其餘元件的深淺色切換全靠 CSS variable 自動換值。**重設計若要換成單純 Tailwind `dark:` 慣例或 `next-themes`，是一次架構級遷移，不能假設現有元件會自動相容。**

6. **FOUC（無樣式閃爍）防護**：`body` 有寫死的深色漸層背景 fallback（`globals.css:92-94`，註解明寫「確保在 JS 載入前也有正確樣式」），因為主題是在 `useEffect`（JS 執行後、首次繪製後）才加上 class，且 `app/layout.tsx:42` 的 `<html suppressHydrationWarning>` 也是配合這個機制。**拿掉這個寫死 fallback 會重新出現「先閃深色再套淺色」的問題**，除非改用 script-in-head 的 no-flash 方案。

7. **全站 Logo 浮水印堆疊結構**（`globals.css:101-129`）：`html::after` 固定滿版背景圖（`opacity: 0.15` 深色 / `0.06` 淺色，`z-index: 0`），配套 `body > * { position: relative; z-index: 1 }` 把所有內容強制墊高一層。**這兩條規則是綁定的一組**——如果重設計要換浮水印或拿掉，必須同時處理 `body > *` 這個全域 z-index 提升規則，否則之後如果只刪 `html::after` 而忘記這條，不會壞；但如果只改 `html::after` 忘記檢查 `body > *`，可能誤以為浮水印邏輯已改完整。另外浮水印圖檔 `Gemini_Generated_Image_wkar2twkar2twkar.png` 同時是 favicon/apple-icon（見 2.6 節），三個用途共用同一張圖，換圖時要三處一起換。

8. **Webkit 捲軸自訂樣式**（`globals.css:493-523`），僅 `::-webkit-scrollbar*`，**沒有 Firefox 的 `scrollbar-color`/`scrollbar-width` fallback**。深淺色各一份漸層 thumb。重設計若要保留自訂捲軸觀感，建議順手補上 Firefox fallback；若決定拿掉，是刻意決定而非遺漏。

9. **View Transitions API 覆寫**（`globals.css:687-698`）：
   ```css
   ::view-transition-old(root) { animation: none; }
   ::view-transition-new(root) { animation: none; }
   ::view-transition-group(root) { animation-duration: 0s; }
   ```
   這是為了讓瀏覽器原生的 root cross-fade 不要跟 `transition-button.tsx` 的豹爪撕裂特效打架。**這三條規則和 `.duration-600`/`.ease-tear`（`globals.css:701-708`）是綁在 transition-button.tsx 存在這件事上的**——如果重設計拿掉豹爪轉場動畫，這幾條規則應該一併檢視是否還需要。

10. **Recharts 只有一個消費者**：`components/analytics-content.tsx`，全部走 `<ResponsiveContainer>`，沒有寫死像素寬度，換色板對版面沒有結構性風險。但 `fill`/`stroke` prop 目前吃的是**字面 hex 字串**，不是 `hsl(var(--x))` 這種 CSS variable 參照——重新配色時建議仍以 resolved hex/hsl 字面值傳入（不要假設 CSS variable 在 SVG 屬性裡一定能正確解析），並統一都走 `COLORS` 陣列（目前有 3 處繞過陣列直接寫死 `#8884d8`/`#82ca9d`）。

11. **`react-day-picker` 主題契約**：`components/ui/date-picker.tsx:11` 引入第三方基礎樣式 `react-day-picker/dist/style.css`，再用一大包 `classNames={{...}}`（`months/month/caption/nav_button/day/day_selected/day_today/...`）把它接到 `bg-primary`/`text-muted-foreground`/`bg-accent` 等專案 token 上。**重設計必須保留這個 `classNames` 映射的「形狀」（DayPicker 要求的 key 名稱）**，不能整包刪掉改成別的寫法，除非同時決定換整個日期選擇元件庫。

12. **CJK 字型 fallback chain**：`"LXGW WenKai", "Noto Sans TC", sans-serif` 接在 `var(--font-sans)`（Inter）後面（`globals.css:88`）。Inter 沒有中文字形，這條 fallback 決定了全站中文顯示品質，換字型時必須連帶決定新的 CJK fallback，不能只換西文字體了事。

13. **`font-feature-settings: "rlig" 1, "calt" 1`**（`globals.css:89`）——連字設定，體感很小但屬於既有排版基準的一部分。

14. **Radix primitives 已是既定依賴**：`@radix-ui/react-label`（`label.tsx`）、`@radix-ui/react-slot`（`sidebar.tsx` 的 `asChild` 模式）。新增互動元件（dropdown/popover/dialog 等）建議延續 Radix，不要另外引入第二套 headless UI library，避免 bundle 重複與行為不一致。

15. **`tailwindcss-animate` plugin**（`tailwind.config.ts:2,99`）——驅動 `animate-in`/`slide-in-from-*`/`fade-in-0` 這些 utility class，實際用在 `sidebar.tsx` 手機版遮罩（`animate-in fade-in-0`）、`error-boundary.tsx` 的 toast（`animate-in slide-in-from-bottom-4`）、`form-field.tsx` 的錯誤訊息（`animate-in slide-in-from-top-1`）。這個 plugin 若移除，上述 class 會直接失效（不會報錯，動畫默默消失）。

16. **Sidebar 的樣式定義權部分在元件外部**：`globals.css` 用 `[data-sidebar="sidebar"]` 和 `[data-sidebar="menu-button"]:hover` 屬性選擇器接管背景/hover樣式，對應 `components/ui/sidebar.tsx` 元件輸出的 `data-sidebar="sidebar"`（line 226）、`data-sidebar="menu-button"`（line 387）屬性。改 Sidebar 視覺不能只改元件檔案的 className，要嘛同步改 globals.css 的屬性選擇器規則，要嘛把樣式邏輯搬回元件內部（建議後者，一併解決 2.1 節「樣式定義權在外部」的問題）。

17. **Sidebar 手機判斷斷點寫死在 JS**：`components/ui/sidebar.tsx:80` 用 `window.innerWidth < 768` 手動判斷手機版，這個 `768` 是 Tailwind 預設 `md` 斷點的魔術數字複製，沒有引用 Tailwind config。若之後改動 Tailwind 斷點設定，這裡不會自動同步，需要手動對齊。

18. **`CurrencyInput` 的 padding 與貨幣符號寬度耦合**：`components/ui/currency-input.tsx:52-54,63` 用絕對定位的 `NT$` 符號 + 固定 `pl-12` 左內距對齊，改動輸入框高度/字級時要重新核對這個 offset，否則符號會蓋到數字。

19. **`lib/ui-constants.ts` 匯出的字串常數是多處呼叫端共用**（`BUTTON_PRIMARY`/`BUTTON_MUTED`/`BUTTON_DESTRUCTIVE`(_SM)/`INPUT_CLASS`）。`CLAUDE.md` 裡也記載了 `lib/ui-constants.ts` 的 `BUTTON_STYLES` 用法慣例。重設計若要換掉這些字串內容，因為是被 import 的共用常數而非重複貼上的字串，理論上改動點集中、風險較低，但要先 grep 出所有 import 這幾個常數的呼叫端再動，避免只改了定義卻漏改某些直接寫死同款 class 字串（未經由常數）的角落。

---

## 4. 重設計建議的檔案改動範圍

### 4.1 樣式核心檔案（動了會全域生效，優先且需整體規劃）

| 檔案 | 為什麼是核心 |
|---|---|
| `app/globals.css` | 全站視覺身份的實際決定者（見第 2.1 節），比元件檔案本身影響更大；重設計此檔案幾乎等於重寫整個「科技感」語言，且要小心第 3 節列出的 9 項耦合行為（safe-area／FOUC／浮水印堆疊／View Transitions／捲軸／深色模式）不要被連坐刪掉 |
| `tailwind.config.ts` | Token 層（顏色映射、radius 尺度、keyframes/animation）。`cat-body`/`cat-shadow` 這兩組 keyframe 目前**全專案查無任何 `animate-cat-body`/`animate-cat-shadow` 或等效 inline style 使用**，疑似孤兒程式碼（也可能是先前 CSS 版走路貓動畫被 `loading-cat-v2.webm` 影片取代後的殘留），建議重設計時確認後一併清理 |
| `lib/theme-context.tsx` | 深色模式機制的唯一事實來源，`useTheme()` 的介面（`{theme, toggleTheme}`）被 `DashboardHeader` 等消費，介面要維持相容或全面遷移 |
| `lib/ui-constants.ts` | 按鈕/輸入框共用 class 字串，改動前需 grep 全部呼叫端 |
| `components/ui/*`（`Button.tsx`/`Card.tsx`/`badge.tsx`/`input.tsx`/`table.tsx`/`sidebar.tsx`/`modal.tsx`/`form-field.tsx`/`loading.tsx`/`date-picker.tsx`/`currency-input.tsx`/`data-table.tsx`） | 真正的共用元件層，本身寫得算乾淨（沒有明顯 AI 味、有 `forwardRef`/`displayName` 慣例），但視覺上有相當比例被 `globals.css` 的全域選擇器覆蓋（見 2.1 節），必須跟 globals.css 一起改，否則元件改了、畫面沒變 |

### 4.2 高 AI 味、影響範圍相對獨立（可平行處理的重做目標）

| 檔案／檔案群 | 說明 |
|---|---|
| `app/page.tsx`、`app/login/page.tsx`、`app/register/page.tsx`、`components/loading/loading-screen.tsx`、`components/transitions/transition-button.tsx`、`components/navigation/navigation-progress-bar.tsx` | 「宇宙漸層光暈」集群（2.2 節），5 檔近乎重複貼上同一段 markup，是最值得整組重做／抽共用元件的地方；此集群不吃 `globals.css` 的 dashboard token（自成一套黑底配色），改動不會波及 dashboard，可獨立排期 |
| `components/dashboard-content.tsx` | Dashboard 視覺旗艦（bento grid、`tech-number`、漸層 balance-card），高度依賴 `globals.css` 的 `.bento-card`/`.tech-number`/`h1`/`.text-3xl` 規則，需與 4.1 節同步改 |
| `components/analytics-content.tsx` | 只需替換 `COLORS` 陣列與 3 處寫死 hex，改動範圍小、見效快 |
| `components/department-budget-content.tsx`、`components/reports-content.tsx`、`components/users-content.tsx` | 三份重複的部門 emoji 對照表，建議先合併成 `lib/constants/` 共用常數，再決定是否改用 lucide 圖示（一次處理「重複程式碼」與「AI 味 emoji」兩個問題） |
| `components/qr-scanner.tsx`、`components/audit-result-dialog.tsx` | emoji 前綴文字 → 可直接替換成專案已在用的 lucide 圖示（`Search`/`CheckCircle2`/`XCircle`），改動點各自 1-2 行 |
| `app/about/page.tsx` | 獨立的第三套視覺語言（雜誌編輯風），自帶字體、自成一頁，不耦合 globals.css 的元件層規則；是否保留這個風格、併入新設計系統、或整頁重做，建議當成獨立決策，不要跟 dashboard/行銷頁的改動綁在一起 |
| `public/Gemini_Generated_Image_wkar2twkar2twkar.png` | 品牌識別圖檔本身（favicon/apple-icon/浮水印三用途共用，見 3.7 項），建議重設計時一併換成正式設計的品牌識別，而非沿用 AI 生圖檔名的產物 |

### 4.3 孤兒／可能可清理的資產（建議重設計前先確認再刪，不在本次審計範圍內動它）

- `public/loading-cat.mp4`、`loading-cat.gif`、`loading-cat-transparent.gif`、`loading-cat-new.gif`、`loading-cat.webm` — 全專案程式碼只引用了 `loading-cat-v2.webm`（`navigation-progress-bar.tsx:40`），其餘 5 個檔案 grep 不到任何引用，疑似歷代替換後的殘留素材。
- `tailwind.config.ts` 的 `cat-body`/`cat-shadow` keyframes（見 4.1 節）。

---

## 5. 給團隊的摘要

**最嚴重的 5 個 AI 味模式：**

1. `app/globals.css` 對 `h1`／`.text-2xl`/`.text-3xl`／`.text-green-600`/`.text-red-600`／`input,select,textarea`／`.bg-primary`／`.rounded-xl.border` 等 Tailwind utility 與原生元素的**全域劫持覆寫**（多處帶 `!important`）——元件裡寫的 class 有很大比例其實不是最終視覺的決定者。
2. 5 個檔案（首頁/登入/註冊/載入動畫/轉場按鈕）近乎逐字複製的「紫→藍→青漸層光暈球 + `blur-3xl` + `animate-pulse` + 漸層裁切文字」通用 AI SaaS Landing Page 樣板。
3. `transition-button.tsx` 641 行的「豹爪撕裂螢幕」過場特效（鋸齒路徑生成、SVG 發光濾鏡、40 顆粒子動畫）——為了一個「進入系統」按鈕的導頁動作，複雜度嚴重過度工程化。
4. Recharts 色盤 `["#8884d8","#82ca9d","#ffc658",...]` 是官方文件範例色，从未客製化；同時 3 個部門 emoji 對照表在 3 個檔案裡逐字重複，且與全站主要使用的 lucide-react 圖示系統並存不一致。
5. 品牌識別圖檔本身叫 `Gemini_Generated_Image_wkar2twkar2twkar.png`，且同時身兼 favicon／apple-icon／全站浮水印三種用途——是整個專案裡最直接的「AI 生成痕跡」物證。

**必須保留的技術約束：19 項**（詳見第 3 節），涵蓋 Capacitor/iOS safe-area 與文字選取行為、深色模式雙 class 架構、FOUC 防護、Logo 浮水印 z-index 堆疊契約、View Transitions API 覆寫（綁定豹爪轉場)、Webkit 捲軸、react-day-picker 主題映射、CJK 字型 fallback、Radix/tailwindcss-animate 依賴、Sidebar 的 data 屬性樣式契約等。

**樣式核心檔案清單（動了全域生效，需優先整體規劃）：**
`app/globals.css`、`tailwind.config.ts`、`lib/theme-context.tsx`、`lib/ui-constants.ts`、`components/ui/*`（Button/Card/badge/input/table/sidebar/modal/form-field/loading/date-picker/currency-input/data-table 共 12 個檔案）。
