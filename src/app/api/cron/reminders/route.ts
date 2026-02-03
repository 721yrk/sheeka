import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendLineMessage } from '@/lib/line'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'

// This endpoint should be called by a Cron job (e.g. Vercel Cron) once a day, preferably in the evening (e.g., 19:00 JST) 
// to remind users of their bookings for *TOMORROW*.

export async function GET(req: NextRequest) {
    try {
        // Check for Cron Secret if deployed (optional security)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new Response('Unauthorized', { status: 401 });
        // }

        // Logic: Find bookings for TOMORROW
        const now = new Date()
        const tomorrow = addDays(now, 1)

        const startOfTomorrow = startOfDay(tomorrow)
        const endOfTomorrow = endOfDay(tomorrow)

        console.log(`[Cron] Fetching bookings between ${startOfTomorrow} and ${endOfTomorrow}`)

        const bookings = await prisma.booking.findMany({
            where: {
                startTime: {
                    gte: startOfTomorrow,
                    lte: endOfTomorrow
                },
                status: 'confirmed'
            },
            include: {
                member: {
                    include: { user: true }
                },
                serviceMenu: true,
                staff: true
            }
        })

        console.log(`[Cron] Found ${bookings.length} confirmed bookings for tomorrow`)

        let sentCount = 0
        const results = []

        for (const booking of bookings) {
            const lineUserId = booking.member?.user?.lineUserId
            if (lineUserId) {
                const dateStr = format(booking.startTime, 'H:mm')
                const menuName = booking.serviceMenu?.name || 'ご予約'
                const staffName = booking.staff.name

                const message = `🌟 明日のご予約リマインド 🌟\n\n明日 ${dateStr} より、以下のご予約を承っております。\n\n📋 内容: ${menuName}\n👤 担当: ${staffName}\n\nご来店をお待ちしております！`

                const sent = await sendLineMessage(lineUserId, message)
                if (sent) {
                    sentCount++
                    results.push({ id: booking.id, recipient: booking.member.name, status: 'sent' })
                } else {
                    results.push({ id: booking.id, recipient: booking.member.name, status: 'failed' })
                }
            } else {
                results.push({ id: booking.id, recipient: booking.member.name, status: 'no_line_id' })
            }
        }

        return NextResponse.json({
            success: true,
            processed: bookings.length,
            sent: sentCount,
            details: results
        })

    } catch (error) {
        console.error('Error in reminder cron:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
