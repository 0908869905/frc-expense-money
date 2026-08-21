# FRC 6998 報帳系統（Money）

> **FRC 機器人校隊的經費／庫存／募款管理系統**：收據拍照 OCR 自動填單 → 五級角色簽核 → 撥款與稽核紀錄。管的是真實金流，設計核心是「每一筆錢從申請到付款，每一步都有人負責、有紀錄可查」。

| | |
|---|---|
| 作者 | 李昌侑（Rick Lee）— FRC 6998 UNIPARDS 程式組 |
| 期間 | 2025/12 – 2026/07（300+ commits，本專案群中跨度最長） |
| 狀態 | **上線使用中**（Vercel 部署＋Capacitor iOS 殼） |
| 規模 | 約 17,700 行、136 檔、Prisma 21 個資料模型 |

## 為什麼做這個

隊伍一季要處理零件採購、報名費、募款與贊助款，原本靠群組貼收據＋試算表對帳：誰墊了錢、誰核過、撥了沒有，常常要翻很久。我把它做成一套有角色、有流程、有留痕的系統。

## 做了什麼

- **收據 OCR 自動填單**：手機拍收據 → Google Cloud Vision 辨識 → 自動帶入金額／日期／品項，人工確認後送出
- **五級角色簽核**：成員／副隊長／隊長／財務／管理員五種角色分層把關——隊長審核 → 財務複核 → 撥款；每一級可退回並附理由，全程稽核日誌
- **庫存與募款**：零件庫存連動採購單；募款／贊助收入與支出同一套帳
- **多組織（multi-tenant）**：以組織為邊界的資料隔離（RLS），同一套系統可服務多個隊伍／社團
- **安全稽核歷程（Phase 1–5）**：SSRF 防護、登入限流、CSP 標頭、密碼雜湊（bcrypt）、稽核日誌——每一階段在 `progress.md` 都有紀錄
- **行動端**：Capacitor 打包 iOS，相機直接拍收據

## 架構

```
Next.js 14 (App Router, Server Actions)
 ├─ NextAuth v5 ── 角色／組織權限
 ├─ Prisma ── PostgreSQL（Supabase）＋ RLS 多租戶隔離
 ├─ Upstash Redis ── 登入限流／快取
 ├─ Google Cloud Vision ── 收據 OCR
 └─ Capacitor ── iOS 殼
```

主要目錄：`app/`（頁面與 Server Actions）、`components/`、`lib/`（權限、金額 dinero.js、驗證 zod）、`prisma/`（schema 與 migrations）、`docs/`（設計與重構紀錄）。

## 本機執行

```bash
cp .env.example .env   # 填入資料庫、Auth、Redis、GCV 憑證
npm install
npx prisma generate && npx prisma db push
npm run dev
```

## 開發方式（AI 協作聲明）

本專案以「與 AI 結對開發」完成：問題定義、需求規格、架構設計、驗證由我負責，程式碼由我與 AI（Claude Code）協作產出；每個模組做什麼、為什麼選這個方案、哪裡會失效，由我判斷並負責。`progress.md`／`findings.md`／`ERRORS.md` 是開發期間的真實工作紀錄，保留原貌。

## 相關專案

同一個賽場長出來的一整套系統：[科展・電腦視覺計分](https://github.com/0908869905/scoring-analyzer) ・ [影像標註平台](https://github.com/0908869905/frc-train-review) ・ [偵察 App](https://github.com/0908869905/frc-scouting-pass) ・ [偵察掃描與 OPR](https://github.com/0908869905/frc-scout-scanner) ・ [台灣手語影音辭典](https://github.com/0908869905/tsl-sign-dictionary) ・ [園遊會點餐系統](https://github.com/0908869905/ordering-system)
