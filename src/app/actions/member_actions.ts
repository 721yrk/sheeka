'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { startOfDay, startOfMonth, endOfMonth, isAfter, addDays, getDaysInMonth, addHours, isBefore, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MEMBER_PLANS, getPlanFromId } from '@/lib/constants'
import { sendLineMessage } from '@/lib/line' // Import LINE utils

// 会員情報を取得（仮：emailから）
export async function getCurrentMember(email: string) {
    try {
        const user = await prisma.user.findFirst({
            where: { email },
            include: {
                memberProfile: {
                    include: {
                        mainTrainer: true,
                        bookings: {
                            where: {
                                status: { not: 'cancelled' }
                            },
                            orderBy: {
                                startTime: 'asc'
                            }
                        }
                    }
                }
            }
        })

        if (!user || !user.memberProfile) {
            return { error: '会員情報が見つかりません' }
        }

        return { member: user.memberProfile }
    } catch (error) {
        console.error('Error fetching member:', error)
        return { error: '会員情報の取得に失敗しました' }
    }
}

// 会員の予約一覧を取得
export async function getMemberBookings(memberId: string) {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                memberId,
                status: {
                    notIn: ['CANCELLED', 'cancelled', 'cancelled_late']
                }
            },
            include: {
                staff: true,
                member: true
            },
            orderBy: {
                startTime: 'asc'
            }
        })

        return { bookings }
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return { error: '予約情報の取得に失敗しました' }
    }
}

// 会員の有効なチケットを取得
export async function getMemberTickets(memberId: string) {
    try {
        const tickets = await prisma.ticket.findMany({
            where: {
                memberId,
                isActive: true,
                remainingCount: { gt: 0 },
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gte: new Date() } }
                ]
            },
            orderBy: { expiryDate: 'asc' }
        })
        return { tickets }
    } catch (error) {
        console.error("Error fetching tickets:", error)
        return { tickets: [] }
    }
}

import { createBooking } from './calendar_actions' // Import core logic

// 会員が予約を作成
export async function createMemberBooking(data: {
    memberId: string
    serviceMenuId: string
    startTime: Date
    notes?: string
    targetStaffId?: string // Optional: if member nominates
}) {
    try {
        const { memberId, serviceMenuId, startTime, notes, targetStaffId } = data

        // 1. 会員情報・プラン制限チェック
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: {
                bookings: {
                    where: {
                        status: { notIn: ['cancelled', 'cancelled_late'] },
                        startTime: {
                            gte: new Date(startTime.getFullYear(), startTime.getMonth(), 1),
                            lt: new Date(startTime.getFullYear(), startTime.getMonth() + 1, 1)
                        }
                    }
                }
            }
        })

        if (!member) return { error: '会員が見つかりません' }

        // プラン制限 (日数)
        const plan = getPlanFromId(member.plan || 'STANDARD')
        const maxAllowedDate = addDays(startOfDay(new Date()), plan.limitDays + 1)
        if (isAfter(startTime, maxAllowedDate)) {
            return { error: `現在のプランでは${plan.limitDays}日先までしか予約できません` }
        }

        // 24時間前ルール
        const minAllowedTime = addHours(new Date(), 24)
        if (isBefore(startTime, minAllowedTime)) {
            return { error: '予約は希望時間の24時間前までにお願いします' }
        }

        // 回数制限チェック
        let consumptionType = 'PLAN'
        let ticketToUse = null

        if (member.bookings.length >= member.contractedSessions) {
            // プラン上限到達 -> チケット確認
            // Find valid ticket
            const tickets = await prisma.ticket.findMany({
                where: {
                    memberId: member.id,
                    isActive: true,
                    remainingCount: { gt: 0 },
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gte: new Date() } }
                    ]
                },
                orderBy: { expiryDate: 'asc' } // Use nearest expiry first
            })

            if (tickets.length > 0) {
                consumptionType = 'TICKET'
                ticketToUse = tickets[0]
            } else {
                return { error: '今月の予約回数上限に達しており、有効なチケットもありません' }
            }
        }

        // 2. スタッフ割り当て (Staff Assignment)
        let staffIdToBook = targetStaffId

        if (!staffIdToBook) {
            // Find available staff for this slot
            // We need to check who is free.
            // Use getAvailableSlots logic internally or just duplicates?
            // Better to rely on the fact that the UI *should have* verified availability.
            // But we must lock it in.
            // Let's find ANY staff that fits.
            const menu = await prisma.serviceMenu.findUnique({ where: { id: serviceMenuId } })
            if (!menu) return { error: 'メニューが無効です' }

            // Fetch all active staff
            const allStaff = await prisma.staff.findMany({
                where: { isActive: true },
                include: { shifts: true, shiftOverrides: true }
            })

            // Proper check: Find first staff who can take this booking
            // Reuse createBooking's internal check? 
            // createBooking requires staffId.
            // We need to iterate and try? Or pre-calculate.

            // Quick check loop
            for (const staff of allStaff) {
                // Check if this staff can take it
                // Check Shift
                // Check Concurrent
                // If yes, assign and break
                // Check shift
                const duration = menu.duration
                const endTime = new Date(startTime.getTime() + duration * 60000)

                // Shift Check (Simplified for "Any Staff" assignment)
                // This logic duplication is risky. 
                // Ideally getAvailableSlots returns "Available Staff IDs".
                // UI should pass the staffId it found available, OR we pick one here.
                // For now, let's pick the "Main Trainer" if available, else any.
                // TODO: Refine this. For now, assume UI passes a valid staffId or we fail.
                // Actually, let's just error if no staffId (UI must select).
                // "指名なし" logic implies we pick.
            }

            // Fallback: If no targetStaffId, try Main Trainer?
            // If member has mainTrainer, try them first.
            // const mainStaffId = ...
            // For MVP, let's require UI to send a staffId (even if "Any", UI resolves it).
            // NO, UI "Any" means user doesn't care. Backend should assign to balance load.
            // Let's perform a search.
        }

        // Simple Strategy: If staffId is missing, fetch all staff and try to book first success.
        if (!staffIdToBook) {
            const allStaff = await prisma.staff.findMany({ where: { isActive: true } })
            for (const s of allStaff) {
                try {
                    // Try to create booking with this staff
                    // We need to catch error if full
                    const booking = await createBooking({
                        memberId,
                        staffId: s.id,
                        serviceMenuId,
                        startTime,
                        notes
                    })

                    revalidatePath('/member-app/booking')
                    return {
                        success: true,
                        message: '予約が完了しました',
                        booking
                    }
                } catch (e) {
                    // Continue to next staff
                    continue
                }
            }
            return { error: '申し訳ありません、空きスタッフが見つかりませんでした' }
        }

        // If staffId specified
        const booking = await createBooking({
            memberId,
            staffId: staffIdToBook,
            serviceMenuId,
            startTime,
            notes
        })

        // LINE Notification
        // 1. Get Member user to find LINE ID
        const notificationMember = await prisma.member.findUnique({
            where: { id: memberId },
            include: { user: true }
        })

        if (notificationMember?.user?.lineUserId) {
            const menuName = (await prisma.serviceMenu.findUnique({ where: { id: serviceMenuId } }))?.name || 'ご予約'
            const staff = await prisma.staff.findUnique({ where: { id: staffIdToBook } })

            const dateStr = format(startTime, 'M月d日(E) H:mm', { locale: ja })
            const message = `🌟 予約が完了しました 🌟\n\n📅 日時: ${dateStr}\n📋 メニュー: ${menuName}\n👤 担当: ${staff?.name || '指名なし'}\n\nご来店をお待ちしております！`

            await sendLineMessage(notificationMember.user.lineUserId, message)
        }

        revalidatePath('/member-app/booking')
        return { success: true, message: '予約が完了しました', booking }

    } catch (error) {
        console.error('Error creating booking:', error)
        return { error: error instanceof Error ? error.message : '予約の作成に失敗しました' }
    }
}

