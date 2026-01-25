/**
 * Capacitor 原生掃描器封裝
 *
 * 當 App 在 Capacitor 環境中執行時，會調用原生相機掃描 QR Code
 * 若不在原生環境，則返回 null，讓 UI 顯示手動輸入介面
 */

// 定義 Capacitor 全域物件的類型
declare global {
    interface Window {
        Capacitor?: {
            isNativePlatform?: () => boolean;
        };
    }
}

/**
 * 檢查是否在 Capacitor 原生環境中
 */
export function isNativeApp(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.Capacitor?.isNativePlatform?.());
}

/**
 * 掃描 QR Code
 *
 * 在 Capacitor 原生環境中會調用原生相機
 * 在網頁環境中返回 null
 *
 * @returns 掃描到的字串或 null
 */
export async function scanQRCode(): Promise<string | null> {
    if (!isNativeApp()) {
        console.log("非原生環境，無法使用相機掃描");
        return null;
    }

    try {
        // 動態載入 BarcodeScanner
        // 注意：這個套件需要在 Capacitor 環境中才能正常運作
        const { BarcodeScanner } = await import("@niccolocase/capacitor-barcode-scanner");

        // 檢查權限
        const permission = await BarcodeScanner.checkPermission({ force: true });

        if (!permission.granted) {
            console.error("相機權限未授予");
            return null;
        }

        // 開始掃描
        const result = await BarcodeScanner.startScan();

        if (result.hasContent && result.content) {
            return result.content;
        }

        return null;
    } catch (error) {
        console.error("掃描失敗:", error);
        return null;
    }
}

/**
 * 停止掃描
 */
export async function stopScanning(): Promise<void> {
    if (!isNativeApp()) return;

    try {
        const { BarcodeScanner } = await import("@niccolocase/capacitor-barcode-scanner");
        await BarcodeScanner.stopScan();
    } catch (error) {
        console.error("停止掃描失敗:", error);
    }
}
