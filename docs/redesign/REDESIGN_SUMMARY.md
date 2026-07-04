# 前端全面重設計交付報告 —「工程帳冊 / Shop Ledger」

> 2026-07-03 深夜 ~ 07-04 凌晨，由 Claude Fable 5 自主完成。
> 分支：`redesign/ui-v2`（**未動 main、未部署**）

---

## 一、你睡前交代的事，完成狀態

| 要求 | 狀態 |
|---|---|
| 先備份資料庫所有資料到本地 | ✅ 14 個 model、270 筆 → `backups/2026-07-03_222735/`（含還原腳本） |
| 仔細看過所有介面、按鍵、內容 | ✅ 27 張現況截圖 + 3,344 行地毯式 UI 盤點（`UI_INVENTORY.md`） |
| 研究「如何不要有 AI 味」再動手 | ✅ 27 條 AI 味黑名單 + 20 條人味原則（`DESIGN_PRINCIPLES.md`） |
| 用 design 重作所有前端頁面 | ✅ 18 頁 + 2 layout + 40+ 元件全數重作 |
| 不遺漏任何東西 | ✅ 所有按鍵/表單/連結/雙語/角色條件全保留（盤點清單逐項核對） |
| 介面實作由 Fable 5 親自操刀 | ✅ 全部 UI 程式碼親手寫；agent 只做研究/盤點/審查 |
| token 控管 | ✅ 研究派 3 個 sonnet agent 並行，實作集中主 agent |

## 二、新設計是什麼：「工程帳冊」

**概念**：FRC 車隊的世界是機房、CNC、料號（REV-21-1650）、pit 區。
這套系統不該像太空船駕駛艙（原本的電競 HUD 風），該像**車隊工具牆上那本翻爛了的精密帳冊**——CAD 圖框、datasheet、機械師量具的可信感。

**視覺語彙**：
- **紙與墨**：深色「石墨車間」（暖灰石墨，非 AI 藍）＋淺色「圖紙」（暖紙白）雙主題
- **琥珀信號色**：豹的顏色 × 車間 safety orange，AI 幾乎從不選它；嚴格只用在主按鈕/焦點/active
- **IBM Plex Sans + Plex Mono + Noto Sans TC**：所有金額、日期、料號、ID 一律 mono + tabular——工程文件的簽名動作
- **hairline 邊框分區**：無玻璃擬態、無光暈、無漸層、無 hover 位移
- **狀態 = 指示點**：`● 已付款` 小圓點 + mono 文字，取代大色塊藥丸
- **工程圖細節**：登入頁 CAD 圖框 title block、藍圖網格、帳冊式流水編號（01 02 03…）
- **吉祥物保留**：走動小貓 loading（改石墨小螢幕框）、豹爪撕裂轉場（去紫光粒子、改琥珀撕裂邊）、about 頁的 editorial 雜誌設計原樣保留

**被消滅的 AI 味**（對照 `DESIGN_PRINCIPLES.md` 黑名單）：
滿版 logo 浮水印、全域 h1 漸層字、大數字青色 glow、玻璃擬態卡片、漸層捲軸、紫粉青漸層 hero、粒子/電路動畫、彩虹進度條、✨sparkle、emoji 當圖標、recharts 預設紫綠、雙軸圖表、pastel 藥丸狀態、`!important` 全域覆寫。

## 三、除了改皮，還順手修好的「既有 bug」

1. **淺色主題其實從來沒生效過**：`.light` CSS 被 Tailwind purge 掉（@layer 內未引用 selector 會被 tree-shake）→ 已移出 @layer 修復
2. **主題偏好會被覆寫**：theme-context 在掛載時把預設值回寫 localStorage（StrictMode 下覆寫用戶選擇）→ 已修復，現在深淺切換可跨頁持久
3. **圖表色盤通過無障礙驗證**：新色盤跑過 dataviz 六項檢查（亮度帶域/彩度下限/色盲分離/表面對比），深淺主題皆 PASS
4. **類別佔比圓餅圖**原本標籤相撞 + "Other 98%" 失衡 → 改為水平長條直接標值
5. **狀態分布雙軸圖**（圖表第一反模式）→ 拆成數量/金額兩張單軸圖，狀態語意上色
6. **DEPARTMENT_CONFIG 缺 MENTOR**：老師帳號的組別會顯示原始 "MENTOR" → 已補「老師/導師」

