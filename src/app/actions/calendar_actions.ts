'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Get all active staff
export async function getStaffList() {
    return await prisma.staff.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    })
}

// Get all members for dropdown
export async function getMembersList() {
    return await prisma.member.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            rank: true
        },
        orderBy: { name: 'asc' }
    })
}

// Get bookings for a specific date
export async function getBookingsForDate(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return await prisma.booking.findMany({
        where: {
            startTime: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: {
                not: 'cancelled'
            }
        },
        include: {
            member: {
                select: {
                    id: true,
                    name: true,
                    rank: true
                }
            },
            staff: {
                select: {
                    id: true,
                    name: true,
                    color: true
                }
            }
        },
        orderBy: { startTime: 'asc' }
    })
}

// Create a new booking with concurrent check
export async function createBooking(data: {
    memberId: string
    staffId: string // Must specify staff
    serviceMenuId: string
    startTime: Date
    notes?: string
}) {
    // 1. Fetch Menu for duration
    const menu = await prisma.serviceMenu.findUnique({ where: { id: data.serviceMenuId } })
    if (!menu) throw new Error('メニューが見つかりません')

    const endTime = new Date(data.startTime.getTime() + menu.duration * 60000)

    // 2. Fetch Staff Logic
    const staff = await prisma.staff.findUnique({
        where: { id: data.staffId },
        include: { shifts: true, shiftOverrides: true }
    })
    if (!staff) throw new Error('スタッフが見つかりません')

    // 3. Strict Check: Is this slot valid? (Re-use logic or simplified check)
    // Check Overlaps
    const overlapping = await prisma.booking.findMany({
        where: {
            staffId: data.staffId,
            status: { not: 'cancelled' },
            startTime: { lt: endTime },
            endTime: { gt: data.startTime }
        }
    })

    if (overlapping.length >= staff.maxConcurrentBookings) {
        throw new Error('この時間帯は満枠です')
    }

    // NEW: Digital Prepaid Logic
    const member = await prisma.member.findUnique({ where: { id: data.memberId } })
    if (!member) throw new Error('メンバーが見つかりません')

    let paidFromPrepaid = 0

    if (member.plan === 'DIGITAL_PREPAID') {
        // Validation: Balance > 0
        if ((member.prepaidBalance || 0) <= 0) {
            throw new Error('プリカ残高が不足しています（残高0円）。チャージしてください。')
        }

        const price = staff.unitPrice || 0
        const currentBalance = member.prepaidBalance || 0

        // Calculate deduction
        // If balance >= price, deduct full price.
        // If balance < price, deduct all balance (partial payment).
        const deduction = Math.min(currentBalance, price)
        paidFromPrepaid = deduction

        // Update Member Balance
        await prisma.member.update({
            where: { id: member.id },
            data: { prepaidBalance: { decrement: deduction } }
        })

        // Note: The UI should handle showing the message "Please pay difference" 
        // We can't return a custom message easily here without changing the return type widely, 
        // but `createBooking` returns the booking object. 
        // The calling component can check `paidFromPrepaid` vs `staff.unitPrice` to show the toast.
    }

    // 4. Create
    const booking = await prisma.booking.create({
        data: {
            memberId: data.memberId,
            staffId: data.staffId,
            serviceMenuId: data.serviceMenuId,
            startTime: data.startTime,
            endTime: endTime,
            notes: data.notes,
            status: 'confirmed',
            paidFromPrepaid // Save how much was paid
        },
        include: {
            member: true,
            staff: true
        }
    })

    revalidatePath('/dashboard/calendar')
    return booking
}

// Update booking
export async function updateBooking(id: string, data: {
    startTime?: Date
    endTime?: Date
    notes?: string
    status?: string
}) {
    const booking = await prisma.booking.update({
        where: { id },
        data,
        include: {
            member: true,
            staff: true
        }
    })

    revalidatePath('/dashboard/calendar')
    return booking
}

