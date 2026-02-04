'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Clock, User, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cancelBooking } from '@/app/actions/calendar_actions'
import { useRouter } from 'next/navigation'

interface Member {
    id: string
    name: string
    rank: string
}

interface Staff {
    id: string
    name: string
    color: string
}

interface Booking {
    id: string
    startTime: Date
    endTime: Date
    member: Member
    staff: Staff
    notes: string | null
}

interface BookingDetailModalProps {
    booking: Booking
    open: boolean
    onClose: () => void
}

export function BookingDetailModal({ booking, open, onClose }: BookingDetailModalProps) {
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancelReason, setCancelReason] = useState('NORMAL')
    const router = useRouter()

    if (!open) return null

    const handleCancel = async () => {
        if (!confirm(`${booking.member.name}様の予約をキャンセルしますか？\n理由: ${getReasonLabel(cancelReason)}`)) return

        setIsCancelling(true)
        try {
            await cancelBooking(booking.id, cancelReason)
            router.refresh()
            onClose()
        } catch (error) {
            console.error('Error cancelling booking:', error)
            alert('予約のキャンセルに失敗しました')
        } finally {
            setIsCancelling(false)
        }
    }

    const getReasonLabel = (r: string) => {
        switch (r) {
            case 'NORMAL': return '通常キャンセル'
            case 'SICKNESS': return '体調不良'
            case 'BEREAVEMENT': return '忌引・不幸ごと'
            case 'OTHER': return 'その他'
            default: return r
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-bold text-slate-800">予約詳細</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Member Info */}
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: booking.staff.color }}
                        >
                            {booking.member.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{booking.member.name}様</div>
                            <div className="text-xs text-slate-500">{booking.member.rank}</div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                                {format(booking.startTime, 'yyyy年M月d日 (E)', { locale: ja })}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>
                                {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <User className="w-4 h-4 text-blue-500" />
                            <span>{booking.staff.name}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div>
                            <div className="text-xs font-bold text-slate-600 mb-1">メモ</div>
                            <div className="bg-amber-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap">
                                {booking.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        閉じる
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex-1 gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isCancelling ? 'キャンセル中...' : '予約をキャンセル'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
