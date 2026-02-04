import { prisma } from '../src/lib/db'

async function main() {
    // 1. Update Yuji (Staff)
    // Find Staff "夏井 優志" or already "ゆうじ"
    const yujiStaff = await prisma.staff.findFirst({
        where: {
            OR: [{ name: { contains: '夏井' } }, { name: 'ゆうじ' }]
        }
    })

    // Find User Yuji (already updated to ゆうじ)
    const yujiUser = await prisma.user.findFirst({
        where: { name: 'ゆうじ' } // We updated this earlier
    })

    if (yujiStaff && yujiUser) {
        await prisma.staff.update({
            where: { id: yujiStaff.id },
            data: {
                name: 'ゆうじ',
                unitPrice: yujiUser.unitPrice || 6050
            }
        })
        console.log(`Synced Yuji Staff: Name=${yujiUser.name}, Price=${yujiUser.unitPrice}`)
    }

    // 2. Update Risa (Staff)
    const risaStaff = await prisma.staff.findFirst({
        where: {
            OR: [{ name: { contains: '莉沙' } }, { name: 'りさ' }]
        }
    })

    const risaUser = await prisma.user.findFirst({
        where: { name: 'りさ' }
    })

    if (risaStaff && risaUser) {
        await prisma.staff.update({
            where: { id: risaStaff.id },
            data: {
                name: 'りさ',
                unitPrice: risaUser.unitPrice || 4950
            }
        })
        console.log(`Synced Risa Staff: Name=${risaUser.name}, Price=${risaUser.unitPrice}`)
    }
}

main()
