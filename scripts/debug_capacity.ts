import { prisma } from '../src/lib/db'

async function main() {
    const members = await prisma.member.findMany({
        include: { mainTrainer: true }
    })

    console.log('--- Analysis for Yuji (Filter: Yuji, ゆうじ) ---')
    const yujiMembers = members.filter(m =>
        ['Yuji', 'ゆうじ'].some(k => m.mainTrainer?.name?.includes(k))
    )

    yujiMembers.forEach(m => {
        console.log(`Member: ${m.name}, Plan: ${m.plan}, Sessions: ${m.contractedSessions}, Trainer: ${m.mainTrainer?.name}`)
    })

    const total = yujiMembers.reduce((sum, m) => sum + (m.contractedSessions || 0), 0)
    console.log(`Total Slots for Yuji: ${total}`)
}

main()
