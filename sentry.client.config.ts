import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 在生產環境中啟用
    enabled: process.env.NODE_ENV === "production",

    // 取樣率 - 調整以控制發送的事件數量
    tracesSampleRate: 0.1, // 10% 的交易會被追蹤

    // 設定 debug 模式（開發時開啟）
    debug: false,

    // 過濾掉常見的無害錯誤
    ignoreErrors: [
        // 網路相關
        "Network request failed",
        "Failed to fetch",
        "Load failed",
        // 使用者中斷
        "AbortError",
        // 瀏覽器擴充套件
        "chrome-extension://",
        "moz-extension://",
    ],

    // 在發送事件前處理
    beforeSend(event, hint) {
        // 過濾掉開發環境的錯誤
        if (process.env.NODE_ENV === "development") {
            return null;
        }
        return event;
    },
});
