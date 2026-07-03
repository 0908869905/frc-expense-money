"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo });

        // 執行自訂錯誤處理
        this.props.onError?.(error, errorInfo);

        // 這裡可以發送到 Sentry 或其他監控服務
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full border border-danger/30 bg-danger/10 text-danger">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">
                            發生錯誤
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            系統發生了一些問題，請嘗試重新整理頁面或返回首頁。
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mb-6 text-left bg-muted p-4 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium">
                                    錯誤詳情 (開發模式)
                                </summary>
                                <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap text-danger">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                重試
                            </button>
                            <a
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                返回首頁
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// 離線提示組件
export function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-warn/40 bg-card text-warn shadow-[0_8px_24px_rgb(0_0_0_/_0.25)]">
                <div className="status-dot bg-warn" />
                <span className="text-sm font-medium">
                    您目前離線，部分功能可能無法使用
                </span>
            </div>
        </div>
    );
}

// 草稿恢復提示組件
interface DraftRestorePromptProps {
    show: boolean;
    onRestore: () => void;
    onDismiss: () => void;
}

export function DraftRestorePrompt({ show, onRestore, onDismiss }: DraftRestorePromptProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-card border rounded-lg shadow-lg p-4 max-w-sm">
                <p className="font-medium mb-2">發現未儲存的草稿</p>
                <p className="text-sm text-muted-foreground mb-4">
                    系統偵測到您上次編輯的內容尚未儲存，是否要恢復？
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onRestore}
                        className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                    >
                        恢復草稿
                    </button>
                    <button
                        onClick={onDismiss}
                        className="flex-1 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
                    >
                        捨棄
                    </button>
                </div>
            </div>
        </div>
    );
}