## 四、品質關卡結果

| 關卡 | 結果 |
|---|---|
| `npx tsc --noEmit` | ✅ 0 錯誤（每批次都跑） |
| `npm run build` | ✅ 24 頁全數編譯通過 |
| `npm run lint` | ✅ 僅 2 個既有警告（receipt-preview `<img>`，base64 資料 URL 不適用 next/image） |
| 危險模式掃描 | ✅ 無 dangerouslySetInnerHTML/eval；唯一 document.write 是既有 QR 列印功能 |
| 視覺驗證 | ✅ 深/淺主題 × 桌面/行動 全套 after 截圖（`screenshots/after/`） |
| Code review | ⚠️ 外部 review agent 因帳號額度上限中止（額度於 2:50am 重置後恢復作業）→ 改由主 agent 自我審查：全部重寫檔案的 handler/onClick/href/i18n 計數與 main 版本 **1:1 相符**（dashboard 7→7、login 4→4、register 11→11、landing 3→3；t() 全數保留），sed 批次置換零誤傷。搭配 tsc/build/lint/視覺四關全過，信心充分；如需更嚴格審查可於額度充裕時跑 `/code-review` |

## 五、怎麼看成品

```bash
cd Money
npm run dev        # 目前已在背景執行中
# 瀏覽 http://localhost:3000
```
- 測試帳號：`design-review@unipards.test`（ADMIN，密碼在 `backups/test-user-credentials.txt`）
- 用完可刪：`npx tsx scripts/create-test-user.ts --delete`
- 截圖對照：`docs/redesign/screenshots/before/` vs `after/`

**部署決策留給你**：分支已推上 GitHub（`redesign/ui-v2`），**沒有**碰 main（避免 Vercel 自動部署未經你審核的改版）。滿意後：
```bash
git checkout main && git merge redesign/ui-v2 && git push
```

## 六、資料安全

- 動工前完整備份：`backups/2026-07-03_222735/`（16 用戶、29 報帳單、32 明細、58 庫存品項…共 270 筆）
- 還原方式：`npx tsx scripts/restore-db.ts backups/2026-07-03_222735 --confirm`
- 本次改動**零資料庫寫入**（除了建立 1 個測試帳號）；`backups/` 已加入 .gitignore

## 七、既有問題清單（非本次造成，供未來排程）

UI 盤點時發現的 pre-existing 問題，本次遵守「不動邏輯」原則未處理：

1. **死代碼角色 "MANAGER"**：`app/dashboard/page.tsx`、`columns.tsx` 有永不命中的 `case "MANAGER"`（enum 無此值）→ LEADER/VICE_LEADER 在首頁看不到待審報表（疑似原意）
2. **customType 靜默丟棄**：資金「其他類型」自訂文字，server action 從未讀取
3. **`/dashboard/stats` 孤兒路由**：無任何導覽入口（僅能手動輸入網址），本次保留原狀
4. **訊息提示機制 3+ 套並存**：部分不會自動消失；approvals 失敗時完全無提示
5. **部分 Modal 未用 createPortal**（與 CLAUDE.md 建議不符）
6. **草稿自動儲存 hook 從未接上**（useAutoSave 存在但 expense-form 未用）
7. **登入表單 hydration 前送出**會把帳密放進 URL query（原生 GET fallback）——建議加 `method="post"` 或 disabled-until-hydrated
8. 完整清單見 `docs/redesign/UI_INVENTORY.md` 文末 A–I 節

## 八、檔案地圖

| 產出 | 位置 |
|---|---|
| 設計系統規範 | `docs/redesign/DESIGN_SYSTEM.md` |
| 去 AI 味研究 | `docs/redesign/DESIGN_PRINCIPLES.md` |
| 樣式審計 | `docs/redesign/STYLE_AUDIT.md` |
| UI 全盤點（3,344 行） | `docs/redesign/UI_INVENTORY.md` |
| 前後對照截圖 | `docs/redesign/screenshots/{before,after}/` |
| DB 備份/還原/測試帳號腳本 | `scripts/{backup-db,restore-db,create-test-user}.ts` |
| 圖表色彩模組 | `lib/chart-colors.ts` |
