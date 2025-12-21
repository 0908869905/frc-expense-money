"use client"

import { useState, useEffect, useTransition } from "react"
import { Bell, Check, X, ExternalLink } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    link: string | null
    isRead: boolean
    createdAt: Date
}

export function NotificationBell() {
    const { language } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState(false)

    const unreadCount = notifications.filter(n => !n.isRead).length

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            const data = await getMyNotifications()
            if (Array.isArray(data)) {
                setNotifications(data as Notification[])
            } else {
                setNotifications([])
            }
            setError(false)
        } catch (err) {
            console.error("Failed to load notifications:", err)
            setNotifications([])
            setError(true)
        }
    }

    const handleMarkAsRead = async (id: string) => {
        startTransition(async () => {
            await markAsRead(id)
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ))
        })
    }

    const handleMarkAllAsRead = async () => {
        startTransition(async () => {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        })
    }

    const handleDelete = async (id: string) => {
        startTransition(async () => {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        })
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "SUCCESS": return "bg-green-100 text-green-700"
            case "WARNING": return "bg-yellow-100 text-yellow-700"
            case "ERROR": return "bg-red-100 text-red-700"
            default: return "bg-blue-100 text-blue-700"
        }
    }

    const formatTime = (date: Date) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))

        if (hours < 1) return language === "zh" ? "剛剛" : "Just now"
        if (hours < 24) return language === "zh" ? `${hours} 小時前` : `${hours}h ago`
        const days = Math.floor(hours / 24)
        return language === "zh" ? `${days} 天前` : `${days}d ago`
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                title={language === "zh" ? "通知" : "Notifications"}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border rounded-xl shadow-lg z-50 max-h-[70vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b">
                            <h3 className="font-semibold">
                                {language === "zh" ? "通知" : "Notifications"}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={isPending}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {language === "zh" ? "全部標為已讀" : "Mark all as read"}
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[calc(70vh-50px)]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    {language === "zh" ? "沒有通知" : "No notifications"}
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-b hover:bg-muted/50 transition-colors ${!notification.isRead ? "bg-primary/5" : ""}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs ${getTypeColor(notification.type)}`}>
                                                        {notification.type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-sm truncate">{notification.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        disabled={isPending}
                                                        className="p-1 rounded hover:bg-muted"
                                                        title={language === "zh" ? "標為已讀" : "Mark as read"}
                                                    >
                                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                                    </button>
                                                )}
                                                {notification.link && (
                                                    <a
                                                        href={notification.link}
                                                        className="p-1 rounded hover:bg-muted"
                                                        onClick={() => setIsOpen(false)}
                                                        title={language === "zh" ? "查看" : "View"}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    disabled={isPending}
                                                    className="p-1 rounded hover:bg-muted"
                                                    title={language === "zh" ? "刪除" : "Delete"}
                                                >
                                                    <X className="h-3.5 w-3.5 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
