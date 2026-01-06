# 🤖 Figma AI 提示詞集 - FRC 報帳系統

> 使用方式：在 Figma 中按 `Ctrl + /` 或點擊 AI 按鈕，複製貼上以下提示詞

---

## 📌 步驟 1：整體 Dashboard 頁面

```
Design a modern SaaS dashboard for "FRC 6998 UNIPARDS" expense reimbursement system.

LAYOUT (1440x900):
- Left sidebar: 240px width, dark blue background #0F172A
- Main content: remaining width, light gray background #F8FAFC
- Header height: 64px
- Content padding: 24px

SIDEBAR CONTENT:
- Top: Circle team logo with "FRC 6998" text
- Navigation items with icons:
  • Dashboard (selected - orange accent)
  • Expense Reports
  • Pending Approvals  
  • Department Budget
  • Funding Records
  • Inventory
  • Users (admin only)
  • Audit Logs
- Bottom: Settings, Dark mode toggle, Language switcher

MAIN CONTENT:
- Header: "Dashboard" title, welcome message, user avatar dropdown
- 4 stats cards row
- Charts section (line chart + pie chart)
- Recent activity table

STYLE:
- Primary: #1E3A8A (deep blue)
- Accent: #F97316 (orange)
- Success: #10B981, Warning: #F59E0B, Error: #EF4444
- Border radius: 12px
- Font: Inter
- Soft shadows
```

---

## 📌 步驟 2：側邊導覽欄 (Sidebar)

```
Design a dark vertical sidebar navigation component.

SIZE: 240px width, 900px height
BACKGROUND: Dark blue #0F172A

SECTIONS:
1. LOGO AREA (64px height):
   - Circular team logo placeholder
   - Text "FRC 6998" in white, bold

2. NAVIGATION MENU:
   Each item: 44px height, 16px horizontal padding
   Icon (20px) + Label with 12px gap
   
   Items:
   - 📊 Dashboard (SELECTED STATE: left orange border 4px, background #1E293B)
   - 📝 Expense Reports
   - ✅ Pending Approvals (badge showing "7")
   - 💰 Department Budget
   - 💵 Funding Records
   - 📦 Inventory
   - 👥 Users
   - 📋 Audit Logs

3. DIVIDER: 1px line, 10% opacity white

4. BOTTOM SECTION:
   - ⚙️ Settings
   - 🌙 Dark Mode toggle switch
   - 🌐 Language: 繁中/EN

TEXT COLOR: White #FFFFFF, 80% opacity for unselected
HOVER STATE: Background #1E293B
```

---

## 📌 步驟 3：統計卡片 (Stats Cards)

```
Design 4 horizontal stats cards for a dashboard.

LAYOUT: 4 cards in a row, 24px gap between cards
EACH CARD SIZE: 280px width, 120px height

CARD STYLE:
- Background: White #FFFFFF
- Border radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px

CARD CONTENT:
- Left: 48px circle icon with colored background
- Right: 
  - Main number: 32px, bold, #0F172A
  - Label: 14px, #64748B
  - Trend indicator: small arrow + percentage

THE 4 CARDS:
1. 💰 Total Balance
   - Icon bg: #DBEAFE (light blue)
   - Number: $125,000
   - Label: Team Balance
   - Trend: ↑ 12% (green)

2. 📉 Monthly Expenses  
   - Icon bg: #FEE2E2 (light red)
   - Number: $8,450
   - Label: This Month
   - Trend: ↓ 5% (green, expenses down is good)

3. ⏳ Pending Approvals
   - Icon bg: #FEF3C7 (light yellow)
   - Number: 7
   - Label: Awaiting Review
   - Trend: +3 new

4. ✅ Paid This Month
   - Icon bg: #D1FAE5 (light green)
   - Number: 23
   - Label: Completed
   - Trend: none
```

---

## 📌 步驟 4：圖表區域 (Charts Section)