// Cancel booking
export async function cancelBooking(id: string, reason: string = 'NORMAL') {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { member: true } // Need member to refund
    })

    if (!booking) {
        throw new Error('予約が見つかりません')
    }

    // Check if cancellation is more than 24 hours before the booking
    const now = new Date()
    const hoursUntilBooking = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // 24 hours or more before: 'cancelled' (refund)
    // Less than 24 hours: 'cancelled_late' (no refund unless valid reason)
    let status = 'cancelled'
    let shouldRefund = true

    if (hoursUntilBooking < 24) {
        status = 'cancelled_late'
        // Check valid reasons for late cancellation refund
        const validReasons = ['SICKNESS', 'BEREAVEMENT', '体調不良', '不幸ごと']
        if (validReasons.includes(reason)) {
            shouldRefund = true
        } else {
            shouldRefund = false
        }
    }

    // Process Refund if eligible and money was paid
    if (shouldRefund && (booking.paidFromPrepaid || 0) > 0) {
        await prisma.member.update({
            where: { id: booking.memberId },
            data: {
                prepaidBalance: { increment: booking.paidFromPrepaid }
            }
        })
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            status,
            cancellationReason: reason
        }
    })

    revalidatePath('/dashboard/calendar')
    return { booking: updatedBooking, status }
}

// Delete booking
export async function deleteBooking(id: string) {
    await prisma.booking.delete({
        where: { id }
    })

    revalidatePath('/dashboard/calendar')
}

