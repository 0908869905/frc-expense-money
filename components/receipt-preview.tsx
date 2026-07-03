"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Image as ImageIcon } from "lucide-react"

interface ReceiptPreviewProps {
  src: string
  alt?: string
  size?: "sm" | "md"
}

const SIZE_CLASSES: Record<NonNullable<ReceiptPreviewProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
}

const SAFE_DATA_PREFIXES = ["data:image/jpeg", "data:image/png", "data:image/webp", "data:image/gif"]

function isDisplayableImageSrc(src: string): boolean {
  if (src.startsWith("data:")) {
    return SAFE_DATA_PREFIXES.some(prefix => src.startsWith(prefix))
  }
  return src.startsWith("https://") || src.startsWith("/")
}

export function ReceiptPreview({ src, alt = "收據", size = "sm" }: ReceiptPreviewProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${SIZE_CLASSES[size]} rounded border border-border overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all`}
        title={`檢視${alt}`}
      >
        {isDisplayableImageSrc(src) ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-card border border-border p-1 shadow-md hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
