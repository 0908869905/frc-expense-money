import { handlers } from "@/auth"

// 強制使用 Node.js runtime（bcryptjs 不支援 Edge runtime）
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const { GET, POST } = handlers