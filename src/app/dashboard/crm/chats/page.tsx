import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import ChatAutoRefresh from "@/components/crm/ChatAutoRefresh"

async function getChatUsers() {
    // 1. Get users who have messages, ordered by most recent message
    const recentMessages = await prisma.chatMessage.findMany({
        orderBy: { createdAt: 'desc' },
        distinct: ['userId'],
        select: { userId: true },
        take: 20
    });

    const recentUserIds = recentMessages.map(m => m.userId);

    // 2. Fetch those users
    const activeUsers = await prisma.user.findMany({
        where: { id: { in: recentUserIds } },
        include: {
            chats: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            _count: {
                select: {
                    chats: {
                        where: {
                            isRead: false,
                            sender: 'USER'
                        }
                    }
                }
            }
        }
    });

    // 3. Sort activeUsers manually to match the message order (findMany doesn't guarantee order of 'in' array)
    const userMap = new Map(activeUsers.map(u => [u.id, u]));
    const sortedActiveUsers = recentUserIds.map(id => userMap.get(id)).filter(u => u !== undefined) as typeof activeUsers;

    // 4. If less than 20 active users, fill with other LINE friends
    if (sortedActiveUsers.length < 20) {
        const otherFriends = await prisma.user.findMany({
            where: {
                isLineFriend: true,
                id: { notIn: recentUserIds }
            },
            take: 20 - sortedActiveUsers.length,
            orderBy: { createdAt: 'desc' },
            include: {
                chats: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: {
                        chats: {
                            where: { isRead: false, sender: 'USER' }
                        }
                    }
                }
            }
        });
        sortedActiveUsers.push(...otherFriends);
    }

    return sortedActiveUsers;
}

export default async function ChatListPage() {
    const users = await getChatUsers()

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">1:1チャット</h1>
                    <p className="text-slate-500 mt-2">LINE公式アカウントと連携したユーザーとの個別のやり取りが可能です。</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>メッセージ一覧</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                まだメッセージやり取りのあるユーザーはいません。
                            </div>
                        ) : (
                            users.map(user => (
                                <Link key={user.id} href={`/dashboard/crm/chats/${user.id}`} className="block hover:bg-slate-50 transition-colors">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border border-slate-200">
                                                <AvatarImage src={user.linePictureUrl || ""} />
                                                <AvatarFallback className="bg-slate-100 text-slate-400">
                                                    <UserIcon className="h-6 w-6" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                                                    {user.lineDisplayName && user.lineDisplayName !== user.name && (
                                                        <span className="text-xs text-[#06C755]">({user.lineDisplayName})</span>
                                                    )}
                                                    {user._count.chats > 0 && (
                                                        <Badge className="bg-red-500 hover:bg-red-600 h-5 px-1.5 text-[10px] min-w-[20px] justify-center">
                                                            {user._count.chats}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm text-slate-500 line-clamp-1 max-w-[300px]">
                                                        {user.chats[0]?.content || "メッセージなし"}
                                                    </p>
                                                    <span className="text-xs text-slate-400">
                                                        {user.chats[0] ? new Date(user.chats[0].createdAt).toLocaleDateString() : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
            <ChatAutoRefresh />
        </div>
    )
}
