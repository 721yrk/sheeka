'use client'

import { useState } from 'react'
import { format, isSameMonth, startOfDay, addDays } from 'date-fns'
import { Check, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { WeeklyBookingGrid } from '@/components/member/WeeklyBookingGrid'
import { BookingConfirmModal } from '@/components/member/BookingConfirmModal'
import { MyBookingsList } from '@/components/member/MyBookingsList'
import { createMemberBooking, cancelMemberBooking } from '@/app/actions/member_actions'
import { getAvailableSlots } from '@/app/actions/calendar_actions' // Use shared logic
import { Button } from '@/components/ui/button'

interface MemberProfile {
    id: string
    name: string
    rank: string
    contractedSessions: number
    mainTrainer: { name: string } | null
    plan?: string
}

interface Booking {
    id: string
    startTime: Date
    endTime: Date
    staff: {
        id: string
        name: string
        color: string
    }
    status: string
}

interface ServiceMenu {
    id: string
    name: string
    duration: number
    price: number
    description?: string | null
}

interface MemberBookingClientProps {
    member: MemberProfile
    bookings: Booking[]
    serviceMenus: ServiceMenu[]
}

export function MemberBookingClient({ member, bookings: initialBookings, serviceMenus }: MemberBookingClientProps) {
    const [selectedMenu, setSelectedMenu] = useState<ServiceMenu | null>(null)
    const [selectedDateTime, setSelectedDateTime] = useState<{ date: Date, time: string } | null>(null)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [bookings, setBookings] = useState(initialBookings)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Calculate usage
    const currentMonthBookings = bookings.filter(b =>
        b.status !== 'cancelled' && // 24時間前のキャンセルのみ除外（'cancelled_late'は含む）
        isSameMonth(new Date(b.startTime), new Date())
    )
    const usageCount = currentMonthBookings.length
    const contractLimit = member.contractedSessions
    const isOverLimit = usageCount >= contractLimit

    // 予約可能期限の計算
    // const plan = getPlanFromId(member.plan || 'STANDARD') // Client side doesn't have this func easily locally
    // Assume 60 days for now or pass from server.
    const maxAllowedDate = addDays(startOfDay(new Date()), 60)

    const handleSlotSelect = (date: Date, time: string) => {
        setSelectedDateTime({ date, time })
        setConfirmModalOpen(true)
    }

    const handleConfirmBooking = async (notes?: string) => {
        if (!selectedDateTime || !selectedMenu) return

        setIsSubmitting(true)
        try {
            // 選択された日時を組み合わせる
            const [hours, minutes] = selectedDateTime.time.split(':').map(Number)
            const startTime = new Date(selectedDateTime.date)
            startTime.setHours(hours, minutes, 0, 0)

            const result = await createMemberBooking({
                memberId: member.id,
                serviceMenuId: selectedMenu.id,
                startTime,
                notes: notes || '',
                // 指名があればここに渡す。今はシンプルに。
            })

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({
                    type: 'success',
                    text: result.message || '予約が完了しました'
                })
                setConfirmModalOpen(false)
                setSelectedDateTime(null)
                setSelectedMenu(null) // Reset menu to start over

                // Add booking to list if successful
                if (result.booking) {
                    setBookings(prev => [...prev, {
                        ...result.booking,
                        startTime: new Date(result.booking.startTime),
                        endTime: new Date(result.booking.endTime)
                    }])
                }

                // Scroll to top to show message
                window.scrollTo({ top: 0, behavior: 'smooth' })

                // Clear message after 5 seconds
                setTimeout(() => setMessage(null), 5000)
            }
        } catch (error) {
            console.error('Error creating booking:', error)
            setMessage({ type: 'error', text: '予約の作成に失敗しました' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelBooking = async (bookingId: string, reason?: string) => {
        try {
            const result = await cancelMemberBooking(bookingId, member.id, reason)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: result.message || '予約をキャンセルしました' })
                setBookings(prev => prev.filter(b => b.id !== bookingId))

                // Clear message after 5 seconds
                setTimeout(() => setMessage(null), 5000)
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            setMessage({ type: 'error', text: '予約のキャンセルに失敗しました' })
        }
    }

    return (
        <div className="bg-white min-h-screen pb-24">
            <header className="bg-white p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-lg">トレーニング予約</h1>
                    <div className="text-xs text-slate-500">
                        {member.name}様 ({member.rank})
                    </div>
                </div>
                {selectedMenu && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedMenu(null); setSelectedDateTime(null); }}
                        className="text-xs text-slate-500"
                    >
                        メニュー選択に戻る
                    </Button>
                )}
            </header>

            <div className="p-4 space-y-4">
                {/* Success/Error Message */}
                {message && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                        }`}>
                        {message.type === 'success' ? (
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        <div className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Status Card */}
                {!selectedMenu && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-600">今月の利用状況</span>
                            <span className={`text-sm font-bold ${isOverLimit ? 'text-orange-500' : 'text-blue-600'}`}>
                                {usageCount} / {contractLimit}回
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${isOverLimit ? 'bg-orange-400' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min((usageCount / contractLimit) * 100, 100)}%` }}
                            />
                        </div>
                        {isOverLimit && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                今月の契約回数に達しています。
                            </div>
                        )}
                    </div>
                )}

                {/* Main Flow */}
                {!selectedMenu ? (
                    <div className="space-y-4">
                        {/* My Bookings (Only show when not booking) */}
                        <div>
                            <h2 className="text-sm font-bold mb-3">現在の予約</h2>
                            <MyBookingsList bookings={bookings} onCancel={handleCancelBooking} />
                        </div>

                        {/* Menu Selection */}
                        <div>
                            <h2 className="text-sm font-bold mb-3">新規予約 - メニュー選択</h2>
                            <div className="grid gap-3">
                                {serviceMenus?.map(menu => (
                                    <button
                                        key={menu.id}
                                        onClick={() => setSelectedMenu(menu)}
                                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{menu.name}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{menu.duration}分</span>
                                                    {menu.price > 0 && <span>¥{menu.price.toLocaleString()}</span>}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    </button>
                                ))}
                                {(!serviceMenus || serviceMenus.length === 0) && (
                                    <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
                                        予約可能なメニューがありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                            <div>
                                <div className="text-xs text-blue-600 font-bold">選択中のメニュー</div>
                                <div className="font-bold text-slate-800">{selectedMenu.name} ({selectedMenu.duration}分)</div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelectedMenu(null)}>変更</Button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                            {/* Pass fetch method or pre-fetched data? 
                                Ideally, WeeklyBookingGrid handles fetching availability internally or we pass a fetcher. 
                                Let's pass the menuId to WeeklyBookingGrid and let it fetch availability.
                            */}
                            <WeeklyBookingGrid
                                bookings={bookings} // For Reference? Actually we need Real Availability
                                // We need to refactor WeeklyBookingGrid to Async Fetch or similar.
                                // Or we fetch here. Fetching here is cleaner if we want to cache.
                                // But WeeklyBookingGrid handles "Week Change".
                                // Let's pass the selectedMenu to WeeklyBookingGrid and let it use a Server Action?
                                // Server Actions can be called from Client Components.
                                onSelectSlot={handleSlotSelect}
                                maxAllowedDate={maxAllowedDate}
                                serviceMenuId={selectedMenu.id} // NEW PROP
                                serviceDuration={selectedMenu.duration} // NEW PROP
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <BookingConfirmModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                bookingData={selectedDateTime && selectedMenu ? {
                    date: selectedDateTime.date,
                    time: (() => {
                        const [hours, minutes] = selectedDateTime.time.split(':').map(Number)
                        const d = new Date(selectedDateTime.date)
                        d.setHours(hours, minutes, 0, 0)
                        return d
                    })(),
                    staffId: '', // To be determined by backend
                    staffName: '担当者おまかせ',
                    duration: selectedMenu.duration,
                    menuName: selectedMenu.name
                } : null}
                isOverLimit={isOverLimit}
                extraFee={0} // No extra fee logic for now
                onConfirm={handleConfirmBooking}
                memberPlanId={member.plan || 'STANDARD'}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}
