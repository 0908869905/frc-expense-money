# UI 全盤點清單 — 重設計安全網

> 產出日期：2026-07-03。盤點範圍：`D:\FRC\FRC報帳\Money` 全部前端路由與元件（Next.js 14 App Router）。
> **用途**：這是「全頁面重設計」前的地毯式現況存檔。重設計完成後，逐一比對本文件的每一個 `- [ ]` 項目，確認新版畫面「有沒有漏掉任何現有功能」——只要能在新版找到對應設計，就打勾；找不到對應，就是遺漏，需要回頭補上或明確記錄「刻意捨棄」。
> 本文件**不評論視覺風格**（風格審計另見 `STYLE_AUDIT.md`、設計方向另見 `DESIGN_SYSTEM.md`／`DESIGN_PRINCIPLES.md`），只記錄「畫面上實際有什麼、按下去會發生什麼」。
> 產生方式：9 個並行 agent 分區逐檔案精讀 `app/` 與 `components/` 全部原始碼（含對應的 `app/actions/*.ts` server actions）後彙整而成，非憑印象或截圖推測。

## 如何使用本文件

1. 每個路由/元件區塊內的 `- [ ]` 是一項可獨立核對的具體內容（文字、按鈕、欄位、狀態、規則）。
2. 巢狀縮排的 `- [ ]` 代表該項目底下的細節（例如表單裡的每個欄位、表格裡的每個欄位）。
3. 對照新版介面時：能找到對應 → 打勾；功能被刻意移除/合併 → 保留勾選框空白但加註說明，不要直接刪除本文件的項目（刪除項目 = 失去追蹤紀錄）。
4. 每節結尾的「使用的共用元件」「呼叫的 server actions」可用來快速定位程式碼。
5. 第十節「孤兒／未使用元件與死代碼總表」列出目前程式碼庫中**已寫好但沒有任何畫面在用**的邏輯與元件——這些不是「現有功能」，重設計時不需要為它們找對應畫面，但要明確決定每一項的去留（接上 / 刪除 / 保留備用），避免之後被誤判成「漏做了」。

---

## 路由總表（19 個頁面路由 + 2 個 Layout）

| # | 路由 | 頁面用途 | 主要限制／備註 | 章節 |
|---|------|----------|----------------|------|
| L1 | （全站）`app/layout.tsx` | 根 Layout：全域 Provider（Language／Theme／NavigationProgress）、字型、metadata | 套用於所有路由 | 一 |
| 1 | `/` | 公開首頁（登入前 Landing Page，黑底藝術風格＋「豹爪撕紙」轉場動畫） | 免登入 | 一 |
| 2 | `/about` | 團隊介紹頁（雜誌風格靜態頁，含歷史時間軸） | 免登入 | 一 |
| 3 | `/privacy` | 隱私政策靜態頁 | 免登入 | 一 |
| 4 | `/terms` | 服務條款靜態頁 | 免登入 | 一 |
| 5 | `/login` | 登入頁 | 免登入 | 一 |
| 6 | `/register` | 註冊頁 | 免登入 | 一 |
| L2 | `app/dashboard/layout.tsx` | 保護所有 `/dashboard/*` 路由，提供側邊欄與頁首共用框架 | 需登入 | 二 |
| 7 | `/dashboard` | 儀表板首頁：統計卡片、近期報表、快捷操作 | 需登入，內容依角色過濾 | 二 |
| 8 | `/dashboard/expenses` | 我的報帳單列表頁 | 需登入 | 三 |
| 9 | `/dashboard/expenses/new` | 新增報帳單表單頁（含收據上傳／壓縮／OCR／草稿邏輯） | USER 前端無阻擋，送出時才被伺服器拒絕 | 三 |
| 10 | `/dashboard/approvals` | 審核報帳單列表（審核佇列） | LEADER／FINANCE／ADMIN | 四 |
| 11 | `/dashboard/funding` | 資金管理頁（組別預算＋資金記錄兩區塊） | 依角色顯示不同區塊 | 五 |
| 12 | `/dashboard/inventory` | 庫存列表頁（零件清單、CRUD、批量操作、QR 入口） | `canAccessInventory()`：MECHANICAL 組或 FINANCE／ADMIN 角色 | 六 |
| 13 | `/dashboard/inventory/scan` | QR 掃描與料號查詢頁 | 同上 | 六 |
| 14 | `/dashboard/analytics` | 數據分析頁（圖表＋KPI，全站彙總不分組別） | 頁面本身無角色限制，但側邊欄僅 FINANCE／ADMIN 可見入口 | 七 |
| 15 | `/dashboard/reports` | 所有報表（列表管理＋逐筆審核操作＋CSV／Excel 匯出） | — | 七 |
| 16 | `/dashboard/stats` | 系統統計（極簡 KPI） | ⚠️ 側邊欄完全沒有連結，僅能手動輸入網址到達 | 七 |
| 17 | `/dashboard/users` | 使用者管理頁（表格＋逐欄位行內編輯） | 僅 ADMIN | 八 |
| 18 | `/dashboard/settings` | 系統設定頁（頭像、語言、通知頻率、密碼、登出、收款帳戶入口） | 需登入 | 八 |
| 19 | `/dashboard/profile` | 個人資料頁（純唯讀個人資訊＋報帳統計） | 需登入 | 八 |

## 元件總表

以下依章節列出本次盤點涵蓋的所有元件／檔案（共 45 個 `components/` 元件 + 2 個 barrel 匯出檔 + 2 個 `app/dashboard/` 頁面級輔助檔 + 4 個 `lib/` context + 3 個 `hooks/` + 3 個 UI 相關 `lib/` 工具檔 = **59 個檔案**逐一精讀）：

| 章節 | 元件／檔案 |
|------|-----------|
| 一、公開與登入頁面 | RootLayout、LanguageSwitcher、LoadingScreen、ClawSvg、TransitionButton、transitions/index.ts、ErrorBoundary、OfflineIndicator、DraftRestorePrompt、LanguageProvider、ThemeProvider、NavigationProgressProvider、password.ts(changePassword) |
| 二、Dashboard 殼層與首頁 | DashboardContent、DashboardHeader、DashboardWrapper、AppSidebar、NavigationLink、NavigationProgressBar、navigation/index.ts、BalanceCard、Sidebar（components/ui/sidebar.tsx）、OrganizationContext |
| 三、報帳單 | ExpensesContent、ExpenseForm、ReceiptPreview、ReceiptAuditButton、AuditResultDialog、BatchAuditButton、DashboardTable＋columns.tsx（⚠️孤兒）、useAutoSave＋draft-storage（⚠️孤兒） |
| 四、審核 | ApprovalsContent、BatchAuditButton |
| 五、資金／預算／銀行帳戶 | FundingContent、FundingDialog、DepartmentBudgetContent、BankAccountSettings、BankAccountSelectDialog（⚠️孤兒） |
| 六、庫存管理 | InventoryContent、InventoryQRModal、BatchInventoryModal、QRScanner |
| 七、分析／報表／統計 | AnalyticsContent、ReportsContent、export.ts、export-utils.ts |
| 八、使用者／設定／個人資料 | UsersContent、SettingsContent、ProfileContent |
| 九、共用 UI 元件庫 | Button、Card、Badge、loading.tsx（⚠️孤兒）、Modal、table.tsx、DataTable、form-field.tsx（⚠️孤兒）、input.tsx、label.tsx、DatePicker（⚠️孤兒）、CurrencyInput（⚠️孤兒）、ui-constants.ts |
| 十、孤兒與死代碼總表 | （彙整全書所有「零使用」發現，含 `hooks/useCache.ts`） |

## 目錄

- 一、公開與登入頁面
- 二、Dashboard 殼層與首頁
- 三、報帳單（Expenses）
- 四、審核（Approvals）
- 五、資金／組別預算／銀行帳戶
- 六、庫存管理（Inventory）
- 七、分析／報表／統計
- 八、使用者／設定／個人資料
- 九、共用 UI 元件庫（附錄）
- 十、孤兒／未使用元件與死代碼總表（附錄）

## 全站共用詞彙（各節內文直接引用，此處只定義一次）

- **角色 Role（5 種，來自 `prisma/schema.prisma`）**：`USER` 僅供檢視／`VICE_LEADER` 副組長：新增報帳單、查看組內資金／`LEADER` 組長：審核組內報帳單／`FINANCE` 財務：財務審核撥款／`ADMIN` 系統管理員：完全存取
- **報帳單狀態 ReportStatus（5 種）**：`PENDING_MANAGER` 待主管審核（黃）／`PENDING_FINANCE` 待財務審核（藍）／`PAID` 已付款（綠）／`REJECTED` 已拒絕（紅）／`RETURNED` 已退回（橘）。流程：建立→`PENDING_MANAGER`→(LEADER 核准)→`PENDING_FINANCE`→(FINANCE 核准)→`PAID`；任一階段可 `REJECTED` 或 `RETURNED`；LEADER 建立的單子直接進 `PENDING_FINANCE`。DRAFT 階段已於 2026-02-02 移除。
- **組別 TeamDepartment（7 種）**：`ELECTRICAL`⚡電資組／`MECHANICAL`⚙️機構組／`DOCUMENTATION`📝文書組／`PR`📣公關組／`FINANCE`💰財管組／`DESIGN`🎨意象組／`MENTOR` 老師導師（無 icon）
- **資金類型 FundingType（5 種）**：`SPONSORSHIP` 贊助／`DONATION` 捐款／`GRANT` 補助金／`FUNDRAISING` 募款活動／`OTHER` 其他
- **庫存類別 ItemCategory（7 種）**：`MOTOR` 馬達／`SENSOR` 感測器／`PNEUMATIC` 氣壓／`CONTROLLER` 控制器／`HARDWARE` 五金／`RAW_MATERIAL` 原料／`TOOL` 工具
- **庫存異動類型 TransactionType（5 種）**：`PURCHASE_IN` 採購入庫／`PROJECT_USE` 專案領用／`DAMAGED` 損壞報廢／`LOST` 遺失／`AUDIT_ADJUSTMENT` 盤點調整
- **通知頻率 NotificationFrequency（3 種）**：`INSTANT` 即時通知／`DAILY_DIGEST` 每日摘要／`OFF` 關閉
- **台灣銀行清單**（`lib/constants/banks.ts`）共 30 間，含中華郵政、臺灣銀行、國泰世華、玉山、中國信託等
- **全站無任何** `app/**/loading.tsx`、`error.tsx`、`not-found.tsx`（已用 glob 確認零結果）——所有 loading／empty／error 狀態皆為頁面或元件內部手動處理，各節已逐一記錄
- **訊息提示機制**：官方共用 hook 為 `hooks/useMessage.ts`（`{type: "success"|"error", text}`，3 秒後自動消失），但**實際上絕大多數頁面各自土炮一份行為不完全相同的替代品**（有的不會自動消失、有的被 Modal 遮住看不到）——詳見各節與第十節

---

# 一、公開與登入頁面

## 元件：RootLayout（app/layout.tsx）／全站根 Layout，套用於所有路由（含公開頁與 dashboard）

- [ ] `<html lang="zh-TW" suppressHydrationWarning>` — 全站語言標記固定為 zh-TW（即使語言切換到英文，html lang 屬性不會跟著變動）
- [ ] metadata.title 固定為 `"BudgetFlow"`（瀏覽器分頁標題，不隨語言切換或路由變動）
- [ ] metadata.description：「團隊報帳與資金管理系統 — 支援報帳、庫存追蹤、QR Code 掃描與財務分析」
- [ ] metadata.icons：icon / shortcut / apple 三者皆指向同一張圖 `/Gemini_Generated_Image_wkar2twkar2twkar.png`
- [ ] metadata.appleWebApp：capable=true、statusBarStyle="black-translucent"、title="BudgetFlow"（加到主畫面/PWA 時使用）
- [ ] viewport 設定：width=device-width、initialScale=1、maximumScale=1（**使用者無法縮放頁面**）、viewportFit="cover"（支援瀏海/安全區域）
- [ ] 字型：Google Font「Inter」，載入 `latin` 子集，CSS 變數 `--font-sans`，套用於全站 `<body>`（`font-sans antialiased`）
- [ ] Provider 巢狀順序（由外到內）：`ThemeProvider` → `OrganizationProvider` → `LanguageProvider` → `NavigationProgressProvider` → `<NavigationProgressBar />` → `{children}`
  - [ ] `OrganizationProvider`（`lib/organization-context`）與 `components/navigation` 的 `NavigationProgressBar` **不在本次盤點檔案範圍內**，需由負責 dashboard/共用元件的人補上其視覺細節（進度條顏色、高度、位置等）
- [ ] 全站沒有 `loading.tsx` / `error.tsx` / `not-found.tsx`（已知事實，layout 本身也未手動渲染任何 fallback UI 來替代）

**使用的共用元件：**
- ThemeProvider（lib/theme-context.tsx，見下方元件區塊）
- LanguageProvider（lib/language-context.tsx，見下方元件區塊）
- NavigationProgressProvider（lib/navigation-progress-context.tsx，見下方元件區塊）
- OrganizationProvider（lib/organization-context.tsx，**超出本次盤點範圍**）
- NavigationProgressBar（components/navigation，**超出本次盤點範圍**）

**呼叫的 server actions：** 無

---

## 路由：/／公開首頁（登入前 Landing Page，黑底藝術風格）

- [ ] 頁面為 `"use client"`，純靜態展示頁，**沒有任何資料請求**，因此沒有 loading / empty / error 狀態需要處理（唯一的「載入感」來自 CTA 按鈕的轉場動畫，見下方）
- [ ] 背景裝飾（純視覺、無互動）：
  - [ ] 中央大型漸層模糊光暈圓（紫→藍→青，`animate-pulse`）＋ 內層漸層光暈（粉→紫，延遲 1s 的 `animate-pulse`）
  - [ ] 左上角、右下角各一個模糊光點（紫色／藍色）
  - [ ] 全螢幕雜訊紋理疊加（SVG data URI，透明度 0.015）
- [ ] 右上角固定 `LanguageSwitcher` 元件（`absolute top-6 right-6 z-50`）
- [ ] 主標題：巨大字體「FRC」（漸層白→紫→藍文字）疊「6998」（漸層紫→粉→藍文字），兩行，`tracking-tighter`
- [ ] 英文隊名：「UNIPARDS」，大寫、字距拉開（`tracking-[0.3em]`）
- [ ] 裝飾用分隔線（線—圓點—線，純視覺）
- [ ] 副標題文字（依語言切換，頁面內硬編碼中英判斷，非透過 `t()` key 查表）：中文「團隊財務管理系統」／英文「Team Financial Management System」
- [ ] CTA 按鈕區（水平排列，手機版垂直堆疊）：
  - [ ] 按鈕一：`TransitionButton` — 文字「進入系統」／「Enter System」＋右箭頭圖示；點擊後觸發「豹爪撕紙」轉場動畫，動畫結束後用 `window.location.href = "/login"` 導向登入頁（詳見下方 TransitionButton 元件區塊；動畫全程約 2.5 秒，期間按鈕會被 disable，無法重複點擊）
  - [ ] 按鈕二：`<Link href="/about">` 包住 `Button variant="outline" size="lg"`，文字使用 `t("learn_more")` = 中文「了解更多」／英文「Learn More」，白色半透明邊框，hover 時背景變亮
- [ ] 頁尾（`absolute bottom-0`）：
  - [ ] 左：`t("footer_rights")` = 中文「© 2026 FRC6998 保留所有權利。」／英文「© 2026 FRC6998 All rights reserved.」
  - [ ] 右：兩個連結 — `t("terms")`＝「服務條款」/「Terms of Service」導向 `/terms`；`t("privacy")`＝「隱私政策」/「Privacy」導向 `/privacy`
- [ ] **發現的死碼/待確認項**：頁面呼叫了 `useOrganization()` 取得 `org`，但 `org` 在畫面上完全沒有被使用/渲染（可能保留給未來擴充，或可移除）

**使用的共用元件：**
- Button（components/ui/Button，超出本次盤點範圍，只讀了呼叫方式）
- LanguageSwitcher
- TransitionButton（內部使用 ClawSvg）

**呼叫的 server actions：** 無（TransitionButton 用 `window.location.href` 做整頁導向，非 server action）

---

## 路由：/about／團隊介紹頁（雜誌風格靜態頁，含歷史時間軸）

- [ ] 頁面為 `"use client"`，額外載入字型 Playfair Display（serif，weight 400/900，變數 `--font-serif`）與局部 Inter（weight 300/400/500）
- [ ] **語言機制特殊點**：此頁只從 `useLanguage()` 取出 `language`，**沒有**使用共用的 `t(key)` 查表函式；改用自訂的區域函式 `t(zh, en) => language === "zh" ? zh : en`，所有文案是頁面內硬編碼的雙語字串，不在 `lib/language-context.tsx` 字典裡（見下方 LanguageProvider 區塊的「孤兒翻譯」發現）
- [ ] 全頁雜訊紋理覆蓋層（`mix-blend-overlay`，fixed，pointer-events-none）
- [ ] 頂部固定導覽列（`mix-blend-difference`，文字永遠白色以對比背景）：
  - [ ] 左：`<Link href="/">` ＋左箭頭圖示＋文字 `t("返回","Back")`
  - [ ] 右：`LanguageSwitcher`
- [ ] Hero 區塊（滿版視窗高度）：
  - [ ] 固定英文小字：「Since 2018 — Tainan, Taiwan」（未做語言切換，永遠英文）
  - [ ] 巨大標題「6998」（`14vw`~`16vw` 超大字級）
  - [ ] 副標「Unipards」（斜體、灰色）
  - [ ] 介紹段落：中文「南科實中首支 FRC 隊伍。我們不只是建造機器人，我們建造夢想，並將 STEAM 教育的種子播撒至偏鄉。」／英文「NNKIEH's first FRC team. We don't just build robots; we build dreams and sow the heavy seeds of STEAM education into underserved communities.」
- [ ] 歷程時間軸區塊：
  - [ ] 左側 sticky 標題：「歷程」/「History」＋「我們的足跡」/「Our Journey」
  - [ ] 右側時間軸項目（`TimelineEntry` 元件，共 7 筆，每筆含年份/標題/內容段落，hover 時左側圓點變紫色、標題文字變白）：
    - [ ] 2018／起源／The Origin — 「在國科會的支持下，國立南科國際實驗高級中學成立了 FRC 6998 UNIPARDS，前往 Southern Cross Regional，開啟了這段不凡的旅程。」／「With the support of the National Science and Technology Council (NSTC), National Nanke International Experimental High School founded FRC 6998 UNIPARDS. We competed at the Southern Cross Regional, beginning our extraordinary journey.」
    - [ ] 2019／初試啼聲／First Echo — 「在 Hawaii Regional，我們展現了強大的商業潛力，獲得了 Entrepreneurship Award，這是我們的首個國際獎項，證明了技術與商業思維並重的重要性。」／「At the Hawaii Regional, we demonstrated strong business potential, winning the Entrepreneurship Award—our first international accolade, proving the importance of balancing technology with business acumen.」
    - [ ] 2020–2021／蟄伏／The Pause — 「全球疫情迫使 FRC 賽季取消，但我們並沒有停下腳步。這段期間我們持續精進技術、培訓新血、強化社區推廣，為未來的回歸做好準備。」／「The global pandemic forced the cancellation of FRC seasons, but we never stopped. We continued refining our skills, training new members, and strengthening community outreach, preparing for our return.」
    - [ ] 2022／王者歸來／The Return — 「疫情並沒有澆熄我們的熱情。重返賽場後，我們在 New Taipei City x Hon Hai Regional 斬獲最高榮譽 Regional Chairman's Award 以及 Quality Award，蔡汶鴻老師獲得 Woodie Flowers Finalist Award，並首度取得前往 FIRST Championship 世界錦標賽的門票。」／「The pandemic didn't extinguish our passion. Returning to the field, we clinched the Regional Chairman's Award and Quality Award at the New Taipei City x Hon Hai Regional. Mentor Wen-Hung Tsai received the Woodie Flowers Finalist Award. We secured our first FIRST Championship ticket.」
    - [ ] 2023／世界舞台／World Stage — 「豐收的一年。我們成為 Monterey Bay Regional Winner 並獲得 Engineering Inspiration Award，再次晉級世錦賽。在休士頓奪得 Industrial Design Award。同時榮獲教育部「創新教育領導獎」。」／「A year of harvest. We became Monterey Bay Regional Winners with the Engineering Inspiration Award, qualifying for Worlds again. In Houston, we won the Industrial Design Award. We also received the Ministry of Education's Innovation Leadership Award.」
    - [ ] 2024／永續發展／Sustainability — 「在 Central Valley Regional，我們獲頒 Team Sustainability Award，肯定我們對環境保護與團隊永續經營的承諾。」／「At the Central Valley Regional, we earned the Team Sustainability Award, recognizing our commitment to environmental protection and team sustainability.」
    - [ ] 2025／傳承／Legacy — 「在 New Taipei City Regional，劉昀珊老師獲得 Woodie Flowers Finalist Award，使我們成為台灣第一支擁有兩位獲此殊榮導師的隊伍。這是對卓越教學與啟發的最高肯定，我們帶著使命繼續前進。」／「At the New Taipei City Regional, mentor Yun-Shan Liu received the Woodie Flowers Finalist Award, making us the first team in Taiwan with two mentors receiving this honor. We continue forward with our mission.」
- [ ] 哲學區塊（白底黑字，與全頁深色主題反轉的區段）：
  - [ ] 小標：「核心哲學」/「Philosophy」
  - [ ] 大標語：`"Beyond the Metal."`（"Metal" 斜體灰字，固定英文不翻譯）
  - [ ] 段落：「機器人只是載體。我們真正的產品是那些具備解決問題能力、擁有同理心與領導力的未來領袖。」／「The robot is just a vehicle. Our true products are future leaders equipped with problem-solving skills, empathy, and leadership.」
- [ ] 社群/頁尾區塊（Brutalist 清單風格）：
  - [ ] 標題「保持聯繫」/「Connect」
  - [ ] `SocialLink` 五筆（label＋id 文字＋外部連結，`target="_blank" rel="noopener noreferrer"`）：
    - [ ] Email → `mailto:frc6998@ms.nnkieh.tn.edu.tw`（顯示 `frc6998@ms.nnkieh.tn.edu.tw`）
    - [ ] Instagram → `https://www.instagram.com/frc_6998/`（顯示 `@frc_6998`）
    - [ ] Facebook → `https://www.facebook.com/frc6998`（顯示 `frc6998`）
    - [ ] GitHub → `https://github.com/frc-6998`（顯示 `frc-6998`）
    - [ ] YouTube → `https://www.youtube.com/@FRC-6998Unipards`（顯示 `@FRC-6998Unipards`）
  - [ ] 巨大「6998」浮水印數字（opacity 10%，純裝飾，`select-none`）
  - [ ] 底部列：連結「Terms」→`/terms`、「Privacy」→`/privacy`（**注意：這兩個字固定英文，沒有走 `t()` 雙語切換，跟其他頁的服務條款連結文字不一致**）＋「© 2025 UNIPARDS. All Rights Reserved.」（**注意：年份寫死 2025，且固定英文，跟其他頁 `footer_rights` 顯示的「© 2026」不一致**）
- [ ] 沒有 loading / empty / error 狀態（純靜態內容頁，無資料請求）

**使用的共用元件：**
- LanguageSwitcher
- 頁面內部自定義元件：`TimelineEntry`、`SocialLink`（僅此頁使用，非全站共用）

**呼叫的 server actions：** 無

---

## 路由：/privacy／隱私政策靜態頁

- [ ] Header（sticky top，`bg-background/95 backdrop-blur`，**主題感知樣式，非寫死黑底**，與 /、/login、/register、/about 明顯不同）：
  - [ ] `<Link href="/">` 包住 `Button variant="ghost" size="sm"`：左箭頭圖示＋文字（中文「返回首頁」／英文「Back to Home」）
- [ ] 主標題 h1：「隱私政策」／「Privacy Policy」
- [ ] 內文共 8 節（每節標題為「數字. 標題」格式，中英對照）：
  - [ ] 1. 資料收集／Data Collection
    - [ ] 前言：中文「使用 {org.name} 報帳系統時，我們會收集以下資訊：」／英文「When using the {org.name} Expense System, we collect the following information:」（**{org.name} 為動態內插，來自 OrganizationProvider**）
    - [ ] 條列 4 項：「帳號資訊：姓名、電子郵件、密碼（加密儲存）」／「報帳資料：費用明細、日期、類別、說明」／「收據圖片：您上傳的發票或收據影像」／「使用紀錄：登入時間、操作記錄（用於審計）」
  - [ ] 2. 資料用途／Data Usage
    - [ ] 前言：「我們收集的資料僅用於以下目的：」
    - [ ] 條列 4 項：「處理和管理您的報帳申請」／「身份驗證和帳號安全」／「團隊財務記錄和報表生成」／「系統改進和問題排除」
  - [ ] 3. 資料儲存與安全／Data Storage & Security
    - [ ] 前言：「您的資料儲存於安全的雲端伺服器。我們採用以下安全措施保護您的資料：」
    - [ ] 條列 4 項：「密碼使用 bcrypt 加密儲存」／「所有傳輸使用 HTTPS 加密」／「定期資料備份」／「存取權限控管」
  - [ ] 4. 資料分享／Data Sharing
    - [ ] 前言：「我們不會將您的個人資料出售或分享給第三方，除非：」
    - [ ] 條列 3 項：「獲得您的明確同意」／「法律要求時」／「與團隊財務管理相關的必要分享（僅限授權人員）」
  - [ ] 5. Cookie 使用／Cookie Usage — 單段文字：「本系統使用必要的 Cookie 來維持您的登入狀態和系統偏好設定。這些 Cookie 對於系統正常運作是必需的。」
  - [ ] 6. 您的權利／Your Rights
    - [ ] 前言：「您擁有以下權利：」
    - [ ] 條列 3 項：「查看和更新您的個人資料」／「請求刪除您的帳號和相關資料」／「獲取您資料的副本」
    - [ ] 結語：「如需行使上述權利，請聯繫團隊管理員。」
  - [ ] 7. 政策更新／Policy Updates — 單段文字：「我們可能會不時更新本隱私政策。更新後的政策將在本頁面公布，重大變更時我們會通知您。」
  - [ ] 8. 聯絡我們／Contact Us — 單段文字：「如對本隱私政策有任何疑問，請聯繫團隊管理員或財務組。」
- [ ] 頁尾註記：「最後更新：2026/01/06」／「Last updated: 2026/01/06」（**寫死日期，非動態產生**）
- [ ] 沒有 loading / empty / error 狀態（純靜態文字頁）

**使用的共用元件：**
- Button（ghost variant）

**呼叫的 server actions：** 無（僅讀取 `useOrganization()` 的 `org.name`，該 context 超出本次盤點範圍）

---

## 路由：/terms／服務條款靜態頁

- [ ] Header 與 /privacy 完全相同結構：`<Link href="/">` ＋ `Button variant="ghost" size="sm"` ＋左箭頭圖示＋「返回首頁」／「Back to Home」（同樣是主題感知的 `bg-background/95 backdrop-blur`）
- [ ] 主標題 h1：「服務條款」／「Terms of Service」
- [ ] 內文共 7 節：
  - [ ] 1. 服務說明／Service Description — 「{org.name} 報帳系統（以下簡稱「本系統」）是專為 FRC 機器人競賽團隊設計的內部費用報銷管理平台。本系統提供費用申報、審核、追蹤等功能，僅供團隊成員內部使用。」（{org.name} 動態內插）
  - [ ] 2. 使用資格／Eligibility — 「本系統僅供經團隊管理員授權的成員使用。使用者必須提供真實、準確的個人資訊進行註冊。未經授權的訪問或使用將被禁止。」
  - [ ] 3. 使用者責任／User Responsibilities — 條列 5 項：「妥善保管帳號密碼，不得與他人共享」／「提交真實、準確的報帳資料」／「上傳清晰可辨識的收據或發票」／「遵守團隊的財務報銷政策」／「不得進行任何欺詐或虛假報帳行為」
  - [ ] 4. 系統使用規範／System Usage Rules — 「使用者不得嘗試破解、干擾或破壞系統的正常運作。任何惡意行為將導致帳號停用，並可能追究相關責任。」
  - [ ] 5. 智慧財產權／Intellectual Property — 「本系統的所有內容、設計、程式碼及商標均為團隊所有。未經書面許可，不得複製、修改或分發。」
  - [ ] 6. 免責聲明／Disclaimer — 「本系統按「現狀」提供，不對系統的持續可用性或無錯誤運行作出保證。團隊不對因系統使用而產生的任何直接或間接損失負責。」
  - [ ] 7. 條款修改／Modifications — 「團隊保留隨時修改本服務條款的權利。修改後的條款將在本頁面公布，繼續使用本系統即表示接受修改後的條款。」
- [ ] 頁尾註記：「最後更新：2026/01/06」／「Last updated: 2026/01/06」（寫死日期）
- [ ] 沒有 loading / empty / error 狀態

**使用的共用元件：**
- Button（ghost variant）

**呼叫的 server actions：** 無

---

## 路由：/login／登入頁

- [ ] 版面：左右分欄（`lg:` 以上顯示雙欄，手機只顯示右欄表單）
- [ ] 左欄（`hidden lg:flex`，純裝飾）：漸層光暈、雜訊紋理、置中巨大「FRC」/「6998」logo 文字、「UNIPARDS」、分隔線、副標題（中文「團隊財務管理系統」／英文「Team Financial Management System」，頁面內硬編碼中英判斷，非 `t()` key）
- [ ] 右欄：
  - [ ] 右上角固定 `LanguageSwitcher`
  - [ ] 手機版限定：`<Link href="/">` 包住的「FRC 6998」小 logo
  - [ ] 歡迎文字：h2「歡迎回來」／「Welcome back」＋ p `t("login_desc")` = 「輸入你的帳號密碼登入系統」／「Enter your credentials to sign in」
  - [ ] 表單以 `<Suspense fallback={...}>` 包裹（因用到 `useSearchParams`）：
    - [ ] **loading 狀態（Suspense fallback）**：一個灰白色脈動骨架方塊 `animate-pulse h-64 bg-white/5 rounded-2xl`（無文字、純形狀佔位）
  - [ ] 表單內容（LoginForm）：
    - [ ] 若 URL 帶 `?registered=` 參數：顯示綠色成功橫幅（`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-sm backdrop-blur-sm`），文字為 `t("register_success")` = 「註冊成功！請使用你的帳號登入」／「Registration successful! Please sign in」
    - [ ] 若登入失敗：顯示紅色錯誤橫幅（`bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm backdrop-blur-sm`），文字為 `t("login_error")` = 「電子郵件或密碼錯誤」／「Invalid email or password」（**注意：這個橫幅不是 `hooks/useMessage.ts` 那個共用 hook，是這個頁面自己的 local state（`loginError`），不會 3 秒自動消失，會持續顯示到下次送出表單為止**）
    - [ ] 欄位 1 - Email：
      - [ ] name/id="email"，type="email"，label=`t("email")`＝「電子郵件」／「Email」
      - [ ] placeholder=`t("email_placeholder")`＝「name@example.com」
      - [ ] `required`
    - [ ] 欄位 2 - 密碼：
      - [ ] name/id="password"，type="password"，label=`t("password")`＝「密碼」／「Password」
      - [ ] placeholder=`t("password_placeholder")`＝「輸入密碼」／「Enter password」
      - [ ] `required`
    - [ ] 送出按鈕：文字=`t("login_button")`＝「登入」／「Sign In」＋右箭頭圖示；送出中（local `loading` state）時圖示替換為 `Loader2` 旋轉圖示、按鈕 `disabled`（**注意：因為送出後立即整頁切換成 LoadingScreen 全螢幕動畫，這個按鈕內建 spinner 幾乎不會被使用者看到**）
  - [ ] 表單下方：「還沒有帳號？」／「Don't have an account?」＋連結「立即註冊」／「Register Now」→ `/register`
  - [ ] 頁尾：`t("footer_rights")`＝「© 2026 FRC6998 保留所有權利。」
- [ ] **送出後行為（核心流程，容易被簡化掉的地方）**：
  - [ ] `onSubmit` 攔截表單預設送出，立即呼叫 `onLoginStart(email, password)`
  - [ ] `onLoginStart` 建立一個 Promise：內部呼叫 NextAuth `signIn("credentials", { email, password, redirect: false })`；同時**立刻**將 `showLoading` 設為 true，畫面整個換成 `LoadingScreen` 全螢幕動畫元件（見下方元件區塊），登入驗證在背景進行
  - [ ] `LoadingScreen` 完成時呼叫 `onComplete(result)`：
    - [ ] 若 `result.success` → `window.location.href = "/dashboard"`（整頁硬導向，非 client-side route）
    - [ ] 若失敗 → 關閉 LoadingScreen（`showLoading=false`），回到登入表單並顯示錯誤橫幅（`result.error || t("login_error")`）
- [ ] 沒有 empty 狀態（表單頁面）

**使用的共用元件：**
- Button、Input、Label（components/ui）
- LanguageSwitcher
- LoadingScreen（components/loading/loading-screen.tsx，見下方元件區塊）

**呼叫的 server actions／外部驗證：**
- NextAuth `signIn("credentials", {...})`（`next-auth/react`，非本專案 `app/actions/` 內的 server action，但功能等同登入驗證入口，非本次盤點的 `app/actions/*.ts` 檔案）

---

## 路由：/register／註冊頁

- [ ] 版面結構與 /login 相同（左裝飾欄＋右表單欄），差異點：
  - [ ] 左欄副標題：中文「加入我們的團隊」／英文「Join Our Team」（而非登入頁的「團隊財務管理系統」）
  - [ ] 左欄多了 2 個漂浮裝飾幾何圖形（旋轉 45 度的方形邊框、圓形邊框），套用自訂 CSS `@keyframes float` 動畫（6 秒循環、垂直漂浮）
- [ ] 右欄：
  - [ ] 右上角固定 `LanguageSwitcher`
  - [ ] 手機版限定小 logo「FRC 6998」（`<Link href="/">`）
  - [ ] 歡迎文字：h2「建立帳號」／「Create Account」＋ p `t("register_desc")`＝「建立你的帳戶」／「Create your account」
  - [ ] 表單（RegisterForm，使用 `useFormState(registerUser, {success:false, message:null})` 綁定 server action）：
    - [ ] 若 `state.message` 存在：顯示橫幅，成功時綠色樣式（`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`），失敗時紅色樣式（`bg-red-500/10 text-red-400 border-red-500/20`），文字為 server action 回傳的 `message`（見下方「呼叫的 server actions」列出的所有可能文字）；（**同樣不是 `useMessage` hook，是 `useFormState` 回傳的 state，不會自動消失，停留到下次送出**）
    - [ ] 欄位 1 - 姓名：
      - [ ] name/id="name"，type="text"，icon=User，label=`t("name")`＝「姓名」／「Name」
      - [ ] placeholder＝與 label 相同文字（`t("name")`，**沒有獨立的 placeholder 文案**）
      - [ ] `required`
      - [ ] 錯誤文字來源：`state.errors?.name?.[0]`（紅字顯示於欄位下方）
    - [ ] 欄位 2 - Email：
      - [ ] name/id="email"，type="email"，icon=Mail，autoComplete="email"，label=`t("email")`＝「電子郵件」／「Email」
      - [ ] placeholder=`t("email_placeholder")`＝「name@example.com」
      - [ ] `required`；錯誤：`state.errors?.email?.[0]`
    - [ ] 欄位 3 - 密碼：
      - [ ] name/id="password"，type="password"，icon=Lock，autoComplete="new-password"，label=`t("password")`＝「密碼」／「Password」
      - [ ] placeholder=`t("password_min_6")`＝「8 字元以上，含英文和數字」／「8+ chars with letters and numbers」（**翻譯 key 名稱寫 "min_6"，但實際顯示要求 8 字元，key 命名與內容不一致，疑似密碼政策曾經改過**）
      - [ ] `required`，HTML `minLength={8}`；錯誤：`state.errors?.password?.[0]`
    - [ ] 欄位 4 - 確認密碼：
      - [ ] name/id="confirmPassword"，type="password"，icon=Lock，autoComplete="new-password"，label=`t("confirm_password")`＝「確認密碼」／「Confirm Password」
      - [ ] placeholder=`t("confirm_password_placeholder")`＝「再次輸入密碼」／「Re-enter password」
      - [ ] `required`（**沒有 HTML minLength**）；錯誤：`state.errors?.confirmPassword?.[0]`
    - [ ] 欄位 5 - 組別（`DepartmentSelector` 自訂下拉選單，非原生 `<select>`）：
      - [ ] label=`t("department")`＝「組別」／「Department」
      - [ ] 觸發按鈕：未選擇時顯示灰字 placeholder `t("select_department")`＝「選擇你的組別」／「Select your department」＋ Users 圖示；已選擇時顯示該組別中/英文名稱（白字）；右側 chevron 圖示，展開時旋轉 180 度
      - [ ] 點擊觸發按鈕切換開/關；開啟時有一個全螢幕透明背景層，點擊背景可關閉下拉選單
      - [ ] 選單方向：向上展開（`bottom-full`，避免被畫面下緣截斷）
      - [ ] 7 個選項（順序固定）：ELECTRICAL「電資組」/「Electrical」、MECHANICAL「機構組」/「Mechanical」、DOCUMENTATION「文書組」/「Documentation」、PR「公關組」/「PR」、FINANCE「財管組」/「Finance」、DESIGN「意象組」/「Design」、MENTOR「老師」/「Mentor」
      - [ ] 選項被選中時：背景轉為淡紫色、文字紫色、右側顯示 `Check` 勾勾圖示
      - [ ] 實際送出表單用的是一個 `<input type="hidden" name="department">`，值同步於選單狀態
      - [ ] 錯誤文字：`state.errors?.department?.[0]`
    - [ ] 送出按鈕（`SubmitButton`，用 `useFormStatus()` 取得 `pending`）：文字=`t("register_button")`＝「註冊」／「Register」＋右箭頭圖示；`pending` 時圖示替換為 `Loader2` 旋轉圖示、按鈕 `disabled`（**此頁沒有像登入頁那樣的全螢幕 LoadingScreen，純粹是按鈕內建 spinner**）
  - [ ] 表單下方：「已經有帳號？」／「Already have an account?」＋連結「立即登入」／「Sign In」→ `/login`
  - [ ] 頁尾：`t("footer_rights")`
- [ ] **送出後行為**：
  - [ ] 成功（`state.success === true`）：顯示綠色成功橫幅 1.5 秒，`useEffect` 計時器到時後用 `router.push("/login?registered=true")`（**client-side 導向，跟登入頁/首頁 CTA 用 `window.location.href` 硬導向不同，是個不一致點**）
  - [ ] 失敗：顯示紅色橫幅＋對應欄位紅字錯誤，**不會自動消失**，停留到使用者再次送出
- [ ] 沒有 empty 狀態（表單頁面）

**使用的共用元件：**
- Button、Input、Label（components/ui）
- LanguageSwitcher

**呼叫的 server actions：**
- `registerUser`（app/actions/register.ts）
  - [ ] 驗證規則（**此檔案有自己獨立定義的 zod schema，並未 import `lib/schemas.ts` 的共用規則，文字與任務背景所列的 canonical 訊息略有出入，見下方對照**）：
    - [ ] 姓名最少 2 字元，錯誤訊息：「名稱至少需要 2 個字元」（**注意：與 `lib/schemas.ts` canonical 訊息「姓名至少需要 2 個字元」用字不同，「名稱」vs「姓名」**）
    - [ ] Email 格式錯誤，錯誤訊息：「請輸入有效的電子郵件」（**注意：與 `lib/schemas.ts` canonical 訊息「請輸入有效的 Email」不同**）
    - [ ] 密碼至少 8 字元：「密碼至少需要 8 個字元」（與 canonical 相同）
    - [ ] 密碼須含英文字母：「密碼必須包含至少一個英文字母」（與 canonical 相同）
    - [ ] 密碼須含數字：「密碼必須包含至少一個數字」（與 canonical 相同）
    - [ ] 未選組別：「請選擇組別」
    - [ ] 密碼與確認密碼不一致：「密碼不一致」（與 canonical 相同）
  - [ ] 表單驗證失敗（zod safeParse 失敗）→ `{success:false, message:"請修正表單錯誤", errors:{...}}`
  - [ ] Email 已被註冊 → `{success:false, message:"此電子郵件已被註冊", errors:{email:["此電子郵件已被註冊"]}}`
  - [ ] 成功建立使用者（bcrypt cost 10 雜湊密碼，role 固定為 `USER`）→ `{success:true, message:"註冊成功！請登入"}`
  - [ ] 未預期例外（有 `console.error`）→ `{success:false, message:"註冊失敗，請稍後再試"}`

---

## 元件：LanguageSwitcher（components/language-switcher.tsx）

- [ ] 單一按鈕（非下拉選單、非選項清單），點擊即在中/英文之間切換（`setLanguage(language === "zh" ? "en" : "zh")`）
- [ ] 視覺：膠囊形（`rounded-md`）、有邊框、`bg-background`，hover 時 `bg-muted`
- [ ] 內容：`Globe` 圖示（lucide-react）＋文字：目前為中文時顯示「EN」，目前為英文時顯示「中」（**顯示的是切換後會變成的語言，不是目前語言**）
- [ ] `title` 提示文字（滑鼠懸停 tooltip）：中文狀態下顯示「Switch to English」；英文狀態下顯示「切換至中文」
- [ ] 只有兩種語言選項：`zh`（繁體中文）／`en`（英文），沒有其他語言，沒有下拉式的語言清單
- [ ] 出現位置：本次盤點範圍內固定出現在 /（首頁）、/about、/login、/register 的右上角（每頁各自用 `absolute top-6 right-6` 定位，並非共用的全域 header）；/privacy、/terms 兩頁**沒有**放置 LanguageSwitcher
- [ ] 切換後透過 `LanguageProvider` 的 `t()` 影響全站所有使用 `t(key)` 的文字（但 /about 頁面例外，該頁用自己的 local `t(zh,en)`，不受翻譯字典內容影響，只受 `language` 狀態切換影響）

**使用的共用元件：** 無（本身即為共用元件，被其他頁面引用）

**呼叫的 server actions：** 無（純前端 state，寫入 `localStorage`）

---

## 元件：LoadingScreen（components/loading/loading-screen.tsx）／登入後全螢幕載入動畫

- [ ] **觸發時機**：僅在 `/login` 頁面送出登入表單後出現，取代整個頁面內容（`fixed inset-0 z-[200]`，全黑背景），直到登入結果確定並完成動畫才消失
- [ ] 背景裝飾：中央大型漸層模糊光暈（紫/藍/青，脈動動畫）、四角落光點、**30 個隨機浮動粒子**（青色小圓點，各自不同大小/速度/透明度，用 seeded random 產生）、**8 條電路線**（由中心呈放射狀展開，每 45 度一條，動畫延展＋線末端節點發光浮現）
- [ ] Logo 區：「FRC」（白→紫→藍漸層字，脈動發光陰影動畫）疊「6998」（紫→粉→青漸層字，延遲 0.5 秒的脈動發光）
- [ ] 「UNIPARDS」文字**逐字母淡入**效果（每 100ms 顯示一個字母，搭配上移＋淡入過場）
- [ ] 裝飾分隔線（線—圓點—線，圓點持續脈動發光）
- [ ] 4 個載入步驟清單（垂直排列，每項左側有圓形狀態指示）：
  - [ ] 步驟 1：「驗證身份」／「Authenticating」
  - [ ] 步驟 2：「載入使用者資料」／「Loading user data」
  - [ ] 步驟 3：「準備儀表板」／「Preparing dashboard」
  - [ ] 步驟 4：「同步最新資訊」／「Syncing information」
  - [ ] 每個步驟三種視覺狀態：未開始（灰色空心圓）／進行中（青色圓圈＋`Loader2` 旋轉圖示＋文字後方跳動的「...」）／已完成（綠色實心圓＋白色勾勾 `Check` 圖示，文字轉綠色）
- [ ] 進度條（0–100%）：
  - [ ] 填充漸層：紫→青→綠
  - [ ] 上有一道「光澤」掃過動畫（shimmer，2 秒一輪）
  - [ ] 下方左側文字：`t("載入中","Loading")`；右側顯示即時百分比數字（等寬字型、青色，如「42%」）
  - [ ] **進度邏輯**：登入請求（`loginPromise`）尚未完成時，每 50ms +1%，最多推進到 80% 就停住等待；`loginPromise` resolve 後（不論成功失敗）切換為每 30ms +5% 快速衝到 100%
  - [ ] 4 個步驟的「目前第幾步」是由目前進度百分比換算（`floor(progress/100 * 4)`），非各自獨立計時
- [ ] 趣味小提示輪播（進度條下方，每 3 秒切換一則，淡入淡出＋位移過場），逐字文案：
  - [ ] 中文：「💡 你知道嗎？FRC 6998 UNIPARDS 來自台灣！」／「🤖 機器人賽季充滿挑戰與創意」／「💰 透明的財務管理讓團隊更有效率」／「🏆 每一筆支出都是邁向冠軍的一步」／「⚡ 報帳系統讓財務流程更順暢」
  - [ ] 英文：「💡 Did you know? FRC 6998 UNIPARDS is from Taiwan!」／「🤖 Robotics season is full of challenges and creativity」／「💰 Transparent finance makes team more efficient」／「🏆 Every expense is a step towards championship」／「⚡ This system streamlines financial workflows」
- [ ] **完成行為**：當 `progress` 達到 100% 且登入結果已知時，延遲 300ms 後呼叫 `onComplete(loginResult)`（由呼叫端 /login 頁決定導向 dashboard 或退回顯示錯誤）
- [ ] 全程**沒有任何可點擊的按鈕或連結**，使用者無法跳過或取消這個動畫
- [ ] 沒有 empty 狀態；沒有獨立的 error 顯示（失敗訊息由呼叫端 /login 頁在動畫結束後接手顯示）

**使用的共用元件：** 無（獨立全螢幕元件）

**呼叫的 server actions：** 無（透過 props 接收外部傳入的 `loginPromise`，本身不發起登入請求）

---

## 元件：ClawSvg（components/transitions/claw-svg.tsx）

- [ ] 純 SVG 圖形元件（viewBox `0 0 200 300`），描繪「豹爪剪影」：4 根爪指（由左至右 4 個 path，形狀微彎、往下延伸）＋ 1 個掌心形狀，全部填滿白色
- [ ] 套用發光濾鏡（`feGaussianBlur` + `feMerge`），讓整個爪子形狀帶有柔和白色光暈
- [ ] 純展示用元件，接受 `className`、`style` props 供外部控制大小/定位/動畫
- [ ] 本身沒有動畫，動畫效果由使用它的 `TransitionButton` 透過外部 CSS transform/transition 控制

**使用的共用元件：** 無

**呼叫的 server actions：** 無

---

## 元件：TransitionButton（components/transitions/transition-button.tsx）／「豹爪撕紙」轉場動畫（首頁「進入系統」按鈕）

**這是全站視覺最複雜、改版時最容易被遺漏的效果，以下逐階段詳細描述：**

- [ ] **閒置狀態**：白底黑字圓角大按鈕，文字「進入系統」／「Enter System」＋右箭頭圖示，hover 時放大 1.05 倍
- [ ] 點擊後按鈕立即 `disabled`（動畫期間無法再次點擊），依序經過 3 個階段：
  - [ ] **階段一「claw-enter」（0–300ms）**：一隻豹爪（`ClawSvg`，旋轉 135 度、紫色發光陰影）從畫面左上角外側（`top:-80px; left:-80px`）飛入定位，象徵爪子抓住畫面
  - [ ] **階段二「pulling」（300ms–2300ms，共 2 秒，使用 easeInOutCubic 緩動）**：
    - [ ] 畫面沿著「反斜線」方向（右上→左下）被撕開：使用動態計算的鋸齒狀 `clip-path polygon`（多層正弦波疊加＋隨機尖刺＋偶發大型撕裂，模擬真實紙張纖維斷裂的不規則邊緣，**不是**簡單直線撕裂）
    - [ ] 撕開後底下露出的是**登入頁面的完整靜態複製畫面**（左側 hero「FRC/6998/UNIPARDS」、右側「歡迎回來」表單外觀，但欄位是純展示用的假輸入框——顯示 placeholder 文字「name@example.com」「輸入密碼」，不是真正可輸入的 `<input>`，登入按鈕文字為「登入 →」也只是靜態 div）
    - [ ] 被撕開、往旁移除的那層則是**首頁本身的完整靜態複製畫面**（FRC 6998 大標題、「進入系統」/「了解更多」兩個按鈕的靜態外觀、頁尾「服務條款」「隱私政策」文字；**注意頁尾版權文字在這個複製畫面裡寫死為「© 2024 FRC6998 保留所有權利。」——與實際首頁 `footer_rights` 顯示的「© 2026」不一致**）
    - [ ] 豹爪會沿著撕裂線中點持續跟著移動
    - [ ] 撕裂邊緣有多層發光線條特效（外層柔光模糊 15px、中層 8px、內層 3px、動態漸層核心線紫↔藍每 2 秒變色循環、最內層純白細線）
    - [ ] 撕裂線周邊隨機噴發約 25 個「碎紙粒子」（大小/角度/速度隨機、紫藍白漸層色、帶閃爍動畫與發光陰影）＋額外 15 個較小的純白「火花」粒子
    - [ ] 撕裂邊緣有陰影漸層效果模擬紙張立體翻捲的深度感
  - [ ] **階段三「done」（2500ms 時觸發）**：清除所有計時器/動畫幀，執行 `window.location.href = "/login"`（**整頁硬導向，不是 client-side 路由跳轉**）
- [ ] **例外處理**：動畫進行中若使用者切走分頁又切回來（`visibilitychange` 事件），動畫會自動重置回閒置狀態（避免卡在動畫中間動彈不得）
- [ ] 元件卸載時會清除所有 timeout 與 requestAnimationFrame，避免記憶體洩漏
- [ ] 每次點擊都會重新產生一組隨機種子（`jaggedSeed`），所以撕裂鋸齒形狀每次略有不同，但同一次動畫過程中形狀保持一致

**使用的共用元件：**
- Button（components/ui/Button）
- ClawSvg
- 內部私有子元件（僅此檔案使用）：`TearEdgeLine`（撕裂發光邊緣線）、`ClawOverlay`（爪子跟隨撕裂線移動的定位邏輯）

**呼叫的 server actions：** 無（`window.location.href` 整頁導向 `/login`）

---

## 元件：transitions/index.ts（barrel 匯出檔）

- [ ] 純轉出檔，無 UI，內容為 `export { ClawSvg } from "./claw-svg"` 與 `export { TransitionButton } from "./transition-button"`
- [ ] 改版時若要尋找「豹爪撕紙動畫」相關程式碼，可以從這個檔案的匯出找到入口，是核對是否有遺漏轉場動畫的重要提示點

**使用的共用元件：** 不適用
**呼叫的 server actions：** 不適用

---

## 元件：ErrorBoundary（components/error-boundary.tsx）／React 錯誤邊界，捕捉子元件渲染錯誤

- [ ] Class Component，`componentDidCatch` 捕捉錯誤後 `console.error("ErrorBoundary caught:", error, errorInfo)`，並呼叫外部傳入的 `onError` callback（若有）
- [ ] 若外部有傳 `fallback` prop，錯誤時直接渲染該自訂內容，**不會**顯示以下預設 UI
- [ ] **預設錯誤畫面**（無自訂 fallback 時）：
  - [ ] 置中卡片（最小高度 400px）
  - [ ] 紅色圓形背景的警告三角形圖示（`AlertTriangle`）
  - [ ] 標題文字：「發生錯誤」
  - [ ] 說明文字：「系統發生了一些問題，請嘗試重新整理頁面或返回首頁。」
  - [ ] **開發模式限定**（`NODE_ENV === "development"`）：可展開的 `<details>` 區塊，標題「錯誤詳情 (開發模式)」，展開後以紅字等寬字顯示 `error.toString()` 及 component stack
  - [ ] 兩個按鈕：
    - [ ] 「重試」（`RefreshCw` 圖示）— 點擊呼叫 `handleReset()`，把 `hasError` 重設為 `false`（**只是讓 boundary 重新嘗試渲染子元件，不是重新整理整個瀏覽器頁面**）
    - [ ] 「返回首頁」（`Home` 圖示）— `<a href="/dashboard">`（**注意：文字寫「返回首頁」但實際連結目標是 `/dashboard` 而不是網站根目錄 `/`**）
- [ ] 本次盤點範圍內**沒有任何頁面/檔案直接使用**這個 `ErrorBoundary`（`app/layout.tsx` 沒有用它包裹 `children`），實際使用位置需在 dashboard 相關檔案中確認

**使用的共用元件：** 無

**呼叫的 server actions：** 無

---

## 元件：OfflineIndicator（components/error-boundary.tsx 內的附屬元件）

- [ ] Props：`isOnline`；為 `true` 時完全不渲染（回傳 `null`）
- [ ] 離線時（`isOnline === false`）顯示：畫面下方置中浮動膠囊（`fixed bottom-4`，滑入動畫 `slide-in-from-bottom-4`），黃底黃字，內含脈動黃色小圓點＋文字「您目前離線，部分功能可能無法使用」
- [ ] 本次盤點範圍內未見任何頁面/檔案呼叫此元件

**使用的共用元件：** 無
**呼叫的 server actions：** 無

---

## 元件：DraftRestorePrompt（components/error-boundary.tsx 內的附屬元件）

- [ ] Props：`show`、`onRestore`、`onDismiss`；`show=false` 時完全不渲染
- [ ] 顯示時：畫面右下角浮動卡片（`fixed bottom-4 right-4`，滑入動畫 `slide-in-from-right-4`）
  - [ ] 標題（粗體）：「發現未儲存的草稿」
  - [ ] 說明文字（灰色小字）：「系統偵測到您上次編輯的內容尚未儲存，是否要恢復？」
  - [ ] 按鈕「恢復草稿」（主色按鈕）— `onClick={onRestore}`
  - [ ] 按鈕「捨棄」（外框按鈕）— `onClick={onDismiss}`
- [ ] 本次盤點範圍內未見任何頁面/檔案呼叫此元件（推測用於報帳表單的草稿暫存功能，屬 dashboard 範圍）

**使用的共用元件：** 無
**呼叫的 server actions：** 無

---

## 元件：changePassword server action（app/actions/password.ts）／**在本次盤點頁面範圍內找不到任何呼叫處**

- [ ] `app/login`、`app/register` 等本次盤點的頁面**皆未呼叫**這支 server action；推測是給 dashboard 內的「個人資料/設定」頁修改密碼用（該頁不在本次盤點清單內），**請負責 dashboard 範圍的人確認是否有對應表單 UI，並列入清單**
- [ ] 驗證規則：
  - [ ] 目前密碼必填，錯誤：「請輸入目前密碼」
  - [ ] 新密碼使用共用 `passwordSchema`（`lib/schemas.ts`）：至少 8 字元「密碼至少需要 8 個字元」＋須含英文字母「密碼必須包含至少一個英文字母」＋須含數字「密碼必須包含至少一個數字」（**這支 action 有正確 import 共用 schema，與 `register.ts` 自己另外定義規則的做法不同，是全站兩種驗證訊息來源並存的證據**）
  - [ ] 確認新密碼必填，錯誤：「請確認新密碼」
  - [ ] 新密碼與確認密碼不一致時：「新密碼與確認密碼不一致」
- [ ] 未登入（無 session）→ `{success:false, message:"未授權的操作"}`
- [ ] 驗證失敗 → `{success:false, message:"驗證失敗", errors:{...}}`
- [ ] 找不到使用者/使用者無密碼 → `{success:false, message:"無法驗證用戶"}`
- [ ] 目前密碼輸入錯誤 → `{success:false, message:"目前密碼不正確"}`
- [ ] 成功（bcrypt cost 12 雜湊）→ `{success:true, message:"密碼已成功更新"}`
- [ ] 未預期例外（`console.error`）→ `{success:false, message:"更新密碼時發生錯誤"}`

**使用的共用元件：** 不適用（無 UI，純 server action）
**呼叫的 server actions：** 本身即為 server action，本次盤點頁面範圍內未被呼叫

---

## 元件：LanguageProvider / useLanguage（lib/language-context.tsx）／全站雙語系統

- [ ] 提供 `language`（`"zh"|"en"`）、`setLanguage(lang)`、`t(key)` 三個值，透過 React Context 全站共用
- [ ] 預設語言：`"zh"`（繁體中文）
- [ ] 語言選擇持久化在 `localStorage`（key: `"language"`），重新整理後會記住上次選擇
- [ ] 有處理 SSR/hydration mismatch：`mounted` 狀態為 `false` 前，直接渲染 `children`（不包 Provider），避免伺服器端與客戶端渲染的語言不一致而閃爍
- [ ] `t(key)` 查表邏輯：找不到對應 key 時，直接把 key 原字串顯示出來（沒有 fallback 文字或警告，等於直接把程式碼變數名稱曝露給使用者看）
- [ ] 另外匯出 `getTranslation(lang, key)` 給 server component 使用（不透過 Context）
- [ ] `useLanguage()` 在 Provider 外使用時**不會報錯**，會回傳一組預設值（`language:"zh"`、`setLanguage` 為空函式、`t` 使用中文字典）
- [ ] 翻譯字典依用途分類（原始碼內以註解分區），中英文各約 240 組 key。本次盤點範圍內已使用到的 key，已在對應頁面區塊逐字列出；以下分類為**尚未在本次盤點頁面出現、但字典中確實存在**的 key 群組，供其他負責 dashboard 範圍的人核對用（可直接查此檔案取得逐字文案，此處不重複展開每一組文字）：
  - [ ] Common/Navigation（儀表板、我的花費、審核、所有報表、個人資料、設定、登出、載入中... 等）
  - [ ] Dashboard 頁專用（報帳單數量、花費項目數、總金額、近期報表、還沒有報帳單等）
  - [ ] Expenses（花費）頁專用（提交審核、確認提交/刪除文案、報帳單已提交/已刪除等）
  - [ ] Profile（個人資料）頁專用（用戶 ID、角色、帳戶建立時間、報帳統計、Session 資訊等）
  - [ ] Settings（設定）頁專用（語言設定、通知設定、電子郵件通知、帳戶設定、登出說明等）
  - [ ] User Management（用戶管理）頁專用（編輯 Email、更改密碼、更改角色、驗證 Email、刪除用戶等操作文字）
  - [ ] Reports（報表）頁專用（全部/待審核/已核准/已拒絕篩選文字等）
  - [ ] 狀態文字（status_draft/pending_manager/pending_finance/approved/rejected/paid 等）
  - [ ] 角色文字（role_user/role_manager/role_finance/role_admin — **注意這裡的角色 key 只有 4 種，與任務背景所述 Prisma Role enum 的 5 種角色（USER/VICE_LEADER/LEADER/FINANCE/ADMIN）對不上，沒有看到 VICE_LEADER 對應的翻譯 key，值得請 dashboard 負責人特別確認**）
  - [ ] 費用類別（category_food/transport/housing/entertainment/utilities/health/other）
  - [ ] 通用操作（submit/cancel/save/delete/edit/view/approve/reject/close）
  - [ ] 通用訊息（success/error/confirm_delete/operation_failed 等）
  - [ ] Approvals（審核）頁專用（含 `pending_count` 使用 `{count}` 佔位符的字串樣板，例如中文「你有 {count} 個待審核的報帳單」）
- [ ] **重大發現：字典中有兩大段內容疑似「孤兒翻譯」——字典裡確實存在完整雙語文案，但本次盤點到的實際頁面程式碼完全沒有引用這些 key**，強烈建議改版前先確認這些內容是否該保留/復原/刪除：
  - [ ] 「// About Page」分類（約 28 個 key）：完整的通用 SaaS 行銷文案，且**產品名稱寫的是「Ultimate Expense」而非「FRC 6998」／「BudgetFlow」**，內容包括：
    - [ ] `why_choose_us`「為什麼選擇 Ultimate Expense？」／`about_desc`「我們致力於簡化企業報帳流程，讓財務管理變得更簡單、更高效」／`back_home`「返回首頁」
    - [ ] 功能特色 6 組（各含標題＋說明）：`feature_fast`「快速報帳」/「只需幾分鐘即可提交報帳單，支援收據拍照上傳」、`feature_approval`「多級審核」/「從主管到財務，完整的審核流程確保合規性」、`feature_secure`「安全可靠」/「企業級安全防護，資料加密存儲」、`feature_reports`「即時報表」/「視覺化報表讓您隨時掌握公司支出狀況」、`feature_quick`「快速審批」/「平均審批時間縮短 80%，加速資金週轉」、`feature_auto`「自動化流程」/「自動通知、自動分類、智能匹配政策」
    - [ ] 數字統計區塊：`numbers_speak`「數字說話」、`numbers_desc`「我們的客戶信任我們處理他們的財務流程」、`active_users`「活躍用戶」、`enterprise_clients`「企業客戶」、`system_uptime`「系統穩定度」、`avg_approval_time`「平均審批時間」
    - [ ] 「如何運作」三步驟區塊：`how_it_works`「如何運作」、`simple_steps`「只需三個簡單步驟」、`step1_title`「提交報帳」/`step1_desc`「填寫費用明細，上傳收據照片」、`step2_title`「等待審核」/`step2_desc`「主管和財務會收到通知並進行審核」、`step3_title`「完成付款」/`step3_desc`「審核通過後，費用將快速撥付」
    - [ ] CTA 區塊：`ready_to_start`「準備好開始了嗎？」、`cta_desc`「立即註冊，體驗更高效的報帳流程」、`free_register`「免費註冊」
    - [ ] 這整組內容形狀（功能特色網格＋統計數字＋三步驟流程＋CTA）明顯是**舊版 /about 頁面**的設計，已被目前的雜誌風格時間軸頁面取代
  - [ ] 「// Landing Page」分類中部分 key 同樣未被目前首頁使用：`expense_system`「報帳系統」、`sign_in`「登入」、`hero_title`「報帳管理。更簡單。」/「Expense Management. Perfected.」、`hero_desc`「簡化審批流程，即時追蹤支出，更快獲得報銷。」/「Streamline approvals, track spending in real-time, and get reimbursed faster than ever before.」、`get_started`「開始使用」/「Get Started」（該分類中只有 `learn_more`、`footer_rights`、`terms`、`privacy` 有被目前首頁實際使用）

**使用的共用元件：** 不適用（Context Provider）
**呼叫的 server actions：** 無（純前端 state + localStorage）

---

## 元件：ThemeProvider / useTheme（lib/theme-context.tsx）／深色模式系統

- [ ] 提供 `theme`（`"light"|"dark"`）、`toggleTheme()`
- [ ] 預設值：`"dark"`
- [ ] 掛載時讀取邏輯：先看 `localStorage.getItem("theme")`，若無則檢查系統偏好 `window.matchMedia("(prefers-color-scheme: dark)")`
- [ ] 每次 `theme` 變動：移除 `<html>` 上的 `light`/`dark` class 後重新加上目前值，並寫回 `localStorage`
- [ ] `useTheme()` 若在 Provider 外使用會直接 `throw new Error`（與 `useLanguage()` 遇到同樣情況會回傳預設值、不會噴錯的行為不同，是個不一致點）
- [ ] **重大發現：本次盤點的 18 個檔案中，沒有任何一處呼叫 `useTheme()` 或 `toggleTheme()`**——也就是說目前找不到任何「切換深色模式」的按鈕/開關 UI。`ThemeProvider` 確實包在 `app/layout.tsx` 最外層（見 RootLayout 區塊），基礎設施存在，但看不到使用者可操作的入口。可能藏在 dashboard 的「設定」頁（不在本次盤點範圍），**需請負責該頁的人確認並補上**；若真的沒有任何 UI 呼叫，改版時要決定是否要把這功能實際做出來，或乾脆移除這層 Provider
- [ ] **連帶發現**：本次盤點到的公開頁面（首頁 `/`、`/login`、`/register`、`/about`）視覺上都是**寫死的黑底白字**（`bg-black text-white`），並沒有使用 Tailwind 的 `dark:` 前綴或 `bg-background` 這類主題感知 class，所以就算真的有地方能切換 `theme` 狀態，這幾頁的外觀也不會跟著變化；只有 `/privacy`、`/terms` 兩頁使用 `bg-background`／`text-muted-foreground`（主題感知的 CSS 變數），理論上會跟著 `theme` 變動

**使用的共用元件：** 不適用（Context Provider）
**呼叫的 server actions：** 無（純前端 state + localStorage + DOM class 操作）

---

## 元件：NavigationProgressProvider / useNavigationProgress（lib/navigation-progress-context.tsx）／頁面切換進度條邏輯

- [ ] 提供狀態：`isNavigating`（bool）、`progress`（0–100 數字）、`targetPath`，以及方法 `startNavigation(path)`、`completeNavigation()`
- [ ] 這個檔案**只包含狀態機邏輯，沒有任何視覺渲染**；實際畫出進度條的是 `components/navigation` 裡的 `NavigationProgressBar`（在 `app/layout.tsx` 全域引入，**此元件本身超出本次盤點範圍**，需另外核對其顏色/粗細/位置等視覺樣式）
- [ ] 進度模擬邏輯：呼叫 `startNavigation(path)` 後，進度立刻跳到 10%，之後每 150ms 依序推進到 30% → 50% → 70% → 90%（共 5 個預設檔位，最後停在 90% 等待）
- [ ] 當目前路由（`usePathname()`，經過去除結尾斜線的正規化）等於 `targetPath` 時，自動觸發 `completeNavigation()`：進度跳到 100%，200ms 後重置所有狀態（`isNavigating=false`、`progress=0`、`targetPath=null`）
- [ ] `useNavigationProgress()` 在 Provider 外使用會直接 `throw new Error`
- [ ] 本次盤點的 18 個檔案中，沒有任何一處直接呼叫 `startNavigation()`（推測由 `components/navigation` 內的 Link 包裝元件呼叫，超出本次盤點範圍）

**使用的共用元件：** 不適用（Context Provider，實際視覺元件 `NavigationProgressBar` 超出範圍）
**呼叫的 server actions：** 無

---

# 二、Dashboard 殼層與首頁

## 路由：/dashboard/*（layout.tsx）／保護所有 dashboard 路由，提供側邊欄與頁首共用框架

檔案：`app/dashboard/layout.tsx`

- [ ] Server Component（async function），是所有 `/dashboard/*` 路由共用的 layout
- [ ] 讀取 cookie `sidebar:state`：值不等於字串 `"false"` 時 `defaultOpen = true`（側邊欄預設展開），否則收合
  - [ ] cookie 由 `components/ui/sidebar.tsx` 的 `SidebarProvider`／`setOpen` 寫入，max-age 7 天（60*60*24*7 秒）
- [ ] 呼叫 `auth()`（NextAuth v5）取得 session
  - [ ] 若 `!session?.user`，執行 `redirect("/login")`（伺服器端直接完成，使用者不會看到 dashboard 畫面閃現；此路由沒有 loading.tsx）
- [ ] 從 `session.user` 解構：`name`（預設 null）、`email`（預設 null）、`image`（預設 null）、`role`（**預設字串 "USER"**）
- [ ] `userDepartment` 額外從 `(session.user as { department?: string }).department` 取得，預設 `null`
- [ ] **重要**：layout 本身只檢查「有沒有登入」，不做任何角色（role）層級的路由阻擋；角色相關的限制只發生在 `AppSidebar` 選單項目的顯示/隱藏（純 UI 隱藏，不是路由保護）——代表若使用者直接輸入網址，仍可能進入選單未顯示的頁面（該頁面自己是否有角色檢查不在本次盤點檔案範圍內）
- [ ] 版面結構（由外到內）：
  - [ ] `SidebarProvider defaultOpen={defaultOpen}`
    - [ ] `AppSidebar`（傳入 `userRole`／`userDepartment`／`userImage`／`userName`／`userEmail`）
    - [ ] `SidebarInset`
      - [ ] `DashboardWrapper`（導覽中會整體淡化，見下方元件說明）
        - [ ] `DashboardHeader`（傳入 `userName={userName || userEmail || "User"}`）
          - [ ] 子節點：`SidebarTrigger className="-ml-1"`（側邊欄收合/展開按鈕，渲染在 header 最左側）
        - [ ] `<div className="flex flex-1 flex-col gap-4 p-4 pt-4">{children}</div>`（實際頁面內容容器，統一 padding）
- [ ] 沒有任何 loading/skeleton UI：這是 async Server Component，資料完全就緒前瀏覽器不會渲染任何 dashboard 畫面（無 Suspense fallback）
- [ ] 沒有 error 處理：`auth()` 若拋出例外，沒有 error.tsx 可攔截（全站無 error.tsx），會落到 Next.js 預設錯誤畫面

使用的共用元件：
- `SidebarInset`、`SidebarProvider`、`SidebarTrigger`（`components/ui/sidebar.tsx`）
- `AppSidebar`（`components/app-sidebar.tsx`）
- `DashboardHeader`、`DashboardWrapper`（`components/dashboard-header.tsx`）

呼叫的 server actions／認證函式：
- `auth()`（`@/auth`，NextAuth v5 session 讀取，非 mutation）
- 無任何 `app/actions/*` server action 呼叫

---

## 路由：/dashboard（page.tsx）／儀表板首頁：資料查詢與角色過濾

檔案：`app/dashboard/page.tsx`

- [ ] Server Component（async function）
- [ ] 呼叫 `auth()`；`!session?.user` 時 `redirect("/login")`
- [ ] `userId = session.user.id`；`role = session.user.role || "USER"`；`userName = session.user.name || session.user.email || "User"`
- [ ] `buildWhereClause(role, userId)`：依角色決定「近期報表」清單的 Prisma where 條件
  - [ ] `role === "ADMIN"` → `{}`（不過濾，看得到全部報表）
  - [ ] `role === "FINANCE"` → `OR: [{submitterId: userId}, {status: "PENDING_FINANCE"}, {status: "PAID"}]`
  - [ ] `role === "MANAGER"` → `OR: [{submitterId: userId}, {status: "PENDING_MANAGER"}]`
    - [ ] ⚠️ **發現的程式錯誤／死程式碼**：Prisma `Role` enum 實際只有 `USER / VICE_LEADER / LEADER / FINANCE / ADMIN` 五種值，**沒有 `"MANAGER"` 這個角色**，此 case 永遠不會命中
    - [ ] 因此 `LEADER`（組長）與 `VICE_LEADER`（副組長）角色在儀表板首頁的「近期報表」實際上會落入下面的 `default` 分支，跟一般 `USER` 一樣**只看得到自己提交的報表**，看不到待審核中的組內報表（即使他們理論上有審核權限）——重新設計時要特別注意是否要保留此行為或修正
  - [ ] 其他（含 `USER`／`VICE_LEADER`／`LEADER`）→ `{ submitterId: userId }`（只看自己提交的報表）
- [ ] `Promise.all` 平行查詢三組資料：
  - [ ] `prisma.expenseReport.findMany`：`where: whereClause`、`include: { submitter: {select:{name,email}}, items: true }`、`orderBy: {createdAt:"desc"}`、`take: 10`
    - [ ] ⚠️ **只取最新 10 筆**：後面 DashboardContent 顯示的「報表數量」「花費項目數」「總金額」「待審核」「已完成」統計數字全部只根據這批「最多 10 筆」資料計算，並非使用者/系統的真實總數——如果實際報表超過 10 筆，統計卡片數字會被截斷、不等於真實總數
  - [ ] `getFinancialSummary()`（`app/actions/funding.ts`）
  - [ ] `getFundingRecords()`（`app/actions/funding.ts`）
- [ ] `totalAmount = reports.reduce(...totalAmount)`（同樣只加總這最多 10 筆報表，不是全系統總額）
- [ ] `canAddFunding = role === "FINANCE" || role === "ADMIN"`（決定要不要顯示新增資金按鈕與財務摘要卡片，往下傳給 `DashboardContent`）
- [ ] 將 `userName`、`role`、`reports`、`totalAmount`、`financialSummary`、`fundingRecords`、`canAddFunding` 全部以 props 傳給 `<DashboardContent>`（實際畫面見下方元件區塊）
- [ ] 沒有 loading/error/empty 的頁面層處理：`getFinancialSummary`/`getFundingRecords` 內部有 try/catch，失敗會靜默回傳 0／[]；但 `prisma.expenseReport.findMany` 沒有 try/catch，失敗會直接讓整個 Server Component 拋錯（落到 Next.js 預設錯誤畫面，全站無 error.tsx）

使用的共用元件：
- `DashboardContent`（`components/dashboard-content.tsx`）

呼叫的 server actions：
- `getFinancialSummary()`（`app/actions/funding.ts`）
- `getFundingRecords()`（`app/actions/funding.ts`）
- 直接呼叫 `prisma.expenseReport.findMany`（非透過具名 server action，直接寫在頁面內的 Prisma 查詢）
- `auth()`（`@/auth`）

---

## 元件：DashboardContent／儀表板首頁 UI（Bento Grid 統計卡片、近期報表列表、快捷操作）

檔案：`components/dashboard-content.tsx`（Client Component，`"use client"`）

Props：`userName`、`role`、`reports[]`、`totalAmount`、`financialSummary{totalIncome,totalExpense,currentBalance}`、`fundingRecords[]`、`canAddFunding`

### 頁首區塊
- [ ] 大標題：`{t("dashboard")}` → 中「儀表板」／英「Dashboard」，字級 `text-3xl font-bold`
  - [ ] 標題右側固定顯示 `Sparkles` icon，`animate-pulse` 動畫（持續閃爍，非互動）
- [ ] 副標文字：`{t("welcome_back")}, {userName}` → 「歡迎回來, {userName}」／「Welcome back, {userName}」（userName 部分用 `font-medium text-foreground` 強調）
- [ ] 右側操作區（`flex gap-2`）：
  - [ ] **[僅 `canAddFunding`＝FINANCE／ADMIN 可見]** `<FundingDialog />` 按鈕（詳見下方「附註：FundingDialog」子項）
  - [ ] 「新增報帳單」連結按鈕：`{t("new_report")}` → 「+ 新增報帳單」／「+ New Report」，含 `ArrowRight` icon（hover 時向右滑動 `translate-x-1`），連到 `/dashboard/expenses/new`，圓角膠囊樣式（primary 底色，hover 有放大+陰影效果）

### Bento Grid 統計卡片（`grid-cols-1 md:grid-cols-6 lg:grid-cols-12`）

- [ ] **[僅 `canAddFunding` 可見]** 財務摘要卡（`md:col-span-6 lg:col-span-8 md:row-span-2`）＝ `<BalanceCard>`（詳見獨立元件區塊），傳入 `totalIncome`／`totalExpense`／`currentBalance`／`fundingRecords`
- [ ] 「報表」統計卡（`canAddFunding` 時 `lg:col-span-4`，否則 `md:col-span-2 lg:col-span-4`）
  - [ ] icon：`FileText`（primary 色）
  - [ ] 右上角小字：中「報表」／英「Reports」（元件內就地三元判斷，非 `t()` 字典）
  - [ ] 大數字：`{totalReports}`（＝ `reports.length`，最多 10）
  - [ ] 說明文字：`{t("total_reports")}` → 「報帳單數量」／「Total Reports」
- [ ] 「項目」統計卡（同上 colspan 規則）
  - [ ] icon：`Package`（accent 色）
  - [ ] 右上角小字：中「項目」／英「Items」
  - [ ] 大數字：`{totalItems}`（所有已抓取報表的 `items.length` 加總）
  - [ ] 說明文字：`{t("total_items")}` → 「花費項目數」／「Total Items」
- [ ] 「金額」統計卡（`canAddFunding` 時 `md:col-span-6 lg:col-span-8`，否則 `md:col-span-2 lg:col-span-4`）
  - [ ] icon：`DollarSign`（emerald 色）＋ 右上角 `TrendingUp` icon + 文字「金額」／「Amount」
  - [ ] 大數字：`formatCurrency(totalAmount)`，固定 emerald 綠字（不像 BalanceCard 會依正負變色）
  - [ ] 說明文字：`{t("total_amount")}` → 「總金額」／「Total Amount」
- [ ] 「待審核」迷你卡（`md:col-span-3 lg:col-span-2`）
  - [ ] icon：`Clock`（amber 色圓底）
  - [ ] 大數字：`{pendingCount}`（統計 `status === "PENDING_MANAGER" || "PENDING_FINANCE"` 的筆數）
  - [ ] 文字：中「待審核」／英「Pending」
- [ ] 「已完成」迷你卡（`md:col-span-3 lg:col-span-2`）
  - [ ] icon：`CheckCircle2`（emerald 色圓底）
  - [ ] 大數字：`{paidCount}`（統計 `status === "PAID"` 的筆數）
  - [ ] 文字：中「已完成」／英「Completed」
  - [ ] ⚠️ 注意：`REJECTED`／`RETURNED` 狀態的報表不計入「待審核」也不計入「已完成」，沒有專屬統計卡呈現這兩種狀態的數量
- [ ] 「近期報表」大卡（`md:col-span-6 lg:col-span-8 md:row-span-2`）
  - [ ] 卡片標題：`FileText` icon ＋ `{t("recent_reports")}` → 「近期報表」／「Recent Reports」
  - [ ] 標題右側「查看全部」連結：中「查看全部」／英「View All」＋ `ArrowRight` icon，連到 `/dashboard/expenses`
  - [ ] **Empty 狀態**（`reports.length === 0`）：
    - [ ] 置中的圓形淺灰底 `FileText` icon
    - [ ] 文字：`{t("no_reports")}` → 「還沒有報帳單」／「No expense reports yet」
    - [ ] 連結：「建立第一份報表」／「Create your first report」→ `/dashboard/expenses/new`
  - [ ] **有資料狀態**：顯示 `reports.slice(0, 5)`（即使抓了 10 筆，畫面只列前 5 筆）
    - [ ] 每列左側：`#{index+1}` 編號徽章（primary 淺底方塊）
    - [ ] 報表標題 `report.title`（截斷 truncate）
    - [ ] 提交者：`report.submitter?.name || report.submitter?.email`
    - [ ] 狀態徽章：icon＋文字，樣式來自元件內建 `DASHBOARD_STATUS_STYLES`（見下方「狀態徽章樣式」說明），文字來自 `getStatusLabel(report.status, language)`
    - [ ] 右側金額：`formatCurrency(Number(report.totalAmount))`
    - [ ] hover 時才出現的 `ArrowRight` icon（`opacity-0` → `opacity-100`）
    - [ ] 整列都是可點擊連結，但**點進去一律導到 `/dashboard/expenses`（報表列表頁），不是該筆報表的詳細頁**（沒有單筆報表 detail 連結）
- [ ] 「快捷操作」大卡（`md:col-span-6 lg:col-span-4 md:row-span-2`）
  - [ ] 卡片標題：`Sparkles` icon ＋ 中「快捷操作」／英「Quick Actions」
  - [ ] 動作一：`FileText` icon，標題 `{t("new_report")}`＝「+ 新增報帳單」／「+ New Report」，副標「建立新的報帳單」／「Create expense report」，連到 `/dashboard/expenses/new`
  - [ ] 動作二：`Package` icon，標題「我的報表」／「My Reports」，副標「查看所有報帳記錄」／「View all expense records」，連到 `/dashboard/expenses`
  - [ ] 動作三：`TrendingUp` icon，標題「個人設定」／「Profile Settings」，副標「更新個人資料」／「Update your profile」，連到 `/dashboard/profile`

### 狀態徽章樣式（`DASHBOARD_STATUS_STYLES`，元件內部自訂常數）
- [ ] ⚠️ **與全站標準狀態色不同**：本元件用自己一份 `DASHBOARD_STATUS_STYLES`（含 dark mode 變體），不是共用詞彙表列出的標準色（`bg-yellow-100 text-yellow-700` 等），而是：
  - [ ] `PENDING_MANAGER`：`bg-amber-500/20 dark:bg-amber-500/10` / `text-amber-600 dark:text-amber-400` / icon `AlertCircle`
  - [ ] `PENDING_FINANCE`：`bg-blue-500/20 dark:bg-blue-500/10` / `text-blue-600 dark:text-blue-400` / icon `Clock`
  - [ ] `PAID`：`bg-emerald-500/20 dark:bg-emerald-500/10` / `text-emerald-600 dark:text-emerald-400` / icon `CheckCircle2`
  - [ ] `REJECTED`：`bg-red-500/20 dark:bg-red-500/10` / `text-red-600 dark:text-red-400` / icon `AlertCircle`
  - [ ] ⚠️ **沒有 `RETURNED`（已退回）的樣式定義**：`getStatusStyle()` 找不到對應 key 時 fallback 成 `PENDING_MANAGER` 樣式；也就是「已退回」的報表在近期報表列表會顯示**正確的文字「已退回」，但顏色/icon 卻套用「待主管審核」的琥珀色＋`AlertCircle`**，視覺上會誤導使用者
- [ ] 語言判斷用元件內部就地三元判斷 `language === "zh" ? "中文" : "English"`，跟頁首標題等處使用的 `t()` 翻譯字典是兩套並存的機制（部分文字寫死在元件內，不在 `lib/language-context.tsx` 字典中，例如「報表」「項目」「金額」「快捷操作」等小標籤）

使用的共用元件：
- `BalanceCard`（`components/balance-card.tsx`）
- `FundingDialog`（`components/funding-dialog.tsx`，本次盤點檔案清單外，但因直接出現在此頁面而記錄其可見按鈕與彈窗內容，見下方附註）
- `useLanguage`（`lib/language-context.tsx`）
- `formatCurrency`、`FundingRecord` 型別（`lib/constants/funding.ts`）
- `getStatusLabel`、`Language` 型別（`lib/constants/expense-status.ts`）
- lucide-react icons：`FileText`、`Package`、`DollarSign`、`TrendingUp`、`Clock`、`CheckCircle2`、`AlertCircle`、`ArrowRight`、`Sparkles`

呼叫的 server actions：
- 無直接呼叫；透過子元件間接呼叫 `createFundingRecord`（`FundingDialog`）、`deleteFundingRecord`／`updateFundingRecord`（`BalanceCard`）

### 附註：FundingDialog（`components/funding-dialog.tsx`，因直接掛在本頁而記錄）
- [ ] 未開啟時：琥珀色按鈕「新增資金」＋ `Plus` icon
- [ ] 開啟後是一個 `fixed inset-0` 全螢幕黑色半透明遮罩＋置中白色卡片 modal（**注意：這裡沒有用 CLAUDE.md 提到的 `createPortal`，是否有 z-index 疊層問題需在重設計時留意**）
  - [ ] 標題：`DollarSign` icon ＋「新增資金記錄」，右上角 `X` 關閉按鈕
  - [ ] 表單訊息列（`state.message`，成功綠／失敗紅），文字直接來自 server action 回傳（見下方訊息清單）
  - [ ] 欄位「標題 *」（必填，placeholder「例如：XX公司贊助」），欄位錯誤文字 `state.errors?.title[0]`
  - [ ] 欄位「金額 (TWD) *」（number, step 0.01, min 0, placeholder「10000」, 必填），欄位錯誤文字 `state.errors?.amount[0]`
  - [ ] 欄位「類型 *」下拉選單（必填），選項來自 `FUNDING_TYPES`：贊助／捐款／補助金／募款活動／其他
  - [ ] 欄位「來源 (公司/個人)」（placeholder「贊助者名稱」）
  - [ ] 欄位「入帳日期」（date, 預設今天）
  - [ ] 欄位「備註」（textarea, placeholder「補充說明...」）
  - [ ] 按鈕「取消」（outline）／送出按鈕「確認新增」（pending 時顯示 `Loader2` 轉圈＋「提交中...」）
  - [ ] 成功後：500ms 後自動關閉 modal 並 `window.location.reload()`（整頁重新整理，非局部更新）
- [ ] 伺服器訊息逐字稿（來自 `app/actions/funding.ts` 的 `createFundingRecord`）：
  - [ ] 未授權：「未授權或權限不足」
  - [ ] 驗證失敗：「驗證失敗」（+ 個別欄位錯誤：「標題為必填」／「金額必須大於 0」）
  - [ ] 成功：「資金記錄已新增」
  - [ ] 失敗：「新增失敗，請稍後再試」

---

## 元件：DashboardHeader＋DashboardWrapper／頁首列與導覽淡化效果

檔案：`components/dashboard-header.tsx`（Client Component）

### DashboardHeader
- [ ] `sticky top-0 z-40` 固定頂部的頁首列，高度 `h-16`（側邊欄收合成 icon 模式時降為 `h-12`），底部有 1px 邊框，`header-glass` 毛玻璃背景樣式
- [ ] 左側內容：
  - [ ] `{children}`＝從 `dashboard/layout.tsx` 傳入的 `SidebarTrigger`（漢堡/收合按鈕，實際渲染細節見 `ui/sidebar.tsx` 區塊）
  - [ ] 一條 1px 垂直分隔線（手機版隱藏，`hidden sm:block`）
  - [ ] 歡迎文字：`{t("welcome_back")}, {userName}` → 「歡迎回來, {userName}」／「Welcome back, {userName}」（**手機版隱藏，`hidden sm:inline`**，userName 用 `text-foreground` 強調、其餘 muted）
- [ ] 右側內容：
  - [ ] 主題切換按鈕：
    - [ ] 圖示：深色模式時顯示 `Sun`（琥珀色 `text-amber-400`）；淺色模式時顯示 `Moon`（`text-slate-600`）
    - [ ] `title` tooltip：⚠️ **寫死中文，不吃 `t()` 翻譯**——深色時顯示「切換至淺色模式」，淺色時顯示「切換至深色模式」（英文介面下仍會顯示中文 tooltip）
    - [ ] `onClick` 呼叫 `useTheme().toggleTheme()`（`lib/theme-context.tsx`，light/dark 二態切換，存 localStorage `theme`）
  - [ ] `<LanguageSwitcher />`：
    - [ ] `Globe` icon ＋ 文字（中文介面顯示「EN」，英文介面顯示「中」）
    - [ ] `title` tooltip：「Switch to English」／「切換至中文」
    - [ ] 點擊切換 `zh`/`en`，存 localStorage `language`
- [ ] **沒有麵包屑（breadcrumb）**
- [ ] **沒有頁面標題文字**（頁面標題是在各頁面內容自己渲染，例如 DashboardContent 的「儀表板」大標，不在 header）
- [ ] **沒有使用者下拉選單／頭像選單**（使用者頭像、姓名、登出都只在側邊欄 Footer，header 完全沒有使用者相關 UI）
- [ ] **沒有通知鈴鐺／未讀通知圖示**

### DashboardWrapper
- [ ] 包住 `DashboardHeader` + 頁面內容整體的容器
- [ ] 讀取 `useNavigationProgress().isNavigating`
- [ ] 導覽中（`isNavigating === true`）：整個容器 `opacity-50 pointer-events-none`（半透明＋禁止互動）
- [ ] 非導覽中：`opacity-100`
- [ ] `transition-opacity duration-200` 淡入淡出動畫
- [ ] 這是「頁面內容區」的載入視覺回饋機制之一，跟下面 `NavigationProgressBar` 的頂部進度條／貓咪動畫**同時**由同一個 `NavigationProgressContext` 觸發（見下方元件說明）

Loading／Empty／Error 狀態：
- [ ] Loading：無獨立 loading 動畫；視覺回饋完全依賴 `DashboardWrapper` 的 50% 透明化＋（全域掛載的）`NavigationProgressBar`
- [ ] Empty／Error：不適用（純展示性 header，資料都是 props 直接傳入或 context 同步值，不會有 empty/error 狀態）

使用的共用元件：
- `LanguageSwitcher`（`components/language-switcher.tsx`）
- `useLanguage`（`lib/language-context.tsx`）
- `useTheme`（`lib/theme-context.tsx`）
- `useNavigationProgress`（`lib/navigation-progress-context.tsx`）
- `cn`（`lib/utils.ts`）
- lucide-react icons：`Moon`、`Sun`（+ `LanguageSwitcher` 內部用 `Globe`）

呼叫的 server actions：
- 無

---

## 元件：AppSidebar／側邊導覽列（★ 本次盤點重點）

檔案：`components/app-sidebar.tsx`（Client Component）

Props：`userRole`、`userDepartment`、`userImage`、`userName`、`userEmail`（皆為可選，來自 `dashboard/layout.tsx` 傳入的 session 資料）

### 整體結構
- [ ] 使用 `<Sidebar collapsible="icon">`（見 `ui/sidebar.tsx` 區塊）：桌面版可收合成「僅圖示」窄欄（寬度 3rem），非完全隱藏；手機版（<768px）永遠是離屏抽屜（overlay + 滑入）
- [ ] 未指定 `variant` prop（預設 `"sidebar"`，不是 `"floating"`／`"inset"`），所以 `SidebarInset` 那些浮動邊距/圓角/陰影樣式實際上不會生效，是滿版貼齊的側邊欄
- [ ] 三段式結構：`SidebarHeader`（品牌 Logo）／`SidebarContent`（導覽選單）／`SidebarFooter`（使用者資訊＋登出）

### SidebarHeader（品牌／組織資訊，可點擊回首頁）
- [ ] 整塊包在 `NavigationLink href="/dashboard"`（點擊觸發導覽進度條，見下方 NavigationLink 說明）
- [ ] Logo 方塊：`org.bgColor`（`bg-gradient-to-br from-purple-600 to-blue-600`，來自 `useOrganization()`）圓角方塊，內含 `next/image` 顯示 `org.logo`（實際路徑 `/Gemini_Generated_Image_wkar2twkar2twkar.png`），24×24px
- [ ] 組織標題：`t(org.title, org.titleEn)`（此處 `t` 是 `AppSidebar` 內部自訂的 `t(zh, en)` 函式，依 `useLanguage().language` 切換，非 `lib/language-context.tsx` 字典）
  - [ ] 中文：「FRC 6998 報帳系統」
  - [ ] 英文：「FRC 6998 Expense System」
- [ ] 副標：`org.subtitle` 固定顯示「UNIPARDS」（不隨語言切換，只有單一值）

### SidebarContent（導覽選單，`MENU_ITEMS` 陣列，依序）

⚠️ 顯示規則函式 `isMenuItemVisible(item)`（逐條列出後方角色可見性即依此規則推算）：
```
if (!item.roles && !item.departments) return true
if (item.roles?.includes(role)) return true
if (item.departments && department && item.departments.includes(department)) return true
if (item.href === "/dashboard/expenses" && role !== "USER") return true
return false
```
（最後一條對 `/dashboard/expenses` 的特判其實跟它自己的 `roles` 清單效果重複，等於雙重保險，重設計時可以簡化成一條規則）

- [ ] **① 儀表板**（icon `LayoutDashboard`）→ `/dashboard`
  - [ ] 無 `roles`／`departments` 限制 → **所有角色可見**（USER／VICE_LEADER／LEADER／FINANCE／ADMIN）
- [ ] **② 我的花費**（icon `CreditCard`）→ `/dashboard/expenses`
  - [ ] `roles: ["VICE_LEADER","LEADER","FINANCE","ADMIN"]`
  - [ ] 可見：VICE_LEADER／LEADER／FINANCE／ADMIN；**隱藏：USER**
- [ ] **③ 庫存管理**（icon `Package`）→ `/dashboard/inventory`
  - [ ] `roles: ["FINANCE","ADMIN"]`，`departments: ["MECHANICAL"]`
  - [ ] 可見條件是「角色為 FINANCE/ADMIN」**或**「使用者組別為機構組 MECHANICAL」（兩條件為 OR，不需要同時滿足）
  - [ ] 也就是說：機構組（MECHANICAL）的 USER／VICE_LEADER／LEADER 也看得到這個選單，不限 FINANCE／ADMIN
  - [ ] 隱藏：非機構組的 USER／VICE_LEADER／LEADER
- [ ] **④ 審核**（icon `CheckSquare`）→ `/dashboard/approvals`
  - [ ] `roles: ["LEADER","FINANCE","ADMIN"]`
  - [ ] 可見：LEADER／FINANCE／ADMIN；**隱藏：USER、VICE_LEADER**
- [ ] **⑤ 資金記錄**（icon `Wallet`）→ `/dashboard/funding`
  - [ ] `roles: ["VICE_LEADER","LEADER","FINANCE","ADMIN"]`
  - [ ] 可見：VICE_LEADER／LEADER／FINANCE／ADMIN；**隱藏：USER**
- [ ] **⑥ 所有報表**（icon `FileText`）→ `/dashboard/reports`
  - [ ] `roles: ["FINANCE","ADMIN"]`
  - [ ] 可見：FINANCE／ADMIN；**隱藏：USER、VICE_LEADER、LEADER**
- [ ] **⑦ 數據分析**（icon `BarChart3`）→ `/dashboard/analytics`
  - [ ] `roles: ["FINANCE","ADMIN"]`
  - [ ] 可見：FINANCE／ADMIN；**隱藏：USER、VICE_LEADER、LEADER**
- [ ] **⑧ 用戶管理**（icon `Users`）→ `/dashboard/users`
  - [ ] `roles: ["ADMIN"]`
  - [ ] **只有 ADMIN 可見**
- [ ] **⑨ 個人資料**（icon `User`）→ `/dashboard/profile`
  - [ ] 無限制 → **所有角色可見**
- [ ] **⑩ 設定**（icon `Settings`）→ `/dashboard/settings`
  - [ ] 無限制 → **所有角色可見**

每個選單項目渲染細節：
- [ ] 文字依語言顯示 `labelZh`／`labelEn`
- [ ] `SidebarMenuButton` 的 `tooltip` prop＝該項目文字（渲染成原生 HTML `title` 屬性，滑鼠停留顯示；側邊欄收合成圖示模式時，文字被容器 `overflow-hidden`+固定窄寬裁掉，只能靠這個原生 tooltip 辨識）
- [ ] 目前所在頁面判斷 `isActive(href)`：`href === "/dashboard"` 時只比對完全相等 `pathname === "/dashboard"`；其他項目用 `pathname.startsWith(href)`（代表子路由如 `/dashboard/expenses/new` 也會讓「我的花費」保持高亮）
- [ ] active 狀態視覺：
  - [ ] 選單按鈕左側浮現一條 `w-1 h-6 bg-primary rounded-r-full` 的高亮短條（絕對定位、垂直置中）
  - [ ] icon 變成 `text-primary`
  - [ ] 文字變成 `font-medium text-primary`
  - [ ] 按鈕本身 className 切換為 `sidebar-item-active`（非 active 為 `sidebar-item`）
- [ ] 每個項目點擊都經過 `NavigationLink` 包裝（觸發頂部進度條＋貓咪動畫，見下方元件）

### SidebarFooter（使用者資訊＋登出）
- [ ] **使用者資訊區塊**（`NavigationLink href="/dashboard/profile"`，整塊可點擊連到個人資料頁）
  - [ ] 頭像：
    - [ ] 有 `userImage` 時：`next/image` 顯示頭像圖片，32×32px，圓形，`ring-2 ring-primary/20`（hover 變 `ring-primary/40`）
    - [ ] 無 `userImage` 時：改用漸層圓形色塊（`from-primary to-accent`）＋ `getInitials()` 文字（`(userName || userEmail || "U")` 取第一個字元、轉大寫；中文姓名會顯示姓氏的第一個中文字）
    - [ ] ⚠️ 頭像右下角固定顯示一個 `w-3 h-3 bg-emerald-500` 綠色圓點（有無頭像都會出現）——**這只是裝飾，不對應任何真實在線/離線狀態資料**，程式碼中沒有 presence／online 系統
  - [ ] 文字區：
    - [ ] 姓名：`userName`，缺值時 fallback 顯示 `t("未設定名稱", "No name")`
    - [ ] Email：`userEmail`（muted 灰字，截斷）
  - [ ] `tooltip`＝`userName || userEmail || t("用戶","User")`
  - [ ] ⚠️ **完全沒有顯示角色（role）文字或徽章，也沒有顯示組別（department）文字或 icon**——`userRole`／`userDepartment` 這兩個 props 在整個 `AppSidebar` 裡只被拿來做選單顯示/隱藏的邏輯判斷，從未真正渲染成畫面上看得到的文字或標籤（重新設計時如果要新增角色/組別徽章，這是全新功能，不是「保留原樣」）
- [ ] **登出按鈕**
  - [ ] icon `LogOut` ＋ 文字 `t("登出","Sign Out")` → 「登出」／「Sign Out」
  - [ ] 樣式：`text-destructive hover:text-destructive hover:bg-destructive/10`（紅色系）
  - [ ] `onClick` → `handleLogout()`：呼叫 `next-auth/react` 的 `signOut({ callbackUrl: "/login" })`
    - [ ] 失敗時：`console.error("Logout error:", error)`（僅開發者可見，非使用者可見訊息）＋ `window.location.href = "/login"`（強制導頁）
  - [ ] 沒有二次確認彈窗（點了立刻登出，不像刪除操作有 `confirm()`）

Loading／Empty／Error 狀態：
- [ ] Loading：無（資料都是同步 props，登出過程沒有 pending/spinner 視覺回饋）
- [ ] Empty：姓名／Email 缺值時的 fallback 文字如上（「未設定名稱」／`getInitials` 的 "U" 預設字）
- [ ] Error：登出失敗只寫 console，不會跳訊息給使用者，只是強制轉址

使用的共用元件：
- `NavigationLink`（`components/navigation`）
- `useLanguage`（`lib/language-context.tsx`）
- `useOrganization`（`lib/organization-context.tsx`）
- `Sidebar`、`SidebarContent`、`SidebarFooter`、`SidebarHeader`、`SidebarMenu`、`SidebarMenuButton`、`SidebarMenuItem`（`components/ui/sidebar.tsx`）
- `next/image`、`usePathname`（`next/navigation`）
- lucide-react icons：`BarChart3`、`CheckSquare`、`CreditCard`、`FileText`、`LayoutDashboard`、`LogOut`、`Package`、`Settings`、`User`、`Users`、`Wallet`

呼叫的 server actions：
- 無（`signOut()` 是 `next-auth/react` 提供的 client 端函式，不是本專案 `app/actions/*` 底下的 server action）

---

## 元件：NavigationLink／攔截點擊觸發導覽進度條的 Link 包裝

檔案：`components/navigation/navigation-link.tsx`（Client Component）

- [ ] 包裝 `next/link` 的 `<Link>`，介面與其相同（`ComponentProps<typeof Link>`）
- [ ] `onClick` 攔截邏輯：
  - [ ] 取得目標路徑（字串 href 或 `href.pathname`）
  - [ ] 若目標是 hash link（`#開頭`）→ **不觸發**進度條
  - [ ] 若正規化後目標路徑等於目前路徑（`normalizePath` 去除結尾斜線比對）→ **不觸發**進度條（避免點同一頁重複跑動畫）
  - [ ] 其餘情況才呼叫 `startNavigation(targetPath)`（來自 `useNavigationProgress`）
  - [ ] 呼叫完仍會執行外部傳入的原始 `onClick`（不會蓋掉呼叫端自訂行為）
- [ ] 全站在 `AppSidebar` 的每個選單項目、Logo、使用者資訊區都使用這個元件而非原生 `next/link`，確保側邊欄導覽都會觸發進度條視覺回饋

使用的共用元件：
- `next/link`、`usePathname`（`next/navigation`）
- `useNavigationProgress`、`normalizePath`（`lib/navigation-progress-context.tsx`）

呼叫的 server actions：
- 無

---

## 元件：NavigationProgressBar／頁面切換進度條與貓咪動畫

檔案：`components/navigation/navigation-progress-bar.tsx`（Client Component）
掛載位置：`app/layout.tsx`（**根 layout，全站掛載一次**，不是 dashboard 專屬，任何頁面導覽都會觸發，不限 `/dashboard/*`）

- [ ] `isNavigating === false` 時整個元件回傳 `null`（完全不渲染，平時畫面上看不到任何殘留元素）
- [ ] `isNavigating === true` 時同時渲染兩個視覺效果：
  - [ ] **頂部進度條**：
    - [ ] `fixed top-0 left-0 right-0 h-[3px] z-[100]`（貼齊視窗頂端的細長條，蓋在所有內容之上）
    - [ ] `role="progressbar"`，`aria-valuenow={progress}`、`aria-valuemin={0}`、`aria-valuemax={100}`、`aria-label="Page loading progress"`（英文寫死，未在地化）
    - [ ] 內層色條寬度＝`${progress}%`，漸層色 `from-purple-500 via-cyan-500 to-emerald-500`（紫→青→綠）
    - [ ] 有青色光暈陰影 `box-shadow: 0 0 10px rgba(34,211,238,0.5)`
    - [ ] 色條內再疊一層白色半透明「掃光」動畫（`animate-shimmer`，`background-size:200% 100%`，由左至右反覆掃過）
  - [ ] **中央走動貓咪動畫**：
    - [ ] `fixed inset-0 z-[99]`，`pointer-events-none`（不擋點擊）
    - [ ] 置中播放影片 `/loading-cat-v2.webm`（autoPlay/loop/muted/playsInline），尺寸 `w-80 h-80 object-contain`
    - [ ] `mix-blend-screen` 混合模式（讓黑色背景的影片與底色融合、只留亮部）
- [ ] 進度數值來源（`lib/navigation-progress-context.tsx`，非本次指定檔案但直接支配此元件行為，一併記錄）：
  - [ ] `startNavigation(path)` 時：立刻設 `progress=10`，之後每 150ms 依序跳到 `30 → 50 → 70 → 90`（`PROGRESS_STEPS = [10,30,50,70,90]`），到 90 之後停住等待
  - [ ] 當實際 `pathname` 正規化後等於目標路徑時（在 `NavigationProgressProvider` 的 `useEffect` 監聽 `usePathname()`），呼叫 `completeNavigation()`：`progress` 直接跳 100，200ms 後（`COMPLETION_DELAY_MS`）才把 `isNavigating` 設回 `false`（讓使用者看到跑滿的瞬間，不會卡在 90% 或瞬間消失）

Loading／Empty／Error 狀態：
- [ ] 本元件「就是」全站的 loading 視覺指示器（頂部條＋貓咪動畫），沒有另外的 empty／error 狀態；不渲染（`null`）即代表「非載入中」的預設/idle 狀態

使用的共用元件：
- `useNavigationProgress`（`lib/navigation-progress-context.tsx`）
- 靜態影片素材 `/loading-cat-v2.webm`

呼叫的 server actions：
- 無

---

## 元件：navigation/index.ts／導覽元件 barrel 匯出檔

檔案：`components/navigation/index.ts`

- [ ] 純粹的 re-export 檔案，本身沒有任何 UI，只有兩行：
  - [ ] `export { NavigationProgressBar } from "./navigation-progress-bar"`
  - [ ] `export { NavigationLink } from "./navigation-link"`
- [ ] `AppSidebar` 透過 `from "@/components/navigation"` 匯入 `NavigationLink` 即是走這個 barrel 檔

使用的共用元件：無（純匯出）

呼叫的 server actions：無

---

## 元件：BalanceCard／財務摘要卡片

檔案：`components/balance-card.tsx`（Client Component）

Props：`totalIncome`、`totalExpense`、`currentBalance`、`fundingRecords`（可選，預設 `[]`）

- [ ] 只在 `DashboardContent` 內、且 `canAddFunding`（角色 FINANCE／ADMIN）為真時才會被渲染（見上方 DashboardContent 區塊）
- [ ] 資料來源（皆為 `app/dashboard/page.tsx` 傳入的 props，源頭是）：
  - [ ] `totalIncome`／`totalExpense`／`currentBalance` ← `getFinancialSummary()`（`app/actions/funding.ts`）
    - [ ] `totalIncome` = `prisma.fundingRecord.aggregate({_sum:{amount:true}})`（**全系統所有資金記錄加總，不分使用者/組別**）
    - [ ] `totalExpense` = `prisma.expenseReport.aggregate({where:{status:"PAID"}, _sum:{totalAmount:true}})`（**只加總狀態為 PAID 的報表，全系統**）
    - [ ] `currentBalance = totalIncome - totalExpense`
  - [ ] `fundingRecords` ← `getFundingRecords()`：`prisma.fundingRecord.findMany({orderBy:{date:"desc"}, take:50})`（**最多 50 筆，全系統，非分頁**）

### 卡片主體
- [ ] 標題「財務摘要」（icon `Wallet`）
- [ ] **[僅 `fundingRecords.length > 0` 時顯示]** 「展開記錄」／「收起」切換按鈕（`ChevronDown`／`ChevronUp` icon）
- [ ] 「目前餘額」大數字：`formatCurrency(currentBalance)`
  - [ ] `currentBalance >= 0` → 綠字 `text-green-600`；否則 → 紅字 `text-red-600`（正負餘額顏色確實不同）
- [ ] 收入／支出兩欄：
  - [ ] 「總收入」：綠色圖示底（`TrendingUp`），數字固定綠字 `formatCurrency(totalIncome)`
  - [ ] 「總支出」：紅色圖示底（`TrendingDown`），數字固定紅字 `formatCurrency(totalExpense)`

### 展開後的資金記錄列表（`expanded && fundingRecords.length > 0`）
- [ ] 標題「資金記錄」
- [ ] 訊息列（本地 `message` state，非共用 `hooks/useMessage.ts`，見下方「訊息機制」附註）：成功綠底 `bg-green-50 text-green-700`／失敗紅底 `bg-red-50 text-red-700`
- [ ] 捲動容器 `max-h-64 overflow-y-auto`，列出全部（最多 50 筆）資金記錄，每筆：
  - [ ] 標題 `record.title`
  - [ ] 類型徽章：`getTypeLabel(record.type)`（贊助／捐款／補助金／募款活動／其他）
  - [ ] 副行：`formatDate(record.date)` ＋「‧」＋ `record.source || "未知來源"` ＋「‧」＋ `record.recordedBy`
  - [ ] 金額：`formatCurrency(record.amount)`，固定綠字（不分正負，因為資金記錄本身皆為正數收入）
  - [ ] 「編輯」按鈕（icon `Edit2`，`title="編輯"`）→ 開啟編輯 Modal
  - [ ] 「刪除」按鈕（icon `Trash2`，`title="刪除"`，紅色 hover，`isPending` 期間 `disabled`）
- [ ] **[`fundingRecords.length === 0`]**：⚠️ 沒有任何「尚無資金記錄」之類的 empty 提示文字——因為連「展開記錄」按鈕本身都不會出現，整個展開區塊無從觸發，等於這個 empty 狀態在畫面上是「完全不可見」而非「顯示提示文字」

### 刪除資金記錄
- [ ] 點擊「刪除」→ 先跳原生瀏覽器 `confirm()` 對話框，文字：「確定要刪除此資金記錄嗎？」
- [ ] 確認後呼叫 server action `deleteFundingRecord(id)`
  - [ ] 成功：顯示訊息（`result.message` 或 fallback「已刪除」）→ `window.location.reload()`（整頁重整）
  - [ ] 失敗：顯示訊息（`result.message` 或 fallback「刪除失敗」），不重整

### 編輯資金記錄 Modal
- [ ] 點擊「編輯」開啟，`fixed inset-0 z-50` 黑色半透明遮罩＋置中卡片（**注意：未使用 CLAUDE.md 提到的 `createPortal`**）
- [ ] 標題：`Edit2` icon＋「編輯資金記錄」，右上角 `X` 關閉鈕
- [ ] 欄位（皆為受控 input，初始值取自被編輯的記錄）：
  - [ ] 「標題」文字輸入
  - [ ] 「金額」數字輸入（`parseFloat`，失敗 fallback 0）
  - [ ] 「類型」下拉選單（同 `FUNDING_TYPES` 五選項）
  - [ ] 「來源」文字輸入
  - [ ] 「日期」date 輸入（初始值用 `toISOString().split("T")[0]` 轉換）
  - [ ] 「備註」textarea
- [ ] 按鈕「取消」（outline，關閉 modal）／「確認更新」（`isPending` 時顯示 `Loader2` 轉圈＋「更新中...」文字，否則顯示「確認更新」）
- [ ] 送出呼叫 `updateFundingRecord(id, {...})`
  - [ ] 成功：顯示訊息（`result.message` 或 fallback「已更新」）→ 關閉 modal → `window.location.reload()`
  - [ ] 失敗：顯示訊息（`result.message` 或 fallback「更新失敗」），**modal 不會關閉**
  - [ ] ⚠️ **UX 死角**：無論成功/失敗，訊息 `<div>` 都渲染在「展開記錄」區塊裡（卡片本體內），不是渲染在 Modal 內部；但 Modal 是 `z-50` 全螢幕遮罩蓋在最上層——代表編輯失敗時，錯誤訊息實際上被 Modal 的黑色遮罩擋住看不到，使用者只會覺得按了「確認更新」沒有反應（modal 沒關、也看不到任何錯誤字樣），除非把 modal 關掉才看得到訊息

### 訊息機制附註
- [ ] 本元件的訊息提示**不是**直接使用共用 hook `hooks/useMessage.ts`，而是自己在元件內手刻等效邏輯：`useState<{type:"success"|"error";text:string}|null>`＋`setTimeout(...,3000)`（時間跟 `useMessage` 預設值一致，但沒有真的 import/呼叫該 hook）——重新設計時如果要統一改成共用 hook，這裡的行為（3 秒消失、成功/失敗兩色）要對齊

Loading／Empty／Error 狀態：
- [ ] Loading：`isPending`（`useTransition`）期間刪除鈕 disabled、更新鈕顯示 `Loader2` + 「更新中...」
- [ ] Empty：`fundingRecords.length === 0` 時「展開記錄」按鈕整個不出現（見上）；沒有其他 empty 文案
- [ ] Error：inline 紅色訊息列（文字見上），源自 server action 回傳的 `message` 字串

使用的共用元件：
- `Button`（`components/ui/Button.tsx`）
- `Input`（`components/ui/input.tsx`）
- `Label`（`components/ui/label.tsx`）
- `FUNDING_TYPES`、`getTypeLabel`、`formatCurrency`、`formatDate`、`FundingRecord` 型別（`lib/constants/funding.ts`）
- lucide-react icons：`TrendingUp`、`TrendingDown`、`Wallet`、`ChevronDown`、`ChevronUp`、`Edit2`、`Trash2`、`Loader2`、`X`

呼叫的 server actions：
- `deleteFundingRecord(id)`（`app/actions/funding.ts`）
- `updateFundingRecord(id, data)`（`app/actions/funding.ts`）

---

## 元件：Sidebar UI 元件庫（components/ui/sidebar.tsx）

檔案：`components/ui/sidebar.tsx`（Client Component，共用元件庫，shadcn/ui 風格）

### SidebarProvider
- [ ] 提供 Context：`state`（"expanded"|"collapsed"）、`open`、`setOpen`、`isMobile`、`openMobile`、`setOpenMobile`、`toggleSidebar`
- [ ] 桌面版開關狀態存在 `_open`（`useState`，預設 `defaultOpen`），也支援受控模式（`open`/`onOpenChange` props，本專案未使用受控模式）
- [ ] 每次 `setOpen` 都同步寫入 cookie：`document.cookie = "sidebar:state=${openState}; path=/; max-age=604800"`（7 天）——這個 cookie 就是 `dashboard/layout.tsx` 讀取來決定 SSR 階段 `defaultOpen` 的依據，達成「重新整理後維持使用者上次的收合狀態」
- [ ] 監聽 `window.resize` 判斷 `isMobile`（`window.innerWidth < 768`）
- [ ] 設定 CSS 變數 `--sidebar-width: 16rem`、`--sidebar-width-icon: 3rem` 供子元件樣式使用

### Sidebar（本體外殼）
- [ ] 支援 `side`（left/right，預設 left）、`variant`（sidebar/floating/inset，預設 sidebar）、`collapsible`（offcanvas/icon/none，預設 offcanvas；`AppSidebar` 實際傳入 `"icon"`）
- [ ] `collapsible="none"`：退化成單純固定寬度容器（本專案未用到此模式）
- [ ] **手機版**（`isMobile`）：不管 `collapsible` 設定為何，一律走離屏抽屜模式：
  - [ ] 半透明黑色遮罩 `bg-black/80`，`fade-in` 動畫，點擊遮罩會 `setOpenMobile(false)` 關閉
  - [ ] 側邊欄面板：`fixed inset-y-0 w-3/4`（`sm:max-w-xs`），依開關狀態用 `translate-x-0`／`-translate-x-full` 做滑入滑出動畫（300ms ease-in-out）
  - [ ] 面板內右上角有獨立的關閉鈕：`X` icon＋螢幕閱讀器隱藏文字「Close」
- [ ] **桌面版**：
  - [ ] 用一個「佔位」div＋一個 `fixed` 實際內容 div 疊加的技巧做寬度過渡動畫（200ms ease-linear）
  - [ ] `collapsible="icon"` 收合時寬度變成 `--sidebar-width-icon`（3rem，僅圖示）；`collapsible="offcanvas"` 收合時寬度變 0（完全隱藏，本專案 AppSidebar 未使用此模式）
  - [ ] `data-state`（expanded/collapsed）、`data-collapsible`、`data-variant`、`data-side` 這些 data attribute 驅動對應的 Tailwind `group-data-*` 樣式

### SidebarTrigger
- [ ] 一顆 `ghost` 樣式的圖示按鈕（`h-10 w-10`），icon 為 `PanelLeft`
- [ ] 螢幕閱讀器隱藏文字：「Toggle Sidebar」
- [ ] `onClick` → 先執行外部傳入的 `onClick`，再呼叫 `toggleSidebar()`（手機版切 `openMobile`，桌面版切 `open`）
- [ ] 這顆按鈕實際渲染位置是在 `DashboardHeader` 最左側（透過 `dashboard/layout.tsx` 當作 children 傳入）

### SidebarInset
- [ ] `<main>` 容器，包住頁首＋頁面內容；有 `variant="inset"` 專屬的邊距/圓角/陰影樣式，但因 `AppSidebar` 未設定該 variant，實際不會套用（滿版無邊距）

### SidebarHeader／SidebarContent／SidebarFooter
- [ ] 純版面 slot（flex 容器＋固定 padding），本身無互動元素；`SidebarContent` 在 `collapsible="icon"` 收合時會 `overflow-hidden`

### SidebarMenu／SidebarMenuItem／SidebarMenuButton
- [ ] `SidebarMenu`＝`<ul>`；`SidebarMenuItem`＝`<li>`
- [ ] `SidebarMenuButton`：
  - [ ] 支援 `asChild`（透過 Radix `Slot`，讓 `NavigationLink` 直接取代 `<button>` 標籤，同時保留按鈕樣式與 data attribute）
  - [ ] 支援 `isActive`、`variant`、`size` props
  - [ ] `tooltip` 若為字串且非 `asChild`，直接轉成原生 `title` 屬性
  - [ ] 收合成圖示模式時：`group-data-[collapsible=icon]:!size-8 !p-2` 強制縮成 32×32 方塊圖示鈕
  - [ ] 停用狀態：`disabled:opacity-50 disabled:pointer-events-none`（含 `aria-disabled` 版本）

Loading／Empty／Error 狀態：
- [ ] 不適用（純 UI 結構元件庫，無資料狀態）

使用的共用元件：
- `Slot`（`@radix-ui/react-slot`）
- `cn`（`lib/utils.ts`）
- `Button`（`./Button`，內部給 `SidebarTrigger` 用）
- lucide-react icons：`PanelLeft`、`X`

呼叫的 server actions：
- 無（收合狀態透過瀏覽器 `document.cookie` 直接寫入，非 server action）

---

## 元件：OrganizationContext（lib/organization-context.tsx）

檔案：`lib/organization-context.tsx`（Client Component context）

- [ ] 提供全站固定不變的組織資訊（目前寫死單一組織，非多租戶動態資料）：
  - [ ] `name`: "FRC 6998"
  - [ ] `title`: "FRC 6998 報帳系統"
  - [ ] `titleEn`: "FRC 6998 Expense System"
  - [ ] `subtitle`: "UNIPARDS"
  - [ ] `logo`: `/Gemini_Generated_Image_wkar2twkar2twkar.png`
  - [ ] `bgColor`: `bg-gradient-to-br from-purple-600 to-blue-600`
- [ ] `OrganizationProvider`：直接把 `defaultOrg` 塞進 Context value，**沒有從資料庫/API 讀取，也沒有讓使用者修改組織資訊的介面**
- [ ] `useOrganization()`：目前唯一的使用點是 `AppSidebar` 的 Logo 區塊（見上）
- [ ] Context 預設值本身就帶著 `defaultOrg`（`createContext({org: defaultOrg})`），所以就算真的忘記包 Provider 也不會噴錯，只是這樣一來 `useOrganization` 內部的 `if (!context) throw` 這段防呆邏輯永遠不會被觸發（因為 Context 有預設值，`useContext` 不會回傳 `null`/`undefined`）

Loading／Empty／Error 狀態：
- [ ] 不適用（同步靜態資料，沒有非同步載入，也不會是空值）

使用的共用元件：
- 無（純 React Context APIs）

呼叫的 server actions：
- 無

---

# 三、報帳單（Expenses）

## 路由：/dashboard/expenses／我的報帳單列表頁（`app/dashboard/expenses/page.tsx` + `components/expenses-content.tsx`）

### 頁面層級（Server Component, page.tsx）
- [ ] 未登入（`!session?.user`）→ `redirect("/login")`
- [ ] 查詢條件固定為 `where: { submitterId: session.user.id }` —— **注意：不論角色為何（USER/VICE_LEADER/LEADER/FINANCE/ADMIN），此頁一律只顯示「自己送出」的報帳單，沒有依角色顯示組內或全部報帳單的邏輯**（團隊/全部報表的檢視是別的路由，不在此頁）
- [ ] Prisma include：`items`（依 `date desc` 排序，並 include `audit` 關聯）、`bankAccount`
- [ ] 報帳單排序：`orderBy: { createdAt: "desc" }`（最新建立在最上面）
- [ ] 沒有 `take`/`skip`，一次抓全部資料、無分頁
- [ ] 全站無 `loading.tsx`：資料查詢期間瀏覽器會停在上一頁面，直到 server component resolve 才整頁換成新內容（無 skeleton／spinner）
- [ ] 全站無 `error.tsx`：查詢失敗時會落到 Next.js 預設錯誤畫面，頁面內部沒有 try/catch 或自訂錯誤 UI

### 頁首區
- [ ] 大標題 `t("my_expenses")` → 中文「我的花費」／英文 "My Expenses"（用語為「花費」，與頁面其餘「報帳單」用語不一致）
- [ ] 副標題 `t("view_manage_expenses")` → 「查看和管理你的所有報帳單」／ "View and manage all your expense reports"
- [ ] 右上角「+ 新增報帳單」連結（`t("new_report")` → 「+ 新增報帳單」／ "+ New Report"），連到 `/dashboard/expenses/new`

### 頁面訊息列（`useMessage` hook，非表單頁的 useFormState）
- [ ] 目前唯一觸發來源：`BatchAuditButton` 完成批次審核後呼叫 `handleBatchAuditComplete`
- [ ] 樣式：成功＝綠底綠字綠框（`bg-green-50 text-green-700 border-green-200`）；失敗＝紅底紅字紅框（`bg-red-50 text-red-700 border-red-200`）
- [ ] 3 秒後自動消失（`useMessage` 內建 `autoHideDelay=3000`）
- [ ] 中文成功訊息逐字：`` 批次審核完成，通過率: {passRate}% ``（`passRate = Math.round(passedItems / auditedItems * 100)`）
- [ ] 英文成功訊息固定文字（不含通過率數字，與中文版內容不對等）：`Batch audit completed`
- [ ] 若 `result.success === false`：不顯示任何訊息（靜默失敗），但仍會照樣往下 `window.location.reload()` 的邏輯**不會**執行（reload 在 `if (!result.success) return;` 之後，失敗時直接 return，不 reload）
- [ ] 批次審核**成功**時會呼叫 `window.location.reload()`（整頁強制重新整理，而非局部更新 DOM／樂觀更新）

### 統計卡片（3 張，`md:grid-cols-3`）
- [ ] 卡片1「{t("total_reports")}」＝「報帳單數量」／ "Total Reports"：值＝`activeReports.length`
- [ ] 卡片2「{t("total_items")}」＝「花費項目數」／ "Total Items"：值＝所有 activeReports 底下 items 數量加總
- [ ] 卡片3「{t("total_amount")}」＝「總金額」／ "Total Amount"：值＝`$` + activeReports totalAmount 加總，`.toFixed(2)`（固定兩位小數、**無千分位**）
- [ ] `activeReports` 定義＝狀態不是 `REJECTED` 的報帳單（`REJECTED` 的報帳單不計入這 3 張卡片，但仍會顯示在下方清單）
- [ ] 金額顯示與 `columns.tsx` 使用的 `formatCurrency()`（有千分位、TWD 無小數位）風格不一致——同一系統兩種金額格式並存

### 空清單狀態（`localReports.length === 0`）
- [ ] 文字：`t("no_reports_yet")` → 「你還沒有任何報帳單」／ "You don't have any expense reports yet"
- [ ] 下方按鈕：`t("create_first")` → 「建立第一筆報帳單」／ "Create your first report"，連到 `/dashboard/expenses/new`
- [ ] 沒有额外的插圖／icon，純文字 + 按鈕置中卡片

### 報帳單清單（非空時，逐筆卡片、無分頁、無篩選、無搜尋、無排序 UI）
- [ ] **明確缺少**：狀態篩選、組別篩選、日期區間篩選、關鍵字搜尋框、欄位排序、分頁——這些在此頁完全不存在，畫面上是把伺服器回傳的「全部」報帳單依 `createdAt desc` 垂直全部列出
- [ ] 每張報帳單卡頭：
  - [ ] 標題：`report.title`
  - [ ] 組別 Badge（僅當 `report.department` 存在）：圓角 pill `bg-primary/10 text-primary`，文字 = `getDepartmentLabel()`（icon + 中/英文名，例：「⚡ 電資組」）
  - [ ] 「{t("created_on")}: 」＝「建立於: 」／ "Created on: " + `formatDate(report.createdAt)`（`zh-TW`／`en-US` locale，yyyy/mm/dd 格式）
  - [ ] 狀態徽章：pill，顏色來自 `getStatusColor(status)`：
    - PENDING_MANAGER 黃 `bg-yellow-100 text-yellow-700`
    - PENDING_FINANCE 藍 `bg-blue-100 text-blue-700`
    - PAID 綠 `bg-green-100 text-green-700`
    - REJECTED 紅 `bg-red-100 text-red-700`
    - RETURNED 橘 `bg-orange-100 text-orange-700`（`getStatusColor` 表中有定義，但 `ExpensesContent` 內的 `getStatusIcon()` switch 沒有對應 RETURNED 的 case，會落到 `default` 顯示 `FileText` icon）
  - [ ] 狀態徽章左側 icon：PENDING_MANAGER/PENDING_FINANCE＝`Clock`；PAID＝`CheckCircle`；REJECTED＝`XCircle`；其他（含 RETURNED）＝`FileText`
  - [ ] 狀態文字：`getStatusLabel()`（待主管審核／待財務審核／已付款／已拒絕／已退回）
  - [ ] 右側總金額：`$` + `totalAmount.toFixed(2)`（大字加粗）
  - [ ] 右側小字：`{items.length} {t("items_count")}` → 「X 筆花費」／ "X items"
  - [ ] 右側「批次審核全部收據」按鈕（`BatchAuditButton`，見下方元件章節）
- [ ] 銀行帳戶資訊列（僅當 `report.bankAccount` 存在）：
  - [ ] `Building2` icon + 「收款帳戶:」／ "Bank Account:"（此行為 `language === "zh"` 三元判斷寫死字串，**不是**走 `t()` 翻譯字典）
  - [ ] 顯示 `bankAccount.bankName`；若有 `branchName` 顯示「- {branchName}」
  - [ ] 帳號用 `maskAccountNumber()` 遮罩（≤8 碼＝`****`+後4碼；>8 碼＝前4碼+`****`+後4碼），格式 `(遮罩後帳號)`
  - [ ] 若 `!bankAccount.isActive`：紅字「(已停用)」／ "(Inactive)"
- [ ] 費用項目列表（`divide-y` 分隔線，逐項）：
  - [ ] 左側縮圖：若有 `receiptUrl` 顯示 `ReceiptPreview`（`size="sm"`，8×8）
  - [ ] 項目說明：`item.description`
  - [ ] 類別 pill（灰底小標籤）：直接顯示 `item.category` 原始英文值（如 "Food"），**沒有走中文類別翻譯**（雖然 `language-context.tsx` 有定義 `category_food` 等中文 key，此處未使用）
  - [ ] 項目日期：`formatDate(item.date)`
  - [ ] 右側金額：`$` + `item.amount.toFixed(2)`
  - [ ] 右側「審核」按鈕（`ReceiptAuditButton`，`variant="compact"`，見下方元件章節）
  - [ ] 整列 hover 時背景反白 `hover:bg-muted/20`
- [ ] **此頁完全沒有「編輯」「刪除」「撤回/取消」按鈕**——報帳單一旦送出，此列表頁上唯一可互動的操作只有「審核」與「批次審核」（AI 收據比對工具，與簽核流程本身無關），且**不受報帳單狀態限制**：即使狀態已是 `PAID` 或 `REJECTED`，審核／批次審核按鈕仍全部可正常點擊、會覆寫既有的 `ReceiptAudit` 紀錄
- [ ] 正式的簽核（核准／拒絕／退回）不在此頁面，是由 `app/actions/approvals.ts` 的 `approveReport`／`rejectReport`／`returnForRevision` 提供，但這幾個 action 在本次盤點範圍內找不到任何呼叫端（詳見下方「元件：DashboardTable + columns.tsx」章節的孤兒元件說明）

**使用的共用元件**：`ReceiptPreview`、`ReceiptAuditButton`、`BatchAuditButton`、`useMessage`（hook）、`lib/constants/expense-status`（`getStatusColor`/`getStatusLabel`/`getDepartmentLabel`）、`lib/utils`（`formatDate`）、`lib/utils/mask-account`（`maskAccountNumber`）、lucide-react icons（`Clock`/`CheckCircle`/`XCircle`/`FileText`/`Building2`）

**呼叫的 server actions**：page.tsx 用 Prisma 直接查詢（非 server action）；`ExpensesContent` 本身不直接呼叫，但透過子元件間接呼叫 `batchAuditExpenseReport`、`auditExpenseItem`（皆在 `app/actions/ocr.ts`，詳見對應元件章節）

---

## 路由：/dashboard/expenses/new／新增報帳單表單頁（`app/dashboard/expenses/new/page.tsx` + `components/expense-form.tsx`）

### 頁面層級（Server Component, page.tsx）
- [ ] 未登入 → `redirect("/login")`
- [ ] **沒有角色檢查**：`USER` 角色（依共用詞彙定義為「僅供檢視」）一樣能直接進入此頁、看到並填寫完整表單——權限限制只發生在送出當下呼叫 `createExpense` server action 時才被擋下（見下方訊息總表），**使用者填完整份表單才會被告知沒有權限，體驗上是延遲拒絕而非事先隱藏入口**
- [ ] `<Metadata>`：`title: "New Expense Report | Ultimate Expense"`、`description: "Submit a new expense report for approval."`——純英文，且沿用「Ultimate Expense」這個與目前品牌（FRC 報帳系統／FRC6998）不一致的舊產品名稱
- [ ] 呼叫 `getBankAccounts()` 取得使用者收款帳戶（僅 `isActive: true`，排序 `isDefault desc, createdAt desc`）
- [ ] 版面：`container mx-auto max-w-5xl` 包住 `<ExpenseForm bankAccounts={...} />`
- [ ] 無 `loading.tsx`／`error.tsx`

### 表單頂部
- [ ] 大標題：「新增報帳單」
- [ ] 副標題：「填寫完成後將直接提交至上級審核。」（呼應 DRAFT 狀態已於 2026-02-02 移除，現在建立即直接送出）

### 表單層級訊息（來自 `useFormState(createExpense, ...)` 的 `state.message`，注意不是 `useMessage` hook）
- [ ] 顯示條件：`state.message` 有值
- [ ] 樣式：`AlertCircle` icon + 文字；成功＝綠底 `bg-green-50 text-green-900 border-green-200`；失敗＝紅底 `bg-red-50 text-red-900 border-red-200`
- [ ] **不會自動消失**（沒有 setTimeout／3秒隱藏邏輯，與列表頁的 `useMessage` 行為不同，會持續顯示直到下次送出或使用者離開頁面）

### 卡片一「報帳單資訊」（`CardTitle`「報帳單資訊」／`CardDescription`「此次報銷的基本資訊。」）
- [ ] 欄位「報帳單標題」：`<input>`，placeholder「例如：十月客戶拜訪」，`register("title")`
  - [ ] 驗證錯誤（紅字 `text-sm text-destructive`）：`errors.title.message` → zod「標題至少需要 3 個字元」
- [ ] 欄位「用途/說明」：`<textarea>`，placeholder「詳細說明費用內容...」，`register("description")`，選填（zod optional），**表單上沒有為此欄位顯示錯誤文字的 UI（本來就不會有錯誤，因為沒有驗證規則）**

### 卡片二「收款帳戶」（僅當 `bankAccounts.length > 0` 才整張渲染；沒有任何啟用中帳戶時，此卡片完全不出現，也不會擋住送出）
- [ ] `CardTitle`：`Building2` icon + 「收款帳戶」
- [ ] `CardDescription`：「選擇報帳款項匯入的帳戶」
- [ ] 每個帳戶為可點擊 `<label>`（自製圓形 radio 樣式，非瀏覽器原生外觀，實際 `<input type="radio">` 用 `sr-only` 隱藏）：
  - [ ] 選中樣式：外框 `border-primary bg-primary/5`
  - [ ] 顯示 `bankName`，若有 `branchName` 接「- {branchName}」
  - [ ] `isDefault` 帳戶顯示「預設」徽章（`Star` icon + 文字，`bg-primary/10 text-primary`）
  - [ ] 下方小字：`maskAccountNumber(accountNumber)` + " · " + `accountHolder`
  - [ ] 預設選中第一個 `isDefault === true` 的帳戶；若無預設帳戶，`selectedBankAccountId` 初始為空字串（無任何一項被選取）
  - [ ] 送出時把 `selectedBankAccountId` 另外塞進 `formData.bankAccountId`（不受 zod schema 驗證，屬表單外資料）

### 「費用明細項目」區塊
- [ ] 區塊標題：「費用明細項目」
- [ ] 「新增項目」按鈕（`Plus` icon + 文字「新增項目」，`variant="secondary" size="sm"`）：呼叫 `append()` 新增一列，預設值 `{date: new Date(), category: "Food", customCategory: "", description: "", amount: 0, receiptUrl: null}`
- [ ] 每筆項目為獨立 `Card`（`hover:border-primary/50`），12 欄 grid：
  - [ ] 「日期」（`md:col-span-2`）：`<input type="date">`，`register(items.${index}.date)`；**表單上沒有為日期欄位顯示 zod 錯誤 UI**（即使 schema 有 `required_error: "日期為必填"`，因 defaultValue 已帶入 `new Date()`，正常操作下不會觸發）
  - [ ] 「類別」下拉選單：選項為 `ExpenseCategoryEnum.options`＝Food／Transport／Housing／Entertainment／Utilities／Health／Office Supplies／Travel／Other（**選單顯示英文原始值，未中文化**）
    - [ ] 版面寬度動態：選到 `Other` 時類別欄縮為 `md:col-span-1`（讓出空間給自訂類別欄）；否則為 `md:col-span-2`
  - [ ] 「自訂類別」欄位：僅當該列 `category === 'Other'`（用 `watch()` 即時判斷）才渲染，placeholder「輸入類別名稱」，`register(items.${index}.customCategory)`
  - [ ] 「說明」（`md:col-span-4`）：placeholder「與客戶午餐」，`register(items.${index}.description)`
    - [ ] 驗證錯誤（紅字 10px）：「說明至少需要 2 個字元」
  - [ ] 「金額」（`md:col-span-2`）：`<input type="number" step="0.01">`，左側固定 `$` 前綴（absolute 定位）
    - [ ] 驗證錯誤（紅字 10px）：「金額必須大於 0」
  - [ ] 收據上傳／OCR 區（`md:col-span-2`，見下方 UploadButton）
  - [ ] 「刪除」按鈕（`Trash2` icon，`ghost`，hover 變紅）：**僅當 `fields.length > 1` 才顯示**——最後一筆項目無法被刪除（不顯示刪除鈕），至少保留 1 筆
- [ ] items 陣列層級錯誤（如「至少需要一個費用項目」）：紅字顯示於整個項目列表下方

### UploadButton（收據上傳＋OCR，每列各自獨立一份）
- [ ] 隱藏 `<input type="file" accept="image/*,.pdf">`（僅靠瀏覽器檔案選擇器過濾，程式碼內無額外副檔名黑白名單）
- [ ] 「上傳」按鈕（`outline`, `sm`）：
  - [ ] 文字：預設「上傳」；上傳中「上傳中」（`Loader2` 轉圈）；已有預覽後變「更換」
  - [ ] icon：上傳中 `Loader2 animate-spin`；否則 `Upload`
- [ ] 檔案大小限制 10MB（`10*1024*1024`），超過彈出瀏覽器原生 `alert("檔案過大，上限為 10MB")` 並中止
- [ ] 選檔後立即以 `URL.createObjectURL(file)` 產生本地預覽（僅畫面即時預覽用，**不會**存入資料庫，符合專案規範不可用 blob URL 存 DB）
- [ ] 壓縮邏輯（僅圖片 MIME type）：
  - [ ] Canvas 縮放：寬度上限 1200px 等比縮放
  - [ ] 額外總像素上限 1,600 萬 px 的二次縮放保護
  - [ ] 輸出 JPEG，quality = 0.7（70%）
  - [ ] `canvas.toDataURL("image/jpeg", 0.7)` → base64 data URL，寫入 `receiptUrl`（此 base64 字串即為最終存 DB 的值）
  - [ ] 非圖片檔（如 PDF）：不壓縮，直接 `FileReader.readAsDataURL()` 轉 base64
  - [ ] 圖片載入失敗：reject「圖片載入失敗」
  - [ ] 壓縮／上傳過程例外：`alert("上傳失敗")`
- [ ] 上傳中：`uploading` state，按鈕 `disabled`
- [ ] 「擷取」按鈕（OCR，`secondary`, `sm`，`Sparkles` icon 黃色）：
  - [ ] `title` tooltip：「智慧擷取收據資訊」
  - [ ] `disabled` 條件：尚未有 `preview`（沒上傳過）或 `scanning` 中
  - [ ] 文字：預設「擷取」；辨識中「辨識中」（`Loader2`）
  - [ ] 若無 `imageBase64` 卻被觸發：`alert("請先上傳收據圖片")`
  - [ ] 呼叫 `scanInvoice(imageBase64)`；成功透過 `onOCRComplete` 回調把 `{date, amount, description, vendor, invoiceNumber}` 傳回父層（金額已從分換算回顯示單位：`totalAmount / 100`）
  - [ ] 失敗：`alert(result.error || "OCR 辨識失敗")`；例外：`alert("OCR 辨識失敗")`
- [ ] 「檢視」文字連結（僅當已有 `preview`）：新分頁開原圖，藍色底線文字「檢視」

### `handleOCRResult()`（父層接收 OCR 結果後自動帶入表單的邏輯）
- [ ] 日期：嘗試解析 `/`（依第一段長度判斷年份在前或在後）或 `-` 分隔格式；解析失敗僅 `console.warn`，**不會**顯示任何錯誤給使用者，欄位維持原值
- [ ] 金額：僅當 `> 0` 才自動帶入，**會直接覆蓋使用者原本手動輸入的金額**
- [ ] 說明欄位：OCR 擷取的「商家名稱」會**直接覆寫**「說明」欄位既有內容（非附加），有潛在資料遺失風險
- [ ] **沒有任何「已由 AI 自動帶入／已覆寫」的提示文字**，使用者不容易察覺欄位值被 OCR 結果覆蓋

### 草稿自動儲存（`useAutoSave` / `draft-storage.ts`）
- [ ] **確認結果：`expense-form.tsx` 完全沒有 import 或使用 `useAutoSave` hook，也沒有使用 `saveDraft`/`loadDraft`/`removeDraft`**（全專案搜尋 `useAutoSave` 僅命中其自身定義檔 `hooks/useAutoSave.ts`；搜尋 `draft-storage`/`saveDraft`/`loadDraft`/`removeDraft` 僅命中 `useAutoSave.ts` 內部呼叫，以及 `FINDINGS.md`/`PROGRESS.md` 兩份文件中「刪除的重複檔案：`lib/db/draft-storage.ts` → 保留 `lib/draft-storage.ts`」的紀錄）
- [ ] 換言之：**目前使用者填寫報帳單到一半若重新整理頁面或離開頁面，所有已輸入內容會直接遺失**——沒有「已自動儲存」提示文字、沒有「是否要恢復草稿」的提示 UI、沒有「清除草稿」按鈕，因為這條程式碼路徑完全未被啟用
- [ ] 也沒有 `beforeunload` 瀏覽器離開頁面警示（未在 `expense-form.tsx` 中發現任何相關邏輯）
- [ ] 詳細的（未使用中的）hook 行為規格另列在下方「元件：useAutoSave + draft-storage」章節，供改版團隊評估是否要真正串接或直接移除

### 底部按鈕列
- [ ] 「取消」按鈕（`outline`）：呼叫 `reset()` 把表單重置回預設值（清空已輸入內容）——**沒有確認對話框，也不會導航離開頁面**
- [ ] 「提交報帳單」按鈕（`type="submit"`）：
  - [ ] 送出中：`Loader2` 轉圈 + 「提交中...」
  - [ ] 預設文字：「提交報帳單」
  - [ ] `disabled` 條件：`isPending`（`useTransition`）
  - [ ] 送出成功（`state.success === true`）後：`useEffect` 觸發 `reset()` 清空表單，**停留在同一頁**（不會自動導回 `/dashboard/expenses` 列表頁，也沒有「前往查看」連結）

### 送出流程與驗證
- [ ] Client 端先用 `zodResolver(expenseReportSchema)` 擋一次（顯示前述紅字錯誤）
- [ ] 通過後 `onSubmit` 把整份資料 `JSON.stringify` 塞進 `FormData.data`，另外附加 `bankAccountId`，用 `startTransition` 呼叫 `formAction`（即 `createExpense`）
- [ ] Server 端 `createExpense` 會再驗證一次 `expenseReportSchema.safeParse`；驗證失敗回傳的 `state.errors`（逐欄位錯誤陣列）**在目前 UI 上完全沒被讀取或顯示**——`ExpenseForm` 只讀 `state.message`，未讀 `state.errors`（等於 server 端驗證失敗時，畫面只會看到通用的「Validation failed」，不會標出是哪個欄位出錯）

### `createExpense` 回傳訊息文字總表（逐字引用）
- [ ] `ADMIN`／`FINANCE` 角色送出 → 狀態直接變 `PAID` → 「報帳單已直接核准付款！」
- [ ] `LEADER` 角色送出 → 狀態變 `PENDING_FINANCE` → 「報帳單已提交至財務審核！」
- [ ] 其他角色（含 `VICE_LEADER`）送出 → 狀態變 `PENDING_MANAGER` → 「報帳單已提交至組長審核！」
- [ ] `USER` 角色嘗試送出 → 「您沒有權限新增報帳單」（`success:false`，表單資料整份被丟棄不儲存）
- [ ] 未登入 → 「Unauthorized」（英文，未中文化）
- [ ] `formData.get("data")` 非字串／不存在 → 「Invalid form data submission」（英文）
- [ ] 資料超過 10MB（`MAX_JSON_SIZE`）→ 「資料過大，請減少項目數量」
- [ ] `JSON.parse` 失敗 → 「無效的 JSON 資料格式」
- [ ] zod 驗證失敗 → 「Validation failed」（英文，`state.errors` 附帶但 UI 未顯示）
- [ ] 指定的收款帳戶不存在或不屬於自己 → 「無效的收款帳戶」
- [ ] 收款帳戶已停用 → 「收款帳戶已停用」
- [ ] 資料庫寫入例外 → 「資料庫錯誤：建立報帳單失敗」
- [ ] 其餘未列出情況 fallback → 「報帳單已提交！」

### 附註：同檔案（`app/actions/expenses.ts`）內其他 export
- [ ] `updateReport(reportId, data)`：僅 `ADMIN` 可用，成功訊息「Report updated successfully!」／失敗「Only admins can edit reports」等（英文），**此次盤點範圍內（本頁與列表頁）沒有任何呼叫端**；經搜尋實際呼叫端為 `components/reports-content.tsx`（不在本次指定閱讀清單內，屬於另一個路由如「所有報表」頁）
- [ ] `deleteReport(reportId)`：僅 `ADMIN` 可用，成功「Report deleted!」／權限不足「只有管理員可以刪除報帳單」，內部有寫 `AuditLog`（action: DELETE）。同樣**在本次盤點範圍內找不到呼叫端**，實際呼叫端是 `components/reports-content.tsx` 的 `handleDelete()`，其刪除確認對話框用的是瀏覽器原生 `confirm()`，文字為（硬寫在該檔案，非走 `t()` 字典）中文「確定要刪除此報帳單嗎？」／英文 "Are you sure you want to delete this report?"——**與 `lib/language-context.tsx` 內定義但未被使用的 `confirm_delete_report` key（「確定要刪除此報帳單嗎？此操作無法復原。」，多了「此操作無法復原」）文字不一致**，供改版時統一

**使用的共用元件**：`Button`、`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`、`maskAccountNumber`、react-hook-form（`useForm`/`useFieldArray`/`Controller`）、`zodResolver`、lucide-react icons（`Trash2`/`Plus`/`Upload`/`Loader2`/`AlertCircle`/`Sparkles`/`Building2`/`Star`）

**呼叫的 server actions**：`createExpense`（`app/actions/expenses.ts`）、`scanInvoice`（`app/actions/ocr.ts`）、`getBankAccounts`（`app/actions/bank-accounts.ts`，由 page.tsx 呼叫後以 props 傳入）

---

## 元件：ReceiptPreview／收據縮圖預覽＋點擊放大 Modal（`components/receipt-preview.tsx`）

- [ ] 縮圖尺寸：`size="sm"` → 8×8（`h-8 w-8`）；`size="md"` → 12×12（`h-12 w-12`）；圓角＋border，hover 時出現主色 ring（`hover:ring-2 hover:ring-primary/50`）
- [ ] 縮圖 `title` tooltip 文字：「檢視{alt}」（`alt` 預設「收據」，實際使用時常傳入 `item.description`）
- [ ] 圖片來源安全檢查 `isDisplayableImageSrc()`：僅允許 `data:image/jpeg`、`data:image/png`、`data:image/webp`、`data:image/gif` 開頭的 data URL，或 `https://` 開頭、或 `/` 開頭路徑；其餘一律視為不可顯示
- [ ] 不可顯示時 fallback：灰底 + `ImageIcon` 圖示（不會顯示破圖 icon）
- [ ] 點擊縮圖 → 開啟全螢幕燈箱：黑色半透明遮罩 `bg-black/70` + 置中大圖（`max-w-[90vw] max-h-[90vh]`，`object-contain`）
- [ ] 燈箱透過 `createPortal` 掛到 `document.body`（避免 z-index 堆疊問題，符合專案慣例規範）
- [ ] 燈箱右上角白底圓形「X」關閉鈕，懸浮於圖片外側（`-top-3 -right-3`）
- [ ] 點擊遮罩背景（非圖片本身）會關閉燈箱（圖片本身 `stopPropagation`）
- [ ] **沒有鍵盤 ESC 關閉燈箱的邏輯**（與 `Modal` 元件不同，`Modal` 有處理 Escape，這裡沒有）
- [ ] 沒有圖片載入中的 loading/skeleton 呈現，`<img>` 直接放 `src`

**使用的共用元件**：無（純自製，使用 lucide-react `X`／`ImageIcon`）
**呼叫的 server actions**：無

---

## 元件：ReceiptAuditButton／單筆收據 AI 智慧審核按鈕（`components/receipt-audit-button.tsx`）

- [ ] 三種呈現變體（`variant` prop）：
  - [ ] `"icon"`：純圖示按鈕（`ghost`, `icon` size），`title` tooltip「智慧審核收據」；loading 顯示 `Loader2` 轉圈，否則 `ScanSearch`
  - [ ] `"compact"`：小按鈕（`outline`, `sm`）；loading 只顯示轉圈；非 loading 顯示 `ScanSearch` + 既有審核狀態小 icon（見下）+ 固定文字「審核」
  - [ ] `"default"`：完整按鈕（`outline`）；文字依有無 `receiptUrl`：有收據＝`ScanSearch` icon +「智慧審核收據」；無收據＝`Upload` icon +「上傳並審核收據」；loading 顯示「審核中...」
- [ ] 既有審核狀態小 icon（`existingAuditStatus`）：`true` → 綠色 `CheckCircle2`；`false` → 紅色 `XCircle`；`null`/`undefined` → 不顯示
- [ ] 點擊行為：若項目已有 `receiptUrl` → 直接用現有收據圖跑審核（免重新選檔）；若無 → 觸發隱藏的 `<input type="file" accept="image/*">` 讓使用者選圖
- [ ] 手動選檔：非圖片檔會 `alert("請選擇圖片檔案")` 並中止；選到圖片後用 `FileReader` 轉 base64 送審
- [ ] 審核中：`isLoading` state 控制按鈕 `disabled` + 對應 variant 的轉圈樣式
- [ ] 審核完成（成功或失敗）都會開啟 `AuditResultDialog`（`dialogOpen=true`）
- [ ] 呼叫例外（`catch`）時的 fallback 結果：`matchScore: 0`、`isValid: false`、單一 issue `{type: "INVALID_FORMAT", severity: "error", message: "審核過程發生錯誤"}`，同樣會開啟結果對話框顯示此錯誤
- [ ] 審核完成後透過 `onAuditComplete` 回調通知父層即時更新該筆項目的 audit 狀態（列表頁不用整頁重整即可反映最新審核圖示）

**使用的共用元件**：`Button`、`AuditResultDialog`
**呼叫的 server actions**：`auditExpenseItem`（`app/actions/ocr.ts`）

---

## 元件：AuditResultDialog／審核結果對話框（`components/audit-result-dialog.tsx`）

- [ ] 以 `Modal` 元件包裝；`result` 為 `null` 時整個元件回傳 `null`（不會顯示空白 Modal）
- [ ] Modal 標題：綠色 `CheckCircle2`（審核通過）或紅色 `XCircle`（未通過）+ 固定文字「收據審核結果」
- [ ] 若有傳入 `itemDescription`，顯示於標題下方（灰字小字）
- [ ] 「匹配分數」區：
  - [ ] label「匹配分數」+ 右側大字 `{matchScore}%`
  - [ ] 分數顏色：≥80 綠、≥60 黃、<60 紅（`getScoreColor`）
  - [ ] 下方進度條（灰底），填色比例＝matchScore%，同色階邏輯（`getProgressColor`：≥80 `bg-green-500`、≥60 `bg-yellow-500`、<60 `bg-red-500`）
- [ ] 審核狀態 Badge：
  - [ ] 通過：「✅ 審核通過」（`variant="default"`）
  - [ ] 未通過：「❌ 審核未通過」（`variant="destructive"`）
  - [ ] 若有 `extractedData`：額外「信心度 {confidence×100 四捨五入}%」Badge（`variant="secondary"`）
- [ ] 「OCR 擷取結果」區塊（僅當 `result.extractedData` 存在）：
  - [ ] 標題：`FileText` icon +「OCR 擷取結果」
  - [ ] 金額列（僅當 `totalAmount !== null`）：`DollarSign` icon +「金額：」+ `$` + `totalAmount / 100`（**注意：此處是硬寫 `/100`，沒有呼叫 `lib/money.ts` 的 `toDisplayUnit()` 統一函式，屬於金額換算邏輯不統一的技術債**）
  - [ ] 日期列（僅當有 `date`）：`Calendar` icon +「日期：」+ 原始擷取字串（未轉換格式）
  - [ ] 商家列（僅當有 `vendorName`，橫跨 2 欄）：`Store` icon +「商家：」+ 商家名稱
  - [ ] 發票號碼列（僅當有 `invoiceNumber`，橫跨 2 欄，等寬字型）：`Hash` icon +「發票：」+ 發票號碼
- [ ] 「發現的問題」區塊（僅當 `issues.length > 0`）：
  - [ ] 標題「發現的問題」
  - [ ] 每個 issue 一張卡片，依 `severity` 決定樣式（`SEVERITY_CONFIG`）：
    - [ ] `error`：`XCircle` icon，紅色（`bg-red-100 text-red-700 border-red-200`，dark mode 對應深色變體）
    - [ ] `warning`：`AlertTriangle` icon，黃色（`bg-yellow-100 text-yellow-700 border-yellow-200`）
    - [ ] `info`：`Info` icon，藍色（`bg-blue-100 text-blue-700 border-blue-200`）
  - [ ] 卡片顯示 `issue.message`（實際文字內容詳見下方「AuditIssueType 文字總表」）
  - [ ] 若該 issue 有 `expected`/`actual`：額外一行小字「預期：{expected} → 實際：{actual}」（兩者皆有才顯示箭頭）
  - [ ] 問題清單區塊 `max-h-48`，超出可垂直捲動（`overflow-y-auto`）
- [ ] 「完全匹配」正面訊息（僅當 `issues.length === 0` 且 `isValid === true`）：綠色卡片，大 `CheckCircle2` 圖示，文字「收據資訊與報帳項目完全匹配！」

### AuditIssueType 對應的實際中文文字內容（逐一列出，來源：`lib/agents/receipt-audit.ts`）
- [ ] `INVALID_FORMAT`（無效格式，severity=`error`）：
  - OCR 完全辨識失敗時：訊息 = OCR 回傳的錯誤原文，或 fallback「無法辨識收據內容」
  - `ReceiptAuditButton` 呼叫過程例外時 fallback：「審核過程發生錯誤」
- [ ] `LOW_CONFIDENCE`（信心度低，severity=`warning`）：
  - OCR 信心度 < 0.5：「OCR 信心度偏低 ({百分比}%)」，扣 15 分
  - 完全無法從收據擷取金額（`totalAmount === null`）：「無法從收據中擷取金額」，扣 20 分（同樣歸類在 `LOW_CONFIDENCE`，非獨立分類）
- [ ] `AMOUNT_MISMATCH`（金額不符，severity=`error`）：「金額不符：收據 ${extractedAmount}，報帳 ${reportedAmount}」，`expected`＝報帳金額、`actual`＝收據金額；判定門檻：差異金額 > 10 元 **且** 差異百分比 > 5%（兩者同時成立才判定），扣 40 分；有差異但未達門檻僅扣 5 分、不列為 issue
- [ ] `DATE_MISMATCH`（日期不符，severity=`warning`）：「日期差異較大：收據 {日期}，報帳 {日期}」，`expected`＝報帳日期、`actual`＝收據日期；判定門檻：相差 > 7 天，扣 15 分
- [ ] `DUPLICATE_INVOICE`（重複發票，severity=`error`）：「發票號碼 {發票號} 已被其他項目使用」，扣 50 分；比對邏輯：查 `ReceiptAudit` 表中是否已有相同（正規化：去除連字號＋轉大寫）發票號碼被其他項目使用過
- [ ] `MISSING_RECEIPT`（缺少收據，severity=`error`）：僅出現在「批次審核」情境——該筆項目完全沒有 `receiptUrl` 時，直接跳過不呼叫 OCR，訊息「此項目缺少收據圖片」
- [ ] 計分規則：起始 100 分，逐項扣分後以 `clampScore()` 限制在 0–100 之間；只要有任一 `severity: "error"` 的 issue，`isValid` 即為 `false`（`warning`/`info` 不影響是否「通過」）

**使用的共用元件**：`Modal`、`Badge`
**呼叫的 server actions**：無（純顯示元件，資料完全由父層 props 傳入）

---

## 元件：BatchAuditButton／批次審核報帳單全部收據按鈕（`components/batch-audit-button.tsx`，未列於原始指定清單，但被 `expenses-content.tsx` 直接使用，屬於報帳單列表頁不可分割的一部分，故一併記錄）

- [ ] 按鈕文字：預設「批次審核全部收據」（`FileStack` icon）；審核中「批次審核中...」（`Loader2` 轉圈）
- [ ] 點擊呼叫 `batchAuditExpenseReport(reportId)`，一次審核該報帳單底下所有項目
- [ ] 結果用 `Modal` 顯示（標題 `FileStack` icon +「批次審核結果」）：
  - [ ] 4 格總覽數字：「總項目」（`totalItems`）／「已審核」（`auditedItems`）／「通過」（`passedItems`，綠底）／「未通過」（`failedItems`，紅底）
  - [ ] 通過率進度條（僅當 `auditedItems > 0`）：label「通過率」+ 百分比數字 + 綠色進度條
  - [ ] 「各項目審核結果」清單：逐列顯示狀態 icon（成功且通過＝綠勾 `CheckCircle2`；成功但不通過或呼叫失敗＝紅叉 `XCircle`；其餘＝黃色警示三角 `AlertTriangle`）+ 項目描述（`truncate` 截斷）+ 右側 Badge（成功時顯示 `{matchScore}%`；失敗時顯示該項目第一則 issue 的 `message` 或「無法審核」）
  - [ ] 若整體 `result.error` 存在：額外顯示紅色錯誤區塊
- [ ] 審核例外時 fallback error 文字：「批次審核失敗」
- [ ] 完成後透過 `onAuditComplete` 回調通知父層（`ExpensesContent` 會在此顯示前述「批次審核完成，通過率: X%」訊息並整頁 `reload()`）
- [ ] `batchAuditReport()`（server 端邏輯）在報帳單完全沒有項目時回傳錯誤「報帳單中沒有費用項目」（理論上不會發生，因 schema 強制至少 1 項）

**使用的共用元件**：`Button`、`Modal`、`Badge`
**呼叫的 server actions**：`batchAuditExpenseReport`（`app/actions/ocr.ts`）

---

## 元件：DashboardTable + columns.tsx／報表資料表格與逐列核准/拒絕操作（`app/dashboard/dashboard-table.tsx` + `app/dashboard/columns.tsx`）—— ⚠️ 疑似孤兒（未被任何路由引用）元件

- [ ] **經全專案搜尋確認**：`DashboardTable` 除了自己的定義檔外，**沒有任何其他檔案 import 使用它**；真正的 `/dashboard` 路由（`app/dashboard/page.tsx`）渲染的是 `DashboardContent` 元件（不在本次指定閱讀清單內），並不使用 `DashboardTable`／`columns.tsx`
- [ ] 因此以下內容目前**在使用者實際看到的畫面上不會出現**，但因原始檔案存在且在指定閱讀清單內，仍逐項記錄供改版團隊決定去留（刪除或正式串接）
- [ ] 表格欄位（純英文，未走 i18n 字典，與全站繁中介面風格不一致）：Title／Submitted By／Amount／Date／Status／Actions
  - [ ] Title：報帳單標題
  - [ ] Submitted By：`submitter.name || submitter.email`
  - [ ] Amount：`formatCurrency()`（千分位＋TWD 無小數位，與列表頁手動 `$+toFixed(2)` 格式不同）
  - [ ] Date：`formatDate()`
  - [ ] Status：`Badge`，文字為 `status.replace("_", " ")`（僅替換第一個底線，例如 `PENDING_MANAGER` → "PENDING MANAGER"；目前狀態值都只含一個底線，尚未暴露多底線未完全替換的問題）；Badge 顏色：`PAID`＝`success`（綠）、`REJECTED`＝`destructive`（紅）、其餘＝`default`
  - [ ] Actions：見下方 `ActionCell`
- [ ] `ActionCell` 權限判斷函式 `canUserModifyReport(status, role)`：
  - [ ] `ADMIN`：狀態為 `PENDING_MANAGER` 或 `PENDING_FINANCE` 時可操作
  - [ ] `role === "MANAGER"` 且狀態為 `PENDING_MANAGER`：可操作——**⚠️ 系統實際 Role enum 為 USER／VICE_LEADER／LEADER／FINANCE／ADMIN，並無「MANAGER」這個角色值，此判斷式恆為 false，等同死代碼**（可能是想寫 `LEADER` 但寫錯，或為舊角色命名殘留，與 `app/dashboard/page.tsx` 內 `buildWhereClause()` 同樣寫死 `case "MANAGER"` 的問題一致）
  - [ ] `FINANCE` 且狀態為 `PENDING_FINANCE`：可操作
  - [ ] 不符合以上任何條件：顯示灰色斜體文字「Read Only」，不出現任何操作按鈕
- [ ] 可操作時顯示兩顆按鈕：
  - [ ] 「Approve」（綠色外框，`Check` icon）→ 呼叫 `approveReport(report.id)`；loading 中圖示轉圈；失敗時瀏覽器原生 `alert("Failed to approve")`（純英文）
  - [ ] 「Reject」（`ghost`，紅字，`X` icon）→ 點擊後**不會**立即送出，而是切換成內嵌文字輸入框
- [ ] Reject 輸入框模式：
  - [ ] 文字輸入框，placeholder「Reason...」，`autoFocus`
  - [ ] 紅色打勾按鈕：輸入框為空時 `disabled`；點擊呼叫 `rejectReport(report.id, rejectReason)`；失敗 `alert("Failed to reject")`
  - [ ] 灰色 X 按鈕：取消，切回 Approve/Reject 兩顆按鈕
  - [ ] **沒有二次確認對話框，也沒有拒絕原因字數上限**
- [ ] `DataTable`（`components/ui/data-table.tsx`，被 `DashboardTable` 使用）之通用行為：
  - [ ] 採用 TanStack Table（`@tanstack/react-table`）
  - [ ] 分頁：固定每頁 10 筆（`pageSize: 10`），僅「上一頁」「下一頁」兩顆圖示按鈕（`ChevronLeft`/`ChevronRight`），**沒有頁碼、沒有跳頁輸入、沒有「共 N 頁／共 N 筆」文字**
  - [ ] 無資料時顯示英文「No results.」（單一橫跨全部欄位置中列）
  - [ ] **沒有欄位排序**（未接 `getSortedRowModel`）、**沒有搜尋/篩選框**、**沒有欄位顯示/隱藏切換**
- [ ] 此元件的角色判斷邏輯（誤用 "MANAGER"）與 `app/actions/approvals.ts` 實際要求的角色（`LEADER` 審 `PENDING_MANAGER`、`FINANCE` 審 `PENDING_FINANCE`）不一致，值得在改版時一併確認真正在用的核准頁面（例如 `/dashboard/approvals`，不在本次盤點範圍）邏輯是否正確、以及此孤兒元件是否可直接刪除

**使用的共用元件**：`Button`、`Badge`、`DataTable`（`components/ui/data-table.tsx`）
**呼叫的 server actions**：`approveReport`、`rejectReport`（`app/actions/approvals.ts`）——注意 `returnForRevision`（同檔案內第三個 action，對應「已退回」`RETURNED` 狀態）**在 `columns.tsx` 裡完全沒有被呼叫**，此 UI 只有核准／拒絕兩種操作，沒有「退回修改」按鈕

---

## 元件：useAutoSave + draft-storage／草稿自動儲存機制（`hooks/useAutoSave.ts` + `lib/draft-storage.ts`）—— ⚠️ 已定義但未被任何頁面實際使用

- [ ] `hooks/useAutoSave.ts` 提供的 API（若日後被串接，理論上的行為規格）：
  - [ ] `save(data)`：debounce 儲存（預設 1000ms 防抖，`debounceMs` 可調）
  - [ ] `saveNow(data)`：立即儲存，不防抖
  - [ ] `clear()`：清除草稿並重置狀態
  - [ ] `restore()`：把已儲存草稿透過 `onRestore` callback 帶回呼叫端，並標記 `hasRestoredDraft = true`
  - [ ] `dismiss()`：忽略草稿並清除（等同呼叫 `clear()`）
  - [ ] `showRestorePrompt`：布林值，元件掛載時若偵測到 localStorage 有未過期草稿會自動設為 `true`（代表「應顯示『是否要恢復草稿』提示 UI」的訊號，但草稿提示 UI 本身需呼叫端自行實作，hook 不含現成 UI）
  - [ ] `hasRestoredDraft`：是否已執行過 `restore()`
- [ ] `lib/draft-storage.ts` 底層儲存機制：
  - [ ] 儲存於瀏覽器 `localStorage`，key 前綴 `expense_draft_`
  - [ ] 草稿有效期限 24 小時（`DRAFT_EXPIRY_MS`），過期讀取時自動視為不存在並清除
  - [ ] 儲存／讀取／刪除皆以 try-catch 包裹，失敗僅 `console.warn`，不會讓使用者看到任何錯誤畫面
- [ ] **確認目前狀態**：`useAutoSave` 全專案搜尋僅命中自身定義檔；`saveDraft`/`loadDraft`/`removeDraft` 全專案搜尋僅命中 `useAutoSave.ts` 內部呼叫，以及 `FINDINGS.md`/`PROGRESS.md` 兩份文件中「刪除的重複檔案：`lib/db/draft-storage.ts` → 保留 `lib/draft-storage.ts`」的紀錄——**`expense-form.tsx`（唯一有多欄位、值得做草稿保護的表單）完全沒有引用這組 hook**
- [ ] 換言之：目前畫面上**不存在**「已自動儲存」提示文字、**不存在**「是否要恢復草稿」提示 UI、**不存在**「清除草稿」按鈕——因為這條程式碼路徑完全未被啟用，屬於孤兒程式碼
- [ ] 改版時需決定：(a) 把這組既有 hook／storage 邏輯接上 `ExpenseForm` 讓草稿功能真正生效，或 (b) 確認不需要此功能並移除孤兒程式碼；若選擇 (a)，需另外設計「恢復草稿」提示的實際 UI 與文案（目前完全沒有）

**使用的共用元件**：無
**呼叫的 server actions**：無（純 client-side `localStorage`，不觸及後端）

---

# 四、審核（Approvals）

## 路由：/dashboard/approvals／審核報帳單列表（LEADER／FINANCE／ADMIN 審核佇列）

- [ ] 頁面存取控制（`app/dashboard/approvals/page.tsx`，Server Component）
  - [ ] 未登入（`session?.user` 不存在）→ `redirect("/login")`
  - [ ] `role`（`session.user.role`，若無則預設字串 `"USER"`）不屬於 `["LEADER", "FINANCE", "ADMIN"]` → `redirect("/dashboard")`（USER、VICE_LEADER 皆會被導回儀表板，且沒有任何提示訊息說明「你沒有權限」，是靜默跳轉）
- [ ] 依角色決定可見報帳單範圍（伺服器端 Prisma `where` 條件，`getWhereClauseByRole()`，**不是**前端篩選器）
  - [ ] `LEADER`：只查 `status === "PENDING_MANAGER"`
  - [ ] `FINANCE`：只查 `status === "PENDING_FINANCE"`
  - [ ] `ADMIN`：查 `status === "PENDING_MANAGER"` **或** `status === "PENDING_FINANCE"`（OR 條件），兩階段報帳單會混在同一份列表中，中間沒有任何分組標題或區隔線區分「待主管審核」與「待財務審核」
  - [ ] 排序固定為 `orderBy: { createdAt: "desc" }`（最新建立的在最上方），無其他排序選項
  - [ ] 查詢 `include`：`submitter`（僅 `name`、`email` 兩欄）、`items`（全部欄位）、`bankAccount`（完整物件）
  - [ ] 【重點】查詢完全沒有依「組別 TeamDepartment」過濾，也沒有 `select` 提交人的 department 欄位 — LEADER 會看到**所有組別**待主管審核的報帳單，不是只有自己組別的；畫面上也完全不顯示提交人屬於哪一組
  - [ ] 【重點】結構性防呆：LEADER 自己建立的報帳單會直接進入 `PENDING_FINANCE`（跳過第一階段），所以 LEADER 在自己的審核佇列（只抓 `PENDING_MANAGER`）中理論上不會看到自己提交的單子；但 `approveReport`/`rejectReport` 程式碼本身**沒有**顯式檢查「是否為本人提交」的 self-approval 阻擋，純粹靠角色＋狀態把關
- [ ] 銀行帳戶顯示權限差異（`canViewFullBankAccount = role === "FINANCE" || role === "ADMIN"`，於 `page.tsx` 算出後傳入元件；元件內 prop 預設值為 `false`）
  - [ ] `FINANCE`／`ADMIN`：顯示完整帳號 `report.bankAccount.accountNumber`
  - [ ] `LEADER`：顯示遮罩帳號（`maskAccountNumber()`，`lib/utils/mask-account.ts`）— 帳號長度 ≤8 碼顯示「`****`＋末4碼」；>8碼顯示「前4碼＋`****`＋末4碼」
  - [ ] 這是本頁 LEADER 與 FINANCE 兩角色最明確的畫面差異點之一（另一個是可見報帳單的 status 範圍）
- [ ] 頁面標題與副標文字（`components/approvals-content.tsx`）
  - [ ] H1 逐字文字：中文「審核報帳單」／英文「Approvals」
  - [ ] 副標逐字文字（動態即時筆數，隨審核動作遞減）：中文「你有 {N} 個待審核的報帳單」／英文「You have {N} pending expense report(s)」，`{N}` 為前端 state `localReports.length`
- [ ] Empty 狀態（`localReports.length === 0`）
  - [ ] 卡片樣式：圓角、有邊框、置中文字（`rounded-xl border bg-card p-8 text-center`）
  - [ ] 灰色 `Clock` 時鐘圖示（置中，圖示下方留白）
  - [ ] 逐字文字：中文「沒有待審核的報帳單」／英文「No pending expense reports」
- [ ] Loading 狀態
  - [ ] 頁面初次載入：無 client-side loading spinner（資料在 Server Component 內直接 `await` 撈取，全站無 `loading.tsx`）
  - [ ] 單筆審核處理中：按鈕本身不換圖示、不顯示 spinner，只加上 `disabled`＋`opacity-50`（Check/X 圖示與「核准」「拒絕」文字維持不變，並非換成轉圈動畫）
  - [ ] disabled 條件為 `isPending && processingId === report.id`，只鎖住「正在處理中的那一筆」，同時間其他報帳單的按鈕仍可正常點擊（非整頁鎖定）
- [ ] Error 狀態
  - [ ] 全站無 `error.tsx`
  - [ ] 核准／拒絕呼叫 server action 失敗（`throw Error(...)`）時，前端只執行 `console.error("Failed to approve:", error)` 或 `console.error("Failed to reject:", error)`
  - [ ] 【重點】畫面上**完全沒有任何錯誤提示**給使用者 — 不呼叫 `useMessage`、不 `alert`、不顯示紅字訊息；使用者只會看到按鈕從 disabled 恢復成可點擊、卡片仍留在原處，無法得知失敗原因（例如權限不足、報帳單狀態已被別人改變等情況都會靜默失敗）
  - [ ] 本元件全程未 import／使用共用 `hooks/useMessage.ts`，因此本頁沒有任何 3 秒自動消失的 toast 訊息（成功或失敗皆無）
- [ ] 篩選器
  - [ ] 【重點】本頁**沒有任何篩選器 UI** — 沒有組別下拉選單、沒有狀態篩選、沒有日期區間篩選、沒有搜尋框、沒有排序切換；清單內容完全由伺服器端依角色決定的 `where` 條件所控制
- [ ] 批量選取 UI
  - [ ] 【重點】本頁**沒有**批量選取多筆報帳單的 UI — 沒有每列 checkbox、沒有「全選」按鈕、沒有批次核准/拒絕的動作列；每筆報帳單只能個別點擊核准或拒絕
  - [ ] 注意與 `BatchAuditButton`（見下方元件區塊）的「批次」語意不同：那是針對「單一報帳單內多筆收據」做 AI 批次審核，且該元件並未出現在本頁
- [ ] 檢視單筆報帳單詳情的方式
  - [ ] 不是可展開/收合（無 accordion、無點擊列展開的互動）、不是跳轉新頁（無 `next/link`／`<Link>` 導頁）、不是彈出 modal — 每筆報帳單卡片**永遠完整呈現**在列表中
  - [ ] 但費用明細只截斷顯示前 3 筆（`report.items.slice(0, 3)`），超過 3 筆時僅顯示純文字「+{N-3} 更多項目」／「+{N-3} more items」，**沒有任何方式**（按鈕、連結、展開箭頭）可以在本頁看到第 4 筆以後的項目內容
- [ ] 報帳單卡片內容（卡頭區）
  - [ ] 報帳單標題：`report.title`（粗體大字）
  - [ ] 「提交者」／「Submitted by」＋ `report.submitter?.name || report.submitter?.email`（無姓名則退回顯示信箱）
  - [ ] 建立日期（`formatDate(report.createdAt, language)`，`toLocaleDateString`，`zh-TW`/`en-US` locale，格式為數字年＋2位數月＋2位數日）＋「•」符號＋「{report.items.length} 筆項目」／「{report.items.length} items」（此處是報帳單**總**項目數，非下方預覽截斷後的 3 筆）
  - [ ] 右上角總金額：固定「$」前綴＋`Number(report.totalAmount).toFixed(2)`（固定兩位小數、**無千分位逗號**、中英文皆用「$」不會因語言切換成 NT$ 或「元」）
  - [ ] 狀態徽章：文字為 `report.status.replace("_", " ")`（**原始英文 enum**，只是把底線換成空白，例如顯示「PENDING MANAGER」或「PENDING FINANCE」）
    - [ ] 【重要不一致】徽章文字**沒有走中英文 i18n**，即使 `language === "zh"` 也不會顯示「待主管審核」／「待財務審核」等中文字，是全頁唯一沒有跟著語言切換的文字
    - [ ] 【重要 bug】徽章顏色**寫死**為 `bg-yellow-100 text-yellow-700`，不論實際狀態是什麼一律黃底黃字；沒有使用專案共用的 `lib/constants/expense-status.ts`（`STATUS_CONFIG`/`getStatusColor()`/`getStatusLabel()`，其中已正確定義 PENDING_MANAGER=黃/「待主管審核」、PENDING_FINANCE=藍/「待財務審核」等中英文標籤與配色，且已被 `expenses-content.tsx` 採用）
    - [ ] 對 `ADMIN` 角色影響最明顯：其列表混合了 `PENDING_MANAGER` 與 `PENDING_FINANCE` 兩種報帳單，但徽章顏色與文字完全相同，**視覺上無法分辨**目前是哪個審核階段
- [ ] 報帳單卡片內容（收款帳戶區，僅 `report.bankAccount` 存在時整塊顯示；若無綁定帳戶則整塊不顯示，**沒有**「尚未提供收款帳戶」之類的替代提示文字）
  - [ ] `Building2` 圖示＋「收款帳戶」／「Bank Account」＋ `bankName`
  - [ ] 若有 `branchName`：以「- 分行名稱」灰字附加顯示
  - [ ] 「帳號」／「Account」＋（依角色遮罩或完整，見上方權限差異）
  - [ ] 「戶名」／「Holder」＋ `accountHolder`
- [ ] 報帳單卡片內容（費用明細區，標題「費用明細」／「Expense Items」）
  - [ ] 每筆項目（最多前 3 筆）由左到右：
    - [ ] 若 `item.receiptUrl` 存在：收據縮圖（`ReceiptPreview`，`size="sm"`，8×8）＋ `Paperclip`（迴紋針）小圖示（兩者同時顯示，屬重複的視覺提示——縮圖本身已足以代表「有附件」）
    - [ ] `item.description`（過長會被截斷 `truncate`）
    - [ ] 金額：固定「$」前綴＋`item.amount.toFixed(2)`
  - [ ] 收據縮圖互動（`components/receipt-preview.tsx`）：
    - [ ] 點擊縮圖 → 全螢幕深色遮罩（`bg-black/70`）+ 置中放大圖（`max-w-[90vw] max-h-[90vh]`）+ 右上角白底 `X` 關閉鈕，透過 `createPortal` 掛到 `document.body`
    - [ ] 點擊遮罩空白處也會關閉放大檢視
    - [ ] 縮圖按鈕有原生 `title` 提示文字：「檢視{alt}」，在本頁 `alt` 被設為 `item.description`，故 hover 顯示「檢視{項目描述}」
    - [ ] 若圖片來源不符合允許格式（僅允許 `data:image/jpeg`、`data:image/png`、`data:image/webp`、`data:image/gif` 開頭，或 `https://` 開頭，或 `/` 開頭的相對路徑）→ 縮圖改顯示灰底通用 `ImageIcon` 佔位圖示，而非破圖
  - [ ] 超過 3 筆時的提示文字：「+{N-3} 更多項目」／「+{N-3} more items」（純文字，非按鈕/連結，見上方「檢視方式」重點）
- [ ] 操作按鈕（每張卡片右下角固定「拒絕」在左、「核准」在右；**不論角色或狀態，兩顆按鈕永遠都渲染**，沒有依角色 hide/disable 特定按鈕——因為列表本身已依角色只抓取該角色能處理的狀態，實際權限把關落在 server action）
  - [ ] 「拒絕」／「Reject」按鈕：`X` 圖示＋文字，紅色外框樣式（`border-destructive text-destructive`，hover 淡紅底）
    - [ ] 點擊後跳出**瀏覽器原生** `window.prompt()`（**不是**自訂 Modal／Dialog 元件），文字逐字：中文「請輸入拒絕原因：」／英文「Please enter rejection reason:」
    - [ ] 若使用者按「取消」，或直接按確定但沒輸入任何文字（回傳空字串）→ `if (!reason) return`，**靜默中止**，不會呼叫 server action，也沒有任何提示告知「原因為必填」
    - [ ] 沒有 trim／格式驗證：只要輸入內容為真值字串（包含純空白字元）就會被當成有效原因送出
    - [ ] 有輸入才會呼叫 `rejectReport(reportId, reason)`；本頁**沒有另外的確認對話框**（`prompt()` 本身兼作「輸入原因」與「確認」兩用途）
  - [ ] 「核准」／「Approve」按鈕：`Check` 圖示＋文字，綠色實心樣式（`bg-green-600`，hover `bg-green-700`）
    - [ ] 點擊**沒有任何確認對話框**（不會問「確定要核准嗎？」），直接呼叫 `approveReport(reportId)`
  - [ ] 動作成功（核准或拒絕）：前端直接把該筆從 `localReports` 陣列以 `filter` 移除（樂觀更新式的即時消失），**沒有任何成功 toast／訊息文字**
  - [ ] 本頁**沒有「退回」（RETURNED／returnForRevision）按鈕**，即使 `app/actions/approvals.ts` 中存在 `returnForRevision` function 且 `RETURNED` 是五種報帳單狀態之一（橘色）。經比對，`returnForRevision` 實際是被 `components/reports-content.tsx`（`/dashboard/reports` 路由，不在本次盤點範圍）呼叫使用，而非本頁。改版時需確認「退回」功能是否也要出現在 `/dashboard/approvals` 頁面
- [ ] Server actions 權限與狀態機細節（`app/actions/approvals.ts`，供本頁按鈕呼叫）
  - [ ] `approveReport(reportId)`
    - [ ] 未登入 → `requireAuth()` 內部 throw `"Unauthorized"`
    - [ ] 找不到報帳單 → throw `"Report not found"`
    - [ ] 當前 `status === "PENDING_MANAGER"`：僅 `LEADER` 或 `ADMIN` 可核准，否則 throw `"Insufficient permissions: Leader approval required"`；核准後狀態轉為 `PENDING_FINANCE`
    - [ ] 當前 `status === "PENDING_FINANCE"`：僅 `FINANCE` 或 `ADMIN` 可核准，否則 throw `"Insufficient permissions: Finance approval required"`；核准後狀態轉為 `PAID`
    - [ ] 其餘狀態（`PAID`/`REJECTED`/`RETURNED`）→ throw `"Report is not in a pending state"`（不可核准）
    - [ ] 交易內連動寫入：更新 `ExpenseReport.status`；新增 `ApprovalAction`（`action: "APPROVE"`，**無** `comment`）；新增 `AuditLog`（`action: "APPROVE"`，`newData: { status: nextStatus }`）
    - [ ] 完成後只 `revalidatePath("/dashboard")` 與 `revalidatePath("/dashboard/approvals")`（**不會** revalidate `/dashboard/expenses`，提交人自己的報帳單列表頁快取不會被這個動作立即刷新）
  - [ ] `rejectReport(reportId, comment)`
    - [ ] 找不到報帳單 → throw `"Report not found"`
    - [ ] 當前 `status === "PENDING_MANAGER"`：僅 `LEADER`/`ADMIN` 可拒絕，否則 throw `"Only Leaders can reject at this stage"`
    - [ ] 當前 `status === "PENDING_FINANCE"`：僅 `FINANCE`/`ADMIN` 可拒絕，否則 throw `"Only Finance can reject at this stage"`
    - [ ] 其餘狀態 → throw `"Report cannot be rejected in its current state"`
    - [ ] 交易內連動寫入：狀態→`REJECTED`；新增 `ApprovalAction`（`action: "REJECT"`，`comment` = 使用者輸入的拒絕原因）；新增 `AuditLog`（`action: "REJECT"`，`newData: { status: "REJECTED", rejectionReason: comment }`）
    - [ ] 完成後同樣只 revalidate `"/dashboard"`、`"/dashboard/approvals"`（不含 expenses 頁）
  - [ ] `returnForRevision(reportId, comment)`（**本頁未使用**，但邏輯記錄於此供比對）
    - [ ] 角色需為 `LEADER`／`FINANCE`／`ADMIN`，否則 throw `"Insufficient permissions to return for revision"`
    - [ ] 【重點差異】權限檢查比 `approveReport`/`rejectReport` **寬鬆**：後兩者會嚴格比對「目前是哪個 pending 階段」對應「哪個角色」，但 `returnForRevision` 只檢查狀態字串是否包含 `"PENDING"`（`report.status.includes("PENDING")`，`PENDING_MANAGER`／`PENDING_FINANCE` 皆符合），並未限制「LEADER 只能退回 PENDING_MANAGER」「FINANCE 只能退回 PENDING_FINANCE」——理論上 FINANCE 可退回一筆仍在 PENDING_MANAGER 階段的報帳單，反之亦然
    - [ ] 非 pending 狀態 → throw `"Only pending reports can be returned for revision"`
    - [ ] 交易內連動寫入：狀態→`RETURNED`；新增 `ApprovalAction`，`action` 欄位值為 `"RETURN"`（**注意**：與系統詞彙表所述「action 只會是 APPROVE 或 REJECT」不同，程式碼實際還會寫入第三種字串值 `"RETURN"`），`comment` = 退回原因；新增 `AuditLog`（`action: "RETURN_FOR_REVISION"`，`newData: { status: "RETURNED", returnReason: comment }`）
    - [ ] 完成後 revalidate `"/dashboard"`、`"/dashboard/approvals"` **且** `"/dashboard/expenses"`（與 approve/reject 只 revalidate approvals 不同，這裡連提交人自己的頁面也會刷新）
  - [ ] 上述所有 `throw new Error(...)` 訊息**皆為英文、未 i18n**；目前因本頁把錯誤吞進 `console.error` 而不會外露給使用者，但若改版加上錯誤提示 UI，需注意這些英文字串會直接出現在中文介面中
- [ ] 語言切換：頁面文案透過 `useLanguage()` 取得的 `language`（"zh"/"en"）以三元運算式切換中英文，除了「狀態徽章文字」（見上方重點）以外的文字皆有雙語

**使用的共用元件：**
- `ReceiptPreview`（`components/receipt-preview.tsx`）— 收據縮圖＋點擊放大 Modal（`createPortal`）
- `lucide-react` 圖示：`Check`、`X`、`Clock`、`Building2`、`Paperclip`
- `maskAccountNumber`（`lib/utils/mask-account.ts`）
- `formatDate`（`lib/utils.ts`）
- `useLanguage`（`lib/language-context`）

**呼叫的 server actions：**
- `approveReport`（`app/actions/approvals.ts`）
- `rejectReport`（`app/actions/approvals.ts`）
- （`returnForRevision` 定義於同檔案，但本頁未呼叫；實際呼叫方在 `components/reports-content.tsx`）

---

## 元件：BatchAuditButton／批次 AI 審核單一報帳單內所有收據項目

> 【範圍備註】依程式碼實際引用關係，`BatchAuditButton` 目前**並未**出現在 `/dashboard/approvals`（`ApprovalsContent`）頁面中；它實際被引用於 `components/expenses-content.tsx`（`/dashboard/expenses`「我的報帳單」頁面，不在本次盤點範圍）。以下仍依指示詳細記錄其行為與權限邏輯，供改版時比對「AI 批次審核」功能是否也要／已經涵蓋在審核頁面。

- [ ] Props：`reportId`（必填，字串）／`reportTitle`（可選字串，**目前元件內收到後完全沒有被使用**，屬未使用的 dead prop）／`onAuditComplete`（可選 callback，審核完成後把 `BatchAuditResult` 往上層傳遞）
- [ ] 觸發條件
  - [ ] 不需要事先勾選/選取任何項目或收據——按鈕代表「對這整份報帳單的全部收據項目」一次執行 AI 審核
  - [ ] 點擊**沒有**任何前置確認對話框（不會問「確定要執行批次審核嗎？」），點下去立即開始呼叫 server action
- [ ] 權限（實際檢查點在 server action `batchAuditExpenseReport`／`hasAuditPermission()`，位於 `app/actions/ocr.ts`，元件本身不做權限判斷、按鈕永遠可點擊）
  - [ ] 允許執行的條件：呼叫者是「報帳單提交人本人」（`submitterId` 或 `submitterEmail` 相符）**或**呼叫者角色為 `ADMIN`／`FINANCE`
  - [ ] 【重點 LEADER vs FINANCE 差異】`LEADER` 角色**不在**「特權角色」清單中——若 LEADER 不是該報帳單的提交人，會被判定無權限，回傳「權限不足」錯誤；只有 `FINANCE` 與 `ADMIN` 可以對「別人」的報帳單執行批次審核
  - [ ] 未登入 → 回傳一個 `success:false` 的 `Unauthorized` 結果（走與一般失敗相同的渲染路徑，見下方 Modal 錯誤區塊）
  - [ ] 找不到報帳單 → 回傳「找不到報帳單」錯誤結果
- [ ] 按鈕文字與狀態（`variant="outline"`）
  - [ ] 預設（未載入）：`FileStack` 圖示＋逐字文字「批次審核全部收據」
  - [ ] 審核中（`isLoading === true`）：`Loader2` 圖示（`animate-spin` 轉圈）＋逐字文字「批次審核中...」，按鈕 `disabled`
  - [ ] 【重點】審核過程中**沒有**進度條或百分比即時呈現（例如「第 3/10 筆」這類逐筆進度文字並不存在）——載入中只有 spinner + 靜態文字，直到整批完成才一次性回傳結果
  - [ ] 審核中無法從 UI 中途取消
- [ ] 完成後開啟結果 Modal（共用 `components/ui/modal.tsx`，未指定 `size` 故用預設 `"md"`；可用 `Esc` 鍵、點擊背景遮罩、或右上角 `X` 三種方式關閉）
  - [ ] Modal 標題：`FileStack` 圖示＋逐字文字「批次審核結果」
  - [ ] 總覽區（4 欄 grid）：
    - [ ] 「總項目」＝ `result.totalItems`（灰底 `bg-muted`）
    - [ ] 「已審核」＝ `result.auditedItems`（灰底）
    - [ ] 「通過」＝ `result.passedItems`（綠底綠字 `bg-green-100`/`text-green-600`，深色模式 `bg-green-900/30`）
    - [ ] 「未通過」＝ `result.failedItems`（紅底紅字 `bg-red-100`/`text-red-600`，深色模式 `bg-red-900/30`）
  - [ ] 通過率長條（僅 `result.auditedItems > 0` 時顯示；**這是完成後的統計視覺化，不是審核進行中的即時進度條**）
    - [ ] 文字「通過率」＋ 百分比數字：`Math.round(passedItems / auditedItems * 100)` + `%`
    - [ ] 視覺：紅色底槽（`bg-red-200`）＋綠色前景條（`bg-green-500`，寬度＝通過率百分比，有 `transition-all` 動畫）
  - [ ] 「各項目審核結果」清單標題，內容為可捲動區（`max-h-60 overflow-y-auto`），逐筆列出 `result.results`：
    - [ ] 左側狀態圖示（`getStatusIcon` 邏輯，依序判斷）：
      - [ ] 該筆 `result.success === false`（審核本身出錯/失敗）→ 紅色 `XCircle`
      - [ ] `isValid === true` → 綠色 `CheckCircle2`（通過）
      - [ ] `isValid === false` → 紅色 `XCircle`（不通過）
      - [ ] 以上皆非（例如 `isValid` 為 `undefined`）→ 黃色 `AlertTriangle`
    - [ ] 項目描述文字 `item.description`（過長截斷 `truncate`）
    - [ ] 右側 `Badge`：
      - [ ] 若該筆 `result.success` 為真：顯示配對分數「{matchScore}%」；`isValid` 為真時 `variant="default"`，否則 `variant="destructive"`
      - [ ] 若該筆 `result.success` 為假：`variant="outline"`，文字為 `issues[0]?.message`，若無則顯示逐字文字「無法審核」
  - [ ] 錯誤訊息區塊（僅 `result.error` 存在時顯示）：紅色邊框卡片（`border-red-200`/`bg-red-50`，深色模式對應色）顯示 `result.error` 文字內容
    - [ ] 前端 `catch` 到例外時的 fallback 行為：`console.error("批次審核失敗:", error)`（開發者主控台），並組出固定結果物件——`totalItems`/`auditedItems`/`passedItems`/`failedItems` 全部為 0、`results` 為空陣列、`error: "批次審核失敗"`——同樣開啟同一個 Modal 顯示此錯誤狀態，**沒有另外設計獨立的 error UI**

**使用的共用元件：**
- `Button`（`components/ui/Button.tsx`）
- `Modal`（`components/ui/modal.tsx`）— 支援 `Esc`／背景點擊／`X` 三種關閉方式
- `Badge`（`components/ui/badge.tsx`）
- `lucide-react` 圖示：`Loader2`、`CheckCircle2`、`XCircle`、`AlertTriangle`、`FileStack`

**呼叫的 server actions：**
- `batchAuditExpenseReport`（`app/actions/ocr.ts`，**不在** `app/actions/approvals.ts` 內；內部依 `hasAuditPermission()` 做「本人或 ADMIN/FINANCE」的權限判斷）

---

# 五、資金／組別預算／銀行帳戶

## 路由：/dashboard/funding／資金管理頁（依角色顯示「組別預算」與「資金記錄」兩區塊）

- [ ] Server Component（`app/dashboard/funding/page.tsx`），進入前以 `auth()` 檢查登入
  - [ ] 未登入 → `redirect("/login")`
- [ ] 角色白名單 `ALLOWED_ROLES = ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"]`
  - [ ] `USER` 角色不在白名單內 → 直接 `redirect("/dashboard")`（沒有「權限不足」提示頁或訊息，使用者只會被靜默導回主控台，感受不到「為何進不來」的說明）
- [ ] 無 `loading.tsx` / `error.tsx` / `not-found.tsx`（已確認資料夾內只有 `page.tsx`）；三個資料查詢各自在 server action 內 try/catch，失敗時回傳空陣列/預設值（見下方 server actions），因此資料庫錯誤時頁面呈現的是「空資料」而非錯誤畫面
- [ ] 並行讀取三組資料（`Promise.all`）：`getFundingRecords()`、`getFinancialSummary()`、`getDepartmentFinancialSummary()`
- [ ] 版面：`<div className="space-y-8">` 內依序渲染
  - [ ] `<DepartmentBudgetContent>` — 只要通過角色白名單即渲染（含 VICE_LEADER / LEADER）
  - [ ] `<FundingContent>` — **條件渲染**：只有 `FULL_FUNDING_ROLES = ["FINANCE", "ADMIN"]` 才會渲染這整塊；VICE_LEADER / LEADER 完全看不到資金記錄列表、財務總覽卡片、篩選列、「新增資金」按鈕（不是唯讀顯示，是整段 JSX 不輸出，DOM 中不存在）
- [ ] 頁面本身（page.tsx）不含任何文案/按鈕，純資料組裝 + 角色分流

使用的共用元件：
- [ ] `DepartmentBudgetContent`（components/department-budget-content.tsx）
- [ ] `FundingContent`（components/funding-content.tsx，僅 FINANCE/ADMIN 可見）

呼叫的 server actions：
- [ ] `getFundingRecords()` — app/actions/funding.ts
- [ ] `getFinancialSummary()` — app/actions/funding.ts
- [ ] `getDepartmentFinancialSummary()` — app/actions/budget.ts

---

## 元件：FundingContent／資金記錄列表、新增/編輯/刪除、篩選、財務總覽卡片（嵌入 /dashboard/funding，僅 FINANCE、ADMIN 可見）

### Header
- [ ] 標題「資金記錄」/ "Funding Records"（`Wallet` icon，`h1 text-3xl font-bold`）
- [ ] 副標「管理贊助、捐款和其他收入來源」/ "Manage sponsorships, donations, and other income sources"
- [ ] 「新增資金」/ "Add Funding" 按鈕（右上角，`Plus` icon，一般 `Button` 元件預設樣式，**不是**特殊配色）→ 開啟「新增資金記錄」Modal（`showAddModal=true`）
  - [ ] ⚠ 對照 `FundingDialog`（主控台頁的另一個「新增資金」入口）：兩者文案都是「新增資金」，但視覺樣式完全不同（見下方 FundingDialog 區塊），改版時需決定是否統一

### 訊息提示（頁面層級，來自共用 hook `useMessage`）
- [ ] 使用 `hooks/useMessage.ts`（3 秒後自動消失），成功樣式綠底綠字（`bg-green-50 text-green-700 border border-green-200`）、失敗樣式紅底紅字（`bg-red-50 text-red-700 border border-red-200`）
- [ ] 顯示位置：頁面主體內、Header 下方、總覽卡片上方（**不是** modal 內部）
- [ ] ⚠ 重要缺陷：編輯（`handleUpdate`）失敗時，也是呼叫這個「頁面層級」的 `showMessage`，但當下「編輯資金記錄」Modal 仍是開啟狀態（失敗不會關閉 modal），而該 Modal 是 `fixed inset-0 z-50` 全螢幕遮罩（**未使用** `createPortal`，見下方技術細節），會直接蓋住頁面主體 → 使用者實際上**看不到**這則編輯失敗訊息，除非自行關閉 Modal
- [ ] 刪除（`handleDelete`）失敗時同樣呼叫此 banner；但刪除沒有開啟任何 Modal（用瀏覽器原生 `confirm()`），所以這個情境下訊息可正常被看到

### 財務總覽卡片（3 張，`grid md:grid-cols-3`）
- [ ] 卡片1「目前餘額」/ "Current Balance"：漸層背景（`from-primary/10 via-background to-background`），數字 `text-3xl font-bold`，餘額 ≥0 綠字、<0 紅字（`formatCurrency(financialSummary.currentBalance)`）
- [ ] 卡片2「總收入」/ "Total Income"：`TrendingUp` 綠色 icon + 綠字金額（`text-2xl font-bold text-green-600`）
- [ ] 卡片3「總支出」/ "Total Expense"：`TrendingDown` 紅色 icon + 紅字金額（`text-2xl font-bold text-red-600`）
- [ ] 計算方式（來自 `getFinancialSummary`）：`totalIncome` = 所有 `FundingRecord.amount` 加總（**不限筆數**，非只算畫面上的 50 筆）；`totalExpense` = 所有狀態為 `PAID` 的 `ExpenseReport.totalAmount` 加總；`currentBalance = totalIncome - totalExpense`
  - [ ] ⚠ 注意：總覽卡片是「全部歷史資料」的加總，但下方表格只顯示最新 50 筆（見下方），兩者數字可能對不起來，若使用者手動加總表格上的金額不會等於卡片顯示的總收入

### 篩選列
- [ ] 搜尋框：placeholder「搜尋標題或來源...」/ "Search title or source..."（`Search` icon），僅比對 `title` 與 `source` 欄位（不含 `description`、`type`、`recordedBy`），大小寫不敏感
- [ ] 類型下拉選單：預設「所有類型」/ "All Types"，其餘 5 個選項來自 `FUNDING_TYPES`（贊助/Sponsorship、捐款/Donation、補助金/Grant、募款活動/Fundraising、其他/Other）
- [ ] ⚠ 篩選只作用在**已抓取的最新 50 筆**（`getFundingRecords()` 有 `take: 50` 上限，且無分頁/載入更多機制），無法搜尋 50 筆以前的歷史記錄，且畫面上沒有任何提示告知使用者資料被截斷到 50 筆

### 記錄表格（`table`，欄位由左至右）
- [ ] 欄位標題（逐字）：「日期」/"Date"、「標題」/"Title"、「類型」/"Type"、「來源」/"Source"、「金額」/"Amount"（靠右）、「記錄者」/"Recorded By"、「操作」/"Actions"
- [ ] 日期欄：`formatDate(record.date)`（`yyyy/MM/dd` 或依語言 locale 格式，取自 `lib/utils.ts`）
- [ ] 標題欄：主標題 + 若有 `description` 則在下方灰色小字顯示（`truncate max-w-xs`，**過長會被裁切成刪節號且沒有 title/tooltip 可看全文**，需開啟編輯 Modal 才能看到完整備註）
- [ ] 類型欄：徽章樣式（`bg-primary/10 text-primary rounded text-xs`），文字為 `getTypeLabel(record.type, language)`
- [ ] 來源欄：無值時顯示「-」
- [ ] 金額欄：綠字加粗（`text-green-600 font-semibold`），`formatCurrency(record.amount)`
- [ ] 記錄者欄：純文字（`record.recordedBy`，建立當下寫入使用者姓名的快照字串，非可點擊連結，事後改名不會回溯更新舊記錄）
- [ ] 操作欄：
  - [ ] 編輯按鈕（`Edit2` icon-only，`title="編輯"/"Edit"`）→ 開啟編輯 Modal 並帶入該筆資料
  - [ ] 刪除按鈕（`Trash2` icon-only，紅字 hover、`title="刪除"/"Delete"`）→ 觸發刪除流程；`isPending` 時 disabled

### 空狀態
- [ ] 篩選後無符合資料時，表格顯示單一橫跨全部欄位（`colSpan={7}`）的列：`Wallet` icon（半透明）+「沒有資金記錄」/ "No funding records"
  - [ ] 注意：這個空狀態同時涵蓋「本來就沒有記錄」與「篩選/搜尋沒有結果」兩種情境，文案沒有區分（沒有「清除篩選」按鈕引導）

### 刪除確認
- [ ] 使用瀏覽器原生 `window.confirm()`，文字逐字：「確定要刪除此資金記錄嗎？」/ "Delete this funding record?"
- [ ] 確認後呼叫 `deleteFundingRecord(id)`；成功後 `window.location.reload()`（整頁重新整理，非局部更新）

### 新增資金記錄 Modal（`showAddModal`）
- [ ] 標題「新增資金記錄」/ "Add Funding Record"（`Plus` icon）+ 右上角 X 關閉鈕
- [ ] Modal 內頂部訊息：`addState.message`（成功/失敗底色同上），**不含**逐欄位錯誤訊息（即使 server action 回傳 `errors.title` / `errors.amount` 也不會顯示，只顯示整體訊息）
- [ ] 欄位：
  - [ ] 「標題」/"Title" *（必填，`Input`，placeholder「例如：XX公司贊助」/ "e.g. XX Corp Sponsorship"）
  - [ ] 「金額 (TWD)」/"Amount (TWD)" *（必填，`type="number" step="0.01" min="0"`，placeholder `10000`）
    - [ ] ⚠ 前端 `min="0"` 允許輸入 0，但 server 端 zod 規則是 `positive()`（必須 >0），輸入 0 會通過前端但被伺服器以「金額必須大於 0」拒絕
  - [ ] 「類型」/"Type" *（`select` 下拉，5 個選項同 `FUNDING_TYPES`，僅顯示中文 labelZh 或依語言顯示 labelEn）
  - [ ] 當類型 = OTHER 時，額外顯示「自訂類型」/"Custom Type" *欄位（`Input`，placeholder「輸入類型名稱」/ "Enter type name"）
    - [ ] ⚠ 嚴重落差：此欄位的值（`customType`）**從未被送到 server action**——`createFundingRecord` 的 `rawData` 只讀取 `title/amount/type/source/description/date`，完全沒有讀取 `formData.get("customType")`。使用者填了自訂類型文字，送出後會被靜默丟棄，記錄只會存成 `type: "OTHER"`，畫面上永遠只顯示「其他」/"Other"，看不到使用者輸入的自訂文字。改版時要決定是保留這個輸入框的視覺、還是要真正把值存起來
  - [ ] 「來源」/"Source"（選填，`Input`，placeholder「贊助者名稱」/ "Sponsor name"）
  - [ ] 「入帳日期」/"Date"（`type="date"`，預設值為今天）
  - [ ] 「備註」/"Notes"（選填，`textarea`，placeholder「補充說明...」/ "Additional notes..."）
- [ ] 按鈕列：「取消」/"Cancel"（關閉 modal）、「確認新增」/"Add"（送出中顯示 `Loader2` 轉圈 +「提交中...」/"Submitting..."）
- [ ] 成功後：500ms 延遲（`setTimeout`）關閉 modal 並 `window.location.reload()`

### 編輯資金記錄 Modal（`editingRecord`）
- [ ] 標題「編輯資金記錄」/ "Edit Funding Record"（`Edit2` icon）+ X 關閉鈕
- [ ] **不使用** `useFormState`／不經過 `<form>`，改用本地 state（`editForm`）+ 按鈕 `onClick` 直接呼叫 `updateFundingRecord`；因此**沒有**任何欄位驗證錯誤顯示（server 若回傳 `errors` 也不會被讀取/顯示，只會走前述「訊息可能被 Modal 蓋住看不到」的路徑）
- [ ] 欄位（無 `*` 必填標示，纯文字 Label，與新增 Modal 略不同）：
  - [ ] 「標題」/"Title"（`Input`）
  - [ ] 「金額」/"Amount"（`Input type="number"`，**沒有** `step`/`min` 限制，與新增表單的 `step="0.01" min="0"` 不一致）
  - [ ] 「類型」/"Type"（`select`，同 5 個選項）
  - [ ] 類型 = OTHER 時顯示「自訂類型」/"Custom Type"欄位（同樣**不會**被送出，`handleUpdate` 組出的 payload 完全沒有 `customType` 欄位）
  - [ ] 「來源」/"Source"（`Input`）
  - [ ] 「日期」/"Date"（`type="date"`）
  - [ ] 「備註」/"Notes"（`textarea`）
- [ ] 按鈕列：「取消」/"Cancel"、「確認更新」/"Update"（送出中 `Loader2` +「更新中...」/"Updating..."）
- [ ] 成功後：直接關閉 modal（`setEditingRecord(null)`）+ `window.location.reload()`（無延遲，與新增流程的 500ms 延遲不同）

### 其他技術細節（利於比對改版後是否漏掉）
- [ ] 兩個 Modal（新增/編輯）皆是 component 內直接 `return` 的 `fixed inset-0 z-50` 覆蓋層，**未使用** `createPortal`（與專案 CLAUDE.md 建議的 modal 寫法不同，也與 `bank-account-settings.tsx` / `bank-account-select-dialog.tsx` 的 portal 寫法不一致）
- [ ] 點擊 Modal 外側黑色遮罩**不會**關閉 Modal（只能按 X 或「取消」）
- [ ] 頁面初次載入資料已由 server component 準備好（props 傳入），元件本身無 loading skeleton；所有 `Loader2` 轉圈都只出現在「送出表單」的當下（`isPending`）

使用的共用元件：
- [ ] `Button`（components/ui/Button.tsx）
- [ ] `Input`（components/ui/input.tsx）
- [ ] `Label`（components/ui/label.tsx）
- [ ] `useMessage`（hooks/useMessage.ts）
- [ ] `useLanguage`（lib/language-context.tsx，繁中/英文切換，預設 `zh`）
- [ ] `FUNDING_TYPES` / `getTypeLabel` / `formatCurrency` / `formatDate`（lib/constants/funding.ts，其中 `formatCurrency` 轉發自 lib/currency.ts、`formatDate` 轉發自 lib/utils.ts）

呼叫的 server actions（app/actions/funding.ts）：
- [ ] `createFundingRecord(prevState, formData)`
  - [ ] 權限：需 `requireFinanceAccess()`（FINANCE/ADMIN），否則回傳「未授權或權限不足」
  - [ ] 驗證失敗訊息：「驗證失敗」（附欄位錯誤：`title` 必填 →「標題為必填」；`amount` 必須 >0 →「金額必須大於 0」）
  - [ ] 成功訊息：「資金記錄已新增」
  - [ ] 例外訊息：「新增失敗，請稍後再試」
- [ ] `updateFundingRecord(id, data)`
  - [ ] 權限同上，未通過回傳「未授權或權限不足」
  - [ ] 驗證失敗：「驗證失敗」
  - [ ] 成功：「資金記錄已更新」
  - [ ] 例外：「更新失敗，請稍後再試」
- [ ] `deleteFundingRecord(id)`
  - [ ] 權限同上，未通過回傳「未授權或權限不足」
  - [ ] 成功：「記錄已刪除」
  - [ ] 例外：「刪除失敗」
- [ ] （page 層已呼叫，非本元件直接呼叫）`getFundingRecords()` — 只抓最新 50 筆（`take: 50`，`orderBy date desc`）
- [ ] （page 層已呼叫）`getFinancialSummary()`

---

## 元件：FundingDialog／主控台首頁的快捷「新增資金」彈窗（嵌入 /dashboard 頁首，非 /dashboard/funding 頁）

- [ ] ⚠ 此元件**不是**在 /dashboard/funding 頁使用，而是被 `components/dashboard-content.tsx` 匯入，顯示在**主控台首頁 `/dashboard`** 的頁首按鈕列（`{canAddFunding && <FundingDialog />}`，`canAddFunding = role === "FINANCE" || role === "ADMIN"`，與 funding 頁的 `FULL_FUNDING_ROLES` 邏輯相同）
- [ ] 與 `FundingContent` 內建的「新增資金記錄」Modal 是**兩套獨立實作**，但都呼叫同一個 server action `createFundingRecord`（明顯重複的 UI，改版時應評估合併）
- [ ] 觸發按鈕：文字固定「新增資金」（**沒有**接語言 context，永遠中文，即使切到英文介面也不會變成 "Add Funding"）；樣式為醒目琥珀色（`bg-amber-500 hover:bg-amber-600 text-black`，帶 `shadow-amber-500/30` 光暈 + hover 時上浮 `-translate-y-0.5`），與 `FundingContent` 那顆樸素預設樣式的「新增資金」按鈕視覺完全不同
- [ ] Modal 標題「新增資金記錄」（`DollarSign` icon —— 注意與 FundingContent 新增 Modal 用的 `Plus` icon 不同）+ X 關閉鈕
- [ ] 使用 `useFormState` + `<form action={handleSubmit}>`，Modal 內頂部顯示 `state.message`（成功綠色/失敗紅色）
- [ ] 欄位（**沒有**自訂類型/OTHER 的額外輸入框，與 FundingContent 的新增表單不同）：
  - [ ] 「標題 *」（`Input`，placeholder「例如：XX公司贊助」）+ 逐欄位錯誤 `state.errors?.title?.[0]`（**這裡有**顯示欄位級錯誤，FundingContent 新增表單反而沒有）
  - [ ] 「金額 (TWD) *」（`type="number" step="0.01" min="0"`，placeholder `10000`）+ 逐欄位錯誤 `state.errors?.amount?.[0]`
  - [ ] 「類型 *」（`select`，5 個選項，**固定顯示中文 labelZh**，不論語言設定，因為此檔案未用 `useLanguage`）
  - [ ] 「來源 (公司/個人)」（`Input`，placeholder「贊助者名稱」）
  - [ ] 「入帳日期」（`type="date"`，預設今天）
  - [ ] 「備註」（`textarea`，placeholder「補充說明...」）
- [ ] 按鈕列：「取消」、「確認新增」（送出中 `Loader2` +「提交中...」）
- [ ] 成功後：500ms 延遲關閉 + `window.location.reload()`
- [ ] 僅支援「新增」，**沒有**編輯/刪除功能（那些只存在於 FundingContent）
- [ ] 同樣是直接 `fixed inset-0 z-50` 覆蓋層，未用 `createPortal`；點外側不會關閉

使用的共用元件：
- [ ] `Button`、`Input`、`Label`（components/ui/*）
- [ ] `FUNDING_TYPES`（lib/constants/funding.ts）
- [ ] **不使用** `useLanguage`、**不使用** `useMessage`

呼叫的 server actions：
- [ ] `createFundingRecord(prevState, formData)`（app/actions/funding.ts，訊息文字同上一節列出的新增流程）

---

## 元件：DepartmentBudgetContent／組別預算卡片顯示與（FINANCE/ADMIN）編輯（嵌入 /dashboard/funding，所有允許角色可見）

### 超支警告橫幅
- [ ] 僅 `canEdit`（FINANCE/ADMIN）且存在超支組別時顯示（VICE_LEADER/LEADER 即使自己組別超支也看不到這個彙總橫幅，只會在自己的卡片上看到超支標記，見下）
- [ ] 紅色外框卡片（`border-red-300 bg-red-50`），標題「超支警告」/ "Overspent Warning"（`AlertTriangle` icon）
- [ ] 逐組列出：「{icon} {組別名稱}：超支 {金額}」/ "{icon} {name}: Overspent by {amount}"（金額為 `Math.abs(remaining)`，加粗）

### 訊息提示（本元件**自行**用 `useState` 重新實作一份，未重用 `hooks/useMessage.ts`）
- [ ] 3 秒後自動消失（`setTimeout(() => setMessage(null), 3000)`，行為與共用 hook 相同但是重複的程式碼）
- [ ] 樣式同其他區塊（綠底/紅底）

### 標題列
- [ ] 「組別預算」/ "Department Budgets"（`Building2` icon）

### 組別預算卡片（`grid md:grid-cols-2 lg:grid-cols-3`）
- [ ] 固定只列出 **6 個組別**（不含 MENTOR）：⚡電資組/Electrical、⚙️機構組/Mechanical、📝文書組/Documentation、📣公關組/PR、💰財管組/Finance、🎨意象組/Design
  - [ ] ⚠ 邊界情況：若某位 VICE_LEADER/LEADER 的 `userDepartment` 是 `"MENTOR"`（系統角色詞彙允許的第 7 個組別），因為 `DEPARTMENTS` 陣列只有 6 項、沒有 MENTOR，`visibleDepartments` 過濾後會是**空陣列**——畫面只會看到「組別預算」標題，底下卡片區塊完全空白，沒有任何「這裡沒有你的組別」之類的空狀態提示
- [ ] 每張卡片：
  - [ ] 圖示 + 組別名稱（依語言顯示 zh/en）
  - [ ] 超支時右上角紅色徽章「超支」/ "Overspent"
  - [ ] 卡片本身超支時外框變紅（`border-red-300 bg-red-50/50`）
  - [ ] 「預算」/"Budget" 列：
    - [ ] 非編輯狀態：顯示金額 + （僅 `canEdit`）鉛筆 `Edit2` 小按鈕（**無** `title` 提示文字）→ 進入 inline 編輯
    - [ ] 編輯狀態：`number` 輸入框（**無 `min`/`max`／不限負數**）+ 綠色打勾 `Check` 儲存鈕（**無 title**）+ 紅色 `X` 取消鈕（**無 title**）
      - [ ] ⚠ 沒有數值驗證：UI 與 server action (`updateDepartmentBudget`) 都沒有檢查預算是否 ≥0，理論上可以存入負數預算
      - [ ] 同時間只能有一個組別處於編輯狀態（單一 `editingDept` state）
  - [ ] 「已用」/"Spent" 列：純顯示，來自 `ExpenseReport` 中 `status=PAID` 的加總，不可編輯
  - [ ] 「剩餘」/"Remaining" 列：`budget - spent`，超支時紅字、否則綠字加粗
  - [ ] 進度條：`h-2` 圓角進度條，寬度 = `min(spent/budget*100, 100)%`；顏色：超支紅、>80% 黃、其餘綠
    - [ ] 進度條下方文字「{百分比}% 已使用」/ "{percent}% used"，百分比同樣被 `Math.min(...,100)` 封頂 —— 若實際花費是預算的 150%，畫面仍只會顯示「100% 已使用」，無法從百分比數字看出超支的實際嚴重程度（要看「剩餘」那行的負值才知道）
    - [ ] 邊界情況：若 `budget = 0` 但 `spent > 0`（尚未設定預算就有支出），會被判定超支（`remaining < 0`），卡片會出現紅框 + 「超支」徽章，但進度條寬度因為 `budget > 0` 判斷為假而固定是 0%，造成「進度條 0% 但卡片顯示超支」的視覺矛盾
- [ ] 權限邏輯 `canEdit = userRole === "FINANCE" || userRole === "ADMIN"`
- [ ] 可見範圍 `visibleDepartments` 邏輯：
  - [ ] `canEdit`（FINANCE/ADMIN）→ 看全部 6 組
  - [ ] 有 `userDepartment` 且非 FINANCE/ADMIN（即 VICE_LEADER/LEADER 且有指定組別）→ 只看自己組別那張卡片
  - [ ] 沒有 `userDepartment` 的 VICE_LEADER/LEADER → 看全部 6 組（但不能編輯，因為 `canEdit` 仍為 false）
- [ ] 儲存後：`window.location.reload()`（整頁重整）

使用的共用元件：
- [ ] 僅用 `lucide-react` icons（`AlertTriangle`, `Edit2`, `Check`, `X`, `Building2`）與 `useLanguage`
- [ ] ⚠ **未重用**共用金額格式化 `lib/currency.ts` 的 `formatCurrency`，而是在檔案內自行重新實作一份幾乎相同的 `Intl.NumberFormat("zh-TW", { style:"currency", currency:"TWD", minimumFractionDigits:0, maximumFractionDigits:0 })`（結果視覺上一致，但程式碼重複、未來若共用版本調整格式這裡不會跟著變）
- [ ] ⚠ **未重用** `hooks/useMessage.ts`（自行用 `useState` + `setTimeout` 重寫一份同樣邏輯）

呼叫的 server actions：
- [ ] `updateDepartmentBudget(department, budget)`（app/actions/budget.ts）
  - [ ] 權限檢查：未登入 → 丟出例外 `"Unauthorized"`（英文，未在前端 t() 翻譯，若真的觸發會直接把英文字串丟進 `showMessage("error", error.message)`）
  - [ ] 非 FINANCE/ADMIN → 丟出例外「只有財務或管理員可以更新組別預算」
  - [ ] 成功：回傳 `{ success: true }`（**不含 message**，元件端是自行寫死顯示「預算已更新」/ "Budget updated"，並非來自 server 回傳文字）
  - [ ] 無驗證失敗訊息（server 端沒有 zod schema，任何數字皆會被接受）
- [ ] （page 層呼叫）`getDepartmentFinancialSummary()`：內部整合 `getDepartmentBudgets()`（讀 `DepartmentBudget` 表，含 `updatedBy`/`updatedAt`）與 `getDepartmentExpenses()`（依組別加總 `PAID` 支出）
  - [ ] ⚠ 注意：`getDepartmentBudgets()` 有回傳 `updatedBy`（誰更新的）與 `updatedAt`（何時更新），但 `getDepartmentFinancialSummary()` 組出的 `DepartmentFinancialInfo`（傳給本元件的型別）**只有** `budget/spent/remaining/isOverspent`，完全沒有帶 `updatedBy`/`updatedAt` 給前端——這兩個欄位在資料庫與 server action 都存在，但目前 UI 完全沒有顯示「誰在何時改了預算」，改版若要補上稽核資訊需要調整 `getDepartmentFinancialSummary` 的回傳型別
  - [ ] `getOverspentDepartments()`（app/actions/budget.ts 內定義）：全專案搜尋後**沒有任何頁面/元件呼叫它**，是未被使用的 server action

---

## 元件：BankAccountSettings／收款帳戶設定：列表、新增、編輯、刪除、設為預設（嵌入 /dashboard/settings 頁，僅 VICE_LEADER 以上角色顯示，且只能管理「自己」的帳戶）

- [ ] ⚠ 重要澄清：這裡的「收款帳戶」是**每位使用者自己的**報帳收款帳戶（`BankAccount.userId` 綁定擁有者），**不是**團隊/組織共用的銀行帳戶清單。所有 mutation 都有 `account.userId !== session.user.id` 的擁有權檢查
- [ ] 掛載位置：`components/settings-content.tsx` 第 274 行區塊，條件 `{canManageBankAccounts && (...)}`，來自 `app/dashboard/settings/page.tsx` 呼叫 `canUserManageBankAccounts()`（角色需為 VICE_LEADER/LEADER/FINANCE/ADMIN，`USER` 角色看不到整個「收款帳戶」卡片）
- [ ] 本文件僅涵蓋此帳戶設定區塊本身，同頁面的大頭貼／密碼／通知頻率設定不在本次盤點範圍

### Header
- [ ] 「收款帳戶」/ "Bank Accounts"（`Building2` icon）
- [ ] 「新增帳戶」/ "Add Account" 按鈕（`Plus` icon，`BUTTON_PRIMARY` 樣式）→ 開啟新增帳戶對話框

### 訊息提示
- [ ] 本元件自己用 `useState` 存 `message`，**沒有** `setTimeout` 自動清除 —— 與 `useMessage`（3秒消失）及 `DepartmentBudgetContent`（自建 3 秒消失）都不同，這裡的成功/失敗訊息會**一直顯示到下一次操作蓋掉它為止**（不會自動消失）
- [ ] 樣式：成功綠色 / 失敗紅色（同其他區塊配色）

### 帳戶列表
- [ ] 空狀態：`Building2` icon（半透明）+「尚未設定收款帳戶」/ "No bank accounts set up" + 補充小字「新增帳戶以便在提交報帳單時選擇收款方式」/ "Add an account to select payment method when submitting reports"
- [ ] 每筆帳戶卡片（`isDefault` 時外框變主色 `border-primary bg-primary/5`）：
  - [ ] 銀行名稱（`account.bankName`）+（有值才顯示）分行「- {branchName}」
  - [ ] 預設帳戶時顯示徽章「預設」/ "Default"（`Star` icon）
  - [ ] 「帳號: {遮蔽後帳號}」/ "Account: {masked}" —— 使用 `maskAccountNumber()`（lib/utils/mask-account.ts）：帳號長度 ≤8 顯示「****+末4碼」，>8 顯示「前4碼+****+末4碼」
  - [ ] 「戶名: {accountHolder}」/ "Holder: {accountHolder}"
  - [ ] 操作按鈕（皆 icon-only + `title` 提示）：
    - [ ] `Star`「設為預設」/ "Set as default" —— 僅非預設帳戶才顯示這顆按鈕
    - [ ] `Edit`「編輯」/ "Edit" —— 注意用的是 `Edit`（非 `Edit2`，與 FundingContent 的編輯 icon 不同一套）
    - [ ] `Trash2`「刪除」/ "Delete"（`BUTTON_DESTRUCTIVE_SM` 樣式）
  - [ ] `isPending` 期間三顆按鈕皆 disabled

### 刪除確認
- [ ] `window.confirm()`，文字逐字：「確定要刪除此帳戶嗎？已使用此帳戶的報帳單仍會保留記錄。」/ "Are you sure you want to delete this account? Reports using this account will retain the record."
- [ ] 確認後呼叫 `deleteBankAccount`（軟刪除，`isActive=false`），成功後從本地 `accounts` state 移除該筆（**沒有** `window.location.reload()`，是局部更新，與新增流程不同）

### 新增收款帳戶對話框（`createPortal` 至 `document.body`，`z-[9999]`）
- [ ] 標題「新增收款帳戶」/ "Add Bank Account" + X 關閉鈕
- [ ] 表單使用 `useFormState(createBankAccount)`，欄位見下方共用 `BankAccountFormFields`
- [ ] Modal 內若失敗顯示 `formState.message`（紅字，僅當 `!formState.success` 時顯示）
- [ ] 按鈕列：「取消」/"Cancel"、「新增」/"Add"（`Check` icon，送出中 `Loader2` 轉圈，`SubmitButton` 用 `useFormStatus`）
- [ ] ⚠ 成功後行為：`if (formState.success && formState.message) { window.location.reload() }` 這段判斷式寫在 component **render 期間**直接執行（不是 `useEffect`），會立即整頁重整，使用者幾乎看不到「收款帳戶新增成功！」這則成功訊息（沒有像 FundingContent／FundingDialog 那樣有 500ms 延遲讓使用者看到成功提示）

### 編輯收款帳戶對話框（`createPortal`，`z-[9999]`）
- [ ] 標題「編輯收款帳戶」/ "Edit Bank Account" + X 關閉鈕
- [ ] 表單**不經過** `useFormState`，用原生 `onSubmit` + `FormData` 手動組資料呼叫 `updateBankAccount`
- [ ] 欄位同 `BankAccountFormFields`，但帶入 `defaultValues=editingAccount`（含真實未遮蔽的帳號全碼，可直接編輯——遮蔽只用於列表顯示，編輯框內看得到完整帳號）
- [ ] **不顯示**「設為預設帳戶」勾選框（此欄位只在新增表單出現，編輯時要設預設得靠列表上的星星按鈕）
- [ ] 按鈕列：「取消」（`isPending` 時 disabled）、「儲存」/ "Save"（`Check` icon + `isPending` 時 `Loader2`）
- [ ] 成功後：關閉對話框 + 局部更新本地 state（**沒有整頁重整**，與「新增」流程的立即 reload 不同）

### 共用表單欄位 `BankAccountFormFields`（新增/編輯共用）
- [ ] 「銀行/郵局 *」/ "Bank *"：
  - [ ] 預設為下拉選單（`select`），首項「選擇銀行」/ "Select bank"，其後 30 個選項，格式「{銀行名稱} ({代碼})」，資料來自 `TAIWAN_BANKS`（lib/constants/banks.ts），依序：中華郵政(700)、臺灣銀行(004)、臺灣土地銀行(005)、合作金庫(006)、第一銀行(007)、華南銀行(008)、彰化銀行(009)、上海商業儲蓄銀行(011)、台北富邦銀行(012)、國泰世華銀行(013)、兆豐國際商業銀行(017)、花旗銀行(021)、王道銀行(048)、臺灣企銀(050)、渣打銀行(052)、台中商業銀行(053)、滙豐銀行(081)、華泰銀行(102)、陽信銀行(108)、板信商業銀行(118)、三信商業銀行(147)、聯邦銀行(803)、遠東國際商業銀行(805)、元大銀行(806)、永豐銀行(807)、玉山銀行(808)、凱基銀行(809)、星展銀行(810)、台新銀行(812)、安泰銀行(816)、中國信託(822)
  - [ ] 下拉選單旁有「其他」/ "Other" 按鈕，點擊切換成自由輸入文字框（placeholder「輸入銀行名稱」/ "Enter bank name"），此時旁邊按鈕變成「選擇」/ "Select" 可切回下拉選單
  - [ ] 編輯既有帳戶時，若該帳戶的 `bankName` 不在 30 間清單內，**自動**以自由輸入模式呈現（不需手動點「其他」）
- [ ] 「分行名稱」/ "Branch Name"（選填，placeholder「例如：板橋分行」/ "e.g., Banqiao Branch"）
- [ ] 「帳號 *」/ "Account Number *"（`minLength=5`，placeholder「輸入帳號」/ "Enter account number"）
- [ ] 「戶名 *」/ "Account Holder *"（placeholder「輸入戶名」/ "Enter account holder name"）
- [ ] 「設為預設帳戶」/ "Set as default account" 勾選框 —— **僅新增時顯示**（`!defaultValues` 才 render），編輯模式沒有這個選項
  - [ ] 即使未勾選，若這是使用者的第一個帳戶，系統仍會自動設為預設（server 端邏輯，見下）
- [ ] 所有欄位皆無前端 `maxLength` 限制（僅 server 端 zod 有長度上限），僅 `accountNumber` 有 `minLength=5` 對應到 server 端「帳號至少需要 5 位數」

使用的共用元件：
- [ ] `useLanguage`
- [ ] `TAIWAN_BANKS`（lib/constants/banks.ts）
- [ ] `maskAccountNumber`（lib/utils/mask-account.ts）
- [ ] `BUTTON_PRIMARY` / `BUTTON_MUTED` / `BUTTON_MUTED_SM` / `BUTTON_DESTRUCTIVE_SM` / `INPUT_CLASS`（lib/ui-constants.ts）
- [ ] `createPortal`（渲染到 `document.body`，搭配 `mounted` state 避免 SSR hydration 問題）

呼叫的 server actions（app/actions/bank-accounts.ts）：
- [ ] `createBankAccount(prevState, formData)`
  - [ ] 未登入：「未授權」
  - [ ] 角色不足（非 VICE_LEADER+）：「您沒有權限管理收款帳戶」
  - [ ] 驗證失敗：「驗證失敗」（zod 逐欄位：銀行名稱「銀行名稱為必填」/「銀行名稱過長」；分行「分行名稱過長」；帳號「帳號至少需要 5 位數」/「帳號過長」/「帳號只能包含數字和連字號」；戶名「戶名為必填」/「戶名過長」）
  - [ ] 成功：「收款帳戶新增成功！」
  - [ ] 例外：「資料庫錯誤：新增帳戶失敗」
  - [ ] 邏輯：若 `isDefault=true`，先把該使用者其他帳戶預設取消；若是使用者第一筆帳戶（`existingCount===0`），無論有沒有勾選都自動設為預設
- [ ] `updateBankAccount(accountId, data)`
  - [ ] 未登入：「未授權」；角色不足：「您沒有權限管理收款帳戶」
  - [ ] 手動輸入驗證（非 zod）：「銀行名稱不可為空」、「帳號至少需要 5 位數」、「戶名不可為空」
  - [ ] 帳戶不存在：「帳戶不存在」
  - [ ] 非本人帳戶：「您只能編輯自己的帳戶」
  - [ ] 成功：「帳戶更新成功！」
  - [ ] 例外：「資料庫錯誤：更新帳戶失敗」
- [ ] `deleteBankAccount(accountId)`（軟刪除）
  - [ ] 未登入：「未授權」；角色不足：「您沒有權限管理收款帳戶」
  - [ ] 帳戶不存在：「帳戶不存在」；非本人：「您只能刪除自己的帳戶」
  - [ ] 成功：「帳戶已刪除」；例外：「資料庫錯誤：刪除帳戶失敗」
  - [ ] 邏輯：軟刪除設 `isActive=false, isDefault=false`；若刪除的剛好是預設帳戶，自動把「最舊的」其餘啟用中帳戶設為新預設
- [ ] `setDefaultBankAccount(accountId)`
  - [ ] 未登入：「未授權」；角色不足：「您沒有權限管理收款帳戶」
  - [ ] 帳戶不存在：「帳戶不存在」；非本人：「您只能設定自己的帳戶」；已停用帳戶：「無法將停用的帳戶設為預設」
  - [ ] 成功：「已設為預設帳戶」；例外：「資料庫錯誤：設定預設帳戶失敗」
- [ ] （client 端 fallback，當 server 沒回傳 message 時使用的預設文字）：刪除成功「帳戶已刪除」/"Account deleted"、刪除失敗「刪除失敗」/"Delete failed"、設預設成功「已設為預設」/"Set as default"、設預設失敗「設定失敗」/"Failed to set default"、更新成功「帳戶已更新」/"Account updated"、更新失敗「更新失敗」/"Update failed"
- [ ] （page 層呼叫）`getBankAccounts()`：只回傳目前登入者自己、`isActive=true` 的帳戶，依 `isDefault desc, createdAt desc` 排序
- [ ] （page 層呼叫）`canUserManageBankAccounts()`：回傳布林值決定是否渲染本元件
- [ ] `getBankAccountForReport(reportId)`：全專案搜尋**沒有任何地方呼叫**，是未被使用的 server action（原意應是給報帳單詳情頁依權限決定是否遮蔽帳號用的 `canViewFullAccount` 邏輯，但目前沒有 UI 串接）

---

## 元件：BankAccountSelectDialog／選擇收款帳戶彈窗（目前程式碼庫中沒有任何頁面/元件引用——孤兒元件）

- [ ] ⚠ 全專案搜尋（含 `.tsx`/`.ts`）僅在 `components/bank-account-select-dialog.tsx` 自己的檔案內找得到 `BankAccountSelectDialog` 這個名字，**沒有任何 import** 它。也就是說目前使用者無論如何操作都不會看到這個彈窗，它並未掛載在報帳表單或任何路由上
- [ ] 交叉比對：實際的報帳表單 `components/expense-form.tsx`（約 346-390 行）是**另外自己刻了一份**功能幾乎相同的「收款帳戶」radio 選擇 UI（同樣是列表 + 單選圓點 + 遮蔽帳號），並沒有使用這個 `BankAccountSelectDialog` 元件
- [ ] 改版時需決定：(a) 把 `expense-form.tsx` 內建的選擇 UI 換成呼叫這個 Dialog 元件以消除重複，或 (b) 直接刪除這個未使用的元件。**兩種選擇都要先確認 `expense-form.tsx` 現有的收款帳戶選擇邏輯是否被完整記錄**（該檔案不在本次盤點清單內，需與負責報帳表單的人核對）

### 內容明細（假設被啟用時的行為）
- [ ] `createPortal` 渲染到 `document.body`（`z-[9999]`），需等 `mounted`（client-side）才渲染，避免 SSR 問題
- [ ] Header：「選擇收款帳戶」/ "Select Bank Account"（`Building2` icon）+ X 關閉鈕（`isPending` 時 disabled）
- [ ] 空狀態（`accounts.length === 0`）：`AlertCircle` icon + 「您尚未設定收款帳戶」/ "You haven't set up any bank accounts" + 連結按鈕「前往設定」/ "Go to Settings"（`Settings` icon，連到 `/dashboard/settings`，樣式 `BUTTON_PRIMARY`）
  - [ ] 這是唯一的「新增帳戶」快捷入口，且只在完全沒有帳戶時才出現；若使用者已有 ≥1 個帳戶但想再新增一個，這個彈窗內**沒有**任何「新增另一個帳戶」的按鈕/捷徑，必須自行離開此彈窗去設定頁
- [ ] 有帳戶時：
  - [ ] 提示文字「請選擇報帳款項匯入的帳戶：」/ "Select the account for receiving reimbursement:"
  - [ ] 帳戶列表：每筆為可點擊的 `label`（單選 radio，視覺上是圓點勾選，`radio` input 本身 `sr-only` 隱藏），選中時外框變主色（`border-primary bg-primary/5`）
    - [ ] 內容：銀行名稱 +（若有）「- 分行名稱」+（若為預設）「預設」/ "Default" 徽章（`Star` icon）
    - [ ] 次行：`maskAccountNumber(accountNumber)` + " • " + `accountHolder`
  - [ ] 預設選中邏輯：初始 `selectedAccountId` = 該使用者的預設帳戶（`accounts.find(a => a.isDefault)`），若不存在預設帳戶則初始未選取
- [ ] Footer（僅有帳戶時顯示）：「取消」/ "Cancel"（`onCancel`，`isPending` 時 disabled）、「確認提交」/ "Confirm Submit"（`onConfirm(selectedAccountId)`，`isPending` 或未選取帳戶時 disabled）
- [ ] 點擊外側黑色遮罩**不會**關閉
- [ ] ⚠ 與其他元件的落差：本元件**沒有** `Loader2` 轉圈的 import／使用，`isPending` 只會讓按鈕變 disabled，沒有視覺上的載入中提示（其餘元件的送出按鈕多半會換成 `Loader2` 動畫圖示）
- [ ] 本身不呼叫任何 server action，帳戶清單、確認/取消都是透過 props（`accounts`、`onConfirm`、`onCancel`、`isPending`）由外部呼叫者提供，因此資料存取（例如 `getBankAccounts()`）由尚未串接的父層負責

使用的共用元件：
- [ ] `useLanguage`
- [ ] `maskAccountNumber`（lib/utils/mask-account.ts）
- [ ] `BUTTON_PRIMARY` / `BUTTON_MUTED`（lib/ui-constants.ts）
- [ ] `createPortal`

呼叫的 server actions：
- [ ] 無（純展示型元件，資料與動作皆透過 props 注入；型別 `BankAccountData` 引用自 app/actions/bank-accounts.ts 但未直接呼叫其中任何函式）

---

# 六、庫存管理（Inventory）

## 路由：/dashboard/inventory／庫存列表頁（零件清單、篩選搜尋、CRUD、快速入庫領用、進階調整、批量操作入口、QR 入口）

- [ ] 頁面存取控制（page.tsx，server component）
  - [ ] 未登入（`!session?.user`）→ redirect 到 `/login`
  - [ ] `canAccessInventory(role, department)`：`department === "MECHANICAL" || role === "FINANCE" || role === "ADMIN"` 才能進入，不符合則靜默 `redirect("/dashboard")`（沒有任何錯誤訊息或提示文字說明為何被導回，使用者只會發現網址跳掉）
  - [ ] 注意此判斷只控制「能否看到頁面」，並非文件標準的「VICE_LEADER 以上可寫入」——例如 VICE_LEADER/LEADER 角色若不屬於 MECHANICAL 部門，一樣會被整頁擋在外面看不到庫存；反之 USER 角色只要 department 是 MECHANICAL 就能整頁看到（含所有操作按鈕，見下方角色小節）
  - [ ] 資料以 `Promise.all([getAllItems(), getRestockList()])` 在 server 端平行取得，SSR 完成後才整頁輸出，沒有 loading skeleton（全站無 loading.tsx）
- [ ] 頁首（Header）
  - [ ] 標題「庫存管理」／ "Inventory Management"
  - [ ] 副標「管理 FRC 零件庫存」／ "Manage FRC parts inventory"
  - [ ] 4 個操作按鈕（由左至右）：
    - [ ] 「掃描」／ "Scan"（ScanLine icon，外框樣式），為 `<Link>` 導向 `/dashboard/inventory/scan`
    - [ ] 「批量新增」／ "Batch Add"（Layers icon，外框樣式）→ 開啟 BatchInventoryModal（mode="create"）
    - [ ] 「批量調整」／ "Batch Adjust"（ArrowLeftRight icon，外框樣式）→ 開啟 BatchInventoryModal（mode="adjust"）
    - [ ] 「新增零件」／ "Add Item"（Plus icon，primary 實心底色）→ 開啟新增 Modal
  - [ ] **重要角色缺口**：以上 4 個按鈕在原始碼中完全沒有依角色 disabled 或隱藏，USER（僅供檢視）角色一樣能看到並點擊「新增零件」「批量新增」「批量調整」；UI 沒有事先阻擋，是送出後才在對應 server action 內被 `requireInventoryWrite()` 擋下、回傳「未授權的操作」
- [ ] 整頁訊息列（message state，非共用 `useMessage` hook，是元件自己 local state + setTimeout 3 秒手動實作，行為與 hook 相同但邏輯獨立重複一份）
  - [ ] 成功樣式：綠底綠字綠框 `bg-green-50 text-green-700 border border-green-200`
  - [ ] 失敗樣式：紅底紅字紅框 `bg-red-50 text-red-700 border border-red-200`
  - [ ] 顯示位置：Header 下方、補貨提醒 banner 上方
- [ ] 補貨提醒 banner（`restockItems.length > 0` 才顯示）
  - [ ] 黃色底框 `border-yellow-200 bg-yellow-50`
  - [ ] 標題：AlertTriangle icon +「需要補貨 (N)」／ "Need Restock (N)"，N = restockItems.length
  - [ ] 逐個零件顯示為黃色小標籤 pill：「{品名} ({目前數量}/{安全庫存})」
  - [ ] 標籤純顯示、不可點擊互動（不會跳轉或開啟該零件的操作）
- [ ] 篩選與搜尋列
  - [ ] 搜尋框（Search icon），placeholder「搜尋品名、料號或位置...」／ "Search name, SKU or location..."，即時篩選（不需按 Enter 或按鈕）
    - [ ] 比對範圍：品名、料號、儲存位置（皆 `toLowerCase()` 不分大小寫，partial match）
  - [ ] 類別篩選下拉：預設「所有類別」／ "All Categories"，其餘 7 個選項對應 ITEM_CATEGORIES（馬達/感測器/氣壓/控制器/五金/原料/工具，依語言顯示中/英文）
  - [ ] 位置篩選下拉：預設「所有位置」／ "All Locations"，其餘選項為目前所有零件出現過的儲存位置（`Array.from(new Set(...)).sort()` 動態去重排序，非固定清單）
  - [ ] 沒有「僅顯示低庫存」篩選開關 — isLowStock 沒有對應篩選器，只能從表格文字顏色或補貨 banner 間接看出
- [ ] 零件列表表格
  - [ ] 外層 `rounded-xl border bg-card overflow-x-auto`（窄螢幕可橫向捲動）
  - [ ] 表頭精確文字（7 欄）：「品名」／ "Name"、「料號」／ "SKU"、「類別」／ "Category"、「位置」／ "Location"、「數量」／ "Qty"、「安全庫存」／ "Safety"、「操作」／ "Actions"
  - [ ] 空狀態（`filteredItems.length === 0`，涵蓋「原始無資料」與「篩選後無結果」兩種情境但共用同一套文案，不區分）：colSpan=7 置中，Package icon（`opacity-50`半透明）+「沒有零件」／ "No items"
  - [ ] 每列欄位呈現：
    - [ ] 品名：粗體
    - [ ] 料號：等寬字 `font-mono`、灰色
    - [ ] 類別：灰底圓角小標籤（badge），文字透過 `getCategoryLabel()` 轉換為中/英文
    - [ ] 位置：灰色文字
    - [ ] 數量：`currentQuantity <= safetyStockLevel` 時文字變紅粗體 `text-red-600`，否則一般粗體；**只有文字變色，沒有 icon、沒有底色標示**（與補貨 banner、掃描頁的視覺處理不同，見下方「低庫存視覺不一致」總結）
    - [ ] 安全庫存：灰色文字
  - [ ] 每列「操作」欄（一排 icon 按鈕，皆有 `title` tooltip）：
    - [ ] QR Code 按鈕（QrCode icon，hover 藍底 `hover:bg-blue-100 text-blue-600`），`title="QR Code"`（此 title **沒有做中英文切換**，中文模式下也顯示英文字面 "QR Code"）→ 開啟 InventoryQRModal
    - [ ] 入庫按鈕（ArrowDownToLine icon，hover 綠底），title「入庫」／ "Stock In" → 開啟快速入庫 Modal
    - [ ] 領用按鈕（ArrowUpFromLine icon，hover 橘底），title「領用」／ "Stock Out" → 開啟快速領用 Modal
    - [ ] 進階調整按鈕（ArrowUpDown icon，hover 灰底），title「進階調整」／ "Advanced" → 開啟調整庫存 Modal
    - [ ] 編輯按鈕（Edit2 icon，hover 灰底），title「編輯」／ "Edit" → 開啟編輯 Modal（帶入現有資料）
    - [ ] 購買連結按鈕（ExternalLink icon）：僅在 `item.vendorLink && isSafeUrl(item.vendorLink)` 為真才 render；`<a target="_blank" rel="noopener noreferrer">`；title「購買連結」／ "Vendor Link"（若 vendorLink 存在但協議不安全，如 `javascript:`，則此按鈕整個不顯示，沒有替代提示文字說明連結被擋下）
    - [ ] 刪除按鈕（Trash2 icon，紅色文字，hover 紅底）：僅 `isAdmin`（`userRole === "ADMIN"`）為真才 render；`disabled={isPending}`；title「刪除」／ "Delete"
  - [ ] **角色缺口再次強調**：QR／入庫／領用／進階調整／編輯 5 顆按鈕完全沒有角色檢查，USER 一樣能點開所有 Modal 並嘗試送出（送出時才被伺服器擋下）；只有「刪除」用 `isAdmin` 控制顯示與否，且是 **僅限 ADMIN**（比文件基準「VICE_LEADER 以上」更嚴格——`deleteItem()` action 內部也有 `ctx.userRole !== "ADMIN"` 二次檢查，回傳「只有管理員可以刪除零件」）
- [ ] 新增／編輯零件 Modal（同一個 Modal 依 `activeModal === "add" | "edit"` 切換內容，手刻 `fixed inset-0 z-50 bg-black/50`，**非**共用 `components/ui/modal.tsx`）
  - [ ] 標題：「新增零件」／ "Add Item"（新增）或「編輯零件」／ "Edit Item"（編輯）
  - [ ] 表單欄位（由上到下）：
    - [ ] 品名／ Name（文字輸入，無 placeholder）
    - [ ] 料號 (SKU)／ SKU（文字輸入，`font-mono`，placeholder="REV-21-1650"）
    - [ ] 類別／ Category（下拉選單，7 個選項，預設值 HARDWARE 五金）
    - [ ] 儲存位置／ Storage Location（文字輸入，placeholder="A櫃-3層"）
    - [ ] 初始數量／ Initial Quantity（**僅新增模式顯示**，數字輸入；編輯模式完全沒有此欄位——代表編輯零件時無法直接改動庫存數量，必須另外走入庫/領用/進階調整）
    - [ ] 安全庫存水位／ Safety Stock Level（數字輸入）
    - [ ] 購買連結／ Vendor Link（`type="url"`，placeholder="https://..."）
  - [ ] **沒有任何前端即時驗證**：所有欄位皆無必填星號、無逐欄紅框、無即時錯誤字；Save 按鈕唯一 disabled 條件是 `isPending`，未檢查任何欄位是否為空即可送出
  - [ ] 按鈕：「取消」／ "Cancel"（關閉並清空選取）、「儲存」／ "Save"（`isPending` 時文字變「處理中...」／ "Processing..." 並 disabled）
  - [ ] 送出成功：`showMessage("success", result.message)` → 關閉 Modal → **`window.location.reload()` 整頁重新整理**（非局部更新）
  - [ ] 送出失敗：Modal **保持開啟**，於整頁訊息列顯示 `result.message`
  - [ ] **驗證訊息落差（重點）**：後端 `createItem`/`updateItem` 用 zod（`inventoryItemSchema`）驗證失敗時，回傳 `errorState("輸入資料驗證失敗", fieldErrors)`，但前端 `handleAddItem`/`handleUpdateItem` **只讀取 `result.message`，完全沒有使用 `result.errors`（fieldErrors）**——所以使用者送出空白品名或不合法料號時，畫面上永遠只會看到一句籠統的「輸入資料驗證失敗」，看不到具體是哪個欄位、哪句規則（例如「品名為必填」「料號只能包含英數字和破折號」等 zod 訊息完全不會顯示在單筆新增/編輯畫面上）。這點與批量新增（有前端逐欄具體錯誤文字）形成明顯落差
  - [ ] 後端可能回傳的實際文字（僅整句顯示，不分欄位）：
    - [ ] 「品名為必填」
    - [ ] 「料號為必填」
    - [ ] 「料號只能包含英數字和破折號」（regex `^[A-Za-z0-9-]+$`，但如前述這句實際上被 `輸入資料驗證失敗` 蓋掉不會顯示）
    - [ ] 「儲存位置為必填」
    - [ ] 「數量不能為負數」
    - [ ] 「安全庫存不能為負數」
    - [ ] 「請輸入有效的 URL」（vendorLink，允許空字串）
    - [ ] 「料號 {sku} 已存在」（新增時，資料庫查重）
    - [ ] 「料號 {sku} 已被其他零件使用」（編輯時，資料庫查重）
    - [ ] 成功文字：「零件新增成功」／「零件更新成功」
    - [ ] 例外失敗：「資料庫錯誤」
    - [ ] 未授權：「未授權的操作」
- [ ] 刪除零件
  - [ ] 用瀏覽器原生 `window.confirm()`（非自訂 Modal UI），文字：「確定要刪除此零件嗎？」／ "Delete this item?"
  - [ ] 確認後呼叫 `deleteItem`；成功則直接從 `localItems` state 移除該筆（**樂觀式局部更新，不 reload 整頁**——與新增/編輯/調整都會整頁 reload 的行為不同），顯示訊息（伺服器成功訊息「零件已刪除」，或 fallback「已刪除」）
  - [ ] 失敗顯示 `result.message`（例如「只有管理員可以刪除零件」／「資料庫錯誤」／「未授權的操作」）或 fallback「失敗」
- [ ] 調整庫存 Modal（進階，`activeModal === "adjust"`）
  - [ ] 標題「調整庫存」／ "Adjust Stock"
  - [ ] 副標：「{品名} (目前: {currentQuantity})」／ "{name} (Current: {currentQuantity})"
  - [ ] 欄位：
    - [ ] 異動類型／ Transaction Type（下拉選單，5 選項：採購入庫/專案領用/損壞報廢/遺失/盤點調整）
    - [ ] 數量 (正=入庫，負=出庫)／ Amount (+in/-out)（數字輸入，無 min/max 限制，可正可負，預設 0）
    - [ ] 專案 ID／ Project ID（**僅異動類型為「專案領用」PROJECT_USE 時顯示**，文字輸入，placeholder="2024-Robot"）
  - [ ] 按鈕：「取消」、「確認調整」／ "Confirm"（disabled 條件：`isPending || adjustData.amount === 0`，對應 zod「數量不能為 0」規則，但此規則是**純前端擋**，`adjustStock()` server action 本身沒有走 `stockAdjustmentSchema` 做二次驗證）
  - [ ] 成功：「庫存調整成功」；可能失敗：「找不到指定的零件」、「庫存不足：{品名} 目前只有 {available}，無法扣除 {數量}」、「庫存調整失敗，請稍後再試」
- [ ] 快速入庫 Modal（`activeModal === "stockIn"`）
  - [ ] 標題（綠色文字）「零件入庫」／ "Stock In"，帶 ArrowDownToLine icon
  - [ ] 副標同上「{品名} (目前: {currentQuantity})」
  - [ ] 欄位：入庫數量／ Quantity to Add（數字輸入，`min="1"`，置中大字 `text-xl font-bold`）
  - [ ] 按鈕：「取消」、「確認入庫」／ "Confirm"（綠色按鈕，disabled 若 `isPending || amount<=0`）
  - [ ] 成功訊息文字：優先顯示 `result.message`（伺服器固定回「庫存調整成功」），只有伺服器沒回 message 時才會用前端 fallback「入庫成功」／ "Stock in successful"——代表畫面上實際看到的成功文案通常是「庫存調整成功」而非按鈕語意對應的「入庫成功」，用詞不完全對應
- [ ] 快速領用 Modal（`activeModal === "stockOut"`）
  - [ ] 標題（橘色文字）「零件領用」／ "Stock Out"，帶 ArrowUpFromLine icon
  - [ ] 副標同上
  - [ ] 欄位：
    - [ ] 領用數量／ Quantity to Take（數字輸入，`min="1"`、`max={currentQuantity}`，置中大字）
    - [ ] 用途/專案／ Purpose/Project（文字輸入，placeholder「例如: 2024 機器人」／ "e.g. 2024 Robot"）
  - [ ] 按鈕：「取消」、「確認領用」／ "Confirm"（橘色按鈕，disabled 若 `isPending || amount<=0 || amount > currentQuantity`；此上限檢查僅發生在按鈕 disabled 條件，數字輸入框本身用 JS `parseInt(e.target.value) || 0` 直接寫入 state，沒有額外 clamp，理論上仍可打字輸入超出範圍的數字，只是按鈕會被鎖住無法送出）
  - [ ] 成功訊息同樣是「庫存調整成功」（伺服器訊息優先），fallback 才是「領用成功」／ "Stock out successful"
- [ ] 異動紀錄（Transaction History）呈現
  - [ ] **目前完全沒有任何 UI 呈現零件的歷史異動紀錄**（不是列表、不是彈窗、也不是時間軸——就是沒有）
  - [ ] `getAllItems()` 有 `include: { transactions: { orderBy timestamp desc, take: 5 } }` 撈了每個零件最近 5 筆異動，`InventoryItem` 型別也定義了 `transactions?: unknown[]`；`app/actions/inventory.ts` 另外還有獨立的 `getItemWithTransactions(itemId)` action（撈完整歷史紀錄）
  - [ ] 經全專案文字搜尋確認：`getItemWithTransactions` 沒有被任何元件呼叫，`item.transactions` 陣列也沒有被任何元件讀取渲染——資料撈了但完全沒有對應畫面。改版時需要決定：要嘛新增「查看異動紀錄」的按鈕/頁面/彈窗，要嘛確認這是可以清掉的無用查詢
- [ ] Modal 呼叫
  - [ ] `activeModal === "qr"` → `<InventoryQRModal item={selectedItem} onClose={closeModal} />`
  - [ ] `activeModal === "batchCreate"` → `<BatchInventoryModal mode="create" isOpen={true} onClose={closeModal} language={language} onSuccess={()=>window.location.reload()} />`（注意沒有傳 `items` prop）
  - [ ] `activeModal === "batchAdjust"` → `<BatchInventoryModal mode="adjust" isOpen={true} onClose={closeModal} items={localItems} language={language} onSuccess={()=>window.location.reload()} />`
- [ ] Loading／Empty／Error 狀態總結
  - [ ] Loading：無全頁 loading.tsx；操作進行中僅靠按鈕文字變「處理中...」／ "Processing..." + disabled，沒有 spinner／骨架屏
  - [ ] Empty：無零件或篩選無結果共用同一種「沒有零件」文案，不分情境
  - [ ] Error：所有 server action 錯誤皆以整頁頂部訊息列（紅色）呈現，3 秒後自動消失；Add/Edit Modal 出錯時 Modal 本身不會關閉
- [ ] **i18n 缺口（適用本頁與批量彈窗）**：所有 server actions（createItem/updateItem/deleteItem/adjustStock/batchCreateItems/batchAdjustStock）回傳的 `message` 文字都是後端寫死的**繁體中文字串**，沒有語言參數、沒有 i18n 機制；即使把介面語言切成英文，只要畫面直接顯示 `result.message`，看到的仍會是中文（例如英文模式下編輯表單按鈕文字是英文，但驗證失敗訊息「輸入資料驗證失敗」依然是中文）。只有前端寫死的 fallback 文案（如 `t.stockInFailed`）才有對應英文，但只在 `result.message` 為 undefined 時才會用到 fallback

使用的共用元件：
- InventoryQRModal
- BatchInventoryModal
- useMessage（型別匯入，但實際上此頁沒使用該 hook 的 return 值，是自己重寫一份 local state）
- Link（next/link）
- lucide-react：Package, AlertTriangle, Plus, Edit2, Trash2, ArrowUpDown, ExternalLink, Search, ArrowDownToLine, ArrowUpFromLine, QrCode, ScanLine, Layers, ArrowLeftRight
- isSafeUrl（lib/utils）
- getCategoryLabel／isLowStock／ITEM_CATEGORIES／TRANSACTION_TYPES（types/inventory）

呼叫的 server actions：
- getAllItems()
- getRestockList()
- createItem(data)
- updateItem(itemId, data)
- deleteItem(itemId)
- adjustStock(itemId, amount, type, projectId?)

---

## 路由：/dashboard/inventory/scan／QR 掃描與料號查詢頁

- [ ] 存取控制：**此頁原始碼內沒有 `auth()`／角色／department 檢查**，是否能到達完全依賴使用者先經過 `/dashboard/inventory` 的 `canAccessInventory()` 導引，或直接在網址列輸入路徑（只要通過 dashboard layout 的整體登入檢查即可進入，不會再驗證 department/role）
- [ ] 頁首
  - [ ] 返回箭頭（ArrowLeft icon）連回 `/dashboard/inventory`
  - [ ] 標題「QR 掃描」／ "QR Scan"
  - [ ] 副標「掃描或輸入料號查詢庫存」／ "Scan or enter SKU to lookup"
- [ ] 訊息列（獨立 local state `message`，非共用 hook，樣式與庫存列表頁相同綠/紅框，3 秒自動消失）
  - [ ] 「找到零件！」／ "Item found!"（查詢成功）
  - [ ] 「庫存不足」／ "Insufficient stock"（領用數量超過現有庫存時，前端直接擋下不送出請求）
  - [ ] 「已入庫 {n} 個」／ "Added {n}"（入庫成功）
  - [ ] 「已領用 {n} 個」／ "Took {n}"（領用成功）
  - [ ] 「入庫失敗」／ "Stock in failed"（fallback，優先顯示伺服器訊息「庫存調整成功」/錯誤訊息）
  - [ ] 「領用失敗」／ "Stock out failed"（fallback，同上）
- [ ] QR 掃描器區塊：`!showManualInput && showScanner` 時顯示 `<QRScanner onScan={handleScanSuccess} />`（見 QRScanner 元件區塊）
  - [ ] 掃描成功後自動帶入 sku 並觸發查詢（`handleScanSuccess` → `setManualSku` + `handleLookup`），同時 `setShowScanner(false)` **關閉掃描器畫面**，切換為零件詳情卡片（不是跳轉新頁面，是同頁狀態切換）
- [ ] 切換手動輸入按鈕：文字按鈕（Keyboard icon）+「切換到手動輸入」／ "Switch to manual" ↔「切換到相機掃描」／ "Switch to camera"（依 `showManualInput` 狀態切換文字；此按鈕本身永遠顯示）
- [ ] 手動輸入區塊（`showManualInput` 為真時顯示）
  - [ ] label「手動輸入料號」／ "Enter SKU manually"
  - [ ] 文字輸入框：輸入內容**自動轉大寫**（`e.target.value.toUpperCase()`），placeholder「例如: MOTOR-001」／ "e.g. MOTOR-001"，`font-mono text-lg`，按 Enter 鍵可直接觸發查詢
  - [ ] 查詢按鈕（僅 Search icon，無文字）：disabled 條件 `isPending || !manualSku.trim()`
- [ ] 錯誤訊息區塊（獨立於上方訊息列的**第二個**紅色框，顯示 `error` state，兩者可能同時並存）
  - [ ] 「請輸入或掃描料號」／ "Please enter or scan SKU"（sku 空白時嘗試查詢）
  - [ ] 「查詢失敗」／ "Lookup failed"（fallback）
  - [ ] 「找不到指定的料號」（`getItemBySku` 實際查無結果時的訊息）
- [ ] Loading：`isPending && !scannedItem` 時置中純文字「查詢中...」／ "Looking up..."（無 spinner icon）
- [ ] 掃描/查詢結果卡片（`scannedItem` 存在時顯示）
  - [ ] 卡頭：Package icon（藍底圓角方塊）+ 品名（大標題）+ 料號（等寬灰字）
  - [ ] 兩欄資訊格（灰底 `bg-muted/50` 圓角方塊）：
    - [ ] 「目前數量」／ "Current Qty"（大數字；低於安全庫存時文字變紅 `text-red-600`）
    - [ ] 「安全庫存」／ "Safety Stock"（大數字，灰色，不隨庫存狀態變色）
  - [ ] 低庫存警告框（`isLowStock(scannedItem)` 為真才顯示）：黃底框 + AlertTriangle icon +「庫存不足，請補貨！」／ "Low stock, please reorder!"（粗體）——**這是本頁專屬的第三種低庫存視覺處理**（見下方「低庫存視覺不一致」總結）
  - [ ] 位置列：MapPin icon + `storageLocation` 文字
  - [ ] **沒有顯示購買連結（vendorLink）**——即使該零件有設定 vendorLink，掃描結果卡片也不會顯示或提供連結
  - [ ] 快速操作區（上方 `border-t` 分隔線）：
    - [ ] 數量調整器：label「數量」／ "Qty" + 「-」按鈕（`Math.max(1, amount-1)`，最低鎖定為 1）+ 數字輸入框（置中大字，手動輸入也會被 `Math.max(1, ...)` 拉回最低 1）+ 「+」按鈕（無上限）
    - [ ] 「入庫」／ "Stock In" 按鈕（綠色 `bg-green-600`，ArrowDownToLine icon，disabled 若 `isPending || amount<=0`）
    - [ ] 「領用」／ "Stock Out" 按鈕（橘色 `bg-orange-600`，ArrowUpFromLine icon，disabled 若 `isPending || amount<=0 || amount > currentQuantity`）
    - [ ] 「繼續掃描」／ "Scan Another" 按鈕（外框樣式，ScanLine icon，滿版寬度）：呼叫 `resetScanner()` → 清空 `scannedItem`、重新顯示掃描器、`adjustAmount` 重設回 1
- [ ] 入庫/領用成功後行為：呼叫 `handleLookup(scannedItem.sku)` **重新查詢同一零件**以刷新畫面數字（不是 `window.location.reload()`，卡片維持顯示、不會跳回掃描狀態）
- [ ] 角色權限：本頁**沒有任何**角色檢查或按鈕 disabled/隱藏邏輯——USER 一樣能開頁、掃描、輸入數量、點擊入庫/領用；實際寫入在 `adjustStock()` 內被 `requireInventoryWrite()` 擋下，畫面上會顯示為「入庫失敗」/「領用失敗」（因為 `result.message`「未授權的操作」會覆蓋掉 fallback 文字）

使用的共用元件：
- QRScanner
- Link（next/link）
- lucide-react：ArrowLeft, Search, Package, ArrowDownToLine, ArrowUpFromLine, MapPin, AlertTriangle, Keyboard, ScanLine
- isLowStock（types/inventory）

呼叫的 server actions：
- getItemBySku(sku)
- adjustStock(itemId, amount, type)

---

## 元件：InventoryQRModal／顯示零件 QR Code，支援下載 PNG 與列印標籤

- [ ] Modal 外層同樣是手刻 `fixed inset-0 z-50 bg-black/50`（非共用 `components/ui/modal.tsx`），無 Esc/點背景關閉邏輯（只能點右上角 X）
- [ ] 標題固定顯示英文字面「QR Code」（**沒有語言切換**，中文模式也顯示 "QR Code"）+ 右上角關閉按鈕（X icon）
- [ ] QR Code 圖像：`qrcode.react` 套件的 `QRCodeSVG`
  - [ ] **編碼內容 = `item.sku`（純料號字串）**，不是 `item.id`、不是 JSON、不是 URL
  - [ ] `size=180`、`level="H"`（最高容錯率）、`includeMargin={true}`
  - [ ] 外框：白底卡片 `bg-white rounded-lg border`；此區塊同時是 `printRef` 目標，下載與列印都從這個 DOM ref 抓取 `<svg>`
- [ ] 零件資訊列表（QR 下方 4 行，label: value 排版）：
  - [ ] 「料號」／ "SKU"：等寬粗體
  - [ ] 「名稱」／ "Name"：粗體
  - [ ] 「位置」／ "Location"：一般字重
  - [ ] 「數量」／ "Quantity"：粗體（純數字，**沒有低庫存顏色/icon 標示**）
  - [ ] **沒有顯示類別（category）**、**沒有顯示安全庫存水位**、**沒有顯示購買連結**——只有上述 4 項
- [ ] 操作按鈕（下方並排 2 顆）：
  - [ ] 「下載」／ "Download"（Download icon，外框樣式）：把 SVG 序列化後畫進 `<canvas>` 再輸出 PNG，檔名 `{sku}-qr.png`，透過隱藏 `<a download>` 觸發瀏覽器下載
  - [ ] 「列印標籤」／ "Print Label"（Printer icon，primary 實心底色）：`window.open("", "_blank")` 開新視窗，動態組出一份獨立 HTML（黑框白底標籤樣式，內含 QR SVG + sku + name + storageLocation），`window.onload` 自動呼叫 `window.print()`，`onafterprint` 後自動 `window.close()`
- [ ] QR 內容純粹是文字（sku），沒有內嵌 URL／deep link；掃描端（QRScanner + scan page）是把掃到的原始文字直接丟給 `getItemBySku()` 查詢，不做 URL 解析
- [ ] 沒有角色檢查——任何能看到庫存列表頁的角色（含 USER）都能開啟並下載/列印 QR（純檢視功能，不需寫入權限，語意上也合理）

使用的共用元件：
- `QRCodeSVG`（qrcode.react）
- lucide-react：X, Printer, Download

呼叫的 server actions：
- 無（純前端渲染，資料來自父層傳入的 `item` prop，不重新查詢資料庫）

---

## 元件：BatchInventoryModal／批量新增零件與批量調整庫存的表格式輸入彈窗

- [ ] 使用共用 `Modal` 元件（`components/ui/modal.tsx`），`size="2xl"`（`max-w-4xl`）；標題依 mode 決定：「批量新增零件」／ "Batch Add Items" 或「批量庫存調整」／ "Batch Stock Adjustment"
- [ ] 繼承共用 Modal 的關閉互動：右上角 X、**Esc 鍵**、點擊背景遮罩皆可關閉，開啟時鎖定 `body` 捲動，有淡入/縮放進場動畫（200ms）
- [ ] **批量新增 vs 批量調整不是同一個彈窗內的分頁籤（tab）**，而是同一元件靠 `mode` prop 切換渲染內容；由父層 `inventory-content.tsx` 用兩顆不同按鈕分別開啟對應 mode，Modal 內部沒有讓使用者自行切換模式的 UI
- [ ] 工具列（Toolbar，兩模式共用同一排）：
  - [ ] 「新增一行」／ "Add Row"（Plus icon）：`disabled` 條件 `rowCount >= MAX_ROWS`（`MAX_ROWS = 50`）
  - [ ] 「清除全部」／ "Clear All"：清空所有列回到剩 1 個空白列，並清除 `batchResult`
  - [ ] 右側行數提示：「{N} 行」／ "{N} rows"；達上限時額外顯示黃字「(已達上限)」／ "(max reached)"
- [ ] 批量新增表格（mode="create"，7 欄，`sticky top-0` 表頭固定，容器 `max-h-[60vh] overflow-y-auto` + 橫向可捲動）：
  - [ ] 「品名 *」／ "Name *"（文字輸入，placeholder「品名」／ "Name"）
  - [ ] 「料號 *」／ "SKU *"（文字輸入，`font-mono`，placeholder="REV-21-1650"）
  - [ ] 「類別 *」／ "Category *"（下拉選單，7 類別選項，預設 HARDWARE）
  - [ ] 「儲存位置 *」／ "Location *"（文字輸入，placeholder「A櫃-3層」／ "A-3"）
  - [ ] 「初始數量」／ "Init Qty"（數字輸入，`min={0}`，無星號代表非必填，預設 0）
  - [ ] 「安全庫存」／ "Safety"（數字輸入，`min={0}`，預設 0）
  - [ ] 末欄（無標題文字）：刪除該列按鈕（Trash2 icon，紅色），`disabled` 條件 `createRows.length <= 1`（至少保留一行空白列）
  - [ ] **表格沒有「購買連結 (vendorLink)」欄位**——`BatchItemRow` 型別與送出 payload 都包含 `vendorLink` 欄位（送出時固定是空字串 trim 後轉 `undefined`），但畫面上完全沒有對應輸入框；代表批量新增目前無法一次設定購買連結，只能之後用單筆編輯補上，這是與單筆新增表單（有 Vendor Link 欄位）之間的功能落差，改版盤點時要特別留意
- [ ] 批量調整表格（mode="adjust"，6 欄）：
  - [ ] 「零件 *」／ "Item *"（下拉選單，選項為傳入的 `items` prop，顯示「{品名} ({料號})」，預設選項「-- 選擇零件 --」／ "-- Select --"）
  - [ ] 「目前數量」／ "Current"（**唯讀顯示欄，非 input**；選了零件才顯示數字，否則顯示「-」）
  - [ ] 「異動類型 *」／ "Type *"（下拉選單，5 個異動類型選項）
  - [ ] 「數量 *」／ "Amount *"（數字輸入；異動類型為 AUDIT_ADJUSTMENT 時 `min` 不設限可輸入負數，其餘類型 `min={1}`）
  - [ ] 「專案 ID」／ "Project ID"（**僅異動類型為 PROJECT_USE 時**顯示可輸入文字框 placeholder="2024-Robot"，其餘類型顯示灰色「-」佔位、不可輸入）
  - [ ] 末欄：刪除該列按鈕，`disabled` 條件 `adjustRows.length <= 1`
  - [ ] 選擇零件後自動帶入 `itemName`（僅供內部資料使用，畫面上沒有另外顯示這個名稱文字，零件名稱只出現在下拉選單選項內）
  - [ ] 異動數量正負號換算（送出時才自動轉換，使用者在 UI 上只需輸入正數；例外是 AUDIT_ADJUSTMENT）：
    - [ ] PURCHASE_IN 採購入庫 → 自動轉正數
    - [ ] PROJECT_USE 專案領用 → 自動轉負數
    - [ ] DAMAGED 損壞報廢 → 自動轉負數
    - [ ] LOST 遺失 → 自動轉負數
    - [ ] AUDIT_ADJUSTMENT 盤點調整 → 直接採用使用者輸入的正負號（不強制轉換）
- [ ] 逐列錯誤呈現方式（`BatchItemRow`/`BatchAdjustRow` 的 `error` 欄位）：
  - [ ] 儲存格本身**沒有**逐欄下方紅字說明，而是整列變色提示：`row.error` 存在時整列底色 `bg-red-50/50`
  - [ ] 該列中「品名／料號／儲存位置」（create 模式）或「零件下拉／數量」（adjust 模式）輸入框會加紅色外框 `border-red-400`；其餘欄位（類別、初始數量、安全庫存、異動類型、專案ID）即使該列有錯也不會標紅框
  - [ ] 真正的錯誤文字集中顯示在表格**下方獨立區塊**「Row-level errors summary」：AlertCircle icon + 紅色框 `bg-red-50 border-red-200`，逐行列出每個有 `error` 的列的錯誤文字——**但只列文字本身，不標明是第幾行或哪個品名／料號**，若多列有相同錯誤文字會重複出現且難以對應是哪一列
- [ ] 批量新增前端驗證訊息（`validateCreateRows()`，送出前**純前端**擋下，不會呼叫 server）：
  - [ ] 「品名必填」／ "Name required"
  - [ ] 「料號必填」／ "SKU required"
  - [ ] 「類別必填」／ "Category required"
  - [ ] 「儲存位置必填」／ "Location required"
  - [ ] 「料號 {sku} 在批次內重複」／ "SKU {sku} duplicated"（批次內兩列以上填了同樣料號，跨列比對）
- [ ] 批量調整前端驗證訊息（`validateAdjustRows()`）：
  - [ ] 「請選擇零件」／ "Select an item"
  - [ ] 「數量不能為 0」／ "Amount cannot be 0"
- [ ] 送出按鈕：「提交 ({N} 筆)」／ "Submit ({N})"（N=目前總行數），`disabled` 於 `isPending`，文字變「處理中...」／ "Processing..."
- [ ] 取消按鈕：`handleClose()` → 兩種模式的 rows 都重置回各 1 個空白列、清空 `batchResult`，再呼叫 `onClose()`（**Modal 關閉或整頁 reload 後，所有已輸入但未送出的資料會全部遺失，沒有草稿暫存**）
- [ ] 送出後結果摘要（`BatchResult`：`totalCount`／`successCount`／`failedCount`／`message`／`results[]`）：
  - [ ] 結果框樣式：全部成功 → 綠框 `bg-green-50 border-green-200` + CheckCircle2 icon；有任何失敗 → 黃框 `bg-yellow-50 border-yellow-200` + AlertCircle icon
  - [ ] 主要訊息直接顯示 `batchResult.message`（伺服器組出的字串，`buildBatchResult()` 產生，**這段文字永遠是繁體中文，沒有英文版**，即使目前 UI 語言是英文也一樣）：
    - [ ] 全部成功：「全部 {N} 筆新增成功」（批量新增）／「全部 {N} 筆調整成功」（批量調整）
    - [ ] 部分/全部失敗：「{successCount} 筆成功，{failedCount} 筆失敗」
    - [ ] 批次筆數不在 1-50 範圍：「批量數量須介於 1-50 之間」
    - [ ] 未授權：「未授權」
  - [ ] 當 `successCount > 0 && failedCount > 0` 時，結果框內**再多一行**補充摘要（這行才有雙語）：「{successCount} 筆成功，{failedCount} 筆失敗」／ "{successCount} succeeded, {failedCount} failed"
  - [ ] **全部成功**：呼叫 `onSuccess()`（觸發父層整頁 `window.location.reload()`），並 `setTimeout(handleClose, 1500)` 讓成功訊息顯示 1.5 秒後自動關閉 Modal
  - [ ] **部分成功**：呼叫 `onSuccess()`（同樣立即整頁 reload），並把表格內容篩選成「只保留失敗的那幾列」讓使用者修正重送；但因為 `onSuccess` 已觸發整頁 reload，實務上使用者幾乎來不及看到「只剩失敗列」這個中間狀態就被整頁刷新蓋掉——程式邏輯設計與實際使用者體驗有落差，重新設計時應留意（可能需要把 reload 時機延後，或改用局部資料更新而非整頁 reload）
  - [ ] **全部失敗**：不呼叫 `onSuccess`、不 reload，保留所有列，把每列各自對應的失敗原因填入該列 `error`（例如超出庫存會直接顯示「庫存不足：...」這種具體訊息在該列，而非泛用文字）
- [ ] 明確確認**沒有**的功能：
  - [ ] 沒有 CSV/Excel 檔案匯入功能——整個批量輸入只支援表格逐行手動輸入，沒有檔案上傳 input、沒有貼上剖析（paste-to-parse）、沒有範本下載
  - [ ] 沒有「儲存草稿」或跨 session 暫存
- [ ] 角色權限：Modal 內部**沒有**任何角色檢查或欄位/按鈕 disabled 邏輯，USER 一樣能開啟、輸入、送出；只有呼叫 `batchCreateItems`/`batchAdjustStock` 時才在伺服器被 `requireInventoryWrite()` 擋下，回傳整批失敗（`success:false, message:"未授權", totalCount:0, successCount:0, failedCount:0, results:[]`），畫面顯示黃色框「未授權」——與其他驗證失敗共用同一種黃框樣式，文字上不特別強調這是權限問題

使用的共用元件：
- `Modal`（components/ui/modal.tsx）
- lucide-react：Plus, Trash2, AlertCircle, CheckCircle2

呼叫的 server actions：
- batchCreateItems(items[])
- batchAdjustStock(adjustments[])

---

## 元件：QRScanner／相機即時掃描 QR Code（html5-qrcode 封裝）

- [ ] 套件：`html5-qrcode`，透過 `await import("html5-qrcode")` **動態載入**（避免 SSR 問題），非頂層 import
- [ ] 掃描器狀態機（`ScannerState`）：`idle`（未啟動）／`scanning`（掃描中）／`error`（錯誤）
- [ ] Idle 狀態畫面：半透明灰底遮罩 `bg-muted/90` 蓋住掃描框，置中 Camera icon（大圖示）+「點擊下方按鈕啟動相機」／ "Click button below to start camera"
- [ ] 掃描框視覺：正方形容器 `aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-black`，內部 `<div id="qr-reader">` 交給 html5-qrcode 函式庫自行注入相機畫面與掃描框線（**掃描框視覺本身是函式庫內建 UI，非本專案自訂樣式**）
  - [ ] 掃描參數：`fps:15`、`qrbox:{width:200,height:200}`、`aspectRatio:1.0`、鏡頭固定 `facingMode:"environment"`（後鏡頭）
- [ ] 「啟動相機掃描」／ "Start Camera" 按鈕（Camera icon，primary 底色）：狀態非 `scanning` 時顯示，點擊觸發瀏覽器相機權限請求（無自訂的權限說明彈窗，直接跳瀏覽器原生權限提示）
- [ ] 掃描中（`state === "scanning"`）顯示 2 顆按鈕：
  - [ ] 「停止掃描」／ "Stop"（外框樣式）
  - [ ] 重新啟動（RotateCcw icon-only），title「重新啟動」／ "Restart"（會先 stop 再等 100ms 重新 start）
- [ ] 掃描中提示文字（掃描框下方）：
  - [ ] 「將 QR Code 對準框框內，保持距離 10-20 公分」／ "Align QR Code within the frame, keep 10-20cm distance"
  - [ ] 「🔍 掃描中...」／ "🔍 Scanning..."（含 emoji，`animate-pulse` 淡入淡出動畫）
- [ ] Error 狀態畫面：紅底 `bg-red-50` 覆蓋掃描框，XCircle icon（大圖示）+ 錯誤文字；若判定為權限被拒（`hasPermission === false`）額外多顯示一行「請在瀏覽器設定中允許相機權限」／ "Please allow camera access in browser settings"
- [ ] 錯誤文案依錯誤類型分流（比對 `error.message` 字串內容）：
  - [ ] 訊息含 "Permission" 或 "NotAllowedError" → 「相機權限被拒絕」／ "Camera permission denied"
  - [ ] 訊息含 "NotFoundError" → 「找不到相機」／ "No camera found"
  - [ ] 其他未知錯誤 → 「無法啟動相機」／ "Failed to start camera"
- [ ] 掃描成功行為：
  - [ ] 同一組掃到的文字（`decodedText`）在 **5 秒內**（`DUPLICATE_SCAN_COOLDOWN_MS`）重複掃到會被忽略，避免同一張 QR 連續觸發多次 `onScan`
  - [ ] 掃到不重複內容時，裝置支援的話會 `navigator.vibrate(100)` 震動回饋
  - [ ] 呼叫外部傳入的 `onScan(decodedText)` callback（在 scan/page.tsx 對應 `handleScanSuccess`）
  - [ ] 元件本身**不驗證**掃到的內容是否為合法 sku 或存在的零件——任何 QR 碼掃到的文字都會原樣往上丟，交由父層 `getItemBySku()` 查詢決定成功或「找不到指定的料號」
- [ ] 元件 `unmount` 時，`useEffect` cleanup 會自動呼叫 `stopScanner()` 釋放相機（避免背景持續佔用鏡頭）
- [ ] **沒有**「切換前/後鏡頭」按鈕（寫死後鏡頭 `environment`，無法切換自拍鏡頭）
- [ ] **沒有**手電筒/閃光燈開關功能
- [ ] **沒有**「掃描歷史」或最近掃描清單

使用的共用元件：
- `html5-qrcode`（第三方套件，動態載入）
- lucide-react：Camera, XCircle, RotateCcw

呼叫的 server actions：
- 無（純前端相機操作，掃描結果透過 `onScan` prop 回傳給父層處理，本元件不直接呼叫任何 server action）

---

## 跨頁面共通觀察（供改版比對用，非單一路由/元件專屬）

- [ ] **低庫存視覺提示在三個地方各自用不同呈現方式，彼此不一致**（改版時應統一或至少確認是刻意設計）：
  - [ ] 庫存列表表格：數量文字變紅粗體，無 icon、無底色
  - [ ] 庫存列表頁補貨提醒 banner：黃底框 + AlertTriangle icon + 零件名稱/數量 pill 標籤
  - [ ] QR 掃描頁結果卡片：數量文字變紅 **+** 額外一個黃底框 + AlertTriangle icon +「庫存不足，請補貨！」粗體警語
  - [ ] QR Code 彈窗（InventoryQRModal）：完全沒有低庫存提示，數量純數字顯示
- [ ] **伺服器訊息文字沒有 i18n**：`app/actions/inventory.ts` 內所有 `successState`/`errorState`/`BatchResult.message` 字串都寫死繁體中文，英文 UI 模式下這些訊息不會被翻譯，只有各元件自己寫的前端 fallback 文案才有英文版（且只在伺服器沒回 message 時才會用到 fallback，實務上伺服器幾乎都會回 message，所以英文模式下常態會看到中文訊息穿插在英文介面中）
- [ ] **角色寫入限制在 UI 層幾乎不存在**：全部 7 個檔案裡，唯一一處依角色隱藏/顯示寫入按鈕的地方是 inventory-content.tsx 的刪除按鈕（`isAdmin`）；新增/編輯/入庫/領用/調整/批量新增/批量調整的按鈕與表單，在庫存列表頁、QR 掃描頁、批量彈窗全部**沒有**依角色 disabled 或隱藏，USER 角色能開啟所有 Modal、填寫所有表單、按下所有送出按鈕，一直到呼叫 server action 才被 `requireInventoryWrite()` 擋下並顯示「未授權的操作」／「未授權」。改版若要在 UI 層預先擋下 USER，目前完全沒有現成邏輯可抄，需要新增
- [ ] **單筆表單 vs 批量表單的驗證體驗不對等**：單筆新增/編輯 Modal 沒有任何前端驗證，錯誤只能靠伺服器回傳的單一籠統訊息「輸入資料驗證失敗」；批量新增/調整則有完整前端逐列驗證與具體錯誤文字。改版若要統一體驗，需決定往「單筆補上前端驗證＋顯示欄位錯誤」或「批量簡化」哪個方向靠攏
- [ ] 全站慣例：無 `loading.tsx`／`error.tsx`／`not-found.tsx`，本功能的兩個路由皆為 SSR 完整等待或 client state 內部管理 loading/error，無框架層級的載入或錯誤邊界

---

# 七、分析／報表／統計

## 路由：/dashboard/analytics／數據分析頁（圖表 + KPI 總覽，資料為「全站彙總」不分組別）

**入口與權限（重要落差，務必核對）**
- [ ] `app/dashboard/analytics/page.tsx` 的 server-side 權限檢查**只驗證是否登入**（`if (!session?.user) redirect("/login")`），**沒有任何角色（role）限制**——理論上 USER／VICE_LEADER／LEADER／FINANCE／ADMIN 只要登入都能直接用網址進入並看到完整全站數據。
- [ ] 但側邊欄選單設定檔 `components/app-sidebar.tsx`（第 95-101 行）將「數據分析」連結的可見角色設為 `roles: ["FINANCE", "ADMIN"]`——也就是說 USER／VICE_LEADER／LEADER 在導覽列**看不到**這個連結，但若他們直接輸入網址 `/dashboard/analytics` 仍然**可以完整存取**（因為 page.tsx 沒擋）。
  - [ ] 這是「導覽層限制」與「頁面層權限」不一致的落差，重設計時務必決定：要嘛頁面補上角色檢查，要嘛明確承認任何登入者皆可看全站分析。
- [ ] 所有查詢（月度趨勢／類別佔比／狀態分布／總覽卡片）皆**未依組別（department）或提交者（submitter）過濾**，任何能進入此頁的使用者看到的都是全隊/全站彙總資料，不是「只看自己組別」。

**頁面標頭**
- [ ] H1 標題：「數據分析」（zh）／「Analytics」（en）
- [ ] 副標文字：「查看支出統計和趨勢分析」（zh）／「View expense statistics and trends」（en）
- [ ] 語言切換依 `useLanguage()`（`lib/language-context.tsx`），語言只有 `zh`/`en` 兩種，預設 `zh`，存在 `localStorage["language"]`

**總覽 KPI 卡片區（`overview` truthy 時才整塊渲染，grid `md:grid-cols-4`，共 4 張）**
- [ ] 若 `getOverviewStats()` 回傳 `null`（未登入或 catch 到例外），**整個總覽卡片區塊直接消失**，不顯示任何錯誤訊息或 placeholder 文字給使用者（與下方圖表「暫無數據」的明確 empty state 不同，這裡是「靜默消失」）。
- [ ] 卡片 1：`FileText` icon（灰）＋標籤「總報帳單」/「Total Reports」＋數字 `overview.totalReports`（純整數，無千分位、無單位文字）
- [ ] 卡片 2：`Package` icon（灰）＋標籤「總項目數」/「Total Items」＋數字 `overview.totalItems`（純整數）
- [ ] 卡片 3：`DollarSign` icon（灰）＋標籤「總金額」/「Total Amount」＋金額 `formatCurrency(overview.totalAmount)`（見下方貨幣格式說明）
- [ ] 卡片 4：`TrendingUp` icon（灰）＋標籤「本月支出」/「This Month」＋金額 `formatCurrency(overview.thisMonthAmount)`
- [ ] **無趨勢箭頭／無較上期成長或下降百分比**：`TrendingUp` icon 純裝飾用，不隨實際數據方向變化，4 張卡片皆為當下快照數字，沒有任何期間比較。
- [ ] 貨幣格式：`new Intl.NumberFormat(language==="zh"?"zh-TW":"en-US", { style:"currency", currency:"TWD", minimumFractionDigits:0 })`（千分位＋TWD 貨幣符號，無小數）
- [ ] 資料範圍注意：`totalAmount`／`totalReports`／`totalItems` 為**所有狀態**（含已拒絕、已退回）的報帳單加總，並未排除 REJECTED/RETURNED；`thisMonthAmount` 只用 `createdAt >= 本月1號` 過濾，同樣不排除 REJECTED/RETURNED。

**圖表區（grid `lg:grid-cols-2`，共 3 張，圖表庫統一為 `recharts`，import 自 `"recharts"`）**

- [ ] 圖表 1「月度支出趨勢」/「Monthly Expense Trend」（獨立一格）
  - [ ] 類型：`LineChart`（折線圖，單一數列）
  - [ ] 容器：`ResponsiveContainer` width 100% × height 300px
  - [ ] X 軸：`dataKey="month"`，`tickFormatter` 只取字串第 5 碼之後（`value.slice(5)`），因為資料是 `YYYY-MM`，故軸上只顯示兩位數月份（例如 "2026-07" 顯示為 "07"）
  - [ ] Y 軸：`tickFormatter` 為 `` `$${value}` ``（純粹字串前綴 $，**不是** `formatCurrency`，無千分位）
  - [ ] `CartesianGrid strokeDasharray="3 3"`
  - [ ] Tooltip：hover 顯示時用 `formatCurrency` 格式化（與 Y 軸格式不一致——Y軸陽春、Tooltip 完整貨幣格式）
  - [ ] 線條：`type="monotone"`，`dataKey="amount"`，顏色 `#8884d8`（紫），`strokeWidth=2`，資料點 `dot={{fill:"#8884d8"}}`
  - [ ] 無 `Legend`（只有一條線不需要圖例）
  - [ ] 資料來源 `getMonthlyExpenseStats()`：只納入 `status in [PAID, PENDING_FINANCE, PENDING_MANAGER]` 的報帳單（**排除 REJECTED 與 RETURNED**），依 `createdAt` 年月彙總金額，依月份字串升冪排序
  - [ ] Empty state（`monthlyStats.length === 0`）：固定高度 300px 置中顯示文字「暫無數據」/「No data available」（`text-muted-foreground`）

- [ ] 圖表 2「類別佔比」/「Expense by Category」（獨立一格）
  - [ ] 類型：`PieChart`（圓餅圖）
  - [ ] 容器：`ResponsiveContainer` width 100% × height 300px
  - [ ] `Pie`：`cx/cy="50%"`，`labelLine={false}`，`outerRadius={100}`，`dataKey="value"`
  - [ ] 切片標籤（直接畫在圖上）：`` `${name} ${(percent*100).toFixed(0)}%` ``，例如「餐飲 25%」
  - [ ] 切片顏色：依 index 從 `COLORS` 陣列取色（7色循環）：`["#8884d8","#82ca9d","#ffc658","#ff7300","#0088fe","#00C49F","#FFBB28"]`；若類別種類 >7，會重複用色
  - [ ] Tooltip：hover 顯示 `formatCurrency` 格式化金額
  - [ ] 無 `Legend`（僅靠餅圖上的切片標籤，`labelLine=false` 在小佔比類別時可能標籤擁擠/重疊）
  - [ ] 類別標籤對照表 `CATEGORY_LABELS`（定義在 `analytics-content.tsx` 內，僅此元件使用）：`FOOD`餐飲/Food、`TRANSPORT`交通/Transport、`HOUSING`住宿/Housing、`ENTERTAINMENT`娛樂/Entertainment、`UTILITIES`水電/Utilities、`HEALTH`醫療/Health、`OTHER`其他/Other——**共 7 項**
    - [ ] **⚠️ 落差**：專案共用費用類別實際有 9 種（含 Office Supplies、Travel），但此對照表**缺少 `OFFICE_SUPPLIES` 與 `TRAVEL`** 兩項，若資料庫中有這兩類支出，圖上會直接顯示原始英文 enum 字串（未在地化）
  - [ ] 資料來源 `getCategoryExpenseStats()`：查詢**全部** `ExpenseItem`（**無任何狀態篩選**，會把已拒絕/已退回報帳單底下的項目也一併計入金額），依類別加總，依金額降冪排序
    - [ ] **⚠️ 與圖表1邏輯不一致**：月度趨勢圖排除了 REJECTED/RETURNED，但類別圓餅圖完全不排除，兩張圖的「總量」基準不同
  - [ ] Empty state：同上「暫無數據」/「No data available」

- [ ] 圖表 3「狀態分布」/「Status Distribution」（`lg:col-span-2`，橫跨滿版）
  - [ ] 類型：`BarChart`（長條圖，雙 Y 軸／雙數列）
  - [ ] 容器：`ResponsiveContainer` width 100% × height 300px
  - [ ] `CartesianGrid strokeDasharray="3 3"`
  - [ ] X 軸：`dataKey="name"`（狀態中文/英文標籤）
  - [ ] 左 Y 軸（`yAxisId="left"`）：對應「數量」，軸線顏色 `#8884d8`
  - [ ] 右 Y 軸（`yAxisId="right"`）：對應「金額」，軸線顏色 `#82ca9d`
  - [ ] Tooltip：預設樣式（**沒有自訂 formatter**，數量/金額都以原始數字顯示，金額未套用貨幣格式）
  - [ ] `Legend`：顯示兩個數列名稱「數量」/「Count」與「金額」/「Amount」
  - [ ] 長條 1：`yAxisId="left"`，`dataKey="count"`，name「數量」/「Count」，顏色 `#8884d8`（紫）
  - [ ] 長條 2：`yAxisId="right"`，`dataKey="amount"`，name「金額」/「Amount」，顏色 `#82ca9d`（綠）
  - [ ] 狀態標籤對照表 `STATUS_LABELS`（定義在 `analytics-content.tsx` 內）：`PENDING_MANAGER`待主管審核/Pending Manager、`PENDING_FINANCE`待財務審核/Pending Finance、`PAID`已付款/Paid、`REJECTED`已拒絕/Rejected——**只有 4 項**
    - [ ] **⚠️ 落差**：共用的 `ReportStatus` 有 5 種狀態，這裡**缺少 `RETURNED`**（已退回），若資料庫中存在已退回的報帳單，X 軸會直接顯示原始字串 "RETURNED"，不會顯示「已退回」/"Returned"
  - [ ] 資料來源 `getStatusStats()`：`prisma.expenseReport.groupBy({by:["status"]})`，統計每個狀態的報帳單數量與金額總和（自然涵蓋全部 5 種狀態，但顯示層的 label map 少了一種）
  - [ ] Empty state：同上「暫無數據」/「No data available」

**互動性總結**
- [ ] 三張圖皆僅支援 **hover 顯示數值**（recharts 內建 Tooltip），**沒有點擊互動**（點擊長條/切片/線段資料點不會有任何動作、不會跳轉或篩選其他區塊）
- [ ] 三張圖表高度皆固定 300px，寬度皆為容器 100% 自適應

**篩選器**
- [ ] 本頁**完全沒有任何篩選 UI**：無日期範圍選擇器、無組別下拉、無狀態複選、無關鍵字搜尋。所有 4 支 server action 都是一次性撈全部資料，不接受任何篩選參數。

**匯出功能**
- [ ] 本頁**沒有匯出按鈕**（CSV/Excel 匯出功能僅存在於 `/dashboard/reports`，見下一節）

**Loading / Empty / Error 狀態**
- [ ] 無 `loading.tsx`（已用 Glob 確認 `app/dashboard/analytics/` 目錄下只有 `page.tsx`）：這是一個 async server component，4 支 server action 用 `Promise.all` 平行呼叫，**在資料就緒前導覽會整頁 block**（無骨架屏、無 spinner）
- [ ] 無 `error.tsx`：任一 server action 若拋出未被自身 catch 的例外，會交給 Next.js 預設錯誤處理（無自訂錯誤頁）；不過目前 4 支 action 內部都各自 try-catch 並回傳空陣列/`null` 作為降級（見 analytics.ts 段落），所以實務上很少真的拋到外層
- [ ] Empty（無資料）：三張圖各自獨立判斷（`xxxStats.length > 0`），顯示「暫無數據」/「No data available」置中文字；總覽 KPI 卡片區塊則是整塊消失（無文字說明），兩種 empty 呈現方式不一致

**與其他兩頁的關係（避免重設計誤合併）**
- [ ] 本頁是**唯一有圖表視覺化**的頁面（折線圖＋圓餅圖＋雙軸長條圖），`reports`／`stats` 頁都沒有任何 recharts 圖表
- [ ] 本頁的「總報帳單」「總金額」數字與 `/dashboard/reports`、`/dashboard/stats` 的對應卡片是**分別獨立計算**（三處各自下 SQL/Prisma 查詢，沒有共用同一份計算結果），文案與範圍略有差異，重設計時要決定是否統一為單一資料來源
- [ ] 本頁**沒有**報帳單清單/表格、沒有逐筆審核操作（approve/reject/return）、沒有匯出——這些都只在 `/dashboard/reports`

**使用的共用元件**
- `lib/language-context.tsx`（`useLanguage`）
- `recharts`：`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `LineChart`, `Line`, `Legend`
- `lucide-react`：`DollarSign`, `TrendingUp`, `FileText`, `Package`
- 備註：本頁**沒有使用**任何 `components/ui/*` 設計系統元件（無 Card／Button 元件），所有卡片/容器都是手刻 `div` + Tailwind class（例如 `rounded-xl border bg-card p-4`）

**呼叫的 server actions**（皆定義於 `app/actions/analytics.ts`，皆為 `"use server"`，皆只需登入即可呼叫、無角色限制）
- `getMonthlyExpenseStats()`
- `getCategoryExpenseStats()`
- `getStatusStats()`
- `getOverviewStats()`

---

## 路由：/dashboard/reports／所有報表（報帳單列表管理、逐筆審核操作、CSV／Excel 匯出）

**入口與權限**
- [ ] `app/dashboard/reports/page.tsx`：需登入，且 `role` 必須是 `"FINANCE"` 或 `"ADMIN"`，否則 `redirect("/dashboard")`
- [ ] 側邊欄 `components/app-sidebar.tsx` 對「所有報表」連結也設 `roles: ["FINANCE", "ADMIN"]`——**與頁面權限一致**（不像 analytics 頁有落差）
- [ ] 查詢 `prisma.expenseReport.findMany()` **無 where 條件**，撈出系統中**全部**報帳單（不分組別／不分提交者），FINANCE/ADMIN 看到的是全站資料
- [ ] `page.tsx` 內有 `calculateStats()` 算出 `stats`（total/pending/approved/rejected/totalAmount）並傳給 `ReportsContent`，但**此 `stats` prop 在元件內實際未被渲染使用**——畫面上的 5 張統計卡片是元件內部用 `localReports`（client state）即時 `filter().length` 現算出來的，`page.tsx` 傳入的 `stats` 形同未使用的資料

**頁首與匯出按鈕**
- [ ] H1：「所有報表」/「All Reports」
- [ ] 副標：「查看和管理所有報帳單」/「View and manage all expense reports」
- [ ] 匯出按鈕群（`canExport = userRole === "FINANCE" || userRole === "ADMIN"`；因頁面本身已限定角色，此判斷在這頁恆為 true）：
  - [ ] CSV 按鈕：`Download` icon + 文字「CSV」，樣式為白底邊框（`border bg-background hover:bg-muted`），`isExporting` 時 `disabled` + `opacity-50`
  - [ ] Excel 按鈕：`FileSpreadsheet` icon + 文字「Excel」，樣式綠底白字（`bg-green-600 text-white hover:bg-green-700`），`isExporting` 時同樣 disabled
  - [ ] 兩顆按鈕共用同一個 `isExporting` state：點其中一顆匯出時，**另一顆也會被一併鎖住**
  - [ ] **匯出中沒有任何視覺 loading 提示**（無 spinner、按鈕文字不會變成「匯出中...」），使用者唯一能感知的只有按鈕變灰且不可點擊
  - [ ] 點擊後**直接觸發下載，沒有跳出確認彈窗**（不論 CSV 或 Excel）

**訊息提示（⚠️ 未使用共用 hook）**
- [ ] `reports-content.tsx` **沒有 import** `hooks/useMessage.ts`，而是自行在元件內用 `useState<{type,text}|null>` 與本地 `showMessage()` 重新實作同樣邏輯（3000ms 後自動清除），行為上跟共用 hook 幾乎一致但**程式碼重複、未重用共用 hook**，重設計時應統一改用 `useMessage`
- [ ] 訊息 banner 呈現位置：頁首下方、統計卡片上方，樣式：
  - success：`bg-green-50 text-green-700 border border-green-200`
  - error：`bg-red-50 text-red-700 border border-red-200`
- [ ] 逐字訊息內容清單：
  - [ ] CSV／Excel 匯出「沒有資料」：「沒有資料可匯出」/「No data to export」
  - [ ] CSV 匯出成功：「CSV 匯出成功」/「CSV exported」
  - [ ] CSV 匯出失敗（catch）：「匯出失敗」/「Export failed」
  - [ ] Excel 匯出成功：「Excel 匯出成功」/「Excel exported」
  - [ ] Excel 匯出失敗（catch）：「匯出失敗」/「Export failed」（與 CSV 失敗文字完全相同，無法區分是哪個按鈕失敗）
  - [ ] 批准成功：「已批准」/「Approved」
  - [ ] 批准失敗：顯示 `error.message`（動態、來自 server action，非固定文案）
  - [ ] 拒絕原因輸入（**原生 `prompt()` 對話框，非自訂 Modal**）：「請輸入拒絕原因：」/「Please enter rejection reason:」；若使用者取消或留空，**靜默不做任何事**（無錯誤提示）
  - [ ] 拒絕成功：「已拒絕」/「Rejected」
  - [ ] 拒絕失敗：`error.message`（動態）
  - [ ] 退回原因輸入（**原生 `prompt()`**）：「請輸入退回原因：」/「Please enter return reason:」；取消或留空同樣靜默無反應
  - [ ] 退回成功：「已退回修改」/「Returned for revision」
  - [ ] 退回失敗：`error.message`（動態）
  - [ ] 編輯儲存成功：「已更新」/「Updated」
  - [ ] 編輯儲存失敗：`result.message || "Failed"`（注意 fallback 字串 `"Failed"` 是寫死的英文，**沒有中文版 fallback**）
  - [ ] 刪除確認（**原生 `confirm()` 對話框，非自訂 Modal**）：「確定要刪除此報帳單嗎？」/「Are you sure you want to delete this report?」
  - [ ] 刪除成功：「已刪除」/「Deleted」
  - [ ] 刪除失敗：`result.message || "Failed"`（同上，英文 fallback）

**統計卡片區（grid `md:grid-cols-5`，5 張，資料來源是 `localReports` 即時運算，非 `page.tsx` 傳入的 `stats`）**
- [ ] 卡片 1：`FileText` icon + 「總計」/「Total」＋ `localReports.length`
- [ ] 卡片 2：`Clock` icon（黃 `text-yellow-500`）+ 「待審核」/「Pending」＋ 狀態含 "PENDING" 的筆數
- [ ] 卡片 3：`CheckCircle` icon（綠 `text-green-500`）+ 「已核准」/「Approved」＋ 狀態為 "PAID" 的筆數
- [ ] 卡片 4：`XCircle` icon（紅 `text-red-500`）+ 「已拒絕」/「Rejected」＋ 狀態為 "REJECTED" 的筆數
- [ ] 卡片 5：`DollarSign` icon + zh「總金額」／en「Total」（**中英文標籤不對稱**，en 版少了 "Amount"）＋ `` `$${sum.toFixed(2)}` ``（注意：純字串 `$` 前綴＋兩位小數，**沒有用 `Intl.NumberFormat`**，跟 analytics 頁的貨幣格式不一致，也沒有千分位）
- [ ] **這 5 張卡片皆無趨勢箭頭／無較上期比較**，純目前快照數字
- [ ] 這 5 張卡片彼此之間 order 是：總計、待審核、已核准、已拒絕、總金額——**沒有「已退回 RETURNED」的獨立卡片**

**篩選 Tabs（底線樣式，非下拉選單）**
- [ ] 「全部」/「All」（key: all）
- [ ] 「待審核」/「Pending」（key: pending，比對 `status.includes("PENDING")`）
- [ ] 「已核准」/「Approved」（key: approved，比對 `status === "PAID" || status === "APPROVED"`——`"APPROVED"` 不在現行 5 值 `ReportStatus` enum 中，推測為舊狀態機殘留的相容判斷/死代碼）
- [ ] 「已拒絕」/「Rejected」（key: rejected）
- [ ] **⚠️ 沒有「已退回」/RETURNED 篩選 tab**：狀態為 RETURNED 的報帳單只會出現在「全部」分頁，無法單獨篩出
- [ ] 選中樣式：`border-primary text-primary`；未選中：`border-transparent text-muted-foreground`
- [ ] **無日期範圍篩選、無組別篩選、無關鍵字搜尋框**（表格會顯示組別欄位，但不能拿組別當篩選條件）

**報帳單表格**
- [ ] 欄位：標題／組別／提交者／日期／金額／狀態／操作（共 7 欄）
- [ ] 「標題」欄：顯示 `report.title`，下方灰字顯示項目數「X 筆項目」/「X items」；編輯模式下變成文字輸入框
- [ ] 「組別」欄：`bg-primary/10 text-primary` 圓角徽章，只在 `report.department` 有值時渲染；`getDepartmentLabel()` 對照表：`ELECTRICAL`⚡電資組/Electrical、`MECHANICAL`⚙️機構組/Mechanical、`DOCUMENTATION`📝文書組/Documentation、`PR`📣公關組/PR、`FINANCE`💰財管組/Finance、`DESIGN`🎨意象組/Design——**共 6 項**
  - [ ] **⚠️ 落差**：共用 `TeamDepartment` enum 有 7 種（含 `MENTOR` 老師導師），此對照表**缺少 MENTOR**，若報帳單的組別是 MENTOR，徽章會直接顯示原始字串 "MENTOR"（無 icon、未在地化）
- [ ] 「提交者」欄：`report.submitter?.name || report.submitter?.email`（灰字）
- [ ] 「日期」欄：`formatDate()` = `toLocaleDateString(zh-TW 或 en-US)`（灰字）
- [ ] 「金額」欄：`` `$${Number(totalAmount).toFixed(2)}` ``（同樣是純 $ 前綴兩位小數，非 Intl 格式）
- [ ] 「狀態」欄：色塊徽章，`getStatusColor()` 邏輯：
  - PAID 或 APPROVED → 綠 `text-green-600 bg-green-100`
  - REJECTED → 紅 `text-red-600 bg-red-100`
  - 其餘（含 PENDING_MANAGER、PENDING_FINANCE、RETURNED）→ 一律黃 `text-yellow-600 bg-yellow-100`
  - [ ] **⚠️ 與系統共用色彩定義不符**：共用規格是 PENDING_MANAGER黃／PENDING_FINANCE藍／PAID綠／REJECTED紅／RETURNED橘（5色），但此表格只有綠/紅/黃 3 色，PENDING_FINANCE（應藍）與 RETURNED（應橘）目前都被畫成黃色，視覺上無法分辨「待財務審核」跟「已退回」
  - [ ] 編輯模式下狀態欄變成 `<select>` 下拉，選項為 `statusOptions`（PENDING_MANAGER待主管審核、PENDING_FINANCE待財務審核、RETURNED已退回、PAID已付款、REJECTED已拒絕——**這裡完整涵蓋 5 種狀態**，跟前述的 `getStatusColor`/`getStatusLabel` 不完整形成對比）
- [ ] 「操作」欄（依編輯狀態與角色顯示不同按鈕組）：
  - [ ] 編輯模式：`Check` icon（綠，儲存）＋ `X` icon（紅，取消）
  - [ ] 非編輯模式 + 狀態含 "PENDING"：三顆 icon 按鈕：`CheckCircle`（綠，title「批准」/「Approve」）、`XCircle`（紅，title「拒絕」/「Reject」）、`RotateCcw`（黃，title「退回修改」/「Return for Revision」）
    - [ ] 「批准」的實際行為（從呼叫端程式碼可見）：`PENDING_MANAGER` → 變 `PENDING_FINANCE`；其餘（即 `PENDING_FINANCE`）→ 變 `PAID`（樂觀更新 local state，非等 server 回傳新狀態）
  - [ ] 非編輯模式 + `isAdmin`（僅 `ADMIN` 角色，`FINANCE` 沒有）：`Edit2` icon（title「編輯」/「Edit」）＋ `Trash2` icon（紅，title「刪除」/「Delete」）
  - [ ] 行內編輯（Edit2 觸發）**只能改標題與狀態**，無法改組別／金額／提交者／項目明細
- [ ] 空狀態（`filteredReports.length === 0`）：`colSpan=7` 整列文字「沒有報帳單」/「No expense reports」，置中灰字，`p-8`
- [ ] **表格沒有分頁**（不論多少筆都一次全部渲染），**表頭不可點擊排序**（排序固定依 `page.tsx` 查詢時的 `createdAt desc`）

**CSV／Excel 匯出行為細節**
- [ ] CSV 匯出：呼叫 `getReportsForExport()`（**不帶任何參數**）→ 若空陣列則顯示「沒有資料可匯出」訊息並中止 → 檔名 `` `expense_reports_${YYYY-MM-DD}` `` → `exportToCSV()` → 下載 `.csv`
- [ ] Excel 匯出：平行呼叫 `getReportsForExport()` + `getItemsForExport()`（**皆不帶參數**）→ 若 reports 為空則顯示「沒有資料可匯出」並中止（注意：只檢查 reports 是否為空，不檢查 items）→ 檔名同上 `` `expense_reports_${YYYY-MM-DD}` `` → `exportToExcelMultiSheet()` 產生 2 個工作表：`{ name: "報帳單"/"Reports", data: reports }` 與 `{ name: "費用明細"/"Items", data: items }` → 下載 `.xlsx`
- [ ] **⚠️ 匯出不套用目前畫面上的篩選 tab**：不管使用者當前選的是「全部／待審核／已核准／已拒絕」哪個分頁，匯出永遠抓**全部**報帳單資料（`getReportsForExport()` 呼叫時沒有傳入 `filter` state），也就是使用者在「已拒絕」分頁按下匯出，拿到的 Excel 仍是全部狀態的資料
- [ ] `getReportsForExport` 其實支援 `filters?: {startDate, endDate, status}` 參數（見 `export.ts`），但這個 UI **完全沒有暴露**任何日期或狀態篩選控制項給使用者去帶入這些參數——後端能力已具備、前端未接線

**Loading / Empty / Error 狀態**
- [ ] 無 `loading.tsx`/`error.tsx`（同全站慣例），資料在 `page.tsx` server-side 先撈好才渲染，首次進入頁面無 skeleton
- [ ] 匯出中的「loading」只靠按鈕 `disabled` + `opacity-50`，無 spinner
- [ ] 逐筆操作（批准/拒絕/退回/儲存/刪除）用 `useTransition` 的 `isPending` 來 disable 對應按鈕，同樣無 spinner/文字變化

**與其他兩頁的關係**
- [ ] 本頁是三頁中**唯一有「報帳單清單表格」與「逐筆審核操作（批准/拒絕/退回/編輯/刪除）」**的頁面
- [ ] 本頁是三頁中**唯一有匯出功能**（CSV + Excel）
- [ ] 本頁 5 張統計卡片與 `/dashboard/stats` 的 3 張卡片有重疊但**用字不同**：本頁「已核准」＝ `/dashboard/stats` 的「已完成付款」，兩者都是數 `status === PAID` 的筆數，但一頁叫「已核准」一頁叫「已完成付款」
- [ ] 本頁**沒有任何圖表**（折線/圓餅/長條圖皆無），純表格 + 統計數字卡片

**使用的共用元件**
- `lib/language-context.tsx`（`useLanguage`）
- `lucide-react`：`FileText`, `DollarSign`, `Clock`, `CheckCircle`, `XCircle`, `Edit2`, `Check`, `X`, `Trash2`, `Download`, `FileSpreadsheet`, `RotateCcw`
- `react`：`useState`, `useTransition`
- `lib/export-utils.ts`：`exportToCSV`, `exportToExcel`（**import 了但本檔案內實際沒有任何呼叫點，是未使用的 import**）, `exportToExcelMultiSheet`
- 備註：同 analytics 頁，本頁**未使用**任何 `components/ui/*` 元件、未使用共用 `hooks/useMessage.ts`、未使用原生 modal 元件（拒絕/退回原因與刪除確認皆用瀏覽器原生 `prompt()`/`confirm()`）

**呼叫的 server actions**
- `getReportsForExport()`（`app/actions/export.ts`）
- `getItemsForExport()`（`app/actions/export.ts`）
- `approveReport(reportId)`（`app/actions/approvals.ts`，未在本次盤點範圍內詳讀，行為依呼叫端程式碼推斷如上）
- `rejectReport(reportId, reason)`（`app/actions/approvals.ts`）
- `returnForRevision(reportId, reason)`（`app/actions/approvals.ts`）
- `updateReport(reportId, editData)`（`app/actions/expenses.ts`）
- `deleteReport(reportId)`（`app/actions/expenses.ts`）

---

## 路由：/dashboard/stats／系統統計（極簡 3 卡 KPI，⚠️ 側邊欄無此連結）

**入口與權限**
- [ ] 需登入，且 `role` 必須是 `"ADMIN"` 或 `"FINANCE"`，否則 `redirect("/dashboard")`（跟 `/dashboard/reports` 同等級限制）
- [ ] `export const dynamic = "force-dynamic"` + `export const revalidate = 0`：明確強制每次都動態渲染、不做 ISR/靜態快取，確保資料即時
- [ ] **⚠️ 重大發現：這個路由完全沒有出現在 `components/app-sidebar.tsx` 的 `MENU_ITEMS` 清單中**（已用 Grep 搜尋全專案 `.tsx` 檔案確認沒有任何地方有連到 `/dashboard/stats` 的 `<Link>`/`href`）。也就是說，就算 ADMIN/FINANCE 角色的使用者也**在導覽 UI 上完全找不到入口**，只能靠直接在網址列輸入 `/dashboard/stats` 才能到達。重設計時務必決定：這頁是要補上導覽入口、還是本來就是預留/半廢棄的頁面（若是後者，也要明確記錄「保留但不需要接導覽」，避免被誤判成遺漏而重新加回選單卻做錯設計意圖）。

**頁面內容**
- [ ] H1：「系統統計」——**只有中文，沒有英文版**；整頁完全沒有 import/使用 `useLanguage()`，是三頁中唯一沒有雙語支援的頁面（連 analytics/reports 都有 zh/en 切換）
- [ ] 副標：「即時數據」（同樣只有中文）
- [ ] 3 張卡片（grid `md:grid-cols-3`），透過頁面檔案內**本地定義**的 `StatCard` function component 渲染（不是從 `components/` 目錄 import 的共用元件，是 `page.tsx` 內的 inline 元件）：
  - [ ] 卡片 1：label「總報帳單」，value = `stats.totalReports`，無 `colorClass`（預設文字色）
  - [ ] 卡片 2：label「已完成付款」，value = `stats.totalPaid`，`colorClass="text-green-600"`（綠色數字）
  - [ ] 卡片 3：label「近 7 天活動」，value = `stats.recentActivity`，`colorClass="text-blue-600"`（藍色數字）
  - [ ] 卡片樣式：`rounded-xl border bg-card p-6`，label 用 `text-sm text-muted-foreground`，數字用 `text-3xl font-bold mt-2 {colorClass}`
- [ ] **這 3 張卡片皆無趨勢箭頭／無較上期比較／無單位文字**，純數字
- [ ] **完全沒有任何互動元素**：無按鈕、無篩選器、無匯出、無連結、無點擊事件——是純唯讀快照頁

**資料來源（`getStats()`，定義在 `page.tsx` 內部，非 `app/actions/` 底下的可重用 server action）**
- [ ] `totalReports` = `prisma.expenseReport.count()`（全部報帳單數，不分狀態）
- [ ] `totalPaid` = `prisma.expenseReport.count({where:{status:"PAID"}})`
- [ ] `recentActivity` = `prisma.expenseReport.count({where:{createdAt:{gte: now - 7天}}})`（`SEVEN_DAYS_MS` 常數 = 7×24×60×60×1000）——**这是三頁中唯一出現「近 7 天」時間窗口統計的地方**，analytics 和 reports 頁都沒有這個指標
- [ ] 三個查詢皆**無 try-catch**：若 Prisma 呼叫失敗會直接拋出未捕捉例外，交給 Next.js 預設錯誤處理（無自訂 `error.tsx`）

**篩選器／匯出**
- [ ] 無任何篩選器（無日期範圍、無組別、無狀態）
- [ ] 無匯出功能

**Loading / Empty / Error 狀態**
- [ ] 無 `loading.tsx`：`force-dynamic` 意味著每次都重新整頁 SSR，資料撈取期間導覽會 block（無 skeleton）
- [ ] 無 `error.tsx`，且 `getStats()` 內無防護，錯誤會直接讓整頁渲染失敗
- [ ] 無特別的「無資料」樣式：若 `totalReports` 剛好是 0，就單純顯示數字「0」，不像 analytics 頁圖表有「暫無數據」文字

**與其他兩頁的關係（本頁在三頁中功能最少，且高度重疊）**
- [ ] 「總報帳單」與 analytics 頁 `overview.totalReports`、reports 頁「總計」卡片是**同一種指標（全部報帳單數）但三處各自獨立查詢計算**，數字理論上應相同但沒有共用同一份 API/計算邏輯
- [ ] 「已完成付款」＝統計 `status==="PAID"` 筆數，與 reports 頁「已核准」卡片是**完全相同的統計口徑，但文字不同**（一個叫「已完成付款」一個叫「已核准」）
- [ ] 「近 7 天活動」是**本頁獨有**指標，analytics／reports 頁都沒有對應功能，重設計時不能漏掉這個唯一指標
- [ ] 本頁**沒有任何金額／貨幣數字**（三張卡片都是「筆數」計數，不像 analytics 頁有總金額/本月支出等金額類 KPI）
- [ ] 本頁**沒有圖表、沒有表格、沒有匯出、沒有雙語**——是三頁中設計最陽春、最像「內部除錯用小工具」的頁面

**使用的共用元件**
- 無（`StatCard` 為頁面內部 local function component，非共用元件；未使用 `useLanguage`、未使用任何 icon 套件、未使用任何 `components/ui/*`）

**呼叫的 server actions**
- 無：資料撈取邏輯是 `page.tsx` 內部的 local async function `getStats()`，直接呼叫 `prisma`，**不是** `app/actions/` 底下可被其他頁面重用的 server action

---

## 元件：app/actions/export.ts／匯出資料用 Server Actions（3 個匯出資料源：報帳單、費用明細、庫存）

- [ ] 檔案為 `"use server"`，共 3 個 exported async function，各自獨立做權限檢查與 Prisma 查詢，輸出的物件 key 直接是**中文欄位名稱**（因為前端 Excel/CSV 匯出直接把 key 當表頭用）

- [ ] `getReportsForExport(filters?: {startDate?, endDate?, status?})` → 回傳 `ReportExportRow[]`
  - [ ] 權限：`hasFinanceAccess()`（角色須為 `FINANCE` 或 `ADMIN`，來自 `lib/actions/helpers.ts` 的 `FINANCE_ROLES = ["FINANCE","ADMIN"]`），不符合則**靜默回傳空陣列**（不拋錯、不回傳錯誤訊息，呼叫端只會看到「沒有資料」，無法分辨是真的沒資料還是權限不足）
  - [ ] 支援 `filters.startDate`/`filters.endDate`（轉成 `createdAt` 的 `gte`/`lte`）與 `filters.status`（`!== "all"` 時才套用）——**但如前述，`reports-content.tsx` 呼叫時完全沒有傳入 `filters`，此篩選能力目前是後端已具備、前端未串接的「死能力」**
  - [ ] 匯出欄位（順序如下，共 9 欄）：
    1. `報帳單編號`（report.id）
    2. `標題`（report.title）
    3. `提交者`（`submitter?.name || submitter?.email || "Unknown"`）
    4. `提交者Email`（`submitter?.email || ""`）
    5. `狀態`（透過 `STATUS_LABELS` 轉中文：待主管審核／待財務審核／已退回／已付款／已拒絕——**此對照表完整涵蓋 5 種狀態**，跟 analytics-content.tsx 的不完整版本形成對比）
    6. `總金額`（`report.totalAmount`，原始數字）
    7. `建立日期`（`formatDate()` → `YYYY-MM-DD`，即 `toISOString().split("T")[0]`）
    8. `項目數`（`report.items.length`）
    9. `說明`（`report.description || ""`）

- [ ] `getItemsForExport(reportId?: string)` → 回傳 `ItemExportRow[]`
  - [ ] 權限：同樣需要 `hasFinanceAccess()`，不符合靜默回傳空陣列
  - [ ] 可選 `reportId` 參數只匯出單一報帳單的項目，**但 `reports-content.tsx` 呼叫時未帶此參數**，一律匯出全部項目
  - [ ] 匯出欄位（共 7 欄）：
    1. `報帳單`（`item.report.title`，注意是父報帳單標題，不是項目自己的名稱）
    2. `提交者`（`item.report.submitter?.name || "Unknown"`）
    3. `日期`（`formatDate(item.date)`）
    4. `類別`（**⚠️ 直接輸出 `item.category` 原始 enum 字串**，例如 "FOOD"，**沒有經過任何中文對照表**——這跟同檔案內 `報帳單狀態` 有轉中文形成不一致；本檔案雖也定義了 `CATEGORY_LABELS`，但那組對照表是給**庫存類別**用的（MOTOR/SENSOR/PNEUMATIC 等），跟費用類別（FOOD/TRANSPORT 等）是完全不同的兩套 enum，兩者恰巧同名但不能混用）
    5. `說明`（`item.description`）
    6. `金額`（`item.amount`，原始數字）
    7. `收據`（`item.receiptUrl ? "有" : "無"`——只輸出「有/無」，不輸出實際圖片網址或 base64 內容）

- [ ] `getInventoryForExport()` → 回傳 `InventoryExportRow[]`
  - [ ] 權限：只需要 `getAuthenticatedUserId()`（任何登入角色皆可），**比前兩個匯出函式寬鬆很多**
  - [ ] **⚠️ 已用 Grep 確認全專案沒有任何呼叫點**——本次盤點範圍內的 `reports-content.tsx` 沒有呼叫它，且搜尋全站 `.tsx`/`.ts` 也找不到其他呼叫端；推測是庫存頁面（`/dashboard/inventory`，不在本次盤點範圍）預留或已移除呼叫的匯出功能，重設計時需另外確認庫存頁是否該有匯出按鈕
  - [ ] 匯出欄位（共 7 欄）：`品名`、`料號`（sku）、`類別`（經 `CATEGORY_LABELS` 轉中文：馬達/感測器/氣壓/控制器/五金/原料/工具）、`儲存位置`、`當前數量`、`安全庫存`、`購買連結`

**使用的共用元件**
- `lib/prisma.ts`（`prisma` client）
- `lib/actions/helpers.ts`：`hasFinanceAccess`、`getAuthenticatedUserId`

**呼叫的 server actions**
- 本身即為 server actions 集合；目前已知呼叫端：`components/reports-content.tsx` 呼叫 `getReportsForExport`／`getItemsForExport`；`getInventoryForExport` 無已知呼叫端（見上）

---

## 元件：lib/export-utils.ts／CSV／Excel 匯出共用工具函式（client-side，`"use client"`）

- [ ] 套件：`xlsx`（import as `XLSX`）＋ `file-saver`（`saveAs`）
  - [ ] **技術債提醒（依 CLAUDE.md 已知事項，非本次盤點重點但順帶記錄）**：`xlsx` 套件有已知 Prototype Pollution 安全疑慮且官方無修補版本，專案待辦事項是換成 `exceljs`；本次盤點只記錄現況，不處理
- [ ] 常數：`EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`、`MAX_COLUMN_WIDTH = 50`、`CSV_BOM = "﻿"`（CSV 加 BOM 是為了讓 Excel 開啟時中文不亂碼）

- [ ] `validateData(data)`：資料為空陣列時呼叫**原生瀏覽器 `alert("沒有資料可匯出")`**並回傳 `false`
  - [ ] **⚠️ 與呼叫端訊息機制不一致**：`reports-content.tsx` 在呼叫這些匯出函式前，自己已經先檢查過資料是否為空並顯示樣式化的「訊息 banner」（「沒有資料可匯出」），所以目前實務上這個原生 `alert()` 分支**不會在 reports 頁被觸發到**（呼叫端會提前 return）；但這個 `alert()` 邏輯仍留在共用工具函式裡，若未來有其他呼叫端直接呼叫 `exportToCSV`/`exportToExcel` 而不先自行檢查空資料，使用者會看到突兀的瀏覽器原生彈窗，而非站內一致的訊息 banner 樣式
- [ ] `escapeCsvValue(value)`：標準 CSV 逸出（值含逗號/雙引號/換行時用雙引號包起來，內部雙引號雙倍轉義）
- [ ] `calculateColumnWidth(key, data)`：欄寬＝`min(該欄標題與所有值最大字元長度+2, 50)`（Excel 的 `wch` 單位）
- [ ] `createWorksheet(data)`：`XLSX.utils.json_to_sheet(data)` 建立工作表，並依上述邏輯設定每欄寬度（`worksheet["!cols"]`）
- [ ] `saveWorkbook(workbook, filename)`：`XLSX.write(...,{bookType:"xlsx", type:"array"})` → 包成 Blob（MIME 為上述 `EXCEL_MIME_TYPE`）→ `saveAs(blob, \`${filename}.xlsx\`)` 觸發瀏覽器下載

- [ ] `exportToCSV(data, filename)`：驗證資料非空 → 表頭 = 第一筆資料的所有 key → 每列用 `escapeCsvValue` 逐欄組合、逗號分隔 → 整份文字前面加 `CSV_BOM` → Blob（`text/csv;charset=utf-8`）→ 下載 `${filename}.csv`
- [ ] `exportToExcel(data, filename, sheetName="Sheet1")`：單一工作表匯出（工作表預設名稱 "Sheet1"）
  - [ ] **⚠️ 已用 Grep 確認全專案沒有任何呼叫點會實際呼叫這個函式**（`reports-content.tsx` 有 import 但沒有呼叫使用，是未使用的 import；也沒有其他檔案呼叫）——目前是完全沒有 UI 路徑會觸發的函式
- [ ] `exportToExcelMultiSheet(sheets: {name, data}[], filename)`：依序把每個 `sheet.data.length > 0` 的工作表加進同一個 workbook（**資料為空的 sheet 會被整個跳過、不會產生空白工作表**），最後統一存檔
  - [ ] 這個函式**沒有在最外層呼叫 `validateData`**：若傳入的 `sheets` 陣列每一個 `data` 都是空陣列，迴圈會一個工作表都不加，最終對一個 0 個工作表的 workbook 呼叫 `saveWorkbook()`，可能產生錯誤或壞檔——不過目前唯一呼叫端（`reports-content.tsx`）在呼叫前已確保 `reports.length > 0`，所以這個邊界情況目前不會被觸發到，純粹是工具函式本身缺少防呆的記錄

**使用的共用元件**
- 無自身以外的內部依賴（純工具函式模組）；外部套件：`xlsx`、`file-saver`

**呼叫的 server actions**
- 無（純前端資料轉檔工具，本身不呼叫 server action；由呼叫端如 `reports-content.tsx` 先呼叫 export.ts 的 server actions 拿到資料後，再交給本檔案的函式轉檔下載）

---

# 八、使用者／設定／個人資料

## 路由：/dashboard/users／使用者管理頁（表格列表＋逐欄位行內編輯，僅 ADMIN 可存取）

- [ ] 存取權限控制（app/dashboard/users/page.tsx）
  - [ ] 未登入（無 session）→ `redirect("/login")`
  - [ ] 已登入但 `session.user.role !== "ADMIN"` → `redirect("/dashboard")`（靜默重導向，無任何錯誤提示文字）
  - [ ] 所有對應 server actions（app/actions/users.ts）內部也各自獨立呼叫 `requireAdmin()` 做第二層防護；非 ADMIN 呼叫任何一個 action 會 throw `"Unauthorized: Admin access required"`（英文字串，未提供中文翻譯）
  - [ ] 頁面資料由 server component 直接以 `prisma.user.findMany` 查詢（依 `createdAt desc` 排序，附帶 `_count.expenseReports`），非 client 端 fetch，故本頁沒有獨立的 loading skeleton／spinner
- [ ] 頁首
  - [ ] 標題：「用戶管理」/"User Management"（左側帶 `Users` 圖示）
  - [ ] 副標題：「管理所有用戶帳號和權限」/"Manage all user accounts and permissions"
- [ ] 全域訊息列（⚠️ 未使用共用 `hooks/useMessage.ts`，是元件內自建的獨立 state + `showMessage()` 函式，行為上模仿但非同一份程式碼）
  - [ ] 顯示條件：`message !== null`
  - [ ] 成功樣式：`bg-green-50 text-green-700 border border-green-200`
  - [ ] 失敗樣式：`bg-red-50 text-red-700 border border-red-200`
  - [ ] 3 秒後以 `setTimeout` 自動消失（3000ms，與 `useMessage` 行為一致但是另一份重複實作）
  - [ ] 顯示位置：頁首下方、統計卡片上方，橫跨整個內容寬度的單一色塊
  - [ ] 訊息文字直接為 `error.message`（catch 到的例外訊息），代表任何 server action 拋出的英文 Error 訊息會原封不動顯示在畫面上
- [ ] 統計卡片區（⚠️ 共 5 張卡片，但外層容器 class 是 `grid md:grid-cols-4`，5 卡片塞進 4 欄格線會擠出不對稱的換行版面，非刻意設計）
  - [ ] 「總用戶」/"Total Users"：`localUsers.length`
  - [ ] 「管理員」/"Admins"：role === ADMIN 的人數
  - [ ] 「組長」/"Leaders"：role === LEADER 的人數
  - [ ] 「副組長」/"Vice Leaders"：role === VICE_LEADER 的人數
  - [ ] 「已驗證」/"Verified"：`emailVerified` 非 null 的人數
  - [ ] ⚠️ 沒有 FINANCE、USER 這兩種角色的人數統計卡片（5 種角色只統計了 3 種＋已驗證數＋總數）
- [ ] 使用者列表表格欄位標題（逐字）
  - [ ] 「用戶」/"User"（頭像圓圈首字母＋姓名＋Email）
  - [ ] 「角色」/"Role"
  - [ ] 「組別」/"Dept"（⚠️ 英文版是縮寫 "Dept"，中文版是全稱「組別」，中英文詳略不一致）
  - [ ] 「狀態」/"Status"（Email 驗證狀態，非帳號啟用狀態）
  - [ ] 「報表數」/"Reports"（`_count.expenseReports`）
  - [ ] 「建立日期」/"Created"
  - [ ] 「操作」/"Actions"
  - [ ] ⚠️ 整頁沒有「新增使用者」/「邀請使用者」按鈕或任何建立帳號的入口——ADMIN 在此頁只能編輯／刪除既有帳號，無邀請連結、無邀請碼機制。新帳號是透過站上獨立的 `/register` 自助註冊頁產生（該頁不在本次盤點檔案清單內，僅此註記其存在）
  - [ ] 空列表狀態：若 `localUsers` 長度為 0，僅會渲染空的 `<tbody>`（沒有「目前尚無使用者」之類的 empty state 文字或圖示）
- [ ] 「用戶」欄（每列）
  - [ ] 頭像：圓形色塊，永遠顯示姓名或 Email 的首字大寫（純文字，不會顯示使用者實際上傳的大頭貼圖片）
  - [ ] 姓名：`user.name`，若為 null 顯示「未設定」/"Not set"
  - [ ] Email 顯示與行內編輯（編輯入口：點擊該列「操作」欄的 Mail 圖示）
    - [ ] 編輯狀態：`<input type="email">`，placeholder 帶入原本的 email
    - [ ] 確認鈕（綠色 `Check` 圖示）→ 呼叫 `updateUserEmail(userId, inputValue)`
    - [ ] 取消鈕（紅色 `X` 圖示）→ 還原顯示模式，不送出
    - [ ] 前端驗證：僅檢查 `inputValue` 是否包含 `"@"`字元，不通過時顯示「請輸入有效的 Email」/"Please enter a valid email"（⚠️ 比 zod 的 `email()` 完整格式驗證寬鬆很多，例如 `"a@"` 會通過前端檢查）
    - [ ] 成功訊息：「Email 已更新」/"Email updated"
    - [ ] 伺服器端重複 email 檢查：若已被其他帳號使用，throw `"Email already in use"`（英文，未翻譯，中文介面下也會顯示英文）
- [ ] 「角色」欄（每列）
  - [ ] 顯示模式：色塊標籤文字（非 `<select>` 下拉選單）
    - [ ] 配色：ADMIN 紫（`bg-purple-100 text-purple-700`）／LEADER 藍（`bg-blue-100`）／VICE_LEADER 青（`bg-cyan-100`）／FINANCE 綠（`bg-green-100`）／USER 灰（預設 `bg-gray-100`）
    - [ ] 中文標籤：USER＝「僅檢視」、VICE_LEADER＝「副組長」、LEADER＝「組長」、FINANCE＝「財務」、ADMIN＝「管理員」
    - [ ] 英文標籤：View Only / Vice Leader / Leader / Finance / Admin
  - [ ] 編輯入口：點擊該列「操作」欄的 `Shield` 圖示
  - [ ] 編輯狀態：一整排 5 顆角色按鈕（USER／VICE_LEADER／LEADER／FINANCE／ADMIN，各自帶其對應配色）＋ 1 顆取消（紅色 `X`）按鈕；**非下拉選單**
  - [ ] 點選任一角色按鈕即直接送出變更（無二次確認步驟），呼叫 `updateUserRole(userId, role)`
  - [ ] 成功訊息：「角色已更新」/"Role updated"
  - [ ] ⚠️ UI 沒有阻止 ADMIN 對「自己」那一列點擊編輯角色（不像刪除按鈕有 `user.id !== currentUserId` 的顯示條件）；真的送出後由伺服器擋下並 throw `"Cannot change your own role"`（英文，未翻譯），此訊息會直接顯示在頁面訊息列
- [ ] 「組別」欄（每列）
  - [ ] 顯示模式：純文字按鈕（`Building2` 圖示＋icon+標籤文字），**點擊該按鈕本身即可直接進入編輯**（與角色不同，組別的編輯入口就在本欄，不在「操作」欄）
  - [ ] 無組別時顯示：「未指定」/"Not Set"
  - [ ] 編輯狀態：8 顆按鈕＝「無」/"None"（清空組別）＋ 7 個組別按鈕（**非下拉選單**）：
    - [ ] ⚡ 電資組／Electrical（ELECTRICAL）
    - [ ] ⚙️ 機構組／Mechanical（MECHANICAL）
    - [ ] 📝 文書組／Documentation（DOCUMENTATION）
    - [ ] 📣 公關組／PR（PR）
    - [ ] 💰 財管組／Finance（FINANCE）
    - [ ] 🎨 意象組／Design（DESIGN）
    - [ ] 👨‍🏫 老師／Mentor（MENTOR）
    - [ ] ＋ 1 顆取消（紅色 `X`）按鈕
  - [ ] 點選即直接送出（無二次確認），呼叫 `updateUserDepartment(userId, department)`
  - [ ] 成功訊息：「組別已更新」/"Department updated"
  - [ ] ⚠️ 用詞不一致：清空組別的按鈕文字是「無」，但顯示狀態（未設定組別時）的文字卻是「未指定」——同一狀態兩種用詞
- [ ] 「狀態」欄（每列，Email 驗證狀態，純顯示非編輯入口）
  - [ ] 已驗證：綠色文字＋`UserCheck` 圖示，「已驗證」/"Verified"
  - [ ] 未驗證：灰色文字，「未驗證」/"Unverified"
- [ ] 「報表數」欄（每列）：純數字 `_count.expenseReports`，唯讀無互動
- [ ] 「建立日期」欄（每列）：`toLocaleDateString`，依語言顯示 `zh-TW` 或 `en-US` 格式，唯讀
- [ ] 「操作」欄（每列）
  - [ ] 密碼編輯狀態（點擊 `Key` 圖示後，整個「操作」欄切換成輸入框，其他 4 顆圖示按鈕暫時被取代）
    - [ ] `<input type="password">`，placeholder「新密碼」/"New password"
    - [ ] 確認鈕（綠色 `Check`）→ 呼叫 `updateUserPassword(userId, inputValue)`
    - [ ] 取消鈕（紅色 `X`）
    - [ ] 前端驗證：僅檢查長度 `>= 6`，不足時顯示「密碼至少 6 個字元」/"Password must be at least 6 characters"
    - [ ] ⚠️ 前後端驗證規則不一致：伺服器 `updateUserPassword` 實際呼叫 `validatePassword()`（lib/schemas.ts `passwordSchema`），規則是「至少 8 個字元」＋「至少一個英文字母」＋「至少一個數字」三項全部符合；輸入 6～7 碼、或 8 碼以上但全數字/全英文的密碼會通過前端檢查，卻被伺服器以下列三則訊息之一拒絕：「密碼至少需要 8 個字元」／「密碼必須包含至少一個英文字母」／「密碼必須包含至少一個數字」
    - [ ] 成功訊息：「密碼已更新」/"Password updated"
    - [ ] 重設密碼機制：ADMIN 必須**手動輸入**新密碼字串並送出；**沒有**「產生隨機臨時密碼」按鈕或機制，也不會寄送通知信給當事人告知密碼已被更改
  - [ ] 一般模式下 3～5 顆圖示按鈕（依條件顯示，皆有 `title` tooltip）：
    - [ ] `Mail` 圖示，title「編輯 Email」/"Edit Email"
    - [ ] `Key` 圖示，title「更改密碼」/"Change Password"
    - [ ] `Shield` 圖示，title「更改角色」/"Change Role"
    - [ ] `UserCheck` 圖示（僅當 `!user.emailVerified` 時顯示），title「驗證 Email」/"Verify Email"，點擊即直接呼叫 `verifyUserEmail(userId)`（**無**二次確認對話框），成功訊息「Email 已驗證」/"Email verified"
    - [ ] `Trash2` 圖示（僅當 `user.id !== currentUserId` 時顯示，即無法對自己顯示刪除鈕），title「刪除用戶」/"Delete User"
  - [ ] 刪除確認對話框：瀏覽器原生 `window.confirm()`（**非**自訂 Modal），文字逐字為：
    - [ ] 中文：「確定要刪除此用戶嗎？此操作無法復原。」
    - [ ] 英文："Are you sure you want to delete this user? This action cannot be undone."
  - [ ] ⚠️ 確認對話框文字沒有揭露刪除的實際範圍：伺服器端 `deleteUser` 用一個 Prisma transaction 依序級聯刪除該使用者的 `expenseItem`（透過其 report）、`approvalAction`（身為 actor 的、以及其 report 上的）、`expenseReport`、`auditLog`（身為 actor 的）、`account`、`session`，最後才刪除 `user` 本身——是硬刪除且會連帶清空該使用者全部報帳歷史，並非單純停用帳號
  - [ ] 成功訊息：「用戶已刪除」/"User deleted"
  - [ ] 失敗訊息（transaction 例外時）："Failed to delete user. User may have associated data."（英文，未翻譯）
  - [ ] ⚠️ **沒有**「停用／凍結帳號」功能——只有硬刪除一種操作，沒有 `isActive`/disabled 之類的軟刪除或帳號凍結開關
  - [ ] 伺服器端也防止刪除自己：`userId === adminId` 時 throw `"Cannot delete yourself"`（英文，未翻譯；但因 UI 已隱藏自己列的刪除鈕，正常操作流程下不會觸發）
- [ ] Import 但未使用：`Edit2`（lucide-react 圖示）被 import 進檔案，但整份程式碼找不到任何地方實際渲染此圖示

使用的共用元件：
- 無使用 `components/ui/` 下的共用元件，表格／按鈕／輸入框皆為手刻 Tailwind class
- `useLanguage()`（`lib/language-context`，僅取用 `language` 值，搭配元件內自訂的 `t(zh, en)` 函式，非全站翻譯字典的 `t()`）
- lucide-react 圖示：`Check`, `Edit2`（未使用）, `Key`, `Mail`, `Shield`, `Trash2`, `UserCheck`, `Users`, `X`, `Building2`

呼叫的 server actions（app/actions/users.ts）：
- `updateUserRole(userId, role)`
- `updateUserDepartment(userId, department)`
- `updateUserEmail(userId, email)`
- `updateUserPassword(userId, password)`
- `verifyUserEmail(userId)`
- `deleteUser(userId)`


## 路由：/dashboard/settings／系統設定頁（頭像、語言、通知頻率、密碼、登出、收款帳戶入口）

- [ ] 存取權限控制（app/dashboard/settings/page.tsx）
  - [ ] 未登入 → `redirect("/login")`
  - [ ] **無角色限制**——USER 起任何已登入角色皆可進入本頁（與使用者管理頁的僅 ADMIN 限制不同）
  - [ ] page.tsx 並行（`Promise.all`）預先呼叫 `getBankAccounts()` 與 `canUserManageBankAccounts()`，結果以 props 傳入 `SettingsContent`
- [ ] 頁首
  - [ ] 標題：`t("settings")` = 「設定」/"Settings"（走全站翻譯字典）
  - [ ] 副標題（⚠️ 非走 `t()` 字典，是元件內另外寫死的三元判斷 `language === "zh" ? ... : ...`）：「管理你的應用程式設定」/"Manage your application settings"
- [ ] 個人頭像卡片（標題「個人頭像」/"Profile Avatar"，`User` 圖示）
  - [ ] 頭像預覽（80×80 圓形）
    - [ ] 有值時：`next/image` 渲染實際圖片（`session.user.image`／上傳後的 Base64 data URL）
    - [ ] 無值時：顯示姓名或 Email 首字大寫的 primary 色塊佔位
    - [ ] 上傳中：黑色半透明遮罩＋白色 `Loader2` 轉圈動畫疊加於頭像上（`absolute inset-0 bg-black/50`）
  - [ ] 上傳按鈕：「上傳頭像」/"Upload"（`Camera` 圖示），點擊觸發隱藏的 `<input type="file" accept="image/*">`
  - [ ] 移除按鈕：「移除」/"Remove"（`X` 圖示），**僅當 `avatar` 存在時**才渲染
  - [ ] 檔案型別驗證（前端）：選取非圖片檔案 → 錯誤「請選擇圖片檔案」/"Please select an image file"
  - [ ] 讀檔方式：`FileReader.readAsDataURL()`；讀取失敗（`reader.onerror`）→ 錯誤「上傳失敗」/"Upload failed"
  - [ ] ⚠️ 前端**沒有**檔案大小的預先檢查（選檔當下不會擋大檔案），是整張讀成 Base64 後送到 server action，才由後端擋 500KB 上限
  - [ ] 上傳成功：前端固定顯示「頭像已更新」/"Avatar updated"（未直接採用 server 回傳的 `message`，雖然文字剛好相同）
  - [ ] 上傳失敗（server 回傳 `success:false`）：顯示 `result.message`，可能為：
    - [ ] 「無效的圖片格式」（Base64 字串不是以 `data:image/` 開頭）
    - [ ] 「圖片大小不能超過 500KB」（`MAX_IMAGE_SIZE_BYTES = 500 * 1024`）
    - [ ] 「上傳頭像時發生錯誤」（例外 catch-all）
  - [ ] 移除成功：前端固定顯示「頭像已移除」/"Avatar removed"
  - [ ] 移除失敗：顯示 `result.message`（伺服器實際文字「移除頭像時發生錯誤」）或最終 fallback 字串 `"Error"`（英文，未翻譯）
  - [ ] 訊息文字顏色：成功 `text-green-500`；失敗 `text-destructive`
  - [ ] ⚠️ `avatarMessage` **沒有**自動消失機制（元件內找不到對應的 `setTimeout`），會一直停留在畫面上直到下一次頭像操作覆寫它——與 users-content.tsx／`hooks/useMessage.ts` 的「3 秒後自動消失」慣例不同
  - [ ] 說明文字（常駐顯示，非訊息提示）：「建議使用正方形圖片，檔案大小不超過 500KB」/"Square image recommended, max size 500KB"
  - [ ] **沒有**裁切（crop）功能——選檔後整張直接讀取上傳，沒有裁切／縮放／預覽視窗等 UI
- [ ] 語言設定卡片（標題「語言設定」/"Language Settings"，`Globe` 圖示）
  - [ ] 子標題「介面語言」/"Interface Language"，說明文字「選擇你偏好的語言」/"Choose your preferred language"
  - [ ] 兩顆切換按鈕：「中文」／「English」，當前語言呈 primary 底色高亮，其餘為 `bg-muted`
  - [ ] 點擊立即切換（`setLanguage()`），無需送出、無 loading 狀態、無成功訊息提示
- [ ] 通知設定卡片（標題「通知設定」/"Notification Settings"，`Bell` 圖示）
  - [ ] 說明文字：「選擇接收通知的頻率」/"Choose how often you receive notifications"
  - [ ] 3 顆選項按鈕（**非**下拉選單、**非** radio input，是一排 `<button>`）：
    - [ ] 「即時通知」/"Instant"（值 `INSTANT`）
    - [ ] 「每日摘要」/"Daily Digest"（值 `DAILY_DIGEST`）
    - [ ] 「關閉」/"Off"（值 `OFF`）
  - [ ] 選中的按鈕：primary 底色高亮＋前綴 `Check` 圖示；未選中為 `bg-muted`
  - [ ] 初始值：`useState` 先給 `"INSTANT"` 當預設，掛載後才用 `useEffect` 呼叫 `getNotificationFrequency()` 非同步覆寫成資料庫實際值——⚠️ 頁面剛載入的瞬間可能會先閃現「即時通知」被選取，即便使用者實際設定是別的選項，這段期間沒有任何 loading 提示遮蔽落差
  - [ ] 點擊即直接送出（無額外確認/儲存按鈕），送出期間 3 顆按鈕皆 `disabled`（僅 `opacity-50`，**無** spinner 圖示）
  - [ ] 成功：前端固定顯示「設定已更新」/"Settings updated"（⚠️ 並非伺服器實際回傳的「通知設定已更新」文字，兩者用詞不同，非只是巧合相同的情況）
  - [ ] 失敗：顯示 `result.message`（伺服器實際文字「更新通知設定時發生錯誤」）或 fallback `"Error"`
  - [ ] ⚠️ `notificationMessage` 同樣**沒有**自動消失機制，持續停留直到下次操作覆寫
- [ ] 收款帳戶設定區塊
  - [ ] 僅當 `canManageBankAccounts === true` 才渲染整個區塊（程式註解：「只對 VICE_LEADER 以上角色顯示」）
  - [ ] 渲染 `<BankAccountSettings initialAccounts={bankAccounts} />`（獨立元件，依指示不重複盤點其內部細節，僅記錄掛載點與顯示條件）
- [ ] 更改密碼卡片（標題「更改密碼」/"Change Password"，`Lock` 圖示）
  - [ ] 表單走 React `useFormState` + `useFormStatus`（`<form action={passwordAction}>`），非手動 `fetch`／`onClick`
  - [ ] 欄位 1：「目前密碼」/"Current Password"（`id="currentPassword"`，`type=password`，`required`，無 `minLength`）
  - [ ] 欄位 2：「新密碼」/"New Password"（`id="newPassword"`，`type=password`，`required`，HTML `minLength={6}`）
    - [ ] ⚠️ 前端 HTML `minLength=6` 與後端 zod `passwordSchema`（至少 8 字元＋至少一個英文字母＋至少一個數字）規則不一致——瀏覽器層級擋下的門檻比伺服器實際規則寬鬆，使用者可能填完 6 碼被瀏覽器放行，送出後才被伺服器拒絕
  - [ ] 欄位 3：「確認新密碼」/"Confirm New Password"（`id="confirmPassword"`，`type=password`，`required`，無 `minLength`）
  - [ ] 每個欄位下方可各自顯示逐欄位錯誤文字（來自 zod `flatten().fieldErrors`），紅字 `text-destructive`
  - [ ] 表單整體訊息（欄位下方、送出鈕上方，綠字成功／紅字失敗），逐字列出所有可能文案（app/actions/password.ts）：
    - [ ] 「未授權的操作」（session 遺失，理論邊界情況）
    - [ ] 「驗證失敗」（zod 總體驗證不通過的總覽訊息，細項見各欄位下方）
    - [ ] 「請輸入目前密碼」（`currentPassword` 為空）
    - [ ] 「請確認新密碼」（`confirmPassword` 為空）
    - [ ] 「新密碼與確認密碼不一致」（掛在 `confirmPassword` 欄位下）
    - [ ] 「無法驗證用戶」（該帳號沒有密碼欄位，例如純 OAuth 帳號）
    - [ ] 「目前密碼不正確」（`bcrypt.compare` 失敗）
    - [ ] 「密碼已成功更新」（成功）
    - [ ] 「更新密碼時發生錯誤」（例外 catch-all）
  - [ ] 送出按鈕：「更新密碼」/"Update Password"，`pending` 時顯示 `Loader2` 轉圈圖示＋文字並整顆 disabled
  - [ ] **沒有**「顯示密碼」眼睛圖示切換功能（三個欄位皆固定 `type="password"`）
  - [ ] 表單訊息同樣**沒有**自動消失機制（綁定於 `useFormState` 回傳值，持續顯示到下次送出）
- [ ] 帳戶操作卡片（標題「帳戶操作」/"Account Actions"）
  - [ ] 顯示「登出」/"Sign Out" 字樣＋當前使用者 email 作為說明子文字
  - [ ] 登出按鈕（紅色 destructive 樣式，`LogOut` 圖示）：「登出」/"Sign Out"
  - [ ] 呼叫 `next-auth/react` 的 `signOut({ callbackUrl: "/login" })`
  - [ ] 若 `signOut` 拋出例外：`console.error("Logout error:", error)` 後強制 `window.location.href = "/login"` 作為 fallback
  - [ ] **沒有**登出前確認對話框（點擊即直接登出，無「確定要登出嗎？」提示）
- [ ] ⚠️ 本頁**沒有**顯示使用者自己的角色／組別文字（無 role/department 欄位呈現在此頁的任何卡片中）
- [ ] 沒有獨立 loading/error/empty 畫面——整頁資料由 server component 一次取得；各互動區塊各自用局部 state（`avatarLoading`／`notificationLoading`／`pending`）處理自己的載入狀態，彼此不共用

使用的共用元件：
- `BankAccountSettings`（components/bank-account-settings.tsx，僅記錄掛載點與顯示條件，不在本次盤點範圍內）
- `useLanguage()` / `t()` / `getText()`（`lib/language-context`）
- `BUTTON_PRIMARY`, `BUTTON_MUTED`, `INPUT_CLASS`（`lib/ui-constants.ts`）
- lucide-react 圖示：`LogOut`, `Globe`, `Bell`, `Lock`, `User`, `Camera`, `X`, `Check`, `Loader2`
- `next/image`

呼叫的 server actions：
- `changePassword(prevState, formData)`（app/actions/password.ts，經 `useFormState` 綁定為 `passwordAction`）
- `uploadAvatar(imageBase64)` / `removeAvatar()`（app/actions/avatar.ts）
- `updateNotificationFrequency(frequency)` / `getNotificationFrequency()`（app/actions/notifications.ts）
- `getBankAccounts()` / `canUserManageBankAccounts()`（app/actions/bank-accounts.ts，於 page.tsx 呼叫，該檔案內部細節不在本次盤點範圍）
- `signOut()`（`next-auth/react`，客戶端函式非本專案 server action，但功能上等價於登出流程）


## 路由：/dashboard/profile／個人資料頁（純唯讀個人資訊＋報帳統計，無任何編輯功能）

- [ ] 存取權限控制（app/dashboard/profile/page.tsx）
  - [ ] 未登入 → `redirect("/login")`
  - [ ] **無角色限制**，任何已登入角色皆可存取（僅能查看自己的資料，`userId` 取自 `session.user.id`，非 URL 參數，無法查看他人）
  - [ ] page.tsx 並行查詢（`Promise.all`）：`prisma.user.findUnique`（含 `_count.expenseReports`）＋ `prisma.expenseReport.aggregate`（`_sum.totalAmount` 與 `_count`，條件 `submitterId: userId`）
  - [ ] 邊界情況：若 `user` 查詢結果為 `null`（例如 session 仍存在但資料庫使用者已被刪除），頁面仍會渲染，各欄位透過 optional chaining（`user?.xxx`）落回預設值或空白，**沒有**明顯的「找不到使用者」錯誤畫面
- [ ] ⚠️⚠️ **重大落差提醒**：本頁（profile-content.tsx）**沒有**頭像上傳、**沒有**姓名/Email 編輯欄位、**沒有**修改密碼表單、**沒有**通知頻率設定——這些功能實際上全部位於 `/dashboard/settings` 頁（settings-content.tsx）。整個 profile 頁面是純展示，沒有任何 `<input>`、`<form>`，也不呼叫任何 server action。改版時務必確認這個功能配置（頭像/密碼/通知在「設定」而非「個人資料」）是否要延續或調整
- [ ] 頁首
  - [ ] 標題：`t("profile")` = 「個人資料」/"Profile"
  - [ ] 副標題：`t("account_info")` = 「查看你的帳戶資訊」/"View your account information"
- [ ] 個人資料卡片
  - [ ] 頭像：僅顯示姓名或 Email 首字大寫的色塊圓圈（`bg-primary/10`）——⚠️ 即使使用者已在設定頁上傳真實大頭貼（`user.image` 為 Base64 字串），此處**不會**渲染實際圖片，永遠顯示文字首字母，與設定頁的頭像顯示邏輯不一致
  - [ ] 姓名：`user?.name`，若無則顯示 `t("name_not_set")` = 「未設定名稱」/"Name not set"
  - [ ] Email：`user?.email`（純文字顯示，**不可編輯**，本頁無任何輸入框）
  - [ ] 「用戶 ID」/"User ID"：`user?.id`，等寬字體（`font-mono`）顯示完整 ID
  - [ ] 「角色」/"Role"：色塊標籤，⚠️ 顯示**未翻譯的原始 enum 字串**（例如直接顯示英文 "ADMIN"、"USER"，並非使用者管理頁那種「管理員」中文標籤）
    - [ ] 配色邏輯：`role === 'ADMIN'` → 紫；`role === 'MANAGER'` → 藍（⚠️ 死代碼：Role enum 實際只有 USER/VICE_LEADER/LEADER/FINANCE/ADMIN 五種，沒有 "MANAGER"，此分支永遠不會命中）；`role === 'FINANCE'` → 綠；其餘一律灰色（USER、LEADER、VICE_LEADER 都落入這個「其餘」灰色分支，LEADER 和 VICE_LEADER 在此頁沒有專屬配色，與使用者管理頁的 5 色配色邏輯不一致）
  - [ ] 「帳戶建立時間」/"Account Created"：`formatDate(user.createdAt)`（依語言 `zh-TW`/`en-US` 格式化），無日期時顯示「N/A」
  - [ ] ⚠️ **沒有顯示「組別」/department 欄位**——User model 有 department 欄位，但本頁完全沒有呈現使用者自己所屬的組別
- [ ] 報帳統計卡片（標題 `t("expense_stats")` = 「報帳統計」/"Expense Statistics"）
  - [ ] 「報帳單數量」/"Total Reports"：`stats._count`
  - [ ] 「總報帳金額」/"Total Expense Amount"：`$${Number(stats._sum.totalAmount || 0).toFixed(2)}`（⚠️ 直接用 `$` 字首＋兩位小數格式化，未使用 `lib/money.ts` 的 cents 轉換工具函式，也未特別標示新台幣或其他幣別單位）
- [ ] Session 資訊卡片（⚠️ 條件渲染：僅 `process.env.NODE_ENV === "development"` 時顯示，正式環境使用者完全看不到這張卡片）
  - [ ] 標題：`t("session_info")` = 「Session 資訊」/"Session Info"，固定英文後綴「(Dev Only)」（無論中英文介面都顯示這段英文後綴，未走翻譯字典）
  - [ ] 內容：`<pre>` 區塊印出格式化 JSON，僅含兩個欄位：
    - [ ] `id`：若存在則寫死字串 `"[REDACTED]"`，否則 `null`（⚠️ 只是寫死字串取代，不是真正的遮罩/hashing 邏輯）
    - [ ] `role`：`session.user?.role`
- [ ] 沒有獨立 loading/error/empty 畫面——全部資料由 server component 一次取得（無 client 端 fetch），故無 spinner；也沒有任何按鈕、表單或 server action 呼叫，屬於純展示頁面

使用的共用元件：
- `useLanguage()` / `t()`（`lib/language-context`）
- 無使用任何 lucide-react 圖示、無自訂表單元件

呼叫的 server actions：
- 無。本頁所有資料在 page.tsx 以 Prisma 直接查詢後透過 props（`user`, `stats`, `session`）傳入 `ProfileContent`，元件本身不呼叫任何 server action

---

# 九、共用 UI 元件庫（附錄）

> 以下元件被上述各頁面重複使用。盤點角度與前面章節不同：這裡記錄的是「元件本身支援的所有變體/能力」，而非某個頁面怎麼用它。

## 元件：Button／通用按鈕元件（components/ui/Button.tsx，注意檔名是大寫 Button）

- [ ] variant="default"：實心主色按鈕（bg-primary text-primary-foreground hover:bg-primary/90）
- [ ] variant="destructive"：實心危險色按鈕（bg-destructive text-destructive-foreground hover:bg-destructive/90，**整片實心填色**）
- [ ] variant="outline"：外框按鈕（border border-input bg-background hover:bg-accent hover:text-accent-foreground）
- [ ] variant="secondary"：次要按鈕（bg-secondary text-secondary-foreground hover:bg-secondary/80）
- [ ] variant="ghost"：無背景，hover 時才出現 bg-accent hover:text-accent-foreground
- [ ] variant="link"：文字連結樣式（text-primary underline-offset-4 hover:underline，無背景無邊框）
- [ ] size="default"：h-10 px-4 py-2
- [ ] size="sm"：h-9 px-3
- [ ] size="lg"：h-11 px-8
- [ ] size="icon"：h-10 w-10（純方形圖示按鈕）
- [ ] disabled 狀態：原生 disabled 屬性，disabled:pointer-events-none disabled:opacity-50
- [ ] focus-visible 樣式：focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
- [ ] 無內建 icon 位置 prop（沒有 leftIcon/rightIcon），icon 需自行以 children 塞入並自行排版
- [ ] 無內建 loading/isLoading 狀態（跟 loading.tsx 的 LoadingButton 是完全不同的元件，見該區塊）
- [ ] 繼承所有原生 `<button>` HTML 屬性（React.ButtonHTMLAttributes）
- [ ] 使用 React.forwardRef 轉發 ref 到 `<button>`
- [ ] className 可透過 cn() 覆寫/疊加
- [ ] 無 `dark:` 前綴樣式，深色模式完全仰賴語意化 CSS variable token（bg-primary 等）在別處的定義
- [ ] ⚠️ 檔名為 PascalCase（Button.tsx / Card.tsx），與資料夾內其他檔案一律 kebab-case/小寫（button 相關只有這個大寫）不一致；目前所有 import 都精確拼成 `"@/components/ui/Button"`，但 Windows 開發機是大小寫不敏感、Vercel(Linux) 部署是大小寫敏感，重新命名/搬移檔案時要特別小心

**被誰使用：**
- components/expense-form.tsx
- components/funding-dialog.tsx
- components/funding-content.tsx
- components/receipt-audit-button.tsx
- components/batch-audit-button.tsx
- components/balance-card.tsx
- components/ui/data-table.tsx（內部分頁上一頁/下一頁按鈕）
- components/transitions/transition-button.tsx
- app/terms/page.tsx
- app/page.tsx
- app/register/page.tsx
- app/privacy/page.tsx
- app/login/page.tsx
- app/dashboard/columns.tsx

---

## 元件：Card／卡片容器（Card + CardHeader + CardTitle + CardDescription + CardContent）

- [ ] Card：外層容器，rounded-lg border bg-card text-card-foreground shadow-sm
- [ ] CardHeader：flex flex-col space-y-1.5 p-6
- [ ] CardTitle：語意標籤為 `<h3>`，text-2xl font-semibold leading-none tracking-tight
- [ ] CardDescription：`<p>`，text-sm text-muted-foreground
- [ ] CardContent：p-6 pt-0
- [ ] ⚠️ 沒有 CardFooter 子元件（常見 shadcn/ui 全套通常有 footer，這裡沒有；如需頁尾動作列，呼叫端得自行加 div）
- [ ] 所有子元件皆用 forwardRef、可傳 className 覆寫、繼承對應原生 HTMLAttributes
- [ ] 無 variant prop（只有一種外觀，沒有 outlined/elevated/interactive 等變體）
- [ ] 無 `dark:` 前綴樣式，走 bg-card / text-card-foreground 語意 token

**被誰使用：**
- components/expense-form.tsx（目前是唯一使用者，只有一個消費端，重設計時要注意這是低使用率但仍在production路徑上的元件）

---

## 元件：Badge／狀態徽章

- [ ] variant="default"：主色實心（bg-primary text-primary-foreground）
- [ ] variant="secondary"：次要色實心（bg-secondary text-secondary-foreground）
- [ ] variant="destructive"：危險色實心（bg-destructive text-destructive-foreground）— 實際語意用途：dashboard/columns.tsx 中 REJECTED（駁回）狀態
- [ ] variant="outline"：邊框樣式（BADGE_BASE 本身就有 `border` class，outline 沒有覆蓋成 border-transparent，所以邊框可見，背景透明，文字 text-foreground）
- [ ] variant="success"：bg-emerald-500 text-white — 實際語意用途：dashboard/columns.tsx 中 PAID（已付款）狀態；⚠️ 是唯一用「硬編碼 Tailwind 色階」而非語意 token 的 variant
- [ ] 未指定 variant 時預設為 "default"
- [ ] ⚠️ 沒有 warning／info／pending 等語意 variant（目前只有 5 種：default/secondary/destructive/outline/success，若畫面上有黃色警示或藍色資訊徽章，代表是元件外自行刻的樣式，非此元件支援範圍）
- [ ] 造型：圓角膠囊 rounded-full，px-2.5 py-0.5 text-xs font-semibold
- [ ] 帶 focus ring 樣式（focus:ring-2 focus:ring-ring focus:ring-offset-2），暗示可能被當作可互動/可聚焦元素使用
- [ ] 本體渲染為 `<div>`（非 `<button>`/`<span>`）
- [ ] 無 size prop，只有一種尺寸
- [ ] 除 success 用固定 emerald 色外，其餘走語意 token；無 `dark:` 前綴樣式

**被誰使用：**
- components/audit-result-dialog.tsx
- components/batch-audit-button.tsx
- app/dashboard/columns.tsx（狀態對應範例：PAID→success，REJECTED→destructive，其餘→default）

---

## 元件：loading.tsx／載入狀態呈現（Spinner／LoadingOverlay／LoadingButton／Skeleton／SkeletonCard／SkeletonTable）

- [ ] Spinner：size="sm"（h-4 w-4 border-2）／"md"（h-6 w-6 border-2，預設）／"lg"（h-8 w-8 border-3）
- [ ] Spinner 視覺：animate-spin rounded-full border-primary border-t-transparent（旋轉圓框型，非圖示型 spinner，如 lucide 的 Loader2）
- [ ] Spinner 顏色可透過 className 覆寫（例如放在深色按鈕上改用 border-primary-foreground）
- [ ] LoadingOverlay：isLoading + children + text? — 疊加式全遮罩載入層（bg-background/80 backdrop-blur-sm，內含 Spinner size="lg" + 可選說明文字）
- [ ] LoadingButton：獨立按鈕元件，props 為 isLoading、loadingText?、children、disabled、其餘原生 button 屬性
- [ ] LoadingButton 邏輯：isLoading 時自動套用 disabled；loading 中會在文字前加上 Spinner(sm)，且若有提供 loadingText 就取代 children 文字顯示，否則仍顯示原 children（但仍帶 spinner）
- [ ] ⚠️ LoadingButton 有自己一套「硬編碼」按鈕外觀（bg-primary text-primary-foreground rounded-lg px-4 py-2），既不是 Button.tsx 的 variant/size 系統、也不是 lib/ui-constants.ts 的字串常數，等於是系統中**第三套**按鈕視覺樣式
- [ ] Skeleton：單一骨架方塊，animate-pulse rounded-md bg-muted，尺寸靠外部傳入 className 控制
- [ ] SkeletonCard：預組合骨架卡片（3 條不同寬度的骨架列：3/4寬、1/2寬、整條 h-8，外層 rounded-xl border bg-card p-4）
- [ ] SkeletonTable：預組合骨架表格，rows prop 控制資料列數（預設 5），含 1 列表頭骨架（h-10）+ N 列資料骨架（h-12）
- [ ] 沒有 dots／progress bar／百分比進度等其他 loading 呈現形式
- [ ] 無 `dark:` 前綴樣式，走語意 token（bg-background/80、bg-muted、border-primary）

**被誰使用：**
- ⚠️ 經全專案（components/ 與 app/ 目錄）搜尋，目前**沒有任何檔案 import 這個檔案中的任何元件**（Spinner / LoadingOverlay / LoadingButton / Skeleton / SkeletonCard / SkeletonTable 皆為零使用）。只在 PROGRESS.md 文字紀錄中被提及過（曾修過 currency-input.tsx 但未提及 loading.tsx 本身有被接上任何頁面）。重設計盤點時務必確認：這些 loading 呈現方式是「應該要用、目前漏接」還是「可安全捨棄的舊/超前設計」。

---

## 元件：Modal／彈出視窗

- [ ] Props：isOpen（boolean）、onClose、title?（ReactNode）、children、className?、size?
- [ ] size="sm" → max-w-sm
- [ ] size="md"（預設）→ max-w-md
- [ ] size="lg" → max-w-lg
- [ ] size="xl" → max-w-xl
- [ ] size="2xl" → max-w-4xl（⚠️ 命名與實際寬度不對應：Tailwind 原生 max-w-2xl 是 42rem，這裡「2xl」卻被映射成 max-w-4xl／56rem，重設計時要決定是保留現有實際寬度還是改成字面對應的 class）
- [ ] Header 區塊：**只有在有傳入 title 時才渲染**，內含標題文字 + 右上角 X 關閉按鈕（lucide-react 的 X icon），border-b 分隔線
- [ ] 無 title 時：不渲染 header，改在 body 內容區右上角絕對定位一個 X 關閉按鈕，body 上方留 pt-8 空間避開按鈕
- [ ] Body 區塊：p-4 padding，放置 children（無 title 時為 pt-8）
- [ ] ⚠️ 沒有獨立的 Footer 子元件／插槽（無 ModalFooter，若要放確認/取消按鈕列，需自行包在 children 裡）
- [ ] 關閉方式 1：點擊右上角 X 按鈕
- [ ] 關閉方式 2：按 ESC 鍵（document keydown 監聽，僅在 isOpen 時生效）
- [ ] 關閉方式 3：點擊背景遮罩觸發 onClose（背景遮罩與內容框是同層的兩個獨立 div，點內容框不會冒泡觸發背景的 onClick，所以點內容不會誤關閉）
- [ ] 背景遮罩樣式：bg-black/50 backdrop-blur-sm，⚠️ 是寫死的黑色（非語意 token），深色/淺色模式下遮罩顏色相同不會變
- [ ] 進場/退場動畫：opacity + scale(95%→100%) + translate-y(4→0)，transition duration-200；進場用雙層 requestAnimationFrame 觸發，退場時用 setTimeout 200ms 延遲真正 unmount（等動畫播完）
- [ ] 開啟時鎖定背景捲動（document.body.style.overflow = "hidden"），關閉/卸載時還原
- [ ] ⚠️ **未使用 createPortal**（直接在原本 DOM 樹位置渲染 `fixed inset-0 z-50` 的 div），這點與專案 CLAUDE.md 中記載的建議做法（「Modal 對話框渲染應使用 createPortal 渲染到 document.body，以避免 z-index/stacking context 問題」，並舉 receipt-preview.tsx 為正確範例）不一致。重設計時建議確認是否要幫 Modal 補上 createPortal
- [ ] z-index：z-50
- [ ] 無 `dark:` 前綴樣式；內容框走 bg-card 語意 token，但背景遮罩顏色固定不隨主題變化

**被誰使用：**
- components/audit-result-dialog.tsx
- components/batch-inventory-modal.tsx
- components/batch-audit-button.tsx

---

## 元件：table.tsx／表格基礎元件（Table／TableHeader／TableBody／TableRow／TableHead／TableCell）

- [ ] Table：外層多包一層 `div.relative.w-full.overflow-auto`（讓表格可橫向捲動），內層 `<table>` w-full caption-bottom text-sm
- [ ] TableHeader：`<thead>`，子層 tr 自動有底線（[&_tr]:border-b）
- [ ] TableBody：`<tbody>`，最後一列不畫底線（[&_tr:last-child]:border-0）
- [ ] TableRow：`<tr>`，hover:bg-muted/50 transition-colors；支援 `data-state="selected"` 時套用 bg-muted（選取態樣式已定義，但實際選取邏輯要由外部驅動，見 data-table.tsx 區塊）
- [ ] TableHead：`<th>`，h-12 px-4 text-left align-middle font-medium text-muted-foreground；內含 checkbox 元素時自動去除右側 padding（[&:has([role=checkbox])]:pr-0）
- [ ] TableCell：`<td>`，p-4 align-middle，同樣有 checkbox 自動去 padding 的樣式
- [ ] 純樣式化的原生表格標籤 wrapper，**本身不含排序/篩選/分頁邏輯**（那些邏輯在 data-table.tsx）
- [ ] ⚠️ 沒有匯出 TableCaption、TableFooter（比常見的 shadcn/ui 完整版少這兩個子元件）
- [ ] 皆用 forwardRef、可傳 className 覆寫、繼承對應原生 HTML 屬性
- [ ] 無 `dark:` 前綴樣式，走語意 token（text-muted-foreground、bg-muted 等）

**被誰使用：**
- components/ui/data-table.tsx（內部使用）
- 目前專案中沒有頁面繞過 data-table.tsx、直接單獨使用這組原生 Table 系列元件

---

## 元件：DataTable／進階表格（components/ui/data-table.tsx，基於 @tanstack/react-table）

- [ ] Props 只有 `columns`（ColumnDef[]）與 `data`，是泛型元件 `<TData, TValue>`，沒有其他可調參數
- [ ] 分頁（pagination）：**有實作**，使用 getPaginationRowModel，initialState.pagination.pageSize 固定為 10（不可由外部 prop 調整）
- [ ] 分頁 UI：只有「上一頁／下一頁」兩顆按鈕（ChevronLeft/ChevronRight icon，來自 lucide-react），底層用 components/ui/Button variant="outline" size="sm"
- [ ] ⚠️ 分頁 UI 沒有頁碼顯示、沒有「第 X／共 Y 頁」文字、沒有跳頁輸入框、沒有每頁筆數選擇器
- [ ] ⚠️ 排序（sorting）：**未實作**。沒有 getSortedRowModel、沒有 onSortingChange state、欄位標題沒有可點擊排序的 UI 或方向箭頭圖示
- [ ] ⚠️ 篩選（filtering）：**未實作**。沒有 getFilteredRowModel、沒有欄位篩選 UI、沒有搜尋框/全域搜尋欄位
- [ ] ⚠️ 列選取（row selection）：**UI 未實作**。雖然呼叫了 `row.getIsSelected()` 並設定 `data-state="selected"`，table.tsx 的 TableRow 也定義了對應的選取態樣式，但沒有 checkbox 欄位、沒有設定 enableRowSelection、也沒有點擊列觸發選取的邏輯——等於樣式掛著但目前沒有任何方式能真正觸發選取
- [ ] ⚠️ 匯出（export，CSV/Excel）：**未實作**，沒有匯出按鈕或邏輯
- [ ] ⚠️ 空狀態文字：**寫死英文「No results.」**（colSpan={columns.length} h-24 text-center），未做繁中在地化，跟系統其餘介面語言（繁體中文）不一致，是很容易被忽略的細節
- [ ] ⚠️ Loading 狀態：**未實作**，沒有 isLoading prop，也沒有接 loading.tsx 現成的 SkeletonTable
- [ ] 欄位標頭渲染：用 flexRender(header.column.columnDef.header, ...)，標頭內容完全由外部傳入的 columns 定義決定
- [ ] 外層容器樣式：rounded-md border bg-card 包住整個表格
- [ ] 資料列 hover 效果：hover:bg-muted/50 transition-colors（在 DataTable 內額外疊加在 TableRow 上，非 table.tsx 原生自帶）
- [ ] 實際生產環境中唯一消費端 app/dashboard/dashboard-table.tsx 是**純轉傳包裝**（`<BaseDataTable columns={getColumns(userRole)} data={data} />`，沒有額外加值任何排序/篩選功能），因此以上能力清單即為目前 production 的真實完整行為，並非因為外部 wrapper 加了功能而被低估

**被誰使用：**
- app/dashboard/dashboard-table.tsx（import 時別名為 `BaseDataTable`）

---

## 元件：form-field.tsx／表單欄位包裝與控制項（FormField／Input／Textarea／Select）

- [ ] FormField：props 為 label（必填字串）、error?（**字串**訊息）、required?（顯示紅色 * 星號）、description?（輔助說明文字）、children、className
- [ ] FormField 錯誤訊息呈現：紅字 + 內建 SVG 警示圖示 + 進場動畫（animate-in slide-in-from-top-1 duration-200）
- [ ] FormField 本身是一般 function component（**非** forwardRef）
- [ ] Input（此檔案自帶版本，⚠️ **非** components/ui/input.tsx！）：extends InputHTMLAttributes + `error?: boolean`（注意型別是 boolean，跟 FormField 的 error 是 string 不同，兩者需分開傳值）
- [ ] Input error=true 時套用 CONTROL_ERROR（border-red-500 focus:ring-red-200 focus:border-red-500）
- [ ] Input 基礎樣式：w-full px-3 py-2 border **rounded-lg** bg-background，focus:ring-2 focus:ring-primary/20 focus:border-primary
- [ ] Textarea：套用同一組 getControlClasses + min-h-[80px] placeholder:text-muted-foreground resize-y，同樣支援 error prop
- [ ] Select：extends SelectHTMLAttributes + `error?: boolean` + `options: {value,label}[]`（必填）+ `placeholder?: string`
- [ ] Select 的 placeholder 實作方式：渲染一個 disabled 的 `<option value="">`，而非使用原生 placeholder 屬性
- [ ] disabled 樣式共用：disabled:opacity-50 disabled:cursor-not-allowed
- [ ] FormField 與 Input/Textarea/Select 彼此**獨立可用**（不強制耦合），Input 的 error 外框樣式與 FormField 的 error 文字訊息需要呼叫端自行同步傳值
- [ ] ⚠️ 這是與 components/ui/input.tsx **同名但外觀不同**的第二套 Input 元件實作（import 路徑不同：`@/components/ui/form-field` vs `@/components/ui/input`；圓角、focus ring 顏色、是否支援 error 皆不同，容易在重設計時被誤認成同一個東西）
- [ ] 無 `dark:` 前綴樣式，走語意 token（bg-background、text-foreground）

**被誰使用：**
- ⚠️ 經全專案搜尋，目前**沒有任何檔案 import 這個檔案**（FormField/Input/Textarea/Select 皆零使用）。
- 特別注意：`app/register/page.tsx` 內部也有一個名為 `FormField` 的本地元件（第 148 行 `function FormField({ id, label, icon, type, placeholder, required, minLength, autoComplete, isFocused, onFocus, onBlur, error })`），但那是**頁面自己刻的私有元件**，props 結構完全不同（多了 icon/isFocused/onFocus/onBlur，且沒有 import 這個共用檔案），兩者同名異實，重設計盤點時極容易被誤判成「FormField 元件庫已經在用」。

---

## 元件：input.tsx／基礎輸入框（components/ui/input.tsx，小寫檔名，單一 Input 元件）

- [ ] 單一 Input 元件，extends InputHTMLAttributes<HTMLInputElement>，**無自訂 props**（沒有 error prop，跟 form-field.tsx 的 Input 不同）
- [ ] 樣式：h-10 w-full **rounded-md** border border-input bg-background px-3 py-2 text-sm ring-offset-background
- [ ] 支援 file input 樣式（file:border-0 file:bg-transparent file:text-sm file:font-medium）
- [ ] focus 樣式：focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2（用 focus-visible，非 focus/focus-within）
- [ ] disabled 樣式：disabled:cursor-not-allowed disabled:opacity-50
- [ ] ⚠️ 無內建錯誤/驗證狀態樣式（沒有 error prop 或紅框變化能力）
- [ ] 用 forwardRef 轉發 ref；type prop 可自由指定（text/password/email/file...）
- [ ] ⚠️ 與 form-field.tsx 的 Input、以及 lib/ui-constants.ts 的 INPUT_CLASS，是**三套並存**的輸入框外觀系統（圓角、focus ring 顏色/透明度、高度皆不同，詳見 ui-constants.ts 區塊的比較說明）
- [ ] 無 `dark:` 前綴樣式，走語意 token

**被誰使用：**
- components/funding-dialog.tsx
- components/funding-content.tsx
- components/balance-card.tsx
- app/register/page.tsx
- app/login/page.tsx

---

## 元件：label.tsx／表單標籤（基於 @radix-ui/react-label）

- [ ] 包裝 `@radix-ui/react-label` 的 LabelPrimitive.Root，非純手刻 `<label>`
- [ ] 樣式：text-sm font-medium leading-none
- [ ] peer-disabled 支援：peer-disabled:cursor-not-allowed peer-disabled:opacity-70（需搭配旁邊的表單控制項自行加上 `peer` class 才會生效，屬 Radix/shadcn 慣用寫法，重設計時要確認實際使用處是否真的都有配對加上 `peer`）
- [ ] 無 size/variant prop，只有一種樣式
- [ ] ⚠️ 無內建必填星號（*）機制（跟 form-field.tsx 的 FormField 不同，FormField 自己刻了必填星號；label.tsx 沒有 required 相關 prop，若要星號需自行在 children 加）
- [ ] forwardRef 轉發到 LabelPrimitive.Root
- [ ] 無 `dark:` 前綴樣式，文字顏色為繼承（未指定顏色 token，使用瀏覽器/父層預設前景色）

**被誰使用：**
- components/funding-dialog.tsx
- components/funding-content.tsx
- components/balance-card.tsx
- app/register/page.tsx
- app/login/page.tsx

---

## 元件：DatePicker／日期選擇器（components/ui/date-picker.tsx，date-fns + react-day-picker）

- [ ] Props：value?: Date、onChange?: (date: Date|undefined)=>void、placeholder?: string、className?、disabled?: boolean
- [ ] 顯示格式：date-fns `format(value, "PPP", { locale })`（PPP 為 date-fns 長日期格式，中文 locale 下約略呈現「2026年7月3日」樣式，英文 locale 下約略呈現「July 3rd, 2026」樣式）
- [ ] 在地化：依 `useLanguage()` context 切換 zhTW／enUS（date-fns/locale），中文模式下月曆會顯示中文月份/星期
- [ ] 預設 placeholder 依語言切換："選擇日期"（中）／"Pick a date"（英）
- [ ] UI 互動模式：點擊觸發按鈕開關彈出式月曆（**非**原生 `<input type="date">`）
- [ ] 點擊元件外部區域會自動關閉（document mousedown 監聽 + containerRef 判斷）
- [ ] 選定日期後自動關閉月曆（handleSelect 呼叫 onChange 後立即 setIsOpen(false)）
- [ ] ⚠️ **沒有實作 ESC 鍵關閉**（跟 Modal 不同，這裡只有點外部關閉，沒有 keydown Escape 監聽）
- [ ] mode="single"：僅支援單一日期選取，**不支援**日期範圍(range)或多選(multiple)
- [ ] showOutsideDays：會顯示上/下月份的日期（灰階、opacity-50 呈現）
- [ ] disabled prop：只會停用整個觸發按鈕（opacity-50 cursor-not-allowed），⚠️ **沒有**「停用月曆中特定日期」的能力（沒有 minDate/maxDate/disabledDays 之類的日期範圍限制 prop 可傳入）
- [ ] ⚠️ 無法直接手動輸入/打字日期（只能透過月曆點選）
- [ ] 月曆各狀態皆有自訂 classNames：today（bg-accent）、selected（bg-primary）、outside（半透明）、disabled（半透明）、hidden（invisible）
- [ ] 有引入 react-day-picker 預設 CSS（`import "react-day-picker/dist/style.css"`）
- [ ] 彈出層樣式：absolute z-50 mt-1 p-2，bg-card border rounded-lg shadow-lg
- [ ] 無 `dark:` 前綴樣式，走語意 token

**被誰使用：**
- ⚠️ 經全專案搜尋，目前**沒有任何檔案 import 此元件**。核心的 `components/expense-form.tsx` 日期欄位實際上是用原生 `<input type="date">` 搭配 react-hook-form 的 `register()`（第 430 行附近），並非使用這個已經做好中文在地化的 DatePicker。重設計時請明確決定：要採用這個 DatePicker（有中文月曆），還是維持目前 production 實際在用的原生 date input 行為。

---

## 元件：CurrencyInput／金額輸入框（components/ui/currency-input.tsx）

- [ ] Props：value?: number（預設 0）、onChange?: (value:number)=>void、currency?: string（預設 "NT$"）、其餘原生 input 屬性（排除 value/onChange）
- [ ] 千分位格式化：`num.toLocaleString("en-US", { maximumFractionDigits: 2 })`，例如 1234.5 → "1,234.5"
- [ ] 小數位：最多 2 位（maximumFractionDigits: 2），⚠️ 未設定 minimumFractionDigits，所以整數金額**不會**補 ".00"（1000 顯示為 "1,000" 而非 "1,000.00"）
- [ ] 即時格式化：每次輸入變更（onChange）就立刻重新格式化顯示值並加上千分位逗號，**不是**只有失焦時才格式化
- [ ] onBlur 時二次重新格式化（保險機制，處理中間態）
- [ ] onFocus 時自動全選輸入框內容（e.target.select()），方便使用者直接覆蓋整個金額重新輸入
- [ ] 輸入過濾：正規表示式只允許數字與小數點通過，⚠️ **連負號「-」也會被濾掉**，代表**無法輸入負數金額**（例如退款、沖銷、折讓等情境若需要負數會受限）
- [ ] 貨幣符號顯示：以絕對定位文字疊在輸入框左側（預設 "NT$"），本身**不是** input value 的一部分；⚠️ currency 只是靜態顯示 prop，**沒有**幣別下拉選單可切換
- [ ] input 對齊：文字靠右對齊（text-right），搭配 pl-12 留白給左側貨幣符號
- [ ] input 型別：type="text" + inputMode="decimal"（刻意不用 type="number"，避免瀏覽器原生上下箭頭，但也代表所有格式化/驗證都要靠自己的 JS 邏輯，沒有瀏覽器原生數值檢查兜底）
- [ ] ⚠️ 無內建錯誤/驗證樣式（沒有 error prop，需外部另用 FormField 包裝才有紅框錯誤顯示）
- [ ] 無 `dark:` 前綴樣式，走語意 token（bg-background、text-muted-foreground）

**被誰使用：**
- ⚠️ 經全專案搜尋，目前**沒有任何檔案 import 此元件**。核心的 `components/expense-form.tsx` 金額欄位實際上是用原生 `<input type="number">` 搭配 react-hook-form 的 `register()`（第 477 行附近），並非使用這個 CurrencyInput。也就是說**目前使用者輸入報帳金額時看到的是瀏覽器原生數字輸入框，沒有千分位逗號格式化**。重設計時請確認金額輸入要採用哪一套行為（原生 number input，或改採這個已做好千分位格式化的 CurrencyInput）。

---

## 元件：lib/ui-constants.ts／按鈕與輸入框樣式字串常數（⚠️ 非 React 元件，是純 className 字串）

- [ ] `BUTTON_PRIMARY`：實心主色按鈕字串（inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50）
- [ ] `BUTTON_MUTED`：灰階中性按鈕字串（bg-muted hover:bg-muted/80，無指定文字顏色，跟隨預設前景色）
- [ ] `BUTTON_DESTRUCTIVE`：**外框式**危險按鈕字串（border border-destructive text-destructive hover:bg-destructive/10，透明底 + 危險色邊框跟文字，**非**實心填色）
- [ ] `BUTTON_MUTED_SM`：BUTTON_MUTED 的縮小版（px-3 py-1.5，字級無 font-medium，用於緊湊/圖示型操作按鈕）
- [ ] `BUTTON_DESTRUCTIVE_SM`：BUTTON_DESTRUCTIVE 的縮小版
- [ ] ⚠️ **沒有 BUTTON_PRIMARY_SM**（三種按鈕字串裡只有 muted 跟 destructive 有 _SM 縮小版，primary 沒有對應小尺寸版本，屬不對稱設計，重設計時如果要統一尺寸系統要留意這個缺口）
- [ ] `INPUT_CLASS`：單一輸入框樣式字串（w-full px-3 py-2 **rounded-md** border bg-background text-foreground focus:ring-2 focus:ring-primary/50）
- [ ] 這些都是「純字串常數」，不是 React 元件、沒有 variant/size prop 系統；使用方式是直接把字串塞進原生 `<button>`/`<input>` 的 className，disabled 狀態需自行在 JSX 上加 disabled 屬性（字串本身內建了 disabled:opacity-50，但**沒有** disabled:pointer-events-none，跟 Button.tsx 不同）
- [ ] ⚠️⚠️【重要，務必標註】這是跟 `components/ui/Button.tsx` 元件**並存的第二套按鈕樣式系統**，兩者外觀不保證一致：例如同樣語意「destructive／危險」，Button.tsx 的 `variant="destructive"` 是**實心填滿**（bg-destructive 純色底），但這裡的 `BUTTON_DESTRUCTIVE` 是**外框鏤空**（border-destructive + 透明底）——同一個語意名稱在畫面上長得不一樣，重設計時必須決定統一成哪一種視覺
- [ ] ⚠️ 連同 loading.tsx 的 LoadingButton 內建樣式一起算，整個系統其實有**三套並存**的按鈕外觀：(1) components/ui/Button.tsx 的 variant/size prop 元件、(2) 這個檔案的字串常數、(3) loading.tsx LoadingButton 自己手刻的樣式
- [ ] ⚠️ `INPUT_CLASS`（rounded-md + ring-primary/50）與 components/ui/input.tsx（rounded-md + ring-ring + h-10）、components/ui/form-field.tsx 的 Input（rounded-lg + ring-primary/20）三者細節皆不同，是**三套並存**的輸入框外觀系統，圓角、focus ring 顏色/透明度、高度都不一致
- [ ] 附註：專案根目錄 CLAUDE.md 文件中的範例程式碼寫的是 `BUTTON_STYLES.primary` / `.secondary` / `.danger`（物件屬性寫法），但這個檔案實際匯出的是扁平具名常數 `BUTTON_PRIMARY` / `BUTTON_MUTED` / `BUTTON_DESTRUCTIVE` 等（**沒有** `BUTTON_STYLES` 這個物件），文件範例與實際程式碼已經不同步，重設計時不要照著 CLAUDE.md 文件裡的名稱去找

**被誰使用：**
- components/bank-account-settings.tsx（BUTTON_PRIMARY, BUTTON_MUTED, BUTTON_MUTED_SM, BUTTON_DESTRUCTIVE_SM, INPUT_CLASS）
- components/bank-account-select-dialog.tsx（BUTTON_PRIMARY, BUTTON_MUTED）
- components/settings-content.tsx（BUTTON_PRIMARY, BUTTON_MUTED, INPUT_CLASS）

---

# 十、孤兒／未使用元件與死代碼總表（附錄）

> 這節彙整前九節中散落各處的「⚠️ 零使用／死代碼」發現，集中在一起方便重設計團隊逐項決策：**接上使用 / 明確捨棄 / 保留備用**。這些項目**不是**目前使用者看得到的功能，不需要在新版找對應畫面；但若隨意刪除背後的程式碼，要先確認以下判斷正確。

## A. 完全零使用的共用元件（全專案 grep 不到任何 import）

- [ ] `components/ui/date-picker.tsx`（DatePicker，已做中文月曆在地化）—— `expense-form.tsx` 實際用原生 `<input type="date">`
- [ ] `components/ui/currency-input.tsx`（CurrencyInput，千分位格式化）—— `expense-form.tsx` 實際用原生 `<input type="number">`，畫面上金額輸入沒有千分位逗號
- [ ] `components/ui/form-field.tsx`（FormField／Input／Textarea／Select 全系列）
- [ ] `components/ui/loading.tsx`（Spinner／LoadingOverlay／LoadingButton／Skeleton／SkeletonCard／SkeletonTable 全系列）
- [ ] `components/bank-account-select-dialog.tsx`（BankAccountSelectDialog）—— `expense-form.tsx` 另外自己刻了一份功能相同但不同程式碼的收款帳戶選擇 UI
- [ ] `app/dashboard/dashboard-table.tsx` ＋ `app/dashboard/columns.tsx`（DashboardTable，含「Approve/Reject」逐列操作）—— 真正的 `/dashboard` 路由渲染的是 `DashboardContent`，這個表格未被任何路由引用；內部角色判斷還誤寫成不存在的 `"MANAGER"`（詳見下方 C 項）
- [ ] `hooks/useAutoSave.ts` ＋ `lib/draft-storage.ts`（草稿自動儲存：debounce 儲存／24 小時過期／恢復草稿）—— `expense-form.tsx` 從未 import，目前填表到一半重新整理會直接遺失資料，畫面上沒有任何「已自動儲存」或「恢復草稿」提示
- [ ] `hooks/useCache.ts`（`useCache` SWR-like 快取 hook＋`invalidateCache`／`clearCache`／`invalidateCacheByPrefix`）與同檔內的 `useInfiniteScroll`（無限滾動 hook）—— 全專案 `.tsx` 檔案 grep 零匹配，完全未被任何頁面使用
- [ ] `app/actions/budget.ts` 的 `getOverspentDepartments()` —— 未被任何頁面呼叫
- [ ] `app/actions/bank-accounts.ts` 的 `getBankAccountForReport(reportId)` —— 未被任何頁面呼叫，原意疑似是報帳單詳情頁依權限決定是否遮蔽帳號用
- [ ] `components/reports-content.tsx` import 但未呼叫的 `lib/export-utils.ts` 內某匯出函式（詳見 inv 原文第七節）
- [ ] `lib/language-context.tsx` 字典中「About Page」整組 key（含「Ultimate Expense」產品名稱）與部分「Landing Page」key（`expense_system`／`sign_in`／`hero_title`／`hero_desc`／`get_started`）—— 完整雙語文案已寫好，但目前 `/about` 與 `/` 頁面程式碼沒有引用這些 key，改用頁面內硬編碼的另一套文案

## B. 修正：曾被誤判為孤兒、實際上有被使用

- [ ] `app/actions/password.ts` 的 `changePassword`：在「一、公開與登入頁面」小節的盤點範圍內找不到呼叫端，**但已確認**實際呼叫端是「八、使用者／設定／個人資料」的 `settings-content.tsx`（透過 `useFormState` 綁定為 `passwordAction`），**並非孤兒**，只是分屬不同盤點分工範圍。

## C. 角色判斷寫死不存在的 `"MANAGER"`（Prisma `Role` enum 實際只有 `USER／VICE_LEADER／LEADER／FINANCE／ADMIN`，恆為 false 的死判斷分支）

- [ ] `app/dashboard/page.tsx` 的 `buildWhereClause()` —— `case "MANAGER"` 永遠不會命中，導致 `LEADER`／`VICE_LEADER` 在 dashboard 首頁的「近期報表」實際落入 `default` 分支，只看得到自己提交的報表，看不到待自己審核的團隊報表
- [ ] `app/dashboard/columns.tsx` 的操作權限判斷 —— 同樣誤寫 `role === "MANAGER"`
- [ ] `components/profile-content.tsx` 的角色配色邏輯 —— `role === 'MANAGER'` 分支永遠不會命中，導致 `LEADER`／`VICE_LEADER` 兩種角色在個人資料頁沒有專屬顏色，一律落入灰色「其餘」分支
- [ ] `components/reports-content.tsx` 統計比對 `status === "PAID" || status === "APPROVED"` —— `"APPROVED"` 不在現行 5 值 `ReportStatus` enum 中，推測為舊狀態機殘留的相容判斷

## D. 資料被靜默丟棄 / 前後端不一致

- [ ] 資金新增表單「其他類型」自訂輸入框（`customType`）：`/dashboard/funding` 頁內 Modal 與 dashboard 首頁 `FundingDialog` 兩處都有這個欄位，但 `createFundingRecord` server action 從未讀取 `formData.get("customType")`，使用者填寫的自訂文字送出後一律被丟棄，資料庫只存 `type: "OTHER"`，畫面永遠只顯示「其他」
- [ ] 刪除報帳單的確認文字有兩種不一致版本：`reports-content.tsx` 的 `handleDelete()` 用瀏覽器原生 `confirm()`，文字為「確定要刪除此報帳單嗎？」；`lib/language-context.tsx` 另外定義了未被使用的 `confirm_delete_report` key，文字是「確定要刪除此報帳單嗎？此操作無法復原。」（多了「此操作無法復原」）——重設計時建議統一並採用資訊較完整的版本

## E. 訊息提示機制三套以上並存、行為互不一致

官方共用 hook 是 `hooks/useMessage.ts`（3 秒自動消失），但以下元件各自土炮了行為不同的版本，重設計時建議全部統一改回共用 hook（或設計一套新的統一機制）：

- [ ] `balance-card.tsx`、`users-content.tsx`：自寫 3 秒自動消失版本（行為模仿但非同一份程式碼）
- [ ] `department-budget-content.tsx`：自寫 3 秒自動消失版本
- [ ] `bank-account-settings.tsx`：自寫但**沒有**自動消失機制，訊息會一直卡在畫面上
- [ ] `settings-content.tsx` 的頭像／通知訊息：**沒有**自動消失機制
- [ ] `settings-content.tsx`／`profile-content.tsx` 的密碼表單訊息：綁在 `useFormState`，同樣不會自動消失
- [ ] `approvals-content.tsx`：核准／拒絕失敗時**完全沒有**任何使用者可見的錯誤提示（僅 `console.error`），使用者只會看到按鈕恢復可點擊、無法得知失敗原因
- [ ] `funding-content.tsx`：編輯失敗訊息會被「編輯資金記錄」Modal（未用 `createPortal`）整個蓋住，使用者實際上看不到

## F. Modal 未使用 `createPortal`（與 `CLAUDE.md` 記載的建議做法不一致）

`CLAUDE.md` 明確建議 Modal 應以 `createPortal` 渲染到 `document.body` 以避免 z-index／stacking context 問題，並舉 `receipt-preview.tsx` 為正確範例，但以下元件未遵循：

- [ ] `components/ui/modal.tsx`（共用 Modal 元件本身）
- [ ] `components/balance-card.tsx` 的編輯資金記錄 Modal
- [ ] `components/funding-content.tsx` 的新增／編輯資金記錄兩個 Modal
- [ ] （對照組：`components/bank-account-settings.tsx`、`components/receipt-preview.tsx` 有正確使用 `createPortal`，可作為重設計時的統一範本）

## G. 兩套以上並存的按鈕／輸入框樣式系統

- [ ] 按鈕：`components/ui/Button.tsx`（variant/size 完整元件）vs `lib/ui-constants.ts`（`BUTTON_PRIMARY`／`BUTTON_MUTED`／`BUTTON_DESTRUCTIVE` 等純 className 字串常數）vs `components/ui/loading.tsx` 的 `LoadingButton`（零使用，見 A 項）—— 三套並存，且 **destructive 語意的視覺在前兩套系統中相反**：`Button.tsx` 是實心填色，`ui-constants.ts` 是外框鏤空
- [ ] 輸入框：`components/ui/input.tsx`／`form-field.tsx` 的 `Input` vs `lib/ui-constants.ts` 的 `INPUT_CLASS` 字串 —— 圓角與 focus ring 顏色不同
- [ ] `app/register/page.tsx` 自己刻了一個本地 `FormField`，與共用元件庫的 `FormField`（`components/ui/form-field.tsx`）同名但結構完全不同，容易混淆

## H. 導覽入口缺口

- [ ] `/dashboard/stats` 完全沒有出現在 `components/app-sidebar.tsx` 的 `MENU_ITEMS`（已 grep 全專案 `.tsx` 確認無任何 `<Link>`／`href` 指向此路徑），即使 ADMIN／FINANCE 角色也只能手動輸入網址到達。重設計時需明確決定：補上導覽入口，或明確記錄「保留但刻意不接導覽」

## I. 其他值得一併決策的行為怪異點

- [ ] `app/dashboard/inventory` 的 `canAccessInventory(role, department)` 判斷不符時靜默 `redirect("/dashboard")`，沒有任何提示文字說明「為什麼」被導回
- [ ] 庫存管理（`inventory-content.tsx` 等）幾乎沒有依角色的前端 UI 限制——除了刪除按鈕（僅 ADMIN 可見）外，新增/編輯/入庫/領用/批量操作對 `USER` 角色皆完整可見可點擊，只在送出後被伺服器 `requireInventoryWrite()` 拒絕
- [ ] `AppSidebar` 的使用者資訊區塊只顯示大頭貼、姓名、Email，**沒有**顯示角色或組別的文字/徽章（`userRole`／`userDepartment` 兩個 props 只用於選單顯示邏輯，從未渲染成畫面文字）——重設計如果想加上角色徽章，這是新功能而非「還原原樣」
- [ ] `app/layout.tsx` 有掛載 `ThemeProvider`／`useTheme()`／`toggleTheme()` 基礎設施，但本次盤點的所有頁面／元件中**找不到任何一處**呼叫它，即沒有任何「切換深色模式」的按鈕或開關——需確認是否真的存在於未盤點角落，或是預留但從未做完的功能