```
Design a dashboard charts section with 2 charts side by side.

LAYOUT: 
- Container: full width, 400px height
- Left chart: 60% width
- Right chart: 40% width  
- Gap: 24px

LEFT - LINE CHART (Monthly Expense Trend):
- White card background, 12px radius
- Title: "Monthly Expense Trend" with subtitle "Last 6 months"
- Area line chart with gradient fill
- X-axis: Jul, Aug, Sep, Oct, Nov, Dec
- Y-axis: $0 - $15,000
- Line color: #1E3A8A with light blue gradient fill
- Data points: $8000, $12000, $9500, $11000, $7800, $8450
- Grid lines: light gray dashed

RIGHT - DONUT CHART (Expense by Department):
- White card background, 12px radius
- Title: "Expense by Department"
- Donut/pie chart with 6 segments
- Legend below or beside with department names

DEPARTMENT COLORS:
- Electrical ⚡: #3B82F6 (blue) - 25%
- Mechanical ⚙️: #EF4444 (red) - 30%
- Documentation 📝: #10B981 (green) - 10%
- PR 📣: #F59E0B (yellow) - 15%
- Finance 💰: #8B5CF6 (purple) - 8%
- Design 🎨: #EC4899 (pink) - 12%
```

---

## 📌 步驟 5：最近報帳單表格 (Recent Expenses Table)

```
Design a data table showing recent expense reports.

CONTAINER:
- White background, 12px border radius
- Title: "Recent Expense Reports" with "View All" link

TABLE HEADER:
- Background: #F8FAFC
- Font: 12px, uppercase, #64748B, font-weight 600
- Columns: Title, Submitted By, Amount, Status, Date

TABLE ROWS (5 rows):
- Height: 56px each
- Hover: light blue background #F0F9FF
- Divider: 1px #E2E8F0

SAMPLE DATA:

| Title | Submitted By | Amount | Status | Date |
|-------|--------------|--------|--------|------|
| Competition Parts | 王小明 (avatar) | $2,450 | 🟡 Pending | 2 hours ago |
| Travel Expenses | 李小華 (avatar) | $890 | 🟢 Paid | Yesterday |
| Electronics Order | 張大偉 (avatar) | $1,200 | 🔵 Finance Review | 2 days ago |
| Team Shirts | 陳小美 (avatar) | $650 | 🟢 Paid | 3 days ago |
| Tools & Equipment | 林志明 (avatar) | $3,100 | 🟠 Returned | 1 week ago |

STATUS BADGES (pill shape, 6px radius):
- Draft: Gray bg #F1F5F9, text #64748B
- Pending Manager: Yellow bg #FEF3C7, text #B45309
- Pending Finance: Blue bg #DBEAFE, text #1D4ED8
- Paid: Green bg #D1FAE5, text #047857
- Returned: Orange bg #FFEDD5, text #C2410C
- Rejected: Red bg #FEE2E2, text #DC2626
```

---

## 📌 步驟 6：頂部導覽 (Header)

```
Design a dashboard header bar.

SIZE: Full width (1200px content area), 64px height
BACKGROUND: White #FFFFFF or transparent

LEFT SIDE:
- Page title: "Dashboard" - 24px, bold, #0F172A
- Subtitle: "Welcome back, 王小明" - 14px, #64748B

RIGHT SIDE:
- Notification bell icon with red badge (3)
- Language toggle: 繁中 | EN
- User section:
  - Avatar (40px circle)
  - Name: "王小明"
  - Role badge: "財務" (small pill, purple)
  - Dropdown arrow

STYLE:
- Bottom border: 1px #E2E8F0 (optional)
- Icons: 20px, #64748B, hover #0F172A
```

---

## 🎨 設計系統快速參考

### 顏色
```
Primary: #1E3A8A
Accent: #F97316
Background: #F8FAFC
Surface: #FFFFFF
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E2E8F0
```

### 間距
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

### 圓角
```
sm: 6px (badges, small buttons)
md: 8px (inputs, small cards)
lg: 12px (cards, containers)
xl: 16px (modals, large cards)
```

---

> 💡 **提示**：如果 Figma AI 生成的結果不滿意，可以：
> 1. 調整提示詞更具體
> 2. 分成更小的部分生成
> 3. 手動微調生成的設計
