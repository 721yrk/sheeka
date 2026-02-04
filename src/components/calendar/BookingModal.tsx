'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBooking } from '@/app/actions/calendar_actions'
import { format } from 'date-fns'

interface BookingModalProps {
    open: boolean
    onClose: () => void
    staffId: string
    staffName: string
    startTime: Date
    members: Array<{ id: string; name: string; rank: string }>
    serviceMenus: Array<{ id: string; name: string; duration: number; price: number }>
}

export function BookingModal({
    open,
    onClose,
    staffId,
    staffName,
    startTime,
    members,
    serviceMenus
}: BookingModalProps) {
    const [selectedMemberId, setSelectedMemberId] = useState('')
    const [selectedMenuId, setSelectedMenuId] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const selectedMenu = serviceMenus?.find(m => m.id === selectedMenuId)
    const endTime = selectedMenu
        ? new Date(startTime.getTime() + selectedMenu.duration * 60000)
        : null

    const handleSubmit = async () => {
        if (!selectedMemberId) {
            setError('顧客を選択してください')
            return
        }
        if (!selectedMenuId) {
            setError('メニューを選択してください')
            return
        }

        setLoading(true)
        setError('')

        try {
            const booking = await createBooking({
                memberId: selectedMemberId,
                staffId,
                serviceMenuId: selectedMenuId,
                startTime,
                notes: notes || undefined
            })

            // Check for Digital Prepaid Partial Payment
            // @ts-ignore - unitPrice might be missing from type definition until easy regeneration
            const unitPrice = booking.staff.unitPrice || 0
            // @ts-ignore
            const paid = booking.paidFromPrepaid || 0

            if (paid > 0 && paid < unitPrice) {
                const diff = unitPrice - paid
                alert(`【重要】プリカ残高不足のため一部のみ決済されました。\n差額 ${diff.toLocaleString()}円 を当日受付にてお支払いください。`)
            }

            // Reset and close
            setSelectedMemberId('')
            setSelectedMenuId('')
            setNotes('')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : '予約の作成に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>新規予約登録</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Staff & Time Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-500">担当スタッフ</Label>
                            <div className="mt-1 font-medium text-sm">
                                {staffName}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500">開始日時</Label>
                            <div className="mt-1 font-medium text-sm">
                                {format(startTime, 'yyyy/MM/dd HH:mm')}
                            </div>
                        </div>
                    </div>

                    {/* Member Selection */}
                    <div>
                        <Label className="text-sm font-bold text-slate-700">顧客 <span className="text-red-500">*</span></Label>
                        <select
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">顧客を選択してください</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name} ({member.rank})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service Menu Selection */}
                    <div>
                        <Label className="text-sm font-bold text-slate-700">メニュー <span className="text-red-500">*</span></Label>
                        <select
                            value={selectedMenuId}
                            onChange={(e) => setSelectedMenuId(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">メニューを選択してください</option>
                            {serviceMenus?.map(menu => (
                                <option key={menu.id} value={menu.id}>
                                    {menu.name} ({menu.duration}分)
                                </option>
                            ))}
                        </select>
                        {endTime && (
                            <p className="text-xs text-slate-500 mt-1 text-right">
                                終了予定: {format(endTime, 'HH:mm')}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <Label className="text-sm font-bold text-slate-700">備考（任意）</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="要望やメモなど"
                            className="mt-1 min-h-[80px] text-sm"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                            ⚠️ <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading ? '処理中...' : '予約を確定する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
