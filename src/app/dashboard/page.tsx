import DashboardClient from "@/components/dashboard/DashboardClient"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // 1. Fetch ALL Members with relations for calculation
    const allMembers = await prisma.member.findMany({
        where: { isActive: true },
        include: {
            mainTrainer: true,
            user: true,
        }
    })

    // 2. Fetch Bookings for Current Month
    const monthlyBookings = await prisma.booking.findMany({
        where: {
            startTime: { gte: currentMonthStart, lte: currentMonthEnd },
            status: { not: 'cancelled' }
        },
        include: {
            member: true
        }
    })

    // --- CALCULATIONS ---

    // A. Member Stats by Plan
    // Assuming 'plan' field stores: 'STANDARD', 'PREMIUM', 'DIGITAL_PREPAID', 'TICKET_ONLY'
    // If specific values aren't in DB yet, we categorize based on available data or defaults
    const memberStats = {
        total: allMembers.length,
        standard: allMembers.filter(m => m.plan === 'STANDARD').length,
        premium: allMembers.filter(m => m.plan === 'PREMIUM').length,
        digitalPrepaid: allMembers.filter(m => m.plan === 'DIGITAL_PREPAID').length,
        ticket: allMembers.filter(m => m.plan === 'TICKET_ONLY' || m.plan === 'TICKET').length,
    }

    // B. Demographics
    const genderData = [
        { name: '男性', value: allMembers.filter(m => m.gender === 'MALE').length, color: '#3b82f6' },
        { name: '女性', value: allMembers.filter(m => m.gender === 'FEMALE').length, color: '#ec4899' },
        { name: 'その他', value: allMembers.filter(m => !['MALE', 'FEMALE'].includes(m.gender)).length, color: '#94a3b8' },
    ]

    // Age Pyramid (10s to 80s)
    const ageGroups = {
        '10代': { male: 0, female: 0 },
        '20代': { male: 0, female: 0 },
        '30代': { male: 0, female: 0 },
        '40代': { male: 0, female: 0 },
        '50代': { male: 0, female: 0 },
        '60代': { male: 0, female: 0 },
        '70代': { male: 0, female: 0 },
        '80代': { male: 0, female: 0 },
    }

    allMembers.forEach(m => {
        const age = new Date().getFullYear() - new Date(m.dateOfBirth).getFullYear()
        let groupKey = ''
        if (age < 20) groupKey = '10代'
        else if (age < 30) groupKey = '20代'
        else if (age < 40) groupKey = '30代'
        else if (age < 50) groupKey = '40代'
        else if (age < 60) groupKey = '50代'
        else if (age < 70) groupKey = '60代'
        else if (age < 80) groupKey = '70代'
        else groupKey = '80代'

        if (m.gender === 'MALE') ageGroups[groupKey as keyof typeof ageGroups].male++
        else if (m.gender === 'FEMALE') ageGroups[groupKey as keyof typeof ageGroups].female++
    })

    const ageData = Object.entries(ageGroups).map(([age, counts]) => ({
        age,
        male: counts.male,
        female: counts.female // In chart, make one negative to create pyramid
    }))

    // C. Capacity Tracking (Yuji & Risa)
    // Find trainers by name or role. Hardcoding names for specific request.
    const MAX_CAPACITY = 60
    const yujiMembers = allMembers.filter(m =>
        m.mainTrainer?.name?.includes('Yuji') ||
        m.mainTrainer?.name?.includes('ゆうじ') ||
        m.mainTrainer?.name?.includes('夏井') ||
        m.mainTrainer?.name?.includes('優志')
    ).length

    const risaMembers = allMembers.filter(m =>
        m.mainTrainer?.name?.includes('Risa') ||
        m.mainTrainer?.name?.includes('りさ') ||
        m.mainTrainer?.name?.includes('RISA')
    ).length

    const capacityData = [
        { name: 'YUJI', current: yujiMembers, max: MAX_CAPACITY },
        { name: 'RISA', current: risaMembers, max: MAX_CAPACITY },
    ]

    // D. Financials
    // Estimated Prices
    const PRICE_STANDARD = 11000
    const PRICE_PREMIUM = 22000
    const PRICE_TICKET = 5000 // Avg per active ticket user month? Or 0 if one-off.

    // Monthly Sales Forecast (Recurring)
    const monthlySalesForecast =
        (memberStats.standard * PRICE_STANDARD) +
        (memberStats.premium * PRICE_PREMIUM) +
        (memberStats.digitalPrepaid * 15000) // Dummy avg
    // Ticket sales are volatile, maybe add avg?

    const annualSalesForecast = monthlySalesForecast * 12

    // E. Flow (This Month)
    const newEntries = allMembers.filter(m => m.joinDate >= currentMonthStart).length
    const withdrawals = await prisma.member.count({
        where: {
            isActive: false,
            updatedAt: { gte: currentMonthStart } // Approx withdrawal date
        }
    })
    const trials = await prisma.booking.count({
        where: {
            startTime: { gte: currentMonthStart, lte: currentMonthEnd },
            type: 'TRIAL'
        }
    })

    // F. Booking Breakdown
    const bookingStats = {
        total: monthlyBookings.length,
        standard: monthlyBookings.filter(b => b.member.plan === 'STANDARD' && b.type === 'REGULAR').length,
        premium: monthlyBookings.filter(b => b.member.plan === 'PREMIUM' && b.type === 'REGULAR').length,
        digitalPrepaid: monthlyBookings.filter(b => b.member.plan === 'DIGITAL_PREPAID').length,
        ticket: monthlyBookings.filter(b => b.member.plan === 'TICKET' || b.member.plan === 'TICKET_ONLY').length,
        additional: monthlyBookings.filter(b => b.type === 'ADDITIONAL').length,
        transfer: monthlyBookings.filter(b => b.type.includes('TRANSFER')).length,
    }

    const dashboardData = {
        memberStats,
        genderData,
        ageData,
        capacityData,
        financials: {
            monthly: monthlySalesForecast,
            annual: annualSalesForecast
        },
        flow: {
            newEntries,
            withdrawals,
            trials
        },
        bookingStats
    }

    return <DashboardClient data={dashboardData} />
}
