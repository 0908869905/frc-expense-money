import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgetflow.app',
  appName: 'BudgetFlow',
  server: {
    // 正式站網域（project-money.vercel.app 屬於另一個舊 Vite 專案，勿使用）
    url: 'https://two-chi-74.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e1c1b', // 墨主題底色（和紙と墨）
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
    },
  },
};

export default config;