// Get available time slots with advanced logic
export async function getAvailableSlots(date: Date, menuId: string, staffId?: string) {
    try {
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)

        // 1. Get Service Duration
        const menu = await prisma.serviceMenu.findUnique({ where: { id: menuId } })
        if (!menu) return { error: "メニューが見つかりません" }
        const durationRes = menu.duration

        // 2. Identify Target Staff
        // If staffId is provided, check only that staff. If not, check all potential staff.
        const targetStaff = staffId
            ? await prisma.staff.findMany({
                where: { id: staffId, isActive: true },
                include: { shifts: true, shiftOverrides: true }
            })
            : await prisma.staff.findMany({
                where: { isActive: true },
                include: { shifts: true, shiftOverrides: true }
            })

        if (targetStaff.length === 0) return { slots: [] }

        // 3. Get Existing Bookings for the Date
        const dayStart = new Date(checkDate)
        const dayEnd = new Date(checkDate)
        dayEnd.setHours(23, 59, 59, 999)

        const existingBookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: dayStart, lte: dayEnd },
                status: { not: 'cancelled' },
                staffId: { in: targetStaff.map(s => s.id) }
            }
        })

        // 4. Calculate Slots
        const slots: { time: string, staffIds: string[] }[] = []
        const dayOfWeek = checkDate.getDay() // 0=Sun

        // We'll scan from earliest possible start (e.g. 06:00) to latest (e.g. 23:00) 
        // or just strict 00:00 to 23:45 in 15min increments?
        // Let's do 08:00 to 22:00 for efficiency, or strictly based on shifts?
        // Safer to scan a standard business range, e.g. 08:00 - 23:00
        const startHour = 8
        const endHour = 22

        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += 15) {
                // Current Slot Start
                const slotStart = new Date(checkDate)
                slotStart.setHours(h, m, 0, 0)

                // Proposed Slot End
                const slotEnd = new Date(slotStart.getTime() + durationRes * 60000)

                // Check which staff are available for this specific slot
                const availableStaffIds: string[] = []

                for (const staff of targetStaff) {
                    // A. Check basic shift (Day of Week)
                    // Does staff have a shift today?
                    // Priority: Override -> Regular Shift
                    const override = staff.shiftOverrides.find(so => {
                        const d = new Date(so.date)
                        return d.getDate() === checkDate.getDate() &&
                            d.getMonth() === checkDate.getMonth() &&
                            d.getFullYear() === checkDate.getFullYear()
                    })

                    let shiftStartStr = ""
                    let shiftEndStr = ""

                    if (override) {
                        if (!override.startTime || !override.endTime) continue // Day off
                        shiftStartStr = override.startTime
                        shiftEndStr = override.endTime
                    } else {
                        const regularShift = staff.shifts.find(s => s.dayOfWeek === dayOfWeek && s.isActive)
                        if (!regularShift) continue // No shift today
                        shiftStartStr = regularShift.startTime
                        shiftEndStr = regularShift.endTime
                    }

                    // Convert shift strings "09:00" to Date objects for comparison
                    const [sH, sM] = shiftStartStr.split(':').map(Number)
                    const [eH, eM] = shiftEndStr.split(':').map(Number)

                    const shiftStart = new Date(checkDate)
                    shiftStart.setHours(sH, sM, 0, 0)

                    const shiftEnd = new Date(checkDate)
                    shiftEnd.setHours(eH, eM, 0, 0)

                    // Verify the Proposed Booking fits entirely within the Shift
                    if (slotStart < shiftStart || slotEnd > shiftEnd) continue

                    // B. Check Concurrent Limit (Capacity)
                    // We need to check if AT ANY POINT during the proposed booking, 
                    // the staff exceeds their concurrent limit.
                    // Instead of complex time series, let's check overlap with existing bookings.

                    // Filter bookings for this staff
                    const staffBookings = existingBookings.filter(b => b.staffId === staff.id)

                    // For the duration of the proposed slot, how many concurrent bookings are active?
                    // We need to check collisions. 
                    // A collision happens if (existing.Start < proposed.End) AND (existing.End > proposed.Start)
                    // We want to know the MAX concurrency at any point in this interval?
                    // Simplified approach: Count how many bookings overlap with the proposed interval.
                    // NOTE: This assumes bookings are roughly aligned. 
                    // To be strictly correct, we should check if *at any instant* the count >= max.
                    // But "Overlap Count" is a safe heuristic if max is usually 1 or 2.
                    // Let's refine: The number of existing bookings that overlap with the new slot 
                    // MUST BE LESS THAN maxConcurrentBookings.
                    // Wait, if max=2, and I have 1 booking 10:00-11:00.
                    // I want to book 10:30-11:30.
                    // The overlap is 1. So allowed.
                    // But what if I have Booking A (10:00-10:40) and Booking B (10:20-11:00).
                    // Overlap at 10:30 is 2.
                    // If I book 10:00-11:00, I overlap with both. 
                    // Logic: Find all overlapping bookings. 
                    // Then, we effectively need to verify that adding THIS booking doesn't spike concurrency > limit.

                    const overlapping = staffBookings.filter(b =>
                        b.startTime < slotEnd && b.endTime > slotStart
                    )

                    // Optimistic Check: If total overlapping count < limit, then safe.
                    // (Even if they don't overlap each other, worst case is they all overlap us)
                    if (overlapping.length < staff.maxConcurrentBookings) {
                        availableStaffIds.push(staff.id)
                    } else {
                        // Detailed Check? 
                        // If overlapping.length >= limit, we might still be okay if the overlapping ones don't overlap EACH OTHER simultaneously?
                        // Actually, for "Staff Type", usually slots are fixed or aligned.
                        // Let's stick to simple "Count of overlapping bookings must be < Limit".
                        // This assumes that if I have 2 slots, I can take 2 bookings that overlap ME.
                        // It avoids over-booking.
                    }
                }

                if (availableStaffIds.length > 0) {
                    slots.push({
                        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                        staffIds: availableStaffIds
                    })
                }
            }
        }

        return { slots, menuDuration: durationRes }

    } catch (error) {
        console.error('Error getting available slots:', error)
        return { error: '利用可能時間の取得に失敗しました' }
    }
}
