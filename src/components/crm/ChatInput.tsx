'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { sendLineMessageToUser } from "@/app/actions/line_actions"
import { useRouter } from "next/navigation"

export default function ChatInput({ userId }: { userId: string }) {
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const router = useRouter()

    const handleSend = async () => {
        if (!message.trim() || isSending) return

        setIsSending(true)
        try {
            const result = await sendLineMessageToUser(userId, message)
            if (result.success) {
                setMessage("")
                router.refresh() // Refresh server component to show new message
            } else {
                alert(result.error)
            }
        } catch (error) {
            console.error(error)
            alert('エラーが発生しました')
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend()
        }
    }

    return (
        <div className="flex items-end gap-2">
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力... (Cmd+Enterで送信)"
                className="min-h-[50px] resize-none focus-visible:ring-offset-0 focus-visible:ring-[#06C755]"
            />
            <Button
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="h-[50px] w-[50px] bg-[#06C755] hover:bg-[#05b34d] text-white flex-shrink-0"
            >
                <Send className="w-5 h-5" />
            </Button>
        </div>
    )
}
