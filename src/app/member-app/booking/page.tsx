import { getCurrentMember, getMemberBookings } from '@/app/actions/member_actions'
import { prisma } from '@/lib/db'
import { MemberBookingClient } from '@/components/member/MemberBookingClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MemberBookingPage() {
    // Hardcoded User "Suzuki" for demo
    // In production, get from auth session
    const email = 'suzuki@clover.com'

    const memberResult = await getCurrentMember(email)

    if (memberResult.error || !memberResult.member) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">{memberResult.error || '会員情報が見つかりません'}</p>
            </div>
        )
    }

    const member = memberResult.member
    const bookingsResult = await getMemberBookings(member.id)
    const bookings = bookingsResult.bookings || []

    // Fetch Tickets
    const ticketsResult = await getMemberTickets(member.id)
    const tickets = ticketsResult.tickets || []

    const serviceMenus = await prisma.serviceMenu.findMany({
        where: { isActive: true },
        orderBy: { duration: 'asc' }
    })

    return (
        <MemberBookingClient
            member={member}
            bookings={bookings.map(b => ({
                ...b,
                startTime: new Date(b.startTime),
                endTime: new Date(b.endTime)
            }))}
            tickets={tickets}
            serviceMenus={serviceMenus}
        />
    )
}
