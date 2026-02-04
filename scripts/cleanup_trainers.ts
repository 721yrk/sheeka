import { prisma } from '../src/lib/db'

async function main() {
    // Find members with Plan NOT Standard/Premium but HAVE a trainer assigned
    const invalidMembers = await prisma.member.findMany({
        where: {
            plan: { notIn: ['STANDARD', 'PREMIUM'] },
            mainTrainerId: { not: null }
        },
        include: { mainTrainer: true }
    })

    console.log(`Found ${invalidMembers.length} invalid assignments.`)

    for (const m of invalidMembers) {
        console.log(`Clearing trainer for: ${m.name} (${m.plan}) - Was: ${m.mainTrainer?.name}`)
        await prisma.member.update({
            where: { id: m.id },
            data: {
                mainTrainerId: null,
                contractedSessions: 0 // Optional: reset sessions too if they don't apply
            }
        })
    }
}

main()
