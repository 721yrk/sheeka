
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Calendar, Tag as TagIcon, Settings, Menu } from "lucide-react"
import ProfileEditModal from "@/components/crm/ProfileEditModal"

// This page shows detailed CRM info for a single member
export default async function MemberDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const member = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            tags: true,
            richMenu: true,
            memberProfile: true,
            attributeValues: {
                include: { attribute: true } // Custom Attributes
            },
            chats: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    })

    if (!member) {
        return <div>Member not found</div>
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header / Profile Summary */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
                        <AvatarImage src="" /> {/* LINE Icon URL if we had it */}
                        <AvatarFallback className="bg-slate-200 text-2xl">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-slate-800 font-serif">{member.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">{member.email}</span>
                            {member.lineUserId && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    LINE連携済
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-2 pt-2">
                            {member.tags.map(tag => (
                                <Badge key={tag.id} className="bg-blue-50 text-blue-700 border-blue-200">
                                    {tag.name}
                                </Badge>
                            ))}
                            <Button variant="outline" size="sm" className="h-6 text-xs dashed border-slate-300 text-slate-400">
                                <TagIcon className="w-3 h-3 mr-1" />
                                タグ追加
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Menu className="w-4 h-4 mr-2" />
                        リッチメニュー変更
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        チャットを開く
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-8">
                {/* Left Column: Basic Info & Custom Attributes */}
                <div className="col-span-2 space-y-6">
                    <Tabs defaultValue="attributes">
                        <TabsList>
                            <TabsTrigger value="attributes">顧客情報・属性</TabsTrigger>
                            <TabsTrigger value="history">行動履歴</TabsTrigger>
                            <TabsTrigger value="forms">フォーム回答</TabsTrigger>
                        </TabsList>

                        <TabsContent value="attributes" className="space-y-6 pt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>基本情報</CardTitle>
                                    <ProfileEditModal member={member} />
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 mb-1">名前</p>
                                        <p>{member.name}</p>
                                        {member.memberProfile?.kana && (
                                            <p className="text-xs text-slate-400">{member.memberProfile.kana}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">登録日 (入会日)</p>
                                        <div className="flex flex-col">
                                            <span>{new Date(member.createdAt).toLocaleDateString()} (System)</span>
                                            {member.memberProfile?.joinDate && (
                                                <span className="text-xs text-slate-400">
                                                    {new Date(member.memberProfile.joinDate).toLocaleDateString()} (入会)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">生年月日 / 性別</p>
                                        <p>
                                            {member.memberProfile?.dateOfBirth ? new Date(member.memberProfile.dateOfBirth).toLocaleDateString() : '-'}
                                            {' / '}
                                            {member.memberProfile?.gender === 'MALE' ? '男性' : member.memberProfile?.gender === 'FEMALE' ? '女性' : '不明'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">LINE ID</p>
                                        <p className="font-mono text-xs">{member.lineUserId || "未連携"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">プラン</p>
                                        <p>{member.memberProfile?.plan || "STANDARD"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">ランク</p>
                                        <p>{member.memberProfile?.rank || "REGULAR"}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>カスタム属性 (アンケート結果など)</CardTitle>
                                    <Button variant="ghost" size="sm">編集</Button>
                                </CardHeader>
                                <CardContent>
                                    {member.attributeValues.length > 0 ? (
                                        <div className="space-y-4">
                                            {member.attributeValues.map(attr => (
                                                <div key={attr.id} className="grid grid-cols-3 border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                                    <p className="text-slate-500 text-sm col-span-1">{attr.attribute.label}</p>
                                                    <p className="text-slate-800 text-sm col-span-2 font-medium">{attr.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm text-center py-4">
                                            登録された属性はありません
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-slate-500">履歴機能は準備中です...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Chat Preview / Quick Actions */}
                <div className="space-y-6">
                    <Card className="bg-slate-50/50 border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
                                直近のチャット
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {member.chats.length > 0 ? (
                                member.chats.map(chat => (
                                    <div key={chat.id} className={`text-sm p-3 rounded-lg ${chat.sender === 'ADMIN' ? 'bg-emerald-100 ml-4' : 'bg-white border mr-4'}`}>
                                        <p className="text-slate-800">{chat.content}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                                            {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-4">メッセージ履歴はありません</p>
                            )}
                            <Button className="w-full mt-2" variant="outline">すべて見る</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">アクティブ リッチメニュー</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-[2/1] bg-slate-100 rounded mb-3 overflow-hidden">
                                {member.richMenu?.imageUrl ? (
                                    <img src={member.richMenu.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                        {member.richMenu?.name || "デフォルト設定中"}
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                メニューを切り替える
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
