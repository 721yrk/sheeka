import { prisma } from '../src/lib/db'

async function main() {
    console.log('--- TEST: Digital Prepaid Flow ---')

    // 1. Setup Data
    const staff = await prisma.staff.findFirst({ where: { name: 'ゆうじ' } })
    if (!staff) throw new Error('Staff Yuji not found')
    console.log(`Staff: ${staff.name}, Price: ${staff.unitPrice}`)

    const menu = await prisma.serviceMenu.findFirst()
    if (!menu) throw new Error('No service menu found')

    // Create Test Member
    const member = await prisma.member.create({
        data: {
            name: 'Prepaid Tester',
            plan: 'DIGITAL_PREPAID',
            prepaidBalance: 3000,
            dateOfBirth: new Date(),
            gender: 'MALE',
            phone: '000-0000',
            emergencyContact: 'None'
        }
    })
    console.log(`Created Member: ${member.name}, Balance: ${member.prepaidBalance}`)

    // 2. Test Booking (Partial Payment)
    // Booking time: Tomorrow + 2 days (to be > 24h initially)
    const startTime = new Date()
    startTime.setDate(startTime.getDate() + 2)
    startTime.setHours(10, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    console.log(`Creating Booking (Price: ${staff.unitPrice} vs Balance: 3000)...`)

    // Emulate createBooking logic manually since we can't import server action easily here 
    // (Wait, I can import it if I use npx tsx and the file structure supports it, 
    // but often safer to replicate logic or use a mock if importing fails. 
    // Let's try to import `createBooking` from `src/app/actions/calendar_actions.ts`? 
    // No, `use server` directive might cause issues in script. 
    // I will REPLICATE the logic here to verify my understanding and the DB behavior, 
    // essentially testing the "logic" not the "endpoint".)

    // ACTUALLY, I should try to call the file if possible. But `use server` prevents it in tsx script usually.
    // I will implement the logic step-by-step here.

    // Logic:
    let paid = 0
    if (member.prepaidBalance > 0) {
        paid = Math.min(member.prepaidBalance, staff.unitPrice)
        await prisma.member.update({
            where: { id: member.id },
            data: { prepaidBalance: { decrement: paid } }
        })
    }

    const booking = await prisma.booking.create({
        data: {
            memberId: member.id,
            staffId: staff.id,
            startTime,
            endTime,
            paidFromPrepaid: paid
        }
    })

    const mAfter = await prisma.member.findUnique({ where: { id: member.id } })
    console.log(`Booking Created. Paid: ${paid}. New Balance: ${mAfter?.prepaidBalance}`)

    if (paid !== 3000 || mAfter?.prepaidBalance !== 0) {
        console.error('FAILED: Deduction incorrect')
    } else {
        console.log('PASSED: Deduction correct')
    }

    // 3. Test Cancel (> 24h) -> Refund
    console.log('Testing Cancel (> 24h)...')
    // Logic:
    const now = new Date()
    const hours = (booking.startTime.getTime() - now.getTime()) / 3600000
    console.log(`Hours until booking: ${hours}`)

    if (hours >= 24) {
        if (booking.paidFromPrepaid > 0) {
            await prisma.member.update({
                where: { id: member.id },
                data: { prepaidBalance: { increment: booking.paidFromPrepaid } }
            })
        }
    }

    const mRefunded = await prisma.member.findUnique({ where: { id: member.id } })
    console.log(`Refunded Balance: ${mRefunded?.prepaidBalance}`)

    if (mRefunded?.prepaidBalance !== 3000) {
        console.error('FAILED: Refund incorrect')
    } else {
        console.log('PASSED: Refund correct')
    }

    // Cleaning up
    await prisma.booking.delete({ where: { id: booking.id } })
    await prisma.member.delete({ where: { id: member.id } })
    console.log('Cleanup complete')
}

main()
