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

        // ?∑Ë??™Ë??ØË™§?ïÁ?
        this.props.onError?.(error, errorInfo);

        // ?ôË£°?Ø‰ª•?ºÈÄÅÂà∞ Sentry ?ñÂÖ∂‰ªñÁõ£?ßÊ???
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
                            <div className="p-4 rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">
                            ?ºÁ??ØË™§
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Á≥ªÁµ±?ºÁ?‰∫Ü‰?‰∫õÂ?È°åÔ?Ë´ãÂ?Ë©¶È??∞Êï¥?ÜÈ??¢Ê?ËøîÂ?È¶ñÈ???
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mb-6 text-left bg-muted p-4 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium">
                                    ?ØË™§Ë©≥Ê? (?ãÁôºÊ®°Â?)
                                </summary>
                                <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap text-red-600">
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
                                ?çË©¶
                            </button>
                            <a
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                ËøîÂ?È¶ñÈ?
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// ?¢Á??êÁ§∫ÁµÑ‰ª∂
export function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-yellow-950 rounded-full shadow-lg">
                <div className="h-2 w-2 rounded-full bg-yellow-950 animate-pulse" />
                <span className="text-sm font-medium">
                    ?®ÁõÆ?çÈõ¢Á∑öÔ??®Â??üËÉΩ?ØËÉΩ?°Ê?‰ΩøÁî®
                </span>
            </div>
        </div>
    );
}

// ?âÁ®ø?¢Âæ©?êÁ§∫ÁµÑ‰ª∂
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
                <p className="font-medium mb-2">?ºÁèæ?™ÂÑ≤Â≠òÁ??âÁ®ø</p>
                <p className="text-sm text-muted-foreground mb-4">
                    Á≥ªÁµ±?µÊ∏¨?∞ÊÇ®‰∏äÊ¨°Á∑®ËºØ?ÑÂÖßÂÆπÂ??™ÂÑ≤Â≠òÔ??ØÂê¶Ë¶ÅÊÅ¢Âæ©Ô?
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onRestore}
                        className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                    >
                        ?¢Âæ©?âÁ®ø
                    </button>
                    <button
                        onClick={onDismiss}
                        className="flex-1 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
                    >
                        ?®Ê?
                    </button>
                </div>
            </div>
        </div>
    );
}

