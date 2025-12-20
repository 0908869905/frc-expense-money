import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 在生產環境中啟用
    enabled: process.env.NODE_ENV === "production",

    // 伺服器端取樣率
    tracesSampleRate: 0.1,

    // 過濾掉常見的無害錯誤
    ignoreErrors: [
        "NEXT_NOT_FOUND",
        "NEXT_REDIRECT",
    ],
});
