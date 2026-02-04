
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMember } from "@/app/actions/members_add"
import { Plus } from "lucide-react"

export function MemberAddModal() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsPending(true)
        const res = await createMember(formData)
        setIsPending(false)
        if (res.success) {
            setOpen(false)
            alert("メンバーを追加しました")
        } else {
            alert("エラー: " + res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> 新規メンバー登録
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>新規メンバー登録</DialogTitle>
                        <DialogDescription>
                            新しい会員の情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">名前</Label>
                            <Input id="name" name="name" placeholder="山田 太郎" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email <span className="text-xs text-slate-400 font-normal">(任意)</span></Label>
                            <Input id="email" name="email" type="email" placeholder="taro@example.com" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="joinDate" className="text-right">入会日</Label>
                            <Input id="joinDate" name="joinDate" type="date" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right">プラン</Label>
                            <Select name="plan" defaultValue="STANDARD">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STANDARD">メンバー枠【スタンダード】</SelectItem>
                                    <SelectItem value="PREMIUM">メンバー枠【プレミアム】</SelectItem>
                                    <SelectItem value="DIGITAL_PREPAID">デジタルプリカ</SelectItem>
                                    <SelectItem value="TICKET">回数券</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contractedSessions" className="text-right">回数/月</Label>
                            <Input id="contractedSessions" name="contractedSessions" type="number" defaultValue="4" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>登録する</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
