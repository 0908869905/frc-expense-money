// Shared UI style constants for consistent button and input styling
// 工程帳冊 v2：實色主按鈕、hairline 次按鈕、無漸層無光暈（docs/redesign/DESIGN_SYSTEM.md）

export const BUTTON_PRIMARY =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const BUTTON_MUTED =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const BUTTON_DESTRUCTIVE =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Compact variants for icon-only or small action buttons
export const BUTTON_MUTED_SM =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors text-sm disabled:opacity-50";

export const BUTTON_DESTRUCTIVE_SM =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors text-sm disabled:opacity-50";

export const INPUT_CLASS =
    "w-full px-3 py-2 rounded-md border border-input bg-card text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

// 狀態點 + mono 標籤（取代大色塊藥丸）— 搭配 text-ok/text-warn/text-danger/text-info 使用
export const STATUS_DOT_LABEL =
    "inline-flex items-center gap-1.5 font-mono text-xs font-medium";
