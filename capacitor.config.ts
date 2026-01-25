import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor 配置
 *
 * 使用方式（二選一）：
 *
 * 1. WebView 模式（推薦，保留所有功能）：
 *    - 設定 server.url 指向你的線上伺服器
 *    - App 會在 WebView 中載入網頁版，原生掃描功能依然可用
 *
 * 2. 靜態模式（離線使用）：
 *    - 移除 server 設定
 *    - 需要修改 next.config.js 加入 output: 'export'
 *    - 需要將所有 Server Actions 改成 API Routes
 *    - 執行 npm run build 後，npx cap sync
 */

const config: CapacitorConfig = {
    appId: "com.frc.money",
    appName: "FRC報帳",
    webDir: "out", // 靜態匯出目錄（僅靜態模式使用）

    // WebView 模式：連接到線上伺服器
    // 取消下方註解並填入你的伺服器 URL
    // server: {
    //     url: "https://your-app-url.vercel.app",
    //     cleartext: true,
    // },

    plugins: {
        // iOS 相機權限說明
        // 會顯示在權限請求對話框中
    },

    ios: {
        // iOS 專屬設定
        contentInset: "automatic",
    },
};

export default config;
