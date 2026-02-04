import { prisma } from "@/lib/db"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import ChatInput from "@/components/crm/ChatInput"
import { Badge } from "@/components/ui/badge"

async function getChatHistory(userId: string) {
    return await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
    })
}

async function getUser(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId }
    })
}

export default async function ChatPage({ params }: { params: { userId: string } }) {
    const user = await getUser(params.userId)
    const messages = await getChatHistory(params.userId)

    if (!user) return <div>User not found</div>

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-white">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white z-10">
                <Link href="/dashboard/crm/chats">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.linePictureUrl || ""} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-bold text-slate-800 flex items-center gap-2">
                            {user.name}
                            {user.lineDisplayName && <span className="text-xs font-normal text-slate-500">({user.lineDisplayName})</span>}
                        </h1>
                        <div className="flex items-center gap-2">
                            {user.isLineFriend ? (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-50 text-green-700 border-green-200">友だち</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-slate-100 text-slate-500">未連携</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-50">
                <div className="space-y-4 max-w-3xl mx-auto pb-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 py-10 text-sm">
                            メッセージ履歴がありません
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[70%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap
                                ${msg.sender === 'ADMIN'
                                    ? 'bg-[#06C755] text-white rounded-tr-none'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                                }
                            `}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-400 self-end ml-1 mb-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="max-w-3xl mx-auto">
                    <ChatInput userId={user.id} />
                </div>
            </div>
        </div>
    )
}
