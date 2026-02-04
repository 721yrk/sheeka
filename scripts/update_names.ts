import { prisma } from '../src/lib/db'

async function main() {
    // Update Yuji
    const yuji = await prisma.user.findFirst({
        where: { name: { contains: '夏井' } }
    })
    if (yuji) {
        await prisma.user.update({
            where: { id: yuji.id },
            data: { name: 'ゆうじ' }
        })
        console.log(`Updated ${yuji.name} to ゆうじ`)
    }

    // Update Risa
    const risa = await prisma.user.findFirst({
        where: { name: { contains: '莉沙' } }
    })
    if (risa) {
        await prisma.user.update({
            where: { id: risa.id },
            data: { name: 'りさ' }
        })
        console.log(`Updated ${risa.name} to りさ`)
    }
}

main()