export async function getServiceMenus() {
    return await prisma.serviceMenu.findMany({
        where: { isActive: true },
        orderBy: { duration: 'asc' }
    })
}

// 会員が予約をキャンセル
export async function cancelMemberBooking(bookingId: string, memberId: string, reason?: string) {
    try {
        // 予約が会員のものか確認
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking || booking.memberId !== memberId) {
            return { error: '予約が見つかりません' }
        }

        if (booking.status === 'cancelled' || booking.status === 'cancelled_late') {
            return { error: 'この予約は既にキャンセルされています' }
        }

        // Check if cancellation is more than 24 hours before the booking
        const now = new Date()
        const hoursUntilBooking = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        // 24 hours or more before: 'cancelled' (not counted)
        // Less than 24 hours: 'cancelled_late' (counted)
        let status = hoursUntilBooking >= 24 ? 'cancelled' : 'cancelled_late'
        let isRelieved = false

        // 救済ロジック（24時間以内かつ特定理由の場合）
        if (status === 'cancelled_late' && (reason === 'SICKNESS' || reason === 'BEREAVEMENT')) {
            const startOfCurrentMonth = startOfMonth(now)
            const endOfCurrentMonth = endOfMonth(now)

            // 当月の救済履歴を確認（statusがcancelledかつ、対象理由のもの）
            const existingRelief = await prisma.booking.findFirst({
                where: {
                    memberId,
                    status: 'cancelled', // 救済されたものは消化なし
                    cancellationReason: {
                        in: ['SICKNESS', 'BEREAVEMENT'] // 体調不良または不幸ごと
                    },
                    updatedAt: { // キャンセル日時（簡易的に更新日時を使用）
                        gte: startOfCurrentMonth,
                        lte: endOfCurrentMonth
                    }
                }
            })

            // 今月まだ救済されていなければ救済
            if (!existingRelief) {
                status = 'cancelled'
                isRelieved = true
            }
        }

        // キャンセル
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status,
                cancellationReason: reason || (status === 'cancelled' ? 'NORMAL' : 'OTHER')
            }
        })

        revalidatePath('/member-app/booking')
        revalidatePath('/dashboard/calendar')

        let message = '予約をキャンセルしました'
        if (isRelieved) {
            message = '予約をキャンセルしました（今月1回目のため、特別にお振替可能としました）'
        } else if (status === 'cancelled_late') {
            message = '予約をキャンセルしました（24時間以内のため、1回分消化となります）'
        }

        // LINE Notification
        // 1. Get Member user to find LINE ID
        const notificationMember = await prisma.member.findUnique({
            where: { id: memberId },
            include: { user: true }
        })

        if (notificationMember?.user?.lineUserId) {
            const dateStr = format(booking.startTime, 'M月d日(E) H:mm', { locale: ja })
            const lineMsg = `🗑 予約をキャンセルしました\n\n📅 日時: ${dateStr}\n\nまたのご予約をお待ちしております。`
            await sendLineMessage(notificationMember.user.lineUserId, lineMsg)
        }

        return { message, status }
    } catch (error) {
        console.error('Error cancelling booking:', error)
        return { error: '予約のキャンセルに失敗しました' }
    }
}
