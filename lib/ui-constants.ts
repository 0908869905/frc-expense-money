// Shared UI style constants for consistent button and input styling

export const BUTTON_PRIMARY =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50";

export const BUTTON_MUTED =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm font-medium disabled:opacity-50";

export const BUTTON_DESTRUCTIVE =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium disabled:opacity-50";

// Compact variants for icon-only or small action buttons
export const BUTTON_MUTED_SM =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm disabled:opacity-50";

export const BUTTON_DESTRUCTIVE_SM =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm disabled:opacity-50";

export const INPUT_CLASS =
    "w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
