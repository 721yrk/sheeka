'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Loader2, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BOOKING_TYPES, DEFAULT_BOOKING_TYPE } from '@/lib/constants'

interface BookingConfirmModalProps {
    open: boolean
    onClose: () => void
    bookingData: {
        date: Date
        time: Date
        staffId: string
        staffName: string
        duration: number
        menuName?: string
    } | null
    isOverLimit: boolean
    extraFee: number
    onConfirm: (notes?: string, type?: string) => Promise<void>
    isSubmitting: boolean
    memberPlanId: string
}

export function BookingConfirmModal({
    open,
    onClose,
    bookingData,
    isOverLimit,
    extraFee,
    onConfirm,
    isSubmitting,
    memberPlanId
}: BookingConfirmModalProps) {
    const [notes, setNotes] = useState('')
    const [type, setType] = useState<string>(DEFAULT_BOOKING_TYPE)

    if (!bookingData) return null

    const handleConfirm = async () => {
        await onConfirm(notes, type)
        setNotes('')
        setType(DEFAULT_BOOKING_TYPE)
    }

    // プランに応じた予約タイプの表示制限
    const availableBookingTypes = Object.values(BOOKING_TYPES).filter(t => {
        const isMember = memberPlanId === 'PREMIUM' || memberPlanId === 'STANDARD'

        // 通常予約は全員OK
        if (t.id === 'REGULAR') return true

        // 追加セッション、振替はメンバーのみ
        if (['ADDITIONAL', 'TRANSFER_MEMBER', 'TRANSFER_STORE'].includes(t.id)) {
            return isMember
        }

        // 体験などは表示しない（あるいは必要に応じて）
        // 今回の指示では「メンバー枠のひとはメンバー枠と追加セッションと振替だけがでるように」なので
        // 他のプランの人についての指示はないが、REGULARのみ安牌
        return false
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>予約の確認</DialogTitle>
                    <DialogDescription>
                        以下の内容で予約を確定しますか？
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">日時</span>
                            <span className="font-bold">
                                {format(bookingData.date, 'M月d日(E)', { locale: ja })} {format(bookingData.time, 'H:mm')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">担当</span>
                            <span className="font-bold">{bookingData.staffName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">時間</span>
                            <span className="font-bold">{bookingData.duration}分</span>
                        </div>
                        {bookingData.menuName && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">メニュー</span>
                                <span className="font-bold">{bookingData.menuName}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>予約の種類</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableBookingTypes.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isOverLimit && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                今月の契約回数に達しています。<br />
                                追加セッションの場合は別途料金が発生します。
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>メモ（任意）</Label>
                        <Textarea
                            placeholder="体調や要望などあればご記入ください"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        キャンセル
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                予約中...
                            </>
                        ) : (
                            '予約を確定する'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
