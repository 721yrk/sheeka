'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateMemberProfile } from "@/app/actions/member_profile_actions" // Action to create
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

interface ProfileEditModalProps {
    member: any // Type as any for now to avoid complexity, ideally proper Prisma type
}

export default function ProfileEditModal({ member }: ProfileEditModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: member.name || "",
        kana: member.memberProfile?.kana || "",
        gender: member.memberProfile?.gender || "UNKNOWN",
        dateOfBirth: member.memberProfile?.dateOfBirth ? new Date(member.memberProfile.dateOfBirth).toISOString().split('T')[0] : "",
        joinDate: member.memberProfile?.joinDate ? new Date(member.memberProfile.joinDate).toISOString().split('T')[0] : "",
    })

    // Reset form when modal opens to ensure fresh data
    useEffect(() => {
        if (open) {
            setFormData({
                name: member.name || "",
                kana: member.memberProfile?.kana || "",
                gender: member.memberProfile?.gender || "UNKNOWN",
                dateOfBirth: member.memberProfile?.dateOfBirth ? new Date(member.memberProfile.dateOfBirth).toISOString().split('T')[0] : "",
                joinDate: member.memberProfile?.joinDate ? new Date(member.memberProfile.joinDate).toISOString().split('T')[0] : "",
            })
        }
    }, [open, member])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const formDataToSend = new FormData()
            // Determine userId: if member.userId exists (Member resource), use it. Otherwise assume member.id is userId (User resource).
            const targetUserId = member.userId || member.id
            formDataToSend.append('userId', targetUserId)
            formDataToSend.append('name', formData.name)
            formDataToSend.append('kana', formData.kana)
            formDataToSend.append('gender', formData.gender)
            formDataToSend.append('dateOfBirth', formData.dateOfBirth)
            formDataToSend.append('joinDate', formData.joinDate)

            const result = await updateMemberProfile(formDataToSend)

            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                alert(result.error || "保存に失敗しました")
            }
        } catch (error) {
            console.error(error)
            alert("エラーが発生しました")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="w-3 h-3 mr-1" />
                    編集
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>基本情報を編集</DialogTitle>
                    <DialogDescription>
                        メンバーの基本プロフィールを変更します。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            名前
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kana" className="text-right">
                            ふりがな
                        </Label>
                        <Input
                            id="kana"
                            value={formData.kana}
                            onChange={(e) => setFormData({ ...formData, kana: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">
                            性別
                        </Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(val) => setFormData({ ...formData, gender: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="性別を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">男性</SelectItem>
                                <SelectItem value="FEMALE">女性</SelectItem>
                                <SelectItem value="UNKNOWN">回答しない/不明</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">
                            生年月日
                        </Label>
                        <Input
                            id="dob"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="joinDate" className="text-right">
                            入会日
                        </Label>
                        <Input
                            id="joinDate"
                            type="date"
                            value={formData.joinDate}
                            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        キャンセル
                    </Button>
                    <Button type="submit" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "保存中..." : "保存する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
