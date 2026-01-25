/**
 * 類型聲明: @niccolocase/capacitor-barcode-scanner
 *
 * 此套件在 Capacitor 階段才會安裝，這裡提供類型聲明以避免編譯錯誤
 */
declare module "@niccolocase/capacitor-barcode-scanner" {
    export interface ScanResult {
        hasContent: boolean;
        content?: string;
    }

    export interface PermissionResult {
        granted: boolean;
        denied?: boolean;
        neverAsked?: boolean;
    }

    export interface PermissionOptions {
        force?: boolean;
    }

    export const BarcodeScanner: {
        checkPermission(options?: PermissionOptions): Promise<PermissionResult>;
        startScan(): Promise<ScanResult>;
        stopScan(): Promise<void>;
        prepare(): Promise<void>;
        hideBackground(): Promise<void>;
        showBackground(): Promise<void>;
    };
}
