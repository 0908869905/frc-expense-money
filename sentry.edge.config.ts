import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Edge runtime 取樣率
    tracesSampleRate: 0.1,
});
