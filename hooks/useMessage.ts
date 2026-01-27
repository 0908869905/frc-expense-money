"use client"

import { useState, useCallback } from "react"

export type MessageType = "success" | "error"

export interface Message {
    type: MessageType
    text: string
}

/**
 * 管理通知訊息的 Hook
 * 提供顯示和自動隱藏訊息的功能
 */
export function useMessage(autoHideDelay = 3000): {
    message: Message | null
    showMessage: (type: MessageType, text: string) => void
    clearMessage: () => void
} {
    const [message, setMessage] = useState<Message | null>(null)

    const showMessage = useCallback((type: MessageType, text: string) => {
        setMessage({ type, text })
        if (autoHideDelay > 0) {
            setTimeout(() => setMessage(null), autoHideDelay)
        }
    }, [autoHideDelay])

    const clearMessage = useCallback(() => {
        setMessage(null)
    }, [])

    return { message, showMessage, clearMessage }
}
