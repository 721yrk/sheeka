'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Smile, Image as ImageIcon, Paperclip, X } from "lucide-react"
import { sendLineMessageToUser } from "@/app/actions/line_actions"
import { useRouter } from "next/navigation"

// Common LINE Stickers (Brown & Friends - Package 11537)
const STICKERS = [
    { id: '52002734', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002734/android/sticker.png' }, // OK
    { id: '52002735', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002735/android/sticker.png' }, // Thumbs up
    { id: '52002736', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002736/android/sticker.png' }, // Smile
    { id: '52002738', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002738/android/sticker.png' }, // Excited
    { id: '52002739', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002739/android/sticker.png' }, // Cry
    { id: '52002741', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002741/android/sticker.png' }, // Mad
    { id: '52002749', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002749/android/sticker.png' }, // Bow
    { id: '52002768', url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002768/android/sticker.png' }, // Welcome
];

export default function ChatInput({ userId }: { userId: string }) {
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [showStickers, setShowStickers] = useState(false)
    const router = useRouter()

    const handleSend = async () => {
        if (!message.trim() || isSending) return
        await doSend(message)
    }

    const doSend = async (content: string | any) => {
        setIsSending(true)
        setShowStickers(false)
        try {
            const result = await sendLineMessageToUser(userId, content)
            if (result.success) {
                setMessage("")
                router.refresh()
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

    const handleSendSticker = (stickerId: string) => {
        doSend({
            type: 'sticker',
            packageId: '11537',
            stickerId: stickerId
        })
    }

    const handleSendImage = () => {
        const url = window.prompt("画像のURLを入力してください (https://...)");
        if (url && url.startsWith('http')) {
            doSend({
                type: 'image',
                originalContentUrl: url,
                previewImageUrl: url
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend()
        }
    }

    return (
        <div className="relative">
            {/* Sticker Picker */}
            {showStickers && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-slate-200 shadow-lg rounded-lg p-3 grid grid-cols-4 gap-2 z-50">
                    <div className="col-span-4 flex justify-between items-center mb-1 text-xs text-slate-500">
                        <span>スタンプを選択</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowStickers(false)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                    {STICKERS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleSendSticker(s.id)}
                            className="hover:bg-slate-100 p-1 rounded transition-colors"
                        >
                            <img src={s.url} alt="sticker" className="w-full h-auto" />
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex gap-1 mb-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 text-slate-500 ${showStickers ? 'bg-slate-100 text-[#06C755]' : ''}`}
                        onClick={() => setShowStickers(!showStickers)}
                    >
                        <Smile className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-slate-500"
                        onClick={handleSendImage}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>
                </div>

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
        </div>
    )
}
