# 報帳系統 - 備份與還原指南

## Supabase 自動備份

Supabase 提供每日自動備份功能（Pro 方案以上）。

### 備份策略

| 類型 | 頻率 | 保留期間 |
|------|------|----------|
| 每日備份 | 每天 | 7 天 |
| 時間點恢復 | 持續 | 7 天 |

### 啟用自動備份

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案 → Settings → Database
3. 確認 "Daily Backups" 已啟用

---

## 手動備份

### 使用 pg_dump

```bash
# 完整資料庫備份
pg_dump -h <SUPABASE_HOST> -p 5432 -U postgres -d postgres -F c -f backup.dump

# 僅備份特定表格
pg_dump -h <SUPABASE_HOST> -p 5432 -U postgres -d postgres -t ExpenseReport -t ExpenseItem -F c -f expenses_backup.dump
```

### 使用 Supabase CLI

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入
supabase login

# 建立本地備份
supabase db dump --project-ref <PROJECT_ID> > backup.sql
```

---

## 還原資料

### 從 Supabase Dashboard

1. Settings → Database → Backups
2. 選擇備份時間點 → "Restore"
3. 確認還原（⚠️ 此操作會覆蓋現有資料）

### 使用 pg_restore

```bash
# 還原完整備份
pg_restore -h <SUPABASE_HOST> -p 5432 -U postgres -d postgres -c backup.dump

# 還原並忽略錯誤
pg_restore -h <SUPABASE_HOST> -p 5432 -U postgres -d postgres --if-exists -c backup.dump
```

---

## 定期備份腳本

建議設定 cron job 定期執行備份：

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_HOST="db.xxx.supabase.co"
DB_USER="postgres"

# 建立備份
pg_dump -h $DB_HOST -p 5432 -U $DB_USER -d postgres -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# 刪除 30 天前的備份
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
```

---

## 災難恢復 SOP

### 1. 評估情況
- 確認資料遺失範圍
- 決定還原時間點

### 2. 停止應用程式
- 在 Vercel 暫停部署
- 或設定維護模式

### 3. 執行還原
- 選擇適當的備份
- 執行還原操作

### 4. 驗證資料
- 檢查關鍵資料表
- 驗證資料完整性

### 5. 恢復服務
- 重新部署應用
- 監控錯誤日誌

---

## 聯絡資訊

- Supabase Support: support@supabase.com
- 緊急問題: 建立 GitHub Issue
