import { prisma } from '../src/lib/db'

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'TRAINER' },
                { name: { contains: '夏井' } },
                { name: { contains: 'Yuji' } },
                { name: { contains: 'Risa' } }
            ]
        }
    })
    console.log('Found Users:', users)
}

main()
